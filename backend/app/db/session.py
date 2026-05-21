# app/db/session.py
import logging
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured. "
        "Set it in your environment or in a .env file (e.g. DATABASE_URL=postgresql+psycopg://...)."
    )

# Create engine — use NullPool for Supabase transaction pooler (port 6543)
# The transaction pooler closes connections after each transaction,
# so SQLAlchemy's persistent pool causes hangs. NullPool opens/closes per request.
engine: Engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,
    connect_args={"connect_timeout": 30},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db() -> None:
    """
    Optional initialization checks (and PostGIS extension for Postgres).
    Call this once at app startup to fail early with a clear error if DB is unreachable.
    """
    try:
        with engine.connect() as conn:
            # Basic connectivity check
            conn.execute(text("SELECT 1"))

            # Optional: enable postgis on postgres
            if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))

            conn.commit()
    except SQLAlchemyError as e:
        logger.exception("Database initialization failed.")
        raise RuntimeError(f"Database initialization failed: {e}") from e