import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, PencilLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AuthorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  // Fetch all subjects and filter by assigned subjects
  useEffect(() => {
    const fetchAssignedSubjects = async () => {
      setLoading(true);
      try {
        const assignedSubjects = user?.subjects || [];
        if (assignedSubjects.length === 0) {
          setSubjects([]);
          setLoading(false);
          return;
        }

        // Fetch all subjects for the college
        const res = await api.getAllSubjects();
        
        // Filter subjects where courseCode matches assigned subject codes case-insensitively
        const validSubjects = res.data.filter(subject => 
          assignedSubjects.some(assignedCode => 
            assignedCode.toLowerCase() === (subject.courseCode || subject.code || '').toLowerCase()
          )
        );

        setSubjects(validSubjects);
      } catch (err) {
        console.error('Failed to fetch assigned subjects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedSubjects();
  }, [user?.subjects]);

  const handleEditSubject = (subject) => {
    navigate('/admin/add-syllabus', {
      state: {
        isEdit: true,
        semester: subject.semester,
        subjectName: subject.subjectName || subject.name,
        courseCode: subject.courseCode || subject.code,
        courseType: subject.courseType || subject.category,
        noOfUnits: subject.noOfUnits || subject.units || 1,
        customTags: subject.customTags || [],
        price: subject.price || 0,
        Payment: subject.Payment || false,
      }
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-shell">
        {/* Author Header — No "Examites" button, just name + logout */}
        <div className="admin-header">
          <div className="admin-header-info">
            <span className="admin-header-eyebrow">Author Portal</span>
            <h2 className="admin-header-name">{user?.name || 'Author'}</h2>
            <span className="admin-header-role">{user?.collegeName || 'College'}</span>
          </div>
          <button onClick={logout} className="admin-logout-btn">
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div className="admin-grid">
          <div className="admin-main">
            {/* Existing Subjects assigned to the author */}
            <div className="admin-section">
              <h3 className="admin-section-title">
                <BookOpen size={18} /> Assigned Subjects
              </h3>
              {loading ? (
                <div className="admin-loading">
                  Loading your assigned subjects...
                </div>
              ) : subjects.length === 0 ? (
                <div className="admin-empty">
                  You have not been assigned any subjects yet. Contact your admin.
                </div>
              ) : (
                <div className="admin-subjects-list">
                  {subjects.map((sub) => (
                    <div key={sub.id} className="admin-subject-item">
                      <div className="admin-subject-item-icon">{sub.icon}</div>
                      <div className="admin-subject-item-info">
                        <div className="admin-subject-item-name">{sub.name}</div>
                        <div className="admin-subject-item-meta">
                          {sub.courseCode && <span>{sub.courseCode}</span>}
                          {sub.courseType && <span> · {sub.courseType}</span>}
                          {sub.semester && <span> · Sem {sub.semester}</span>}
                          {' · '}{sub.units} Unit{sub.units !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="admin-subject-actions">
                        <button
                          className="admin-edit-btn"
                          type="button"
                          onClick={() => handleEditSubject(sub)}
                          aria-label={`Edit ${sub.name}`}
                        >
                          <PencilLine size={16} /> Edit
                        </button>
                        <button
                          className="admin-sheet-btn"
                          type="button"
                          aria-label={`Create sheet for ${sub.name}`}
                          onClick={() => navigate('/admin/cheatsheets', {
                            state: {
                              subjectName: sub.name || sub.subjectName,
                              courseCode: sub.courseCode || sub.code,
                              semester: sub.semester,
                            }
                          })}
                        >
                          Cheat Sheets
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
