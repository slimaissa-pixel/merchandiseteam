from app.db.session import SessionLocal
from app.models.user import User
from app.models.gms import GMS
from app.models.assignment import GMSAssignment

def seed_assignment():
    db = SessionLocal()
    try:
        # Get first merchandiser
        merch = db.query(User).filter(User.role == 'merchandiser').first()
        if not merch:
            print("No merchandiser found to assign.")
            return
        
        print(f"Found merchandiser: {merch.first_name} {merch.last_name} (ID: {merch.id})")

        # Get first store
        store = db.query(GMS).first()
        if not store:
            print("No GMS stores found.")
            return
        
        print(f"Found store: {store.name} (ID: {store.id})")

        existing = db.query(GMSAssignment).filter(
            GMSAssignment.user_id == merch.id,
            GMSAssignment.gms_id == store.id
        ).first()
        
        if existing:
            print("Assignment already exists.")
        else:
            print(f"Assigning {store.name} to {merch.first_name} {merch.last_name}...")
            new_assignment = GMSAssignment(user_id=merch.id, gms_id=store.id)
            db.add(new_assignment)
            db.commit()
            print("Assignment created successfully.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_assignment()
