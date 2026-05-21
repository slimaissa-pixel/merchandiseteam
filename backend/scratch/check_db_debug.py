import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# Add parent dir to path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Checking connection to: {DATABASE_URL.split('@')[-1] if DATABASE_URL else 'None'}")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env")
    sys.exit(1)

try:
    engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 10})
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print(f"SUCCESS: Database connection established. Result: {result.fetchone()}")
        
        # Check users count
        user_count = conn.execute(text("SELECT count(*) FROM users")).fetchone()[0]
        print(f"INFO: Total users in DB: {user_count}")
        
except SQLAlchemyError as e:
    print(f"ERROR: Database connection failed: {e}")
except Exception as e:
    print(f"ERROR: An unexpected error occurred: {e}")
