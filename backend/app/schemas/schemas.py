from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime


# ─── Student Schemas ─────────────────────────────────────────────

class StudentRegisterRequest(BaseModel):
    student_id: str
    name: str
    department: str
    year: int
    email: Optional[str] = None
    face_image: str  # base64-encoded image from webcam


class StudentResponse(BaseModel):
    student_id: str
    name: str
    department: str
    year: int
    email: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Attendance Schemas ──────────────────────────────────────────

class AttendanceVerifyRequest(BaseModel):
    student_id: str
    face_image: str  # base64-encoded image from webcam


class VerificationResult(BaseModel):
    verified: bool
    confidence: float
    student: Optional[StudentResponse] = None
    message: str


class AttendanceMarkRequest(BaseModel):
    student_id: str
    confidence: float


class AttendanceResponse(BaseModel):
    id: int
    student_id: str
    date: date
    time: time
    status: str
    confidence: Optional[float] = None

    class Config:
        from_attributes = True


class AttendanceMarkResponse(BaseModel):
    success: bool
    message: str
    attendance: Optional[AttendanceResponse] = None
