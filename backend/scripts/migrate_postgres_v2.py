import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    if not DATABASE_URL:
        print("DATABASE_URL not found")
        return

    print(f"Connecting to {DATABASE_URL[:20]}...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Adding columns to location_logs...")
        columns_to_add = [
            ("speed", "FLOAT"),
            ("accuracy", "FLOAT"),
            ("heading", "FLOAT"),
            ("altitude", "FLOAT"),
            ("activity", "VARCHAR")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE location_logs ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                print(f"Processed {col_name} for location_logs")
            except Exception as e:
                print(f"Error adding {col_name} to location_logs: {e}")

        print("Adding columns to workdays...")
        workday_columns = [
            ("current_activity", "VARCHAR"),
            ("battery_level", "FLOAT"),
            ("is_mock_location", "INTEGER DEFAULT 0")
        ]
        
        for col_name, col_type in workday_columns:
            try:
                conn.execute(text(f"ALTER TABLE workdays ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                print(f"Processed {col_name} for workdays")
            except Exception as e:
                print(f"Error adding {col_name} to workdays: {e}")

        print("Adding columns to visits...")
        try:
            conn.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS is_auto_detected INTEGER DEFAULT 0"))
            print("Processed is_auto_detected for visits")
        except Exception as e:
            print(f"Error adding is_auto_detected to visits: {e}")

        conn.commit()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
