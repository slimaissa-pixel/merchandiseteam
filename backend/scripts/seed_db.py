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
                "email": "malek@sup.com",
                "first_name": "Malek",
                "last_name": "Mami",
                "hashed_password": "$pbkdf2-sha256$29000$iTGGsNYaw5izdi6l1Lo3Zg$eNkjpYIzdAIQt8O6b.80N9qU/YA8uExMnGhNAiR9MIU",
                "role": "supervisor"
        },
        {
                "email": "aymen9@sup.com",
                "first_name": "aymen",
                "last_name": "derbel",
                "hashed_password": "$pbkdf2-sha256$29000$VYrxPicEgBDiXAsBAGDsvQ$wasnuZKPAS8vNiLjqPTpO5WZS0CvFImBxdlp2Nj.LmM",
                "role": "supervisor"
        },
        {
                "email": "aymen@admin.com",
                "first_name": "aymen",
                "last_name": "derbel",
                "hashed_password": "$pbkdf2-sha256$29000$ytl77z2H0HrP.T/HWItRyg$lgiAmsQ94I16bf.ZeYKpAAxbw3MNNjeE0X.yZDAo/9U",
                "role": "admin"
        },
        {
                "email": "merch@merch.com",
                "first_name": "Marchandisant",
                "last_name": "001",
                "hashed_password": "$pbkdf2-sha256$29000$FMJ4T.l97723Vso5J0RISQ$PytITSGNFqxvvprtxt7OKgxc78Q/knn7cwkq./mbitA",
                "role": "merchandiser"
        },
        {
                "email": "supervisor@sup.com",
                "first_name": "Mahmoud",
                "last_name": "Livreur",
                "hashed_password": "$pbkdf2-sha256$29000$RihlTCllDCGEcK51jjFG6A$iX9u.CCjZfOhleNz8cEa.yN1/8hra5ICfYxDpJp6JNs",
                "role": "supervisor"
        },
        {
                "email": "adel@merch.com",
                "first_name": "Adel",
                "last_name": "Mekni",
                "hashed_password": "$pbkdf2-sha256$29000$BKB0bk0pZaw1BuAco/R.Tw$lxTAIIczGK2oK0zLwseajpRPN.z.yhivDGSma1rPguU",
                "role": "merchandiser"
        },
        {
                "email": "admin@admin.com",
                "first_name": "Mohamed",
                "last_name": "Mehrez",
                "hashed_password": "$pbkdf2-sha256$29000$jpGSck5pjfEeQ6gVgrDW.g$d9VkglIyb7McvHFOalcuCKOu1RfwGxVm/3C1nB.Oykc",
                "role": "admin"
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
                "name": "carrefour",
                "address": "Immeuble Badr, Route de Tunis, RN 1, Khezema, Sousse 4051",
                "latitude": 35.84578,
                "longitude": 10.61174,
                "city": "khzema",
                "type": "marketplace"
        },
        {
                "name": "Carrefour Market Hammam Sousse",
                "address": "Avenue de la libert\u00e9, Sousse 4011",
                "latitude": 35.84403,
                "longitude": 10.59011,
                "city": "hammam sousse",
                "type": "marketplace"
        },
        {
                "name": "Carrefour market Sousse Cit\u00e9 Erriadh",
                "address": "Rue des Nations Unis, Sousse 4023",
                "latitude": 35.80407,
                "longitude": 10.602444,
                "city": "sousse riadh",
                "type": "marketplace"
        },
        {
                "name": "el jem",
                "address": "rue messadine",
                "latitude": 35.283333,
                "longitude": 10.683333,
                "city": "el jem",
                "type": "Mall"
        },
        {
                "name": "Mall of Sousse",
                "address": "Kalaa Kebira, Sousse 4060",
                "latitude": 35.90372838059527,
                "longitude": 10.54372992577671,
                "city": "Kal\u00e2a Kebira",
                "type": "Mall"
        },
        {
                "name": "Soula center",
                "address": "Sousse",
                "latitude": 35.82776525363452,
                "longitude": 10.640680734068155,
                "city": "Tunisia",
                "type": "Hypermarket"
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
