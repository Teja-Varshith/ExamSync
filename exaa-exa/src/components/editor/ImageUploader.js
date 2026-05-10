
import { uploadImage } from '../../ExamSync_author/services/mockUploadService';

/**
 * Opens a file input dialog and inserts the selected image into the editor.
 * @param {Object} editor - TipTap editor instance
 * @param {Function} setUploading - State setter to show upload progress
 */
export function triggerImageUpload(editor, setUploading) {
  // Create a temporary file input element
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Upload to Supabase Storage and get the public URL
      const publicUrl = await uploadImage(file);

      // Insert the image at the current cursor position in the editor
      // Using the Supabase public URL so it persists and works everywhere
      editor
        .chain()
        .focus()
        .setImage({ src: publicUrl, alt: file.name })
        .run();
    } catch (error) {
      console.error('Image upload failed:', error);
      alert(error?.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Trigger the file dialog
  input.click();
}
