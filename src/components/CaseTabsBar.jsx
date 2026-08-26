import { cls } from '../utils/cls';

/** Tab strip for concurrently open cases — "MAJOR | SITE COMMENT - NAME" style labels, close X, + to add. */
export default function CaseTabsBar({ tabs, activeId, onSelect, onClose, onAdd }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((t) => {
        const active = t.id === activeId;
        const complexity = (t.form?._caseComplexity || 'minor').toUpperCase();
        const type = t.mode === 'inbound' ? 'INBOUND EMAIL' : 'SITE COMMENT';
        const name = t.form?.businessName || 'Untitled';
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={cls(
              'flex items-center gap-2 px-3.5 py-2 rounded-full text-badge font-label font-bold uppercase whitespace-nowrap max-w-[220px]',
              active ? 'bg-ch-main text-white' : 'bg-ch-secondary text-ch-main'
            )}
          >
            <span className="truncate">
              {complexity} | {type} - {name}
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onClose(t.id);
              }}
              className="opacity-70 hover:opacity-100"
            >
              ✕
            </span>
          </button>
        );
      })}
      <button onClick={onAdd} className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-secondary text-ch-main font-bold">
        +
      </button>
    </div>
  );
}
