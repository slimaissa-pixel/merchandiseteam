import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("Listing last 10 workdays:")
    cur.execute("SELECT w.id, u.first_name, w.status, w.start_time, w.end_time FROM workdays w JOIN users u ON w.user_id = u.id ORDER BY w.start_time DESC LIMIT 10;")
    rows = cur.fetchall()
    for row in rows:
        print(row)
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
