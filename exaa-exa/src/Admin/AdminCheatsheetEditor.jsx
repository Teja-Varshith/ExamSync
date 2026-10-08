import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Trash2, PencilLine, ChevronRight,
  Upload, X, Check, Type, Image as ImageIcon, Plus
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ResizableImage from '../components/editor/ResizableImage';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, deleteField } from 'firebase/firestore';
import { getCollegeId } from '../services/api';
import { uploadImageToSupabase, processHtmlImages } from '../supabase';

// ─── Local Storage Helpers ───────────────────────────────────────
const STORAGE_KEY = 'admin_cheatsheet_questions';

function getStoredQuestions(subjectCode, examType) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return all[`${subjectCode}_${examType}`] || [];
  } catch { return []; }
}

function saveStoredQuestions(subjectCode, examType, questions) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    all[`${subjectCode}_${examType}`] = questions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) { console.error('Save failed', e); }
}

// ─── Supabase Image Upload ───────────────────────────────────────
function triggerSupabaseImageUpload(editor, setUploading) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await uploadImageToSupabase(file);
      editor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Image upload failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };
  input.click();
}

// ─── Dark Toolbar Component ──────────────────────────────────────
function DarkEditorToolbar({ editor, uploading, setUploading }) {
  if (!editor) return null;

  const ToolbarBtn = ({ onClick, isActive, disabled, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`admin-editor-toolbar-btn ${isActive ? 'active' : ''}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="admin-editor-toolbar-divider" />;

  return (
    <div className="admin-editor-toolbar">
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <strong>B</strong>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <em>I</em>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <u>U</u>
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
        H1
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
        H2
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
        H3
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h7" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn onClick={() => triggerSupabaseImageUpload(editor, setUploading)} disabled={uploading} title="Insert Image">
        {uploading ? (
          <svg width="16" height="16" className="admin-spin" fill="none" viewBox="0 0 24 24">
            <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <ImageIcon size={16} />
        )}
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().insertContent('<p><strong>[Formula: Enter equation here]</strong></p>').run()}
        title="Insert Formula Placeholder"
      >
        <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>f(x)</span>
      </ToolbarBtn>
    </div>
  );
}

// ─── Dark-Themed Editor Wrapper ──────────────────────────────────
function DarkEditor({ onContentChange, initialContent = '', editorKey }) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      ResizableImage,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing your answer here...' }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => onContentChange?.(editor.getHTML()),
    editorProps: {
      attributes: { class: 'admin-tiptap-editor' },
    },
  }, [editorKey]);

  return (
    <div className="admin-editor-wrapper">
      <DarkEditorToolbar editor={editor} uploading={uploading} setUploading={setUploading} />
      <div className="admin-editor-content">
        <EditorContent editor={editor} />
      </div>
      {uploading && (
        <div className="admin-editor-uploading">
          <svg width="14" height="14" className="admin-spin" fill="none" viewBox="0 0 24 24">
            <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading image...
        </div>
      )}
    </div>
  );
}

// ─── Question Type Options ───────────────────────────────────────
const DEFAULT_TAGS = ['Pakka Chadavali Amma', 'Evi kooda chudali'];

// ═════════════════════════════════════════════════════════════════
//  Main Component
// ═════════════════════════════════════════════════════════════════
export default function AdminCheatsheetEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    subjectName = 'Unknown Subject',
    courseCode = '',
    semester = 1,
    examType = 'mid1',
    examLabel = 'MID 1',
  } = location.state || {};

  // Editor state
  const [questionType, setQuestionType] = useState('Pakka Chadavali Amma');
  const [question, setQuestion] = useState('');
  const [answerHtml, setAnswerHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Dynamic tags — admin can add new ones
  const [tagOptions, setTagOptions] = useState([...DEFAULT_TAGS]);
  const [newTagInput, setNewTagInput] = useState('');

  // Saved questions
  const [questions, setQuestions] = useState([]);

  // Edit mode
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswerHtml, setEditAnswerHtml] = useState('');
  const [editType, setEditType] = useState('Pakka Chadavali Amma');
  const [editEditorKey, setEditEditorKey] = useState(100);

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  // Load questions: Firebase first, then localStorage fallback
  const examKeyMap = { mid1: 'Mid 1', mid2: 'Mid 2', sem: 'Sem' };

  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
        if (courseCode) {
          const cid = getCollegeId();

          // 1. Read customTags from subject metadata doc
          const metaRef = doc(db, 'examsync', cid, 'subjects', courseCode);
          const metaSnap = await getDoc(metaRef);
          if (metaSnap.exists()) {
            const metaData = metaSnap.data();
            if (Array.isArray(metaData?.customTags) && metaData.customTags.length > 0) {
              const merged = [...new Set([...DEFAULT_TAGS, ...metaData.customTags])];
              setTagOptions(merged);
            }
          }

          // 2. Read ImpQuestions from exam_data/ImpQuestions document
          const examRef = doc(db, 'examsync', cid, 'subjects', courseCode, 'exam_data', 'ImpQuestions');
          const examSnap = await getDoc(examRef);

          if (examSnap.exists()) {
            const examData = examSnap.data();
            const firebaseKey = examKeyMap[examType] || examType;
            const impData = examData?.data?.[firebaseKey] || examData?.[firebaseKey];

            if (impData && typeof impData === 'object' && Object.keys(impData).length > 0) {
              const firebaseQuestions = Object.entries(impData)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([key, val]) => ({
                  id: `fb_${key}_${Date.now()}`,
                  question: val.question || '',
                  answerHtml: val.answer || '',
                  questionType: val.tag || 'Pakka Chadavali Amma',
                  createdAt: new Date().toISOString(),
                  fromFirebase: true,
                }));

              setQuestions(firebaseQuestions);
              saveStoredQuestions(courseCode, examType, firebaseQuestions);
              setLoadingQuestions(false);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch from Firebase:', err);
      }

      // Fallback to localStorage
      setQuestions(getStoredQuestions(courseCode, examType));
      setLoadingQuestions(false);
    };

    loadQuestions();
  }, [courseCode, examType]);

  // Add a new custom tag
  const handleAddTag = () => {
    const tag = newTagInput.trim();
    if (!tag) return;
    if (tagOptions.includes(tag)) {
      alert('This tag already exists!');
      return;
    }
    setTagOptions(prev => [...prev, tag]);
    setQuestionType(tag); // Auto-select the new tag
    setNewTagInput('');
  };

  // Remove a custom tag (only non-default ones)
  const handleRemoveTag = (tag) => {
    if (DEFAULT_TAGS.includes(tag)) return; // Can't remove defaults
    if (!window.confirm(`Remove tag "${tag}"?`)) return;
    setTagOptions(prev => prev.filter(t => t !== tag));
    // If currently selected tag is being removed, switch to first tag
    if (questionType === tag) setQuestionType(tagOptions[0] || DEFAULT_TAGS[0]);
    if (editType === tag) setEditType(tagOptions[0] || DEFAULT_TAGS[0]);
  };

  // Save new question
  const handleSave = () => {
    if (!question.trim()) {
      alert('Please enter a question title.');
      return;
    }
    if (!answerHtml || answerHtml === '<p></p>') {
      alert('Please write an answer before saving.');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      const newQ = {
        id: `q_${Date.now()}`,
        questionType,
        question: question.trim(),
        answerHtml,
        createdAt: new Date().toISOString(),
      };

      const updated = [...questions, newQ];
      setQuestions(updated);
      saveStoredQuestions(courseCode, examType, updated);

      setSaving(false);
      setSaved(true);

      setTimeout(() => {
        setQuestion('');
        setAnswerHtml('');
        setSaved(false);
        setEditorKey(k => k + 1);
      }, 1500);
    }, 400);
  };

  // Delete question
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question permanently?')) return;
    
    const qToRemove = questions.find(q => q.id === id);
    if (!qToRemove) return;

    // Direct Firebase deletion if it originated from Firebase
    if (qToRemove.fromFirebase && courseCode) {
      try {
        const examMap = { mid1: 'Mid 1', mid2: 'Mid 2', sem: 'Sem' };
        const firebaseExamKey = examMap[examType] || examType;
        
        // Extract the original Firebase map key (e.g., "1", "2") from something like "fb_1_1712xxxxxx"
        const originalKey = qToRemove.id.split('_')[1];
        
        if (originalKey) {
          const examRef = doc(db, 'examsync', getCollegeId(), 'subjects', courseCode, 'exam_data', 'ImpQuestions');
          await updateDoc(examRef, {
            [`data.${firebaseExamKey}.${originalKey}`]: deleteField()
          });
        }
      } catch (err) {
        console.error('Failed to delete directly from Firebase:', err);
        alert('Failed to delete from Firebase. Please try again.');
        return; // Halt local deletion if server deletion failed
      }
    }

    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    saveStoredQuestions(courseCode, examType, updated);
  };

  // Start editing
  const startEditing = (q) => {
    setEditingId(q.id);
    setEditQuestion(q.question);
    setEditAnswerHtml(q.answerHtml);
    setEditType(q.questionType || 'Pakka Chadavali Amma');
    setEditEditorKey(k => k + 1);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditQuestion('');
    setEditAnswerHtml('');
    setEditType('Pakka Chadavali Amma');
  };

  // Save edits
  const handleUpdateQuestion = () => {
    if (!editQuestion.trim()) {
      alert('Question cannot be empty.');
      return;
    }
    const updated = questions.map(q =>
      q.id === editingId
        ? { ...q, question: editQuestion.trim(), answerHtml: editAnswerHtml, questionType: editType }
        : q
    );
    setQuestions(updated);
    saveStoredQuestions(courseCode, examType, updated);
    cancelEditing();
  };

  // ─── Upload to Firebase ─────────────────────────────────────────
  const handleUploadToFirebase = async () => {
    if (questions.length === 0) {
      if (!window.confirm('There are no questions in this cheatsheet. Saving will delete all questions for this exam from Firebase. Continue?')) {
        return;
      }
    }
    if (!courseCode) {
      alert('Subject code not found. Cannot save.');
      return;
    }

    setUploading(true);
    try {
      const cid = getCollegeId();
      const examRef = doc(db, 'examsync', cid, 'subjects', courseCode, 'exam_data', 'ImpQuestions');

      // Build the numbered map, processing images through Supabase first
      const questionsMap = {};
      for (let index = 0; index < questions.length; index++) {
        const q = questions[index];
        // Process any base64 images in the answer HTML → upload to Supabase
        const processedAnswer = await processHtmlImages(q.answerHtml);
        questionsMap[String(index + 1)] = {
          question: q.question,
          answer: processedAnswer,
          tag: q.questionType || 'Pakka Chadavali Amma',
        };
      }

      // Map examType to Firebase key
      const examKeyMap = { mid1: 'Mid 1', mid2: 'Mid 2', sem: 'Sem' };
      const firebaseExamKey = examKeyMap[examType] || examType;

      // Fetch existing ImpQuestions to merge (don't overwrite other exam types)
      const examSnap = await getDoc(examRef);
      let existingImpQuestions = {};
      if (examSnap.exists()) {
        existingImpQuestions = examSnap.data().data || examSnap.data(); // Fallback for old structure if any
      }

      // Merge the new exam type into existing ImpQuestions
      existingImpQuestions[firebaseExamKey] = questionsMap;

      // Save custom tags (non-default ones)
      const customTags = tagOptions.filter(t => !DEFAULT_TAGS.includes(t));

      // Save ImpQuestions to exam_data/ImpQuestions
      await setDoc(examRef, { data: existingImpQuestions }, { merge: true });

      // Save customTags to subject metadata document
      const metaRef = doc(db, 'examsync', cid, 'subjects', courseCode);
      const metaSnap = await getDoc(metaRef);
      if (metaSnap.exists()) {
        await updateDoc(metaRef, { customTags });
      }

      // Clear local storage for this exam
      const updated = [];
      setQuestions(updated);
      saveStoredQuestions(courseCode, examType, updated);
      setQuestion('');
      setAnswerHtml('');
      setEditorKey(k => k + 1);

      alert(`✅ Cheatsheet saved to Firebase under "${firebaseExamKey}" successfully!`);
      navigate('/admin/cheatsheets', { state: { subjectName, courseCode, semester } });
    } catch (err) {
      console.error('Firebase save failed:', err);
      alert('❌ Save failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-shell admin-editor-shell">
        {/* Breadcrumb */}
        <div className="admin-editor-breadcrumb">
          <button onClick={() => navigate('/admin')} className="admin-editor-breadcrumb-link">
            Dashboard
          </button>
          <ChevronRight size={12} />
          <button
            onClick={() => navigate('/admin/cheatsheets', {
              state: { subjectName, courseCode, semester }
            })}
            className="admin-editor-breadcrumb-link"
          >
            {subjectName}
          </button>
          <ChevronRight size={12} />
          <span className="admin-editor-breadcrumb-current">
            {examLabel} Cheatsheet
          </span>
        </div>

        {/* Page Header */}
        <div className="admin-editor-header">
          <div className="admin-editor-header-left">
            <h1 className="admin-editor-page-title">
              {examLabel} — Cheatsheet
            </h1>
            <p className="admin-editor-page-subtitle">
              <span className="admin-editor-subject-name">{subjectName}</span>
              {courseCode && <span className="admin-editor-code-chip">{courseCode}</span>}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/cheatsheets', {
              state: { subjectName, courseCode, semester }
            })}
            className="admin-editor-back-btn"
          >
            <ArrowLeft size={16} />
            Back to Subject
          </button>
        </div>

        {/* ═══ Editor Canvas ═══ */}
        <div className="admin-editor-canvas">
          {/* Top Meta Bar */}
          <div className="admin-editor-meta-bar">
            <div className="admin-editor-type-selector">
              <span className="admin-editor-type-label">Tag:</span>
              <div className="admin-editor-type-toggle">
                {tagOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQuestionType(t)}
                    className={`admin-editor-type-btn ${questionType === t ? 'active' : ''}`}
                  >
                    {t}
                    {!DEFAULT_TAGS.includes(t) && (
                      <span
                        className="admin-editor-tag-remove"
                        onClick={(e) => { e.stopPropagation(); handleRemoveTag(t); }}
                        title="Remove tag"
                      >
                        ×
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="admin-editor-tag-add">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="New tag..."
                  className="admin-editor-tag-input"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="admin-editor-tag-add-btn"
                  disabled={!newTagInput.trim()}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            <div className="admin-editor-save-area">
              {saved && (
                <span className="admin-editor-saved-badge">
                  <Check size={14} /> Saved
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="admin-editor-save-btn"
              >
                <Save size={14} />
                {saving ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </div>

          {/* Document Body */}
          <div className="admin-editor-document">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Untitled Question..."
              className="admin-editor-title-input"
            />
            <div className="admin-editor-divider" />
            <DarkEditor
              onContentChange={setAnswerHtml}
              initialContent=""
              editorKey={editorKey}
            />
          </div>
        </div>

        {/* ═══ Saved Questions List ═══ */}
        {loadingQuestions ? (
          <div className="admin-editor-questions-section">
            <div className="admin-editor-questions-header">
              <h2 className="admin-editor-questions-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" className="admin-spin" fill="none" viewBox="0 0 24 24">
                  <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading questions from Firebase...
              </h2>
            </div>
          </div>
        ) : questions.length > 0 && (
          <div className="admin-editor-questions-section">
            <div className="admin-editor-questions-header">
              <h2 className="admin-editor-questions-title">
                Saved Questions ({questions.length})
                {questions.some(q => q.fromFirebase) && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#50E3A4',
                    background: 'rgba(80, 227, 164, 0.1)',
                    border: '1px solid rgba(80, 227, 164, 0.25)',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    marginLeft: '12px',
                    verticalAlign: 'middle',
                  }}>
                    ☁️ Loaded from Firebase
                  </span>
                )}
              </h2>
            </div>

            <div className="admin-editor-questions-list">
              {questions.map((cs, index) => (
                <div key={cs.id} className="admin-editor-question-card" style={{ animationDelay: `${index * 60}ms` }}>
                  {editingId === cs.id ? (
                    /* ── Inline Edit Mode ── */
                    <div className="admin-editor-edit-mode">
                      <div className="admin-editor-edit-top">
                        <span className="admin-editor-edit-label">Editing Question</span>
                        <div className="admin-editor-edit-types">
                          {tagOptions.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setEditType(t)}
                              className={`admin-editor-type-btn small ${editType === t ? 'active' : ''}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        placeholder="Question title"
                        className="admin-editor-title-input small"
                      />
                      <DarkEditor
                        onContentChange={setEditAnswerHtml}
                        initialContent={cs.answerHtml}
                        editorKey={editEditorKey}
                      />
                      <div className="admin-editor-edit-actions">
                        <button onClick={handleUpdateQuestion} className="admin-editor-save-btn">
                          <Check size={14} /> Save Changes
                        </button>
                        <button onClick={cancelEditing} className="admin-editor-cancel-btn">
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── View Mode ── */
                    <>
                      <div className="admin-editor-question-top">
                        <div className="admin-editor-question-info">
                          <div className="admin-editor-question-meta">
                            <span className="admin-editor-question-num">Q{index + 1}.</span>
                            <span className="admin-editor-question-type-badge">
                              {cs.questionType || 'Pakka Chadavali Amma'}
                            </span>
                          </div>
                          <h3 className="admin-editor-question-text">{cs.question}</h3>
                        </div>
                        <div className="admin-editor-question-actions">
                          <button onClick={() => startEditing(cs)} className="admin-editor-icon-btn" title="Edit">
                            <PencilLine size={16} />
                          </button>
                          <button onClick={() => handleDelete(cs.id)} className="admin-editor-icon-btn danger" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="admin-editor-answer-preview" dangerouslySetInnerHTML={{ __html: cs.answerHtml }} />
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <div className="admin-editor-upload-area">
              <button
                className="admin-editor-upload-btn"
                onClick={handleUploadToFirebase}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <svg width="18" height="18" className="admin-spin" fill="none" viewBox="0 0 24 24">
                      <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading to Firebase...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Save Changes to Firebase
                  </>
                )}
              </button>
              <p className="admin-editor-upload-hint">
                {uploading
                  ? 'Saving questions to Firestore...'
                  : `Finalize your cheatsheet with all ${questions.length} question${questions.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
