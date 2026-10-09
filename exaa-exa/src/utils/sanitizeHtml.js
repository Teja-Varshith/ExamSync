/**
 * Allow-list HTML sanitizer for answer content (TipTap output, AI output, hand-edited HTML).
 * Unknown tags are unwrapped (text kept); dangerous ones are dropped entirely.
 */

const ALLOWED = {
  P: [], BR: [], HR: [],
  H1: [], H2: [], H3: [], H4: [], H5: [], H6: [],
  STRONG: [], B: [], EM: [], I: [], U: [], S: [], SUB: [], SUP: [], MARK: [],
  UL: [], OL: ['start'], LI: [],
  BLOCKQUOTE: [], CODE: [], PRE: [],
  TABLE: [], THEAD: [], TBODY: [], TFOOT: [], TR: [], TH: ['colspan', 'rowspan'], TD: ['colspan', 'rowspan'],
  A: ['href'],
  IMG: ['src', 'alt', 'width', 'height', 'class', 'data-alignment', 'style'],
  // TipTap ResizableImage wrapper
  DIV: ['data-type', 'style'],
  SPAN: [],
};

const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'SVG', 'MATH', 'NOSCRIPT', 'TEMPLATE']);

// Only the layout props the image wrapper needs
const SAFE_STYLE = /^(width|max-width|display|justify-content|text-align)\s*:\s*[-#\w\s.%]+$/i;

function cleanStyle(value) {
  return value
    .split(';')
    .map((d) => d.trim())
    .filter((d) => d && SAFE_STYLE.test(d))
    .join('; ');
}

function safeUrl(value, { allowDataImage = false } = {}) {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(v)) return v;
  return null;
}

function walk(node) {
  [...node.children].forEach((el) => {
    const tag = el.tagName;
    if (DROP.has(tag)) {
      el.remove();
      return;
    }
    walk(el);
    if (!(tag in ALLOWED)) {
      el.replaceWith(...el.childNodes);
      return;
    }
    [...el.attributes].forEach(({ name, value }) => {
      if (!ALLOWED[tag].includes(name)) {
        el.removeAttribute(name);
      } else if (name === 'style') {
        const s = cleanStyle(value);
        s ? el.setAttribute('style', s) : el.removeAttribute('style');
      } else if (name === 'src' || name === 'href') {
        const url = safeUrl(value, { allowDataImage: name === 'src' });
        url ? el.setAttribute(name, url) : el.removeAttribute(name);
      }
    });
    if (tag === 'A') {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

export function sanitizeHtml(html) {
  if (!html || typeof window === 'undefined') return html || '';
  const doc = new DOMParser().parseFromString(`<div id="__root">${html}</div>`, 'text/html');
  const root = doc.getElementById('__root');
  walk(root);
  return root.innerHTML;
}

/** True when the HTML only uses what the TipTap rich editor can round-trip. */
const TIPTAP_TAGS = new Set(['P', 'BR', 'HR', 'H1', 'H2', 'H3', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'CODE', 'PRE', 'IMG', 'DIV', 'SPAN']);

export function isEditorCompatible(html) {
  if (!html || typeof window === 'undefined') return true;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  return [...doc.body.querySelectorAll('*')].every((el) => TIPTAP_TAGS.has(el.tagName) || el === doc.body.firstChild);
}

/** True when there is no visible text and no image. */
export function isHtmlEmpty(html) {
  if (!html) return true;
  if (/<img\b/i.test(html)) return false;
  return !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
