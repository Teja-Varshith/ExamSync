import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, KeyRound, Save, User } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import NeoButton from '../../components/ui/NeoButton';
import SubjectCodesInput from './SubjectCodesInput';
import toast from '../../components/ui/toast';
import api from '../../services/api';

/** Edit an examite's username, password and assigned subjects (examsync/{college}.examites[]). */
export default function EditExamiteDialog({ examite, collegeId, allSubjects, onClose, onSaved }) {
  const [username, setUsername] = useState(examite.username || '');
  const [password, setPassword] = useState(examite.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [subjects, setSubjects] = useState((examite.subjects || []).map((s) => s.toLowerCase()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const renamed = username.trim().toLowerCase() !== (examite.username || '').toLowerCase();

  const handleSave = async (e) => {
    e?.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) return setError('Username and password can’t be empty.');

    setSaving(true);
    try {
      const res = await api.updateExamite(collegeId, examite.username, {
        username: username.trim(),
        password: password.trim(),
        subjects,
      });
      toast.success(
        `${username.trim().toLowerCase()} updated`,
        renamed || password.trim() !== examite.password ? 'Share the new login details with them.' : undefined
      );
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err?.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Edit examite"
      subtitle={`Editing ${examite.username}`}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <NeoButton variant="secondary" kind="flat" onClick={onClose} disabled={saving}>Cancel</NeoButton>
          <NeoButton icon={Save} loading={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </NeoButton>
        </>
      }
    >
      <form className="ad-form" onSubmit={handleSave} noValidate>
        <div className="neo-field">
          <label className="neo-label" htmlFor="edit-ex-username">Username</label>
          <div className="neo-input-wrap">
            <User size={16} />
            <input
              id="edit-ex-username"
              className="neo-input"
              value={username}
              autoComplete="off"
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
            />
          </div>
          {renamed && <span className="neo-help">They’ll need the new username to sign in.</span>}
        </div>

        <div className="neo-field">
          <label className="neo-label" htmlFor="edit-ex-password">Password</label>
          <div className="neo-input-wrap">
            <KeyRound size={16} />
            <input
              id="edit-ex-password"
              type={showPassword ? 'text' : 'password'}
              className="neo-input"
              value={password}
              autoComplete="new-password"
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
            <button type="button" className="neo-input-action" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="neo-field">
          <span className="neo-label">Assigned subjects</span>
          <SubjectCodesInput value={subjects} onChange={setSubjects} allSubjects={allSubjects} onError={setError} />
          {subjects.length === 0 && <span className="neo-help">No subjects: they can sign in but won’t see anything to edit.</span>}
        </div>

        {error && (
          <div className="neo-alert neo-alert--error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <button type="submit" hidden aria-hidden="true" />
      </form>
    </Modal>
  );
}
