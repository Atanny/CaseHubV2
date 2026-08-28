import { cls } from '../utils/cls';

/** Centered modal with a backdrop. Presentational only — open/close state lives in the caller. */
export default function Modal({ open, onClose, children, className = '' }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ch-main/40 p-5"
      onClick={onClose}
    >
      <div
        className={cls('bg-white rounded-ch-lg p-8 max-w-sm w-full text-center shadow-ch', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
