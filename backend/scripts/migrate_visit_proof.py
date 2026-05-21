
import sqlite3
import os

db_path = "/app/data/sql_app.db"

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE visits ADD COLUMN proof_before INTEGER DEFAULT 0")
        print("Added proof_before column")
    except sqlite3.OperationalError as e:
        print(f"proof_before: {e}")
        
    try:
        cursor.execute("ALTER TABLE visits ADD COLUMN proof_after INTEGER DEFAULT 0")
        print("Added proof_after column")
    except sqlite3.OperationalError as e:
        print(f"proof_after: {e}")
        
    conn.commit()
    conn.close()
    print("Migration finished")
