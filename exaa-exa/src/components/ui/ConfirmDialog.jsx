import { useCallback, useEffect, useRef, useState } from 'react';
import { ElevatedCard } from '@cred/neopop-web/lib/components';
import NeoButton from './NeoButton';
import { ConfirmContext } from './useConfirm';
import './ui.css';

/** Renders the dialog for useConfirm() — mount once near the app root. */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((opts = {}) => {
    setState({
      title: 'Are you sure?',
      message: '',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      tone: 'primary',
      ...opts,
    });
    return new Promise((resolve) => { resolver.current = resolve; });
  }, []);

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  }, []);

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="neo-dialog-backdrop" onClick={() => close(false)}>
          <div
            className="neo-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="neo-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <ElevatedCard
              fullWidth
              backgroundColor="#161616"
              edgeColors={{ right: '#3D3D3D', bottom: '#2A2A2A' }}
            >
              <div className="neo-dialog__body">
                <h3 id="neo-dialog-title" className="neo-dialog__title">{state.title}</h3>
                {state.message && <p className="neo-dialog__message">{state.message}</p>}
                <div className="neo-dialog__actions">
                  <NeoButton variant="secondary" kind="flat" onClick={() => close(false)}>
                    {state.cancelLabel}
                  </NeoButton>
                  <NeoButton variant={state.tone} onClick={() => close(true)} autoFocus>
                    {state.confirmLabel}
                  </NeoButton>
                </div>
              </div>
            </ElevatedCard>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
