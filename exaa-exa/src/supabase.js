import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uskfdcpysmlvfofsqfks.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVza2ZkY3B5c21sdmZvZnNxZmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTE1MjIsImV4cCI6MjA5MTQ2NzUyMn0.wuPO7I4HVJqXAuvTlUyC7vaR-mzvOjnqd3qmbQnxEoE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload an image file to Supabase Storage (ExamSync bucket → subjects folder).
 * Returns the public URL of the uploaded image.
 *
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export async function uploadImageToSupabase(file) {
  // Generate a unique filename to avoid collisions
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `subjects/${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage
    .from('ExamSync')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('ExamSync')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Process HTML content to find any base64-encoded images and re-upload them
 * to Supabase, replacing the base64 src with the public URL.
 *
 * This is used as a safety net before pushing content to Firebase,
 * ensuring no large base64 blobs end up in Firestore.
 *
 * @param {string} html - HTML content that may contain base64 images
 * @returns {Promise<string>} HTML with base64 images replaced by Supabase URLs
 */
export async function processHtmlImages(html) {
  if (!html) return html;

  // Match all base64 image sources
  const base64Regex = /src="(data:image\/[^;]+;base64,[^"]+)"/g;
  const matches = [...html.matchAll(base64Regex)];

  if (matches.length === 0) return html;

  let processedHtml = html;

  for (const match of matches) {
    const base64Str = match[1];

    try {
      // Convert base64 to a File object
      const response = await fetch(base64Str);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'png';
      const file = new File([blob], `image_${Date.now()}.${ext}`, { type: blob.type });

      // Upload to Supabase
      const publicUrl = await uploadImageToSupabase(file);

      // Replace base64 with the public URL in the HTML
      processedHtml = processedHtml.replace(base64Str, publicUrl);
    } catch (err) {
      console.error('Failed to process base64 image:', err);
      // Keep the base64 as fallback if upload fails
    }
  }

  return processedHtml;
}
