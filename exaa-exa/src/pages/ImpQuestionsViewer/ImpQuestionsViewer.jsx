import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ChevronsUpDown, Sparkles } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Loader from '../../components/Loader/Loader';
import Segmented from '../../components/ui/Segmented';
import EmptyState from '../../components/ui/EmptyState';
import QuestionCard from '../../components/answer/QuestionCard';
import { toneFor } from '../../theme/neopop';
import './ImpQuestionsViewer.css';

const EXAM_TABS = [
  { id: 'Mid 1', label: 'Mid 1' },
  { id: 'Mid 2', label: 'Mid 2' },
  { id: 'Sem', label: 'Semester' },
];

export default function ImpQuestionsViewer() {
  const { subjectId } = useParams();
  const normalizedSubjectId = subjectId ? decodeURIComponent(subjectId) : '';
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectName, courseCode, backUrl } = location.state || {};

  const [impQuestions, setImpQuestions] = useState(null);
  const [customTags, setCustomTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState('Mid 1');

  // Two-view state: null = tag list view, string = Q&A view for that tag
  const [selectedTag, setSelectedTag] = useState(null);
  const [openIds, setOpenIds] = useState(() => new Set());

  // Resolve the back URL
  const homeId = localStorage.getItem('examsync_user_id') || '';
  const goBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (backUrl) {
      navigate(backUrl, { replace: true });
    } else {
      navigate(`/subject/${encodeURIComponent(normalizedSubjectId)}?uid=${homeId}`, { replace: true });
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        // 1. Read custom tags from subject metadata
        const docRef = doc(db, 'examsync', 'admins', 'subjects', normalizedSubjectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.customTags)) {
            setCustomTags(data.customTags);
          }
        }

        // 2. Read ImpQuestions from exam_data/ImpQuestions document
        const examRef = doc(db, 'examsync', 'admins', 'subjects', normalizedSubjectId, 'exam_data', 'ImpQuestions');
        const examSnap = await getDoc(examRef);
        if (examSnap.exists()) {
          const examData = examSnap.data();
          setImpQuestions(examData.data || examData || {}); // Fallback for old structure if any
        }
      } catch (err) {
        console.error('Failed to fetch ImpQuestions:', err);
      } finally {
        setLoading(false);
      }
    };
    if (normalizedSubjectId) fetchQuestions();
  }, [normalizedSubjectId]);

  const questionsFor = (exam) =>
    Object.entries(impQuestions?.[exam] || {})
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([key, val]) => ({
        id: key,
        question: val.question || '',
        answer: val.answer || '',
        tag: val.tag || 'Pakka Chadavali Amma',
      }));

  const allQuestions = questionsFor(activeExam);

  // Unique tags for the active exam (question tags first, then admin-defined custom tags)
  const tagsForExam = [...new Set([...allQuestions.map((q) => q.tag), ...customTags])];
  const getTagCount = (tag) => allQuestions.filter((q) => q.tag === tag).length;
  const filteredQuestions = selectedTag ? allQuestions.filter((q) => q.tag === selectedTag) : [];

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allOpen = filteredQuestions.length > 0 && filteredQuestions.every((q) => openIds.has(q.id));
  const toggleAll = () => setOpenIds(allOpen ? new Set() : new Set(filteredQuestions.map((q) => q.id)));

  const openTag = (tag) => {
    setSelectedTag(tag);
    setOpenIds(new Set());
    window.scrollTo(0, 0);
  };

  const topbar = (onBack, title, subtitle) => (
    <header className="iq-topbar">
      <button type="button" className="neo-icon-btn" onClick={onBack} aria-label="Go back">
        <ArrowLeft size={20} />
      </button>
      <div className="iq-topbar__text">
        <span className="iq-topbar__title">{title}</span>
        <span className="iq-topbar__sub">{subtitle}</span>
      </div>
      <span className="neo-chip neo-chip--premium"><Sparkles size={12} /> Pro</span>
    </header>
  );

  // ═══ Q&A View (when a tag is selected) ═══
  if (selectedTag) {
    const tone = toneFor(selectedTag);
    return (
      <div className="iq-page">
        {topbar(() => setSelectedTag(null), selectedTag, `${activeExam} · ${courseCode || normalizedSubjectId}`)}

        <div className="iq-qa-head">
          <span className="iq-qa-head__bar" style={{ background: tone.face }} />
          <span className="iq-qa-head__count">
            {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
          </span>
          {filteredQuestions.length > 1 && (
            <button type="button" className="iq-qa-head__toggle" onClick={toggleAll}>
              <ChevronsUpDown size={14} /> {allOpen ? 'Collapse all' : 'Expand all'}
            </button>
          )}
        </div>

        <main className="iq-content">
          {filteredQuestions.length === 0 ? (
            <EmptyState compact title="No questions yet" message={`Nothing has been added under “${selectedTag}” for ${activeExam}.`} />
          ) : (
            <div className="iq-q-list">
              {filteredQuestions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q.question}
                  answer={q.answer}
                  index={i}
                  open={openIds.has(q.id)}
                  onToggle={() => toggle(q.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ═══ Tag List View (default) ═══
  return (
    <div className="iq-page">
      {topbar(goBack, 'Pakka Pass', subjectName || courseCode || normalizedSubjectId)}

      <div className="iq-exam-tabs">
        <Segmented
          ariaLabel="Exam"
          value={activeExam}
          onChange={setActiveExam}
          options={EXAM_TABS.map((t) => ({
            value: t.id,
            label: t.label,
            badge: loading ? null : questionsFor(t.id).length,
          }))}
        />
      </div>

      <main className="iq-content">
        {loading ? (
          <Loader text="Loading questions…" />
        ) : tagsForExam.length === 0 ? (
          <EmptyState compact title="Coming soon" message={`Questions for ${activeExam} haven't been added yet. Check back closer to the exam.`} />
        ) : (
          <>
            <p className="iq-hint">Pick a set to start revising.</p>
            <div className="iq-tag-list">
              {tagsForExam.map((tag, index) => {
                const count = getTagCount(tag);
                const tone = toneFor(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className="iq-tag neo-plunk neo-plunk--press"
                    onClick={() => openTag(tag)}
                    disabled={count === 0}
                    style={{ '--edge-r': tone.right, '--edge-b': tone.bottom, animationDelay: `${index * 50}ms` }}
                  >
                    <span className="iq-tag__swatch" style={{ background: tone.face, color: tone.ink }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="iq-tag__info">
                      <span className="iq-tag__name">{tag}</span>
                      <span className="iq-tag__count">
                        {count === 0 ? 'No questions yet' : `${count} question${count !== 1 ? 's' : ''}`}
                      </span>
                    </span>
                    <ChevronRight size={20} className="iq-tag__arrow" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
