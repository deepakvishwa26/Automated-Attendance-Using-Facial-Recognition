"""
Student Personal API Routes
============================
GET  /api/students/{student_id}/attendance-summary - Get personalized attendance summary
GET  /api/students/{student_id}/preferences - Get student preferences
PUT  /api/students/{student_id}/preferences - Update student preferences
"""

import math
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..database import get_db
from ..models.models import Student, Attendance, StudentPreference

router = APIRouter(prefix="/api/students", tags=["student-personal"])


def _get_or_create_preferences(db: Session, student_id: str) -> StudentPreference:
    """Get existing preferences or create defaults."""
    pref = db.query(StudentPreference).filter(
        StudentPreference.student_id == student_id
    ).first()
    if not pref:
        pref = StudentPreference(
            student_id=student_id,
            attendance_target=75,
            alerts_enabled=True,
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


def _calculate_streak(db: Session, student_id: str) -> int:
    """Calculate current consecutive present-day streak."""
    records = (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id)
        .order_by(Attendance.date.desc())
        .all()
    )
    streak = 0
    for record in records:
        if record.status == "present":
            streak += 1
        else:
            break
    return streak


def _calculate_classes_needed(present: int, total: int, target_pct: int) -> int:
    """
    Calculate minimum consecutive classes needed to reach target.
    Find min X where (present + X) / (total + X) >= target_pct / 100
    """
    if total == 0:
        return 0
    target = target_pct / 100.0
    current = present / total if total > 0 else 0
    if current >= target:
        return 0
    # (P + X) / (N + X) >= T
    # P + X >= T * (N + X)
    # P + X >= TN + TX
    # X - TX >= TN - P
    # X(1 - T) >= TN - P
    if target >= 1.0:
        return -1  # impossible to reach 100% if any absences
    x = math.ceil((target * total - present) / (1 - target))
    return max(0, x)


def _get_attendance_status(current_pct: float, target_pct: int) -> dict:
    """Determine attendance status relative to target."""
    diff = current_pct - target_pct
    if diff >= 0:
        return {
            "status": "ON_TRACK",
            "label": "On Track",
            "emoji": "🟢",
            "message": "Your attendance is currently above your target.",
        }
    elif diff >= -5:
        return {
            "status": "BELOW_TARGET",
            "label": "Below Target",
            "emoji": "🟡",
            "message": "Your attendance is currently below your target.",
        }
    else:
        return {
            "status": "NEEDS_ATTENTION",
            "label": "Needs Attention",
            "emoji": "🔴",
            "message": "Your attendance is significantly below your target.",
        }


@router.get("/{student_id}/attendance-summary")
def get_attendance_summary(student_id: str, db: Session = Depends(get_db)):
    """Get personalized attendance summary for a student."""
    # Verify student exists
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found.")

    # Get preferences
    pref = _get_or_create_preferences(db, student_id)

    # Count attendance
    present_count = (
        db.query(func.count(Attendance.id))
        .filter(and_(Attendance.student_id == student_id, Attendance.status == "present"))
        .scalar()
    ) or 0

    total_records = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.student_id == student_id)
        .scalar()
    ) or 0

    # For absent count, we use total - present (all records minus present ones)
    absent_count = total_records - present_count

    # Calculate percentage
    attendance_pct = round((present_count / total_records * 100), 1) if total_records > 0 else 0.0

    # Calculate streak
    streak = _calculate_streak(db, student_id)

    # Calculate classes needed
    classes_needed = _calculate_classes_needed(present_count, total_records, pref.attendance_target)

    # Get status
    status_info = _get_attendance_status(attendance_pct, pref.attendance_target)

    # Get recent attendance (last 10)
    recent = (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id)
        .order_by(Attendance.date.desc())
        .limit(10)
        .all()
    )

    recent_records = [
        {
            "id": r.id,
            "date": r.date.isoformat(),
            "time": r.time.strftime("%I:%M %p") if r.time else None,
            "status": r.status,
        }
        for r in recent
    ]

    return {
        "student_id": student.student_id,
        "student_name": student.name,
        "department": student.department,
        "year": student.year,
        "present_count": present_count,
        "absent_count": absent_count,
        "total_classes": total_records,
        "attendance_percentage": attendance_pct,
        "attendance_target": pref.attendance_target,
        "alerts_enabled": pref.alerts_enabled,
        "attendance_status": status_info,
        "streak": streak,
        "classes_needed": classes_needed,
        "recent_attendance": recent_records,
    }


@router.get("/{student_id}/preferences")
def get_preferences(student_id: str, db: Session = Depends(get_db)):
    """Get student preferences."""
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found.")

    pref = _get_or_create_preferences(db, student_id)
    return {
        "student_id": student_id,
        "attendance_target": pref.attendance_target,
        "alerts_enabled": pref.alerts_enabled,
    }


@router.put("/{student_id}/preferences")
def update_preferences(student_id: str, body: dict, db: Session = Depends(get_db)):
    """Update student preferences."""
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found.")

    pref = _get_or_create_preferences(db, student_id)

    if "attendance_target" in body:
        target = body["attendance_target"]
        if target not in [75, 80, 85, 90, 95]:
            raise HTTPException(status_code=400, detail="Target must be 75, 80, 85, 90, or 95.")
        pref.attendance_target = target

    if "alerts_enabled" in body:
        pref.alerts_enabled = bool(body["alerts_enabled"])

    db.commit()
    db.refresh(pref)

    return {
        "student_id": student_id,
        "attendance_target": pref.attendance_target,
        "alerts_enabled": pref.alerts_enabled,
        "message": "Preferences updated successfully.",
    }
