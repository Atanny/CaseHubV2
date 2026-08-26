import { cls } from '../utils/cls';

/** Thin rounded rule used between page sections and inside cards. */
export default function Divider({ tone = 'secondary', className = '' }) {
  const bg = tone === 'secondary' ? 'bg-ch-secondary' : 'bg-white';
  return <div className={cls('h-[3px] w-full rounded-full', bg, className)} />;
}
