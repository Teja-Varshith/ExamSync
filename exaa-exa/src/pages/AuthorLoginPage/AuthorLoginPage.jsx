import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, User, Lock, Building2, AlertCircle } from 'lucide-react';
import NeoButton from '../../components/ui/NeoButton';
import AuthLayout from '../LoginPage/AuthLayout';

export default function AuthorLoginPage() {
  const { loginAuthor } = useAuth();
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

    const result = await loginAuthor(username, password, collegeCode);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      role="author"
      title="Author sign in"
      subtitle="Use the credentials your college admin registered for you as an examite."
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="neo-field">
          <label className="neo-label" htmlFor="author-college">College code</label>
          <div className="neo-input-wrap">
            <Building2 size={18} />
            <input
              id="author-college"
              type="text"
              className="neo-input"
              placeholder="e.g. gmrit"
              value={collegeCode}
              onChange={(e) => setCollegeCode(e.target.value)}
              autoComplete="organization"
              autoCapitalize="none"
              autoFocus
            />
          </div>
        </div>

        <div className="neo-field">
          <label className="neo-label" htmlFor="author-username">Username</label>
          <div className="neo-input-wrap">
            <User size={18} />
            <input
              id="author-username"
              type="text"
              className="neo-input"
              placeholder="Your registered username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>
        </div>

        <div className="neo-field">
          <label className="neo-label" htmlFor="author-password">Password</label>
          <div className="neo-input-wrap">
            <Lock size={18} />
            <input
              id="author-password"
              type={showPassword ? 'text' : 'password'}
              className="neo-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="neo-input-action"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="neo-alert neo-alert--error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <NeoButton type="submit" size="big" fullWidth loading={loading} showArrow={!loading}>
          {loading ? 'Signing in…' : 'Sign in as Author'}
        </NeoButton>
      </form>
    </AuthLayout>
  );
}
