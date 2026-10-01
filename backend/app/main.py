"""
Automated Attendance Using Facial Recognition - Backend
=======================================================
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database.database import Base, engine
from .api.students import router as students_router
from .api.attendance import router as attendance_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Automated Attendance - Face Recognition",
    description="Backend API for facial recognition based attendance system",
    version="1.0.0",
)

# CORS — allow the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(students_router)
app.include_router(attendance_router)


@app.get("/")
def root():
    return {
        "message": "Automated Attendance System API",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
