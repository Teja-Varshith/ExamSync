import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, ChevronRight, Plus, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function AdminCheatsheets() {
  const navigate = useNavigate();
  const location = useLocation();
  const subjectState = location.state || {};
  
  const {
    subjectName = 'Unknown Subject',
    courseCode = '',
    semester = 1,
  } = subjectState;

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  useEffect(() => {
    const fetchSubject = async () => {
      setLoading(true);
      try {
        if (courseCode) {
          const res = await api.getSubjectById(courseCode);
          if (res.data) {
            setSubject(res.data);
          }
        }
      } catch (err) {
        console.error('Failed to load subject:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubject();
  }, [courseCode]);

  // Define exam types
  const examTypes = [
    { id: 'mid1', label: 'MID 1', icon: '📝' },
    { id: 'mid2', label: 'MID 2', icon: '📋' },
    { id: 'sem', label: 'SEM', icon: '🎓' },
  ];

  // Determine status for each exam type based on ImpQuestions data
  const examFirebaseKeyMap = { mid1: 'Mid 1', mid2: 'Mid 2', sem: 'Sem' };

  const getExamStatus = (examId) => {
    if (!subject) return { status: 'empty', label: 'Not Started', count: 0 };
    
    const impQ = subject.ImpQuestions;
    if (!impQ) return { status: 'empty', label: 'Not Started', count: 0 };

    const firebaseKey = examFirebaseKeyMap[examId];
    const examData = impQ[firebaseKey];

    if (examData && typeof examData === 'object') {
      const count = Object.keys(examData).length;
      if (count > 0) {
        return { status: 'completed', label: `${count} Question${count !== 1 ? 's' : ''}`, count };
      }
    }

    return { status: 'empty', label: 'Not Started', count: 0 };
  };

  const handleOpenCheatsheet = (examType) => {
    // Navigate to the cheatsheet editor for this exam type
    navigate('/admin/cheatsheet-editor', {
      state: {
        subjectName,
        courseCode,
        semester,
        examType: examType.id,
        examLabel: examType.label,
      }
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-shell">
        {/* Back Button */}
        <button className="admin-back-btn" onClick={() => navigate('/admin')}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        {/* Subject Hero Header */}
        <div className="admin-cs-hero">
          <div className="admin-cs-hero-badge">
            Semester {semester}
          </div>
          <h1 className="admin-cs-hero-title">{subjectName}</h1>
          <p className="admin-cs-hero-subtitle">
            Select an exam below to create or view cheatsheets.
          </p>
          {courseCode && (
            <span className="admin-cs-hero-code">{courseCode}</span>
          )}
        </div>

        {/* Exams & Cheatsheets Section */}
        <div className="admin-cs-section">
          <h3 className="admin-cs-section-title">
            <FileText size={18} />
            Exams & Cheatsheets
          </h3>

          {loading ? (
            <div className="admin-loading">Loading subject data...</div>
          ) : (
            <div className="admin-cs-grid">
              {examTypes.map((exam) => {
                const { status, label } = getExamStatus(exam.id);
                return (
                  <div
                    key={exam.id}
                    className={`admin-cs-card ${status === 'completed' ? 'admin-cs-card--completed' : ''}`}
                  >
                    <div className="admin-cs-card-header">
                      <h4 className="admin-cs-card-title">{exam.label}</h4>
                      <span className={`admin-cs-card-badge admin-cs-card-badge--${status}`}>
                        {label}
                      </span>
                    </div>
                    <div className="admin-cs-card-meta">
                      <Calendar size={14} />
                      <span>Pakka Pass Questions</span>
                    </div>
                    <button
                      className="admin-cs-card-action"
                      onClick={() => handleOpenCheatsheet(exam)}
                    >
                      {status === 'completed' ? (
                        <>Open cheatsheet <ChevronRight size={14} /></>
                      ) : (
                        <><Plus size={14} /> Create cheatsheet</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {subject && (
          <div className="admin-cs-stats">
            <div className="admin-cs-stat">
              <span className="admin-cs-stat-label">Units</span>
              <span className="admin-cs-stat-value">{subject.units || 0}</span>
            </div>
            <div className="admin-cs-stat">
              <span className="admin-cs-stat-label">Course Type</span>
              <span className="admin-cs-stat-value">{subject.category || '—'}</span>
            </div>
            <div className="admin-cs-stat">
              <span className="admin-cs-stat-label">Sheets Created</span>
              <span className="admin-cs-stat-value">
                {examTypes.filter(e => getExamStatus(e.id).status === 'completed').length} / {examTypes.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
