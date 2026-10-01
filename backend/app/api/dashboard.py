"""
Dashboard API Routes
====================
GET /api/dashboard/stats - Get dashboard summary statistics
GET /api/dashboard/today  - Get today's attendance with student info
"""

from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..database import get_db
from ..models.models import Student, Attendance

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get summary statistics for the dashboard."""
    total_students = db.query(func.count(Student.id)).scalar() or 0
    today = date.today()

    present_today = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.date == today)
        .scalar()
    ) or 0

    absent_today = max(0, total_students - present_today)
    attendance_rate = round((present_today / total_students * 100), 1) if total_students > 0 else 0.0

    return {
        "total_students": total_students,
        "present_today": present_today,
        "absent_today": absent_today,
        "attendance_rate": attendance_rate,
        "date": today.isoformat(),
    }


@router.get("/today")
def get_today_attendance(db: Session = Depends(get_db)):
    """Get today's attendance records joined with student info."""
    today = date.today()

    records = (
        db.query(Attendance, Student)
        .outerjoin(Student, Attendance.student_id == Student.student_id)
        .filter(Attendance.date == today)
        .order_by(Attendance.time.desc())
        .all()
    )

    result = []
    for attendance, student in records:
        result.append({
            "id": attendance.id,
            "student_id": attendance.student_id,
            "name": student.name if student else "Unknown",
            "department": student.department if student else "—",
            "year": student.year if student else None,
            "date": attendance.date.isoformat(),
            "time": attendance.time.strftime("%I:%M %p"),
            "status": attendance.status,
            "confidence": attendance.confidence,
        })

    return result
