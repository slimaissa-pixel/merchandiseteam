from sqlalchemy import text
from app.db.session import engine

def add_column():
    with engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE articles ADD COLUMN image_url VARCHAR;'))
            conn.commit()
            print("Successfully added image_url column to articles table!")
        except Exception as e:
            print(f"Error (column might already exist): {e}")

if __name__ == "__main__":
    add_column()
