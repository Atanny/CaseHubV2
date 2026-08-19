import { useState } from 'react';
import { cls } from '../../utils/cls';

const TONES = {
  success: 'bg-ch-main text-white',
  error: 'bg-ch-red text-white',
  info: 'bg-white text-ch-main border border-ch-border',
};

/** Fixed-position toast, shown at the bottom of the screen. */
export default function Toast({ msg, type = 'success' }) {
  if (!msg) return null;
  return (
    <div
      className={cls(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-ch shadow-ch',
        'font-body text-body',
        TONES[type] || TONES.success
      )}
    >
      {msg}
    </div>
  );
}

/** Simple toast-state hook: [{msg,type}, show(msg,type)] — auto-dismisses after 2.8s. */
export function useToast() {
  const [toast, setToast] = useState({});
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({}), 2800);
  };
  return [toast, show];
}
