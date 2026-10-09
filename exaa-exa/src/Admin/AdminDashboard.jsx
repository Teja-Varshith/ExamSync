import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertCircle, BookOpen, Layers, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AdminLayout from '../components/layout/AdminLayout';
import SubjectRow from './components/SubjectRow';
import { editState } from './components/editState';
import NeoButton from '../components/ui/NeoButton';
import Segmented from '../components/ui/Segmented';
import EmptyState from '../components/ui/EmptyState';
import BranchPicker from '../components/ui/BranchPicker';
import EditSubjectDialog from './components/EditSubjectDialog';
import { BRANCHES, normalizeBranches } from '../constants/branches';
import { CardSkeleton } from '../components/Loader/Loader';

const COURSE_TYPES = [
  { value: 'Professional Core', label: 'Core' },
  { value: 'Professional Elective', label: 'Elective' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSem, setSelectedSem] = useState(() => Number(sessionStorage.getItem('admin_sem')) || 1);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Add Subject form state
  const [subjectName, setSubjectName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseType, setCourseType] = useState('Professional Core');
  const [branches, setBranches] = useState([]);
  const [formError, setFormError] = useState('');

  // List filters + edit dialog
  const [branchFilter, setBranchFilter] = useState('all');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    sessionStorage.setItem('admin_sem', String(selectedSem));
  }, [selectedSem]);

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

  const duplicate = courseCode.trim()
    ? subjects.find((s) => (s.courseCode || '').toLowerCase() === courseCode.trim().toLowerCase())
    : null;

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!subjectName.trim() || !courseCode.trim()) {
      setFormError('Add both a subject name and a course code.');
      return;
    }
    if (branches.length === 0) {
      setFormError('Pick at least one branch this subject is taught in.');
      return;
    }
    if (duplicate) {
      setFormError(`${duplicate.courseCode} already exists in Semester ${selectedSem}. Edit it from the list instead.`);
      return;
    }
    // Navigate to syllabus page, passing subject info via state
    navigate('/admin/add-syllabus', {
      state: {
        semester: selectedSem,
        subjectName: subjectName.trim(),
        courseCode: courseCode.trim(),
        courseType,
        branches,
      }
    });
  };

  // After editing details: update in place, or drop it from this list if it moved semester
  const handleSubjectSaved = (updated) => {
    setSubjects((prev) =>
      Number(updated.semester) !== Number(selectedSem)
        ? prev.filter((s) => s.id !== updated.id)
        : prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
    );
  };

  const openSheets = (sub) =>
    navigate('/admin/cheatsheets', {
      state: {
        subjectName: sub.name || sub.subjectName,
        courseCode: sub.courseCode || sub.code,
        semester: sub.semester || selectedSem,
      }
    });

  const q = search.trim().toLowerCase();
  const visible = subjects
    .filter((s) => !q || `${s.name} ${s.courseCode}`.toLowerCase().includes(q))
    .filter((s) => branchFilter === 'all' || normalizeBranches(s.branches).includes(branchFilter));
  const coreCount = subjects.filter((s) => s.courseType === 'Professional Core').length;

  return (
    <AdminLayout
      eyebrow={user?.collegeName || 'Admin'}
      title={`Welcome, ${(user?.name || 'Admin').split(' ')[0]}`}
      subtitle="Pick a semester to manage its subjects, syllabus and cheat sheets."
    >
      {/* Stats */}
      <div className="ad-stats">
        <div className="ad-stat ad-stat--accent">
          <GraduationCap size={18} />
          <span className="ad-stat__label">Semester</span>
          <span className="ad-stat__value">{selectedSem}</span>
        </div>
        <div className="ad-stat">
          <BookOpen size={18} />
          <span className="ad-stat__label">Subjects</span>
          <span className="ad-stat__value">{loading ? '–' : subjects.length}</span>
        </div>
        <div className="ad-stat">
          <Layers size={18} />
          <span className="ad-stat__label">Core / Elective</span>
          <span className="ad-stat__value">{loading ? '–' : `${coreCount} / ${subjects.length - coreCount}`}</span>
        </div>
      </div>

      <div className="ad-grid">
        <section className="ad-panel">
          <div className="ad-panel__head">
            <h2 className="ad-panel__title">Subjects</h2>
            <div className="neo-input-wrap ad-search">
              <Search size={16} />
              <input
                className="neo-input"
                placeholder="Search name or code"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search subjects"
              />
            </div>
          </div>

          <Segmented
            ariaLabel="Semester"
            value={selectedSem}
            onChange={(s) => { setSelectedSem(s); setSearch(''); }}
            options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: s, label: `Sem ${s}` }))}
          />

          <Segmented
            size="small"
            className="ad-branch-filter"
            ariaLabel="Filter by branch"
            value={branchFilter}
            onChange={setBranchFilter}
            options={[
              { value: 'all', label: 'All branches' },
              ...BRANCHES.map((b) => ({
                value: b,
                label: b,
                badge: loading ? null : subjects.filter((s) => normalizeBranches(s.branches).includes(b)).length,
              })),
            ]}
          />

          <div className="ad-list">
            {loading ? (
              <CardSkeleton count={2} />
            ) : visible.length === 0 ? (
              <EmptyState
                compact
                title={q || branchFilter !== 'all' ? 'No matches' : `No subjects in Semester ${selectedSem}`}
                message={q || branchFilter !== 'all' ? 'Try a different search or branch.' : 'Use “Add a subject” to create the first one.'}
              />
            ) : (
              visible.map((sub, i) => (
                <SubjectRow
                  key={sub.id}
                  subject={sub}
                  index={i}
                  onDetails={setEditing}
                  onContent={(s) => navigate('/admin/add-syllabus', { state: editState(s) })}
                  onSheets={openSheets}
                />
              ))
            )}
          </div>
        </section>

        {/* Add New Subject */}
        <aside className="ad-panel ad-panel--accent">
          <div className="ad-panel__head">
            <h2 className="ad-panel__title"><Plus size={18} /> Add a subject</h2>
          </div>
          <p className="ad-panel__hint">
            Adds to <strong>Semester {selectedSem}</strong>. You&apos;ll set up units, notes and PYQs on the next step.
          </p>

          <form className="ad-form" onSubmit={handleAddSubject} noValidate>
            <div className="neo-field">
              <label className="neo-label" htmlFor="new-subject-name">Subject name</label>
              <input
                id="new-subject-name"
                className="neo-input"
                placeholder="e.g. Compiler Design"
                value={subjectName}
                onChange={(e) => { setSubjectName(e.target.value); setFormError(''); }}
              />
            </div>

            <div className="neo-field">
              <label className="neo-label" htmlFor="new-course-code">Course code</label>
              <input
                id="new-course-code"
                className="neo-input"
                placeholder="e.g. 21CS302"
                value={courseCode}
                aria-invalid={Boolean(duplicate)}
                onChange={(e) => { setCourseCode(e.target.value); setFormError(''); }}
              />
              {duplicate && <span className="neo-help ad-warn">Already used by “{duplicate.name}”.</span>}
            </div>

            <div className="neo-field">
              <span className="neo-label">Course type</span>
              <Segmented ariaLabel="Course type" value={courseType} onChange={setCourseType} options={COURSE_TYPES} />
            </div>

            <div className="neo-field">
              <span className="neo-label">Branches <small>— pick every branch that has this subject</small></span>
              <BranchPicker
                value={branches}
                onChange={(b) => { setBranches(b); setFormError(''); }}
                invalid={Boolean(formError) && branches.length === 0}
              />
            </div>

            {formError && (
              <div className="neo-alert neo-alert--error" role="alert">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <NeoButton type="submit" size="big" fullWidth showArrow>
              Continue to syllabus
            </NeoButton>
          </form>
        </aside>
      </div>

      {editing && (
        <EditSubjectDialog
          subject={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSubjectSaved}
        />
      )}
    </AdminLayout>
  );
}
