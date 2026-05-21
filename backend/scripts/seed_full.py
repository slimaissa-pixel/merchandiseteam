from app.db.session import SessionLocal, engine, Base, init_db
from app.models.user import User
from app.models.gms import GMS
from app.models.report import Report
from app.models.workday import Workday
from app.models.visit import Visit
from app.models.assignment import GMSAssignment
from app.core.security import get_password_hash
from datetime import datetime, timedelta
from geoalchemy2.elements import WKTElement
import random

def seed_full():
    print("Starting full database seeding...")
    init_db()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Seed Users
        users_data = [
            {"email": "admin@admin.com", "first_name": "Mohamed", "last_name": "Mehrez", "role": "admin"},
            {"email": "supervisor@sup.com", "first_name": "Mahmoud", "last_name": "Livreur", "role": "supervisor"},
            {"email": "merch@merch.com", "first_name": "Marchandisant", "last_name": "001", "role": "merchandiser"},
            {"email": "adel@merch.com", "first_name": "Adel", "last_name": "Mekni", "role": "merchandiser"},
        ]
        
        users = []
        for u_data in users_data:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            if not user:
                print(f"Creating user {u_data['email']}...")
                user = User(
                    email=u_data["email"],
                    first_name=u_data["first_name"],
                    last_name=u_data["last_name"],
                    hashed_password=u_data.get("hashed_password", get_password_hash("password123")),
                    role=u_data["role"],
                    phone=u_data.get("phone"),
                    status=u_data.get("status", "active"),
                    is_active=u_data.get("is_active", True),
                    supervisor_id=u_data.get("supervisor_id"),
                    address=u_data.get("address"),
                    tags=u_data.get("tags")
                )
                db.add(user)
                db.flush()
            else:
                user.first_name = u_data.get("first_name", user.first_name)
                user.last_name = u_data.get("last_name", user.last_name)
                user.role = u_data.get("role", user.role)
                if u_data.get("hashed_password"):
                    user.hashed_password = u_data["hashed_password"]
                user.phone = u_data.get("phone", user.phone)
                user.status = u_data.get("status", user.status)
                user.is_active = u_data.get("is_active", user.is_active)
                user.supervisor_id = u_data.get("supervisor_id", user.supervisor_id)
                user.address = u_data.get("address", user.address)
                user.tags = u_data.get("tags", user.tags)
                db.add(user)
                db.flush()
            users.append(user)
        
        # 2. Seed GMS Stores
        gms_data = [
            {"name": "Carrefour Khezema", "address": "Route de Tunis, Sousse", "lat": 35.84578, "lng": 10.61174, "city": "Sousse"},
            {"name": "Mall of Sousse", "address": "Kalaa Kebira, Sousse", "lat": 35.90372, "lng": 10.54372, "city": "Kalaa Kebira"},
            {"name": "Monoprix Sahloul", "address": "Sahloul, Sousse", "lat": 35.8333, "lng": 10.5833, "city": "Sousse"},
        ]
        
        stores = []
        for g_data in gms_data:
            store = db.query(GMS).filter(GMS.name == g_data["name"]).first()
            if not store:
                print(f"Creating GMS store {g_data['name']}...")
                store = GMS(
                    name=g_data["name"],
                    address=g_data["address"],
                    latitude=g_data["lat"],
                    longitude=g_data["lng"],
                    location=WKTElement(f'POINT({g_data["lng"]} {g_data["lat"]})', srid=4326),
                    city=g_data["city"],
                    type="marketplace"
                )
                db.add(store)
                db.flush()
            stores.append(store)

        # 3. Assignments
        merch = next(u for u in users if u.role == "merchandiser")
        for store in stores:
            exists = db.query(GMSAssignment).filter_by(user_id=merch.id, gms_id=store.id).first()
            if not exists:
                print(f"Assigning {store.name} to {merch.email}...")
                db.add(GMSAssignment(user_id=merch.id, gms_id=store.id))

        # 4. Seed Workdays, Visits, and Reports
        print("Seeding activity data...")
        now = datetime.now()
        for i in range(5): # Seed 5 days of data
            day = now - timedelta(days=i)
            # Start workday
            wd = Workday(
                user_id=merch.id,
                start_time=day.replace(hour=8, minute=0),
                end_time=day.replace(hour=17, minute=0),
                start_lat=35.8,
                start_lng=10.6,
                end_lat=35.8,
                end_lng=10.6,
                status="completed"
            )
            db.add(wd)
            db.flush()
            
            # 2 Visits per day
            for j in range(2):
                store = stores[j % len(stores)]
                visit = Visit(
                    workday_id=wd.id,
                    gms_id=store.id,
                    start_time=day.replace(hour=9 + j*3, minute=0),
                    end_time=day.replace(hour=11 + j*3, minute=0),
                    status="completed",
                    proof_before=True,
                    proof_after=True
                )
                db.add(visit)
                db.flush()
                
                # 1 Report per visit
                report = Report(
                    name=f"Report {store.name} - {day.strftime('%Y-%m-%d')}",
                    notes=f"All products in stock. Shelf look good.",
                    type="Before/After",
                    before_image="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
                    after_image="https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=800",
                    status="approved",
                    user_id=merch_user.id if 'merch_user' in locals() else merch.id,
                    gms_id=store.id,
                    visit_id=visit.id,
                    workday_id=wd.id,
                    created_at=day.replace(hour=11 + j*3, minute=0)
                )
                db.add(report)

        db.commit()
        print("Full seeding completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_full()
