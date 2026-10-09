/**
 * ExamSync × NeoPOP theme
 * -----------------------
 * Single source of truth for colours used by NeoPOP components (which take
 * colours as props) and mirrored as CSS custom properties in src/styles/neopop.css.
 */
import { colorPalette } from '@cred/neopop-web/lib/primitives';

export const palette = colorPalette;

export const colors = {
  bg: '#0D0D0D',
  surface: '#161616',
  surface2: '#1F1F1F',
  border: '#2A2A2A',
  borderStrong: '#3D3D3D',
  text: '#FFFFFF',
  textSecondary: '#BDBDBD',
  textMuted: '#8A8A8A',

  accent: colorPalette.mannna[500], // #FFCB45
  accentEdgeRight: colorPalette.mannna[600],
  accentEdgeBottom: colorPalette.mannna[700],

  premium: colorPalette.poliPurple[500], // #6A35FF
  success: colorPalette.success[500],
  error: colorPalette.error[500],
};

/* ─── Button colour configs (NeoPOP `colorConfig` prop) ─── */
const edges = (right, bottom) => ({ top: 'transparent', left: 'transparent', right, bottom });

const disabled = {
  backgroundColor: '#2A2A2A',
  color: '#6B6B6B',
  borderColor: 'transparent',
  edgeColors: edges('#1F1F1F', '#161616'),
};

export const buttonColors = {
  primary: {
    backgroundColor: colors.accent,
    color: colors.bg,
    borderColor: 'transparent',
    edgeColors: edges(colors.accentEdgeRight, colors.accentEdgeBottom),
    disabledColors: disabled,
  },
  secondary: {
    backgroundColor: colors.surface2,
    color: colors.text,
    borderColor: colors.borderStrong,
    edgeColors: edges('#3D3D3D', '#2A2A2A'),
    disabledColors: disabled,
  },
  light: {
    backgroundColor: '#FFFFFF',
    color: colors.bg,
    borderColor: 'transparent',
    edgeColors: edges('#8A8A8A', '#3D3D3D'),
    disabledColors: disabled,
  },
  premium: {
    backgroundColor: colors.premium,
    color: '#FFFFFF',
    borderColor: 'transparent',
    edgeColors: edges(colorPalette.poliPurple[600], colorPalette.poliPurple[700]),
    disabledColors: disabled,
  },
  success: {
    backgroundColor: colors.success,
    color: colors.bg,
    borderColor: 'transparent',
    edgeColors: edges('#048A50', '#035C35'),
    disabledColors: disabled,
  },
  danger: {
    backgroundColor: colors.error,
    color: '#FFFFFF',
    borderColor: 'transparent',
    edgeColors: edges('#A63526', '#6E2319'),
    disabledColors: disabled,
  },
};

/* ─── Subject tones: face + edges + readable text ─── */
export const subjectTones = [
  { name: 'purple', face: colorPalette.poliPurple[500], right: colorPalette.poliPurple[600], bottom: colorPalette.poliPurple[700], ink: '#FFFFFF', pop: colorPalette.neoPaccha[500] },
  { name: 'lime', face: colorPalette.neoPaccha[500], right: colorPalette.neoPaccha[600], bottom: colorPalette.neoPaccha[700], ink: '#0D0D0D', pop: colorPalette.poliPurple[500] },
  { name: 'pink', face: colorPalette.pinkPong[500], right: colorPalette.pinkPong[600], bottom: colorPalette.pinkPong[700], ink: '#0D0D0D', pop: '#FFFFFF' },
  { name: 'orange', face: colorPalette.rss[500], right: colorPalette.rss[600], bottom: colorPalette.rss[700], ink: '#0D0D0D', pop: colorPalette.poliPurple[500] },
  { name: 'violet', face: colorPalette.yoyo[500], right: colorPalette.yoyo[600], bottom: colorPalette.yoyo[700], ink: '#FFFFFF', pop: colorPalette.mannna[500] },
  { name: 'blue', face: colorPalette.info[500], right: '#0E3793', bottom: '#0A2766', ink: '#FFFFFF', pop: colorPalette.pinkPong[500] },
];

/** Stable hash so the same subject always gets the same tone / art. */
export function hashString(str = '') {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function toneFor(seed) {
  return subjectTones[hashString(String(seed)) % subjectTones.length];
}
