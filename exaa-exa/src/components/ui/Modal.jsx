import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ElevatedCard } from '@cred/neopop-web/lib/components';
import './ui.css';

/** NeoPOP modal: title bar, scrollable body, sticky footer. */
export default function Modal({ title, subtitle, onClose, footer, children, width = 520, busy = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, busy]);

  return createPortal(
    <div className="neo-dialog-backdrop" onClick={() => !busy && onClose()}>
      <div
        className="neo-dialog neo-modal"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="neo-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <ElevatedCard fullWidth backgroundColor="#161616" edgeColors={{ right: '#3D3D3D', bottom: '#2A2A2A' }}>
          <div className="neo-modal__frame">
            <header className="neo-modal__head">
              <div>
                <h3 id="neo-modal-title" className="neo-dialog__title">{title}</h3>
                {subtitle && <p className="neo-modal__sub">{subtitle}</p>}
              </div>
              <button type="button" className="neo-icon-btn" onClick={onClose} disabled={busy} aria-label="Close">
                <X size={18} />
              </button>
            </header>
            <div className="neo-modal__body">{children}</div>
            {footer && <footer className="neo-modal__foot">{footer}</footer>}
          </div>
        </ElevatedCard>
      </div>
    </div>,
    document.body
  );
}
