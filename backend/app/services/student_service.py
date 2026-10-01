"""
Student Service
===============
Business logic for student registration and lookup.
"""

from sqlalchemy.orm import Session
from ..models.models import Student
from . import face_service


def register_student(
    db: Session,
    student_id: str,
    name: str,
    department: str,
    year: int,
    email: str,
    face_image_base64: str,
) -> dict:
    """
    Register a new student with face data.

    Returns dict with 'success', 'message', and optionally 'student'.
    """
    # Check if student already exists
    existing = db.query(Student).filter(Student.student_id == student_id).first()
    if existing:
        return {"success": False, "message": f"Student ID '{student_id}' is already registered."}

    # Generate face embedding
    embedding = face_service.generate_embedding(face_image_base64)
    if embedding is None:
        return {
            "success": False,
            "message": "No face detected in the captured image. Please ensure your face is clearly visible and try again.",
        }

    # Store embedding as JSON
    embedding_json = face_service.embedding_to_json(embedding)

    # Create student record
    student = Student(
        student_id=student_id,
        name=name,
        department=department,
        year=year,
        email=email,
        face_embedding=embedding_json,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "success": True,
        "message": "Student registered successfully.",
        "student": student,
    }


def get_student(db: Session, student_id: str) -> Student | None:
    """Look up a student by student_id."""
    return db.query(Student).filter(Student.student_id == student_id).first()
