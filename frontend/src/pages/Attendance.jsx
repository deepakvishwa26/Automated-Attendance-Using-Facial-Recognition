import { useState } from 'react';
import Camera from '../components/Camera';
import { verifyFace, markAttendance, getAttendanceHistory } from '../services/api';

/**
 * Attendance Page
 * Step 1: Enter Student ID
 * Step 2: Face verification via camera
 * Step 3: Show result (success/failure)
 */
export default function Attendance({ onNavigate }) {
  const [step, setStep] = useState(1); // 1=id, 2=camera, 3=result
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleProceedToCamera = () => {
    if (!studentId.trim()) {
      setError('Please enter your Student ID.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleCapture = async (base64Image) => {
    setVerifying(true);
    setError(null);

    try {
      // Step 1: Verify face
      const verifyResult = await verifyFace(studentId, base64Image);

      if (!verifyResult.verified) {
        setResult({
          success: false,
          type: 'verification_failed',
          message: verifyResult.message,
          confidence: verifyResult.confidence,
        });
        setStep(3);
        return;
      }

      // Step 2: Mark attendance
      const attendanceResult = await markAttendance(studentId, verifyResult.confidence);

      if (attendanceResult.alreadyMarked) {
        setResult({
          success: false,
          type: 'already_marked',
          message: attendanceResult.message,
          student: verifyResult.student,
          confidence: verifyResult.confidence,
        });
      } else {
        setResult({
          success: true,
          type: 'marked',
          message: attendanceResult.message,
          student: verifyResult.student,
          attendance: attendanceResult.attendance,
          confidence: verifyResult.confidence,
        });
      }
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleShowHistory = async () => {
    try {
      const records = await getAttendanceHistory(studentId);
      setHistory(records);
      setShowHistory(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = () => {
    setStep(1);
    setStudentId('');
    setResult(null);
    setError(null);
    setShowHistory(false);
    setHistory([]);
  };

  return (
    <div className="animate-fade-in">
      <button className="nav-back" onClick={() => onNavigate('home')}>
        ← Back to Home
      </button>

      <div className="app-header" style={{ marginBottom: '1.5rem' }}>
        <h1>✅ Mark Attendance</h1>
        <p>Verify your identity to record attendance</p>
      </div>

      {/* Error display */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Enter Student ID */}
      {step === 1 && (
        <div className="card animate-slide-up" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="attendance-student-id">Student ID</label>
            <input
              id="attendance-student-id"
              className="form-input"
              type="text"
              placeholder="Enter your Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProceedToCamera()}
            />
          </div>
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={handleProceedToCamera}
          >
            Verify Face →
          </button>
        </div>
      )}

      {/* Step 2: Camera */}
      {step === 2 && (
        <div className="card animate-slide-up">
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div className="status-badge status-info" style={{ marginBottom: '0.75rem' }}>
              Student ID: {studentId}
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
              {verifying ? 'Verifying Identity...' : 'Look at the Camera'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {verifying
                ? 'Please wait while we verify your face...'
                : 'Position your face and capture to verify'}
            </p>
          </div>

          {verifying && (
            <div className="loading-overlay">
              <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--primary-400)' }}></div>
              <span>Analyzing face and verifying identity...</span>
            </div>
          )}

          {!verifying && (
            <Camera
              onCapture={handleCapture}
              isActive={step === 2 && !verifying}
              statusText={verifying ? 'Verifying...' : ''}
            />
          )}

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => { setStep(1); setError(null); }}>
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && result && (
        <div className="animate-slide-up">
          {/* Success: Attendance Marked */}
          {result.type === 'marked' && (
            <div className="card result-card result-success">
              <div className="result-icon">🎉</div>
              <div className="result-title">Attendance Marked!</div>
              <div className="result-message">{result.message}</div>

              <div style={{
                display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem'
              }}>
                <div className="status-badge status-success">
                  ✓ Verified ({(result.confidence * 100).toFixed(1)}%)
                </div>
                <div className="status-badge status-info">
                  📅 {result.attendance?.date}
                </div>
              </div>

              {result.student && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}>
                  <div><strong>Name:</strong> {result.student.name}</div>
                  <div><strong>Department:</strong> {result.student.department}</div>
                  <div><strong>Year:</strong> {result.student.year}</div>
                </div>
              )}
            </div>
          )}

          {/* Already Marked */}
          {result.type === 'already_marked' && (
            <div className="card result-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <div className="result-icon">ℹ️</div>
              <div className="result-title" style={{ color: 'var(--warning-500)' }}>
                Already Marked
              </div>
              <div className="result-message">{result.message}</div>
              <div className="status-badge status-warning">
                Identity verified but attendance was already recorded today
              </div>
            </div>
          )}

          {/* Verification Failed */}
          {result.type === 'verification_failed' && (
            <div className="card result-card result-failure">
              <div className="result-icon">❌</div>
              <div className="result-title">Verification Failed</div>
              <div className="result-message">{result.message}</div>
              <div className="status-badge status-error">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            {result.type === 'verification_failed' && (
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                🔄 Try Again
              </button>
            )}
            <button className="btn btn-outline" onClick={handleShowHistory}>
              📋 View History
            </button>
            <button className="btn btn-outline" onClick={handleReset}>
              New Attendance
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate('home')}>
              Home
            </button>
          </div>

          {/* History */}
          {showHistory && history.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>
                📋 Attendance History for {studentId}
              </h3>
              <ul className="history-list">
                {history.map(record => (
                  <li key={record.id} className="history-item">
                    <div>
                      <div className="history-date">{record.date}</div>
                      <div className="history-time">{record.time}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="status-badge status-success" style={{ fontSize: '0.7rem' }}>
                        {record.status}
                      </div>
                      {record.confidence && (
                        <div className="history-confidence">
                          {(record.confidence * 100).toFixed(1)}% match
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showHistory && history.length === 0 && (
            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              No attendance records found for {studentId}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
