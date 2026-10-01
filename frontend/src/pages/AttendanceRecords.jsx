import { useState, useEffect, useCallback } from 'react';
import { listAttendanceRecords } from '../services/api';

/**
 * AttendanceRecords Page — View attendance records with filters.
 */
export default function AttendanceRecords({ onNavigate }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAttendanceRecords({
        search: search || undefined,
        date: dateFilter || undefined,
        department: department || undefined,
      });
      setRecords(data);

      // Build department list from first unfiltered load
      if (departments.length === 0 && !search && !dateFilter && !department) {
        const depts = [...new Set(data.map(r => r.department).filter(d => d && d !== '—'))].sort();
        setDepartments(depts);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, dateFilter, department]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecords();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadRecords]);

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Attendance</h1>
            <p className="page-subtitle">View attendance records.</p>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('attendance')}>
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input
          className="filter-select"
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ paddingRight: '0.75rem' }}
        />
        {departments.length > 0 && (
          <select
            className="filter-select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="error-state">
          <p className="error-state-message">Unable to load attendance records.</p>
          <button className="btn btn-outline" onClick={loadRecords}>Try Again</button>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="data-table-container">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && records.length === 0 && (
        <div className="data-table-container">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">
              {search || dateFilter || department ? 'No records found' : 'No attendance recorded yet'}
            </div>
            <div className="empty-state-message">
              {search || dateFilter || department
                ? 'Try adjusting your search or filters.'
                : 'Mark attendance to start tracking.'}
            </div>
            {!search && !dateFilter && !department && (
              <button className="btn btn-primary" onClick={() => onNavigate('attendance')}>
                Mark Attendance
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && records.length > 0 && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Department</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id}>
                  <td className="cell-name">{record.name}</td>
                  <td className="cell-secondary">{record.student_id}</td>
                  <td className="cell-secondary">{record.department}</td>
                  <td className="cell-secondary">{formatDate(record.date)}</td>
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
  );
}
