import sys
sys.path.append('c:\\Users\\ACER\\Desktop\\merchandiseteam\\backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import SessionLocal
from app.models.workday import Workday
from app.models.visit import Visit
from app.models.user import User
from app.models.gms import GMS
from app.core.visit_intel import process_visit_intel
from datetime import datetime, timezone

db = SessionLocal()
try:
    # 1. Clean up any existing active workdays/visits for user slim@merch.com (id=8)
    user = db.query(User).filter(User.id == 8).first()
    print("Test User:", user.email)
    
    # Get workday IDs to delete first
    workdays = db.query(Workday).filter(Workday.user_id == user.id).all()
    workday_ids = [w.id for w in workdays]
    
    if workday_ids:
        db.query(Visit).filter(Visit.workday_id.in_(workday_ids)).delete(synchronize_session=False)
        db.query(Workday).filter(Workday.id.in_(workday_ids)).delete(synchronize_session=False)
    db.commit()
    
    # 2. Start Workday
    workday = Workday(
        user_id=user.id,
        status="active",
        start_time=datetime.now(timezone.utc),
        start_lat=36.8065,
        start_lng=10.1815
    )
    db.add(workday)
    db.commit()
    db.refresh(workday)
    print("Workday started:", workday.id, "status:", workday.status)
    
    # Get a store
    store = db.query(GMS).first()
    print("Target Store for Visit:", store.id, store.name, store.latitude, store.longitude)
    
    # 3. Start Visit (Manual)
    visit = Visit(
        workday_id=workday.id,
        gms_id=store.id,
        status="in_progress",
        start_time=datetime.now(timezone.utc),
        start_lat=36.8065,
        start_lng=10.1815
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    print("Visit started:", visit.id, "status:", visit.status)
    
    # 4. Check active session
    active_visit = db.query(Visit).filter(
        Visit.workday_id == workday.id,
        Visit.status == "in_progress"
    ).first()
    print("Active Visit in active-session check:", active_visit.id if active_visit else None, "status:", active_visit.status if active_visit else None)
    
    # 5. Simulate Geofence Check / Heartbeat at a far away coordinate (e.g. at home)
    print("Simulating heartbeat/GPS sync at coordinates (0, 0) - far from store...")
    process_visit_intel(db, workday, 0.0, 0.0)
    db.commit()
    
    # 6. Check active session again
    db.refresh(visit)
    print("Visit status after far-away heartbeat:", visit.status)
    active_visit = db.query(Visit).filter(
        Visit.workday_id == workday.id,
        Visit.status == "in_progress"
    ).first()
    print("Active Visit after far-away heartbeat:", active_visit.id if active_visit else None, "status:", active_visit.status if active_visit else None)
    
    # 7. Simulate Geofence Check / Heartbeat near the store
    print(f"Simulating heartbeat/GPS sync near store {store.name} at ({store.latitude}, {store.longitude})...")
    process_visit_intel(db, workday, store.latitude, store.longitude)
    db.commit()
    
    # 8. Check active session again
    db.refresh(visit)
    print("Visit status after near-store heartbeat:", visit.status)
    active_visit = db.query(Visit).filter(
        Visit.workday_id == workday.id,
        Visit.status == "in_progress"
    ).first()
    print("Active Visit after near-store heartbeat:", active_visit.id if active_visit else None, "status:", active_visit.status if active_visit else None)

except Exception as e:
    print("Error:", e)
finally:
    db.close()
