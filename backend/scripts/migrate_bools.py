
from app.db.session import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Migrating boolean columns...")
        conn.execute(text("ALTER TABLE workdays ALTER COLUMN is_mock_location TYPE BOOLEAN USING CASE WHEN is_mock_location = 1 THEN TRUE ELSE FALSE END"))
        conn.execute(text("ALTER TABLE visits ALTER COLUMN is_auto_detected TYPE BOOLEAN USING CASE WHEN is_auto_detected = 1 THEN TRUE ELSE FALSE END"))
        conn.commit()
        print("Migration successful")

if __name__ == "__main__":
    migrate()
