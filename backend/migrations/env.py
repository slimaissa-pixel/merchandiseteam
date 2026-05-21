"""
migrations/env.py — Alembic environment configuration.

Auto-detects the DATABASE_URL from .env (same as the app) and imports
all SQLAlchemy models so Alembic can diff the live DB schema against
the ORM and generate accurate migration scripts.

Usage:
  # Generate a new migration after changing any model:
  alembic revision --autogenerate -m "add expo_push_token to users"

  # Apply pending migrations:
  alembic upgrade head

  # Check current revision:
  alembic current

  # Show history:
  alembic history --verbose
"""
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool
from alembic import context

# ---------------------------------------------------------------------------
# Ensure the backend package is on the path
# ---------------------------------------------------------------------------
HERE = Path(__file__).resolve().parent          # migrations/
BACKEND_DIR = HERE.parent                        # backend/
sys.path.insert(0, str(BACKEND_DIR))

# Load .env so DATABASE_URL is available
load_dotenv(BACKEND_DIR / ".env")

# ---------------------------------------------------------------------------
# Import ALL models so Alembic can see the full schema
# ---------------------------------------------------------------------------
from app.db.session import Base  # noqa: E402
import app.models  # noqa: E402  — this __init__.py imports every model

# ---------------------------------------------------------------------------
# Alembic config object
# ---------------------------------------------------------------------------
config = context.config

# Override sqlalchemy.url from the environment (beats hardcoding in alembic.ini)
DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set. Add it to backend/.env")
# Escape '%' to '%%' because Alembic uses configparser which interprets '%' as interpolation
escaped_url = DATABASE_URL.replace("%", "%%")
config.set_main_option("sqlalchemy.url", escaped_url)

# Set up logging from alembic.ini if present
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# Migration runners
# ---------------------------------------------------------------------------

def run_migrations_offline() -> None:
    """Run in 'offline' mode — generates SQL without a live DB connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,        # detect column type changes
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run in 'online' mode — connects to the DB and applies migrations."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
