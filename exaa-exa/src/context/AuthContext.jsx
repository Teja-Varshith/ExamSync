import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem('examsync_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('examsync_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('examsync_user');
    }
  }, [user]);

  const login = (username, password) => {
    if (username === 'admin' && password === '123456') {
      setUser({ username: 'admin', role: 'admin', name: 'Administrator' });
      return { success: true, role: 'admin' };
    }
    // Any other credentials → student
    if (username.trim()) {
      setUser({ username: username.trim(), role: 'student', name: username.trim() });
      return { success: true, role: 'student' };
    }
    return { success: false, error: 'Please enter a username' };
  };

  const logout = () => {
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
