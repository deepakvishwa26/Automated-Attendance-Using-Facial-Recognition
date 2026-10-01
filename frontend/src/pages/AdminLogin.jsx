import { useState } from 'react';
import { adminLogin } from '../services/api';

/**
 * AdminLogin — Admin authentication page.
 */
export default function AdminLogin({ onNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await adminLogin(email, password);
      onLoginSuccess({
        role: 'ADMIN',
        admin_id: result.admin_id,
        name: result.name,
        token: result.token,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container animate-fade-in">
        <button className="nav-back" onClick={() => onNavigate('landing')}>
          ← Back
        </button>

        <div className="login-header">
          <div className="landing-brand-icon" style={{ margin: '0 auto 0.75rem' }}>S</div>
          <h1 className="login-title">Admin Login</h1>
          <p className="login-subtitle">Sign in to manage your attendance system</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="text"
              className="form-input"
              placeholder="admin@smartattend.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="form-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="form-error animate-slide-up">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
