from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def get_db() -> Generator[Session, None, None]:
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    email: str | None = None

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
    except Exception as e:
        print(f"[Auth Error] {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email == email).first()
    print(f"[DEBUG] DB Lookup for {email}: {'Found' if user else 'Not Found'}")
    if user is None:
        # Auto-create demo accounts if they don't exist in the DB to prevent 401 loops
        demo_roles = {"admin@admin.com": "admin", "supervisor@sup.com": "supervisor", "merch@merch.com": "merchandiser", "adel@merch.com": "merchandiser"}
        print(f"[DEBUG] Demo Roles Check for {email}: {'Match' if email in demo_roles else 'No Match'}")
        if email in demo_roles:
            print(f"[Auth] Auto-creating demo user in DB for {email}")
            from app.core.security import get_password_hash
            new_user = User(
                email=email,
                first_name="Demo",
                last_name=demo_roles[email].capitalize(),
                hashed_password=get_password_hash("password123"),
                role=demo_roles[email],
                is_active=True
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user
            
        raise credentials_exception
        
    return user