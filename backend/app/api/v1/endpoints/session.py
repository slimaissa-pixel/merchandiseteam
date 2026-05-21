from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import math

from app.api.dependencies.deps import get_db, get_current_user
from app.models.user import User
from app.models.session import WorkSession, Checkpoint, SessionReport
from app.schemas.session import (
    WorkSessionCreate, WorkSessionResponse, WorkSessionEnd,
    CheckpointCreate, CheckpointResponse, SessionReportResponse
)

router = APIRouter()

def distance_between(lat1, lon1, lat2, lon2):
    """Haversine formula for distance in km"""
    if None in [lat1, lon1, lat2, lon2]: return 0
    R = 6371
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi/2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("/start", response_model=WorkSessionResponse)
def start_session(
    data: WorkSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can manage sessions")

    merchandiser = db.query(User).filter(User.id == data.merchandiser_id).first()
    if not merchandiser or merchandiser.role != "merchandiser":
        raise HTTPException(status_code=400, detail="Invalid merchandiser")

    # Check if merchandiser is on approved leave
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).date()
    active_leave = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == data.merchandiser_id,
        LeaveRequest.status == "approved",
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date >= today
    ).first()
    if active_leave:
        raise HTTPException(
            status_code=403,
            detail="Cannot start work during approved leave period."
        )

    active_session = db.query(WorkSession).filter(
        WorkSession.merchandiser_id == data.merchandiser_id,
        WorkSession.status == "active"
    ).first()
    if active_session:
        raise HTTPException(status_code=400, detail="Merchandiser already has an active session")

    new_session = WorkSession(
        supervisor_id=current_user.id,
        merchandiser_id=data.merchandiser_id,
        start_lat=data.start_lat,
        start_lng=data.start_lng,
        status="active"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.post("/{session_id}/checkpoint", response_model=CheckpointResponse)
def add_checkpoint(
    session_id: int,
    data: CheckpointCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can add checkpoints")

    session = db.query(WorkSession).filter(
        WorkSession.id == session_id,
        WorkSession.supervisor_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    new_checkpoint = Checkpoint(
        session_id=session.id,
        lat=data.lat,
        lng=data.lng,
        note=data.note,
        image_url=data.image_url
    )
    db.add(new_checkpoint)
    db.commit()
    db.refresh(new_checkpoint)
    return new_checkpoint


@router.post("/{session_id}/end", response_model=WorkSessionResponse)
def end_session(
    session_id: int,
    data: WorkSessionEnd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can end sessions")

    session = db.query(WorkSession).filter(
        WorkSession.id == session_id,
        WorkSession.supervisor_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is already ended")

    session.status = "completed"
    session.end_time = datetime.now(timezone.utc)
    session.end_lat = data.end_lat
    session.end_lng = data.end_lng
    
    # Generate Report Data
    duration_secs = (session.end_time - session.start_time).total_seconds()
    hrs = int(duration_secs // 3600)
    mins = int((duration_secs % 3600) // 60)
    
    checkpoints = db.query(Checkpoint).filter(Checkpoint.session_id == session.id).order_by(Checkpoint.timestamp).all()
    
    anomalies = []
    total_distance_km = 0
    last_pt = (session.start_lat, session.start_lng)
    
    checkpoint_data = []
    for cp in checkpoints:
        dist = distance_between(last_pt[0], last_pt[1], cp.lat, cp.lng)
        total_distance_km += dist
        last_pt = (cp.lat, cp.lng)
        
        checkpoint_data.append({
            "timestamp": cp.timestamp.isoformat(),
            "location": f"{cp.lat},{cp.lng}",
            "note": cp.note,
            "image": cp.image_url
        })
        
    if last_pt[0] and session.end_lat:
        total_distance_km += distance_between(last_pt[0], last_pt[1], session.end_lat, session.end_lng)

    report_data = {
        "merchandiser": {
            "id": session.merchandiser.id,
            "name": f"{session.merchandiser.first_name} {session.merchandiser.last_name}",
            "email": session.merchandiser.email
        },
        "supervisor": {
            "id": session.supervisor.id,
            "name": f"{session.supervisor.first_name} {session.supervisor.last_name}"
        },
        "session_summary": {
            "start_time": session.start_time.isoformat(),
            "end_time": session.end_time.isoformat(),
            "duration": f"{hrs}h {mins}m",
            "start_location": f"{session.start_lat},{session.start_lng}",
            "end_location": f"{session.end_lat},{session.end_lng}",
            "approximate_distance_km": round(total_distance_km, 2)
        },
        "checkpoints": checkpoint_data,
        "metrics": {
            "total_checkpoints": len(checkpoints),
            "anomalies": anomalies
        }
    }

    report = SessionReport(
        session_id=session.id,
        report_data=report_data
    )
    db.add(report)
    db.commit()
    db.refresh(session)
    return session

@router.get("/active", response_model=list[WorkSessionResponse])
def get_active_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can view sessions")

    return db.query(WorkSession).filter(
        WorkSession.supervisor_id == current_user.id,
        WorkSession.status == "active"
    ).all()

@router.get("/{session_id}/report", response_model=SessionReportResponse)
def get_session_report(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(SessionReport).filter(SessionReport.session_id == session_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # ✅ FIXED: Only the owning supervisor or an admin can access this report
    session = db.query(WorkSession).filter(WorkSession.id == session_id).first()
    if current_user.role != "admin":
        if not session or session.supervisor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this session report."
            )

    return report

