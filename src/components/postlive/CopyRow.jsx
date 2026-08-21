import { useState } from 'react';
import { copyToClipboard } from '../../utils/clipboard';
import { cls } from '../../utils/cls';

/** A labeled value that copies to clipboard on click — used in the case summary sidebar. */
export function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const empty = !value || !value.trim();

  return (
    <div
      onClick={() => {
        if (empty) return;
        copyToClipboard(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={cls('rounded-ch p-3 bg-white', !empty && 'cursor-pointer hover:bg-ch-secondary/60 transition-colors')}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">{label}</p>
        {!empty && <span className={cls('text-[10px] font-bold', copied ? 'text-green-600' : 'text-ch-main opacity-40')}>{copied ? '✓ Copied' : 'Copy'}</span>}
      </div>
      <p className={cls('font-body text-body mt-0.5', empty ? 'text-ch-main opacity-40 italic' : 'text-ch-main')}>{empty ? '—' : value}</p>
    </div>
  );
}

/** Small inline "Copy" affordance next to a case number. */
export function CopyCaseBtn({ caseNum }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        copyToClipboard(caseNum).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      className={cls('text-[10px] font-bold', copied ? 'text-green-600' : 'text-ch-main opacity-50')}
    >
      {copied ? '✓' : 'Copy'}
    </button>
  );
}
