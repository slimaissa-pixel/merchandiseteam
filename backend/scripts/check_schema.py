from app.db.session import engine, text

def check_and_fix_schema():
    with engine.connect() as conn:
        # Check if visit_id exists in reports table
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='reports' AND column_name='visit_id';
        """)).fetchone()
        
        if not result:
            print("Adding visit_id column to reports table...")
            conn.execute(text("ALTER TABLE reports ADD COLUMN visit_id INTEGER REFERENCES visits(id);"))
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column visit_id already exists.")

if __name__ == "__main__":
    check_and_fix_schema()
