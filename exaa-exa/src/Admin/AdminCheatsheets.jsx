import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, PencilLine, CheckCircle2, CircleDashed } from 'lucide-react';
import api from '../services/api';
import AdminLayout from '../components/layout/AdminLayout';
import AbstractArt from '../components/brand/AbstractArt';
import NeoButton from '../components/ui/NeoButton';
import { CardSkeleton } from '../components/Loader/Loader';

// Define exam types
const EXAM_TYPES = [
  { id: 'mid1', label: 'Mid 1', key: 'Mid 1', blurb: 'First mid-term' },
  { id: 'mid2', label: 'Mid 2', key: 'Mid 2', blurb: 'Second mid-term' },
  { id: 'sem', label: 'Semester', key: 'Sem', blurb: 'End-semester exam' },
];

export default function AdminCheatsheets() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    subjectName = 'Unknown Subject',
    courseCode = '',
    semester = 1,
  } = location.state || {};

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubject = async () => {
      setLoading(true);
      try {
        if (courseCode) {
          const res = await api.getSubjectById(courseCode);
          if (res.data) {
            setSubject(res.data);
          }
        }
      } catch (err) {
        console.error('Failed to load subject:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubject();
  }, [courseCode]);

  // Question count per exam from ImpQuestions data
  const countFor = (exam) => {
    const examData = subject?.ImpQuestions?.[exam.key];
    return examData && typeof examData === 'object' ? Object.keys(examData).length : 0;
  };

  const handleOpenCheatsheet = (exam) => {
    navigate('/admin/cheatsheet-editor', {
      state: {
        subjectName,
        courseCode,
        semester,
        examType: exam.id,
        examLabel: exam.label.toUpperCase() === 'SEMESTER' ? 'SEM' : exam.label.toUpperCase(),
      }
    });
  };

  const done = EXAM_TYPES.filter((e) => countFor(e) > 0).length;

  return (
    <AdminLayout
      crumbs={[{ label: 'Dashboard', to: '/admin' }, { label: subjectName }]}
      eyebrow={`Semester ${semester} · ${courseCode}`}
      title={subjectName}
      subtitle="Build a Pakka Pass cheat sheet for each exam. Students see questions grouped by tag."
      actions={
        !loading && (
          <div className="ad-progress" aria-label={`${done} of 3 cheat sheets started`}>
            <span className="neo-label">Progress</span>
            <div className="ad-progress__bar">
              {EXAM_TYPES.map((e) => (
                <span key={e.id} className={countFor(e) > 0 ? 'is-done' : ''} />
              ))}
            </div>
            <span className="ad-progress__text">{done} / 3 sheets</span>
          </div>
        )
      }
    >
      {loading ? (
        <CardSkeleton count={3} />
      ) : (
        <div className="ad-exams">
          {EXAM_TYPES.map((exam, i) => {
            const count = countFor(exam);
            const started = count > 0;
            return (
              <article key={exam.id} className={`ad-exam${started ? ' is-started' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="ad-exam__art">
                  <AbstractArt seed={`${courseCode}-${exam.id}`} variant={i + 1} size={120} />
                </div>
                <div className="ad-exam__body">
                  <div className="ad-exam__top">
                    <h3 className="ad-exam__title">{exam.label}</h3>
                    {started ? (
                      <span className="neo-chip neo-chip--success"><CheckCircle2 size={12} /> {count} question{count !== 1 ? 's' : ''}</span>
                    ) : (
                      <span className="neo-chip neo-chip--ghost"><CircleDashed size={12} /> Not started</span>
                    )}
                  </div>
                  <p className="ad-exam__blurb">{exam.blurb} · Pakka Pass questions</p>
                  <NeoButton
                    fullWidth
                    variant={started ? 'secondary' : 'primary'}
                    icon={started ? PencilLine : Plus}
                    onClick={() => handleOpenCheatsheet(exam)}
                  >
                    {started ? 'Open cheat sheet' : 'Create cheat sheet'}
                  </NeoButton>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {subject && (
        <div className="ad-stats ad-stats--footer">
          <div className="ad-stat">
            <span className="ad-stat__label">Units</span>
            <span className="ad-stat__value">{subject.units || 0}</span>
          </div>
          <div className="ad-stat">
            <span className="ad-stat__label">Course type</span>
            <span className="ad-stat__value ad-stat__value--sm">{subject.category || '—'}</span>
          </div>
          <div className="ad-stat">
            <span className="ad-stat__label">Unlock price</span>
            <span className="ad-stat__value">{subject.price ?? 50} coins</span>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
