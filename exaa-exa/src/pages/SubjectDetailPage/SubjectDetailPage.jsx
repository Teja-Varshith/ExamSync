import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import ProgressRing from '../../components/ProgressRing/ProgressRing';
import TabBar from '../../components/TabBar/TabBar';
import TopicItem from '../../components/TopicItem/TopicItem';
import AccordionItem from '../../components/AccordionItem/AccordionItem';
import Loader from '../../components/Loader/Loader';
import { calcProgress } from '../../utils/helpers';
import api from '../../services/api';
import { Lock, Unlock, Coins, AlertCircle, Eye } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import './SubjectDetailPage.css';

export default function SubjectDetailPage() {
  const { subjectId, unitId } = useParams();
  const normalizedSubjectId = subjectId ? decodeURIComponent(subjectId) : '';
  const navigate = useNavigate();
  const location = useLocation();
  const homeId = new URLSearchParams(location.search).get('uid') || localStorage.getItem('examsync_user_id') || '';
  const backToHome = `/?uid=${encodeURIComponent(homeId)}`;

  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.defaultTab || sessionStorage.getItem(`activeTab_${normalizedSubjectId}`) || 'roadmap';
  });

  useEffect(() => {
    if (activeTab && normalizedSubjectId) {
      sessionStorage.setItem(`activeTab_${normalizedSubjectId}`, activeTab);
    }
  }, [activeTab, normalizedSubjectId]);

  const [subject, setSubject] = useState(null);
  const [unitData, setUnitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [subjectAssets, setSubjectAssets] = useState({ notes: [], pyqs: [] });

  // Coin purchase state
  const storedUserId = localStorage.getItem('examsync_user_id') || homeId || '';
  const [userCoins, setUserCoins] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const UNLOCK_COST = subject?.price !== undefined ? parseInt(subject.price) : 50;

  useEffect(() => {
    if (location.state?.defaultTab) {
      setActiveTab(location.state.defaultTab);
    }
  }, [location.state?.defaultTab]);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.getSubjectById(normalizedSubjectId);
        if (res.data) {
          setSubject(res.data);

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

          setSubjectAssets({
            notes: mapToRows(res.data.notes, 'notes'),
            pyqs: mapToRows(res.data.pyqs, 'pyqs'),
          });

          if (res.data.Payment === true) {
            // Legacy check (will be overridden by paidIds check below)
          }

          const syllabusData = res.data.syllabus || {};

          if (!unitId) {
            const firstUnitNum = Object.keys(syllabusData)
              .map((key) => Number(key))
              .filter((num) => Number.isFinite(num))
              .sort((a, b) => a - b)[0];

            if (firstUnitNum) {
              navigate(`/subject/${encodeURIComponent(normalizedSubjectId)}/unit/unit-${firstUnitNum}`, { replace: true });
              return;
            }
          }

          // Parse unitId (e.g. "unit-1" -> "1")
          const unitNumMatch = unitId?.match(/unit-(\d+)/);
          const unitNum = unitNumMatch ? unitNumMatch[1] : null;

          const syllabusSection = unitNum ? syllabusData[unitNum] : null;

          if (syllabusSection) {
            // Handle new object format vs old string format logically
            const isDetailed = typeof syllabusSection === 'object';
            const unitName = isDetailed ? syllabusSection.name : `Unit ${unitNum}`;
            const unitTopicsStr = isDetailed ? (syllabusSection.topics || '') : syllabusSection;

            setUnitData({
              unitNum: unitNum,
              title: unitName || `Unit ${unitNum}`,
              topicsList: unitTopicsStr.split(',').map(t => t.trim()).filter(Boolean)
            });
          } else {
            setUnitData(null);
          }
        } else {
          setSubject(null);
        }
      } catch (err) {
        console.error('Failed to load subject details:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (normalizedSubjectId) fetchSubjectDetails();
  }, [navigate, normalizedSubjectId, unitId]);

  // Check if user has already paid for this subject
  useEffect(() => {
    const checkAccess = async () => {
      setCheckingAccess(true);
      try {
        if (!storedUserId || !normalizedSubjectId) {
          setCheckingAccess(false);
          return;
        }

        // Check paidIds in the subject document
        const subDocRef = doc(db, 'college_code', 'admins', 'subjects', normalizedSubjectId);
        const subSnap = await getDoc(subDocRef);
        if (subSnap.exists()) {
          const paidIds = subSnap.data().paidIds || [];
          if (paidIds.includes(storedUserId)) {
            setIsUnlocked(true);
          }
        }

        // Fetch user's coin balance
        const userDocRef = doc(db, 'users', storedUserId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setUserCoins(typeof userSnap.data().coins === 'number' ? userSnap.data().coins : 0);
        } else {
          setUserCoins(0);
        }
      } catch (err) {
        console.error('Error checking access:', err);
      } finally {
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, [storedUserId, normalizedSubjectId]);

  if (loading) return <Loader text="Loading subject content..." />;

  if (error || !subject || (!unitData && unitId)) {
    return (
      <div className="page">
        <Header showBack title="Not Found" />
        <div className="empty-state">
          {error ? 'Failed to fetch unit content.' : 'Unit details not found in syllabus.'}
        </div>
      </div>
    );
  }

  // Generate roadmap topics
  const roadmapTopics = unitData.topicsList.map((t, idx) => ({
    number: `${unitData.unitNum}.${idx + 1}`,
    title: t,
    completed: false
  }));

  const tabs = [
    { id: 'roadmap', label: 'Syllabus' },
    { id: 'notes', label: 'Notes' },
    { id: 'pyqs', label: "PYQ's" },
    { id: 'questions', label: 'PAKKA PASS QUESTIONS' }
  ];

  // Handle coin-based unlock
  const handleUnlock = async () => {
    if (!storedUserId) {
      alert('User ID not found. Please go back to the home page and open ExamSync with your ID.');
      return;
    }
    if (userCoins === null || userCoins < UNLOCK_COST) {
      alert(`Not enough coins! You need ${UNLOCK_COST} coins but have ${userCoins ?? 0}.`);
      return;
    }

    setPurchasing(true);
    try {
      // 1. Deduct coins from user
      const userDocRef = doc(db, 'users', storedUserId);
      await updateDoc(userDocRef, {
        coins: userCoins - UNLOCK_COST,
      });

      // 2. Add userId to paidIds array in the subject
      const subDocRef = doc(db, 'college_code', 'admins', 'subjects', normalizedSubjectId);
      await updateDoc(subDocRef, {
        paidIds: arrayUnion(storedUserId),
      });

      // 3. Update local state
      setUserCoins(prev => prev - UNLOCK_COST);
      setIsUnlocked(true);

      // 4. Navigate to the viewer page
      navigate(`/subject/${encodeURIComponent(normalizedSubjectId)}/imp-questions`, {
        state: {
          subjectName: subject.name,
          courseCode: subject.code,
          backUrl: location.pathname + location.search,
        },
      });
    } catch (err) {
      console.error('Purchase failed:', err);
      alert('Purchase failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setPurchasing(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'roadmap':
        if (roadmapTopics.length === 0) return <div className="empty-state">No roadmap available.</div>;
        return (
          <div className="tab-content roadmap-content">
            <div className="topics-dropdown">
              {(Object.entries(subject.syllabus || {})
                .map(([unitNum, unitInfo]) => {
                  const isDetailed = typeof unitInfo === 'object';
                  const unitName = isDetailed ? unitInfo.name : `Unit ${unitNum}`;
                  const unitTopicsStr = isDetailed ? (unitInfo.topics || '') : unitInfo;
                  const topics = String(unitTopicsStr)
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);

                  return { unitNum, unitName, topics };
                })
                .sort((a, b) => Number(a.unitNum) - Number(b.unitNum))
              ).map((unit) => (
                <details key={unit.unitNum} className="topics-dropdown__unit">
                  <summary className="topics-dropdown__summary">
                    {/* <span className="topics-dropdown__label">Unit {unit.unitNum}</span> */}
                    <span className="topics-dropdown__title">{unit.unitName || `Unit ${unit.unitNum}`}</span>
                  </summary>
                  <div className="topics-dropdown__list">
                    {unit.topics.length === 0 ? (
                      <div className="topics-dropdown__item topics-dropdown__item--empty">No topics added.</div>
                    ) : (
                      unit.topics.map((topic, index) => (
                        <div key={`${unit.unitNum}-${index}`} className="topics-dropdown__item">
                          <span className="topics-dropdown__number">{unit.unitNum}.{index + 1}</span>
                          <span className="topics-dropdown__text">{topic}</span>
                        </div>
                      ))
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        );

      case 'notes':
        if (!subjectAssets.notes.length) {
          return (
            <div className="tab-content notes-content">
              <div className="empty-state">No notes added yet.</div>
            </div>
          );
        }
        return (
          <div className="tab-content notes-content">
            <div className="assets-list">
              {subjectAssets.notes.map((note, index) => (
                <div key={`note-${index}`} className="assets-card">
                  <div>
                    <div className="assets-card-title">{note.title || `Note ${index + 1}`}</div>
                    {/* <div className="assets-card-meta">PDF</div> */}
                  </div>
                  <button
                    className="assets-card-link"
                    type="button"
                    onClick={() => navigate(
                      `/subject/${encodeURIComponent(normalizedSubjectId)}/notes/view?title=${encodeURIComponent(note.title || `Note ${index + 1}`)}&url=${encodeURIComponent(note.link)}`
                    )}
                    disabled={!note.link}
                  >
                    Preview
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'pyqs':
        if (!subjectAssets.pyqs.length) {
          return (
            <div className="tab-content pyqs-content">
              <div className="empty-state">No PYQ&apos;s added yet.</div>
            </div>
          );
        }
        return (
          <div className="tab-content pyqs-content">
            <div className="assets-list">
              {subjectAssets.pyqs.map((pyq, index) => (
                <div key={`pyq-${index}`} className="assets-card">
                  <div>
                    <div className="assets-card-title">{pyq.tag || `PYQ ${index + 1}`}</div>
                    {/* <div className="assets-card-meta">Question Paper Link</div> */}
                  </div>
                  <button
                    className="assets-card-link"
                    type="button"
                    onClick={() => navigate(
                      `/subject/${encodeURIComponent(normalizedSubjectId)}/notes/view?title=${encodeURIComponent(pyq.tag || `PYQ ${index + 1}`)}&url=${encodeURIComponent(pyq.link)}&type=pyqs`
                    )}
                    disabled={!pyq.link}
                  >
                    Preview
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'questions':
        if (checkingAccess) {
          return (
            <div className="tab-content questions-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--color-text-muted)' }}>Checking access...</div>
            </div>
          );
        }

        if (!isUnlocked) {
          const hasEnoughCoins = userCoins !== null && userCoins >= UNLOCK_COST;
          return (
            <div className="tab-content questions-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
                <Lock size={48} color="#FFD700" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Pakka Pass Questions Locked</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '8px', maxWidth: '300px', lineHeight: '1.6' }}>
                Unlock premium important questions to ace your exams.
              </p>

              {userCoins !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                  <span>🪙</span>
                  <span>Your balance: <strong style={{ color: hasEnoughCoins ? '#50E3A4' : '#ef4444' }}>{userCoins} coins</strong></span>
                </div>
              )}

              {hasEnoughCoins ? (
                <button
                  onClick={handleUnlock}
                  disabled={purchasing}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '999px', fontSize: '16px', fontWeight: 'bold', background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000', border: 'none', cursor: purchasing ? 'wait' : 'pointer', opacity: purchasing ? 0.7 : 1 }}
                >
                  {purchasing ? (
                    <>Unlocking...</>
                  ) : (
                    <><Unlock size={18} /> Unlock with {UNLOCK_COST} Coins</>
                  )}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '14px', fontWeight: 600 }}>
                    <AlertCircle size={16} />
                    Not enough coins (need {UNLOCK_COST})
                  </div>
                  <button
                    disabled
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '999px', fontSize: '16px', fontWeight: 'bold', background: '#333', color: '#666', border: 'none', cursor: 'not-allowed' }}
                  >
                    <Lock size={18} /> Unlock with {UNLOCK_COST} Coins
                  </button>
                </div>
              )}
            </div>
          );
        }

        // Already unlocked — show "View Questions" button
        return (
          <div className="tab-content questions-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(80, 227, 164, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
              <Unlock size={48} color="#50E3A4" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Questions Unlocked! ✅</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '28px', maxWidth: '280px', lineHeight: '1.6' }}>
              You have access to all Pakka Pass Questions for this subject.
            </p>
            <button
              onClick={() => navigate(`/subject/${encodeURIComponent(normalizedSubjectId)}/imp-questions`, {
                state: {
                  subjectName: subject.name,
                  courseCode: subject.code,
                  backUrl: location.pathname + location.search,
                },
              })}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '999px', fontSize: '16px', fontWeight: 'bold', background: 'linear-gradient(135deg, #50E3A4, #0EA5E9)', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              <Eye size={18} /> View Pakka Pass Questions
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = roadmapTopics.length > 0 ? calcProgress(roadmapTopics) : 0;

  return (
    <div className="page subject-detail-page">

      <div
        className="subject-detail__hero"
        style={{ background: subject.gradient || 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
      >
        <button
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate(backToHome, { replace: true });
            }
          }}
          style={{ background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '8px' }}
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
        </button>
        <div className="subject-detail__hero-content">
          <div className="subject-detail__hero-text">
            <h1 className="subject-detail__title">{subject.name}</h1>
            <p className="subject-detail__subtitle">{subject.code} • {subject.category}</p>
          </div>
        </div>

        <div className="subject-detail__hero-bg-art">
          {subject.name.charAt(0)}
        </div>
      </div>

      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="subject-detail__main">
        {renderContent()}
      </main>
    </div>
  );
}
