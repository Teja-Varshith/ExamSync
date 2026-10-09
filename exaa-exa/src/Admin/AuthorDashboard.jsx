import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileStack, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AdminLayout from '../components/layout/AdminLayout';
import SubjectRow from './components/SubjectRow';
import { editState } from './components/editState';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/Loader/Loader';

export default function AuthorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all subjects and filter by assigned subjects
  useEffect(() => {
    const fetchAssignedSubjects = async () => {
      setLoading(true);
      try {
        const assignedSubjects = user?.subjects || [];
        if (assignedSubjects.length === 0) {
          setSubjects([]);
          setLoading(false);
          return;
        }

        // Fetch all subjects for the college
        const res = await api.getAllSubjects();

        // Filter subjects where courseCode matches assigned subject codes case-insensitively
        const validSubjects = res.data.filter(subject =>
          assignedSubjects.some(assignedCode =>
            assignedCode.toLowerCase() === (subject.courseCode || subject.code || '').toLowerCase()
          )
        );

        setSubjects(validSubjects);
      } catch (err) {
        console.error('Failed to fetch assigned subjects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedSubjects();
  }, [user?.subjects]);

  const assignedCount = user?.subjects?.length || 0;

  return (
    <AdminLayout
      eyebrow={user?.collegeName || 'Author'}
      title={`Hi, ${user?.name || 'Author'}`}
      subtitle="These are the subjects your admin assigned to you. Keep the syllabus fresh and build Pakka Pass cheat sheets."
    >
      <div className="ad-stats">
        <div className="ad-stat ad-stat--accent">
          <BookOpen size={18} />
          <span className="ad-stat__label">Assigned</span>
          <span className="ad-stat__value">{assignedCount}</span>
        </div>
        <div className="ad-stat">
          <FileStack size={18} />
          <span className="ad-stat__label">Available to edit</span>
          <span className="ad-stat__value">{loading ? '–' : subjects.length}</span>
        </div>
      </div>

      <section className="ad-panel">
        <div className="ad-panel__head">
          <h2 className="ad-panel__title">Your subjects</h2>
        </div>

        {!loading && assignedCount > subjects.length && subjects.length > 0 && (
          <div className="neo-alert">
            <Info size={16} />
            <span>
              {assignedCount - subjects.length} assigned course code{assignedCount - subjects.length !== 1 ? 's don’t' : ' doesn’t'} match
              any subject yet. Ask your admin to create {assignedCount - subjects.length !== 1 ? 'them' : 'it'}.
            </span>
          </div>
        )}

        <div className="ad-list">
          {loading ? (
            <CardSkeleton count={2} />
          ) : subjects.length === 0 ? (
            <EmptyState
              compact
              title={assignedCount ? 'Subjects not found' : 'No subjects assigned yet'}
              message={assignedCount
                ? 'Your assigned course codes don’t match any subject yet. Ask your admin to check them.'
                : 'Ask your college admin to assign subjects to your examite account.'}
            />
          ) : (
            subjects.map((sub, i) => (
              <SubjectRow
                key={sub.id}
                subject={sub}
                index={i}
                showSemester
                onEdit={(s) => navigate('/admin/add-syllabus', { state: editState(s) })}
                onSheets={(s) => navigate('/admin/cheatsheets', {
                  state: {
                    subjectName: s.name || s.subjectName,
                    courseCode: s.courseCode || s.code,
                    semester: s.semester,
                  }
                })}
              />
            ))
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
