import { useState, useEffect } from 'react';
import { getDashboardStats, getTodayAttendance, listStudents } from '../services/api';

/**
 * Dashboard Page — Main overview with stats, today's attendance, and registered students.
 */
export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [todayRecords, setTodayRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, todayData, studentsData] = await Promise.all([
        getDashboardStats(),
        getTodayAttendance(),
        listStudents(),
      ]);
      setStats(statsData);
      setTodayRecords(todayData);
      setStudents(studentsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getYearLabel = (year) => {
    if (!year) return '—';
    const suffixes = ['st', 'nd', 'rd'];
    const suffix = year <= 3 ? suffixes[year - 1] : 'th';
    return `${year}${suffix} Year`;
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Attendance Overview</h1>
          <p className="page-subtitle">Monitor student registration and today's attendance.</p>
        </div>
        <div className="stat-cards stagger">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton skeleton-stat animate-slide-up" />
          ))}
        </div>
        <div className="section">
          <div className="data-table-container">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton skeleton-row" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Attendance Overview</h1>
        </div>
        <div className="error-state">
          <p className="error-state-message">Unable to load dashboard data.</p>
          <button className="btn btn-outline" onClick={loadData}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Attendance Overview</h1>
            <p className="page-subtitle">Monitor student registration and today's attendance.</p>
          </div>
          <p className="page-date">{formatDate()}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards stagger">
        <div className="stat-card animate-slide-up">
          <div className="stat-card-label">
            <span className="stat-card-icon">👥</span>
            Total Students
          </div>
          <div className="stat-card-value">{stats?.total_students ?? 0}</div>
        </div>
        <div className="stat-card animate-slide-up">
          <div className="stat-card-label">
            <span className="stat-card-icon">✓</span>
            Present Today
          </div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>
            {stats?.present_today ?? 0}
          </div>
        </div>
        <div className="stat-card animate-slide-up">
          <div className="stat-card-label">
            <span className="stat-card-icon">✗</span>
            Absent Today
          </div>
          <div className="stat-card-value" style={{ color: 'var(--error)' }}>
            {stats?.absent_today ?? 0}
          </div>
        </div>
        <div className="stat-card animate-slide-up">
          <div className="stat-card-label">
            <span className="stat-card-icon">%</span>
            Attendance Rate
          </div>
          <div className="stat-card-value">{stats?.attendance_rate ?? 0}%</div>
        </div>
      </div>

      {/* Today's Attendance */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Today's Attendance</h2>
          <button className="section-link" onClick={() => onNavigate('attendance-records')}>
            View All →
          </button>
        </div>

        {todayRecords.length === 0 ? (
          <div className="data-table-container">
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No attendance recorded today</div>
              <div className="empty-state-message">Mark your first attendance to get started.</div>
              <button className="btn btn-primary" onClick={() => onNavigate('attendance')}>
                Mark Attendance
              </button>
            </div>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Department</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.map(record => (
                  <tr key={record.id}>
                    <td className="cell-name">{record.name}</td>
                    <td className="cell-secondary">{record.student_id}</td>
                    <td className="cell-secondary">{record.department}</td>
                    <td className="cell-secondary">{record.time}</td>
                    <td>
                      <span className={`status-dot ${record.status === 'present' ? 'present' : 'absent'}`}>
                        {record.status === 'present' ? 'Present' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registered Students */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Registered Students</h2>
          <button className="btn btn-primary" onClick={() => onNavigate('register')}>
            + Register Student
          </button>
        </div>

        {students.length === 0 ? (
          <div className="data-table-container">
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <div className="empty-state-title">No students registered yet</div>
              <div className="empty-state-message">Register your first student to get started.</div>
              <button className="btn btn-primary" onClick={() => onNavigate('register')}>
                + Register Student
              </button>
            </div>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Face Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.student_id}>
                    <td className="cell-name">{student.name}</td>
                    <td className="cell-secondary">{student.student_id}</td>
                    <td className="cell-secondary">{student.department}</td>
                    <td className="cell-secondary">{getYearLabel(student.year)}</td>
                    <td>
                      {student.has_face ? (
                        <span className="status-dot registered">Registered</span>
                      ) : (
                        <span className="status-dot absent">Not Registered</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
