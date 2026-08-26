import Icon from './Icon';
import Button from './Button';

/** A single generated filename with a copy button. */
export function CopyCell({ value, onCopy, copied }) {
  if (!value) return null;
  return (
    <button
      onClick={() => onCopy(value)}
      className="flex items-center justify-between gap-2 w-full text-left px-3.5 py-2.5 bg-ch-secondary rounded-ch font-body text-body text-ch-main hover:bg-ch-border/40 transition-colors"
    >
      <span className="truncate">{value}</span>
      <span className="shrink-0 opacity-60">{copied ? <Icon name="check" size={14} color="#40513B" /> : <Icon name="edit" size={13} color="#40513B" />}</span>
    </button>
  );
}

/** A dynamic list of text inputs (add/remove rows) — used for Pages, Badges, Team, Menu, PDF. */
export function DynList({ label, items, onSet, onAdd, onRemove }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">{label}</p>
      {items.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="flex-1 h-9 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main"
            value={v}
            onChange={(e) => onSet(i, e.target.value)}
          />
          <button onClick={() => onRemove(i)} className="shrink-0 opacity-60 hover:opacity-100">
            <Icon name="close" size={12} color="#C54446" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={onAdd} className="self-start mt-1">
        + Add
      </Button>
    </div>
  );
}

/** Section wrapper for a tab's generated-filenames card, with a Copy All action. */
export function FngSection({ title, values, onCopyAll, children }) {
  return (
    <div className="bg-white rounded-ch shadow-ch p-5 w-full">
      <div className="flex items-center justify-between mb-3">
        <p className="font-heading font-bold text-h6 text-ch-main">{title}</p>
        {values && values.filter(Boolean).length > 0 && (
          <Button variant="outline" size="sm" onClick={() => onCopyAll(values)}>
            Copy All
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}
