from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.api.dependencies.deps import get_db, get_current_user
from app.models.report import Report
from app.models.user import User
from app.models.notification import Notification
from app.models.workday import Workday
from app.models.visit import Visit
from app.schemas.report import ReportCreate, ReportResponse, VisitFullReport

from app.core.image_handler import save_base64_image

router = APIRouter()

@router.post("/", response_model=ReportResponse)
def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Process images from base64 to permanent files
    before_url = save_base64_image(report.before_image, folder="reports")
    after_url = save_base64_image(report.after_image, folder="reports")

    db_report = Report(
        name=report.name,
        notes=report.notes,
        type=report.type,
        status=report.status,
        visits_planned=report.visits_planned,
        visits_completed=report.visits_completed,
        before_image=before_url,
        after_image=after_url,
        user_id=current_user.id,
        gms_id=report.gms_id,
        workday_id=report.workday_id,
        report_metadata=report.report_metadata
    )
    
    # Automatically link to active workday and visit if they exist
    if report.visit_id:
        db_report.visit_id = report.visit_id
        active_visit = db.query(Visit).filter(Visit.id == report.visit_id).first()
        if active_visit:
            if not db_report.gms_id:
                db_report.gms_id = active_visit.gms_id
            if not db_report.workday_id:
                db_report.workday_id = active_visit.workday_id
            
            # Update Visit proof status instantly
            if db_report.type == "Before/After":
                if db_report.before_image:
                    active_visit.proof_before = True
                if db_report.after_image:
                    active_visit.proof_after = True
                db.add(active_visit)
    else:
        active_session = db.query(Workday).filter(
            Workday.user_id == current_user.id,
            Workday.status == "active"
        ).first()
        
        if active_session:
            db_report.workday_id = active_session.id
            
            # 1. Search for in_progress visit
            active_visit = db.query(Visit).filter(
                Visit.workday_id == active_session.id,
                Visit.status == "in_progress"
            ).first()
            
            # 2. If not found, try by report's gms_id
            if not active_visit and report.gms_id:
                active_visit = db.query(Visit).filter(
                    Visit.workday_id == active_session.id,
                    Visit.gms_id == report.gms_id
                ).order_by(Visit.created_at.desc()).first()
                
            # 3. Safe Fallback: Search for the most recent visit of this workday
            if not active_visit:
                active_visit = db.query(Visit).filter(
                    Visit.workday_id == active_session.id
                ).order_by(Visit.created_at.desc()).first()
            
            if active_visit:
                db_report.visit_id = active_visit.id
                if not db_report.gms_id:
                    db_report.gms_id = active_visit.gms_id
                
                # Update Visit proof status instantly
                if db_report.type == "Before/After":
                    if db_report.before_image:
                        active_visit.proof_before = True
                    if db_report.after_image:
                        active_visit.proof_after = True
                    db.add(active_visit)

    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    # Optimized notification broadcast
    admins = db.query(User).filter(User.role.in_(['admin', 'supervisor'])).all()
    for user in admins:
        if user.id != current_user.id:
            role_str = current_user.role.capitalize() if current_user.role else "User"
            title = "⚠️ Store Anomaly Alert" if db_report.type == "anomaly" else "New Field Report"
            msg = f"URGENT: {role_str} {current_user.first_name} reported an issue: {db_report.name}" if db_report.type == "anomaly" else f"{role_str} {current_user.first_name} submitted a report for '{db_report.name}'"
            
            db.add(Notification(
                user_id=user.id,
                title=title,
                message=msg,
                type="warning" if db_report.type == "anomaly" else "info",
                icon="alert-circle" if db_report.type == "anomaly" else "document-text",
                action_link=f"/admin/before-after?id={db_report.id}"
            ))
    db.commit()

    # Eager load user and gms for the response
    db_report = db.query(Report).options(
        joinedload(Report.user),
        joinedload(Report.gms)
    ).filter(Report.id == db_report.id).first()
    
    return db_report

@router.get("/", response_model=List[ReportResponse])
def read_reports(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Performance: joinedload to fix N+1
    query = db.query(Report).options(
        joinedload(Report.user),
        joinedload(Report.gms)
    )
    
    if current_user.role not in ['admin', 'supervisor']:
        query = query.filter(Report.user_id == current_user.id)
        
    reports = query.order_by(Report.created_at.desc()).offset(skip).limit(limit).all()
    return reports

@router.get("/{report_id}", response_model=ReportResponse)
def read_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).options(
        joinedload(Report.user),
        joinedload(Report.gms)
    ).filter(Report.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if current_user.role not in ['admin', 'supervisor'] and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return report

@router.patch("/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: int,
    status: str,
    rejection_reason: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'supervisor']:
        raise HTTPException(status_code=403, detail="Only admins/supervisors can validate")
    
    db_report = db.query(Report).options(joinedload(Report.user)).filter(Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db_report.status = status
    if rejection_reason:
        db_report.rejection_reason = rejection_reason
    
    # Notify merchandiser
    db.add(Notification(
        user_id=db_report.user_id,
        title=f"Report {status.capitalize()}",
        message=f"Your report '{db_report.name}' has been {status}.",
        type="info" if status == "approved" else "warning",
        icon="checkmark-circle" if status == "approved" else "close-circle"
    ))
    db.commit()
    db.refresh(db_report)
    
    return db_report

@router.get("/visit/{visit_id}/full", response_model=VisitFullReport)
def get_visit_full_report(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'supervisor']:
        raise HTTPException(status_code=403, detail="Not authorized")

    visit = db.query(Visit).options(
        joinedload(Visit.gms),
        joinedload(Visit.workday).joinedload(Workday.user)
    ).filter(Visit.id == visit_id).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    from app.models.event import Event
    events = db.query(Event).filter(Event.visit_id == visit_id).order_by(Event.created_at.asc()).all()
    reports = db.query(Report).filter(Report.visit_id == visit_id).all()

    # 1. Timeline
    timeline = []
    # Start visit
    timeline.append({
        "id": "start",
        "type": "system",
        "timestamp": visit.start_time,
        "title": "Visit Started",
        "description": f"Checked in at {visit.gms.name}",
        "payload": {"lat": visit.start_lat, "lng": visit.start_lng}
    })

    # Events
    for e in events:
        timeline.append({
            "id": e.id,
            "type": e.type,
            "timestamp": e.created_at,
            "title": e.type,
            "description": e.payload.get("notes") or e.payload.get("description"),
            "payload": e.payload
        })

    # Reports (Before/After etc)
    for r in reports:
        timeline.append({
            "id": f"rep-{r.id}",
            "type": r.type,
            "timestamp": r.created_at,
            "title": f"Report: {r.name}",
            "description": r.notes,
            "payload": {"before": r.before_image, "after": r.after_image, "metadata": r.report_metadata},
            "status": r.status
        })

    # End visit
    if visit.end_time:
        timeline.append({
            "id": "end",
            "type": "system",
            "timestamp": visit.end_time,
            "title": "Visit Completed",
            "description": "Final check-out performed",
            "payload": {"lat": visit.end_lat, "lng": visit.end_lng}
        })

    timeline.sort(key=lambda x: x["timestamp"])

    # 2. Gallery & Specialized Sections
    gallery = []
    anomalies = []
    before_after = []
    ai_analysis = []

    for r in reports:
        if r.before_image:
            gallery.append({"url": r.before_image, "category": "Before", "timestamp": r.created_at})
        if r.after_image:
            gallery.append({"url": r.after_image, "category": "After", "timestamp": r.created_at})
        
        if r.type == "Before/After":
            before_after.append({
                "before": r.before_image,
                "after": r.after_image,
                "notes": r.notes,
                "timestamp": r.created_at,
                "metadata": r.report_metadata
            })
        elif r.type == "anomaly":
            anomalies.append({
                "image": r.before_image,
                "title": r.name,
                "notes": r.notes,
                "timestamp": r.created_at,
                "severity": r.report_metadata.get("severity", "medium") if r.report_metadata else "medium"
            })

    for e in events:
        # Extract images from payload
        img = e.payload.get("image") or e.payload.get("photo") or e.payload.get("photo_url")
        if img:
            gallery.append({"url": img, "category": e.type, "timestamp": e.created_at})
        
        # Specialized types
        if e.type == "AI Detection":
            ai_analysis.append({
                "image": img,
                "results": e.payload.get("results"),
                "timestamp": e.created_at
            })

    # 3. Analytics
    duration = None
    if visit.end_time:
        duration = int((visit.end_time - visit.start_time).total_seconds() / 60)
    
    task_count = len(events) + len(reports)
    completion_rate = min(100, (task_count / 3) * 100) # Simple metric for now
    
    return {
        "visit_id": visit.id,
        "merchandiser": {
            "id": visit.workday.user.id,
            "name": f"{visit.workday.user.first_name} {visit.workday.user.last_name}",
            "avatar": visit.workday.user.profile_image
        },
        "store": {
            "id": visit.gms.id,
            "name": visit.gms.name,
            "city": visit.gms.city,
            "address": visit.gms.address
        },
        "start_time": visit.start_time,
        "end_time": visit.end_time,
        "duration_minutes": duration,
        "status": visit.status,
        "timeline": timeline,
        "gallery": gallery,
        "anomalies": anomalies,
        "before_after": before_after,
        "ai_analysis": ai_analysis,
        "compliance_score": 85.0 if task_count > 2 else 40.0,
        "task_completion_rate": completion_rate,
        "performance_summary": "High quality visit with proper AI validation." if task_count > 2 else "Visit requires more details."
    }

