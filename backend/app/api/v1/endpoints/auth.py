from datetime import timedelta
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.dependencies.deps import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserResponse
from app.core.rate_limit import limiter
from app.services.mail import send_demo_received_email
from pydantic import BaseModel
import secrets
import string

class DemoRequest(BaseModel):
    email: str

router = APIRouter()

@router.post("/token", response_model=Token)
@limiter.limit("100/minute")
def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserResponse)
@limiter.limit("100/minute")
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        hashed_password=hashed_password,
        role=user.role,
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    from app.models.notification import Notification
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        notif = Notification(
            user_id=admin.id,
            title="New User Registration",
            message=f"New user {user.first_name} {user.last_name} ({user.role}) has registered.",
            type="alert"
        )
        db.add(notif)
    db.commit()
    
    return db_user

@router.post("/demo-request")
def request_demo(request: Request, payload: DemoRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == payload.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="This email is already registered.")

    # Generate a random 12-char secure password since they can't set it yet
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    random_password = ''.join(secrets.choice(alphabet) for _ in range(12))
    
    db_user = User(
        email=payload.email,
        first_name="Demo",
        last_name="Requester",
        hashed_password=get_password_hash(random_password),
        role="admin",        # Typically they request an admin demo
        is_active=False,     # MUST be approved
        status="demo",       # Tagged for the approval flow
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send instant confirmation email in the background
    background_tasks.add_task(send_demo_received_email, payload.email)
    
    return {"message": "Demo request logged. We'll email you when approved! Stay Tuned.."}


class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    from datetime import datetime, timezone, timedelta
    from app.models.password_reset import PasswordReset
    from app.services.mail import send_password_reset_email

    user = db.query(User).filter(User.email == payload.email).first()
    # Always return 200 to avoid email enumeration
    if not user:
        return {"message": "If that email exists, a reset link has been sent."}

    # Invalidate any existing unused tokens
    db.query(PasswordReset).filter(
        PasswordReset.user_id == user.id,
        PasswordReset.used == False
    ).update({"used": True}, synchronize_session=False)

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    reset_entry = PasswordReset(user_id=user.id, token=token, expires_at=expires_at)
    db.add(reset_entry)
    db.commit()

    background_tasks.add_task(send_password_reset_email, user.email, token)
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    from datetime import datetime, timezone
    from app.models.password_reset import PasswordReset
    from app.core.security import get_password_hash

    entry = db.query(PasswordReset).filter(
        PasswordReset.token == payload.token,
        PasswordReset.used == False,
    ).first()

    if not entry:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if entry.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired.")

    user = db.query(User).filter(User.id == entry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = get_password_hash(payload.new_password)
    entry.used = True
    db.commit()

    return {"message": "Password successfully reset. You can now log in."}
