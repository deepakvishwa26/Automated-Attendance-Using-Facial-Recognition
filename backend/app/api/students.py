"""
Student API Routes
==================
POST /api/students/register - Register a new student with face data
GET  /api/students/list - List all students (with optional search/department filter)
GET  /api/students/{student_id} - Look up a student
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import StudentRegisterRequest, StudentResponse
from ..services import student_service
from ..models.models import Student

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("/list")
def list_students(
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List all registered students with optional search/department filter."""
    query = db.query(Student)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Student.name.ilike(search_term)) | (Student.student_id.ilike(search_term))
        )

    if department:
        query = query.filter(Student.department == department)

    students = query.order_by(Student.name).all()

    return [
        {
            "student_id": s.student_id,
            "name": s.name,
            "department": s.department,
            "year": s.year,
            "email": s.email,
            "has_face": bool(s.face_embedding),
            "created_at": str(s.created_at) if s.created_at else None,
        }
        for s in students
    ]


@router.post("/register", response_model=dict)
def register_student(request: StudentRegisterRequest, db: Session = Depends(get_db)):
    """Register a new student with face capture."""
    result = student_service.register_student(
        db=db,
        student_id=request.student_id,
        name=request.name,
        department=request.department,
        year=request.year,
        email=request.email,
        face_image_base64=request.face_image,
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    student = result["student"]
    return {
        "success": True,
        "message": result["message"],
        "student": {
            "student_id": student.student_id,
            "name": student.name,
            "department": student.department,
            "year": student.year,
            "email": student.email,
            "created_at": str(student.created_at),
        },
    }


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    """Look up a student by student_id."""
    student = student_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student ID '{student_id}' not found.")
    return student
