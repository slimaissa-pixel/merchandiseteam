import sys
sys.path.insert(0, 'c:\\Users\\ACER\\Desktop\\merchandiseteam\\backend')

import requests
from app.db.session import SessionLocal
from app.models.user import User
from app.models.workday import Workday
from app.models.visit import Visit
from app.models.gms import GMS
from datetime import datetime, timezone
import json

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == 'merch@merch.com').first()
    print("User found:", user.email, "ID:", user.id)

    # 1. Ensure a workday exists and is active, and delete all other workdays/visits to avoid noise
    # Get workday IDs to delete first
    workdays = db.query(Workday).filter(Workday.user_id == user.id).all()
    workday_ids = [w.id for w in workdays]
    
    if workday_ids:
        # Delete reports first if any
        from app.models.report import Report
        db.query(Report).filter(Report.workday_id.in_(workday_ids)).delete(synchronize_session=False)
        db.query(Visit).filter(Visit.workday_id.in_(workday_ids)).delete(synchronize_session=False)
        db.query(Workday).filter(Workday.id.in_(workday_ids)).delete(synchronize_session=False)
    db.commit()

    # Create new active workday
    workday = Workday(
        user_id=user.id,
        status="active",
        start_time=datetime.now(timezone.utc),
        start_lat=36.8065,
        start_lng=10.1815,
        is_mock_location=0
    )
    db.add(workday)
    db.commit()
    db.refresh(workday)
    print("Created new active workday ID:", workday.id)

    # Target store
    store = db.query(GMS).first()
    print("Target Store ID:", store.id, "Name:", store.name)

    # Let's call the actual API endpoint /api/tracking/visit/start using requests or directly using FastAPI's TestClient
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)

    # Generate token directly
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Start Visit via API
    start_visit_payload = {
        "workday_id": workday.id,
        "gms_id": store.id,
        "start_lat": 36.8065,
        "start_lng": 10.1815
    }
    start_res = client.post("/api/tracking/visit/start", json=start_visit_payload, headers=headers)
    print("Start visit response status:", start_res.status_code)
    print("Start visit response:", start_res.json())

    # 3. Get Active Session via API
    session_res = client.get("/api/tracking/active-session", headers=headers)
    print("\nActive session response status:", session_res.status_code)
    print("Active session response:", json.dumps(session_res.json(), indent=2))

    # Let's inspect the visit status in the database now
    db.refresh(workday)
    visits_in_db = db.query(Visit).filter(Visit.workday_id == workday.id).all()
    print("\nVisits in DB for this workday after start:")
    for v in visits_in_db:
        print(f"  Visit ID: {v.id}, Store ID: {v.gms_id}, Status: {v.status}, proof_before: {v.proof_before}, proof_after: {v.proof_after}")

except Exception as e:
    print("Error:", e)
finally:
    db.close()
