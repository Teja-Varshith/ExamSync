import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './ImpQuestionsViewer.css';

const EXAM_TABS = [
  { id: 'Mid 1', label: 'Mid 1' },
  { id: 'Mid 2', label: 'Mid 2' },
  { id: 'Sem', label: 'Semester' },
];

function QuestionAccordion({ question, answer, tag, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`iq-accordion ${isOpen ? 'iq-accordion--open' : ''}`}
      style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
    >
      <button className="iq-accordion__header" onClick={() => setIsOpen(!isOpen)}>
        <div className="iq-accordion__left">
          <span className="iq-accordion__num">Q{index + 1}</span>
        </div>
        <div className="iq-accordion__question">{question}</div>
        <ChevronDown
          className={`iq-accordion__chevron ${isOpen ? 'iq-accordion__chevron--open' : ''}`}
          size={20}
        />
      </button>
      <div className={`iq-accordion__body ${isOpen ? 'iq-accordion__body--open' : ''}`}>
        <div className="iq-accordion__answer">
          <div className="iq-accordion__answer-label">Answer</div>
          <div
            className="iq-accordion__answer-content"
            dangerouslySetInnerHTML={{ __html: answer || '<em>No answer provided.</em>' }}
          />
        </div>
      </div>
    </div>
  );
}

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

  // Resolve the back URL
  const homeId = localStorage.getItem('examsync_user_id') || '';
  const goBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      if (backUrl) {
        navigate(backUrl, { replace: true });
      } else {
        navigate(`/subject/${encodeURIComponent(normalizedSubjectId)}?uid=${homeId}`, {
          replace: true,
        });
      }
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'college_code', 'admins', 'subjects', normalizedSubjectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setImpQuestions(data.ImpQuestions || {});
          if (Array.isArray(data.customTags)) {
            setCustomTags(data.customTags);
          }
        }
      } catch (err) {
        console.error('Failed to fetch ImpQuestions:', err);
      } finally {
        setLoading(false);
      }
    };
    if (normalizedSubjectId) fetchQuestions();
  }, [normalizedSubjectId]);

  // Build unique tags for the active exam type
  const tagsForExam = (() => {
    const examData = impQuestions?.[activeExam] || {};
    const tagSet = new Set();
    Object.values(examData).forEach(q => {
      if (q.tag) tagSet.add(q.tag);
    });
    // Also include admin-defined custom tags
    customTags.forEach(t => tagSet.add(t));
    return [...tagSet];
  })();

  // Get questions for the active exam type
  const examData = impQuestions?.[activeExam] || {};
  const allQuestions = Object.entries(examData)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, val]) => ({
      id: key,
      question: val.question || '',
      answer: val.answer || '',
      tag: val.tag || 'Pakka Chadavali Amma',
    }));

  // Count questions per tag
  const getTagCount = (tag) => allQuestions.filter(q => q.tag === tag).length;

  // Questions filtered by selected tag
  const filteredQuestions = selectedTag
    ? allQuestions.filter(q => q.tag === selectedTag)
    : [];

  // ═══ Q&A View (when a tag is selected) ═══
  if (selectedTag) {
    return (
      <div className="iq-page">
        {/* Top bar with back to tags */}
        <div className="iq-topbar">
          <button className="iq-back-btn" onClick={() => setSelectedTag(null)}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="iq-topbar-info">
            <span className="iq-topbar-code">{courseCode || normalizedSubjectId}</span>
          </div>
        </div>

        {/* Tag title */}
        <div className="iq-qa-header">
          {/* <span className="iq-qa-exam-badge">{activeExam}</span> */}
          <h2 className="iq-qa-title">{selectedTag}</h2>
          {/* <p className="iq-qa-count">{filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}</p> */}
        </div>

        {/* Questions list */}
        <div className="iq-content">
          {filteredQuestions.length === 0 ? (
            <div className="iq-empty">
              <p>No questions available for <strong>{selectedTag}</strong>.</p>
            </div>
          ) : (
            <div className="iq-questions-list">
              {filteredQuestions.map((q, i) => (
                <QuestionAccordion
                  key={q.id}
                  question={q.question}
                  answer={q.answer}
                  tag={q.tag}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══ Tag List View (default) ═══
  return (
    <div className="iq-page">
      {/* Top Bar */}
      <div className="iq-topbar">
        <button className="iq-back-btn" onClick={goBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="iq-topbar-info">
          <span className="iq-topbar-code">{courseCode || normalizedSubjectId}</span>
        </div>
      </div>

      {/* Page title */}
      {/* <div className="iq-tags-hero">
         <h1 className="iq-tags-hero__title">Pakka Pass Questions</h1> 
        {subjectName && <p className="iq-tags-hero__sub">{subjectName}</p>}
      </div> */}

      {/* Exam type tab buttons */}
      <div className="iq-exam-tabs">
        {EXAM_TABS.map(tab => (
          <button
            key={tab.id}
            className={`iq-exam-tab ${activeExam === tab.id ? 'iq-exam-tab--active' : ''}`}
            onClick={() => setActiveExam(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tag list */}
      <div className="iq-content">
        {loading ? (
          <div className="iq-loading">Loading questions...</div>
        ) : tagsForExam.length === 0 ? (
          <div className="iq-empty">
            <p>No questions added for <strong>{activeExam}</strong> yet.</p>
          </div>
        ) : (
          <div className="iq-tag-list">
            {/* "All Questions" row */}
            <button
              className="iq-tag-row"
              onClick={() => setSelectedTag('__all__')}
              style={{ display: 'none' }} // hidden, just for future use
            >
              <div className="iq-tag-row__info">
                <span className="iq-tag-row__name">All Questions</span>
                <span className="iq-tag-row__count">{allQuestions.length} questions</span>
              </div>
              <ChevronRight size={20} className="iq-tag-row__arrow" />
            </button>

            {tagsForExam.map((tag, index) => {
              const count = getTagCount(tag);
              return (
                <button
                  key={tag}
                  className="iq-tag-row"
                  onClick={() => setSelectedTag(tag)}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="iq-tag-row__info">
                    <span className="iq-tag-row__name">{tag}</span>
                    <span className="iq-tag-row__count">
                      {count} question{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ChevronRight size={20} className="iq-tag-row__arrow" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
