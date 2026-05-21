from app.core.security import verify_password
from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()
admin = db.query(User).filter(User.email == "admin@admin.com").first()

if admin:
    print("Does admin match admin?", verify_password("admin", admin.hashed_password))
    print("Does admin match password123?", verify_password("password123", admin.hashed_password))
else:
    print("Admin not found")
