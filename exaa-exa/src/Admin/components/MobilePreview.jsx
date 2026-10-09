import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Smartphone, X } from 'lucide-react';
import QuestionCard from '../../components/answer/QuestionCard';
import Segmented from '../../components/ui/Segmented';
import { toneFor } from '../../theme/neopop';
import '../../pages/ImpQuestionsViewer/ImpQuestionsViewer.css';
import './MobilePreview.css';

const DEVICES = [
  { value: 360, label: '360' },
  { value: 390, label: '390' },
  { value: 430, label: '430' },
];

/**
 * Shows questions inside a phone frame, rendered with the same components
 * and CSS as the student Pakka Pass viewer.
 *
 * items: [{ question, answer, tag }]
 */
export default function MobilePreview({ items, startIndex = 0, examLabel, subjectName, title = 'Student preview', onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [open, setOpen] = useState(true);
  const [width, setWidth] = useState(390);
  const item = items[index];
  const many = items.length > 1;

  // Switching question re-opens its answer
  const go = (next) => {
    setIndex(Math.max(0, Math.min(items.length - 1, next)));
    setOpen(true);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (many && e.key === 'ArrowRight') { setIndex((i) => Math.min(items.length - 1, i + 1)); setOpen(true); }
      if (many && e.key === 'ArrowLeft') { setIndex((i) => Math.max(0, i - 1)); setOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, many, items.length]);

  if (!item) return null;
  const tone = toneFor(item.tag || '');

  return createPortal(
    <div className="mp-backdrop" onClick={onClose}>
      <div className="mp" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="mp__bar">
          <div className="mp__title">
            <Smartphone size={18} />
            <span>{title}</span>
            {many && <span className="neo-chip">{index + 1} / {items.length}</span>}
          </div>
          <Segmented size="small" ariaLabel="Phone width" value={width} onChange={setWidth} options={DEVICES} />
          <button type="button" className="neo-icon-btn" onClick={onClose} aria-label="Close preview">
            <X size={18} />
          </button>
        </header>

        <div className="mp__stage">
          {many && (
            <button
              type="button"
              className="neo-icon-btn mp__nav"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label="Previous question"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div className="mp__phone" style={{ width: width + 24 }}>
            <div className="mp__notch" />
            <div className="mp__screen">
              <div className="mp__status">
                <span>9:41</span>
                <span className="mp__status-icons"><i /><i /><i /></span>
              </div>

              {/* Mirrors the student Q&A screen */}
              <div className="iq-page mp__app">
                <header className="iq-topbar">
                  <span className="neo-icon-btn" aria-hidden="true"><ArrowLeft size={20} /></span>
                  <div className="iq-topbar__text">
                    <span className="iq-topbar__title">{item.tag || 'Pakka Pass'}</span>
                    <span className="iq-topbar__sub">{examLabel}{subjectName ? ` · ${subjectName}` : ''}</span>
                  </div>
                  <span className="neo-chip neo-chip--premium"><Sparkles size={12} /> Pro</span>
                </header>
                <div className="iq-qa-head">
                  <span className="iq-qa-head__bar" style={{ background: tone.face }} />
                  <span className="iq-qa-head__count">Question {index + 1}</span>
                </div>
                <main className="iq-content">
                  <QuestionCard
                    question={item.question}
                    answer={item.answer}
                    index={index}
                    open={open}
                    onToggle={() => setOpen(!open)}
                  />
                </main>
              </div>
            </div>
          </div>

          {many && (
            <button
              type="button"
              className="neo-icon-btn mp__nav"
              onClick={() => go(index + 1)}
              disabled={index === items.length - 1}
              aria-label="Next question"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
        <p className="mp__hint">This is exactly how students see it in the app{many ? ' · ← → to switch questions' : ''} · Esc to close</p>
      </div>
    </div>,
    document.body
  );
}
