from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.dependencies.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.core.security import get_password_hash
from app.core.image_handler import save_base64_image
from app.services import mail
from app.core.task_queue import email_queue
import base64
import os
import uuid
import sys
import os

# Add scripts directory to path to import sync_seed
sys.path.append(os.path.join(os.path.dirname(__file__), "../../../.."))
try:
    from scripts.sync_seed import sync_data_to_seed
except ImportError:
    sync_data_to_seed = lambda: None

router = APIRouter()

# Image handling is now centralized in app.core.image_handler

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_user_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = user_update.model_dump(exclude_unset=True)
    
    if current_user.role != "admin":
        update_data.pop("role", None)
        update_data.pop("email", None)
        update_data.pop("is_active", None)

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        if key == "profile_image":
            img_url = save_base64_image(value, folder="avatars")
            if img_url:
                setattr(current_user, key, img_url)
        else:
            setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/", response_model=List[UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "supervisor", "merchandiser"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(User)
    
    # Restrict merchandisers to only see their assigned supervisor
    if current_user.role == "merchandiser":
        if current_user.supervisor_id:
            query = query.filter(User.id == current_user.supervisor_id)
        else:
            # If no supervisor assigned, return none
            query = query.filter(User.id == -1)
            
    # Restrict supervisors to only see their assigned merchandisers
    elif current_user.role == "supervisor":
        query = query.filter(User.supervisor_id == current_user.id, User.role == "merchandiser")
        
    return query.offset(skip).limit(limit).all()

@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return db_user

@router.post("/", response_model=UserResponse)
def create_user(
    user: UserCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create users")
        
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    image_url = save_base64_image(user.profile_image, folder="avatars") if user.profile_image else None

    db_user = User(
        email=user.email,
        profile_image=image_url,
        first_name=user.first_name,
        last_name=user.last_name,
        hashed_password=get_password_hash(user.password),
        role=user.role,
        phone=user.phone,
        status=user.status,
        is_active=user.is_active,
        supervisor_id=user.supervisor_id,
        address=user.address,
        tags=user.tags
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    background_tasks.add_task(sync_data_to_seed)
    return db_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Not authorized to update users")

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"] != db_user.email:
        if db.query(User).filter(User.email == update_data["email"]).first():
            raise HTTPException(status_code=400, detail="Email already registered")

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    was_inactive = not db_user.is_active
    is_demo = db_user.status == "demo"

    for key, value in update_data.items():
        if key == "profile_image":
            img_url = save_base64_image(value, folder="avatars")
            if img_url:
                setattr(db_user, key, img_url)
        else:
            setattr(db_user, key, value)

    # If a previously inactive demo account is now being activated, send approval email
    if was_inactive and is_demo and db_user.is_active:
        email_queue.enqueue(mail.send_approval_email, db_user.email)

    db.commit()
    db.refresh(db_user)
    
    background_tasks.add_task(sync_data_to_seed)
    return db_user

@router.patch("/me/password")
def change_password(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    old_password = data.get("old_password")
    new_password = data.get("new_password")
    
    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="Old and new passwords are required")
        
    from app.core.security import verify_password, get_password_hash
    
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"ok": True}

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not db_user.is_active and db_user.status == "demo":
        email_queue.enqueue(mail.send_denial_email, db_user.email)

    db.delete(db_user)
    db.commit()
    
    background_tasks.add_task(sync_data_to_seed)
    return {"ok": True}
