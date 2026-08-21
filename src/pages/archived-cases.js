import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import HeaderQuickActions from '../components/layout/HeaderQuickActions';
import Divider from '../components/ui/Divider';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Toast, { useToast } from '../components/ui/Toast';
import Accordion from '../components/ui/Accordion';
import { modeBadgeColor, modeLabel } from '../components/dashboard/caseHelpers';
import { useSession } from '../hooks/useSession';
import { archivedDraftsService } from '../services/archivedDraftsService';

export default function ArchivedCasesPage() {
  const { user } = useSession();
  const [drafts, setDrafts] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      setLoadState('loading');
      try {
        const data = await archivedDraftsService.list(user.email);
        setDrafts(data);
        setLoadState('ready');
      } catch (e) {
        setLoadState('error');
      }
    })();
  }, [user?.email]);

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    try {
      await archivedDraftsService.remove(confirmDeleteId);
      setDrafts((list) => list.filter((d) => d._id !== confirmDeleteId));
      showToast('Deleted', 'info');
    } catch (e) {
      showToast('Failed to delete', 'error');
    }
    setConfirmDeleteId(null);
  }

  return (
    <AppLayout>
      <PageHeader
        title="Archived Cases"
        subtitle={`${drafts.length} archived case${drafts.length !== 1 ? 's' : ''} — view-only`}
        actions={<HeaderQuickActions />}
      />
      <Divider className="mb-1" />

      <div className="flex flex-col gap-2.5 w-full">
        {loadState === 'error' && (
          <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-red">Couldn&apos;t load archived cases.</div>
        )}
        {loadState === 'ready' && drafts.length === 0 && (
          <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">
            No archived cases yet. When you archive a suspended case it will appear here.
          </div>
        )}

        {drafts.map((d, i) => {
          const key = d._id || i;
          const isOpen = expandedId === key;
          const nums = (Array.isArray(d._bundledWith) ? d._bundledWith : d._bundledWith ? [d._bundledWith] : []).filter(Boolean);
          return (
            <Accordion
              key={key}
              isOpen={isOpen}
              onToggle={() => setExpandedId(isOpen ? null : key)}
              header={
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-heading font-bold text-h6 text-ch-main">
                      {d.caseNum || '—'} - {d.accountNum || '—'}
                    </p>
                    <span
                      className="px-2.5 py-1 rounded-full text-white text-badge font-label font-bold uppercase whitespace-nowrap"
                      style={{ background: modeBadgeColor(d._mode) }}
                    >
                      {modeLabel(d._mode)}
                    </span>
                    {nums.length > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-white text-badge font-label font-bold uppercase whitespace-nowrap bg-amber-600">
                        w/ #{nums.join(', #')}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-body text-ch-main opacity-60">
                    {d.amendType || 'No amend type'} · Archived {d.archivedAt}
                  </p>
                </div>
              }
              actions={
                <Button variant="outline" size="sm" className="!border-ch-red !text-ch-red" onClick={() => setConfirmDeleteId(key)}>
                  Delete Forever
                </Button>
              }
            >
              {(d.entries || []).filter((e) => e.note || e.number || e.clarification).length > 0 ? (
                (d.entries || [])
                  .filter((e) => e.note || e.number || e.clarification)
                  .map((e, ei) => (
                    <p key={ei} className="font-body text-body text-ch-main opacity-70 whitespace-pre-wrap">
                      {e.note}
                      {e.clarification ? ` — ${e.clarification}` : ''}
                    </p>
                  ))
              ) : (
                <p className="font-body text-body text-ch-main opacity-50">No entries recorded.</p>
              )}
              {d.emailAddress && <p className="font-body text-body text-ch-main opacity-70 mt-2">Email: {d.emailAddress}</p>}
              {d.trackerChecklistLink && (
                <a href={d.trackerChecklistLink} target="_blank" rel="noreferrer" className="font-body text-body text-[#4760FF] underline mt-2 block">
                  Tracker Link
                </a>
              )}
            </Accordion>
          );
        })}
      </div>

      <Modal open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
        <p className="font-heading font-bold text-h6 text-ch-main">Permanently Delete?</p>
        <p className="font-body text-body text-ch-main opacity-70 mt-1">This archived case will be permanently deleted and cannot be recovered.</p>
        <div className="flex gap-2.5 justify-center mt-5">
          <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Yes, Delete Forever
          </Button>
        </div>
      </Modal>

      <Toast msg={toast.msg} type={toast.type} />
    </AppLayout>
  );
}
