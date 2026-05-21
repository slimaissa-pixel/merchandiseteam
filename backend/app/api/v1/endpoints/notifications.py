from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api.dependencies.deps import get_db, get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationBase, NotificationCreate, NotificationResponse

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def read_notifications(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Notification)\
        .filter(Notification.user_id == current_user.id)\
        .order_by(Notification.created_at.desc())\
        .offset(skip).limit(limit).all()

@router.get("/{notification_id}", response_model=NotificationResponse)
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification)\
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)\
        .first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification)\
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)\
        .first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.patch("/{notification_id}/unread", response_model=NotificationResponse)
def mark_as_unread(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification)\
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)\
        .first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = False
    db.commit()
    db.refresh(notification)
    return notification

@router.post("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification)\
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)\
        .update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All marked as read"}

@router.delete("/all")
def delete_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete all notifications for the current user."""
    db.query(Notification).filter(Notification.user_id == current_user.id).delete(synchronize_session=False)
    db.commit()
    return {"message": "All notifications deleted"}

@router.post("/notify-admins", response_model=List[NotificationResponse])
def notify_admins(
    notification_in: NotificationBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admins = db.query(User).filter(User.role == 'admin').all()
    created_notifications = []
    
    # Optimized: Add all then single commit
    for admin in admins:
        notification = Notification(
            user_id=admin.id,
            title=notification_in.title,
            message=notification_in.message,
            type=notification_in.type,
            icon=notification_in.icon,
            action_link=notification_in.action_link
        )
        db.add(notification)
        created_notifications.append(notification)
        
    db.commit()
    # Refresh in batch if needed, but for response, models are already in session
    return created_notifications

@router.post("/send", response_model=NotificationResponse)
@router.post("/send/", response_model=NotificationResponse)
def send_notification(
    notification_in: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = Notification(
        user_id=notification_in.user_id,
        title=notification_in.title,
        message=notification_in.message,
        type=notification_in.type,
        icon=notification_in.icon,
        action_link=notification_in.action_link
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification)\
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)\
        .first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notification)
    db.commit()
    return {"message": "Deleted"}
