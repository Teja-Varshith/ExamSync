import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Save, Loader, Book, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function AddSyllabus() {
  const navigate = useNavigate();
  const location = useLocation();
  const subjectData = location.state || {}; // Using state passed from AdminDashboard
  const isEditMode = Boolean(subjectData.isEdit);

  const [noOfUnits, setNoOfUnits] = useState(subjectData.noOfUnits || 1);
  const [saving, setSaving] = useState(false);
  const [assetsSaving, setAssetsSaving] = useState(false);

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

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

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

  const handleSave = async () => {
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

      const finalData = {
        ...subjectData,
        noOfUnits: parseInt(noOfUnits) || 1,
        // Ensure syllabus uses our new detailed object structure
        syllabus: unitDetails,
        notes: notesMap,
        pyqs: pyqsMap,
      };

      if (isEditMode) {
        await api.updateSubject(subjectData.courseCode, finalData);
        alert(`✅ Successfully updated "${subjectData.subjectName}" with ${finalData.noOfUnits} units!`);
      } else {
        await api.addSubject(finalData);
        alert(`✅ Successfully saved "${subjectData.subjectName}" with ${finalData.noOfUnits} units to Firestore!`);
      }
      navigate('/admin');
    } catch (err) {
      console.error('Failed to save subject:', err);
      alert(`❌ Failed to ${isEditMode ? 'update' : 'save'} subject. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssets = async () => {
    if (!subjectData.courseCode) {
      alert('Please save the subject syllabus first.');
      return;
    }

    setAssetsSaving(true);
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

      await api.updateSubjectAssets(subjectData.courseCode, notesMap, pyqsMap);
      alert('✅ Notes and PYQs saved to Firestore!');
    } catch (err) {
      console.error('Failed to save assets:', err);
      alert('❌ Failed to save notes and PYQs. Please try again.');
    } finally {
      setAssetsSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <div className="admin-syllabus-grid">
          <div className="admin-syllabus-main">
            {/* Back Header */}
            <button
              className="admin-back-btn"
              onClick={() => navigate('/admin')}
            >
              <ChevronLeft size={20} /> Back to Dashboard
            </button>

            {/* Subject Info Card */}
            <div className="admin-syllabus-header">
              <h2>{subjectData.subjectName || 'New Subject'}</h2>
              <p>{subjectData.courseCode} &middot; {subjectData.courseType}</p>
              <p className="admin-syllabus-subtext">
                Semester {subjectData.semester}
              </p>
            </div>

            {/* No. of Units */}
            <div className="admin-section">
              <div className="admin-units-row">
                <label className="admin-label admin-units-label">
                  <Book size={18} /> Number of Units
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="admin-input admin-units-input"
                  value={noOfUnits}
                  onChange={(e) => setNoOfUnits(e.target.value)}
                />
              </div>
            </div>

            {/* Dynamic Unit Sections */}
            <div className="admin-units-list">
              {Object.keys(unitDetails).map((key) => {
                const unitNum = Number(key);
                const unitData = unitDetails[unitNum];

                return (
                  <div key={unitNum} className="admin-section admin-unit-card">
                    <h3 className="admin-unit-title">Unit {unitNum}</h3>

                    <div className="admin-form-group">
                      <label className="admin-label">Unit Name</label>
                      <input
                        className="admin-input"
                        placeholder="e.g. Lexical Analysis"
                        value={unitData.name}
                        onChange={(e) => handleUnitChange(unitNum, 'name', e.target.value)}
                      />
                    </div>

                    <div className="admin-form-group admin-topics-group">
                      <label className="admin-label">Topics (comma separated)</label>
                      <textarea
                        className="admin-textarea admin-topics-textarea"
                        placeholder="e.g. finite automata, regular expressions, role of lexical analyzer..."
                        value={unitData.topics}
                        onChange={(e) => handleUnitChange(unitNum, 'topics', e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="btn btn-primary btn-lg admin-primary-action admin-sticky-action"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  {isEditMode ? 'Updating' : 'Saving'} to Firestore...
                </>
              ) : (
                <>
                  <Save size={18} /> {isEditMode ? 'Update' : 'Save'} Subject Syllabus
                </>
              )}
            </button>
          </div>

          <aside className="admin-syllabus-aside">
            <div className="admin-section admin-summary-card">
              <h3 className="admin-section-title">
                <Book size={18} /> Syllabus Overview
              </h3>
              <div className="admin-summary-item">
                <span className="admin-summary-label">Subject</span>
                <span className="admin-summary-value">{subjectData.subjectName || 'New Subject'}</span>
              </div>
              <div className="admin-summary-item">
                <span className="admin-summary-label">Course Code</span>
                <span className="admin-summary-value">{subjectData.courseCode || 'N/A'}</span>
              </div>
              <div className="admin-summary-item">
                <span className="admin-summary-label">Type</span>
                <span className="admin-summary-value">{subjectData.courseType || 'N/A'}</span>
              </div>
              <div className="admin-summary-item">
                <span className="admin-summary-label">Units</span>
                <span className="admin-summary-value">{Object.keys(unitDetails).length}</span>
              </div>
              <div className="admin-summary-item">
                <span className="admin-summary-label">Semester</span>
                <span className="admin-summary-value">Semester {subjectData.semester || 'N/A'}</span>
              </div>
            </div>

            <div className="admin-section admin-assets-card">
              <h3 className="admin-section-title">Notes (PDFs)</h3>
              <p className="admin-help-text">Add PDF title + link. Click save to store in Firestore.</p>
              <div className="admin-assets-list">
                {noteItems.map((item, index) => (
                  <div key={`note-${index}`} className="admin-asset-row">
                    <input
                      className="admin-input admin-asset-input"
                      placeholder={`PDF title ${index + 1}`}
                      value={item.title}
                      onChange={(e) => handleNoteChange(index, 'title', e.target.value)}
                    />
                    <div className="admin-asset-row-actions">
                      <input
                        className="admin-input admin-asset-input"
                        placeholder="PDF link"
                        value={item.link}
                        onChange={(e) => handleNoteChange(index, 'link', e.target.value)}
                      />
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => removeNoteRow(index)}
                        aria-label="Remove PDF"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-asset-actions">
                <button type="button" className="admin-mini-btn" onClick={addNoteRow}>
                  <Plus size={14} /> Add PDF
                </button>
                <button
                  type="button"
                  className="admin-mini-btn admin-mini-btn--primary"
                  onClick={handleSaveAssets}
                  disabled={!isEditMode || assetsSaving}
                >
                  {assetsSaving ? 'Saving...' : 'Save Notes/PYQs'}
                </button>
              </div>
            </div>

            <div className="admin-section admin-assets-card">
              <h3 className="admin-section-title">PYQs</h3>
              <p className="admin-help-text">Add tag name + link for PYQs.</p>
              <div className="admin-assets-list">
                {pyqItems.map((item, index) => (
                  <div key={`pyq-${index}`} className="admin-asset-row">
                    <input
                      className="admin-input admin-asset-input"
                      placeholder={`Tag name ${index + 1}`}
                      value={item.tag}
                      onChange={(e) => handlePyqChange(index, 'tag', e.target.value)}
                    />
                    <div className="admin-asset-row-actions">
                      <input
                        className="admin-input admin-asset-input"
                        placeholder="PYQ link"
                        value={item.link}
                        onChange={(e) => handlePyqChange(index, 'link', e.target.value)}
                      />
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => removePyqRow(index)}
                        aria-label="Remove PYQ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-asset-actions">
                <button type="button" className="admin-mini-btn" onClick={addPyqRow}>
                  <Plus size={14} /> Add PYQ
                </button>
                <button
                  type="button"
                  className="admin-mini-btn admin-mini-btn--primary"
                  onClick={handleSaveAssets}
                  disabled={!isEditMode || assetsSaving}
                >
                  {assetsSaving ? 'Saving...' : 'Save Notes/PYQs'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
