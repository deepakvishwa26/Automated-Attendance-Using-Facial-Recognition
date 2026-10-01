"""
Automated Attendance Using Facial Recognition - Backend
=======================================================
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database.database import Base, engine, SessionLocal
from .api.students import router as students_router
from .api.attendance import router as attendance_router
from .api.dashboard import router as dashboard_router
from .api.student_personal import router as student_personal_router
from .api.auth import router as auth_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Attend — Face Recognition",
    description="Smart Attend API — facial recognition based attendance system",
    version="1.0.0",
)

# CORS — allow the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://localhost:8001", "http://localhost:8003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(students_router)
app.include_router(attendance_router)
app.include_router(dashboard_router)
app.include_router(student_personal_router)


# ── Seed default Admin on startup ──
@app.on_event("startup")
def seed_default_admin():
    """Create a default admin account if none exists."""
    from .models.models import Admin
    from .api.auth import hash_password

    db = SessionLocal()
    try:
        existing = db.query(Admin).first()
        if not existing:
            admin = Admin(
                admin_id="admin",
                email="admin@smartattend.com",
                password_hash=hash_password("admin123"),
                name="Administrator",
            )
            db.add(admin)
            db.commit()
            print("[SEED] Default admin created: admin@smartattend.com / admin123")
        else:
            print("[SEED] Admin already exists, skipping seed.")
    except Exception as e:
        print(f"[SEED] Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "message": "Smart Attend API",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
