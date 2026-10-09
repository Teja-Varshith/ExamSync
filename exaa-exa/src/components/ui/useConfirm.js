import { createContext, useContext } from 'react';

export const ConfirmContext = createContext(null);

/**
 * Promise-based confirm dialog (replaces window.confirm).
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Delete?', tone: 'danger' }))) return;
 */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
