import os
import sys
import json
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.models.gms import GMS

def update_seed_file(file_path: str, users_list: list, gms_list: list, users_var: str, gms_var: str):
    if not os.path.exists(file_path):
        return
    
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    users_replaced = False
    gms_replaced = False

    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Start of users block
        if f"{users_var} = [" in line and not users_replaced:
            new_lines.append(f"        {users_var} = {json.dumps(users_list, indent=12)}\n")
            # Skip until closing bracket
            while "]" not in lines[i]:
                i += 1
            users_replaced = True
        
        # Start of GMS block
        elif f"{gms_var} = [" in line and not gms_replaced:
            new_lines.append(f"        {gms_var} = {json.dumps(gms_list, indent=12)}\n")
            # Skip until closing bracket
            while "]" not in lines[i]:
                i += 1
            gms_replaced = True
        
        else:
            new_lines.append(line)
        
        i += 1

    with open(file_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print(f"Successfully synced to {os.path.basename(file_path)}")

def sync_data_to_seed():
    db = SessionLocal()
    try:
        # 1. Fetch Users
        users_db = db.query(User).all()
        users_list = []
        for u in users_db:
            users_list.append({
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "hashed_password": u.hashed_password,
                "role": u.role,
                "phone": u.phone,
                "status": u.status,
                "is_active": u.is_active,
                "supervisor_id": u.supervisor_id,
                "address": u.address,
                "tags": u.tags
            })

        # 2. Fetch GMS Stores
        gms_db = db.query(GMS).all()
        gms_list = []
        for g in gms_db:
            gms_list.append({
                "name": g.name,
                "address": g.address,
                "latitude": g.latitude,
                "longitude": g.longitude,
                "city": g.city,
                "type": g.type
            })

        # 3. Update both seed files
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        seed_db_path = os.path.join(base_dir, "seed_db.py")
        update_seed_file(seed_db_path, users_list, gms_list, "users", "gms_stores")
        
        seed_full_path = os.path.join(base_dir, "seed_full.py")
        update_seed_file(seed_full_path, users_list, gms_list, "users_data", "gms_data")

    except Exception as e:
        print(f"Error syncing data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_data_to_seed()
