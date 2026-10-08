import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Student pages
import SubjectsPage from './pages/SubjectsPage/SubjectsPage';
import SubjectDetailPage from './pages/SubjectDetailPage/SubjectDetailPage';
import PdfViewerPage from './pages/PdfViewerPage/PdfViewerPage';
import ImpQuestionsViewer from './pages/ImpQuestionsViewer/ImpQuestionsViewer';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import LoginPage from './pages/LoginPage/LoginPage';
import AuthorLoginPage from './pages/AuthorLoginPage/AuthorLoginPage';

// Admin pages
import AdminDashboard from './Admin/AdminDashboard';
import AddSyllabus from './Admin/AddSyllabus';
import AdminCheatsheets from './Admin/AdminCheatsheets';
import AdminCheatsheetEditor from './Admin/AdminCheatsheetEditor';
import ManageExamites from './Admin/ManageExamites';

// Author pages
import AuthorDashboard from './Admin/AuthorDashboard';

import './App.css';

/**
 * AppRoutes — Renders routes based on auth state.
 * - Not logged in → Login / Author login / Student pages
 * - Admin → Admin routes (with Examites management)
 * - Author → Author routes (same as admin minus Examites)
 * - Student → Student routes
 */
function AppRoutes() {
  const { isAdmin, isAuthor, isLoggedIn } = useAuth();

  // Admin & Author routing
  if (isLoggedIn && (isAdmin || isAuthor)) {
    return (
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <AuthorDashboard />} />
          <Route path="/admin/add-syllabus" element={<AddSyllabus />} />
          <Route path="/admin/cheatsheets" element={<AdminCheatsheets />} />
          <Route path="/admin/cheatsheet-editor" element={<AdminCheatsheetEditor />} />
          {isAdmin && <Route path="/admin/examites" element={<ManageExamites />} />}
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
        <Route path="/author" element={<AuthorLoginPage />} />
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
