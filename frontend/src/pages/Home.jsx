/**
 * Home Page
 * Two primary actions: Register Student and Mark Attendance.
 */
export default function Home({ onNavigate }) {
  return (
    <div className="animate-fade-in">
      <div className="app-header">
        <h1>🎓 Automated Attendance System</h1>
        <p>Facial Recognition Based Attendance Tracking</p>
      </div>

      <div className="home-actions stagger">
        <div className="card card-hover action-card animate-slide-up" onClick={() => onNavigate('register')}>
          <span className="action-icon">👤</span>
          <div className="card-title">Register Student</div>
          <div className="card-description">
            Enroll a new student with face capture for identity verification
          </div>
        </div>

        <div className="card card-hover action-card animate-slide-up" onClick={() => onNavigate('attendance')}>
          <span className="action-icon">✅</span>
          <div className="card-title">Mark Attendance</div>
          <div className="card-description">
            Verify your identity and record your attendance with face scan
          </div>
        </div>
      </div>
    </div>
  );
}
