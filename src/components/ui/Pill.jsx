import { cls } from '../../utils/cls';

/** Radio-style pill (dot + label). Matches the Figma filter/type-selector pills. */
export default function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        'flex items-center gap-2 px-3.5 py-2 rounded-full border font-body text-body whitespace-nowrap transition-colors',
        active ? 'bg-ch-main border-ch-main text-white' : 'bg-white border-ch-border text-ch-main'
      )}
    >
      <span
        className={cls(
          'w-2 h-2 rounded-full shrink-0',
          active ? 'bg-white' : 'bg-ch-border'
        )}
      />
      {children}
    </button>
  );
}
