import { useEffect, useRef, useState } from 'react';
import Icon from '../icons/Icon';

/** Customer-name input with a suggestion dropdown and a highlight when the name matches a special requestor. */
export default function RequestorAutocomplete({ value, onChange, requestors, isSpecial }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef();

  useEffect(() => {
    function onClickAway(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const suggestions = (requestors || []).filter((r) => value && r.toLowerCase().includes(value.toLowerCase()) && r.toLowerCase() !== value.toLowerCase()).slice(0, 6);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          className="w-full h-9 px-3 bg-white rounded-ch outline-none font-body text-body text-ch-main"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="e.g. John Smith"
        />
        {isSpecial && (
          <span title="Special requestor" className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <Icon name="check-square" size={14} color="#40513B" />
          </span>
        )}
      </div>
      {isSpecial && <p className="text-[11px] font-body text-[#4760FF] mt-1">⚠ Special requestor — handle with extra care.</p>}
      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-ch shadow-ch overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 font-body text-body text-ch-main hover:bg-ch-secondary"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
