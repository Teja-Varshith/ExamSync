import { useState } from 'react';
import { AlertCircle, Lock, Save } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import NeoButton from '../../components/ui/NeoButton';
import Segmented from '../../components/ui/Segmented';
import BranchPicker from '../../components/ui/BranchPicker';
import { normalizeBranches } from '../../constants/branches';
import toast from '../../components/ui/toast';
import api from '../../services/api';

const COURSE_TYPES = [
  { value: 'Professional Core', label: 'Core' },
  { value: 'Professional Elective', label: 'Elective' },
];

/**
 * Edit a subject's metadata (examsync/{college}/subjects/{courseCode}).
 * The course code is the document id, so it stays read-only.
 */
export default function EditSubjectDialog({ subject, onClose, onSaved }) {
  const code = subject.courseCode || subject.code || subject.id;
  const [name, setName] = useState(subject.subjectName || subject.name || '');
  const [semester, setSemester] = useState(Number(subject.semester) || 1);
  const [courseType, setCourseType] = useState(subject.courseType || subject.category || 'Professional Core');
  const [branches, setBranches] = useState(normalizeBranches(subject.branches));
  const [price, setPrice] = useState(String(subject.price ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e?.preventDefault();
    setError('');
    if (!name.trim()) return setError('Subject name can’t be empty.');
    if (branches.length === 0) return setError('Pick at least one branch.');
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError('Price must be 0 or more coins.');

    setSaving(true);
    try {
      const res = await api.updateSubject(code, {
        subjectName: name.trim(),
        courseType,
        semester,
        branches,
        price: Math.round(priceNum),
        // unchanged fields (updateSubject writes the full metadata set)
        noOfUnits: subject.noOfUnits || subject.units || 1,
        customTags: subject.customTags || [],
        Payment: subject.Payment || false,
      });
      const moved = Number(subject.semester) !== semester;
      toast.success(
        `${name.trim()} updated`,
        moved ? `Moved to Semester ${semester}.` : 'Changes are live for students.'
      );
      onSaved?.({ ...subject, ...res.data, courseType, category: courseType });
      onClose();
    } catch (err) {
      setError(err?.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Edit subject"
      subtitle="Changes save to Firestore and show up for students right away."
      onClose={onClose}
      busy={saving}
      width={560}
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
          <label className="neo-label" htmlFor="edit-subject-name">Subject name</label>
          <input
            id="edit-subject-name"
            className="neo-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="ad-form-row">
          <div className="neo-field">
            <span className="neo-label">Course code <small>— can’t be changed</small></span>
            <div className="neo-input-wrap">
              <Lock size={16} />
              <input className="neo-input" value={code} readOnly aria-readonly="true" />
            </div>
          </div>
          <div className="neo-field">
            <label className="neo-label" htmlFor="edit-subject-price">Unlock price <small>(coins)</small></label>
            <input
              id="edit-subject-price"
              className="neo-input"
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="neo-field">
          <span className="neo-label">Semester</span>
          <Segmented
            size="small"
            ariaLabel="Semester"
            value={semester}
            onChange={setSemester}
            options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: s, label: String(s) }))}
          />
        </div>

        <div className="neo-field">
          <span className="neo-label">Course type</span>
          <Segmented ariaLabel="Course type" value={courseType} onChange={setCourseType} options={COURSE_TYPES} />
        </div>

        <div className="neo-field">
          <span className="neo-label">Branches <small>— students of these branches get this subject</small></span>
          <BranchPicker value={branches} onChange={setBranches} invalid={Boolean(error) && branches.length === 0} />
        </div>

        <p className="neo-help">
          Units ({subject.noOfUnits || subject.units || 1}), syllabus, notes and PYQs are edited from <strong>Content</strong>.
        </p>

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
