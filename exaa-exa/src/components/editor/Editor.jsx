import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ResizableImage from './ResizableImage';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import EditorToolbar from './EditorToolbar';

/**
 * Editor component — TipTap-based rich text editor.
 *
 * Features:
 * - Full rich text editing (bold, italic, underline, headings, lists)
 * - Image insertion with simulated upload
 * - Formula placeholder insertion
 * - Outputs HTML format for storage
 *
 * The editor uses TipTap's StarterKit (which includes common extensions)
 * plus Image, Placeholder, and Underline extensions.
 *
 * @param {Function} onContentChange - Callback fired on every content change with HTML string
 * @param {string} initialContent - Optional initial HTML content to load
 */
export default function Editor({ onContentChange, initialContent = '' }) {
  // Track image upload state to show loading indicator in toolbar
  const [uploading, setUploading] = useState(false);

  // Initialize TipTap editor with extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit includes: paragraph, heading, bold, italic,
        // bulletList, orderedList, listItem, blockquote, code, etc.
        heading: { levels: [1, 2, 3] },
      }),
      ResizableImage,
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing your answer here...',
      }),
    ],
    content: initialContent,
    // Fire callback on every content change so parent can track the HTML
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange?.(html);
    },
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-slate max-w-none focus:outline-none',
      },
    },
  });

  return (
    <div className="overflow-hidden">
      {/* Formatting toolbar */}
      <EditorToolbar editor={editor} uploading={uploading} setUploading={setUploading} />

      {/* Editor writing area */}
      <div style={{
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '16px 20px',
        minHeight: '500px',
        maxHeight: '800px',
        overflowY: 'auto',
        backgroundColor: '#FCFDFF',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
      }}>
        <EditorContent editor={editor} />
      </div>

      {/* Upload indicator */}
      {uploading && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-sm text-blue-600 flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading image...
        </div>
      )}
    </div>
  );
}
