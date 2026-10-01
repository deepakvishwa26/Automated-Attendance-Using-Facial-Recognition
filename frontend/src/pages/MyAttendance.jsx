import { useState, useEffect, useCallback } from 'react';
import { getAttendanceSummary, updateStudentPreferences, getAttendanceHistory } from '../services/api';

/**
 * MyAttendance — Personalized student attendance dashboard.
 * Shown after a student is verified via face recognition.
 */
export default function MyAttendance({ studentId, studentName, onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAttendanceSummary(studentId);
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = (studentName || summary?.student_name || '').split(' ')[0];

  // --- Preference handlers ---

  const handleTargetChange = async (newTarget) => {
    setSaving(true);
    setSaveMessage('');
    try {
      await updateStudentPreferences(studentId, { attendance_target: parseInt(newTarget) });
      setSummary(prev => ({ ...prev, attendance_target: parseInt(newTarget) }));
      // Reload to recalculate status & outlook
      const data = await getAttendanceSummary(studentId);
      setSummary(data);
      setSaveMessage('✓ Preferences updated');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Unable to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleAlertToggle = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const newValue = !summary.alerts_enabled;
      await updateStudentPreferences(studentId, { alerts_enabled: newValue });
      setSummary(prev => ({ ...prev, alerts_enabled: newValue }));
      setSaveMessage('✓ Preferences updated');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Unable to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  // --- History ---

  const handleViewHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setHistoryLoading(true);
    try {
      const records = await getAttendanceHistory(studentId);
      setHistory(records);
      setShowHistory(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // --- Date formatting ---

  const formatRecordDate = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatFullDate = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // --- Loading state ---

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="page-header">
          <h1 className="page-title">Loading your attendance...</h1>
        </div>
        <div className="stat-cards stagger">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton skeleton-stat animate-slide-up" />
          ))}
        </div>
      </div>
    );
  }

  // --- Error state ---

  if (error) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>

        <div className="page-header">
          <h1 className="page-title">My Attendance</h1>
        </div>
        <div className="error-state">
          <p className="error-state-message">Unable to load your attendance.</p>
          <button className="btn btn-outline" onClick={loadSummary}>Try Again</button>
        </div>
      </div>
    );
  }

  // --- Empty state (no records yet) ---

  if (summary && summary.total_classes === 0) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>

        <div className="page-header">
          <h1 className="page-title">{getGreeting()}, {firstName} 👋</h1>
          <p className="page-subtitle">Here's your attendance overview.</p>
        </div>
        <div className="data-table-container">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No attendance records yet</div>
            <div className="empty-state-message">
              Your personalized attendance insights will appear after your first attendance is recorded.
            </div>
            <button className="btn btn-primary" onClick={() => onNavigate('attendance')}>
              Mark Attendance
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main dashboard ---

  const s = summary;
  const statusColors = {
    ON_TRACK: 'var(--success)',
    BELOW_TARGET: 'var(--warning, #F5A623)',
    NEEDS_ATTENTION: 'var(--error)',
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
      <button className="nav-back" onClick={() => onNavigate('dashboard')}>
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{getGreeting()}, {firstName} 👋</h1>
        <p className="page-subtitle">Here's your attendance overview.</p>
      </div>

      {/* Overall Attendance Hero */}
      <div className="card animate-slide-up" style={{ textAlign: 'center', padding: '2rem 1.5rem 1.5rem' }}>
        <div style={{
          fontSize: '3rem',
          fontWeight: 700,
          color: statusColors[s.attendance_status.status] || 'var(--text-primary)',
          lineHeight: 1.1,
          marginBottom: '0.25rem',
        }}>
          {s.attendance_percentage}%
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          Overall Attendance
        </div>
        <div style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          background: 'var(--bg-secondary)',
          borderRadius: '9999px',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}>
          Target: {s.attendance_target}%
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards stagger" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card animate-slide-up">
          <div className="stat-card-label">Present</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{s.present_count}</div>
        </div>
        <div className="stat-card animate-slide-up">
          <div className="stat-card-label">Absent</div>
          <div className="stat-card-value" style={{ color: 'var(--error)' }}>{s.absent_count}</div>
        </div>
        <div className="stat-card animate-slide-up">
          <div className="stat-card-label">Streak</div>
          <div className="stat-card-value">{s.streak} {s.streak === 1 ? 'day' : 'days'}</div>
        </div>
      </div>

      {/* Attendance Status */}
      <div className="card animate-slide-up">
        <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Attendance Status
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem', lineHeight: 1.4 }}>
            {s.attendance_status.emoji}
          </span>
          <div>
            <div style={{
              fontWeight: 600,
              color: statusColors[s.attendance_status.status] || 'var(--text-primary)',
              marginBottom: '0.25rem',
            }}>
              {s.attendance_status.label}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {s.attendance_status.message}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Outlook */}
      <div className="card animate-slide-up">
        <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Attendance Outlook
        </h3>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {s.classes_needed === 0 && (
            <span>✅ You're currently above your attendance target.</span>
          )}
          {s.classes_needed > 0 && (
            <span>
              📈 Attend your next <strong style={{ color: 'var(--text-primary)' }}>{s.classes_needed} {s.classes_needed === 1 ? 'class' : 'classes'}</strong> to reach your {s.attendance_target}% target.
            </span>
          )}
          {s.classes_needed === -1 && (
            <span>Target cannot be reached with consecutive attendance alone.</span>
          )}
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Attendance</h2>
        </div>

        {s.recent_attendance && s.recent_attendance.length > 0 ? (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {s.recent_attendance.map(record => (
                  <tr key={record.id}>
                    <td className="cell-name">{formatRecordDate(record.date)}</td>
                    <td>
                      {record.status === 'present' ? (
                        <span className="status-dot present">✓ Present</span>
                      ) : (
                        <span className="status-dot absent">✕ Absent</span>
                      )}
                    </td>
                    <td className="cell-secondary">{record.time || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="data-table-container">
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <div className="empty-state-message">No recent attendance records.</div>
            </div>
          </div>
        )}

        {/* View History Button */}
        <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          <button
            className="btn btn-outline"
            onClick={handleViewHistory}
            disabled={historyLoading}
          >
            {historyLoading ? 'Loading...' : showHistory ? 'Hide Attendance History' : 'View Attendance History'}
          </button>
        </div>

        {/* Full History */}
        {showHistory && history.length > 0 && (
          <div className="data-table-container animate-slide-up" style={{ marginTop: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record.id}>
                    <td className="cell-name">{formatFullDate(record.date)}</td>
                    <td>
                      {record.status === 'present' ? (
                        <span className="status-dot present">✓ Present</span>
                      ) : (
                        <span className="status-dot absent">✕ Absent</span>
                      )}
                    </td>
                    <td className="cell-secondary">
                      {record.time
                        ? (typeof record.time === 'string'
                            ? record.time
                            : new Date(`2000-01-01T${record.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }))
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showHistory && history.length === 0 && (
          <div className="data-table-container" style={{ marginTop: '1rem' }}>
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <div className="empty-state-message">No attendance history found.</div>
            </div>
          </div>
        )}
      </div>

      {/* Personal Settings */}
      <div className="card animate-slide-up">
        <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Personal Settings
        </h3>

        {/* Attendance Target */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" htmlFor="attendance-target">
            Attendance Target
          </label>
          <select
            id="attendance-target"
            className="filter-select"
            value={s.attendance_target}
            onChange={(e) => handleTargetChange(e.target.value)}
            disabled={saving}
            style={{ width: '100%', maxWidth: 200 }}
          >
            <option value={75}>75%</option>
            <option value={80}>80%</option>
            <option value={85}>85%</option>
            <option value={90}>90%</option>
            <option value={95}>95%</option>
          </select>
        </div>

        {/* Low Attendance Alert */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Low Attendance Alert
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                Notify me when my attendance falls below my target.
              </div>
            </div>
            <button
              className={`toggle-btn ${s.alerts_enabled ? 'active' : ''}`}
              onClick={handleAlertToggle}
              disabled={saving}
              aria-label="Toggle attendance alerts"
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>

        {/* Save feedback */}
        {saveMessage && (
          <div style={{
            marginTop: '0.75rem',
            fontSize: '0.8125rem',
            color: saveMessage.startsWith('✓') ? 'var(--success)' : 'var(--error)',
            fontWeight: 500,
          }}>
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
}
