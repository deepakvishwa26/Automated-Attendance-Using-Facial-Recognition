# Automated Attendance Using Facial Recognition

A hackathon MVP for automated student attendance using facial recognition. Students register with their face data, then verify their identity to mark attendance.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 4 |
| Backend | Python 3.11 + FastAPI |
| Database | SQLite (via SQLAlchemy) |
| Face Recognition | OpenCV 5 DNN (YuNet detector + SFace embeddings) |

## Features

- **Student Registration**: Form + webcam face capture → stores face embedding
- **Attendance Marking**: Student ID + face verification → marks attendance with timestamp
- **Duplicate Prevention**: Only one attendance record per student per day
- **Real Face Verification**: Uses 128-dim deep learning face embeddings and cosine similarity

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 16+
- Webcam

### Download Models (run once)

```bash
python download_models.py
```

This downloads the YuNet face detector (~211KB) and SFace recognizer (~37MB) ONNX models.

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## Project Structure

```
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable components (Camera)
│   │   ├── pages/          # Home, Register, Attendance
│   │   ├── services/       # API client
│   │   └── App.jsx         # Main app with routing
│   └── package.json
│
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── database/       # SQLite + SQLAlchemy config
│   │   ├── models/         # ORM models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   │   ├── face_service.py       # Face recognition (OpenCV 5 DNN)
│   │   │   ├── student_service.py    # Student registration
│   │   │   └── attendance_service.py # Attendance + verification
│   │   └── main.py         # FastAPI app entry point
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/students/register` | Register student with face data |
| GET | `/api/students/{student_id}` | Look up student |
| POST | `/api/attendance/verify` | Verify face against registered student |
| POST | `/api/attendance/mark` | Mark attendance after verification |
| GET | `/api/attendance/{student_id}` | Get attendance history |

## Database Schema

### students
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| student_id | VARCHAR(50) | Unique student identifier |
| name | VARCHAR(100) | Full name |
| department | VARCHAR(100) | Department |
| year | INTEGER | Academic year |
| email | VARCHAR(100) | Email (optional) |
| face_embedding | TEXT | JSON-serialized face embedding vector |
| created_at | DATETIME | Registration timestamp |

### attendance
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| student_id | VARCHAR(50) | Student identifier |
| date | DATE | Attendance date |
| time | TIME | Attendance time |
| status | VARCHAR(20) | Status (present) |
| confidence | FLOAT | Face match confidence |

Unique constraint on (student_id, date) prevents duplicate attendance.

## License

MIT
