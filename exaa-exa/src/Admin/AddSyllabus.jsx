import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, Plus, Minus, Trash2, FileText, ClipboardList, BookOpen, Link2 } from 'lucide-react';
import api from '../services/api';
import AdminLayout from '../components/layout/AdminLayout';
import NeoButton from '../components/ui/NeoButton';
import Segmented from '../components/ui/Segmented';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/Loader/Loader';
import { useConfirm } from '../components/ui/useConfirm';
import toast from '../components/ui/toast';
import { normalizeBranches } from '../constants/branches';

export default function AddSyllabus() {
  const navigate = useNavigate();
  const location = useLocation();
  const subjectData = location.state || {}; // Using state passed from AdminDashboard
  const isEditMode = Boolean(subjectData.isEdit);
  const confirm = useConfirm();

  // Active tab state: 'syllabus' | 'notes' | 'pyqs'
  const [activeTab, setActiveTab] = useState('syllabus');

  const [noOfUnits, setNoOfUnits] = useState(subjectData.noOfUnits || 1);
  const [saving, setSaving] = useState(false);
  const [loadingExamData, setLoadingExamData] = useState(isEditMode);

  // Store unit details: { 1: { name: '', topics: '' }, 2: ... }
  const [unitDetails, setUnitDetails] = useState(() => {
    if (subjectData.syllabus && Object.keys(subjectData.syllabus).length > 0) {
      return subjectData.syllabus;
    }
    return { 1: { name: '', topics: '' } };
  });

  const mapToRows = (mapValue, type) => {
    if (!mapValue || typeof mapValue !== 'object') return [];
    return Object.keys(mapValue)
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => ({
        ...(type === 'notes'
          ? { title: mapValue[key]?.title || '', link: mapValue[key]?.link || '' }
          : { tag: mapValue[key]?.tag || '', link: mapValue[key]?.link || '' })
      }));
  };

  const [noteItems, setNoteItems] = useState(() => mapToRows(subjectData.notes, 'notes'));
  const [pyqItems, setPyqItems] = useState(() => mapToRows(subjectData.pyqs, 'pyqs'));

  // In edit mode, fetch exam_data (syllabus, notes, pyqs) from sub-collection
  useEffect(() => {
    if (!isEditMode || !subjectData.courseCode) return;
    const fetchExamData = async () => {
      setLoadingExamData(true);
      try {
        const res = await api.getExamData(subjectData.courseCode);
        const data = res.data || {};
        if (data.syllabus && Object.keys(data.syllabus).length > 0) {
          setUnitDetails(data.syllabus);
          setNoOfUnits(Object.keys(data.syllabus).length);
        }
        if (data.notes) setNoteItems(mapToRows(data.notes, 'notes'));
        if (data.pyqs) setPyqItems(mapToRows(data.pyqs, 'pyqs'));
      } catch (err) {
        console.error('Failed to fetch exam data:', err);
      } finally {
        setLoadingExamData(false);
      }
    };
    fetchExamData();
  }, [isEditMode, subjectData.courseCode]);

  useEffect(() => {
    setNoteItems((prev) => (prev.length ? prev : [{ title: '', link: '' }]));
    setPyqItems((prev) => (prev.length ? prev : [{ tag: '', link: '' }]));
  }, []);

  // Update unit slots whenever noOfUnits changes
  useEffect(() => {
    const num = Math.max(1, Math.min(10, parseInt(noOfUnits) || 1));
    setUnitDetails(prev => {
      const updated = {};
      for (let i = 1; i <= num; i++) {
        const prevUnit = prev[i];
        if (prevUnit && typeof prevUnit === 'object') {
          updated[i] = { name: prevUnit.name || '', topics: prevUnit.topics || '' };
        } else if (typeof prevUnit === 'string') {
          updated[i] = { name: `Unit ${i}`, topics: prevUnit };
        } else {
          updated[i] = { name: '', topics: '' };
        }
      }
      return updated;
    });
  }, [noOfUnits]);

  const unitCount = Object.keys(unitDetails).length;

  // Lowering the unit count drops units — confirm first if any of them has content
  const changeUnitCount = async (next) => {
    const target = Math.max(1, Math.min(10, next));
    if (target < unitCount) {
      const dropped = Object.entries(unitDetails)
        .filter(([k, u]) => Number(k) > target && (u?.name || u?.topics));
      if (dropped.length) {
        const ok = await confirm({
          title: `Remove ${unitCount - target} unit${unitCount - target !== 1 ? 's' : ''}?`,
          message: `Unit ${dropped.map(([k]) => k).join(', ')} already ${dropped.length > 1 ? 'have' : 'has'} content that will be discarded.`,
          confirmLabel: 'Remove',
          tone: 'danger',
        });
        if (!ok) return;
      }
    }
    setNoOfUnits(target);
  };

  const handleUnitChange = (unitNum, field, value) => {
    setUnitDetails(prev => ({
      ...prev,
      [unitNum]: {
        ...prev[unitNum],
        [field]: value
      }
    }));
  };

  const handleNoteChange = (index, field, value) => {
    setNoteItems(prev => prev.map((item, i) => (
      i === index ? { ...item, [field]: value } : item
    )));
  };

  const handlePyqChange = (index, field, value) => {
    setPyqItems(prev => prev.map((item, i) => (
      i === index ? { ...item, [field]: value } : item
    )));
  };

  const addNoteRow = () => {
    setNoteItems(prev => [...prev, { title: '', link: '' }]);
  };

  const addPyqRow = () => {
    setPyqItems(prev => [...prev, { tag: '', link: '' }]);
  };

  const removeNoteRow = (index) => {
    setNoteItems(prev => prev.filter((_, i) => i !== index));
  };

  const removePyqRow = (index) => {
    setPyqItems(prev => prev.filter((_, i) => i !== index));
  };

  // Single unified save handler for everything
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const cleanedNotes = noteItems
        .map((item) => ({
          title: item.title.trim(),
          link: item.link.trim()
        }))
        .filter((item) => item.title && item.link);

      const cleanedPyqs = pyqItems
        .map((item) => ({
          tag: item.tag.trim(),
          link: item.link.trim()
        }))
        .filter((item) => item.tag && item.link);

      const notesMap = cleanedNotes.reduce((acc, item, index) => {
        acc[index + 1] = item;
        return acc;
      }, {});

      const pyqsMap = cleanedPyqs.reduce((acc, item, index) => {
        acc[index + 1] = item;
        return acc;
      }, {});

      // 1. Save/update metadata (subject document)
      const metaData = {
        ...subjectData,
        noOfUnits: parseInt(noOfUnits) || 1,
      };

      if (isEditMode) {
        await api.updateSubject(subjectData.courseCode, metaData);
      } else {
        await api.addSubject(metaData);
      }

      // 2. Save exam data (exam_data/content sub-collection)
      await api.updateExamData(subjectData.courseCode || metaData.courseCode, {
        syllabus: unitDetails,
        notes: notesMap,
        pyqs: pyqsMap,
      });

      toast.success(`${subjectData.subjectName} ${isEditMode ? 'updated' : 'saved'}`, 'Syllabus, notes and PYQs are live for students.');
      navigate('/admin');
    } catch (err) {
      console.error('Failed to save subject:', err);
      toast.error(`Couldn't ${isEditMode ? 'update' : 'save'} the subject`, 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const filledNotes = noteItems.filter(n => n.title && n.link).length;
  const filledPyqs = pyqItems.filter(p => p.tag && p.link).length;

  const tabs = [
    { value: 'syllabus', label: 'Syllabus', icon: BookOpen, badge: unitCount },
    { value: 'notes', label: 'Notes / PDFs', icon: FileText, badge: filledNotes },
    { value: 'pyqs', label: 'PYQs', icon: ClipboardList, badge: filledPyqs },
  ];

  const renderAssetRows = (items, kind) => {
    const isNotes = kind === 'notes';
    const onChange = isNotes ? handleNoteChange : handlePyqChange;
    const onRemove = isNotes ? removeNoteRow : removePyqRow;
    const labelKey = isNotes ? 'title' : 'tag';
    return (
      <div className="ad-assets">
        {items.map((item, index) => (
          <div key={`${kind}-${index}`} className="ad-asset">
            <span className="ad-asset__num">{index + 1}</span>
            <div className="ad-asset__fields">
              <input
                className="neo-input"
                placeholder={isNotes ? 'Title, e.g. Unit 1 – Lexical Analysis' : 'Tag, e.g. Mid-1 2024'}
                value={item[labelKey]}
                onChange={(e) => onChange(index, labelKey, e.target.value)}
                aria-label={isNotes ? 'PDF title' : 'PYQ tag'}
              />
              <div className="neo-input-wrap">
                <Link2 size={16} />
                <input
                  className="neo-input"
                  placeholder="https://… link to the PDF"
                  value={item.link}
                  onChange={(e) => onChange(index, 'link', e.target.value)}
                  aria-label="Link"
                  aria-invalid={Boolean(item.link) && !/^https?:\/\//i.test(item.link.trim())}
                />
              </div>
            </div>
            <button
              type="button"
              className="neo-icon-btn neo-icon-btn--danger"
              onClick={() => onRemove(index)}
              aria-label={isNotes ? 'Remove PDF' : 'Remove PYQ'}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (loadingExamData) {
    return (
      <AdminLayout crumbs={[{ label: 'Dashboard', to: '/admin' }, { label: subjectData.subjectName || 'Subject' }]}>
        <Loader text="Loading syllabus, notes and PYQs…" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      crumbs={[
        { label: 'Dashboard', to: '/admin' },
        { label: isEditMode ? 'Edit subject' : 'New subject' },
      ]}
      eyebrow={`Semester ${subjectData.semester} · ${subjectData.courseType || ''} · ${normalizeBranches(subjectData.branches).join(', ')}`}
      title={subjectData.subjectName || 'New Subject'}
      subtitle={<span className="ad-code">{subjectData.courseCode}</span>}
    >
      <div className="ad-tabs">
        <Segmented options={tabs} value={activeTab} onChange={setActiveTab} ariaLabel="Subject content" />
      </div>

      <div className="ad-tabpanel" key={activeTab}>
        {/* SYLLABUS TAB */}
        {activeTab === 'syllabus' && (
          <>
            <section className="ad-panel ad-units-bar">
              <div>
                <h2 className="ad-panel__title">Units</h2>
                <p className="ad-panel__hint">Between 1 and 10. Students see topics in this order.</p>
              </div>
              <div className="ad-stepper" role="group" aria-label="Number of units">
                <button type="button" className="neo-icon-btn" onClick={() => changeUnitCount(unitCount - 1)} disabled={unitCount <= 1} aria-label="Remove a unit">
                  <Minus size={16} />
                </button>
                <span className="ad-stepper__value">{unitCount}</span>
                <button type="button" className="neo-icon-btn" onClick={() => changeUnitCount(unitCount + 1)} disabled={unitCount >= 10} aria-label="Add a unit">
                  <Plus size={16} />
                </button>
              </div>
            </section>

            <div className="ad-units">
              {Object.keys(unitDetails).map((key) => {
                const unitNum = Number(key);
                const unitData = unitDetails[unitNum];
                const topicCount = String(unitData.topics || '').split(',').map(t => t.trim()).filter(Boolean).length;

                return (
                  <section key={unitNum} className="ad-panel ad-unit">
                    <div className="ad-unit__head">
                      <span className="ad-unit__num">{String(unitNum).padStart(2, '0')}</span>
                      <input
                        className="neo-input ad-unit__name"
                        placeholder={`Unit ${unitNum} name, e.g. Lexical Analysis`}
                        value={unitData.name}
                        onChange={(e) => handleUnitChange(unitNum, 'name', e.target.value)}
                        aria-label={`Unit ${unitNum} name`}
                      />
                    </div>
                    <div className="neo-field">
                      <label className="neo-label" htmlFor={`topics-${unitNum}`}>
                        Topics <small>— separate with commas · {topicCount} topic{topicCount !== 1 ? 's' : ''}</small>
                      </label>
                      <textarea
                        id={`topics-${unitNum}`}
                        className="neo-input ad-textarea"
                        placeholder="finite automata, regular expressions, role of lexical analyzer…"
                        value={unitData.topics}
                        onChange={(e) => handleUnitChange(unitNum, 'topics', e.target.value)}
                      />
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}

        {/* NOTES / PDFs TAB */}
        {activeTab === 'notes' && (
          <section className="ad-panel">
            <div className="ad-panel__head">
              <div>
                <h2 className="ad-panel__title"><FileText size={18} /> Notes (PDFs)</h2>
                <p className="ad-panel__hint">Rows missing a title or link are skipped when you save.</p>
              </div>
              <NeoButton size="small" variant="secondary" icon={Plus} onClick={addNoteRow}>Add PDF</NeoButton>
            </div>
            {noteItems.length === 0
              ? <EmptyState compact title="No notes yet" message="Click “Add PDF” to attach your first note." />
              : renderAssetRows(noteItems, 'notes')}
          </section>
        )}

        {/* PYQs TAB */}
        {activeTab === 'pyqs' && (
          <section className="ad-panel">
            <div className="ad-panel__head">
              <div>
                <h2 className="ad-panel__title"><ClipboardList size={18} /> Previous year questions</h2>
                <p className="ad-panel__hint">Rows missing a tag or link are skipped when you save.</p>
              </div>
              <NeoButton size="small" variant="secondary" icon={Plus} onClick={addPyqRow}>Add PYQ</NeoButton>
            </div>
            {pyqItems.length === 0
              ? <EmptyState compact title="No PYQs yet" message="Click “Add PYQ” to attach a question paper." />
              : renderAssetRows(pyqItems, 'pyqs')}
          </section>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="ad-savebar">
        <span className="ad-savebar__text">
          {unitCount} unit{unitCount !== 1 ? 's' : ''} · {filledNotes} note{filledNotes !== 1 ? 's' : ''} · {filledPyqs} PYQ{filledPyqs !== 1 ? 's' : ''}
          <small>Everything saves together</small>
        </span>
        <div className="ad-savebar__actions">
          <NeoButton variant="secondary" kind="flat" onClick={() => navigate('/admin')} disabled={saving}>Cancel</NeoButton>
          <NeoButton size="big" icon={Save} loading={saving} onClick={handleSaveAll}>
            {saving ? (isEditMode ? 'Updating…' : 'Saving…') : (isEditMode ? 'Update subject' : 'Save subject')}
          </NeoButton>
        </div>
      </div>
    </AdminLayout>
  );
}
