/** Chip showing a special requestor's initials + name, with a remove button. */
export default function RequestorChip({ name, onRemove }) {
  const initials = (name || '')
    .split(' ')
    .map((w) => w && w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex items-center gap-2 bg-ch-secondary rounded-full pl-1 pr-3 py-1">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-main text-white text-[11px] font-bold shrink-0">
        {initials}
      </span>
      <span className="font-body text-body text-ch-main">{name}</span>
      <button onClick={onRemove} className="text-ch-main opacity-50 hover:opacity-100 text-xs ml-1">
        ✕
      </button>
    </div>
  );
}
