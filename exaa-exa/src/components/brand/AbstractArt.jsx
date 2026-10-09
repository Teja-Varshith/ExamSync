import { hashString, toneFor } from '../../theme/neopop';

/**
 * Deterministic Bauhaus-style artwork for a subject.
 * Same `seed` → same composition, so every subject keeps a stable identity
 * without needing any image stored in the database.
 */
const INK = '#0D0D0D';

function DotGrid({ x, y, cols, rows, gap, r, fill, opacity = 1 }) {
  const dots = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      dots.push(<circle key={`${i}-${j}`} cx={x + i * gap} cy={y + j * gap} r={r} fill={fill} opacity={opacity} />);
    }
  }
  return <g>{dots}</g>;
}

function Stripes({ x, y, w, h, n, fill }) {
  const step = h / (n * 2 - 1);
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <rect key={i} x={x} y={y + i * step * 2} width={w} height={step} fill={fill} />
      ))}
    </g>
  );
}

const compositions = [
  // 0 — sun & horizon
  (t, ink) => (
    <>
      <circle cx="78" cy="44" r="30" fill={ink} />
      <path d="M48 44 a30 30 0 0 1 60 0 z" fill={t.pop} />
      <rect x="0" y="86" width="120" height="34" fill={ink} opacity="0.9" />
      <Stripes x={12} y={92} w={40} h={22} n={3} fill={t.face} />
      <DotGrid x={14} y={16} cols={4} rows={4} gap={9} r={2} fill={ink} opacity={0.55} />
    </>
  ),
  // 1 — quarter arcs
  (t, ink) => (
    <>
      <path d="M0 120 V60 a60 60 0 0 1 60 60 z" fill={ink} />
      <path d="M120 0 V48 a48 48 0 0 1 -48 -48 z" fill={t.pop} />
      <circle cx="86" cy="86" r="18" fill="none" stroke={ink} strokeWidth="6" />
      <rect x="24" y="22" width="26" height="26" fill="none" stroke={ink} strokeWidth="4" transform="rotate(12 37 35)" />
    </>
  ),
  // 2 — stacked blocks (NeoPOP plunk)
  (t, ink) => (
    <>
      <rect x="22" y="58" width="44" height="44" fill={ink} />
      <polygon points="66,58 72,64 72,108 66,102" fill={ink} opacity="0.55" />
      <rect x="54" y="20" width="44" height="44" fill={t.pop} />
      <polygon points="98,20 104,26 104,70 98,64" fill={ink} opacity="0.35" />
      <polygon points="54,64 98,64 104,70 60,70" fill={ink} opacity="0.5" />
      <DotGrid x={84} y={86} cols={3} rows={3} gap={9} r={2.2} fill={ink} />
    </>
  ),
  // 3 — orbit
  (t, ink) => (
    <>
      <circle cx="60" cy="60" r="40" fill="none" stroke={ink} strokeWidth="3" strokeDasharray="4 6" />
      <circle cx="60" cy="60" r="22" fill={ink} />
      <circle cx="96" cy="38" r="10" fill={t.pop} />
      <circle cx="26" cy="86" r="6" fill={ink} />
      <path d="M0 0 h28 L0 28 z" fill={ink} opacity="0.85" />
    </>
  ),
  // 4 — triangle & stripes
  (t, ink) => (
    <>
      <polygon points="60,14 106,96 14,96" fill={ink} />
      <polygon points="60,44 84,86 36,86" fill={t.pop} />
      <Stripes x={0} y={104} w={120} h={16} n={3} fill={ink} />
      <circle cx="100" cy="22" r="8" fill="none" stroke={ink} strokeWidth="3" />
    </>
  ),
];

export default function AbstractArt({ seed = '', size = 120, tone, variant, className = '', rounded = false }) {
  const t = tone || toneFor(seed);
  const pick = Number.isInteger(variant)
    ? variant % compositions.length
    : hashString(`${seed}::art`) % compositions.length;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={rounded ? { borderRadius: 8 } : undefined}
    >
      <rect width="120" height="120" fill={t.face} />
      {compositions[pick](t, INK)}
    </svg>
  );
}
