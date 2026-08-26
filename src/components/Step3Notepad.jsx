import Icon from './Icon';
import Button from './Button';
import ImageUploadZone from './ImageUploadZone';
import { checkGrammar } from '../services/grammarService';
import { useState } from 'react';
import { emptySiteCommentEntry } from './formShape';

const inputCls = 'w-full h-11 px-4 bg-white border border-ch-border rounded-ch outline-none font-body text-body text-ch-main';
const textareaCls = 'w-full min-h-[90px] p-4 bg-white border border-ch-border rounded-ch outline-none resize-y font-body text-body text-ch-main';

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
      <input className={inputCls} placeholder="E.G. 1, 2" value={entry.number} onChange={(e) => onChange({ ...entry, number: e.target.value })} />

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Notes (Optional Field)</p>
        <textarea className={textareaCls} placeholder="Insert Notes Here" value={entry.notes} onChange={(e) => onChange({ ...entry, notes: e.target.value })} />
        <button disabled={!entry.notes?.trim() || checking === 'notes'} onClick={() => runGrammar('notes')} className="text-[11px] font-body text-ch-main opacity-70 disabled:opacity-30 underline mt-1">
          {checking === 'notes' ? 'Checking…' : 'Grammar Check'}
        </button>
      </div>

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Clarification (Optional Field)</p>
        <textarea className={textareaCls} placeholder="Insert Notes Here" value={entry.clarification} onChange={(e) => onChange({ ...entry, clarification: e.target.value })} />
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

export default function Step3Notepad({ form, setForm, screenshotBaseName, entryLabel, onBack, onNext }) {
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
