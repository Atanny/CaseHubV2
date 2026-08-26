import { cls } from '../utils/cls';

/** Inline banner for auth form errors/success messages. */
export default function AuthAlert({ tone = 'error', children }) {
  const toneClasses =
    tone === 'error'
      ? 'bg-ch-red/10 border-ch-red text-ch-red'
      : 'bg-ch-main/10 border-ch-main text-ch-main';
  return (
    <div className={cls('w-full rounded-ch border px-3.5 py-2.5 text-body font-body text-center', toneClasses)}>
      {children}
    </div>
  );
}
