import { useState } from 'react';
import Icon from '../icons/Icon';
import Button from '../ui/Button';
import { checkGrammar } from '../../services/grammarService';

/** One entry (Site Comment or Assumption): number, note, clarification, with per-field grammar check. */
export default function EntryCard({ entry, label, index, onChange, onDelete, showNumber, showDelete }) {
  const [checking, setChecking] = useState(null);
  const [saved, setSaved] = useState(!!entry._saved);

  async function runGrammar(field) {
    if (!entry[field]?.trim()) return;
    setChecking(field);
    const { result, changes } = await checkGrammar(entry[field]);
    onChange({ ...entry, [field]: result });
    setChecking(changes > 0 ? `fixed-${field}` : null);
    setTimeout(() => setChecking(null), 2000);
  }

  return (
    <div className="bg-ch-secondary rounded-ch p-4">
      <div className="flex items-center gap-2 mb-3">
        <p className="font-body text-body font-bold text-ch-main flex-1">
          {showNumber ? `${label} #${entry.number || index + 1}` : label}
        </p>
        {saved ? (
          <Button
            variant="outline"
            size="sm"
            icon={<Icon name="edit" size={12} color="#40513B" />}
            iconPosition="left"
            onClick={() => {
              setSaved(false);
              onChange({ ...entry, _saved: false });
            }}
          >
            Edit
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon={<Icon name="check" size={12} color="#fff" />}
            iconPosition="left"
            onClick={() => {
              setSaved(true);
              onChange({ ...entry, _saved: true });
            }}
          >
            Save
          </Button>
        )}
        {showDelete && (
          <button onClick={onDelete} className="shrink-0">
            <Icon name="trash" size={14} color="#C54446" />
          </button>
        )}
      </div>

      {saved ? (
        <div className="bg-white rounded-ch p-3">
          {entry.number && <p className="font-body text-body text-ch-main opacity-50 mb-1">#{entry.number}</p>}
          {entry.note ? <p className="font-body text-body text-ch-main whitespace-pre-wrap">{entry.note}</p> : <p className="font-body text-body text-ch-main opacity-40 italic">No note</p>}
          {entry.clarification && <p className="font-body text-body text-ch-main opacity-60 mt-2 pt-2 border-t border-ch-secondary whitespace-pre-wrap">{entry.clarification}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {showNumber && (
            <div>
              <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Number</p>
              <input
                className="w-full h-9 px-3 bg-white rounded-ch outline-none font-body text-body text-ch-main"
                placeholder="e.g. 25"
                value={entry.number}
                onChange={(e) => onChange({ ...entry, number: e.target.value })}
              />
            </div>
          )}
          <div>
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Note (optional)</p>
            <textarea
              className="w-full min-h-[70px] p-3 bg-white rounded-ch outline-none resize-y font-body text-body text-ch-main"
              placeholder="Describe what was done or assumed..."
              value={entry.note}
              onChange={(e) => onChange({ ...entry, note: e.target.value })}
            />
            <button
              disabled={!entry.note?.trim() || checking === 'note'}
              onClick={() => runGrammar('note')}
              className="text-[11px] font-body text-ch-main opacity-70 disabled:opacity-30 underline mt-1"
            >
              {checking === 'note' ? 'Checking…' : checking === 'fixed-note' ? '✓ Fixed!' : 'Grammar Check'}
            </button>
          </div>
          <div>
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Clarification (optional)</p>
            <textarea
              className="w-full min-h-[70px] p-3 bg-white rounded-ch outline-none resize-y font-body text-body text-ch-main"
              placeholder="Confirmation or extra details..."
              value={entry.clarification}
              onChange={(e) => onChange({ ...entry, clarification: e.target.value })}
            />
            <button
              disabled={!entry.clarification?.trim() || checking === 'clarification'}
              onClick={() => runGrammar('clarification')}
              className="text-[11px] font-body text-ch-main opacity-70 disabled:opacity-30 underline mt-1"
            >
              {checking === 'clarification' ? 'Checking…' : checking === 'fixed-clarification' ? '✓ Fixed!' : 'Grammar Check'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
