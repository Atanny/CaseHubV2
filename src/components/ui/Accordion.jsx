import { cls } from '../../utils/cls';

/** Collapsible card: header (always visible, click to toggle) + body (shown when open). */
export default function Accordion({ header, isOpen, onToggle, actions, children }) {
  return (
    <div className="w-full bg-white rounded-ch shadow-ch overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 cursor-pointer" onClick={onToggle}>
        <div className="min-w-0 flex-1">{header}</div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      {isOpen && <div className={cls('px-4 pb-4 border-t border-ch-secondary pt-4')}>{children}</div>}
    </div>
  );
}
