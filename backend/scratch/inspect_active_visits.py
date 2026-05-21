import sys
sys.path.append('c:\\Users\\ACER\\Desktop\\merchandiseteam\\backend')

from app.db.session import SessionLocal
from app.models.workday import Workday
from app.models.visit import Visit
from app.models.user import User
from app.models.gms import GMS

db = SessionLocal()
try:
    print("ALL USERS:")
    users = db.query(User).all()
    for u in users:
        print(f"User ID: {u.id}, Email: {u.email}, Name: {u.first_name} {u.last_name}")

    print("\nALL ACTIVE WORKDAYS:")
    workdays = db.query(Workday).filter(Workday.status == "active").all()
    for w in workdays:
        user = db.query(User).filter(User.id == w.user_id).first()
        print(f"Workday ID: {w.id}, User: {user.email if user else 'Unknown'}, Status: {w.status}")
        
        visits = db.query(Visit).filter(Visit.workday_id == w.id).all()
        print("  Visits for this workday:")
        for v in visits:
            gms = db.query(GMS).filter(GMS.id == v.gms_id).first()
            print(f"    Visit ID: {v.id}, GMS: {gms.name if gms else 'Unknown'} (ID: {v.gms_id}), Status: {v.status}, proof_before: {v.proof_before}, proof_after: {v.proof_after}")

except Exception as e:
    print("Error:", e)
finally:
    db.close()
