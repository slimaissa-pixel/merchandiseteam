from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.api.dependencies.deps import get_db, get_current_user
from app.models.complaint import Complaint
from app.models.user import User
from app.models.notification import Notification
from app.schemas.complaint import ComplaintCreate, ComplaintResolve, ComplaintResponse

router = APIRouter()

def _serialize(obj: Complaint) -> dict:
    return {
        "id": obj.id,
        "type": obj.type,
        "description": obj.description,
        "photo_url": obj.photo_url,
        "gms_id": obj.gms_id,
        "status": obj.status,
        "admin_response": obj.admin_response,
        "user_id": obj.user_id,
        "requester_name": f"{obj.user.first_name} {obj.user.last_name}" if obj.user else "Unknown",
        "requester_role": obj.user.role if obj.user else None,
        "created_at": obj.created_at,
    }

@router.get("/", response_model=List[ComplaintResponse])
def list_complaints(
    status: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Complaint).options(joinedload(Complaint.user))
    if current_user.role not in ["admin", "supervisor"]:
        query = query.filter(Complaint.user_id == current_user.id)
    if status:
        query = query.filter(Complaint.status == status)
    complaints = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return [ComplaintResponse(**_serialize(c)) for c in complaints]

@router.post("/", response_model=ComplaintResponse)
def create_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = Complaint(**payload.model_dump(), user_id=current_user.id)
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Notify admins
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        role_str = current_user.role.capitalize() if current_user.role else "User"
        notif = Notification(
            user_id=admin.id,
            title="New Complaint Submitted",
            message=f"{role_str} {current_user.first_name} submitted a {payload.type} complaint.",
            type="warning",
            icon="chatbubbles",
        )
        db.add(notif)
    db.commit()

    complaint = db.query(Complaint).options(joinedload(Complaint.user)).filter(Complaint.id == complaint.id).first()
    return ComplaintResponse(**_serialize(complaint))

@router.patch("/{complaint_id}/resolve", response_model=ComplaintResponse)
def resolve_complaint(
    complaint_id: int,
    payload: ComplaintResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    complaint = db.query(Complaint).options(joinedload(Complaint.user)).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = payload.status
    if payload.admin_response:
        complaint.admin_response = payload.admin_response
    if payload.status == "resolved":
        complaint.resolved_at = datetime.now(timezone.utc)
    db.commit()

    # Notify the complaint author
    notif = Notification(
        user_id=complaint.user_id,
        title=f"Complaint {payload.status.replace('_', ' ').title()}",
        message=payload.admin_response or f"Your complaint has been marked as {payload.status}.",
        type="info",
        icon="checkmark-circle" if payload.status == "resolved" else "information-circle",
    )
    db.add(notif)
    db.commit()
    db.refresh(complaint)

    return ComplaintResponse(**_serialize(complaint))
