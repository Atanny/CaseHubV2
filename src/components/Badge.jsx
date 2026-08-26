import { cls } from '../utils/cls';

/** Small count badge (e.g. unread announcements, open cases). */
export default function Badge({ children, className = '' }) {
  return (
    <span
      className={cls(
        'inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full',
        'bg-ch-red text-white text-[9px] font-label font-bold leading-none',
        className
      )}
    >
      {children}
    </span>
  );
}
