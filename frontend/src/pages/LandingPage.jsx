/**
 * LandingPage — Application entry point with Admin / Student login options.
 */
export default function LandingPage({ onNavigate }) {
  return (
    <div className="landing-page">
      <div className="landing-container animate-fade-in">
        {/* Brand */}
        <div className="landing-brand">
          <div className="landing-brand-icon">S</div>
          <h1 className="landing-title">Smart Attend</h1>
          <p className="landing-subtitle">Automated Attendance Using Facial Recognition</p>
        </div>

        {/* Login Options */}
        <div className="landing-options">
          <button
            className="landing-option-btn admin"
            onClick={() => onNavigate('admin-login')}
          >
            <span className="landing-option-icon">🔐</span>
            <span className="landing-option-label">Admin Login</span>
            <span className="landing-option-desc">Manage students & attendance</span>
          </button>

          <button
            className="landing-option-btn student"
            onClick={() => onNavigate('student-login')}
          >
            <span className="landing-option-icon">🎓</span>
            <span className="landing-option-label">Student Login</span>
            <span className="landing-option-desc">Access your personalized attendance</span>
          </button>
        </div>

        <p className="landing-footer">
          Facial recognition powered attendance management system
        </p>
      </div>
    </div>
  );
}
