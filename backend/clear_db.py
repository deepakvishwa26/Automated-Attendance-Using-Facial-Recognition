"""Clear all data from the attendance database."""
import os
import sys

# Add parent path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import SessionLocal, engine
from app.models.models import Student, Attendance

db = SessionLocal()
try:
    deleted_attendance = db.query(Attendance).delete()
    deleted_students = db.query(Student).delete()
    db.commit()
    print(f"Deleted {deleted_students} students and {deleted_attendance} attendance records.")
    
    # Verify empty
    remaining_students = db.query(Student).count()
    remaining_attendance = db.query(Attendance).count()
    print(f"Remaining: {remaining_students} students, {remaining_attendance} attendance records.")
    print("Database cleared successfully!")
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()
