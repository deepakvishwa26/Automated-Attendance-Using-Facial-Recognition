import { useState } from 'react';
import { studentLogin } from '../services/api';

/**
 * StudentLogin — Student authentication page.
 * Students log in with their registered Student ID.
 */
export default function StudentLogin({ onNavigate, onLoginSuccess }) {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await studentLogin(studentId);
      onLoginSuccess({
        role: 'STUDENT',
        student_id: result.student_id,
        name: result.name,
        token: result.token,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container animate-fade-in">
        <button className="nav-back" onClick={() => onNavigate('landing')}>
          ← Back
        </button>

        <div className="login-header">
          <div className="landing-brand-icon" style={{ margin: '0 auto 0.75rem' }}>S</div>
          <h1 className="login-title">Student Login</h1>
          <p className="login-subtitle">Access your personalized attendance</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="student-id-input">Student ID</label>
            <input
              id="student-id-input"
              type="text"
              className="form-input"
              placeholder="e.g. 23CS001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.toUpperCase())}
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="form-error animate-slide-up">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !studentId.trim()}
          >
            {loading ? 'Verifying...' : 'Continue →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Don't have a Student ID? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
