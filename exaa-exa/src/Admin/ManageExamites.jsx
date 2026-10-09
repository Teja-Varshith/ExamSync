import { useState, useEffect } from 'react';
import { Plus, Trash2, User, KeyRound, Eye, EyeOff, AlertCircle, Search, PencilLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AdminLayout from '../components/layout/AdminLayout';
import NeoButton from '../components/ui/NeoButton';
import EmptyState from '../components/ui/EmptyState';
import { useConfirm } from '../components/ui/useConfirm';
import toast from '../components/ui/toast';
import { CardSkeleton } from '../components/Loader/Loader';
import EditExamiteDialog from './components/EditExamiteDialog';
import SubjectCodesInput from './components/SubjectCodesInput';

function ExamiteRow({ ex, index, subjectName, onEdit, onRemove }) {
  const [reveal, setReveal] = useState(false);
  return (
    <article className="ad-examite" style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}>
      <span className="ad-examite__avatar" aria-hidden="true">{(ex.username || '?').slice(0, 2).toUpperCase()}</span>
      <div className="ad-examite__info">
        <div className="ad-examite__name">{ex.username}</div>
        <div className="ad-examite__meta">
          <span className="ad-examite__pw">
            <KeyRound size={12} />
            <span className="ad-code">{reveal ? ex.password : '••••••••'}</span>
            <button type="button" onClick={() => setReveal(!reveal)} aria-label={reveal ? 'Hide password' : 'Show password'}>
              {reveal ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </span>
          {ex.createdAt && <span>Added {new Date(ex.createdAt).toLocaleDateString()}</span>}
        </div>
        <div className="ad-examite__subjects">
          {ex.subjects?.length ? (
            ex.subjects.map((s) => <span key={s} className="neo-chip">{subjectName(s)}</span>)
          ) : (
            <span className="ad-examite__none">No subjects assigned</span>
          )}
        </div>
      </div>
      <div className="ad-examite__actions">
        <button type="button" className="neo-icon-btn" onClick={() => onEdit(ex)} aria-label={`Edit ${ex.username}`} title="Edit examite">
          <PencilLine size={16} />
        </button>
        <button type="button" className="neo-icon-btn neo-icon-btn--danger" onClick={() => onRemove(ex.username)} aria-label={`Remove ${ex.username}`} title="Remove examite">
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

export default function ManageExamites() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const collegeId = user?.collegeId;

  const [examites, setExamites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // All subjects across all semesters (for assignment)
  const [allSubjects, setAllSubjects] = useState([]);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState(null);

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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setFormError('Fill in both username and password.');
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
      toast.success(`${username.trim()} added`, 'Share the username, password and college code with them.');
      setUsername('');
      setPassword('');
      setSelectedSubjects([]);
      setFormError('');
    } catch (err) {
      setFormError(err.message || 'Failed to add examite.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (examiteUsername) => {
    const ok = await confirm({
      title: `Remove ${examiteUsername}?`,
      message: 'They will no longer be able to sign in or edit cheat sheets. Content they created stays.',
      confirmLabel: 'Remove examite',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      const res = await api.removeExamite(collegeId, examiteUsername);
      setExamites(res.data);
      toast.success(`${examiteUsername} removed`);
    } catch (err) {
      toast.error('Could not remove examite', err.message);
    }
  };

  // Get subject name from code for display
  const getSubjectName = (code) => {
    const found = allSubjects.find(s => (s.courseCode || s.code || '').toLowerCase() === code.toLowerCase());
    return found ? `${found.name} · ${code.toUpperCase()}` : code.toUpperCase();
  };

  const q = search.trim().toLowerCase();
  const visible = q ? examites.filter((ex) => (ex.username || '').toLowerCase().includes(q)) : examites;

  return (
    <AdminLayout
      crumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Examites' }]}
      eyebrow={user?.collegeName || 'College'}
      title="Examites"
      subtitle="Authors who can edit syllabus and build cheat sheets for the subjects you assign them."
    >
      <div className="ad-grid">
        <section className="ad-panel">
          <div className="ad-panel__head">
            <h2 className="ad-panel__title">
              Registered <span className="neo-chip">{examites.length}</span>
            </h2>
            {examites.length > 4 && (
              <div className="neo-input-wrap ad-search">
                <Search size={16} />
                <input className="neo-input" placeholder="Search username" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search examites" />
              </div>
            )}
          </div>

          <div className="ad-list">
            {loading ? (
              <CardSkeleton count={2} />
            ) : visible.length === 0 ? (
              <EmptyState
                compact
                title={q ? 'No matches' : 'No examites yet'}
                message={q ? 'Try a different username.' : 'Add your first author with the form.'}
              />
            ) : (
              visible.map((ex, index) => (
                <ExamiteRow key={ex.username || index} ex={ex} index={index} subjectName={getSubjectName} onEdit={setEditing} onRemove={handleRemove} />
              ))
            )}
          </div>
        </section>

        <aside className="ad-panel ad-panel--accent">
          <div className="ad-panel__head">
            <h2 className="ad-panel__title"><Plus size={18} /> Add an examite</h2>
          </div>

          <form className="ad-form" onSubmit={handleAdd} noValidate>
            <div className="neo-field">
              <label className="neo-label" htmlFor="ex-username">Username</label>
              <div className="neo-input-wrap">
                <User size={16} />
                <input
                  id="ex-username"
                  className="neo-input"
                  placeholder="e.g. ravi123"
                  value={username}
                  autoComplete="off"
                  onChange={(e) => { setUsername(e.target.value); setFormError(''); }}
                />
              </div>
            </div>

            <div className="neo-field">
              <label className="neo-label" htmlFor="ex-password">Password</label>
              <div className="neo-input-wrap">
                <KeyRound size={16} />
                <input
                  id="ex-password"
                  type={showPassword ? 'text' : 'password'}
                  className="neo-input"
                  placeholder="Set a password"
                  value={password}
                  autoComplete="new-password"
                  onChange={(e) => { setPassword(e.target.value); setFormError(''); }}
                />
                <button type="button" className="neo-input-action" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Subject Assignment */}
            <div className="neo-field">
              <span className="neo-label">Assign subjects <small>(optional)</small></span>
              <SubjectCodesInput
                value={selectedSubjects}
                onChange={setSelectedSubjects}
                allSubjects={allSubjects}
                onError={setFormError}
              />
            </div>

            {formError && (
              <div className="neo-alert neo-alert--error" role="alert">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <NeoButton type="submit" size="big" fullWidth icon={Plus} loading={saving}>
              {saving ? 'Adding…' : 'Add examite'}
            </NeoButton>
          </form>
        </aside>
      </div>

      {editing && (
        <EditExamiteDialog
          examite={editing}
          collegeId={collegeId}
          allSubjects={allSubjects}
          onClose={() => setEditing(null)}
          onSaved={setExamites}
        />
      )}
    </AdminLayout>
  );
}
