import { sanitizeHtml } from '../utils/sanitizeHtml';

/**
 * Send an answer to /api/ai-format (Groq, server-side) and get structured HTML back.
 * Images are swapped for [[IMG_n]] tokens before sending — keeps the request small
 * (no base64) and guarantees images come back untouched, with their size/alignment.
 */
export async function aiFormatAnswer({ question, answerHtml }) {
  const doc = new DOMParser().parseFromString(`<div id="__root">${answerHtml || ''}</div>`, 'text/html');
  const root = doc.getElementById('__root');

  const images = [];
  // Whole TipTap wrapper first (keeps alignment), then any bare <img>
  root.querySelectorAll('div[data-type="image-wrapper"], img').forEach((el) => {
    if (!el.isConnected) return;
    const token = `[[IMG_${images.length}]]`;
    images.push(el.outerHTML);
    el.replaceWith(doc.createTextNode(` ${token} `));
  });

  const res = await fetch('/api/ai-format', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer: root.innerHTML }),
  });

  let payload = {};
  try { payload = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) {
    throw new Error(payload.error || `AI formatting failed (${res.status})`);
  }

  let html = sanitizeHtml(payload.html || '');
  images.forEach((imgHtml, i) => {
    const token = `[[IMG_${i}]]`;
    if (html.includes(token)) {
      // Unwrap "<p>[[IMG_0]]</p>" so the image wrapper isn't nested inside a paragraph
      html = html.replace(new RegExp(`<p>\\s*\\[\\[IMG_${i}\\]\\]\\s*</p>`), imgHtml).replace(token, imgHtml);
    } else {
      html += imgHtml; // model dropped it — never lose an image
    }
  });
  return html;
}
