import { useEffect, useState } from 'react';
import { ArrowUpRight, Info, RotateCcw } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CardSkeleton } from '../../components/Loader/Loader';
import Logo from '../../components/brand/Logo';
import AbstractArt from '../../components/brand/AbstractArt';
import { CoinIcon } from '../../components/brand/Illustrations';
import Segmented from '../../components/ui/Segmented';
import EmptyState from '../../components/ui/EmptyState';
import NeoButton from '../../components/ui/NeoButton';
import { toneFor } from '../../theme/neopop';
import api from '../../services/api';
import './SubjectsPage.css';

const SEMESTERS_BY_YEAR = { 1: [1, 2], 2: [3, 4], 3: [5, 6], 4: [7, 8] };
const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH'];
const CATEGORIES = [
  { value: 'Professional Core', label: 'Core' },
  { value: 'Professional Elective', label: 'Electives' },
];
const FILTERS_KEY = 'examsync_filters';

function readFilters() {
  try {
    const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || '{}');
    const year = SEMESTERS_BY_YEAR[saved.year] ? saved.year : 3;
    const semester = SEMESTERS_BY_YEAR[year].includes(saved.semester) ? saved.semester : SEMESTERS_BY_YEAR[year][1];
    return { year, semester };
  } catch {
    return { year: 3, semester: 6 };
  }
}

/* ─── Subject card ─── */
function SubjectCard({ subject, index, onOpen }) {
  const tone = toneFor(subject.courseCode || subject.id);
  return (
    <button
      type="button"
      className="subject-tile neo-plunk neo-plunk--press"
      style={{
        '--edge-r': tone.right,
        '--edge-b': tone.bottom,
        '--tile-face': tone.face,
        '--tile-ink': tone.ink,
        animationDelay: `${Math.min(index, 8) * 60}ms`,
      }}
      onClick={() => onOpen(subject)}
    >
      <div className="subject-tile__body">
        <span className="subject-tile__code">{subject.courseCode}</span>
        <h3 className="subject-tile__name">{subject.name}</h3>
        {subject.description && <p className="subject-tile__desc">{subject.description}</p>}
        <span className="subject-tile__cta">
          Start prepping <ArrowUpRight size={16} strokeWidth={2.6} />
        </span>
      </div>
      <div className="subject-tile__art">
        <AbstractArt seed={subject.courseCode || subject.id} tone={tone} size={112} />
      </div>
    </button>
  );
}

/* ─── Page ─── */
export default function SubjectsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read uid from URL first, fall back to localStorage
  const urlUid = searchParams.get('uid');
  const userId = urlUid || localStorage.getItem('examsync_user_id') || '';

  const [userName, setUserName] = useState(() => localStorage.getItem('examsync_user_name') || 'Student');
  const [userCoins, setUserCoins] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState('Professional Core');
  const [{ year, semester }, setFilters] = useState(readFilters);
  const [branch, setBranch] = useState('CSE');

  useEffect(() => {
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify({ year, semester })); } catch { /* ignore */ }
  }, [year, semester]);

  const changeYear = (y) => {
    setFilters((prev) => ({
      year: y,
      semester: SEMESTERS_BY_YEAR[y].includes(prev.semester) ? prev.semester : SEMESTERS_BY_YEAR[y][0],
    }));
  };

  /* Fetch subjects when semester changes */
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.getSubjects(semester);
        setSubjects(res.data);
      } catch (err) {
        console.error('Failed to load subjects:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [semester, reloadKey]);

  /* Save userId to localStorage & fetch user profile */
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) { setUserName('Student'); return; }
      // Persist userId for other pages and back-navigation
      localStorage.setItem('examsync_user_id', userId);
      try {
        const res = await api.getUserById(userId);
        const data = res.data || {};
        const name =
          data.name || data.fullName || data.displayName ||
          data.campXUsername || data.username || data.emailId || 'Student';
        setUserName(name);
        // Cache name so it shows instantly on back-navigation
        localStorage.setItem('examsync_user_name', name);
        setUserCoins(typeof data.coins === 'number' ? data.coins : 0);
      } catch {
        setUserName('Student');
      }
    };
    fetchUser();
  }, [userId]);

  const handleOpen = (subject) => {
    navigate(`/subject/${subject.id}?uid=${encodeURIComponent(userId)}`);
  };

  const countFor = (cat) => subjects.filter((s) => s.courseType === cat).length;
  const filteredSubjects = subjects.filter((s) => s.courseType === activeTab);
  const firstName = String(userName).trim().split(/\s+/)[0];

  return (
    <div className="page es-home">
      {/* ── App bar ── */}
      <header className="es-appbar">
        <Link to="/" aria-label="Home" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }}>
          <Logo size={30} />
        </Link>
        {userCoins !== null && (
          <div className="es-coins" title="Your coin balance">
            <CoinIcon size={18} />
            <span className="es-coins__value">{userCoins}</span>
            <span className="es-coins__label">coins</span>
          </div>
        )}
      </header>

      <main className="es-home__main">
        {/* ── Greeting ── */}
        <section className="es-greet">
          <span className="neo-eyebrow">Hey there,</span>
          <h1 className="es-greet__name neo-display">{firstName}</h1>
          <p className="es-greet__sub">No stress, just smart prep.</p>
        </section>

        {/* ── Filters ── */}
        <section className="es-filters" aria-label="Choose your class">
          <div className="es-filter">
            <span className="neo-label">Year</span>
            <Segmented
              size="small"
              ariaLabel="Year"
              value={year}
              onChange={changeYear}
              options={[1, 2, 3, 4].map((v) => ({ value: v, label: `Year ${v}` }))}
            />
          </div>
          <div className="es-filter-row">
            <div className="es-filter">
              <span className="neo-label">Semester</span>
              <Segmented
                size="small"
                ariaLabel="Semester"
                value={semester}
                onChange={(s) => setFilters((prev) => ({ ...prev, semester: s }))}
                options={SEMESTERS_BY_YEAR[year].map((v) => ({ value: v, label: `Sem ${v}` }))}
              />
            </div>
            <div className="es-filter">
              <span className="neo-label">Branch</span>
              <Segmented
                size="small"
                ariaLabel="Branch"
                value={branch}
                onChange={setBranch}
                options={BRANCHES.map((b) => ({ value: b, label: b, disabled: b !== 'CSE' }))}
              />
            </div>
          </div>
        </section>

        <div className="neo-alert es-notice">
          <Info size={16} />
          <span>
            Live for <strong>GMRIT 3rd-year CSE</strong> right now. More colleges and branches are coming soon.
          </span>
        </div>

        {/* ── Subjects ── */}
        <section className="es-subjects">
          <div className="es-subjects__head">
            <h2 className="es-subjects__title">Your subjects</h2>
            <Segmented
              size="small"
              ariaLabel="Course type"
              value={activeTab}
              onChange={setActiveTab}
              options={CATEGORIES.map((c) => ({ ...c, badge: loading ? null : countFor(c.value) }))}
            />
          </div>

          {error ? (
            <EmptyState
              title="Couldn't load subjects"
              message="Check your connection and try again."
              action={
                <NeoButton variant="secondary" icon={RotateCcw} onClick={() => setReloadKey((k) => k + 1)}>
                  Try again
                </NeoButton>
              }
            />
          ) : loading ? (
            <CardSkeleton count={3} />
          ) : filteredSubjects.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              message={`No ${activeTab === 'Professional Core' ? 'core' : 'elective'} subjects for Semester ${semester} yet. Check back soon!`}
            />
          ) : (
            <div className="es-subjects__list">
              {filteredSubjects.map((subject, index) => (
                <SubjectCard key={subject.id} subject={subject} index={index} onOpen={handleOpen} />
              ))}
            </div>
          )}
        </section>

        <footer className="es-home__foot">
          <span>Faculty or content author?</span>
          <Link to="/login">Staff sign in →</Link>
        </footer>
      </main>
    </div>
  );
}
