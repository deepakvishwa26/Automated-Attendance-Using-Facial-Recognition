"""
Authentication API Routes
==========================
POST /api/auth/admin-login   - Admin login
POST /api/auth/student-login - Student login (verify Student ID exists)
GET  /api/auth/me            - Get current user from session token
POST /api/auth/logout        - Logout

Uses simple in-memory session tokens for the hackathon MVP.
"""

import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import Admin, Student

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ── In-memory session store (MVP — resets on server restart) ──
_sessions: dict[str, dict] = {}


def hash_password(password: str) -> str:
    """Simple SHA-256 hash for MVP. Use bcrypt in production."""
    return hashlib.sha256(password.encode()).hexdigest()


def get_current_user(request: Request) -> dict:
    """Extract and validate session from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    session = _sessions.get(token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return session


# ── Admin Login ──

@router.post("/admin-login")
def admin_login(body: dict, db: Session = Depends(get_db)):
    email = body.get("email", "").strip()
    password = body.get("password", "").strip()

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    admin = db.query(Admin).filter(Admin.email == email).first()
    if not admin or admin.password_hash != hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = secrets.token_hex(32)
    _sessions[token] = {
        "role": "ADMIN",
        "admin_id": admin.admin_id,
        "name": admin.name,
        "email": admin.email,
    }

    return {
        "token": token,
        "role": "ADMIN",
        "admin_id": admin.admin_id,
        "name": admin.name,
    }


# ── Student Login ──

@router.post("/student-login")
def student_login(body: dict, db: Session = Depends(get_db)):
    student_id = body.get("student_id", "").strip().upper()

    if not student_id:
        raise HTTPException(status_code=400, detail="Student ID is required.")

    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student ID not found. Please contact your administrator.",
        )

    token = secrets.token_hex(32)
    _sessions[token] = {
        "role": "STUDENT",
        "student_id": student.student_id,
        "name": student.name,
        "department": student.department,
        "year": student.year,
    }

    return {
        "token": token,
        "role": "STUDENT",
        "student_id": student.student_id,
        "name": student.name,
    }


# ── Get Current User ──

@router.get("/me")
def get_me(request: Request):
    user = get_current_user(request)
    return user


# ── Logout ──

@router.post("/logout")
def logout(request: Request):
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        _sessions.pop(token, None)
    return {"message": "Logged out successfully."}
