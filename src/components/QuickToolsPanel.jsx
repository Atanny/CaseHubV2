import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { copyToClipboard } from '../utils/clipboard';
import { cls } from '../utils/cls';
import { ROUTES } from '../constants/routes';
import { BREAK_OPTIONS } from '../constants/navigation';

function QuickCopyChip({ label, value }) {
  const [copied, setCopied] = useState(false);
  const empty = !value;
  return (
    <button
      onClick={() => {
        if (empty) return;
        copyToClipboard(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      className={cls('w-full flex items-center justify-between px-3.5 py-2.5 rounded-ch bg-white text-left', !empty && 'cursor-pointer')}
    >
      <span className={cls('font-body text-body uppercase', empty ? 'text-ch-main opacity-40' : 'text-ch-main')}>{label}</span>
      <Icon name={copied ? 'check' : 'edit'} size={12} color={copied ? '#1a7d3a' : '#40513B80'} />
    </button>
  );
}

/** Right sidebar of the wizard: quick-copy formats, File Name Generator link, break buttons, Suspend Case. */
export default function QuickToolsPanel({ quickFormats = {}, activeBreak, onStartBreak, onSuspend }) {
  return (
    <div className="flex flex-col gap-2.5 w-full max-w-[220px] shrink-0">
      <div className="bg-white rounded-ch shadow-ch p-4 flex flex-col gap-2">
        <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Quick Format &amp; Lyrics</p>
        <QuickCopyChip label="SR Format" value={quickFormats.srFormat} />
        <QuickCopyChip label="AI Images Lyrics" value={quickFormats.aiImagesLyrics} />
        <QuickCopyChip label="No SC Lyrics" value={quickFormats.noScLyrics} />
        <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mt-1">Quick Tools</p>
        <Link href={ROUTES.filenames} target="_blank" className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-ch bg-white border border-ch-border text-ch-main font-body text-body">
          File Name Generator
          <Icon name="draft" size={14} color="#40513B" />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {BREAK_OPTIONS.map((opt) => (
          <button
            key={opt.mins}
            onClick={() => onStartBreak?.(opt)}
            disabled={activeBreak != null && activeBreak !== opt.mins}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-ch bg-white shadow-ch font-body text-body text-ch-main disabled:opacity-40"
          >
            <Icon name={opt.icon} size={16} color="#40513B" />
            {opt.label}
          </button>
        ))}
      </div>

      <button onClick={onSuspend} className="w-full flex items-center justify-center gap-2 h-11 rounded-ch bg-amber-600 text-white font-body font-bold text-body">
        Suspend Case
        <Icon name="archive" size={16} color="#fff" />
      </button>
    </div>
  );
}
