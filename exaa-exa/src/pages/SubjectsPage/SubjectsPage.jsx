import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { CardSkeleton } from '../../components/Loader/Loader';
import api from '../../services/api';
import './SubjectsPage.css';

/* ─── Palette cycling for hero cards ─── */
const PALETTES = [
  { bg: 'linear-gradient(145deg,#3a3adb 0%,#6b21a8 100%)', icon: '⚙️' },
  { bg: 'linear-gradient(145deg,#0f766e 0%,#134e4a 100%)', icon: '🌐' },
  { bg: 'linear-gradient(145deg,#be185d 0%,#9f1239 100%)', icon: '🧠' },
  { bg: 'linear-gradient(145deg,#b45309 0%,#78350f 100%)', icon: '📡' },
  { bg: 'linear-gradient(145deg,#1d4ed8 0%,#1e3a5f 100%)', icon: '💻' },
  { bg: 'linear-gradient(145deg,#065f46 0%,#14532d 100%)', icon: '🔬' },
];

/* ─── Hero subject card ─── */
function SubjectHeroCard({ subject, index, onClick }) {
  const p = PALETTES[index % PALETTES.length];
  return (
    <div
      className="shc"
      style={{ background: p.bg, animationDelay: `${index * 70}ms` }}
      onClick={() => onClick(subject)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(subject)}
    >
      {/* Top-left chip */}
      <div className='course_code_arrow'>
        <div className="shc__chip">
          {subject.courseCode}
        </div>

        {/* Course code top-right */}
        <div className="shc__code"><span className="shc__arrow"><ArrowUpRight size={16} /></span></div>
      </div>
      {/* Illustration */}
      <div className="shc__illus">
        <div className="shc__blob" />
        <span className="shc__emoji">{p.icon}</span>
      </div>

      {/* Content */}
      <h2 className="shc__name">{subject.name}</h2>
      {subject.description && (
        <p className="shc__desc">{subject.description}</p>
      )}

      {/* Footer */}
      <div className="shc__footer">
        <span className="shc__explore">Explore now!</span>
        
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function SubjectsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read uid from URL first, fall back to localStorage
  const urlUid = searchParams.get('uid');
  const userId = urlUid || localStorage.getItem('examsync_user_id') || '';

  const [userName, setUserName]   = useState(() => localStorage.getItem('examsync_user_name') || 'Student');
  const [userCoins, setUserCoins] = useState(0);
  const [subjects, setSubjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [activeTab, setActiveTab] = useState('Professional Core');
  const [semester, setSemester]   = useState(6);
  const [year, setYear]           = useState(3);
  const [branch, setBranch]       = useState('CSE');

  const semesterByYear = {
    1: [1, 2],
    2: [3, 4],
    3: [5, 6],
    4: [7, 8],
  };
  const allowedSemesters = semesterByYear[year] ?? [];

  useEffect(() => {
    if (!allowedSemesters.includes(semester)) {
      setSemester(allowedSemesters[0] ?? 1);
    }
  }, [allowedSemesters, semester]);

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
  }, [semester]);

  /* Save userId to localStorage & fetch user profile */
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) { setUserName('Student'); return; }
      // Persist userId for other pages and back-navigation
      localStorage.setItem('examsync_user_id', userId);
      try {
        const res  = await api.getUserById(userId);
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

  /* Navigate to subject details — same pattern as original SubjectCard */
  const handleCardClick = (subject) => {
    navigate(`/subject/${subject.id}?uid=${encodeURIComponent(userId)}`);
  };

  /* Error state */
  if (error) {
    return (
      <div className="page es-page">
        <div className="es-appbar">
          <span className="es-appbar__title">ExamSync</span>
          <div className="es-appbar__coins">
            <span>🪙</span>
            <span className="es-coins-label">Aal Coins</span>
            <span className="es-coins-value">0</span>
          </div>
        </div>
        <div className="es-error">
          <p>Failed to load subjects from Firebase.</p>
          <button
            className="es-retry-btn"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const categories       = ['Professional Core', 'Professional Elective'];
  const filteredSubjects = subjects.filter(s => s.courseType === activeTab);

  return (
    <div className="page es-page">

      <main className="es-main">

        {/* ── Greeting ── */}
        <div className="es-header">
          <p className="es-header__hey">HEY,</p>
          <h1 className="es-header__name">{userName}</h1>
          <p className="es-header__sub">No stress, just smart prep.</p>
        </div>

        {/* ── Single merged Stats + Dropdowns card ── */}
        <div className="es-stats-card">

          {/* Top: big display values */}
          {/* <div className="es-stats-row">
            <div className="es-stat">
              <span className="es-stat__label">YEAR</span>
              <span className="es-stat__value">{year}</span>
            </div>
            <div className="es-stat-divider" />
            <div className="es-stat">
              <span className="es-stat__label">SEM</span>
              <span className="es-stat__value">{semester}</span>
            </div>
            <div className="es-stat-divider" />
            <div className="es-stat">
              <span className="es-stat__label">BRANCH</span>
              <span className="es-stat__value es-stat__value--sm">{branch}</span>
            </div>
          </div> */}

          {/* Divider */}
          <div className="es-card-divider" />

          {/* Bottom: dropdowns */}
          <div className="es-dropdowns-row">
            <div className="es-dropdown-group">
              <label className="es-dropdown-label" htmlFor="sel-year">Year</label>
              <select
                id="sel-year"
                className="es-dropdown-select"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                aria-label="Select year"
              >
                {[1,2,3,4].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="es-dropdown-sep" />
            <div className="es-dropdown-group">
              <label className="es-dropdown-label" htmlFor="sel-sem">Semester</label>
              <select
                id="sel-sem"
                className="es-dropdown-select"
                value={semester}
                onChange={e => setSemester(Number(e.target.value))}
                aria-label="Select semester"
              >
                {allowedSemesters.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="es-dropdown-sep" />
            <div className="es-dropdown-group">
              <label className="es-dropdown-label" htmlFor="sel-branch">Branch</label>
              <select
                id="sel-branch"
                className="es-dropdown-select"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                aria-label="Select branch"
              >
                {['CSE','ECE','EEE','MECH'].map(v => (
                  <option key={v} value={v} disabled={v !== 'CSE'}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Note ── */}
        <p style={{ fontSize: '12px', color: '#FFD700', fontWeight: 600, margin: '0 0 10px 4px', letterSpacing: '0.3px' }}>
          Note : This feature is currently available for GMRIT 3rd Year CSE Students only.
We will be expanding soon.
        </p>

        {/* ── Category Tabs ── */}
        <div className="es-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`es-tab${activeTab === cat ? ' es-tab--active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Subjects ── */}
        <div className="es-subjects">
          <div className="es-subjects__header">
            <span className="es-subjects__title">SUBJECTS</span>
            <span className="es-subjects__count">{filteredSubjects.length}</span>
          </div>

          {loading ? (
            <CardSkeleton count={3} />
          ) : filteredSubjects.length === 0 ? (
            <div className="es-empty">
              <p>No subjects found for Semester {semester} – {activeTab}.</p>
              <p>Ask an admin to add subjects!</p>
            </div>
          ) : (
            filteredSubjects.map((subject, index) => (
              <SubjectHeroCard
                key={subject.id}
                subject={subject}
                index={index}
                onClick={handleCardClick}
              />
            ))
          )}
        </div>

      </main>
    </div>
  );
}