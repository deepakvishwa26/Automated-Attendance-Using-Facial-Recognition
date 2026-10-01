import { useState, useEffect } from 'react';
import { getStoredUser, getAuthToken, logout as apiLogout, clearAuthToken } from './services/api';

// Layout
import AppLayout from './components/AppLayout';

// Auth pages (no layout shell)
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import StudentLogin from './pages/StudentLogin';

// Admin pages
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import AttendanceRecords from './pages/AttendanceRecords';
import Register from './pages/Register';
import Attendance from './pages/Attendance';

// Student pages
import MyAttendance from './pages/MyAttendance';

/**
 * App — Root component with authentication and role-based routing.
 *
 * Auth flow:
 *   Landing → Admin Login → Admin Dashboard
 *   Landing → Student Login → Student Dashboard (My Attendance)
 */
function App() {
  const [user, setUser] = useState(null);        // { role, name, admin_id|student_id }
  const [page, setPage] = useState('landing');
  const [authChecked, setAuthChecked] = useState(false);

  // ── Restore session on mount ──
  useEffect(() => {
    const token = getAuthToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      setUser(storedUser);
      // Route to the correct dashboard
      if (storedUser.role === 'ADMIN') {
        setPage('dashboard');
      } else if (storedUser.role === 'STUDENT') {
        setPage('my-attendance');
      }
    }
    setAuthChecked(true);
  }, []);

  const navigate = (target) => {
    setPage(target);
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.role === 'ADMIN') {
      setPage('dashboard');
    } else if (userData.role === 'STUDENT') {
      setPage('my-attendance');
    }
  };

  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
    setPage('landing');
  };

  // ── Wait for auth check ──
  if (!authChecked) return null;

  // ── Unauthenticated pages ──
  if (!user) {
    if (page === 'admin-login') {
      return <AdminLogin onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
    }
    if (page === 'student-login') {
      return <StudentLogin onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
    }
    return <LandingPage onNavigate={navigate} />;
  }

  // ── Admin pages ──
  if (user.role === 'ADMIN') {
    return (
      <AppLayout currentPage={page} onNavigate={navigate} user={user} onLogout={handleLogout}>
        {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {page === 'students' && <Students onNavigate={navigate} />}
        {page === 'attendance-records' && <AttendanceRecords onNavigate={navigate} />}
        {page === 'register' && <Register onNavigate={navigate} />}
        {page === 'attendance' && <Attendance onNavigate={navigate} />}
      </AppLayout>
    );
  }

  // ── Student pages ──
  if (user.role === 'STUDENT') {
    return (
      <AppLayout currentPage={page} onNavigate={navigate} user={user} onLogout={handleLogout}>
        {page === 'my-attendance' && (
          <MyAttendance
            studentId={user.student_id}
            studentName={user.name}
            onNavigate={navigate}
          />
        )}
        {page === 'attendance' && <Attendance onNavigate={navigate} />}
      </AppLayout>
    );
  }

  return <LandingPage onNavigate={navigate} />;
}

export default App;
