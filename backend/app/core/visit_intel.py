from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.gms import GMS
from app.models.visit import Visit
from app.models.workday import Workday
from datetime import datetime, timezone
import math

def haversine_meters(lat1, lon1, lat2, lon2):
    # Radius of Earth in meters
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def process_visit_intel(db: Session, workday: Workday, lat: float, lng: float):
    """
    Analyzes current location and automatically starts/ends visits based on geofencing.
    """
    now = datetime.now(timezone.utc)
    
    # 1. Find the nearest store
    # For performance, we could use PostGIS if available, but for now a simple range check
    # Let's assume a 100m geofence
    GEOFENCE_RADIUS_METERS = 100
    
    # Get all stores (ideally only those assigned to this user)
    # For now, let's just get all stores and filter in Python (simpler for SQLite/Postgres compat)
    stores = db.query(GMS).all()
    
    nearest_store = None
    min_dist = float('inf')
    
    for store in stores:
        if store.latitude and store.longitude:
            dist = haversine_meters(lat, lng, store.latitude, store.longitude)
            if dist < min_dist:
                min_dist = dist
                nearest_store = store
                
    # 2. Handle active visits - auto-closing is disabled per user request
    active_visit = db.query(Visit).filter(
        Visit.workday_id == workday.id,
        Visit.status == "in_progress"
    ).first()
    
    if not active_visit:
        # 3. Auto-start visit if in range of a new store
        if nearest_store and min_dist < GEOFENCE_RADIUS_METERS:
            # Check if they were already here recently to avoid duplicates
            last_visit = db.query(Visit).filter(
                Visit.workday_id == workday.id,
                Visit.gms_id == nearest_store.id
            ).order_by(Visit.end_time.desc()).first()
            
            # Don't auto-re-start if they left less than 5 mins ago
            if last_visit and last_visit.end_time:
                time_diff = (now - last_visit.end_time).total_seconds() / 60
                if time_diff < 5:
                    return
            
            print(f"[VisitIntel] Auto-starting visit for {nearest_store.name}")
            new_visit = Visit(
                workday_id=workday.id,
                gms_id=nearest_store.id,
                start_lat=lat,
                start_lng=lng,
                status="in_progress",
                is_auto_detected=1
            )
            db.add(new_visit)
            db.commit()
