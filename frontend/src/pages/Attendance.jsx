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

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <button className="nav-back" onClick={() => onNavigate('dashboard')}>
        ← Back to Dashboard
      </button>

      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 className="page-title">Mark Attendance</h1>
        <p className="page-subtitle">Verify your identity to record attendance.</p>
      </div>

      {/* Error display */}
      {error && (
        <div className="alert alert-error">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Enter Student ID */}
      {step === 1 && (
        <div className="card animate-slide-up">
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
          <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
            <div className="status-badge status-info" style={{ marginBottom: '0.5rem' }}>
              Student ID: {studentId}
            </div>
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
              {verifying ? 'Verifying Identity...' : 'Verify Your Identity'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {verifying
                ? 'Please wait while we verify your face...'
                : 'Position your face and capture to verify.'}
            </p>
          </div>

          {verifying && (
            <div className="loading-overlay">
              <div className="spinner spinner-lg"></div>
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

          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
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
            <div className="card result-card">
              <div className="result-icon success">✓</div>
              <div className="result-title">Attendance Marked</div>
              <div className="result-message">Your attendance has been recorded successfully.</div>

              {result.student && (
                <div className="result-details">
                  <div className="result-detail-row">
                    <span className="result-detail-label">Name</span>
                    <span className="result-detail-value">{result.student.name}</span>
                  </div>
                  <div className="result-detail-row">
                    <span className="result-detail-label">Student ID</span>
                    <span className="result-detail-value">{studentId}</span>
                  </div>
                  <div className="result-detail-row">
                    <span className="result-detail-label">Date</span>
                    <span className="result-detail-value">{formatDate()}</span>
                  </div>
                  <div className="result-detail-row">
                    <span className="result-detail-label">Time</span>
                    <span className="result-detail-value">{formatTime()}</span>
                  </div>
                  <div className="result-detail-row">
                    <span className="result-detail-label">Confidence</span>
                    <span className="result-detail-value">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Already Marked */}
          {result.type === 'already_marked' && (
            <div className="card result-card">
              <div className="result-icon warning">!</div>
              <div className="result-title">Already Marked</div>
              <div className="result-message">
                {result.message || 'Identity verified but attendance was already recorded today.'}
              </div>
              {result.student && (
                <div className="result-details">
                  <div className="result-detail-row">
                    <span className="result-detail-label">Name</span>
                    <span className="result-detail-value">{result.student.name}</span>
                  </div>
                  <div className="result-detail-row">
                    <span className="result-detail-label">Confidence</span>
                    <span className="result-detail-value">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verification Failed */}
          {result.type === 'verification_failed' && (
            <div className="card result-card">
              <div className="result-icon error">✗</div>
              <div className="result-title">Verification Failed</div>
              <div className="result-message">{result.message}</div>
              <div className="result-details">
                <div className="result-detail-row">
                  <span className="result-detail-label">Confidence</span>
                  <span className="result-detail-value">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            {result.type === 'verification_failed' && (
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Try Again
              </button>
            )}
            {(result.type === 'marked' || result.type === 'already_marked') && (
              <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
                Done
              </button>
            )}
            <button className="btn btn-outline" onClick={handleReset}>
              New Attendance
            </button>
          </div>

          {/* History */}
          {showHistory && history.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                Attendance History — {studentId}
              </h3>
              <ul className="history-list">
                {history.map(record => (
                  <li key={record.id} className="history-item">
                    <div>
                      <div className="history-date">{record.date}</div>
                      <div className="history-time">{record.time}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="status-dot present">{record.status}</span>
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
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-state-message">No attendance records found for {studentId}.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
