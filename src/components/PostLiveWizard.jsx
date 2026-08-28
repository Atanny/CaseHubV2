import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import Button from './Button';
import Modal from './Modal';
import { cls } from '../utils/cls';
import { copyToClipboard } from '../utils/clipboard';
import { fmtElapsed } from '../utils/format';
import { checkGrammar } from '../services/grammarService';
import { ROUTES } from '../constants/routes';
import { BREAK_OPTIONS } from '../constants/navigation';

/* ────────────────────────────────────────────────────────────────────────
   Data shape
   ──────────────────────────────────────────────────────────────────────── */

const CHECKLIST_GROUPS = [
  ['First Steps', [
    ['closeSiteComment', 'Close Your Site Comment'],
    ['uploadBackup', 'Upload Your Before/After Backup'],
    ['uploadCaseComment', 'Upload Your Case Comment'],
  ]],
  ['Second Steps', [
    ['completeClarify', 'Complete/Clarify Your Case'],
    ['emailRequestor', 'Email Your Requestor'],
    ['tagStatusTracker', 'Tag Your Status Tracker'],
  ]],
  ['Last Steps', [
    ['fillCombinedTracker', 'Fill Combined Tracker Form'],
    ['fillQaChecklist', 'Fill QA Checklist Form'],
  ]],
];
const CHECKLIST_KEYS = CHECKLIST_GROUPS.flatMap(([, items]) => items.map(([k]) => k));
function emptyChecklist() {
  return Object.fromEntries(CHECKLIST_KEYS.map((k) => [k, false]));
}

export const emptySiteCommentEntry = () => ({
  id: String(Date.now() + Math.random()),
  number: '',
  notes: '',
  clarification: '',
  screenshot: null, // { url, name, path }
  devices: { desktop: false, tablet: false, mobile: false },
  _saved: false,
});

export const emptyBase = () => ({
  // Step 1 — Case Information
  caseNum: '',
  accountNum: '',
  amendType: '',
  customerName: '', // "Requester Name" in the wizard
  customerEmail: '', // "Requester Email" in the wizard
  businessName: '',
  entityDesignation: '', // optional, e.g. "Inc"
  _caseComplexity: 'minor', // minor | major | complex
  inProgressSalesforce: false,
  addedYourName: false,

  // Step 3 — Notepad / Assumption (one entry per Site Comment / Assumption)
  entries: [emptySiteCommentEntry()],

  // Step 4 — Before/After Backup
  images: [], // [{url,name,path}] — before/after backup screenshots

  // Step 5 — Final Checklist
  checklist: emptyChecklist(),
  trackerChecklistLink: '',

  // Inbound-mode only
  inboundNum: '',
  emailAddress: '',
  emailType: 'clarification',

  // Derived at save time from entries[].devices, for Case History/Dashboard
  devices: { desktop: false, tablet: false, mobile: false },
});

/* ────────────────────────────────────────────────────────────────────────
   Small shared pieces
   ──────────────────────────────────────────────────────────────────────── */

function NameCopyRow({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 bg-white border border-ch-border rounded-ch px-5 py-3.5">
      <p className="font-body text-body text-ch-main truncate">{value}</p>
      <button
        onClick={() => {
          copyToClipboard(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          });
        }}
        className="shrink-0 px-4 py-1.5 rounded-ch bg-ch-main text-white text-badge font-label font-bold uppercase"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload zone for screenshots — click, drag-drop, or paste. Uploads straight
 * to storage via /api/images/upload as soon as a file is added (the legacy
 * app instead staged files in IndexedDB until the case was saved — that
 * staging layer is dropped here for a simpler, more predictable flow;
 * images are safely in storage the moment they're added, not just on save).
 */
function ImageUploadZone({ baseName, multiple, images, onImages, isActive = false }) {
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const addFiles = useCallback(
    async (files) => {
      setUploading(true);
      try {
        const list = Array.from(files);
        const uploaded = [];
        for (let i = 0; i < list.length; i++) {
          const f = list[i];
          const name = multiple ? `${baseName}-${(images?.length || 0) + i + 1}` : baseName;
          const base64 = await fileToBase64(f);
          const res = await fetch('/api/images/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64, fileName: name, mimeType: f.type || 'image/png' }),
          });
          const data = await res.json();
          if (res.ok) uploaded.push(data);
        }
        const next = multiple ? [...(images || []), ...uploaded] : uploaded.slice(0, 1);
        onImages(next);
      } finally {
        setUploading(false);
      }
    },
    [baseName, multiple, images, onImages]
  );

  useEffect(() => {
    if (!isActive) return;
    function handlePaste(e) {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const items = Array.from(e.clipboardData?.items || []).filter((i) => i.kind === 'file');
      if (items.length) {
        e.preventDefault();
        addFiles(items.map((i) => i.getAsFile()));
      }
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addFiles, isActive]);

  function remove(id) {
    onImages((images || []).filter((i) => i.id !== id));
  }
  function download(img) {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = img.name || 'screenshot';
    a.target = '_blank';
    a.click();
  }

  return (
    <div>
      <div
        className={cls(
          'flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-ch-lg p-6 text-center cursor-pointer transition-colors',
          drag ? 'border-ch-main bg-ch-secondary' : 'border-ch-border bg-ch-secondary/40'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => e.target.files.length && addFiles(e.target.files)} />
        <Icon name={uploading ? 'loading' : 'edit'} size={26} color="#40513B" />
        <p className="font-body text-body text-ch-main">
          {uploading ? (
            'Uploading…'
          ) : (
            <>
              Click, drag-drop, or <kbd className="bg-white px-1.5 py-0.5 rounded text-[10px]">Ctrl+V</kbd> to paste
            </>
          )}
        </p>
        <p className="font-body text-body text-ch-main opacity-50 text-[11px]">
          Saved as: <span className="text-ch-main font-bold">{baseName}</span>
        </p>
      </div>

      {(images || []).length > 0 && (
        <div className="flex gap-2 flex-wrap mt-3">
          {images.map((img) => (
            <div key={img.id} className="flex flex-col items-center gap-1">
              <div className="relative w-20 h-20 rounded-ch overflow-hidden bg-white">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => remove(img.id)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
                  ✕
                </button>
              </div>
              <button onClick={() => download(img)} className="text-[10px] text-ch-main opacity-60 underline">
                Save
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Customer-name input with a suggestion dropdown and a highlight when the name matches a special requestor. */
function RequestorAutocomplete({ value, onChange, requestors, isSpecial }) {
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

/* ────────────────────────────────────────────────────────────────────────
   Tabs + step bar
   ──────────────────────────────────────────────────────────────────────── */

const WIZARD_STEPS = [
  ['caseInfo', 'Case Info'],
  ['beforeBackup', 'Before SS/Additional Backup'],
  ['notepad', 'Notepad/Assumption'],
  ['afterBackup', 'After SS/B&A Backup'],
  ['finalChecklist', 'Final Checklist'],
];

/** Tab strip for concurrently open cases — "MAJOR | SITE COMMENT - NAME" style labels, close X, + to add. */
function CaseTabsBar({ tabs, activeId, onSelect, onClose, onAdd }) {
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

/** 5-tab step progress bar. A step is "done" (green check) once its index is behind the active one. */
function WizardStepBar({ activeIndex, onStepClick }) {
  return (
    <div className="flex items-stretch w-full bg-white rounded-ch shadow-ch overflow-hidden">
      {WIZARD_STEPS.map(([key, label], i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <button
            key={key}
            onClick={() => onStepClick?.(i)}
            disabled={i > activeIndex}
            className={cls(
              'flex-1 flex flex-col items-center gap-1.5 py-3 border-r border-ch-secondary last:border-r-0 transition-colors',
              done && 'bg-green-50',
              active && 'bg-white border border-ch-main -m-px z-10'
            )}
          >
            {done ? <Icon name="check-square" size={18} color="#1a7d3a" /> : <Icon name="radio-unchecked" size={18} color={active ? '#40513B' : '#40513B80'} />}
            <span className={cls('text-badge font-label font-bold uppercase', active ? 'text-ch-main' : 'text-ch-main opacity-50')}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Left/right sidebars
   ──────────────────────────────────────────────────────────────────────── */

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
function InformationSummaryPanel({ form, entryLabel, onImageClick }) {
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
function QuickToolsPanel({ quickFormats = {}, activeBreak, onStartBreak, onSuspend }) {
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

/* ────────────────────────────────────────────────────────────────────────
   Steps 1-5
   ──────────────────────────────────────────────────────────────────────── */

const fieldInputCls = 'w-full h-11 px-4 bg-white border border-ch-border rounded-ch outline-none font-body text-body text-ch-main';
const COMPLEXITIES = [
  ['minor', 'Minor'],
  ['major', 'Major'],
  ['complex', 'Complex'],
];

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function Step1CaseInfo({ form, setForm, requestors, isSpecialRequestor, onNext }) {
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="bg-white rounded-ch shadow-ch p-6 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-secondary text-ch-main text-[12px] font-bold shrink-0">1</span>
        <div>
          <p className="font-heading font-bold text-h6 text-ch-main">Case Information</p>
          <p className="font-body text-body text-ch-main opacity-60">
            Input The Case Information - <span className="text-ch-red">All Are Required Unless Labeled Optional</span>
          </p>
        </div>
      </div>

      <Field label="Case Number">
        <input className={fieldInputCls} value={form.caseNum} onChange={(e) => set({ caseNum: e.target.value })} />
      </Field>
      <Field label="Account Number">
        <input className={fieldInputCls} value={form.accountNum} onChange={(e) => set({ accountNum: e.target.value })} />
      </Field>
      <Field label="Amend Type">
        <input className={fieldInputCls} value={form.amendType} onChange={(e) => set({ amendType: e.target.value })} />
      </Field>
      <Field label="Requester Name">
        <RequestorAutocomplete value={form.customerName} onChange={(v) => set({ customerName: v })} requestors={requestors} isSpecial={isSpecialRequestor} />
      </Field>
      <Field label="Requester Email">
        <input type="email" className={fieldInputCls} value={form.customerEmail} onChange={(e) => set({ customerEmail: e.target.value })} />
      </Field>
      <Field label="Business Name">
        <input className={fieldInputCls} value={form.businessName} onChange={(e) => set({ businessName: e.target.value })} />
      </Field>
      <Field label="Entity Designations (Optional Field)">
        <input className={fieldInputCls} placeholder="Inc" value={form.entityDesignation} onChange={(e) => set({ entityDesignation: e.target.value })} />
      </Field>

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Complexity</p>
        <div className="flex gap-2.5">
          {COMPLEXITIES.map(([v, l]) => (
            <button
              key={v}
              onClick={() => set({ _caseComplexity: v })}
              className={`flex-1 h-11 rounded-ch font-body text-body border ${form._caseComplexity === v ? 'border-ch-main bg-ch-secondary' : 'border-ch-border bg-white'} text-ch-main`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Checklist</p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2.5 h-11 px-4 bg-white border border-ch-border rounded-ch font-body text-body text-ch-main">
            <input type="checkbox" checked={form.inProgressSalesforce} onChange={(e) => set({ inProgressSalesforce: e.target.checked })} />
            In Progress Salesforce
          </label>
          <label className="flex items-center gap-2.5 h-11 px-4 bg-white border border-ch-border rounded-ch font-body text-body text-ch-main">
            <input type="checkbox" checked={form.addedYourName} onChange={(e) => set({ addedYourName: e.target.checked })} />
            Added Your Name?
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onNext} className="flex items-center justify-center w-11 h-11 rounded-ch bg-ch-main text-white">
          <Icon name="login" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function Step2BeforeBackup({ beforeScreenshotName, onBack, onNext }) {
  return (
    <div className="bg-white rounded-ch shadow-ch p-6 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-secondary text-ch-main text-[12px] font-bold shrink-0">2</span>
        <div>
          <p className="font-heading font-bold text-h6 text-ch-main">Before Screenshot Name</p>
          <p className="font-body text-body text-ch-main opacity-60">Save Your Before Screenshot Backup Of The Site</p>
        </div>
      </div>

      <NameCopyRow value={beforeScreenshotName} />

      <div className="flex justify-end gap-2.5">
        <button onClick={onBack} className="flex items-center justify-center w-11 h-11 rounded-ch bg-white border border-ch-border text-ch-main">
          <Icon name="back" size={18} color="#40513B" />
        </button>
        <button onClick={onNext} className="flex items-center justify-center w-11 h-11 rounded-ch bg-ch-main text-white">
          <Icon name="login" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

const entryInputCls = 'w-full h-11 px-4 bg-white border border-ch-border rounded-ch outline-none font-body text-body text-ch-main';
const entryTextareaCls = 'w-full min-h-[90px] p-4 bg-white border border-ch-border rounded-ch outline-none resize-y font-body text-body text-ch-main';

function DeviceChip({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 flex-1 h-11 px-4 bg-white border border-ch-border rounded-ch font-body text-body text-ch-main">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function EntryForm({ entry, index, screenshotBaseName, entryLabel, onChange, onSave }) {
  const [checking, setChecking] = useState(null);

  async function runGrammar(field) {
    if (!entry[field]?.trim()) return;
    setChecking(field);
    const { result } = await checkGrammar(entry[field]);
    onChange({ ...entry, [field]: result });
    setChecking(null);
  }

  return (
    <div className="bg-ch-secondary rounded-ch p-4 flex flex-col gap-3">
      <p className="text-[10px] font-label font-bold uppercase text-ch-main">{entryLabel} #</p>
      <input className={entryInputCls} placeholder="E.G. 1, 2" value={entry.number} onChange={(e) => onChange({ ...entry, number: e.target.value })} />

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Notes (Optional Field)</p>
        <textarea className={entryTextareaCls} placeholder="Insert Notes Here" value={entry.notes} onChange={(e) => onChange({ ...entry, notes: e.target.value })} />
        <button disabled={!entry.notes?.trim() || checking === 'notes'} onClick={() => runGrammar('notes')} className="text-[11px] font-body text-ch-main opacity-70 disabled:opacity-30 underline mt-1">
          {checking === 'notes' ? 'Checking…' : 'Grammar Check'}
        </button>
      </div>

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Clarification (Optional Field)</p>
        <textarea className={entryTextareaCls} placeholder="Insert Notes Here" value={entry.clarification} onChange={(e) => onChange({ ...entry, clarification: e.target.value })} />
        <button
          disabled={!entry.clarification?.trim() || checking === 'clarification'}
          onClick={() => runGrammar('clarification')}
          className="text-[11px] font-body text-ch-main opacity-70 disabled:opacity-30 underline mt-1"
        >
          {checking === 'clarification' ? 'Checking…' : 'Grammar Check'}
        </button>
      </div>

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main">{entryLabel} Screenshot (Optional Field)</p>
        <p className="font-body text-body text-ch-main opacity-50 mb-1.5">Image Auto Rename Once Downloaded</p>
        <ImageUploadZone
          baseName={`${screenshotBaseName}-${entry.number || index + 1}`}
          multiple={false}
          images={entry.screenshot ? [entry.screenshot] : []}
          onImages={(imgs) => onChange({ ...entry, screenshot: imgs[0] || null })}
        />
      </div>

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Check Devices</p>
        <div className="flex gap-2.5">
          <DeviceChip label="Desktop" checked={entry.devices.desktop} onChange={(e) => onChange({ ...entry, devices: { ...entry.devices, desktop: e.target.checked } })} />
          <DeviceChip label="Tablet" checked={entry.devices.tablet} onChange={(e) => onChange({ ...entry, devices: { ...entry.devices, tablet: e.target.checked } })} />
          <DeviceChip label="Mobile" checked={entry.devices.mobile} onChange={(e) => onChange({ ...entry, devices: { ...entry.devices, mobile: e.target.checked } })} />
        </div>
      </div>

      <Button variant="primary" size="sm" className="self-end" onClick={onSave}>
        Save
      </Button>
    </div>
  );
}

function Step3Notepad({ form, setForm, screenshotBaseName, entryLabel, onBack, onNext }) {
  function updateEntry(i, next) {
    setForm((f) => {
      const arr = [...f.entries];
      arr[i] = next;
      return { ...f, entries: arr };
    });
  }
  function addEntry() {
    setForm((f) => ({ ...f, entries: [...f.entries, emptySiteCommentEntry()] }));
  }

  return (
    <div className="bg-white rounded-ch shadow-ch p-6 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-secondary text-ch-main text-[12px] font-bold shrink-0">3</span>
        <div>
          <p className="font-heading font-bold text-h6 text-ch-main">Case Comments Notepad</p>
          <p className="font-body text-body text-ch-main opacity-60">Insert Your Assumption And Documentation</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {form.entries.map((entry, i) => (
          <EntryForm key={entry.id} entry={entry} index={i} screenshotBaseName={screenshotBaseName} entryLabel={entryLabel} onChange={(next) => updateEntry(i, next)} onSave={() => updateEntry(i, { ...entry, _saved: true })} />
        ))}
      </div>

      <button onClick={addEntry} className="self-center font-body text-body text-ch-main underline flex items-center gap-1.5">
        <Icon name="plus" size={12} color="#40513B" />
        Add New {entryLabel}
      </button>

      <div className="flex justify-end gap-2.5">
        <button onClick={onBack} className="flex items-center justify-center w-11 h-11 rounded-ch bg-white border border-ch-border text-ch-main">
          <Icon name="back" size={18} color="#40513B" />
        </button>
        <button onClick={onNext} className="flex items-center justify-center w-11 h-11 rounded-ch bg-ch-main text-white">
          <Icon name="login" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function Step4AfterBackup({ afterScreenshotName, backupScreenshotName, images, onImages, onBack, onNext }) {
  return (
    <div className="bg-white rounded-ch shadow-ch p-6 flex flex-col gap-5 w-full">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-secondary text-ch-main text-[12px] font-bold shrink-0">4</span>
        <div>
          <p className="font-heading font-bold text-h6 text-ch-main">After Screenshot Name</p>
          <p className="font-body text-body text-ch-main opacity-60">Save Your After Screenshot Backup Of The Site</p>
        </div>
      </div>
      <NameCopyRow value={afterScreenshotName} />

      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-secondary text-ch-main text-[12px] font-bold shrink-0">5</span>
        <div>
          <p className="font-heading font-bold text-h6 text-ch-main">Before/After Backup Screenshot</p>
          <p className="font-body text-body text-ch-main opacity-60">Upload Or Paste Your Before And After Screenshot - Image Auto Rename Once Downloaded</p>
        </div>
      </div>
      <NameCopyRow value={backupScreenshotName} />
      <ImageUploadZone baseName={backupScreenshotName} multiple images={images} onImages={onImages} isActive />

      <div className="flex justify-end gap-2.5">
        <button onClick={onBack} className="flex items-center justify-center w-11 h-11 rounded-ch bg-white border border-ch-border text-ch-main">
          <Icon name="back" size={18} color="#40513B" />
        </button>
        <button onClick={onNext} className="flex items-center justify-center w-11 h-11 rounded-ch bg-ch-main text-white">
          <Icon name="login" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function Step5FinalChecklist({ form, setForm, onBack, onSubmit, submitting }) {
  const allChecked = CHECKLIST_KEYS.every((k) => form.checklist[k]);

  function toggle(key) {
    setForm((f) => ({ ...f, checklist: { ...f.checklist, [key]: !f.checklist[key] } }));
  }

  return (
    <div className="bg-white rounded-ch shadow-ch p-6 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-secondary text-ch-main text-[12px] font-bold shrink-0">6</span>
        <div>
          <p className="font-heading font-bold text-h6 text-ch-main">Final Checklist</p>
          <p className="font-body text-body text-ch-main opacity-60">
            Check All Of The Changes You&apos;ve Made - <span className="text-ch-red">All Checkbox Is Required</span>
          </p>
        </div>
      </div>

      {CHECKLIST_GROUPS.map(([groupLabel, items]) => (
        <div key={groupLabel} className="flex flex-col gap-2">
          <p className="text-[10px] font-label font-bold uppercase text-ch-main">{groupLabel} (All Items Must Be Checked)*</p>
          {items.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2.5 h-11 px-4 bg-white border border-ch-border rounded-ch font-body text-body text-ch-main">
              <input type="checkbox" checked={!!form.checklist[key]} onChange={() => toggle(key)} />
              {label}
            </label>
          ))}
        </div>
      ))}

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Tracker Link</p>
        <input
          className={fieldInputCls}
          placeholder="Insert Your Tracker Form"
          value={form.trackerChecklistLink}
          onChange={(e) => setForm((f) => ({ ...f, trackerChecklistLink: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2.5">
        <button onClick={onBack} className="flex items-center justify-center w-11 h-11 rounded-ch bg-white border border-ch-border text-ch-main">
          <Icon name="back" size={18} color="#40513B" />
        </button>
        <button
          onClick={onSubmit}
          disabled={!allChecked || submitting}
          className="flex items-center gap-2 px-5 h-11 rounded-ch bg-ch-main text-white font-body text-body disabled:opacity-40"
        >
          {submitting ? 'Submitting…' : 'Submit This Case'}
          <Icon name="archive" size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Modals
   ──────────────────────────────────────────────────────────────────────── */

function CancelFormModal({ open, onClose, onConfirmCancel, onMinimize }) {
  return (
    <Modal open={open} onClose={onClose}>
      <p className="font-heading font-bold text-h6 text-ch-main uppercase">Would You Like To Cancel Case Form?</p>
      <p className="font-body text-body text-ch-main opacity-70 mt-1.5">The Inserted Data Wont Be Retrieve Once Canceled.</p>
      <div className="flex gap-2.5 justify-center mt-5">
        <button onClick={onConfirmCancel} className="flex items-center gap-2 px-4 h-10 rounded-ch border border-ch-red text-ch-red font-body text-body">
          Yes, Cancel Form
          <Icon name="archive" size={14} color="#C54446" />
        </button>
        <button onClick={onClose} className="flex items-center gap-2 px-4 h-10 rounded-ch bg-ch-main text-white font-body text-body">
          No, Return to Form
          <Icon name="archive" size={14} color="#fff" />
        </button>
      </div>
      {onMinimize && (
        <button onClick={onMinimize} className="font-body text-body text-ch-main opacity-60 underline mt-3">
          Minimize Form Instead
        </button>
      )}
    </Modal>
  );
}

/**
 * Three-stage modal matching Figma's submit flow:
 * 1. "Submit Case #<num>?" confirmation
 * 2. "Would you like to take a break?" prompt
 * 3. "Submitting, please wait" spinner
 */
function SubmitCaseModal({ open, caseNum, onClose, onConfirm, onStartBreak }) {
  const [stage, setStage] = useState('confirm'); // confirm | break | submitting

  if (!open) return null;

  function handleConfirm() {
    setStage('break');
  }
  async function finish(breakOpt) {
    setStage('submitting');
    if (breakOpt) onStartBreak?.(breakOpt);
    await onConfirm();
  }

  return (
    <Modal open={open} onClose={stage === 'confirm' ? onClose : undefined}>
      {stage === 'confirm' && (
        <>
          <p className="font-heading font-bold text-h6 text-ch-main uppercase">
            Submit Case <span className="text-[#4760FF]">#{caseNum}</span>?
          </p>
          <div className="flex gap-2.5 justify-center mt-5">
            <button onClick={onClose} className="flex items-center gap-2 px-4 h-10 rounded-ch border border-ch-border text-ch-main font-body text-body">
              Cancel
            </button>
            <button onClick={handleConfirm} className="flex items-center gap-2 px-4 h-10 rounded-ch bg-ch-main text-white font-body text-body">
              Yes, Proceed
              <Icon name="archive" size={14} color="#fff" />
            </button>
          </div>
        </>
      )}

      {stage === 'break' && (
        <>
          <p className="font-heading font-bold text-h6 text-ch-main uppercase">Would You Like To Take A Break?</p>
          <div className="flex gap-2 justify-center flex-wrap mt-4">
            {BREAK_OPTIONS.map((opt) => (
              <button key={opt.mins} onClick={() => finish(opt)} className="flex items-center gap-1.5 px-3 h-9 rounded-ch bg-ch-secondary text-ch-main font-body text-body">
                <Icon name={opt.icon} size={14} color="#40513B" />
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={() => finish(null)} className="w-full h-10 rounded-ch border border-ch-red text-ch-red font-body text-body mt-3">
            No Thanks, Skip Break
          </button>
        </>
      )}

      {stage === 'submitting' && (
        <>
          <div className="flex justify-center mb-2">
            <Icon name="loading" size={28} color="#40513B" />
          </div>
          <p className="font-heading font-bold text-h6 text-ch-main uppercase">Submitting, Please Wait</p>
          <p className="font-body text-body text-ch-main opacity-60 mt-1">Don&apos;t close this tab while your case is being saved.</p>
        </>
      )}
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   The wizard itself
   ──────────────────────────────────────────────────────────────────────── */

export default function PostLiveWizard({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
  onUpdateActiveForm,
  requestors,
  fileNaming,
  onSubmitCase,
  onSuspendCase,
  onDiscardCase,
  onStartBreak,
  activeBreakMins,
}) {
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const form = activeTab.form;
  const setForm = (updater) => onUpdateActiveForm(typeof updater === 'function' ? updater(form) : updater);

  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => setStepIndex(0), [activeTabId]);

  const [elapsed, setElapsed] = useState(0);
  const startTime = useMemo(() => Date.now(), [activeTabId]);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  const [lightboxImg, setLightboxImg] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSC = activeTab.mode !== 'inbound';
  const entryLabel = isSC ? 'Site Comment' : 'Assumption';
  const isSpecialRequestor = requestors.some((r) => r.toLowerCase() === (form.customerName || '').toLowerCase());

  const beforeScreenshotName = fileNaming.beforeName;
  const afterScreenshotName = fileNaming.afterName;
  const backupScreenshotName = fileNaming.screenshotName;

  function next() {
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
  }
  function back() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmitCase(activeTab, form);
    } finally {
      setSubmitting(false);
      setSubmitOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center justify-between bg-ch-main rounded-ch px-5 py-3.5">
        <div className="flex items-center gap-3">
          <button onClick={() => setCancelOpen(true)}>
            <Icon name="back" size={18} color="#fff" />
          </button>
          <div>
            <p className="font-heading font-bold text-h6 text-white uppercase">Post-Live Amends Form</p>
            <p className="font-body text-body text-white opacity-70">
              {isSC ? 'Site Comment' : 'Inbound Email'} - {form.businessName || 'Untitled'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[9px] font-label font-bold uppercase text-white opacity-60">Elapse</p>
            <p className="font-body text-body text-white tabular-nums">{fmtElapsed(elapsed)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-label font-bold uppercase text-white opacity-60">QA Checklist</p>
            <p className="font-body text-body text-white opacity-50 tabular-nums">0:00:00</p>
          </div>
        </div>
      </div>

      <CaseTabsBar tabs={tabs} activeId={activeTabId} onSelect={onSelectTab} onClose={onCloseTab} onAdd={onAddTab} />
      <WizardStepBar activeIndex={stepIndex} onStepClick={setStepIndex} />

      <div className="flex gap-2.5 items-start w-full flex-wrap">
        <InformationSummaryPanel form={form} entryLabel={`${entryLabel}s`} onImageClick={setLightboxImg} />

        <div className="flex-1 min-w-[320px]">
          {stepIndex === 0 && <Step1CaseInfo form={form} setForm={setForm} requestors={requestors} isSpecialRequestor={isSpecialRequestor} onNext={next} />}
          {stepIndex === 1 && <Step2BeforeBackup beforeScreenshotName={beforeScreenshotName} onBack={back} onNext={next} />}
          {stepIndex === 2 && <Step3Notepad form={form} setForm={setForm} screenshotBaseName={backupScreenshotName} entryLabel={entryLabel} onBack={back} onNext={next} />}
          {stepIndex === 3 && (
            <Step4AfterBackup
              afterScreenshotName={afterScreenshotName}
              backupScreenshotName={backupScreenshotName}
              images={form.images}
              onImages={(imgs) => setForm({ ...form, images: imgs })}
              onBack={back}
              onNext={next}
            />
          )}
          {stepIndex === 4 && <Step5FinalChecklist form={form} setForm={setForm} onBack={back} submitting={submitting} onSubmit={() => setSubmitOpen(true)} />}
        </div>

        <QuickToolsPanel quickFormats={{}} activeBreak={activeBreakMins} onStartBreak={onStartBreak} onSuspend={() => onSuspendCase(activeTab, form)} />
      </div>

      {lightboxImg && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-6" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Screenshot" className="max-w-full max-h-full rounded-ch" />
        </div>
      )}

      <CancelFormModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirmCancel={() => {
          setCancelOpen(false);
          onDiscardCase(activeTab);
        }}
        onMinimize={() => setCancelOpen(false)}
      />

      <SubmitCaseModal open={submitOpen} caseNum={form.caseNum} onClose={() => setSubmitOpen(false)} onConfirm={handleSubmit} onStartBreak={onStartBreak} />
    </div>
  );
}
