import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, BookOpen, Code, Tag, LogOut, PencilLine, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedSem, setSelectedSem] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add Subject form state
  const [subjectName, setSubjectName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseType, setCourseType] = useState('Professional Core');

  // Admin profile from auth context
  const adminProfile = { name: user?.name || 'Administrator', role: user?.adminRole || 'Admin' };

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  // Fetch subjects whenever semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await api.getSubjects(Number(selectedSem));
        setSubjects(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [selectedSem]);

  const handleAddSubject = () => {
    if (!subjectName.trim() || !courseCode.trim()) {
      alert('Please fill Subject Name and Course Code');
      return;
    }
    // Navigate to syllabus page, passing subject info via state
    navigate('/admin/add-syllabus', {
      state: {
        semester: selectedSem,
        subjectName: subjectName.trim(),
        courseCode: courseCode.trim(),
        courseType,
      }
    });
  };

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
        {/* Admin Header */}
        <div className="admin-header">
          <div className="admin-header-info">
            <span className="admin-header-eyebrow">Admin Portal — {user?.collegeName || ''}</span>
            <h2 className="admin-header-name">{adminProfile.name}</h2>
            <span className="admin-header-role">{adminProfile.role}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/admin/examites')}
              className="admin-logout-btn"
              style={{ background: 'rgba(255, 215, 0, 0.12)', borderColor: 'rgba(255, 215, 0, 0.3)', color: '#FFD700' }}
            >
              <Users size={16} /> Examites
            </button>
            <button
              onClick={logout}
              className="admin-logout-btn"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="admin-grid">
          <div className="admin-main">
            {/* Semester Dropdown */}
            <div className="admin-section">
              <label className="admin-label">Select Semester</label>
              <div className="admin-select-wrapper">
                <select
                  className="admin-select"
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="admin-select-icon" />
              </div>
            </div>

            {/* Existing Subjects for the selected semester */}
            <div className="admin-section">
              <h3 className="admin-section-title">
                <BookOpen size={18} /> Subjects in Semester {selectedSem}
              </h3>
              {loading ? (
                <div className="admin-loading">
                  Loading from Firestore...
                </div>
              ) : subjects.length === 0 ? (
                <div className="admin-empty">
                  No subjects added for this semester yet.
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
                              semester: sub.semester || selectedSem,
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

          <aside className="admin-aside">
            <div className="admin-section admin-metrics">
              <div className="admin-metric">
                <span className="admin-metric-label">Active Semester</span>
                <span className="admin-metric-value">Semester {selectedSem}</span>
              </div>
              <div className="admin-metric">
                <span className="admin-metric-label">Subjects</span>
                <span className="admin-metric-value">{subjects.length}</span>
              </div>
            </div>

            {/* Add New Subject - Inline Section */}
            <div className="admin-section admin-add-section">
              <h3 className="admin-section-title">
                <Plus size={18} /> Add New Subject
              </h3>

              <div className="admin-form-group">
                <label className="admin-label">Subject Name</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Compiler Design"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  <Code size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Course Code
                </label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. CS302"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  <Tag size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Course Type
                </label>
                <div className="admin-type-options">
                  <div
                    className={`admin-type-option ${courseType === 'Professional Core' ? 'selected' : ''}`}
                    onClick={() => setCourseType('Professional Core')}
                  >
                    Professional Core
                  </div>
                  <div
                    className={`admin-type-option ${courseType === 'Professional Elective' ? 'selected' : ''}`}
                    onClick={() => setCourseType('Professional Elective')}
                  >
                    Professional Elective
                  </div>
                </div>
              </div>

              <button className="btn btn-primary btn-lg admin-primary-action" onClick={handleAddSubject}>
                Next: Add Syllabus
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
