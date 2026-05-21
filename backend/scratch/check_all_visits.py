import sys
sys.path.append('c:\\Users\\ACER\\Desktop\\merchandiseteam\\backend')

from app.db.session import SessionLocal
from app.models.visit import Visit
from app.models.workday import Workday
from app.models.user import User
from app.models.gms import GMS

db = SessionLocal()
try:
    print("ALL VISITS IN DB:")
    visits = db.query(Visit).order_by(Visit.id.desc()).all()
    for v in visits:
        gms = db.query(GMS).filter(GMS.id == v.gms_id).first()
        workday = db.query(Workday).filter(Workday.id == v.workday_id).first()
        user = db.query(User).filter(User.id == workday.user_id).first() if workday else None
        print(f"Visit ID: {v.id}, User: {user.email if user else 'Unknown'}, Store: {gms.name if gms else 'Unknown'} (ID: {v.gms_id}), Workday ID: {v.workday_id}, Status: {v.status}, proof_before: {v.proof_before}, proof_after: {v.proof_after}")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
