import sys
sys.path.append('c:\\Users\\ACER\\Desktop\\merchandiseteam\\backend')

from app.db.session import SessionLocal
from app.models.visit import Visit
from app.models.workday import Workday
from app.models.user import User
from app.models.gms import GMS

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == 'slim@merch.com').first()
    print("User ID:", user.id)
    workdays = db.query(Workday).filter(Workday.user_id == user.id).all()
    for w in workdays:
        print(f"Workday ID: {w.id}, Status: {w.status}")
        visits = db.query(Visit).filter(Visit.workday_id == w.id).all()
        for v in visits:
            gms = db.query(GMS).filter(GMS.id == v.gms_id).first()
            print(f"  Visit ID: {v.id}, Store: {gms.name if gms else 'Unknown'}, Status: {v.status}, proof_before: {v.proof_before}, proof_after: {v.proof_after}")
except Exception as e:
    print(e)
finally:
    db.close()
