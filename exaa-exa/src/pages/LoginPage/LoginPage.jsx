import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, LogIn, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [collegeCode, setCollegeCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password, collegeCode);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <BookOpen size={28} strokeWidth={2.5} />
          </div>
          <h1 className="login-title">ExamSync</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="login-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Password</label>
            <div className="login-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="collegeCode">
              College Code <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(Admin only)</span>
            </label>
            <input
              id="collegeCode"
              type="text"
              className="login-input"
              placeholder="e.g. gmrit (leave empty for student)"
              value={collegeCode}
              onChange={(e) => setCollegeCode(e.target.value)}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="login-spinner" />
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Hints */}
        <p className="login-hint">
          Enter any username to access as student · Fill college code for admin
        </p>
        <p className="login-hint" style={{ marginTop: '8px' }}>
          <Link to="/author" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Login as Author →
          </Link>
        </p>
      </div>
    </div>
  );
}
