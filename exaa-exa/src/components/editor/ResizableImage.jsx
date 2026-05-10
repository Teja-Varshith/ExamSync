import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useCallback, useRef, useState } from 'react';

/**
 * ResizableImageComponent — React node view for resizable images.
 *
 * Features:
 *  - Click to select → shows resize handle + toolbar
 *  - Drag bottom-right handle to resize proportionally
 *  - Size presets (S / M / L / Full)
 *  - Alignment controls (Left / Center / Right)
 */
function ResizableImageComponent({ node, updateAttributes, selected }) {
  const containerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);

  const { src, alt, width, height, alignment } = node.attrs;

  // ─── Drag-to-Resize ────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = containerRef.current?.offsetWidth || width || 300;
      const aspectRatio = (containerRef.current?.offsetHeight || 200) / startWidth;

      setIsResizing(true);

      const onMouseMove = (moveEvent) => {
        const diff = moveEvent.clientX - startX;
        const newWidth = Math.max(80, Math.min(startWidth + diff, 800));
        updateAttributes({
          width: Math.round(newWidth),
          height: Math.round(newWidth * aspectRatio),
        });
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [width, updateAttributes]
  );

  // ─── Presets ───────────────────────────────────────────────────
  const presets = [
    { label: 'S', value: 150 },
    { label: 'M', value: 300 },
    { label: 'L', value: 500 },
    { label: 'Full', value: null },
  ];

  // ─── Alignment helpers ─────────────────────────────────────────
  const alignments = [
    { id: 'left', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" />
      </svg>
    )},
    { id: 'center', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" />
      </svg>
    )},
    { id: 'right', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="7" y2="18" />
      </svg>
    )},
  ];

  const currentAlignment = alignment || 'center';

  // Map alignment to wrapper style
  const wrapperAlignStyle = {
    left:   { display: 'flex', justifyContent: 'flex-start' },
    center: { display: 'flex', justifyContent: 'center' },
    right:  { display: 'flex', justifyContent: 'flex-end' },
  }[currentAlignment];

  return (
    <NodeViewWrapper
      className={`resizable-image-wrapper align-${currentAlignment}`}
      style={wrapperAlignStyle}
      data-drag-handle
    >
      <div
        ref={containerRef}
        className={`resizable-image-container ${selected ? 'selected' : ''} ${isResizing ? 'resizing' : ''}`}
        style={{ width: width ? `${width}px` : '100%', display: 'inline-block', position: 'relative' }}
      >
        <img
          src={src}
          alt={alt || ''}
          style={{
            width: '100%',
            height: height ? `${height}px` : 'auto',
            display: 'block',
            borderRadius: '8px',
          }}
          draggable={false}
        />

        {/* Controls — visible only when selected */}
        {selected && (
          <>
            {/* Resize handle — bottom-right corner */}
            <div
              className="resize-handle"
              onMouseDown={handleMouseDown}
              title="Drag to resize"
            />

            {/* ── Floating Toolbar ── */}
            <div className="resize-toolbar">
              {/* Alignment buttons */}
              <div className="resize-toolbar-group">
                {alignments.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    title={`Align ${a.id}`}
                    className={`resize-toolbar-btn ${currentAlignment === a.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAttributes({ alignment: a.id });
                    }}
                  >
                    {a.icon}
                  </button>
                ))}
              </div>

              <div className="resize-toolbar-divider" />

              {/* Size presets */}
              <div className="resize-toolbar-group">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className={`resize-toolbar-btn ${(!width && !p.value) || width === p.value ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (p.value) {
                        const img = containerRef.current?.querySelector('img');
                        const ratio = img ? img.naturalHeight / img.naturalWidth : 0.75;
                        updateAttributes({ width: p.value, height: Math.round(p.value * ratio) });
                      } else {
                        updateAttributes({ width: null, height: null });
                      }
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

/**
 * ResizableImage — TipTap extension that replaces the default Image extension
 * with a resizable + alignable version using React node views.
 */
const ResizableImage = Node.create({
  name: 'image',

  group: 'block',
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src:       { default: null },
      alt:       { default: null },
      title:     { default: null },
      width:     { default: null },
      height:    { default: null },
      alignment: { default: 'center' },
    };
  },

  parseHTML() {
    return [{
      tag: 'img[src]',
      getAttrs: (dom) => ({
        src:   dom.getAttribute('src'),
        alt:   dom.getAttribute('alt'),
        title: dom.getAttribute('title'),
        width: dom.getAttribute('width') ? Number(dom.getAttribute('width')) : null,
        height: dom.getAttribute('height') ? Number(dom.getAttribute('height')) : null,
        alignment: dom.getAttribute('data-alignment') || 'center',
      }),
    }];
  },

  renderHTML({ HTMLAttributes }) {
    const { alignment, ...rest } = HTMLAttributes;
    const style = [];
    if (rest.width) style.push(`width: ${rest.width}px`);

    const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
    const wrapperStyle = `display:flex;justify-content:${alignMap[alignment] || 'center'}`;

    return [
      'div',
      { style: wrapperStyle, 'data-type': 'image-wrapper' },
      ['img', mergeAttributes(
        { class: 'editor-image', 'data-alignment': alignment || 'center' },
        rest,
        style.length ? { style: style.join(';') } : {},
      )],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

export default ResizableImage;
