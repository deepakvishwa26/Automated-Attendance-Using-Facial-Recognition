/**
 * AppLayout — Application shell with role-based navbar.
 *
 * Props:
 *  - currentPage: active page key
 *  - onNavigate: navigation handler
 *  - user: { role, name, admin_id|student_id }
 *  - onLogout: logout handler
 *  - children: page content
 */
export default function AppLayout({ currentPage, onNavigate, user, onLogout, children }) {
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="navbar-inner">
          <div
            className="navbar-brand"
            onClick={() => onNavigate(isAdmin ? 'dashboard' : 'my-attendance')}
            role="button"
            tabIndex={0}
          >
            <div className="navbar-brand-icon">S</div>
            Smart Attend
          </div>

          <div className="navbar-links">
            {/* Admin Navigation */}
            {isAdmin && (
              <>
                <button
                  className={`navbar-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                  onClick={() => onNavigate('dashboard')}
                >
                  Dashboard
                </button>
                <button
                  className={`navbar-link ${currentPage === 'students' ? 'active' : ''}`}
                  onClick={() => onNavigate('students')}
                >
                  Students
                </button>
                <button
                  className={`navbar-link ${currentPage === 'attendance-records' ? 'active' : ''}`}
                  onClick={() => onNavigate('attendance-records')}
                >
                  Attendance
                </button>
              </>
            )}

            {/* Student Navigation */}
            {isStudent && (
              <button
                className={`navbar-link ${currentPage === 'my-attendance' ? 'active' : ''}`}
                onClick={() => onNavigate('my-attendance')}
              >
                My Attendance
              </button>
            )}
          </div>

          <div className="navbar-actions">
            {isAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => onNavigate('attendance')}
              >
                Mark Attendance
              </button>
            )}

            {/* User info + Logout */}
            <div className="navbar-user">
              <span className="navbar-user-name">{user?.name}</span>
              <button className="btn btn-outline btn-sm" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
