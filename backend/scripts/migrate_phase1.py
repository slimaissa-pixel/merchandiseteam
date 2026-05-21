"""
One-time migration: adds new columns introduced in Phase 1 of the execution plan.
Run from the backend/ directory:
    python scripts/migrate_phase1.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

MIGRATIONS = [
    # 1. User: add supervisor_id
    """
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    """,

    # 2. GMS: add supervisor_id, opening_hours, surface_area
    """
    ALTER TABLE gms
    ADD COLUMN IF NOT EXISTS supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    """,
    """
    ALTER TABLE gms
    ADD COLUMN IF NOT EXISTS opening_hours VARCHAR;
    """,
    """
    ALTER TABLE gms
    ADD COLUMN IF NOT EXISTS surface_area FLOAT;
    """,

    # 3. Article: add barcode, price, stock_alert_threshold
    """
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS barcode VARCHAR;
    """,
    """
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS price FLOAT;
    """,
    """
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS stock_alert_threshold INTEGER DEFAULT 0;
    """,

    # 4. Workday: add last_seen_at, last_lat, last_lng
    """
    ALTER TABLE workdays
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;
    """,
    """
    ALTER TABLE workdays
    ADD COLUMN IF NOT EXISTS last_lat FLOAT;
    """,
    """
    ALTER TABLE workdays
    ADD COLUMN IF NOT EXISTS last_lng FLOAT;
    """,

    # 5. Create password_resets table (also handled by create_all, but safe to run)
    """
    CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_password_resets_token ON password_resets(token);
    """,
]

def run():
    with engine.begin() as conn:
        for i, stmt in enumerate(MIGRATIONS, 1):
            try:
                conn.execute(text(stmt.strip()))
                print(f"  ✅  Migration {i}/{len(MIGRATIONS)} applied.")
            except Exception as e:
                print(f"  ⚠️  Migration {i} skipped/failed: {e}")
    print("\n✅  Phase 1 migrations complete. Restart the backend.")

if __name__ == "__main__":
    run()
