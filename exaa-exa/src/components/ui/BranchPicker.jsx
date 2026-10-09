import { Check } from 'lucide-react';
import { BRANCHES } from '../../constants/branches';
import './ui.css';

/** Multi-select toggle chips for subject branches. */
export default function BranchPicker({ value = [], onChange, invalid = false, id }) {
  const toggle = (b) =>
    onChange(value.includes(b) ? value.filter((x) => x !== b) : BRANCHES.filter((x) => x === b || value.includes(x)));

  const allSelected = value.length === BRANCHES.length;

  return (
    <div className={`neo-branches${invalid ? ' is-invalid' : ''}`} id={id} role="group" aria-label="Branches">
      {BRANCHES.map((b) => {
        const on = value.includes(b);
        return (
          <button
            key={b}
            type="button"
            className={`neo-branch${on ? ' is-on' : ''}`}
            aria-pressed={on}
            onClick={() => toggle(b)}
          >
            <span className="neo-branch__box">{on && <Check size={12} strokeWidth={3} />}</span>
            {b}
          </button>
        );
      })}
      <button
        type="button"
        className="neo-branch neo-branch--all"
        onClick={() => onChange(allSelected ? [] : [...BRANCHES])}
      >
        {allSelected ? 'Clear' : 'All'}
      </button>
    </div>
  );
}
