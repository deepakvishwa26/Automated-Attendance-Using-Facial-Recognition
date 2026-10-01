from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Date, Time, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from ..database.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False)
    email = Column(String(100), nullable=True)
    face_embedding = Column(Text, nullable=False)  # JSON-serialized embedding vector
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<Student(student_id={self.student_id}, name={self.name})>"


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(50), nullable=False, index=True)
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    status = Column(String(20), nullable=False, default="present")
    confidence = Column(Float, nullable=True)

    __table_args__ = (
        UniqueConstraint("student_id", "date", name="uq_student_date"),
    )

    def __repr__(self):
        return f"<Attendance(student_id={self.student_id}, date={self.date})>"


class StudentPreference(Base):
    __tablename__ = "student_preferences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(50), unique=True, nullable=False, index=True)
    attendance_target = Column(Integer, nullable=False, default=75)
    alerts_enabled = Column(Boolean, nullable=False, default=True)

    def __repr__(self):
        return f"<StudentPreference(student_id={self.student_id}, target={self.attendance_target})>"


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    admin_id = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    name = Column(String(100), nullable=False, default="Admin")
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<Admin(admin_id={self.admin_id}, email={self.email})>"


