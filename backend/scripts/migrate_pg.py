
from app.db.session import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Migrating database...")
        conn.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS proof_before BOOLEAN DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS proof_after BOOLEAN DEFAULT FALSE"))
        conn.commit()
        print("Migration successful")

if __name__ == "__main__":
    migrate()
