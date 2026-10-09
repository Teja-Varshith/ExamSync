/**
 * ImageKit.io client helper for ExamSync.
 *
 * Uploads images directly to ImageKit using signatures generated
 * server-side via /api/imagekit-auth.
 *
 * This keeps the private key completely secret on the server while
 * sending images directly to ImageKit's AWS CloudFront CDN for ultra-fast rendering.
 */

/**
 * Upload an image (File, Blob, or base64 data URL) to ImageKit.
 *
 * @param {File | Blob | string} file - The image to upload
 * @param {string} [fileName] - Optional custom filename
 * @returns {Promise<string>} The public CDN URL of the uploaded image
 */
export async function uploadImageToImageKit(file, fileName) {
  if (!file) throw new Error('No image provided for upload');

  // 1. Fetch upload signature from serverless endpoint
  const authRes = await fetch('/api/imagekit-auth');
  if (!authRes.ok) {
    const errData = await authRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to authorize image upload');
  }
  const { token, expire, signature, publicKey } = await authRes.json();

  // 2. Prepare multipart form data
  const formData = new FormData();
  formData.append('file', file);

  const resolvedFileName =
    fileName ||
    (typeof file === 'object' && file?.name) ||
    `image_${Date.now()}.png`;

  formData.append('fileName', resolvedFileName);
  formData.append('publicKey', publicKey);
  formData.append('signature', signature);
  formData.append('expire', expire);
  formData.append('token', token);
  formData.append('folder', '/examsync');
  formData.append('useUniqueFileName', 'true');

  // 3. Post directly to ImageKit
  const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    const errData = await uploadRes.json().catch(() => ({}));
    console.error('ImageKit upload error:', errData);
    throw new Error(errData.message || `Upload failed with status ${uploadRes.status}`);
  }

  const result = await uploadRes.json();
  return result.url;
}

/**
 * Process HTML content to find any base64-encoded images and re-upload them
 * to ImageKit, replacing the base64 src with the public CDN URL.
 *
 * This prevents large base64 blobs from bloating Firestore documents.
 *
 * @param {string} html - HTML content that may contain base64 images
 * @returns {Promise<string>} HTML with base64 images replaced by ImageKit URLs
 */
export async function processHtmlImages(html) {
  if (!html) return html;

  const base64Regex = /src="(data:image\/[^;]+;base64,[^"]+)"/g;
  const matches = [...html.matchAll(base64Regex)];

  if (matches.length === 0) return html;

  let processedHtml = html;

  for (const match of matches) {
    const base64Str = match[1];
    try {
      const publicUrl = await uploadImageToImageKit(base64Str, `extracted_${Date.now()}.png`);
      processedHtml = processedHtml.replace(base64Str, publicUrl);
    } catch (err) {
      console.error('Failed to process base64 image via ImageKit:', err);
    }
  }

  return processedHtml;
}

// Backward-compatibility alias so existing code continues to work seamlessly
export const uploadImageToSupabase = uploadImageToImageKit;
export default uploadImageToImageKit;
