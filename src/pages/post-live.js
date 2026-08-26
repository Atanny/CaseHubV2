import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Toast, { useToast } from '../components/Toast';
import AppLayout from '../components/AppLayout';
import ModeCard from '../components/ModeCard';
import DailySessionPanel from '../components/DailySessionPanel';
import SuspendedCaseRow from '../components/SuspendedCaseRow';
import PostLiveWizard from '../components/PostLiveWizard';
import { emptyBase } from '../components/formShape';
import { BREAK_OPTIONS } from '../constants/navigation';
import { useSession } from '../hooks/useSession';
import { casesService } from '../services/casesService';
import { draftsService } from '../services/draftsService';
import { requestorsService } from '../services/requestorsService';
import { profileService } from '../services/profileService';

function defaultFileNames(name) {
  const n = (name || 'User').trim().replace(/\s+/g, '_');
  return {
    beforeName: `Post_Live_Amend_Before_${n}_Amends`,
    afterName: `Post_Live_Amend_After_${n}_Amends`,
    screenshotName: `Post_Live_Amend_Screenshot_${n}_Amends`,
  };
}

/** "Pick A Case For The New Bundle" + "Case Type" picker, matching the small Figma popup. */
function BundlePickerModal({ open, onClose, onPick }) {
  const [mode, setMode] = useState('siteComment');
  return (
    <Modal open={open} onClose={onClose} className="!max-w-sm">
      <p className="font-heading font-bold text-h6 text-ch-main uppercase">Case Type</p>
      <div className="flex gap-2 justify-center mt-3">
        {[
          ['siteComment', 'Site Comment'],
          ['inbound', 'Inbound Email'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setMode(v)}
            className={`flex-1 h-10 rounded-ch font-body text-body border ${mode === v ? 'bg-ch-main border-ch-main text-white' : 'bg-white border-ch-border text-ch-main'}`}
          >
            {l}
          </button>
        ))}
      </div>
      <Button variant="primary" className="w-full mt-4" onClick={() => onPick(mode, null)}>
        Start New Case
      </Button>
    </Modal>
  );
}

export default function PostLivePage() {
  const { user, signOut } = useSession();
  const [tabs, setTabs] = useState([]); // [{id, mode, form}]
  const [activeTabId, setActiveTabId] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [requestors, setRequestors] = useState([]);
  const [fileNaming, setFileNaming] = useState(defaultFileNames());
  const [loadState, setLoadState] = useState('loading');
  const [bundlePicker, setBundlePicker] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(null);
  const [toast, showToast] = useToast();

  const [timedIn, setTimedIn] = useState(false);
  const [timeInAt, setTimeInAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [activeBreakMins, setActiveBreakMins] = useState(null);
  const [sessionRows, setSessionRows] = useState([]);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      setLoadState('loading');
      try {
        const [d, r, p] = await Promise.all([draftsService.list(user.email), requestorsService.list(), profileService.get(user.email)]);
        setDrafts(d);
        setRequestors(r);
        setFileNaming({
          beforeName: p.before_name || defaultFileNames(user.name).beforeName,
          afterName: p.after_name || defaultFileNames(user.name).afterName,
          screenshotName: p.screenshot_name || defaultFileNames(user.name).screenshotName,
        });
        setLoadState('ready');
      } catch (e) {
        setLoadState('error');
      }
    })();
  }, [user?.email, user?.name]);

  useEffect(() => {
    if (!timedIn) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - timeInAt) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [timedIn, timeInAt]);

  function toggleTimeIn() {
    if (timedIn) {
      setTimedIn(false);
      setElapsed(0);
      showToast('Timed out');
    } else {
      setTimeInAt(Date.now());
      setTimedIn(true);
      showToast('Timed in — session started');
    }
  }

  function openNewCase(mode, bundledWith) {
    const id = String(Date.now());
    const form = { ...emptyBase(), _bundledWith: bundledWith || null };
    setTabs((t) => [...t, { id, mode, form }]);
    setActiveTabId(id);
    setBundlePicker(false);
  }

  function resumeDraft(draft) {
    const id = draft._id;
    if (tabs.some((t) => t.id === id)) {
      setActiveTabId(id);
      return;
    }
    setTabs((t) => [...t, { id, mode: draft._mode, form: { ...emptyBase(), ...draft } }]);
    setActiveTabId(id);
  }

  function updateActiveForm(nextForm) {
    setTabs((t) => t.map((tab) => (tab.id === activeTabId ? { ...tab, form: nextForm } : tab)));
  }

  function closeTab(id) {
    setTabs((t) => t.filter((tab) => tab.id !== id));
    if (activeTabId === id) {
      const remaining = tabs.filter((t) => t.id !== id);
      setActiveTabId(remaining[0]?.id || null);
    }
  }

  async function handleSubmitCase(tab, form) {
    try {
      await casesService.create({ ...form, _mode: tab.mode, userEmail: user.email, savedAt: new Date().toLocaleString() });
      if (drafts.some((d) => d._id === tab.id)) {
        await draftsService.remove(tab.id);
        setDrafts((list) => list.filter((d) => d._id !== tab.id));
      }
      setSessionRows((rows) => [
        ...rows,
        {
          type: tab.mode === 'inbound' ? 'Inbound Email' : 'Site Comment',
          complexity: form._caseComplexity,
          caseNum: form.caseNum,
          started: new Date().toLocaleTimeString(),
          ended: new Date().toLocaleTimeString(),
          duration: '—',
          outcome: 'Completed',
          actions: '—',
        },
      ]);
      closeTab(tab.id);
      showToast('Case submitted!');
    } catch (e) {
      showToast('Failed to submit case', 'error');
      throw e;
    }
  }

  async function handleSuspendCase(tab, form) {
    try {
      const saved = await draftsService.save({ userEmail: user.email, mode: tab.mode, draftData: form });
      setDrafts((list) => {
        const exists = list.some((d) => d._id === saved._id);
        return exists ? list.map((d) => (d._id === saved._id ? saved : d)) : [saved, ...list];
      });
      closeTab(tab.id);
      showToast('Case suspended — resume it anytime below.', 'info');
    } catch (e) {
      showToast('Failed to suspend case', 'error');
    }
  }

  function handleDiscardCase(tab) {
    closeTab(tab.id);
  }

  async function confirmArchive() {
    if (!archiveConfirm) return;
    try {
      await fetch('/api/archived-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, mode: archiveConfirm._mode, draftData: archiveConfirm, savedAt: archiveConfirm.draftAt }),
      });
      await draftsService.remove(archiveConfirm._id);
      setDrafts((list) => list.filter((d) => d._id !== archiveConfirm._id));
      showToast('Case archived', 'info');
    } catch (e) {
      showToast('Failed to archive', 'error');
    }
    setArchiveConfirm(null);
  }

  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (activeTab) {
    return (
      <AppLayout>
        <PostLiveWizard
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={closeTab}
          onAddTab={() => setBundlePicker(true)}
          onUpdateActiveForm={updateActiveForm}
          requestors={requestors}
          fileNaming={fileNaming}
          onSubmitCase={handleSubmitCase}
          onSuspendCase={handleSuspendCase}
          onDiscardCase={handleDiscardCase}
          onStartBreak={(opt) => {
            setActiveBreakMins(opt.mins);
            showToast(`${opt.label} break started`);
            setTimeout(() => setActiveBreakMins(null), opt.mins * 60 * 1000);
          }}
          activeBreakMins={activeBreakMins}
        />
        <BundlePickerModal open={bundlePicker} onClose={() => setBundlePicker(false)} onPick={(mode, withId) => openNewCase(mode, withId)} />
        <Toast msg={toast.msg} type={toast.type} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between w-full flex-wrap gap-3">
        <div>
          <p className="font-heading font-bold text-h4 uppercase text-ch-main">Post-Live Amends</p>
          <p className="font-body text-body text-ch-main opacity-60">Live Website Amendments</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {BREAK_OPTIONS.map((opt) => (
            <button key={opt.mins} className="flex items-center gap-1.5 px-3.5 h-10 rounded-ch bg-white shadow-ch font-body text-body text-ch-main">
              <Icon name={opt.icon} size={16} color="#40513B" />
              {opt.label}
            </button>
          ))}
          <Button variant="danger" onClick={signOut} icon={<Icon name="logout" size={16} color="#fff" />}>
            Log Out
          </Button>
        </div>
      </div>

      <div className="flex gap-2.5 w-full flex-wrap">
        <ModeCard icon="postlive" title="Site Comment" subtitle="Multiple Site Comment" onClick={() => openNewCase('siteComment')} />
        <ModeCard icon="announce" title="Inbound Email" subtitle="Assumption Based Format" onClick={() => openNewCase('inbound')} />
        <ModeCard icon="links" title="Bundle" subtitle="Linked with existing Case" onClick={() => setBundlePicker(true)} />
      </div>

      <DailySessionPanel
        timedIn={timedIn}
        elapsed={elapsed}
        onToggleTimeIn={toggleTimeIn}
        rows={sessionRows}
        stats={{
          totalHours: timedIn ? (elapsed / 3600).toFixed(1) : 0,
          totalCases: sessionRows.length,
          completed: sessionRows.filter((r) => r.outcome === 'Completed').length,
          clarification: sessionRows.filter((r) => r.outcome === 'Clarification').length,
          suspended: drafts.length,
        }}
      />

      <div className="bg-white rounded-ch shadow-ch p-5 w-full">
        <div className="flex items-center justify-between mb-1">
          <p className="font-heading font-bold text-h6 text-ch-main uppercase">Suspended Case</p>
        </div>
        {loadState === 'loading' && <p className="font-body text-body text-ch-main opacity-60 py-4 text-center">Loading…</p>}
        {loadState === 'ready' && drafts.length === 0 && <p className="font-body text-body text-ch-main opacity-50 py-4 text-center">No suspended cases.</p>}
        {drafts.map((d) => (
          <SuspendedCaseRow key={d._id} draft={d} onResume={resumeDraft} onArchive={setArchiveConfirm} />
        ))}
      </div>

      <BundlePickerModal open={bundlePicker} onClose={() => setBundlePicker(false)} onPick={(mode, withId) => openNewCase(mode, withId)} />

      <Modal open={!!archiveConfirm} onClose={() => setArchiveConfirm(null)}>
        <p className="font-heading font-bold text-h6 text-ch-main">Archive this case?</p>
        <p className="font-body text-body text-ch-main opacity-70 mt-1">It will move to Archived Cases and won&apos;t be editable.</p>
        <div className="flex gap-2.5 justify-center mt-5">
          <Button variant="outline" onClick={() => setArchiveConfirm(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmArchive}>
            Archive
          </Button>
        </div>
      </Modal>

      <Toast msg={toast.msg} type={toast.type} />
    </AppLayout>
  );
}
