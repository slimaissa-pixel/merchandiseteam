import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Set email_confirmed_at to current timestamp for all users
    result = conn.execute(text('UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;'))
    conn.commit()
    print(f"Confirmed users successfully.")
