import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, ClipboardList, Sparkles, ChevronDown, ArrowUpRight, Unlock, Lock } from 'lucide-react';
import Loader from '../../components/Loader/Loader';
import AbstractArt from '../../components/brand/AbstractArt';
import { CoinIcon, LockArt, UnlockedArt } from '../../components/brand/Illustrations';
import Segmented from '../../components/ui/Segmented';
import EmptyState from '../../components/ui/EmptyState';
import NeoButton from '../../components/ui/NeoButton';
import { useConfirm } from '../../components/ui/useConfirm';
import toast from '../../components/ui/toast';
import { toneFor } from '../../theme/neopop';
import api from '../../services/api';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import './SubjectDetailPage.css';

const mapToRows = (mapValue, type) => {
  if (!mapValue || typeof mapValue !== 'object') return [];
  return Object.keys(mapValue)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => (type === 'notes'
      ? { title: mapValue[key]?.title || '', link: mapValue[key]?.link || '' }
      : { tag: mapValue[key]?.tag || '', link: mapValue[key]?.link || '' }));
};

const parseUnits = (syllabus = {}) =>
  Object.entries(syllabus)
    .map(([unitNum, unitInfo]) => {
      const isDetailed = typeof unitInfo === 'object';
      const unitName = isDetailed ? unitInfo.name : `Unit ${unitNum}`;
      const topicsStr = isDetailed ? (unitInfo.topics || '') : unitInfo;
      const topics = String(topicsStr).split(',').map((t) => t.trim()).filter(Boolean);
      return { unitNum, unitName, topics };
    })
    .sort((a, b) => Number(a.unitNum) - Number(b.unitNum));

function SyllabusUnit({ unit, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`sd-unit${open ? ' is-open' : ''}`}>
      <button type="button" className="sd-unit__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="sd-unit__num">{String(unit.unitNum).padStart(2, '0')}</span>
        <span className="sd-unit__text">
          <span className="sd-unit__name">{unit.unitName || `Unit ${unit.unitNum}`}</span>
          <span className="sd-unit__meta">{unit.topics.length} topic{unit.topics.length !== 1 ? 's' : ''}</span>
        </span>
        <ChevronDown size={18} className="sd-unit__chev" />
      </button>
      {open && (
        <ol className="sd-unit__topics">
          {unit.topics.length === 0 ? (
            <li className="sd-topic sd-topic--empty">No topics added yet.</li>
          ) : (
            unit.topics.map((topic, i) => (
              <li key={i} className="sd-topic">
                <span className="sd-topic__num">{unit.unitNum}.{i + 1}</span>
                <span className="sd-topic__text">{topic}</span>
              </li>
            ))
          )}
        </ol>
      )}
    </div>
  );
}

function AssetList({ items, kind, onOpen }) {
  const Icon = kind === 'notes' ? FileText : ClipboardList;
  return (
    <ul className="sd-assets">
      {items.map((item, index) => {
        const label = (kind === 'notes' ? item.title : item.tag) || `${kind === 'notes' ? 'Note' : 'PYQ'} ${index + 1}`;
        return (
          <li key={`${kind}-${index}`}>
            <button
              type="button"
              className="sd-asset neo-plunk neo-plunk--press"
              onClick={() => onOpen(item, label)}
              disabled={!item.link}
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            >
              <span className={`sd-asset__icon sd-asset__icon--${kind}`}><Icon size={18} /></span>
              <span className="sd-asset__text">
                <span className="sd-asset__title">{label}</span>
                <span className="sd-asset__meta">{item.link ? 'PDF · Tap to open' : 'Link missing'}</span>
              </span>
              <ArrowUpRight size={18} className="sd-asset__go" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function SubjectDetailPage() {
  const { subjectId, unitId } = useParams();
  const normalizedSubjectId = subjectId ? decodeURIComponent(subjectId) : '';
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [unitMissing, setUnitMissing] = useState(false);
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
      setUnitMissing(false);
      try {
        const res = await api.getSubjectById(normalizedSubjectId);
        if (res.data) {
          setSubject(res.data);
          setSubjectAssets({
            notes: mapToRows(res.data.notes, 'notes'),
            pyqs: mapToRows(res.data.pyqs, 'pyqs'),
          });

          const syllabusData = res.data.syllabus || {};

          if (!unitId) {
            const firstUnitNum = Object.keys(syllabusData)
              .map((key) => Number(key))
              .filter((num) => Number.isFinite(num))
              .sort((a, b) => a - b)[0];

            if (firstUnitNum) {
              navigate(`/subject/${encodeURIComponent(normalizedSubjectId)}/unit/unit-${firstUnitNum}${location.search}`, { replace: true });
              return;
            }
          } else {
            const unitNum = unitId.match(/unit-(\d+)/)?.[1];
            setUnitMissing(!unitNum || !syllabusData[unitNum]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // Check paid_users sub-collection
        const paidRef = doc(db, 'examsync', 'admins', 'subjects', normalizedSubjectId, 'paid_users', storedUserId);
        const paidSnap = await getDoc(paidRef);
        if (paidSnap.exists()) {
          setIsUnlocked(true);
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

  const goBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(backToHome, { replace: true });
    }
  };

  if (loading) return <Loader text="Loading subject…" />;

  if (error || !subject || unitMissing) {
    return (
      <div className="page sd-page">
        <div className="sd-topbar">
          <button type="button" className="neo-icon-btn" onClick={goBack} aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
        </div>
        <EmptyState
          title={error ? "Couldn't load this subject" : 'Subject not found'}
          message={error ? 'Check your connection and try again.' : 'It may have been moved or removed by your college.'}
          action={<NeoButton variant="secondary" onClick={() => navigate(backToHome, { replace: true })}>Browse subjects</NeoButton>}
        />
      </div>
    );
  }

  const tone = toneFor(subject.courseCode || normalizedSubjectId);
  const units = parseUnits(subject.syllabus);
  const openQuestions = () =>
    navigate(`/subject/${encodeURIComponent(normalizedSubjectId)}/imp-questions`, {
      state: {
        subjectName: subject.name,
        courseCode: subject.code,
        backUrl: location.pathname + location.search,
      },
    });

  const tabs = [
    { value: 'roadmap', label: 'Syllabus', icon: BookOpen },
    { value: 'notes', label: 'Notes', icon: FileText, badge: subjectAssets.notes.length || null },
    { value: 'pyqs', label: 'PYQs', icon: ClipboardList, badge: subjectAssets.pyqs.length || null },
    { value: 'questions', label: 'Pakka Pass', icon: Sparkles },
  ];

  // Handle coin-based unlock
  const handleUnlock = async () => {
    if (!storedUserId) {
      toast.error('We couldn’t find your student ID', 'Open ExamSync again from your college app.');
      return;
    }
    if (userCoins === null || userCoins < UNLOCK_COST) {
      toast.warning('Not enough coins', `You need ${UNLOCK_COST} coins but have ${userCoins ?? 0}.`);
      return;
    }

    const ok = await confirm({
      title: `Unlock for ${UNLOCK_COST} coins?`,
      message: `You'll get lifetime access to Pakka Pass questions for ${subject.name}. Balance after unlock: ${userCoins - UNLOCK_COST} coins.`,
      confirmLabel: `Spend ${UNLOCK_COST} coins`,
      tone: 'premium',
    });
    if (!ok) return;

    setPurchasing(true);
    try {
      // 1. Deduct coins from user
      const userDocRef = doc(db, 'users', storedUserId);
      await updateDoc(userDocRef, {
        coins: userCoins - UNLOCK_COST,
      });

      // 2. Add userId to paid_users sub-collection in the subject
      const paidRef = doc(db, 'examsync', 'admins', 'subjects', normalizedSubjectId, 'paid_users', storedUserId);
      await setDoc(paidRef, { paidAt: new Date().toISOString() });

      // 3. Update local state
      setUserCoins((prev) => prev - UNLOCK_COST);
      setIsUnlocked(true);
      toast.success('Unlocked!', 'Pakka Pass questions are ready.');

      // 4. Navigate to the viewer page
      openQuestions();
    } catch (err) {
      console.error('Purchase failed:', err);
      toast.error('Purchase failed', err?.message || 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const openPdf = (item, label, type) => {
    navigate(
      `/subject/${encodeURIComponent(normalizedSubjectId)}/notes/view?title=${encodeURIComponent(label)}&url=${encodeURIComponent(item.link)}${type === 'pyqs' ? '&type=pyqs' : ''}`
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'roadmap':
        if (units.length === 0) {
          return <EmptyState compact title="Syllabus coming soon" message="Your faculty hasn't added the units for this subject yet." />;
        }
        return (
          <div className="sd-units">
            {units.map((unit, i) => (
              <SyllabusUnit key={unit.unitNum} unit={unit} defaultOpen={i === 0} />
            ))}
          </div>
        );

      case 'notes':
        if (!subjectAssets.notes.length) {
          return <EmptyState compact title="No notes yet" message="Notes will show up here as soon as they're uploaded." />;
        }
        return <AssetList items={subjectAssets.notes} kind="notes" onOpen={(item, label) => openPdf(item, label, 'notes')} />;

      case 'pyqs':
        if (!subjectAssets.pyqs.length) {
          return <EmptyState compact title="No PYQs yet" message="Previous year papers will show up here once added." />;
        }
        return <AssetList items={subjectAssets.pyqs} kind="pyqs" onOpen={(item, label) => openPdf(item, label, 'pyqs')} />;

      case 'questions': {
        if (checkingAccess) {
          return <Loader text="Checking your access…" />;
        }

        if (isUnlocked) {
          return (
            <div className="sd-paywall">
              <UnlockedArt size={128} />
              <span className="neo-chip neo-chip--success">Unlocked</span>
              <h3 className="sd-paywall__title">You&apos;re all set</h3>
              <p className="sd-paywall__text">You have access to every Pakka Pass question for this subject.</p>
              <NeoButton size="big" variant="success" icon={Sparkles} onClick={openQuestions}>
                View Pakka Pass questions
              </NeoButton>
            </div>
          );
        }

        const hasEnoughCoins = userCoins !== null && userCoins >= UNLOCK_COST;
        return (
          <div className="sd-paywall">
            <LockArt size={128} />
            <span className="neo-chip neo-chip--premium"><Sparkles size={12} /> Premium</span>
            <h3 className="sd-paywall__title">Pakka Pass questions</h3>
            <p className="sd-paywall__text">
              The most important, most-repeated questions for Mid 1, Mid 2 and Semester exams — with answers.
            </p>

            <div className="sd-paywall__price">
              <div>
                <span className="neo-label">Price</span>
                <strong><CoinIcon size={18} /> {UNLOCK_COST}</strong>
              </div>
              <div>
                <span className="neo-label">Your balance</span>
                <strong className={userCoins === null ? '' : hasEnoughCoins ? 'is-ok' : 'is-low'}>
                  <CoinIcon size={18} /> {userCoins ?? '—'}
                </strong>
              </div>
            </div>

            {hasEnoughCoins ? (
              <NeoButton size="big" variant="premium" icon={Unlock} loading={purchasing} onClick={handleUnlock}>
                {purchasing ? 'Unlocking…' : `Unlock for ${UNLOCK_COST} coins`}
              </NeoButton>
            ) : (
              <>
                <NeoButton size="big" variant="premium" icon={Lock} disabled>
                  Unlock for {UNLOCK_COST} coins
                </NeoButton>
                <p className="sd-paywall__hint">
                  {userCoins === null
                    ? 'Open ExamSync from your college app to use your coins.'
                    : <>You need <strong>{UNLOCK_COST - userCoins} more coins</strong> to unlock this.</>}
                </p>
              </>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="page sd-page">
      {/* Hero */}
      <header
        className="sd-hero"
        style={{ '--tile-face': tone.face, '--tile-ink': tone.ink, '--edge-b': tone.bottom }}
      >
        <div className="sd-hero__art">
          <AbstractArt seed={subject.courseCode || normalizedSubjectId} tone={tone} size={180} />
        </div>
        <button type="button" className="sd-hero__back" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <div className="sd-hero__content">
          <span className="sd-hero__code">{subject.code}</span>
          <h1 className="sd-hero__title">{subject.name}</h1>
          <p className="sd-hero__meta">
            {subject.category}
            {units.length > 0 && <> · {units.length} unit{units.length !== 1 ? 's' : ''}</>}
          </p>
        </div>
      </header>

      <nav className="sd-tabs">
        <Segmented options={tabs} value={activeTab} onChange={setActiveTab} ariaLabel="Subject sections" />
      </nav>

      <main className="sd-main" key={activeTab}>
        {renderContent()}
      </main>
    </div>
  );
}
