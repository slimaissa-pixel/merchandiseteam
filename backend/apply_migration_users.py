import os
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.llllzldvhquseghxoxga:5-n_BF6V_9CcY%26S@aws-1-eu-west-3.pooler.supabase.com:6543/postgres"
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("Connected to PostgreSQL successfully!")
        
        # Add columns to users table
        print("Adding address column to users...")
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR;"))
        
        print("Adding tags column to users...")
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS tags VARCHAR;"))
        
        conn.commit()
        print("Migration applied successfully!")
        
        # Verify structure of users table
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"))
        print("\nUsers Columns:")
        for r in res.fetchall():
            print(r)
            
except Exception as e:
    print("Error:", e)
