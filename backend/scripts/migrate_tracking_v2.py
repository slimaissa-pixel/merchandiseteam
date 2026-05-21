import sqlite3
import os

def migrate():
    db_path = "fieldforce.db"
    if not os.path.exists(db_path):
        db_path = "../fieldforce.db"
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Adding columns to location_logs...")
    columns_to_add = [
        ("speed", "FLOAT"),
        ("accuracy", "FLOAT"),
        ("heading", "FLOAT"),
        ("altitude", "FLOAT"),
        ("activity", "TEXT")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE location_logs ADD COLUMN {col_name} {col_type}")
            print(f"Added {col_name} to location_logs")
        except sqlite3.OperationalError:
            print(f"Column {col_name} already exists in location_logs")

    print("Adding columns to workdays...")
    workday_columns = [
        ("current_activity", "TEXT"),
        ("battery_level", "FLOAT"),
        ("is_mock_location", "INTEGER DEFAULT 0")
    ]
    
    for col_name, col_type in workday_columns:
        try:
            cursor.execute(f"ALTER TABLE workdays ADD COLUMN {col_name} {col_type}")
            print(f"Added {col_name} to workdays")
        except sqlite3.OperationalError:
            print(f"Column {col_name} already exists in workdays")

    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
