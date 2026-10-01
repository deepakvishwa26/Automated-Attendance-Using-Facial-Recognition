"""
Attendance API Routes
=====================
POST /api/attendance/verify - Verify a student's face
POST /api/attendance/mark   - Mark attendance after successful verification
GET  /api/attendance/{student_id} - Get attendance history
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import (
    AttendanceVerifyRequest,
    VerificationResult,
    AttendanceMarkRequest,
    AttendanceMarkResponse,
    AttendanceResponse,
    StudentResponse,
)
from ..services import attendance_service

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.post("/verify", response_model=VerificationResult)
def verify_face(request: AttendanceVerifyRequest, db: Session = Depends(get_db)):
    """Verify a student's face against their registered embedding."""
    result = attendance_service.verify_student_face(
        db=db,
        student_id=request.student_id,
        face_image_base64=request.face_image,
    )

    student_data = None
    if result["student"]:
        s = result["student"]
        student_data = StudentResponse(
            student_id=s.student_id,
            name=s.name,
            department=s.department,
            year=s.year,
            email=s.email,
            created_at=s.created_at,
        )

    return VerificationResult(
        verified=result["verified"],
        confidence=result["confidence"],
        message=result["message"],
        student=student_data,
    )


@router.post("/mark", response_model=AttendanceMarkResponse)
def mark_attendance(request: AttendanceMarkRequest, db: Session = Depends(get_db)):
    """Mark attendance for a verified student."""
    result = attendance_service.mark_attendance(
        db=db,
        student_id=request.student_id,
        confidence=request.confidence,
    )

    attendance_data = None
    if result["attendance"]:
        a = result["attendance"]
        attendance_data = AttendanceResponse(
            id=a.id,
            student_id=a.student_id,
            date=a.date,
            time=a.time,
            status=a.status,
            confidence=a.confidence,
        )

    if not result["success"]:
        # Return 409 for duplicate attendance, 400 for other errors
        status_code = 409 if "already marked" in result["message"] else 400
        raise HTTPException(status_code=status_code, detail=result["message"])

    return AttendanceMarkResponse(
        success=result["success"],
        message=result["message"],
        attendance=attendance_data,
    )


@router.get("/{student_id}", response_model=list[AttendanceResponse])
def get_attendance_history(student_id: str, db: Session = Depends(get_db)):
    """Get attendance history for a student."""
    records = attendance_service.get_attendance_history(db, student_id)
    return records
