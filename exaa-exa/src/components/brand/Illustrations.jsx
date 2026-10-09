/**
 * Small abstract SVG illustrations in the NeoPOP style
 * (flat faces + 45° skewed "plunk" edges, black ink, one pop colour).
 */

export function CoinIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="13" cy="13" r="10" fill="#806623" />
      <circle cx="11" cy="11" r="10" fill="#FFCB45" />
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="#0D0D0D" strokeWidth="1.6" />
      <rect x="9.6" y="7" width="2.8" height="8" fill="#0D0D0D" />
    </svg>
  );
}

export function LockArt({ size = 140 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" aria-hidden="true">
      <circle cx="70" cy="70" r="62" fill="#161616" />
      <circle cx="70" cy="70" r="62" fill="none" stroke="#2A2A2A" strokeWidth="2" strokeDasharray="3 7" />
      {/* shackle */}
      <path d="M48 64 V48 a22 22 0 0 1 44 0 V64" fill="none" stroke="#FFFFFF" strokeWidth="9" />
      {/* body + plunk edges */}
      <polygon points="100,62 106,68 106,112 100,106" fill="#4A25B3" />
      <polygon points="38,106 100,106 106,112 44,112" fill="#351A80" />
      <rect x="38" y="62" width="62" height="44" fill="#6A35FF" />
      <circle cx="69" cy="80" r="6" fill="#0D0D0D" />
      <rect x="66" y="82" width="6" height="12" fill="#0D0D0D" />
      {/* sparkles */}
      <path d="M112 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill="#FFCB45" />
      <circle cx="26" cy="40" r="4" fill="#E5FE40" />
    </svg>
  );
}

export function UnlockedArt({ size = 140 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" aria-hidden="true">
      <circle cx="70" cy="70" r="62" fill="#161616" />
      <path d="M48 64 V44 a22 22 0 0 1 44 0" fill="none" stroke="#FFFFFF" strokeWidth="9" transform="translate(-14 -6) rotate(-14 70 50)" />
      <polygon points="100,62 106,68 106,112 100,106" fill="#048A50" />
      <polygon points="38,106 100,106 106,112 44,112" fill="#035C35" />
      <rect x="38" y="62" width="62" height="44" fill="#06C270" />
      <path d="M55 84 l9 9 18 -18" fill="none" stroke="#0D0D0D" strokeWidth="6" />
      <path d="M112 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill="#FFCB45" />
    </svg>
  );
}

export function EmptyArt({ size = 120 }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 160 120" aria-hidden="true">
      <rect x="44" y="16" width="72" height="88" fill="none" stroke="#3D3D3D" strokeWidth="2" strokeDasharray="5 5" />
      <polygon points="116,26 122,32 122,110 116,104" fill="#2A2A2A" />
      <polygon points="34,104 116,104 122,110 40,110" fill="#1F1F1F" />
      <rect x="34" y="26" width="82" height="78" fill="#161616" stroke="#3D3D3D" strokeWidth="2" />
      <rect x="46" y="42" width="46" height="6" fill="#3D3D3D" />
      <rect x="46" y="56" width="58" height="6" fill="#2A2A2A" />
      <rect x="46" y="70" width="34" height="6" fill="#2A2A2A" />
      <circle cx="130" cy="22" r="9" fill="#FFCB45" />
      <path d="M18 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#6A35FF" />
    </svg>
  );
}

export function NotFoundArt({ size = 220 }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 220 120" aria-hidden="true">
      {/* 4 */}
      <polygon points="12,10 34,10 34,62 52,62 52,80 12,80" fill="#FFCB45" />
      <rect x="40" y="24" width="18" height="86" fill="#FFCB45" />
      <polygon points="58,24 64,30 64,116 58,110" fill="#806623" />
      {/* 0 — a ring */}
      <circle cx="110" cy="60" r="44" fill="#6A35FF" />
      <circle cx="110" cy="60" r="20" fill="#0D0D0D" />
      <circle cx="132" cy="38" r="6" fill="#E5FE40" />
      {/* 4 */}
      <polygon points="164,10 186,10 186,62 204,62 204,80 164,80" fill="#FF426F" />
      <rect x="192" y="24" width="18" height="86" fill="#FF426F" />
      <polygon points="210,24 216,30 216,116 210,110" fill="#802138" />
    </svg>
  );
}
