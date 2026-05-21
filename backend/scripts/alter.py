from app.db.session import engine
from sqlalchemy import text

def alter_db():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE objectives ADD COLUMN target INTEGER DEFAULT 0"))
            conn.execute(text("ALTER TABLE objectives ADD COLUMN current INTEGER DEFAULT 0"))
            conn.execute(text("ALTER TABLE objectives ADD COLUMN target_visits INTEGER DEFAULT 0"))
            conn.execute(text("ALTER TABLE objectives ADD COLUMN month INTEGER DEFAULT 1"))
            conn.execute(text("ALTER TABLE objectives ADD COLUMN year INTEGER DEFAULT 2024"))
            print("Successfully added columns to objectives table.")
        except Exception as e:
            print(f"Error (might already exist): {e}")

if __name__ == "__main__":
    alter_db()
