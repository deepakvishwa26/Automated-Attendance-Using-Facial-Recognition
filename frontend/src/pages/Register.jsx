import { useState } from 'react';
import Camera from '../components/Camera';
import { registerStudent } from '../services/api';

/**
 * Registration Page
 * Step 1: Fill in student details
 * Step 2: Capture face
 * Step 3: Submit registration
 */
export default function Register({ onNavigate }) {
  const [step, setStep] = useState(1); // 1=form, 2=camera, 3=result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    department: '',
    year: '',
    email: '',
  });

  const [faceImage, setFaceImage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.student_id.trim()) return 'Student ID is required';
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.department.trim()) return 'Department is required';
    if (!formData.year || isNaN(formData.year) || formData.year < 1 || formData.year > 6) {
      return 'Year must be between 1 and 6';
    }
    return null;
  };

  const handleProceedToCamera = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleCapture = (base64Image) => {
    setFaceImage(base64Image);
  };

  const handleRegister = async () => {
    if (!faceImage) {
      setError('Please capture your face first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        year: parseInt(formData.year, 10),
        face_image: faceImage,
      };

      const response = await registerStudent(data);
      setResult(response);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <button className="nav-back" onClick={() => onNavigate('home')}>
        ← Back to Home
      </button>

      <div className="app-header" style={{ marginBottom: '1.5rem' }}>
        <h1>👤 Student Registration</h1>
        <p>Enroll with your details and face capture</p>
      </div>

      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`status-badge ${s === step ? 'status-info' : s < step ? 'status-success' : ''}`}
            style={{ opacity: s > step ? 0.3 : 1 }}
          >
            {s === 1 ? '① Details' : s === 2 ? '② Face Capture' : '③ Complete'}
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Student Details Form */}
      {step === 1 && (
        <div className="card animate-slide-up">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="student_id">Student ID *</label>
              <input
                id="student_id"
                className="form-input"
                type="text"
                name="student_id"
                placeholder="e.g. TEST001"
                value={formData.student_id}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name *</label>
              <input
                id="name"
                className="form-input"
                type="text"
                name="name"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="department">Department *</label>
              <input
                id="department"
                className="form-input"
                type="text"
                name="department"
                placeholder="e.g. CSE"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="year">Year *</label>
              <input
                id="year"
                className="form-input"
                type="number"
                name="year"
                placeholder="e.g. 2"
                min="1"
                max="6"
                value={formData.year}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email (Optional)</label>
            <input
              id="email"
              className="form-input"
              type="email"
              name="email"
              placeholder="e.g. student@university.edu"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={handleProceedToCamera}
            style={{ marginTop: '1rem' }}
          >
            Next → Capture Face
          </button>
        </div>
      )}

      {/* Step 2: Face Capture */}
      {step === 2 && (
        <div className="card animate-slide-up">
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Capture Your Face</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Look directly at the camera and position your face within the guide
            </p>
          </div>

          <Camera onCapture={handleCapture} isActive={step === 2} />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => { setStep(1); setFaceImage(null); }}
            >
              ← Back
            </button>
            <button
              className="btn btn-success btn-lg"
              style={{ flex: 1 }}
              onClick={handleRegister}
              disabled={!faceImage || loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Registering...
                </>
              ) : (
                '✓ Register Student'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && result && (
        <div className="card result-card result-success animate-slide-up">
          <div className="result-icon">🎉</div>
          <div className="result-title">Registration Successful!</div>
          <div className="result-message">{result.message}</div>

          {result.student && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>STUDENT INFO</div>
              <div><strong>ID:</strong> {result.student.student_id}</div>
              <div><strong>Name:</strong> {result.student.name}</div>
              <div><strong>Department:</strong> {result.student.department}</div>
              <div><strong>Year:</strong> {result.student.year}</div>
              {result.student.email && <div><strong>Email:</strong> {result.student.email}</div>}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('attendance')}>
              Mark Attendance →
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate('home')}>
              Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
