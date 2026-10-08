import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, User, Loader, BookOpen, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ManageExamites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const collegeId = user?.collegeId;

  const [examites, setExamites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // All subjects across all semesters (for assignment)
  const [allSubjects, setAllSubjects] = useState([]);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectInput, setSubjectInput] = useState('');

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  // Fetch examites
  useEffect(() => {
    const fetchExamites = async () => {
      setLoading(true);
      try {
        const res = await api.getExamites(collegeId);
        setExamites(res.data);
      } catch (err) {
        console.error('Failed to fetch examites:', err);
      } finally {
        setLoading(false);
      }
    };
    if (collegeId) fetchExamites();
  }, [collegeId]);

  // Fetch all subjects across semesters 1-8 for the dropdown
  useEffect(() => {
    const fetchAllSubjects = async () => {
      try {
        const allSubs = [];
        for (let sem = 1; sem <= 8; sem++) {
          const res = await api.getSubjects(sem);
          if (res.data) allSubs.push(...res.data);
        }
        setAllSubjects(allSubs);
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };
    fetchAllSubjects();
  }, []);

  const handleAddSubjectCode = () => {
    const code = subjectInput.trim().toLowerCase();
    if (!code) return;
    if (selectedSubjects.includes(code)) {
      alert('Subject already added');
      return;
    }
    setSelectedSubjects(prev => [...prev, code]);
    setSubjectInput('');
  };

  const handleRemoveSubjectCode = (code) => {
    setSelectedSubjects(prev => prev.filter(s => s !== code));
  };

  const handleAdd = async () => {
    if (!username.trim() || !password.trim()) {
      alert('Please fill in both username and password');
      return;
    }

    setSaving(true);
    try {
      const res = await api.addExamite(collegeId, {
        username: username.trim(),
        password: password.trim(),
        subjects: selectedSubjects,
      });
      setExamites(res.data);
      setUsername('');
      setPassword('');
      setSelectedSubjects([]);
      alert(`✅ ${username.trim()} added as an examite!`);
    } catch (err) {
      alert(`❌ ${err.message || 'Failed to add examite'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (examiteUsername) => {
    if (!window.confirm(`Remove user "${examiteUsername}" from examites?`)) return;

    try {
      const res = await api.removeExamite(collegeId, examiteUsername);
      setExamites(res.data);
    } catch (err) {
      alert(`❌ ${err.message || 'Failed to remove examite'}`);
    }
  };

  // Get subject name from code for display
  const getSubjectName = (code) => {
    const found = allSubjects.find(s => (s.courseCode || s.code || '').toLowerCase() === code.toLowerCase());
    return found ? `${found.name} (${code})` : code;
  };

  return (
    <div className="admin-page">
      <div className="admin-shell">
        {/* Back Button */}
        <button className="admin-back-btn" onClick={() => navigate('/admin')}>
          <ChevronLeft size={20} /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="admin-cs-hero">
          <div className="admin-cs-hero-badge">{user?.collegeName || 'College'}</div>
          <h1 className="admin-cs-hero-title">Manage Examites</h1>
          <p className="admin-cs-hero-subtitle">
            Add or remove authors who can create cheatsheets and manage subjects.
          </p>
        </div>

        <div className="admin-grid">
          <div className="admin-main">
            {/* Examites List */}
            <div className="admin-section">
              <h3 className="admin-section-title">
                <User size={18} /> Registered Examites ({examites.length})
              </h3>

              {loading ? (
                <div className="admin-loading">Loading examites...</div>
              ) : examites.length === 0 ? (
                <div className="admin-empty">
                  No examites added yet. Add your first author using the form.
                </div>
              ) : (
                <div className="admin-subjects-list">
                  {examites.map((ex, index) => (
                    <div key={ex.username || index} className="admin-subject-item">
                      <div className="admin-subject-item-icon">✏️</div>
                      <div className="admin-subject-item-info">
                        <div className="admin-subject-item-name">{ex.username}</div>
                        <div className="admin-subject-item-meta">
                          <span>Password: {ex.password}</span>
                          {ex.createdAt && <span> · Added {new Date(ex.createdAt).toLocaleDateString()}</span>}
                        </div>
                        {ex.subjects && ex.subjects.length > 0 && (
                          <div className="admin-subject-item-meta" style={{ marginTop: '4px' }}>
                            <BookOpen size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            <span style={{ color: '#FFD700' }}>
                              {ex.subjects.map(s => getSubjectName(s)).join(' · ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="admin-subject-actions">
                        <button
                          className="admin-edit-btn"
                          style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          onClick={() => handleRemove(ex.username)}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="admin-aside">
            {/* Add New Examite Form */}
            <div className="admin-section admin-add-section">
              <h3 className="admin-section-title">
                <Plus size={18} /> Add New Examite
              </h3>

              <div className="admin-form-group">
                <label className="admin-label">
                  <User size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Username
                </label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. ravi123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  <User size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Password
                </label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. pass123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Subject Assignment */}
              <div className="admin-form-group">
                <label className="admin-label">
                  <BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Assign Subjects
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Enter course code"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubjectCode(); } }}
                    style={{ flex: 1 }}
                    list="subject-suggestions"
                  />
                  <button
                    type="button"
                    className="admin-edit-btn"
                    style={{ borderColor: 'rgba(74, 222, 128, 0.3)', color: '#4ade80', whiteSpace: 'nowrap' }}
                    onClick={handleAddSubjectCode}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
                {/* Datalist for suggestions */}
                <datalist id="subject-suggestions">
                  {allSubjects.map(s => (
                    <option key={s.courseCode || s.code} value={(s.courseCode || s.code || '').toLowerCase()}>
                      {s.name}
                    </option>
                  ))}
                </datalist>
                {/* Selected subjects chips */}
                {selectedSubjects.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {selectedSubjects.map(code => (
                      <span
                        key={code}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px', borderRadius: '20px',
                          background: 'rgba(255, 215, 0, 0.12)', border: '1px solid rgba(255, 215, 0, 0.3)',
                          color: '#FFD700', fontSize: '0.8rem',
                        }}
                      >
                        {getSubjectName(code)}
                        <X
                          size={12}
                          style={{ cursor: 'pointer', opacity: 0.7 }}
                          onClick={() => handleRemoveSubjectCode(code)}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary btn-lg admin-primary-action"
                onClick={handleAdd}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={18} /> Add Examite
                  </>
                )}
              </button>
            </div>

            {/* Info Card */}
            <div className="admin-section admin-metrics">
              <div className="admin-metric">
                <span className="admin-metric-label">Total Examites</span>
                <span className="admin-metric-value">{examites.length}</span>
              </div>
              <div className="admin-metric">
                <span className="admin-metric-label">College</span>
                <span className="admin-metric-value">{user?.collegeName || '—'}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
