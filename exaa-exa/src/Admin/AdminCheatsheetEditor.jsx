import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Save, Trash2, PencilLine, ChevronRight, ChevronLeft,
  X, Check, Image as ImageIcon, Plus, CloudUpload, Eye, Sparkles, Code2, Type
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ResizableImage from '../components/editor/ResizableImage';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, deleteField, FieldPath } from 'firebase/firestore';
import { getCollegeId } from '../services/api';
import { uploadImageToImageKit, processHtmlImages } from '../imagekit';
import AdminLayout from '../components/layout/AdminLayout';
import NeoButton from '../components/ui/NeoButton';
import { useConfirm } from '../components/ui/useConfirm';
import toast from '../components/ui/toast';
import Loader from '../components/Loader/Loader';
import Segmented from '../components/ui/Segmented';
import MobilePreview from './components/MobilePreview';
import { aiFormatAnswer } from '../services/aiFormat';
import { sanitizeHtml, isEditorCompatible, isHtmlEmpty } from '../utils/sanitizeHtml';
import EmptyState from '../components/ui/EmptyState';

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

// ─── ImageKit Image Upload ───────────────────────────────────────
function triggerImageKitUpload(editor, setUploading) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await uploadImageToImageKit(file);
      editor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
      toast.success('Image uploaded', 'Image uploaded to ImageKit CDN.');
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Image upload failed', err?.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };
  input.click();
}

function ToolbarBtn({ onClick, isActive, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`admin-editor-toolbar-btn ${isActive ? 'active' : ''}`}
    >
      {children}
    </button>
  );
}

const Divider = () => <div className="admin-editor-toolbar-divider" />;

// ─── Dark Toolbar Component ──────────────────────────────────────
function DarkEditorToolbar({ editor, uploading, setUploading }) {
  if (!editor) return null;

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

      <ToolbarBtn onClick={() => triggerImageKitUpload(editor, setUploading)} disabled={uploading} title="Insert Image">
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

  const confirm = useConfirm();

  // Editor state
  const [questionType, setQuestionType] = useState('Pakka Chadavali Amma');
  const [question, setQuestion] = useState('');
  const [answerHtml, setAnswerHtml] = useState(''); // "Normal" rich-text editor HTML

  // "HTML code" section — AI-generated / hand-edited HTML
  const [codeHtml, setCodeHtml] = useState('');
  const [lastAiHtml, setLastAiHtml] = useState('');
  const [useCode, setUseCode] = useState(false); // which version is pushed & shown to students
  const [answerTab, setAnswerTab] = useState('normal');
  const [aiLoading, setAiLoading] = useState(false);
  const [preview, setPreview] = useState(null); // { items, startIndex, title }

  // What students will actually see for the question in the editor
  const finalAnswer = useCode ? codeHtml : answerHtml;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Dynamic tags — admin can add new ones
  const [tagOptions, setTagOptions] = useState([...DEFAULT_TAGS]);
  const [newTagInput, setNewTagInput] = useState('');

  // Saved questions
  const [questions, setQuestions] = useState([]);

  // Edit mode
  const [editingId, setEditingId] = useState(null);

  // Load questions: Firebase first, then localStorage fallback
  const examKeyMap = { mid1: 'Mid 1', mid2: 'Mid 2', sem: 'Sem' };

  useEffect(() => {
    let cancelled = false; // ignore results from a superseded run (StrictMode / exam switch)

    const loadQuestions = async () => {
      setLoadingQuestions(true);
      // Drafts pushed to the list but never saved to Firebase
      const localDrafts = getStoredQuestions(courseCode, examType).filter(q => !q.fromFirebase);

      if (!courseCode) {
        setQuestions(localDrafts);
        setLoadingQuestions(false);
        return;
      }

      try {
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
        const examData = examSnap.exists() ? examSnap.data() : {};
        const firebaseKey = examKeyMap[examType] || examType;
        const impData = examData?.data?.[firebaseKey] || examData?.[firebaseKey] || {};

        const firebaseQuestions = Object.entries(impData)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([key, val]) => ({
            id: `fb_${key}_${Date.now()}`,
            fbKey: key,
            question: val.question || '',
            answerHtml: val.answer || '',
            questionType: val.tag || 'Pakka Chadavali Amma',
            createdAt: new Date().toISOString(),
            fromFirebase: true,
          }));

        if (cancelled) return;
        // Firebase wins — stale cached copies of deleted questions are dropped
        const merged = [...firebaseQuestions, ...localDrafts];
        setQuestions(merged);
        saveStoredQuestions(courseCode, examType, merged);
        if (localDrafts.length) {
          toast.warning(
            `${localDrafts.length} unsaved draft${localDrafts.length !== 1 ? 's' : ''} restored`,
            'They are only on this device until you Save to Firebase.'
          );
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch from Firebase:', err);
        // Offline / permission error — show the last local copy, but say so
        setQuestions(getStoredQuestions(courseCode, examType));
        toast.error('Could not load from Firebase', 'Showing the copy saved on this device.');
      } finally {
        if (!cancelled) setLoadingQuestions(false);
      }
    };

    loadQuestions();
    return () => { cancelled = true; };
  }, [courseCode, examType]);

  // Add a new custom tag
  const handleAddTag = () => {
    const tag = newTagInput.trim();
    if (!tag) return;
    if (tagOptions.includes(tag)) {
      toast.warning('That tag already exists');
      return;
    }
    setTagOptions(prev => [...prev, tag]);
    setQuestionType(tag); // Auto-select the new tag
    setNewTagInput('');
  };

  // Remove a custom tag (only non-default ones)
  const handleRemoveTag = async (tag) => {
    if (DEFAULT_TAGS.includes(tag)) return; // Can't remove defaults
    const inUse = questions.filter(q => q.questionType === tag).length;
    const ok = await confirm({
      title: `Remove tag “${tag}”?`,
      message: inUse
        ? `${inUse} question${inUse !== 1 ? 's' : ''} still use this tag and will keep it until you edit them.`
        : 'No questions use this tag.',
      confirmLabel: 'Remove tag',
      tone: 'danger',
    });
    if (!ok) return;
    setTagOptions(prev => prev.filter(t => t !== tag));
    // If currently selected tag is being removed, switch to first default tag
    if (questionType === tag) setQuestionType(DEFAULT_TAGS[0]);
  };

  const resetCodeState = () => {
    setCodeHtml('');
    setLastAiHtml('');
    setUseCode(false);
    setAnswerTab('normal');
  };

  // ── AI: Normal answer → structured HTML (Groq via /api/ai-format) ──
  const handleAiFormat = async () => {
    if (isHtmlEmpty(answerHtml)) {
      toast.warning('Write the answer in Normal first', 'AI formats what you typed in the Normal editor.');
      setAnswerTab('normal');
      return;
    }
    if (codeHtml && codeHtml !== lastAiHtml) {
      const ok = await confirm({
        title: 'Replace your HTML code?',
        message: 'AI will regenerate it from the Normal answer. Edits you made in the HTML code section will be lost.',
        confirmLabel: 'Regenerate',
        tone: 'premium',
      });
      if (!ok) return;
    }
    setAiLoading(true);
    try {
      const html = await aiFormatAnswer({ question: question.trim(), answerHtml });
      setCodeHtml(html);
      setLastAiHtml(html);
      setUseCode(true);
      setAnswerTab('code');
      toast.success('Answer formatted', 'Review the HTML code, then Preview it.');
    } catch (err) {
      console.error('AI format failed:', err);
      toast.error('AI formatting failed', err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const previewDraft = () => {
    if (!question.trim() && isHtmlEmpty(finalAnswer)) {
      toast.warning('Nothing to preview yet', 'Write a question and an answer first.');
      return;
    }
    setPreview({
      title: 'Preview · current draft',
      startIndex: 0,
      items: [{ question: question.trim(), answer: finalAnswer, tag: questionType }],
    });
  };

  const previewSaved = (index) => {
    setPreview({
      title: 'Preview · saved questions',
      startIndex: index,
      items: questions.map((q) => ({ question: q.question, answer: q.answerHtml, tag: q.questionType })),
    });
  };

  // Start editing in the main left panel
  const startEditing = async (q) => {
    const dirty = editingId || question.trim() || !isHtmlEmpty(answerHtml) || codeHtml.trim();
    if (dirty && q.id !== editingId) {
      const ok = await confirm({
        title: 'Discard current draft?',
        message: 'The question open in the editor has changes that are not pushed yet.',
        confirmLabel: 'Discard & edit',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setEditingId(q.id);
    setQuestion(q.question);
    setAnswerHtml(q.answerHtml);
    // Rich HTML (tables, h4…) can't round-trip through the Normal editor — open it as code
    const asCode = !isEditorCompatible(q.answerHtml);
    setCodeHtml(q.answerHtml);
    setLastAiHtml(q.answerHtml);
    setUseCode(asCode);
    setAnswerTab(asCode ? 'code' : 'normal');
    setQuestionType(q.questionType || 'Pakka Chadavali Amma');
    setEditorKey(k => k + 1);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setQuestion('');
    setAnswerHtml('');
    resetCodeState();
    setQuestionType(tagOptions[0] || DEFAULT_TAGS[0]);
    setEditorKey(k => k + 1);
  };

  // Unified save or update question
  const handleSave = () => {
    if (!question.trim()) {
      toast.warning('Add the question first', 'Type it in the title field above the answer.');
      return;
    }
    if (isHtmlEmpty(finalAnswer)) {
      toast.warning(
        'Write an answer before pushing',
        useCode ? 'The HTML code section is selected but empty.' : undefined
      );
      return;
    }
    const answerToSave = useCode ? sanitizeHtml(codeHtml) : answerHtml;

    setSaving(true);
    setTimeout(() => {
      let updated;
      if (editingId) {
        updated = questions.map(q =>
          q.id === editingId
            ? { ...q, question: question.trim(), answerHtml: answerToSave, questionType }
            : q
        );
      } else {
        const newQ = {
          id: `q_${Date.now()}`,
          questionType,
          question: question.trim(),
          answerHtml: answerToSave,
          createdAt: new Date().toISOString(),
        };
        updated = [...questions, newQ];
      }

      setQuestions(updated);
      saveStoredQuestions(courseCode, examType, updated);

      setSaving(false);
      setSaved(true);

      setTimeout(() => {
        setEditingId(null);
        setQuestion('');
        setAnswerHtml('');
        resetCodeState();
        setSaved(false);
        setEditorKey(k => k + 1);
        setIsRightPanelOpen(true);
      }, 1500);
    }, 400);
  };

  // Delete question
  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete this question?',
      message: 'Questions already saved to Firebase are removed for students immediately.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;

    const qToRemove = questions.find(q => q.id === id);
    if (!qToRemove) return;

    // Direct Firebase deletion if it originated from Firebase
    if (qToRemove.fromFirebase && courseCode) {
      try {
        const examMap = { mid1: 'Mid 1', mid2: 'Mid 2', sem: 'Sem' };
        const firebaseExamKey = examMap[examType] || examType;

        // Original Firebase map key ("1", "2", …); older items only carry it inside the id "fb_1_1712…"
        const originalKey = qToRemove.fbKey || qToRemove.id.split('_')[1];

        if (originalKey) {
          const examRef = doc(db, 'examsync', getCollegeId(), 'subjects', courseCode, 'exam_data', 'ImpQuestions');
          // FieldPath keeps "Mid 1" (with its space) as one segment
          await updateDoc(examRef, new FieldPath('data', firebaseExamKey, originalKey), deleteField());
        }
      } catch (err) {
        // The document was already removed (e.g. deleted in the Firebase console) — nothing left to delete
        if (err?.code !== 'not-found') {
          console.error('Failed to delete directly from Firebase:', err);
          toast.error('Could not delete from Firebase', err?.message || 'Please try again.');
          return; // Halt local deletion if server deletion failed
        }
      }
    }

    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    saveStoredQuestions(courseCode, examType, updated);
    if (editingId === id) cancelEditing();
    toast.success('Question deleted');
  };

  // ─── Upload to Firebase ─────────────────────────────────────────
  const handleUploadToFirebase = async () => {
    if (questions.length === 0) {
      const ok = await confirm({
        title: 'Save an empty cheat sheet?',
        message: 'This removes every question for this exam from Firebase.',
        confirmLabel: 'Clear exam',
        tone: 'danger',
      });
      if (!ok) return;
    }
    if (!courseCode) {
      toast.error('Subject code missing', 'Go back to the subject and open the cheat sheet again.');
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
      resetCodeState();
      setEditorKey(k => k + 1);

      toast.success(`${examLabel} cheat sheet saved`, 'Students can see the questions now.');
      navigate('/admin/cheatsheets', { state: { subjectName, courseCode, semester } });
    } catch (err) {
      console.error('Firebase save failed:', err);
      toast.error('Save failed', err?.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout
      wide
      crumbs={[
        { label: 'Dashboard', to: '/admin' },
        { label: subjectName, to: '/admin/cheatsheets', state: { subjectName, courseCode, semester } },
        { label: `${examLabel} cheat sheet` },
      ]}
      eyebrow={`${subjectName}${courseCode ? ` · ${courseCode}` : ''}`}
      title={`${examLabel} cheat sheet`}
      subtitle="1. Pick a tag  →  2. Write the question & answer  →  3. Push to list  →  4. Save to Firebase"
    >
      <div className="admin-editor-page">
        <div className="admin-editor-split-layout">
          {/* ═══ Left Panel: Editor Canvas ═══ */}
          <div className={`admin-editor-left-panel ${!isRightPanelOpen ? 'expanded' : ''}`}>
            <div className="admin-editor-canvas">
              {/* Top Meta Bar */}
              <div className="admin-editor-meta-bar">
                <div className="admin-editor-type-selector">
                  <span className="neo-label">Tag</span>
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
                            role="button"
                            aria-label={`Remove tag ${t}`}
                            onClick={(e) => { e.stopPropagation(); handleRemoveTag(t); }}
                            title="Remove tag"
                          >
                            <X size={12} />
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
                      placeholder="New tag…"
                      className="neo-input admin-editor-tag-input"
                      aria-label="New tag name"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="neo-icon-btn"
                      disabled={!newTagInput.trim()}
                      aria-label="Add tag"
                      title="Add tag"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="admin-editor-save-area">
                  {saved && (
                    <span className="neo-chip neo-chip--success">
                      <Check size={12} /> {editingId ? 'Updated' : 'Added'}
                    </span>
                  )}
                  {editingId && (
                    <NeoButton variant="secondary" kind="flat" icon={X} onClick={cancelEditing} disabled={saving}>
                      Cancel
                    </NeoButton>
                  )}
                  <NeoButton
                    onClick={handleSave}
                    loading={saving}
                    icon={editingId ? Save : undefined}
                    iconRight={editingId ? undefined : ArrowRight}
                  >
                    {saving ? 'Saving…' : editingId ? 'Update question' : 'Push to list'}
                  </NeoButton>
                </div>
              </div>

              {editingId && (
                <div className="neo-alert admin-editor-editing-note">
                  <PencilLine size={16} />
                  <span>Editing <strong>Q{questions.findIndex(q => q.id === editingId) + 1}</strong>. Update it, or cancel to start a new question.</span>
                </div>
              )}

              {/* Document Body */}
              <div className="admin-editor-document">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type the question…"
                  className="admin-editor-title-input"
                  aria-label="Question"
                />
                <div className="ae-answerbar">
                  <Segmented
                    size="small"
                    ariaLabel="Answer section"
                    value={answerTab}
                    onChange={setAnswerTab}
                    options={[
                      { value: 'normal', label: 'Normal', icon: Type, badge: useCode ? null : 'Live' },
                      { value: 'code', label: 'HTML code', icon: Code2, badge: useCode ? 'Live' : null },
                    ]}
                  />
                  <div className="ae-answerbar__actions">
                    <NeoButton size="small" variant="secondary" kind="flat" icon={Eye} onClick={previewDraft}>
                      Preview
                    </NeoButton>
                    <NeoButton
                      size="small"
                      variant="premium"
                      icon={Sparkles}
                      loading={aiLoading}
                      onClick={handleAiFormat}
                      title="Turn the Normal answer into structured HTML with AI"
                    >
                      {aiLoading ? 'Formatting…' : 'AI format'}
                    </NeoButton>
                  </div>
                </div>

                {/* NORMAL — rich-text editor (kept mounted so undo history survives tab switches) */}
                <div hidden={answerTab !== 'normal'}>
                  {useCode && (
                    <div className="neo-alert ae-source-note">
                      <Code2 size={16} />
                      <span>
                        Students will see the <strong>HTML code</strong> version.{' '}
                        <button type="button" onClick={() => setUseCode(false)}>Use Normal instead</button>
                      </span>
                    </div>
                  )}
                  <DarkEditor
                    onContentChange={setAnswerHtml}
                    initialContent={answerHtml}
                    editorKey={editorKey}
                  />
                </div>

                {/* HTML CODE — AI output, editable */}
                {answerTab === 'code' && (
                  <div className="ae-code">
                    <div className="ae-code__head">
                      <label className="ae-code__use">
                        <input
                          type="checkbox"
                          checked={useCode}
                          onChange={(e) => setUseCode(e.target.checked)}
                          disabled={!codeHtml.trim()}
                        />
                        <span>Use this HTML as the answer</span>
                      </label>
                      <span className="ae-code__meta">
                        {codeHtml === lastAiHtml && codeHtml ? 'AI generated' : codeHtml ? 'Edited' : 'Empty'} · {codeHtml.length.toLocaleString()} chars
                      </span>
                    </div>
                    {codeHtml || aiLoading ? (
                      <textarea
                        className="ae-code__textarea"
                        value={codeHtml}
                        onChange={(e) => { setCodeHtml(e.target.value); setUseCode(true); }}
                        spellCheck={false}
                        aria-label="Answer HTML code"
                        disabled={aiLoading}
                        placeholder="Generating…"
                      />
                    ) : (
                      <div className="ae-code__empty">
                        <Sparkles size={22} />
                        <p><strong>No HTML yet.</strong> Write your answer in <em>Normal</em>, then press <strong>AI format</strong> to turn it into clean, structured HTML: headings, lists, tables and key terms.</p>
                        <button type="button" onClick={() => { setCodeHtml(answerHtml || '<p></p>'); setLastAiHtml(''); }}>
                          or start from the Normal answer's HTML
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ Right Panel: Saved Questions & Upload ═══ */}
          <div className={`admin-editor-right-panel ${!isRightPanelOpen ? 'collapsed' : ''}`}>
            <button
              className="admin-editor-panel-toggle"
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              title={isRightPanelOpen ? 'Collapse question list' : 'Show question list'}
              aria-label={isRightPanelOpen ? 'Collapse question list' : 'Show question list'}
            >
              {isRightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className="admin-editor-right-content">
              <div className="admin-editor-questions-header">
                <h2 className="admin-editor-questions-title">
                  Questions <span className="neo-chip">{questions.length}</span>
                </h2>
                {questions.some(q => q.fromFirebase) && (
                  <span className="neo-chip neo-chip--ghost"><CloudUpload size={12} /> Synced</span>
                )}
              </div>

              {loadingQuestions ? (
                <Loader text="Loading questions…" />
              ) : questions.length === 0 ? (
                <EmptyState
                  compact
                  title="No questions yet"
                  message="Write a question on the left and hit “Push to list”. It shows up here."
                />
              ) : (
                <>
                  <div className="admin-editor-questions-list">
                    {questions.map((cs, index) => (
                      <div
                        key={cs.id}
                        className={`admin-editor-question-card ${editingId === cs.id ? 'editing' : ''}`}
                        style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
                      >
                        <div className="admin-editor-question-top">
                          <div className="admin-editor-question-info">
                            <span className="admin-editor-question-num">Q{index + 1}</span>
                            <div className="admin-editor-question-textwrap">
                              <h3 className="admin-editor-question-text" title={cs.question}>{cs.question}</h3>
                              <span className="admin-editor-question-tag">{cs.questionType}</span>
                            </div>
                          </div>
                          <div className="admin-editor-question-actions">
                            <button onClick={() => previewSaved(index)} className="admin-editor-icon-btn" title="Preview on mobile" aria-label={`Preview Q${index + 1}`}>
                              <Eye size={16} />
                            </button>
                            <button onClick={() => startEditing(cs)} className="admin-editor-icon-btn" title="Edit" aria-label={`Edit Q${index + 1}`}>
                              <PencilLine size={16} />
                            </button>
                            <button onClick={() => handleDelete(cs.id)} className="admin-editor-icon-btn danger" title="Delete" aria-label={`Delete Q${index + 1}`}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Upload Button */}
              {!loadingQuestions && (
                <div className="admin-editor-upload-area">
                  <NeoButton
                    size="big"
                    variant="success"
                    fullWidth
                    icon={CloudUpload}
                    loading={uploading}
                    disabled={questions.length === 0}
                    onClick={handleUploadToFirebase}
                  >
                    {uploading ? 'Saving to Firebase…' : 'Save to Firebase'}
                  </NeoButton>
                  <p className="admin-editor-upload-hint">
                    {uploading
                      ? 'Uploading images and saving questions…'
                      : `Publishes all ${questions.length} question${questions.length !== 1 ? 's' : ''} to students.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <MobilePreview
          items={preview.items}
          startIndex={preview.startIndex}
          title={preview.title}
          examLabel={examLabel}
          subjectName={subjectName}
          onClose={() => setPreview(null)}
        />
      )}
    </AdminLayout>
  );
}
