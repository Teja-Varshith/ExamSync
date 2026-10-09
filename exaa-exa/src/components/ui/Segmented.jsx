import './ui.css';

/**
 * Segmented control — a row of mutually exclusive options.
 * options: [{ value, label, icon?, disabled?, badge? }]
 */
export default function Segmented({ options, value, onChange, size = 'medium', ariaLabel, className = '' }) {
  return (
    <div className={`neo-seg neo-seg--${size} ${className}`} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={opt.disabled}
            className={`neo-seg__item${active ? ' is-active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {Icon && <Icon size={size === 'small' ? 14 : 16} strokeWidth={2.4} />}
            <span>{opt.label}</span>
            {opt.badge != null && <span className="neo-seg__badge">{opt.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
