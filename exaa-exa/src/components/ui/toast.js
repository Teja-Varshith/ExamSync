/**
 * Non-blocking feedback (replaces window.alert).
 * NeoPOP's own <ToastContainer> relies on react-portal, which doesn't render on React 19,
 * so this is a tiny store rendered by <Toaster /> (Toaster.jsx) in the NeoPOP style.
 */
const listeners = new Set();
let toasts = [];
let seq = 0;

const emit = () => listeners.forEach((l) => l(toasts));

export function subscribe(listener) {
  listeners.add(listener);
  listener(toasts);
  return () => listeners.delete(listener);
}

export function dismiss(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const notify = (type) => (title, description) => {
  const id = ++seq;
  toasts = [...toasts.slice(-3), { id, type, title, description }];
  emit();
  setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500);
  return id;
};

export const toast = {
  success: notify('success'),
  error: notify('error'),
  warning: notify('warning'),
};

export default toast;
