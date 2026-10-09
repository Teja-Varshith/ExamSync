import './brand.css';

/**
 * ExamSync mark — a NeoPOP "plunk" block (face + skewed right/bottom edges)
 * carrying an abstract stacked-notes glyph that also reads as an "E".
 */
export function LogoMark({ size = 36, title = 'ExamSync' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label={title}
      className="es-logo-mark"
    >
      <polygon points="34,0 38,4 38,38 34,34" fill="#B38E30" />
      <polygon points="0,34 34,34 38,38 4,38" fill="#806623" />
      <rect x="0" y="0" width="34" height="34" fill="#FFCB45" />
      <rect x="7" y="8" width="20" height="4" fill="#0D0D0D" />
      <rect x="7" y="15" width="12" height="4" fill="#0D0D0D" />
      <rect x="7" y="22" width="20" height="4" fill="#0D0D0D" />
      <circle cx="24.5" cy="17" r="2.6" fill="#6A35FF" />
    </svg>
  );
}

export default function Logo({ size = 32, showWordmark = true, tagline }) {
  return (
    <span className="es-logo">
      <LogoMark size={size} />
      {showWordmark && (
        <span className="es-logo-text">
          <span className="es-logo-word">
            exam<em>sync</em>
          </span>
          {tagline && <span className="es-logo-tagline">{tagline}</span>}
        </span>
      )}
    </span>
  );
}
