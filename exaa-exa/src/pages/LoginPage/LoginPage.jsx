import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, LogIn, BookOpen } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Brief delay for UX feel
    await new Promise((r) => setTimeout(r, 400));

    const result = login(username, password);
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

        {/* Hint */}
        <p className="login-hint">
          Enter any username to access as student
        </p>
      </div>
    </div>
  );
}
