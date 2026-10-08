import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../LoginPage/LoginPage.css';
import './AuthorLoginPage.css';

export default function AuthorLoginPage() {
  const { loginAuthor } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [collegeCode, setCollegeCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginAuthor(username, password, collegeCode);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="login-page author-login">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <BookOpen size={28} strokeWidth={2.5} />
          </div>
          <h1 className="login-title">ExamSync</h1>
          <p className="login-subtitle">Author / Examite Login</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label" htmlFor="author-username">Username</label>
            <input
              id="author-username"
              type="text"
              className="login-input"
              placeholder="Enter your registered username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="author-password">Password</label>
            <input
              id="author-password"
              type="password"
              className="login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="author-college">College Code</label>
            <input
              id="author-college"
              type="text"
              className="login-input"
              placeholder="e.g. gmrit"
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
                Sign In as Author
              </>
            )}
          </button>
        </form>

        {/* Hint */}
        <p className="login-hint">
          Your username and password must be registered by your college admin
        </p>
        <p className="login-hint" style={{ marginTop: '8px' }}>
          <Link to="/login" style={{ color: '#FFD700', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to Admin / Student Login
          </Link>
        </p>
      </div>
    </div>
  );
}
