import React from 'react';
import { triggerImageUpload } from './ImageUploader';

/**
 * EditorToolbar — Rich text formatting toolbar for the TipTap editor.
 *
 * Provides buttons for:
 * - Text formatting: Bold, Italic, Underline
 * - Headings: H1, H2, H3
 * - Lists: Bullet list, Ordered list
 * - Media: Image insertion
 * - Utility: Formula placeholder
 *
 * Each button checks the editor's current state to show active styling.
 */
export default function EditorToolbar({ editor, uploading, setUploading }) {
  if (!editor) return null;

  const ToolbarButton = ({ onClick, isActive = false, disabled = false, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '14px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '32px',
        minHeight: '32px',
        border: 'none',
        background: isActive ? 'var(--accent-faint)' : 'transparent',
        color: isActive ? 'var(--accent-base)' : 'var(--text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all var(--trans-fast)'
      }}
      onMouseOver={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.background = 'var(--bg-surface-active)';
          e.currentTarget.style.color = 'var(--text-main)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
    >
      {children}
    </button>
  );

  // Separator between button groups
  const Divider = () => <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle)', margin: '0 8px' }} />;

  /**
   * Insert a formula placeholder at the cursor position.
   * In production, this could open a LaTeX/KaTeX editor modal.
   */
  const insertFormulaPlaceholder = () => {
    editor
      .chain()
      .focus()
      .insertContent('<p><strong>[Formula: Enter your equation here]</strong></p>')
      .run();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <span className="font-bold">B</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <span className="italic">I</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        H1
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* Image Upload */}
      <ToolbarButton
        onClick={() => triggerImageUpload(editor, setUploading)}
        disabled={uploading}
        title="Insert Image"
      >
        {uploading ? (
          <svg width="16" height="16" className="animate-spin" fill="none" viewBox="0 0 24 24">
            <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </ToolbarButton>

      {/* Formula Placeholder */}
      <ToolbarButton
        onClick={insertFormulaPlaceholder}
        title="Insert Formula Placeholder"
      >
        <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>f(x)</span>
      </ToolbarButton>
    </div>
  );
}
