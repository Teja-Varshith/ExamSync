import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Student pages
import SubjectsPage from './pages/SubjectsPage/SubjectsPage';
import SubjectDetailPage from './pages/SubjectDetailPage/SubjectDetailPage';
import PdfViewerPage from './pages/PdfViewerPage/PdfViewerPage';
import ImpQuestionsViewer from './pages/ImpQuestionsViewer/ImpQuestionsViewer';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import LoginPage from './pages/LoginPage/LoginPage';

// Admin pages
import AdminDashboard from './Admin/AdminDashboard';
import AddSyllabus from './Admin/AddSyllabus';
import AdminCheatsheets from './Admin/AdminCheatsheets';
import AdminCheatsheetEditor from './Admin/AdminCheatsheetEditor';

import './App.css';

/**
 * AppRoutes — Renders routes based on auth state.
 * - Not logged in → Login page
 * - Admin → Admin routes only
 * - Student → Student routes only
 */
function AppRoutes() {
  const { isAdmin, isLoggedIn } = useAuth();

  // Admin routing
  if (isLoggedIn && isAdmin) {
    return (
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/add-syllabus" element={<AddSyllabus />} />
          <Route path="/admin/cheatsheets" element={<AdminCheatsheets />} />
          <Route path="/admin/cheatsheet-editor" element={<AdminCheatsheetEditor />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    );
  }

  // Student routing (Default)
  return (
    <div className="app-container relative overflow-x-hidden">
      <Routes>
        <Route path="/" element={<SubjectsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/subject/:subjectId" element={<SubjectDetailPage />} />
        <Route path="/subject/:subjectId/unit/:unitId" element={<SubjectDetailPage />} />
        <Route path="/subject/:subjectId/notes/view" element={<PdfViewerPage />} />
        <Route path="/subject/:subjectId/imp-questions" element={<ImpQuestionsViewer />} />
        <Route path="/admin/*" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
