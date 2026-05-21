import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("Checking for scheduling columns in gms_assignments table...")
    
    # Add scheduled_date
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='gms_assignments' AND column_name='scheduled_date';")
    if not cur.fetchone():
        print("Adding scheduled_date column...")
        cur.execute("ALTER TABLE gms_assignments ADD COLUMN scheduled_date TIMESTAMP WITH TIME ZONE NULL;")
    
    # Add status
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='gms_assignments' AND column_name='status';")
    if not cur.fetchone():
        print("Adding status column...")
        cur.execute("ALTER TABLE gms_assignments ADD COLUMN status VARCHAR DEFAULT 'scheduled';")
        
    # Add notes
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='gms_assignments' AND column_name='notes';")
    if not cur.fetchone():
        print("Adding notes column...")
        cur.execute("ALTER TABLE gms_assignments ADD COLUMN notes TEXT NULL;")

    conn.commit()
    print("Database updated successfully!")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
