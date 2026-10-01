"""
Attendance Service
==================
Business logic for face verification and attendance marking.
"""

from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..models.models import Student, Attendance
from . import face_service


def verify_student_face(db: Session, student_id: str, face_image_base64: str) -> dict:
    """
    Verify a student's face against their registered face embedding.

    Returns dict with 'verified', 'confidence', 'message', and optionally 'student'.
    """
    # Look up student
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        return {
            "verified": False,
            "confidence": 0.0,
            "message": f"Student ID '{student_id}' not found. Please register first.",
            "student": None,
        }

    # Verify face
    is_match, confidence = face_service.verify_face(
        face_image_base64, student.face_embedding
    )

    if is_match:
        return {
            "verified": True,
            "confidence": round(confidence, 4),
            "message": f"Identity verified for {student.name}.",
            "student": student,
        }
    else:
        return {
            "verified": False,
            "confidence": round(confidence, 4),
            "message": "Face verification failed. The captured face does not match the registered face.",
            "student": None,
        }


def mark_attendance(db: Session, student_id: str, confidence: float) -> dict:
    """
    Mark attendance for a student.
    Prevents duplicate attendance for the same day.

    Returns dict with 'success', 'message', and optionally 'attendance'.
    """
    # Check student exists
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        return {
            "success": False,
            "message": f"Student ID '{student_id}' not found.",
            "attendance": None,
        }

    today = date.today()

    # Check for existing attendance today
    existing = (
        db.query(Attendance)
        .filter(
            and_(
                Attendance.student_id == student_id,
                Attendance.date == today,
            )
        )
        .first()
    )

    if existing:
        return {
            "success": False,
            "message": f"Attendance already marked for {student.name} today ({today.strftime('%B %d, %Y')}).",
            "attendance": None,
        }

    # Create attendance record
    now = datetime.now()
    attendance = Attendance(
        student_id=student_id,
        date=today,
        time=now.time(),
        status="present",
        confidence=confidence,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return {
        "success": True,
        "message": f"Attendance marked for {student.name} at {now.strftime('%I:%M %p')}.",
        "attendance": attendance,
    }


def get_attendance_history(db: Session, student_id: str) -> list:
    """Get attendance history for a student."""
    return (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id)
        .order_by(Attendance.date.desc(), Attendance.time.desc())
        .all()
    )
