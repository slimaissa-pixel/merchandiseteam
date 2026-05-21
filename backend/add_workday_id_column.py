import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("Checking for workday_id column in reports table...")
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='reports' AND column_name='workday_id';")
    
    if not cur.fetchone():
        print("Adding workday_id column...")
        cur.execute("ALTER TABLE reports ADD COLUMN workday_id INTEGER REFERENCES workdays(id) NULL;")
        conn.commit()
        print("Column added successfully!")
    else:
        print("Column already exists.")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
