import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { subscribe, dismiss } from './toast';
import './ui.css';

const ICONS = { success: CheckCircle2, warning: AlertTriangle, error: XCircle };

/** Mount once near the app root. */
export default function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => subscribe(setItems), []);

  return createPortal(
    <div className="neo-toasts" role="region" aria-label="Notifications">
      {items.map((t) => {
        const Icon = ICONS[t.type] || CheckCircle2;
        return (
          <div
            key={t.id}
            className={`neo-toast neo-toast--${t.type}`}
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            <Icon size={18} className="neo-toast__icon" />
            <div className="neo-toast__text">
              <strong>{t.title}</strong>
              {t.description && <span>{t.description}</span>}
            </div>
            <button type="button" className="neo-toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
