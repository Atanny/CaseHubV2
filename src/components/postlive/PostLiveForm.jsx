import { useEffect, useMemo, useState } from 'react';
import Icon from '../icons/Icon';
import Button from '../ui/Button';
import StepCard from '../ui/StepCard';
import Divider from '../ui/Divider';
import EntryCard from './EntryCard';
import ImageUploadZone from './ImageUploadZone';
import DeviceChecklist from './DeviceChecklist';
import QaChecklist from './QaChecklist';
import RequestorAutocomplete from './RequestorAutocomplete';
import GreetingRow from './GreetingRow';
import { CopyRow } from './CopyRow';
import EmailComposer from './EmailComposer';
import { emptyBase, emptyEntry } from './formShape';
import { fmtElapsed } from '../../utils/format';

const COMPLEXITIES = [
  ['minor', 'Minor'],
  ['complex', 'Complex'],
  ['major', 'Major'],
];

export default function PostLiveForm({ mode, draftData, user, requestors = [], greetingMessages = [], onSave, onSaveDraft, onCancel, saving }) {
  const isSC = mode === 'siteComment';
  const entryLabel = isSC ? 'Site Comment' : 'Assumption';

  const [form, setForm] = useState(() => (draftData ? { ...emptyBase(), ...draftData } : emptyBase()));
  const [startTime] = useState(() => draftData?._startTime || Date.now());
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - startTime) / 1000));

  const userName = (user?.name || 'User').trim().replace(/\s+/g, '_');
  const beforeName = user?.beforeName || `Post_Live_Amend_Before_${userName}_Amends`;
  const afterName = user?.afterName || `Post_Live_Amend_After_${userName}_Amends`;
  const screenshotName = user?.screenshotName || `Post_Live_Amend_Screenshot_${userName}_Amends`;

  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  function setF(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function updateEntry(i, next) {
    setForm((f) => {
      const arr = [...f.entries];
      arr[i] = next;
      return { ...f, entries: arr };
    });
  }
  function addEntry() {
    setForm((f) => ({ ...f, entries: [...f.entries, emptyEntry()] }));
  }
  function removeEntry(i) {
    setForm((f) => {
      const arr = [...f.entries];
      arr.splice(i, 1);
      return { ...f, entries: arr.length ? arr : [emptyEntry()] };
    });
  }

  const isSpecialRequestor = useMemo(
    () => requestors.some((r) => r.toLowerCase() === (form.customerName || '').toLowerCase()),
    [requestors, form.customerName]
  );

  function buildSavePayload() {
    return { ...form, _mode: mode, _startTime: startTime, _elapsedAtSave: elapsed, savedAt: new Date().toLocaleString() };
  }

  const canSave = !!(form.caseNum && form.accountNum);

  return (
    <div className="flex gap-2.5 items-start w-full flex-wrap">
      <div className="flex flex-col gap-2.5 flex-[3] min-w-[320px]">
        <StepCard n={1} title="Case Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Case Number *</p>
              <input className="w-full h-9 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main" value={form.caseNum} onChange={(e) => setF({ caseNum: e.target.value })} />
            </div>
            <div>
              <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Account Number *</p>
              <input className="w-full h-9 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main" value={form.accountNum} onChange={(e) => setF({ accountNum: e.target.value })} />
            </div>
            {!isSC && (
              <div>
                <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Inbound Number</p>
                <input className="w-full h-9 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main" value={form.inboundNum} onChange={(e) => setF({ inboundNum: e.target.value })} />
              </div>
            )}
            <div>
              <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Amend Type</p>
              <input className="w-full h-9 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main" value={form.amendType} onChange={(e) => setF({ amendType: e.target.value })} />
            </div>
            <div>
              <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Business Name</p>
              <input className="w-full h-9 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main" value={form.businessName} onChange={(e) => setF({ businessName: e.target.value })} />
            </div>
            <div>
              <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Business Suffix</p>
              <input className="w-full h-9 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main" placeholder="LLC, Inc..." value={form.businessSuffix} onChange={(e) => setF({ businessSuffix: e.target.value })} />
            </div>
            <div>
              <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Customer / Requestor Name</p>
              <RequestorAutocomplete value={form.customerName} onChange={(v) => setF({ customerName: v })} requestors={requestors} isSpecial={isSpecialRequestor} />
            </div>
            <div>
              <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Customer Email</p>
              <input type="email" className="w-full h-9 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main" value={form.customerEmail} onChange={(e) => setF({ customerEmail: e.target.value })} />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1.5">Case Complexity</p>
            <div className="flex gap-2">
              {COMPLEXITIES.map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setF({ _caseComplexity: v })}
                  className={`flex-1 h-9 rounded-ch font-body text-body border ${form._caseComplexity === v ? 'bg-ch-main border-ch-main text-white' : 'bg-white border-ch-border text-ch-main'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 font-body text-body text-ch-main">
            <input type="checkbox" checked={form.inProgress} onChange={(e) => setF({ inProgress: e.target.checked })} />
            Marked "In Progress" on tracker
          </label>
        </StepCard>

        <StepCard n={2} title={`${entryLabel}s`} hint={`Add each ${entryLabel.toLowerCase()} for this case.`}>
          <div className="flex flex-col gap-2.5">
            {form.entries.map((entry, i) => (
              <EntryCard key={entry.id} entry={entry} label={entryLabel} index={i} showNumber={isSC} showDelete={form.entries.length > 1} onChange={(next) => updateEntry(i, next)} onDelete={() => removeEntry(i)} />
            ))}
          </div>
          <Button variant="outline" size="sm" className="self-start" icon={<Icon name="plus" size={12} color="#40513B" />} iconPosition="left" onClick={addEntry}>
            Add {entryLabel}
          </Button>
        </StepCard>

        <StepCard n={3} title="Before Screenshot">
          <ImageUploadZone baseName={beforeName} multiple={false} images={form.images?.slice(0, 1) || []} onImages={(imgs) => setF({ images: imgs })} isActive />
        </StepCard>

        <StepCard n={4} title="After Screenshot">
          <ImageUploadZone baseName={afterName} multiple={false} images={form.images?.slice(1, 2) || []} onImages={(imgs) => setF({ images: [form.images?.[0]].filter(Boolean).concat(imgs) })} isActive />
        </StepCard>

        <StepCard n={5} title="Backup Screenshots" hint="Any number of supporting screenshots.">
          <ImageUploadZone baseName={screenshotName} multiple images={form.backupImages || []} onImages={(imgs) => setF({ backupImages: imgs })} isActive />
        </StepCard>

        <StepCard n={6} title="Devices Tested">
          <DeviceChecklist devices={form.devices} onChange={(d) => setF({ devices: d })} />
        </StepCard>

        <StepCard n={7} title="QA Checklist">
          <QaChecklist checklist={form.checklist} onChange={(c) => setF({ checklist: c })} />
        </StepCard>

        <StepCard n={8} title="Tracker Checklist Link">
          <input
            className="w-full h-9 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main"
            placeholder="https://..."
            value={form.trackerChecklistLink}
            onChange={(e) => setF({ trackerChecklistLink: e.target.value })}
          />
        </StepCard>

        {!isSC && (
          <StepCard n={9} title="Email">
            <EmailComposer form={form} onChange={setForm} />
          </StepCard>
        )}
      </div>

      <div className="flex flex-col gap-2.5 flex-1 min-w-[280px] sticky top-5">
        <div className="bg-white rounded-ch shadow-ch p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-heading font-bold text-h6 text-ch-main">Live Summary</p>
            <span className="font-body text-body text-ch-main opacity-60 tabular-nums">{fmtElapsed(elapsed)}</span>
          </div>
          <Divider tone="secondary" />
          <GreetingRow greetingMessages={greetingMessages} caseNum={form.caseNum} inboundNum={form.inboundNum} />
          <CopyRow label="Case Number" value={form.caseNum} />
          <CopyRow label="Account Number" value={form.accountNum} />
          <CopyRow label="Business Name" value={`${form.businessName || ''} ${form.businessSuffix || ''}`.trim()} />
          {isSpecialRequestor && (
            <div className="bg-[#4760FF]/10 border border-[#4760FF]/30 rounded-ch p-2.5 font-body text-body text-[#4760FF]">
              ⚠ Special requestor — handle with extra care.
            </div>
          )}
        </div>

        <div className="bg-white rounded-ch shadow-ch p-5 flex flex-col gap-2.5">
          <Button variant="primary" onClick={() => onSave(buildSavePayload())} disabled={!canSave || saving}>
            {saving ? 'Saving…' : 'Save Case'}
          </Button>
          <Button variant="outline" onClick={() => onSaveDraft(buildSavePayload())} disabled={saving}>
            Suspend (Save as Draft)
          </Button>
          <Button variant="outline" className="!border-ch-red !text-ch-red" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          {!canSave && <p className="font-body text-body text-ch-main opacity-50 text-center">Case # and Account # required to save.</p>}
        </div>
      </div>
    </div>
  );
}
