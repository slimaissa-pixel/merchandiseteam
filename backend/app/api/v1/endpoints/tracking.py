import asyncio
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from jose import jwt, JWTError
from geoalchemy2.functions import ST_DWithin, ST_MakePoint, ST_SetSRID

from app.core.config import settings
from app.api.dependencies.deps import get_db, get_current_user
from app.models.user import User
from app.models.workday import Workday
from app.models.visit import Visit
from app.models.location_log import LocationLog
from app.models.gms import GMS
from app.schemas.tracking import (
    WorkdayCreate, WorkdayResponse, WorkdayUpdate,
    VisitCreate, VisitResponse, VisitUpdate,
    LocationLogCreate, Heartbeat
)
from app.core.redis_client import get_redis
from app.core.visit_intel import process_visit_intel
from app.models.leave_request import LeaveRequest
from datetime import date

router = APIRouter()

def check_active_leave(db: Session, user_id: int):
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).date()
    active_leave = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == user_id,
        LeaveRequest.status == "approved",
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date >= today
    ).first()
    if active_leave:
        raise HTTPException(
            status_code=403,
            detail="Cannot start work during approved leave period."
        )

# =========================
# WORKDAY ENDPOINTS
# =========================
@router.post("/workday/start", response_model=WorkdayResponse)
def start_workday(
    data: WorkdayCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    check_active_leave(db, current_user.id)

    if data.start_lat is None or data.start_lng is None:
        raise HTTPException(
            status_code=400,
            detail="GPS coordinates are required to start a workday."
        )


    active = db.query(Workday).filter(
        Workday.user_id == current_user.id,
        Workday.status == "active"
    ).first()
    
    if active:
        return active

    db_workday = Workday(
        user_id=current_user.id,
        start_lat=data.start_lat,
        start_lng=data.start_lng,
        status="active"
    )
    db.add(db_workday)
    db.commit()
    db.refresh(db_workday)
    return db_workday

@router.post("/workday/end", response_model=WorkdayResponse)
def end_workday(
    data: WorkdayUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):

    if data.end_lat is None or data.end_lng is None:
        raise HTTPException(
            status_code=400,
            detail="GPS coordinates are required to end a workday."
        )

    db_workday = db.query(Workday).filter(
        Workday.user_id == current_user.id,
        Workday.status == "active"
    ).first()
    
    if not db_workday:
        raise HTTPException(status_code=404, detail="No active workday found")
    
    # Validation for active visit before auto-closing
    active_visit = db.query(Visit).filter(
        Visit.workday_id == db_workday.id, 
        Visit.status == "in_progress"
    ).first()
    
    if active_visit:
        if not (active_visit.proof_before and active_visit.proof_after):
            from app.models.report import Report
            has_before = db.query(Report).filter(Report.visit_id == active_visit.id, Report.before_image.isnot(None)).first()
            has_after = db.query(Report).filter(Report.visit_id == active_visit.id, Report.after_image.isnot(None)).first()
            if not (has_before and has_after):
                raise HTTPException(
                    status_code=400,
                    detail="Cannot close session: Active visit is missing mandatory Before/After proof."
                )
            else:
                active_visit.proof_before = True
                active_visit.proof_after = True

        print(f"[Auth] Auto-closing active visit {active_visit.id} for workday end")
        active_visit.status = "completed"
        active_visit.end_time = datetime.now(timezone.utc)
        active_visit.end_lat = data.end_lat
        active_visit.end_lng = data.end_lng
        db.add(active_visit)
        
    db_workday.status = "completed"
    db_workday.end_time = datetime.now(timezone.utc)
    db_workday.end_lat = data.end_lat
    db_workday.end_lng = data.end_lng
    
    # Generate notification for admin about PDF report
    from app.models.notification import Notification
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        notif = Notification(
            user_id=admin.id,
            title="Workday Report Generated",
            message=f"Merchandiser {current_user.first_name} {current_user.last_name} has ended their workday. A PDF report has been generated and is ready for review.",
            type="info",
            icon="document-text",
            is_read=False,
            action_link=f"/api/export/workday/{db_workday.id}/pdf"
        )
        db.add(notif)
    
    db.commit()
    db.refresh(db_workday)
    return db_workday

# =========================
# VISIT ENDPOINTS
# =========================
@router.post("/visit/start", response_model=VisitResponse)
def start_visit(
    data: VisitCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    check_active_leave(db, current_user.id)

    if data.start_lat is None or data.start_lng is None:
        raise HTTPException(
            status_code=400,
            detail="GPS coordinates are required to start a visit."
        )

    db_workday = db.query(Workday).filter(
        Workday.id == data.workday_id,
        Workday.user_id == current_user.id,
        Workday.status == "active"
    ).first()
    if not db_workday:
        raise HTTPException(status_code=400, detail="Invalid or inactive workday.")

    active_visit = db.query(Visit).filter(
        Visit.workday_id == data.workday_id,
        Visit.status == "in_progress"
    ).first()
    if active_visit:
        raise HTTPException(
            status_code=400,
            detail="You must close the current visit before starting a new one."
        )

        # --- STRICT SEQUENCE ENFORCEMENT REMOVED ---
        # User wants to visit stores in any order.
        pass
    # --- END ENFORCEMENT ---

    # Removed distance check to allow starting visit from anywhere
    store_in_range = db.query(GMS).filter(GMS.id == data.gms_id).first()
    
    if not store_in_range:
        raise HTTPException(status_code=404, detail="Store not found.")

    db_visit = Visit(
        workday_id=data.workday_id,
        gms_id=data.gms_id,
        start_lat=data.start_lat,
        start_lng=data.start_lng,
        status="in_progress"
    )
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    return db_visit

@router.post("/visit/end", response_model=VisitResponse)
def end_visit(
    data: VisitUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):

    if data.end_lat is None or data.end_lng is None:
        raise HTTPException(
            status_code=400,
            detail="GPS coordinates are required to end a visit."
        )

    db_visit = db.query(Visit).join(Workday).filter(
        Visit.id == data.visit_id, 
        Workday.user_id == current_user.id, 
        Visit.status == "in_progress"
    ).first()
    
    if not db_visit:
        raise HTTPException(status_code=404, detail="No active visit found")
        
    # Validation Logic: Ensure Before and After proofs exist
    if not (db_visit.proof_before and db_visit.proof_after):
        # Fallback check in Reports table (handles existing data or edge cases)
        from app.models.report import Report
        has_before = db.query(Report).filter(Report.visit_id == db_visit.id, Report.before_image.isnot(None)).first()
        has_after = db.query(Report).filter(Report.visit_id == db_visit.id, Report.after_image.isnot(None)).first()
        
        # Fallback 2: Check by GMS and Workday in case visit_id was not linked
        if not (has_before and has_after):
            has_before = db.query(Report).filter(
                Report.workday_id == db_visit.workday_id,
                Report.gms_id == db_visit.gms_id,
                Report.before_image.isnot(None)
            ).first()
            has_after = db.query(Report).filter(
                Report.workday_id == db_visit.workday_id,
                Report.gms_id == db_visit.gms_id,
                Report.after_image.isnot(None)
            ).first()
        
        if not (has_before and has_after):
            raise HTTPException(
                status_code=400,
                detail="Before and After visit submissions are required before ending the visit."
            )
        else:
            # Sync flags if they were missing but data exists
            db_visit.proof_before = True
            db_visit.proof_after = True
        
    db_visit.status = "completed"
    db_visit.end_time = datetime.now(timezone.utc)
    db_visit.end_lat = data.end_lat
    db_visit.end_lng = data.end_lng
    
    db.commit()
    db.refresh(db_visit)
    return db_visit

# =========================
# GPS LOGS SYNC
# =========================
@router.post("/logs/sync")
async def sync_logs(
    logs: List[LocationLogCreate], 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not logs:
        return {"status": "success", "count": 0}
        
    MAX_BATCH = 1000
    if len(logs) > MAX_BATCH:
        raise HTTPException(status_code=400, detail=f"Batch too large (max {MAX_BATCH})")

    workday_ids = list({log.workday_id for log in logs})
    valid_ids = {wd.id for wd in db.query(Workday.id).filter(
        Workday.id.in_(workday_ids), 
        Workday.user_id == current_user.id
    )}

    insert_data = []
    now = datetime.now(timezone.utc)
    
    import math
    def haversine_miles(lat1, lon1, lat2, lon2):
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        return c * 3956 # Radius of earth in miles

    for log in logs:
        if log.workday_id in valid_ids:
            if log.log_type == "checkpoint":
                last_checkpoint = db.query(LocationLog).filter(
                    LocationLog.workday_id == log.workday_id,
                    LocationLog.log_type == "checkpoint"
                ).order_by(LocationLog.timestamp.desc()).first()
                
                if last_checkpoint:
                    dist = haversine_miles(log.latitude, log.longitude, last_checkpoint.latitude, last_checkpoint.longitude)
                    if dist <= 1.0:
                        raise HTTPException(status_code=400, detail="You've already Pointed On This Address!")

            mapping = log.model_dump()
            mapping["timestamp"] = now
            
            # Simple server-side activity classification if not provided
            if not mapping.get("activity") and mapping.get("speed") is not None:
                speed_kmh = mapping["speed"] * 3.6 # convert m/s to km/h
                if speed_kmh < 1: mapping["activity"] = "still"
                elif speed_kmh < 7: mapping["activity"] = "walking"
                elif speed_kmh < 15: mapping["activity"] = "running"
                elif speed_kmh < 40: mapping["activity"] = "cycling"
                else: mapping["activity"] = "driving"
                
            insert_data.append(mapping)

    if not insert_data:
        return {"status": "success", "count": 0}

    try:
        db.bulk_insert_mappings(LocationLog, insert_data)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    latest = insert_data[-1]
    message = {
        "type": "location_update",
        "user_id": current_user.id,
        "name": f"{current_user.first_name} {current_user.last_name}",
        "latitude": latest["latitude"],
        "longitude": latest["longitude"],
        "timestamp": now.isoformat()
    }
    
    try:
        redis = await get_redis()
        if redis:
            await redis.publish("live_location:all", json.dumps(message))
            # Publish to supervisor channel if assigned
            if current_user.supervisor_id:
                await redis.publish(f"live_location:{current_user.supervisor_id}", json.dumps(message))
                
        # Trigger Visit Intelligence
        workday = db.query(Workday).filter(Workday.id == latest["workday_id"]).first()
        if workday:
            process_visit_intel(db, workday, latest["latitude"], latest["longitude"])
            
    except Exception as e:
        # Redis/Intel are optional -- GPS sync must NEVER fail because of it
        print(f"[Tracking] Warning: Failed post-sync logic: {e}")
        
    return {"status": "success", "count": len(insert_data)}


# =========================
# ACTIVE SESSION
# =========================
@router.get("/active-session")
def get_active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return the current user's active workday and visit (if any)."""
    workday = db.query(Workday).filter(
        Workday.user_id == current_user.id,
        Workday.status == "active"
    ).first()

    if not workday:
        return {"workday": None, "visit": None}

    active_visit = db.query(Visit).filter(
        Visit.workday_id == workday.id,
        Visit.status == "in_progress"
    ).first()

    completed_visits = db.query(Visit.gms_id).filter(
        Visit.workday_id == workday.id,
        Visit.status == "completed"
    ).all()
    completed_gms_ids = [v[0] for v in completed_visits]

    workday_data = {
        "id": workday.id,
        "start_time": workday.start_time.isoformat(),
        "start_lat": workday.start_lat,
        "start_lng": workday.start_lng,
        "status": workday.status,
        "completed_gms_ids": completed_gms_ids
    }

    visit_data = None
    if active_visit:
        # Fallback verification in case flags are out of sync
        if not active_visit.proof_before or not active_visit.proof_after:
            from app.models.report import Report
            has_before = db.query(Report).filter(Report.visit_id == active_visit.id, Report.before_image.isnot(None)).first()
            has_after = db.query(Report).filter(Report.visit_id == active_visit.id, Report.after_image.isnot(None)).first()
            
            # Fallback 2: Check by GMS and Workday in case visit_id was not linked
            if not (has_before and has_after):
                has_before = db.query(Report).filter(
                    Report.workday_id == active_visit.workday_id,
                    Report.gms_id == active_visit.gms_id,
                    Report.before_image.isnot(None)
                ).first()
                has_after = db.query(Report).filter(
                    Report.workday_id == active_visit.workday_id,
                    Report.gms_id == active_visit.gms_id,
                    Report.after_image.isnot(None)
                ).first()
                
            if has_before: active_visit.proof_before = True
            if has_after: active_visit.proof_after = True
            if has_before or has_after:
                db.commit()

        store = db.query(GMS).filter(GMS.id == active_visit.gms_id).first()
        visit_data = {
            "id": active_visit.id,
            "gms_id": active_visit.gms_id,
            "gms_name": store.name if store else "Unknown",
            "start_time": active_visit.start_time.isoformat(),
            "start_lat": active_visit.start_lat,
            "start_lng": active_visit.start_lng,
            "status": active_visit.status,
            "proof_before": active_visit.proof_before,
            "proof_after": active_visit.proof_after,
        }

    return {"workday": workday_data, "visit": visit_data}


# =========================
# HEARTBEAT
# =========================
@router.post("/heartbeat")
def heartbeat(
    data: Heartbeat,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Called periodically by the app to signal GPS is still active."""
    workday = db.query(Workday).filter(
        Workday.user_id == current_user.id,
        Workday.status == "active"
    ).first()

    if not workday:
        return {"status": "no_active_workday"}

    workday.last_seen_at = datetime.now(timezone.utc)
    workday.last_lat = data.latitude
    workday.last_lng = data.longitude
    workday.current_activity = data.activity
    workday.battery_level = data.battery_level
    workday.is_mock_location = bool(data.is_mock)
    
    # Trigger Visit Intelligence
    try:
        process_visit_intel(db, workday, data.latitude, data.longitude)
    except Exception as e:
        print(f"[Heartbeat] Intel error: {e}")
        
    db.commit()
    return {"status": "ok", "workday_id": workday.id}


# =========================
# WEBSOCKET
# =========================
@router.websocket("/ws/live-location")

async def websocket_live(
    ws: WebSocket, 
    token: str = Query(...), 
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        await ws.close(code=1008)
        return

    user = db.query(User).filter(User.email == email).first()
    if not user:
        await ws.close(code=1008)
        return

    await ws.accept()
    redis = await get_redis()
    pubsub = redis.pubsub()
    
    # Only supervisors or admins receive broadcasts
    channel_name = f"live_location:{user.id}" if user.role == "supervisor" else "live_location:all"
    
    if user.role in ["supervisor", "admin"]:
        await pubsub.subscribe(channel_name)
    else:
        # Merchandisers can send data
        pass

    async def listen_redis():
        if user.role in ["supervisor", "admin"]:
            try:
                async for message in pubsub.listen():
                    if message["type"] == "message":
                        data = message["data"]
                        await ws.send_text(data)
            except Exception:
                pass

    listen_task = asyncio.create_task(listen_redis())

    try:
        while True:
            data = await ws.receive_text()
            if user.role == "merchandiser":
                 # Fallback: if merchandiser sends directly via WS instead of POST /logs/sync
                 try:
                     parsed = json.loads(data)
                     parsed["user_id"] = user.id
                     parsed["name"] = f"{user.first_name} {user.last_name}"
                     
                     await redis.publish("live_location:all", json.dumps(parsed))
                     for assignment in getattr(user, 'assignments', []):
                         if hasattr(assignment, 'gms') and assignment.gms and getattr(assignment.gms, "supervisor_id", None):
                             await redis.publish(f"live_location:{assignment.gms.supervisor_id}", json.dumps(parsed))
                 except json.JSONDecodeError:
                     pass
                     
    except WebSocketDisconnect:
        pass
    finally:
        listen_task.cancel()
        if user.role in ["supervisor", "admin"]:
            await pubsub.unsubscribe(channel_name)

# =========================
# TEAM LIVE COMPLIANCE
# =========================
from app.models.assignment import GMSAssignment

@router.get("/team/live")
def get_live_team_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["supervisor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if current_user.role == "supervisor":
        merchandisers = db.query(User).filter(User.role == "merchandiser", User.supervisor_id == current_user.id).all()
    else:
        merchandisers = db.query(User).filter(User.role == "merchandiser").all()

    results = []
    now = datetime.now(timezone.utc)
    
    for merch in merchandisers:
        # Get active workday if any
        wd = db.query(Workday).filter(
            Workday.user_id == merch.id,
            Workday.status == "active"
        ).first()
        
        wd_data = None
        active_visit_data = None
        
        if wd:
            # duration calculation
            # SQLite datetime handles mapping to python, so wd.start_time is a datetime object
            if wd.start_time.tzinfo is None:
                start_dt = wd.start_time.replace(tzinfo=timezone.utc)
            else:
                start_dt = wd.start_time
            duration_mins = int((now - start_dt).total_seconds() / 60)
            
            wd_data = {
                "id": wd.id,
                "status": wd.status,
                "start_time": wd.start_time.isoformat(),
                "duration_minutes": duration_mins,
                "last_lat": wd.last_lat,
                "last_lng": wd.last_lng,
                "last_seen_at": wd.last_seen_at.isoformat() if wd.last_seen_at else None,
                "activity": wd.current_activity,
                "battery_level": wd.battery_level,
                "is_mock": bool(wd.is_mock_location)
            }
            
            active_visit = db.query(Visit).filter(
                Visit.workday_id == wd.id,
                Visit.status == "in_progress"
            ).first()
            
            if active_visit:
                store = db.query(GMS).filter(GMS.id == active_visit.gms_id).first()
                if active_visit.start_time.tzinfo is None:
                    v_start_dt = active_visit.start_time.replace(tzinfo=timezone.utc)
                else:
                    v_start_dt = active_visit.start_time
                v_duration = int((now - v_start_dt).total_seconds() / 60)
                
                active_visit_data = {
                    "store_id": store.id if store else None,
                    "store_name": store.name if store else "Unknown",
                    "duration_minutes": v_duration
                }
        
        # Count visits today
        # Just simple tracking
        completed_visits = db.query(Visit).join(Workday).filter(
            Workday.user_id == merch.id,
            Visit.status == "completed"
        ).count()
        
        planned_visits = db.query(GMSAssignment).filter(
            GMSAssignment.user_id == merch.id
        ).count()
        # if not planned, let's use a dummy logic: they are just assigned completely to a store
        
        # The latest location point if any
        latest_log = db.query(LocationLog).join(Workday).filter(
            Workday.user_id == merch.id
        ).order_by(LocationLog.timestamp.desc()).first()
        
        last_seen = None
        if latest_log:
            last_seen = latest_log.timestamp.isoformat()
            
        # Check active leave
        today = now.date()
        active_leave = db.query(LeaveRequest).filter(
            LeaveRequest.user_id == merch.id,
            LeaveRequest.status == "approved",
            LeaveRequest.start_date <= today,
            LeaveRequest.end_date >= today
        ).first()

        results.append({
            "merchandiser": {
                "id": merch.id,
                "name": f"{merch.first_name} {merch.last_name}",
                "email": merch.email,
                "profile_image": merch.profile_image
            },
            "workday": wd_data,
            "active_visit": active_visit_data,
            "visits_completed": completed_visits,
            "visits_planned": planned_visits or 1,
            "last_seen": last_seen,
            "on_leave": bool(active_leave),
            "leave_type": active_leave.leave_type if active_leave else None
        })
        
    return results

# =========================
# GPS HISTORY FOR ADMIN
# =========================
@router.get("/history/{user_id}")
def get_user_gps_history(
    user_id: int,
    date: str = Query(None, description="Format YYYY-MM-DD. Defaults to today."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["supervisor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    target_date = datetime.utcnow().date()
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
            
    # Find workdays for this user on this date
    # We compare the start_time casted to date
    workdays = db.query(Workday).filter(
        Workday.user_id == user_id,
        func.date(Workday.start_time) == target_date
    ).all()
    
    if not workdays:
        return {"logs": [], "visits": [], "workdays": []}
        
    workday_ids = [w.id for w in workdays]
    
    # Get all location logs for these workdays
    logs = db.query(LocationLog).filter(
        LocationLog.workday_id.in_(workday_ids)
    ).order_by(LocationLog.timestamp.asc()).all()
    
    # Get all visits for these workdays
    visits = db.query(Visit).filter(
        Visit.workday_id.in_(workday_ids)
    ).all()
    
    # Enrich visits with store names
    visit_data = []
    for v in visits:
        store = db.query(GMS).filter(GMS.id == v.gms_id).first()
        visit_data.append({
            "id": v.id,
            "gms_name": store.name if store else f"Store #{v.gms_id}",
            "start_time": v.start_time.isoformat() if v.start_time else None,
            "end_time": v.end_time.isoformat() if v.end_time else None,
            "start_lat": v.start_lat,
            "start_lng": v.start_lng,
            "end_lat": v.end_lat,
            "end_lng": v.end_lng,
            "status": v.status
        })
        
    log_data = [{
        "latitude": log.latitude,
        "longitude": log.longitude,
        "timestamp": log.timestamp.isoformat(),
        "log_type": log.log_type
    } for log in logs]
    
    wd_data = [{
        "id": w.id,
        "start_time": w.start_time.isoformat() if w.start_time else None,
        "end_time": w.end_time.isoformat() if w.end_time else None,
        "start_lat": w.start_lat,
        "start_lng": w.start_lng,
        "end_lat": w.end_lat,
        "end_lng": w.end_lng,
        "status": w.status
    } for w in workdays]
    
    return {
        "logs": log_data,
        "visits": visit_data,
        "workdays": wd_data
    }

# =========================
# ALL TEAM VISITS (FOR LOGS)
# =========================
@router.get("/visits")
def get_all_team_visits(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["supervisor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(Visit).join(Workday, Visit.workday_id == Workday.id).join(User, Workday.user_id == User.id)
    
    if current_user.role == "supervisor":
        query = query.filter(User.supervisor_id == current_user.id)
        
    visits = query.order_by(Visit.start_time.desc()).offset(skip).limit(limit).all()
    
    results = []
    for v in visits:
        # Calculate duration
        duration = "---"
        if v.start_time and v.end_time:
            diff = v.end_time - v.start_time
            mins = int(diff.total_seconds() // 60)
            duration = f"{mins}m"
        elif v.start_time:
            diff = datetime.now(timezone.utc) - v.start_time
            mins = int(diff.total_seconds() // 60)
            duration = f"{mins}m+"

        # Calculate execution (e.g., reports count vs expected?)
        # For now, let's just use reports count as a metric
        reports_count = len(v.reports)
        execution = "0%"
        if v.status == "completed":
            execution = "100%" if reports_count > 0 else "50%"
        elif v.status == "in_progress":
            execution = "In Progress"

        results.append({
            "id": str(v.id),
            "agent": f"{v.workday.user.first_name} {v.workday.user.last_name}",
            "store": v.gms.name if v.gms else "Unknown Store",
            "status": v.status,
            "start": v.start_time.strftime("%I:%M %p") if v.start_time else "---",
            "end": v.end_time.strftime("%I:%M %p") if v.end_time else "---",
            "duration": duration,
            "execution": execution,
            "reports_count": reports_count
        })
        
    return results

# =========================
# TEAM ATTENDANCE (FOR LOGS)
# =========================
@router.get("/attendance")
def get_team_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["supervisor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Get all merchandisers supervised by this user
    merchandisers = db.query(User).filter(
        User.role == "merchandiser", 
        User.supervisor_id == current_user.id
    ).all()
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    results = []
    for m in merchandisers:
        # Get latest workday for today
        workday = db.query(Workday).filter(
            Workday.user_id == m.id,
            Workday.start_time >= today_start
        ).order_by(Workday.start_time.desc()).first()
        
        status = "not_started"
        start_time = "---"
        end_time = "---"
        progress = 0.0
        
        if workday:
            status = "started" if workday.status == "active" else "finished"
            start_time = workday.start_time.strftime("%I:%M %p")
            if workday.end_time:
                end_time = workday.end_time.strftime("%I:%M %p")
            
            # Calculate progress: completed visits vs assigned stores
            completed = db.query(Visit).filter(
                Visit.workday_id == workday.id,
                Visit.status == "completed"
            ).count()
            
            planned = db.query(GMSAssignment).filter(
                GMSAssignment.user_id == m.id
            ).count()
            
            if progress > 1.0: progress = 1.0

        # Check active leave
        today = now.date()
        active_leave = db.query(LeaveRequest).filter(
            LeaveRequest.user_id == m.id,
            LeaveRequest.status == "approved",
            LeaveRequest.start_date <= today,
            LeaveRequest.end_date >= today
        ).first()
        
        if active_leave:
            status = "on_leave"

        results.append({
            "id": str(m.id),
            "name": f"{m.first_name} {m.last_name}",
            "status": status,
            "startTime": start_time,
            "endTime": end_time,
            "progress": progress,
            "leave_type": active_leave.leave_type if active_leave else None
        })
        
    return results

# =========================
# TEAM PERFORMANCE (FOR LOGS)
# =========================
from app.models.report import Report

@router.get("/performance")
def get_team_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["supervisor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    merchandisers = db.query(User).filter(
        User.role == "merchandiser", 
        User.supervisor_id == current_user.id
    ).all()
    
    results = []
    total_reports_global = 0
    total_completion_global = 0
    total_time_seconds = 0
    visit_count = 0
    
    for m in merchandisers:
        # Total reports count
        reports_count = db.query(Report).filter(Report.user_id == m.id).count()
        total_reports_global += reports_count
        
        # Visits analytics
        all_visits = db.query(Visit).join(Workday).filter(
            Workday.user_id == m.id,
            Visit.status == "completed"
        ).all()
        
        avg_time_str = "---"
        m_completion = 0
        
        if all_visits:
            times = []
            for v in all_visits:
                if v.start_time and v.end_time:
                    diff = v.end_time - v.start_time
                    times.append(diff.total_seconds())
                    total_time_seconds += diff.total_seconds()
                    visit_count += 1
            
            if times:
                avg_secs = sum(times) / len(times)
                avg_time_str = f"{int(avg_secs // 60)}m"
            
            # Completion vs Assigned
            planned = db.query(GMSAssignment).filter(GMSAssignment.user_id == m.id).count()
            if planned > 0:
                m_completion = int((len(all_visits) / planned) * 100)
                if m_completion > 100: m_completion = 100
                total_completion_global += m_completion
            else:
                total_completion_global += 100
                m_completion = 100

        results.append({
            "id": str(m.id),
            "name": f"{m.first_name} {m.last_name}",
            "reports": reports_count,
            "avgTime": avg_time_str,
            "completion": m_completion,
            "rank": 0 # Placeholder
        })
    
    # Sort by completion and reports to get rank
    results.sort(key=lambda x: (x["completion"], x["reports"]), reverse=True)
    for i, res in enumerate(results):
        res["rank"] = i + 1
        
    # Global Summary
    avg_comp = int(total_completion_global / len(merchandisers)) if merchandisers else 0
    avg_visit_time = "---"
    if visit_count > 0:
        avg_global_secs = total_time_seconds / visit_count
        avg_visit_time = f"{int(avg_global_secs // 60)}m"
        
    return {
        "leaderboard": results,
        "summary": {
            "avgCompletion": avg_comp,
            "totalReports": total_reports_global,
            "avgVisitTime": avg_visit_time
        }
    }

# =========================
# TEAM EXCEPTIONS (ALERTS)
# =========================
@router.get("/exceptions")
def get_team_exceptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["supervisor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    from datetime import timezone
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get all merchandisers supervised by this user
    merchandisers = db.query(User).filter(
        User.role == "merchandiser", 
        User.supervisor_id == current_user.id
    ).all()
    m_ids = [m.id for m in merchandisers]
    
    # Fetch reports that are 'anomalies' or 'stock-issues' from today
    exceptions = db.query(Report).filter(
        Report.user_id.in_(m_ids),
        Report.created_at >= today_start,
        Report.type.in_(["anomaly", "stock-issue", "rupture-stock"])
    ).order_by(Report.created_at.desc()).all()
    
    results = []
    for exc in exceptions:
        results.append({
            "id": str(exc.id),
            "title": exc.type.replace("-", " ").title(),
            "desc": exc.description or "No description provided",
            "agent": f"{exc.user.first_name} {exc.user.last_name}",
            "store": exc.store_name or "Unknown Store",
            "time": exc.created_at.strftime("%I:%M %p"),
            "type": exc.type,
            "status": exc.status
        })
        
    return results

# =========================
# GPS ALERT (DISABLED)
# =========================
@router.post("/gps-alert")
def gps_disabled_alert(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Called by the mobile app when the user disables GPS permissions."""
    from app.models.notification import Notification

    # Find the user's supervisor
    supervisor_id = current_user.supervisor_id

    # Create notifications for admins and supervisor
    admins = db.query(User).filter(User.role == "admin").all()
    notify_ids = [admin.id for admin in admins]
    if supervisor_id and supervisor_id not in notify_ids:
        notify_ids.append(supervisor_id)

    for uid in notify_ids:
        notif = Notification(
            user_id=uid,
            title="CRITICAL: GPS Disabled",
            message=f"Merchandiser {current_user.first_name} {current_user.last_name} has disabled their GPS tracking.",
            type="alert",
            icon="warning"
        )
        db.add(notif)
    
    db.commit()
    return {"status": "alert_sent"}
