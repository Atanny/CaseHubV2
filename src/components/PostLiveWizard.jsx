import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import CaseTabsBar from './CaseTabsBar';
import WizardStepBar, { WIZARD_STEPS } from './WizardStepBar';
import InformationSummaryPanel from './InformationSummaryPanel';
import QuickToolsPanel from './QuickToolsPanel';
import Step1CaseInfo from './Step1CaseInfo';
import Step2BeforeBackup from './Step2BeforeBackup';
import Step3Notepad from './Step3Notepad';
import Step4AfterBackup from './Step4AfterBackup';
import Step5FinalChecklist from './Step5FinalChecklist';
import CancelFormModal from './CancelFormModal';
import SubmitCaseModal from './SubmitCaseModal';
import { fmtElapsed } from '../utils/format';

function fileBaseName(template) {
  return template;
}

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

  const beforeScreenshotName = fileBaseName(fileNaming.beforeName);
  const afterScreenshotName = fileBaseName(fileNaming.afterName);
  const backupScreenshotName = fileBaseName(fileNaming.screenshotName);

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

        <QuickToolsPanel
          quickFormats={{}}
          activeBreak={activeBreakMins}
          onStartBreak={onStartBreak}
          onSuspend={() => onSuspendCase(activeTab, form)}
        />
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
