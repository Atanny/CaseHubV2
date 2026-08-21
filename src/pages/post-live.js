import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import HeaderQuickActions from '../components/layout/HeaderQuickActions';
import Divider from '../components/ui/Divider';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Toast, { useToast } from '../components/ui/Toast';
import PostLiveForm from '../components/postlive/PostLiveForm';
import { modeBadgeColor, modeLabel } from '../components/dashboard/caseHelpers';
import { useSession } from '../hooks/useSession';
import { casesService } from '../services/casesService';
import { draftsService } from '../services/draftsService';
import { requestorsService } from '../services/requestorsService';
import { profileService } from '../services/profileService';

export default function PostLivePage() {
  const { user } = useSession();
  const [mode, setMode] = useState(null); // 'siteComment' | 'inbound' | null
  const [activeDraft, setActiveDraft] = useState(null); // draft being resumed, or null for a fresh case
  const [drafts, setDrafts] = useState([]);
  const [requestors, setRequestors] = useState([]);
  const [greetingMessages, setGreetingMessages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadState, setLoadState] = useState('loading');
  const [deleteDraftId, setDeleteDraftId] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      setLoadState('loading');
      try {
        const [d, r, p] = await Promise.all([draftsService.list(user.email), requestorsService.list(), profileService.get(user.email)]);
        setDrafts(d);
        setRequestors(r);
        setGreetingMessages(p.greeting_messages || []);
        setLoadState('ready');
      } catch (e) {
        setLoadState('error');
      }
    })();
  }, [user?.email]);

  function startFresh(m) {
    setActiveDraft(null);
    setMode(m);
  }
  function resumeDraft(d) {
    setActiveDraft(d);
    setMode(d._mode);
  }
  function backToPicker() {
    setMode(null);
    setActiveDraft(null);
  }

  async function handleSave(caseData) {
    setSaving(true);
    try {
      await casesService.create({ ...caseData, userEmail: user.email });
      if (activeDraft?._id) {
        await draftsService.remove(activeDraft._id);
        setDrafts((list) => list.filter((d) => d._id !== activeDraft._id));
      }
      showToast('Case saved!');
      backToPicker();
    } catch (e) {
      showToast(e.message || 'Failed to save case', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft(caseData) {
    setSaving(true);
    try {
      const saved = await draftsService.save({ userEmail: user.email, mode, draftData: caseData });
      setDrafts((list) => {
        const exists = list.some((d) => d._id === saved._id);
        return exists ? list.map((d) => (d._id === saved._id ? saved : d)) : [saved, ...list];
      });
      showToast('Draft saved — resume anytime from here.', 'info');
      backToPicker();
    } catch (e) {
      showToast('Failed to save draft', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteDraft() {
    try {
      await draftsService.remove(deleteDraftId);
      setDrafts((list) => list.filter((d) => d._id !== deleteDraftId));
      showToast('Draft deleted', 'info');
    } catch (e) {
      showToast('Failed to delete draft', 'error');
    }
    setDeleteDraftId(null);
  }

  return (
    <AppLayout>
      <PageHeader title="Post-Live Amends" subtitle={mode ? `${modeLabel(mode)} in progress` : 'Start a new case or resume a draft'} actions={<HeaderQuickActions />} />
      <Divider className="mb-1" />

      {!mode && (
        <div className="flex flex-col gap-2.5 w-full">
          <div className="flex gap-2.5 w-full flex-wrap">
            <button onClick={() => startFresh('siteComment')} className="flex-1 min-w-[220px] bg-white rounded-ch shadow-ch p-6 text-left hover:shadow-lg transition-shadow">
              <p className="font-heading font-bold text-h6 text-ch-main mb-1">Site Comment</p>
              <p className="font-body text-body text-ch-main opacity-60">Start a new site comment amendment case.</p>
            </button>
            <button onClick={() => startFresh('inbound')} className="flex-1 min-w-[220px] bg-white rounded-ch shadow-ch p-6 text-left hover:shadow-lg transition-shadow">
              <p className="font-heading font-bold text-h6 text-ch-main mb-1">Inbound Email</p>
              <p className="font-body text-body text-ch-main opacity-60">Start a new case from an inbound email request.</p>
            </button>
          </div>

          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mt-2">Suspended Drafts</p>
          {loadState === 'loading' && <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">Loading drafts…</div>}
          {loadState === 'error' && <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-red">Couldn&apos;t load drafts.</div>}
          {loadState === 'ready' && drafts.length === 0 && (
            <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">No suspended drafts. Suspend a case in progress to resume it later.</div>
          )}
          <div className="flex flex-col gap-2">
            {drafts.map((d) => (
              <div key={d._id} className="flex items-center justify-between gap-3 bg-white rounded-ch shadow-ch p-4">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => resumeDraft(d)}>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-heading font-bold text-h6 text-ch-main">
                      {d.caseNum || 'Untitled'} - {d.accountNum || '—'}
                    </p>
                    <span className="px-2.5 py-1 rounded-full text-white text-badge font-label font-bold uppercase whitespace-nowrap" style={{ background: modeBadgeColor(d._mode) }}>
                      {modeLabel(d._mode)}
                    </span>
                  </div>
                  <p className="font-body text-body text-ch-main opacity-60">{d.amendType || 'No amend type'} · Saved {d.draftAt}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="primary" size="sm" onClick={() => resumeDraft(d)}>
                    Resume
                  </Button>
                  <Button variant="outline" size="sm" className="!border-ch-red !text-ch-red" onClick={() => setDeleteDraftId(d._id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode && (
        <PostLiveForm
          mode={mode}
          draftData={activeDraft}
          user={user}
          requestors={requestors}
          greetingMessages={greetingMessages}
          saving={saving}
          onSave={handleSave}
          onSaveDraft={handleSaveDraft}
          onCancel={() => setCancelConfirm(true)}
        />
      )}

      <Modal open={!!deleteDraftId} onClose={() => setDeleteDraftId(null)}>
        <p className="font-heading font-bold text-h6 text-ch-main">Delete Draft?</p>
        <p className="font-body text-body text-ch-main opacity-70 mt-1">This draft will be permanently deleted.</p>
        <div className="flex gap-2.5 justify-center mt-5">
          <Button variant="outline" onClick={() => setDeleteDraftId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteDraft}>
            Delete
          </Button>
        </div>
      </Modal>

      <Modal open={cancelConfirm} onClose={() => setCancelConfirm(false)}>
        <p className="font-heading font-bold text-h6 text-ch-main">Discard this case?</p>
        <p className="font-body text-body text-ch-main opacity-70 mt-1">Unsaved changes will be lost. Consider suspending instead if you want to keep them.</p>
        <div className="flex gap-2.5 justify-center mt-5">
          <Button variant="outline" onClick={() => setCancelConfirm(false)}>
            Keep Editing
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setCancelConfirm(false);
              backToPicker();
            }}
          >
            Discard
          </Button>
        </div>
      </Modal>

      <Toast msg={toast.msg} type={toast.type} />
    </AppLayout>
  );
}
