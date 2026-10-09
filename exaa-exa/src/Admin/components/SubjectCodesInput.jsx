import { useId, useState } from 'react';
import { BookOpen, Plus, X } from 'lucide-react';
import NeoButton from '../../components/ui/NeoButton';

/**
 * Pick course codes to assign to an examite.
 * value: lower-cased course codes · allSubjects: subjects for suggestions + names
 */
export default function SubjectCodesInput({ value, onChange, allSubjects, onError }) {
  const [input, setInput] = useState('');
  const listId = useId();

  const nameFor = (code) => {
    const found = allSubjects.find((s) => (s.courseCode || s.code || '').toLowerCase() === code.toLowerCase());
    return found ? `${found.name} · ${code.toUpperCase()}` : code.toUpperCase();
  };

  const add = () => {
    const code = input.trim().toLowerCase();
    if (!code) return;
    if (value.includes(code)) {
      onError?.('That subject is already in the list.');
      return;
    }
    onChange([...value, code]);
    setInput('');
    onError?.('');
  };

  const unknown = input.trim() && !allSubjects.some((s) => (s.courseCode || s.code || '').toLowerCase() === input.trim().toLowerCase());

  return (
    <>
      <div className="ad-inline">
        <div className="neo-input-wrap">
          <BookOpen size={16} />
          <input
            className="neo-input"
            placeholder="Type a course code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            list={listId}
            aria-label="Course code to assign"
          />
        </div>
        <NeoButton variant="secondary" kind="flat" icon={Plus} onClick={add} disabled={!input.trim()}>
          Add
        </NeoButton>
      </div>
      <datalist id={listId}>
        {allSubjects.map((s) => (
          <option key={s.courseCode || s.code} value={(s.courseCode || s.code || '').toLowerCase()}>
            {s.name}
          </option>
        ))}
      </datalist>
      {unknown && <span className="neo-help">No subject with this code yet. You can still assign it.</span>}
      {value.length > 0 && (
        <div className="ad-chips">
          {value.map((code) => (
            <span key={code} className="neo-chip neo-chip--accent">
              {nameFor(code)}
              <button type="button" onClick={() => onChange(value.filter((c) => c !== code))} aria-label={`Remove ${code}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
