import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

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

  /**
   * Admin login: checks Firestore examsync/{collegeId} document for matching credentials.
   * Student login: if no collegeId is provided, any username logs in as student.
   */
  const login = async (username, password, collegeId) => {
    if (!username.trim()) {
      return { success: false, error: 'Please enter a username' };
    }

    // If collegeId is provided, attempt admin login via Firestore
    if (collegeId && collegeId.trim()) {
      try {
        const cid = collegeId.trim().toLowerCase();
        const collegeRef = doc(db, 'examsync', cid);
        const collegeSnap = await getDoc(collegeRef);

        if (!collegeSnap.exists()) {
          return { success: false, error: 'College not found. Check your college code.' };
        }

        const data = collegeSnap.data();
        const admins = data.admins || [];

        const matchedAdmin = admins.find(
          (a) => a.username === username.trim() && a.password === password
        );

        if (matchedAdmin) {
          setUser({
            username: matchedAdmin.username,
            role: 'admin',
            name: matchedAdmin.name || 'Administrator',
            adminRole: matchedAdmin.role || 'Admin',
            collegeId: cid,
            collegeName: data.name || cid.toUpperCase(),
          });
          return { success: true, role: 'admin' };
        }

        return { success: false, error: 'Invalid username or password for this college' };
      } catch (err) {
        console.error('Admin login error:', err);
        return { success: false, error: 'Login failed. Please try again.' };
      }
    }

    // No collegeId → student login (existing behavior)
    setUser({ username: username.trim(), role: 'student', name: username.trim() });
    return { success: true, role: 'student' };
  };

  /**
   * Author/Examite login: checks if email exists in examsync/{collegeId}/examites array.
   */
  const loginAuthor = async (username, password, collegeId) => {
    if (!username.trim() || !password.trim()) {
      return { success: false, error: 'Please enter your username and password' };
    }
    if (!collegeId || !collegeId.trim()) {
      return { success: false, error: 'Please enter your college code' };
    }

    try {
      const cid = collegeId.trim().toLowerCase();
      const collegeRef = doc(db, 'examsync', cid);
      const collegeSnap = await getDoc(collegeRef);

      if (!collegeSnap.exists()) {
        return { success: false, error: 'College not found. Check your college code.' };
      }

      const data = collegeSnap.data();
      const examites = data.examites || [];

      const matchedExamite = examites.find(
        (e) => e.username.toLowerCase() === username.trim().toLowerCase() && e.password === password
      );

      if (matchedExamite) {
        setUser({
          username: matchedExamite.username,
          role: 'author',
          name: matchedExamite.username || 'Author',
          subjects: matchedExamite.subjects || [],
          collegeId: cid,
          collegeName: data.name || cid.toUpperCase(),
        });
        return { success: true, role: 'author' };
      }

      return { success: false, error: 'Invalid username or password as an examite' };
    } catch (err) {
      console.error('Author login error:', err);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isAuthor = user?.role === 'author';
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, login, loginAuthor, logout, isAdmin, isAuthor, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
