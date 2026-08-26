import { useState } from 'react';
import Icon from './Icon';
import { copyToClipboard } from '../utils/clipboard';
import { cls } from '../utils/cls';

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const empty = !value || !String(value).trim();
  return (
    <button
      onClick={() => {
        if (empty) return;
        copyToClipboard(String(value)).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      className={cls('w-full text-left bg-white rounded-ch p-3', !empty && 'cursor-pointer hover:bg-ch-secondary/60')}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">{label}</p>
        {!empty && <Icon name={copied ? 'check' : 'edit'} size={12} color={copied ? '#1a7d3a' : '#40513B'} />}
      </div>
      <p className={cls('font-body text-body mt-0.5 truncate', empty ? 'text-ch-main opacity-40' : 'text-ch-main')}>{empty ? '—' : value}</p>
    </button>
  );
}

function buildEntriesText(entries) {
  const filled = (entries || []).filter((e) => e.notes || e.number || e.clarification);
  if (filled.length === 0) return '';
  let out = 'Post-Live Amends:\n';
  filled.forEach((e) => {
    out += `\nSite Comment #${e.number || '—'}:\n`;
    if (e.notes) out += `Note: ${e.notes}\n`;
    if (e.clarification) out += `\nClarification: ${e.clarification}\n`;
  });
  return out;
}

/** Left "Information Summary" panel — click any card to copy that value. Matches Figma's 4-section layout. */
export default function InformationSummaryPanel({ form, entryLabel, onImageClick }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const entriesText = buildEntriesText(form.entries);
  const shots = [...(form.entries || []).map((e) => e.screenshot).filter(Boolean), ...(form.images || [])];

  return (
    <div className="flex flex-col gap-2.5 bg-ch-secondary rounded-ch shadow-ch p-5 w-full max-w-[280px] shrink-0">
      <p className="font-heading font-bold text-h6 text-ch-main">Information Summary</p>
      <p className="font-body text-body text-ch-main opacity-60 -mt-2">Click the card to copy the information</p>

      <p className="text-[10px] font-label font-bold uppercase text-ch-main mt-1">1. Case Information</p>
      <CopyField label="Account Number" value={form.accountNum} />
      <CopyField label="Case Number" value={form.caseNum} />
      <CopyField label="Amend Type" value={form.amendType} />

      <p className="text-[10px] font-label font-bold uppercase text-ch-main mt-1">2. Customer Information</p>
      <CopyField label="Customer Name" value={form.customerName} />
      <CopyField label="Email Address" value={form.customerEmail} />
      <CopyField label="Business Name" value={form.businessName} />

      <p className="text-[10px] font-label font-bold uppercase text-ch-main mt-1">3. {entryLabel}</p>
      <button
        onClick={() => {
          if (!entriesText) return;
          copyToClipboard(entriesText).then(() => {
            setCopiedAll(true);
            setTimeout(() => setCopiedAll(false), 1400);
          });
        }}
        className={cls('w-full text-left bg-white rounded-ch p-3', entriesText && 'cursor-pointer hover:bg-ch-secondary/60')}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">{entryLabel}</p>
          {entriesText && <Icon name={copiedAll ? 'check' : 'edit'} size={12} color={copiedAll ? '#1a7d3a' : '#40513B'} />}
        </div>
        <p className={cls('font-body text-body mt-0.5 whitespace-pre-wrap', !entriesText && 'text-ch-main opacity-40')}>{entriesText || '—'}</p>
      </button>

      <p className="text-[10px] font-label font-bold uppercase text-ch-main mt-1">4. Screenshots</p>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 4 }).map((_, i) =>
          shots[i] ? (
            <button key={i} onClick={() => onImageClick(shots[i].url)} className="aspect-square rounded-ch overflow-hidden bg-white">
              <img src={shots[i].url} alt="" className="w-full h-full object-cover" />
            </button>
          ) : (
            <div key={i} className="aspect-square rounded-ch bg-white" />
          )
        )}
      </div>
      <button
        onClick={() => shots.forEach((s) => window.open(s.url, '_blank'))}
        disabled={shots.length === 0}
        className="w-full h-9 rounded-ch bg-white text-ch-main font-body text-body disabled:opacity-40"
      >
        Download All Images
      </button>
    </div>
  );
}
