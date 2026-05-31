from app.db.session import SessionLocal, engine, Base, init_db
from app.models.user import User
from app.models.gms import GMS
from app.models.report import Report
from app.models.notification import Notification
from app.core.security import get_password_hash


def seed():
    # Initialize PostGIS extension
    init_db()
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
        users = [
            {
                        "email": "admin@admin.com",
                        "first_name": "Mohamed",
                        "last_name": "Mehrez",
                        "hashed_password": "$2b$12$jGSJ.P5p9VnLkf4zWBm49.UyEn/zqeG1wMtQd9LaA8qPNnBINf25C",
                        "role": "admin",
                        "phone": null,
                        "status": "active",
                        "is_active": true,
                        "supervisor_id": null,
                        "address": null,
                        "tags": null
            },
            {
                        "email": "supervisor@sup.com",
                        "first_name": "Mahmoud",
                        "last_name": "Livreur",
                        "hashed_password": "$2b$12$HSvi1/fDTn4kshazta5U8.16Q8bcNiyyXQXlkx5bZYN9OO35nH5m2",
                        "role": "supervisor",
                        "phone": null,
                        "status": "active",
                        "is_active": true,
                        "supervisor_id": null,
                        "address": null,
                        "tags": null
            },
            {
                        "email": "merch@merch.com",
                        "first_name": "Marchandisant",
                        "last_name": "001",
                        "hashed_password": "$2b$12$ttfWofyUCCwr8LeicB2qZOXNN8mwZ3pyuk91GWxvmr4Xl1gUkrZxy",
                        "role": "merchandiser",
                        "phone": "",
                        "status": "active",
                        "is_active": true,
                        "supervisor_id": 2,
                        "address": null,
                        "tags": null
            },
            {
                        "email": "adel@merch.com",
                        "first_name": "Adel",
                        "last_name": "Mekni",
                        "hashed_password": "$2b$12$MyXOD.tH0QVrknOUZ3eL/eXEegHBn0G8dDVEjkbhu2wjYQ3kbDWHa",
                        "role": "merchandiser",
                        "phone": "",
                        "status": "active",
                        "is_active": true,
                        "supervisor_id": 2,
                        "address": null,
                        "tags": null
            },
            {
                        "email": "slim@merch.com",
                        "first_name": "slim",
                        "last_name": "aissa",
                        "hashed_password": "$2b$12$/7bgf5WjL85iWNW03deihe6gBb08Hgu.MFrrwHkwxX8x2wpvawafG",
                        "role": "merchandiser",
                        "phone": "",
                        "status": "active",
                        "is_active": true,
                        "supervisor_id": 2,
                        "address": null,
                        "tags": null
            },
            {
                        "email": "karim@sup.com",
                        "first_name": "karim",
                        "last_name": "gharbi",
                        "hashed_password": "$2b$12$mmfHK8ToB.FNArZFoKDnIOegqopkSS3dYKsYGefqTC9qZiPPFsu6.",
                        "role": "supervisor",
                        "phone": "",
                        "status": "active",
                        "is_active": true,
                        "supervisor_id": null,
                        "address": null,
                        "tags": null
            },
            {
                        "email": "slim@admin.com",
                        "first_name": "slim",
                        "last_name": "aissa",
                        "hashed_password": "$2b$12$ImERQdDKuyafINr/dUC57uyoZrDORravVzT5vr4WQxRucL3EbXmmS",
                        "role": "admin",
                        "phone": "+216 52512911",
                        "status": "active",
                        "is_active": true,
                        "supervisor_id": null,
                        "address": "sousse",
                        "tags": ""
            },
            {
                        "email": "ahmed@merch.com",
                        "first_name": "ahmed",
                        "last_name": "ali",
                        "hashed_password": "$2b$12$KrAee.89s6vzfu9u9tmhwOWIcx4pZTkHrW/BtvGTsAxK23h6T90Oa",
                        "role": "merchandiser",
                        "phone": "",
                        "status": "active",
                        "is_active": true,
                        "supervisor_id": null,
                        "address": "",
                        "tags": ""
            }
]
    
    for u_data in users:
        # Check if user already exists by email
        existing_user = db.query(User).filter(User.email == u_data["email"]).first()
        
        if not existing_user:
            print(f"Creating user {u_data['email']}...")
            hashed_pwd = u_data.get("hashed_password") or get_password_hash(u_data["password"])
            new_user = User(
                email=u_data["email"],
                first_name=u_data["first_name"],
                last_name=u_data["last_name"],
                hashed_password=hashed_pwd,
                role=u_data["role"],
                phone=u_data.get("phone"),
                status=u_data.get("status", "active"),
                is_active=u_data.get("is_active", True),
                supervisor_id=u_data.get("supervisor_id"),
                address=u_data.get("address"),
                tags=u_data.get("tags")
            )
            db.add(new_user)
        else:
            print(f"User {u_data['email']} already exists. Updating info...")
            existing_user.first_name = u_data.get("first_name", existing_user.first_name)
            existing_user.last_name = u_data.get("last_name", existing_user.last_name)
            existing_user.role = u_data.get("role", existing_user.role)
            existing_user.hashed_password = u_data.get("hashed_password") or existing_user.hashed_password
            existing_user.phone = u_data.get("phone", existing_user.phone)
            existing_user.status = u_data.get("status", existing_user.status)
            existing_user.is_active = u_data.get("is_active", existing_user.is_active)
            existing_user.supervisor_id = u_data.get("supervisor_id", existing_user.supervisor_id)
            existing_user.address = u_data.get("address", existing_user.address)
            existing_user.tags = u_data.get("tags", existing_user.tags)
            db.add(existing_user)
    
    # Seed GMS stores with real coordinates (Sousse, Tunisia area)
        gms_stores = [
            {
                        "name": "Carrefour Khezema",
                        "address": "Route de Tunis, Sousse",
                        "latitude": 35.84578,
                        "longitude": 10.61174,
                        "city": "Sousse",
                        "type": "marketplace"
            },
            {
                        "name": "Mall of Sousse",
                        "address": "Kalaa Kebira, Sousse",
                        "latitude": 35.90372,
                        "longitude": 10.54372,
                        "city": "Kalaa Kebira",
                        "type": "marketplace"
            },
            {
                        "name": "Monoprix Sahloul",
                        "address": "Sahloul, Sousse",
                        "latitude": 35.8333,
                        "longitude": 10.5833,
                        "city": "Sousse",
                        "type": "marketplace"
            },
            {
                        "name": "Drugstore wajdi",
                        "address": "RL 819 \u0637\u0645, Sousse, Hached, D\u00e9l\u00e9gation Sousse Jaouhara, Gouvernorat Sousse, 4002, Tunisie",
                        "latitude": 35.82464305217938,
                        "longitude": 10.616504614558778,
                        "city": "Sousse",
                        "type": "Supermarket"
            }
]
    
    for gms_data in gms_stores:
        existing_gms = db.query(GMS).filter(GMS.name == gms_data["name"]).first()
        
        if not existing_gms:
            print(f"Creating GMS store {gms_data['name']}...")
            from geoalchemy2.elements import WKTElement
            new_gms = GMS(
                name=gms_data["name"],
                address=gms_data["address"],
                latitude=gms_data["latitude"],
                longitude=gms_data["longitude"],
                location=WKTElement(f'POINT({gms_data["longitude"]} {gms_data["latitude"]})', srid=4326),
                city=gms_data["city"],
                type=gms_data["type"]
            )
            db.add(new_gms)
        else:
            print(f"GMS store {gms_data['name']} already exists.")
            
    db.commit()
    db.close()
    print("Seeding completed successfully.")

if __name__ == "__main__":
    seed()
