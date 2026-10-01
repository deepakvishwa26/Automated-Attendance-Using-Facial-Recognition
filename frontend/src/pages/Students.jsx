import { useState, useEffect, useCallback } from 'react';
import { listStudents } from '../services/api';

/**
 * Students Page — View and search registered students.
 */
export default function Students({ onNavigate }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStudents({
        search: search || undefined,
        department: department || undefined,
      });
      setStudents(data);

      // Build unique department list from all students (unfiltered fetch on first load)
      if (departments.length === 0 && !search && !department) {
        const depts = [...new Set(data.map(s => s.department).filter(Boolean))].sort();
        setDepartments(depts);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, department]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, search ? 300 : 0); // debounce search
    return () => clearTimeout(timer);
  }, [loadStudents]);

  const getYearLabel = (year) => {
    if (!year) return '—';
    const suffixes = ['st', 'nd', 'rd'];
    const suffix = year <= 3 ? suffixes[year - 1] : 'th';
    return `${year}${suffix} Year`;
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Students</h1>
            <p className="page-subtitle">Manage registered students.</p>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('register')}>
            + Register Student
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
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
          <p className="error-state-message">Unable to load students.</p>
          <button className="btn btn-outline" onClick={loadStudents}>Try Again</button>
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
      {!loading && !error && students.length === 0 && (
        <div className="data-table-container">
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-title">
              {search || department ? 'No students found' : 'No students registered yet'}
            </div>
            <div className="empty-state-message">
              {search || department
                ? 'Try adjusting your search or filters.'
                : 'Register your first student to get started.'}
            </div>
            {!search && !department && (
              <button className="btn btn-primary" onClick={() => onNavigate('register')}>
                + Register Student
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && students.length > 0 && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
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
  );
}
