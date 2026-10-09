import { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import './answer.css';

/** Rendered answer HTML exactly as students see it. */
export function AnswerContent({ html }) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className="es-answer"
      dangerouslySetInnerHTML={{ __html: clean || '<em>No answer provided.</em>' }}
    />
  );
}

/** One Pakka Pass question as an accordion card (student viewer + admin preview). */
export default function QuestionCard({ question, answer, index, open, onToggle }) {
  return (
    <div
      className={`iq-q${open ? ' is-open' : ''}`}
      style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
    >
      <button type="button" className="iq-q__head" onClick={onToggle} aria-expanded={open}>
        <span className="iq-q__num">Q{index + 1}</span>
        <span className="iq-q__text">{question || <em className="iq-q__placeholder">Untitled question</em>}</span>
        <ChevronDown size={18} className="iq-q__chev" />
      </button>
      {open && (
        <div className="iq-q__body">
          <span className="neo-eyebrow">Answer</span>
          <AnswerContent html={answer} />
        </div>
      )}
    </div>
  );
}
