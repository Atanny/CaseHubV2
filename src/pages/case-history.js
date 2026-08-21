import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import HeaderQuickActions from '../components/layout/HeaderQuickActions';
import Divider from '../components/ui/Divider';
import Pill from '../components/ui/Pill';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Toast, { useToast } from '../components/ui/Toast';
import Accordion from '../components/ui/Accordion';
import CaseEditForm from '../components/cases/CaseEditForm';
import { modeBadgeColor, modeLabel, complexityLabel } from '../components/dashboard/caseHelpers';
import { useSession } from '../hooks/useSession';
import { casesService } from '../services/casesService';
import downloadCase from '../utils/downloadCase';

const FILTERS = [
  ['all', 'All'],
  ['site', 'Site Comment'],
  ['inbound', 'Inbound Email'],
];

export default function CaseHistoryPage() {
  const { user } = useSession();
  const [cases, setCases] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [openId, setOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      setLoadState('loading');
      try {
        const data = await casesService.list(user.email);
        setCases(data);
        setLoadState('ready');
      } catch (e) {
        setLoadState('error');
      }
    })();
  }, [user?.email]);

  const filtered = cases.filter((c) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      c.caseNum?.toLowerCase().includes(q) ||
      c.accountNum?.toLowerCase().includes(q) ||
      c.amendType?.toLowerCase().includes(q) ||
      c.entries?.some((e) => e.note?.toLowerCase().includes(q) || e.clarification?.toLowerCase().includes(q));
    const matchMode = filterMode === 'all' || (filterMode === 'site' && c._mode === 'siteComment') || (filterMode === 'inbound' && c._mode === 'inbound');
    const matchDate = !filterDate || c.savedAt?.includes(filterDate);
    return matchQ && matchMode && matchDate;
  });

  async function saveEdit(id, patch) {
    setSaving(true);
    try {
      const updated = await casesService.update(id, { ...cases.find((c) => c._id === id), ...patch });
      setCases((list) => list.map((c) => (c._id === id ? updated : c)));
      setEditingId(null);
      showToast('Case updated');
    } catch (e) {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await casesService.remove(pendingDelete.id);
      setCases((list) => list.filter((c) => c._id !== pendingDelete.id));
      showToast('Case deleted', 'info');
    } catch (e) {
      showToast('Failed to delete', 'error');
    }
    setPendingDelete(null);
  }

  return (
    <AppLayout>
      <PageHeader title="Case History" subtitle="Where the Cases stored" actions={<HeaderQuickActions />} />
      <Divider className="mb-1" />

      <div className="flex items-center gap-3 w-full flex-wrap">
        <input
          className="flex-1 min-w-[240px] h-[45px] px-4 bg-white rounded-ch shadow-ch outline-none font-body text-body text-ch-main placeholder:opacity-50"
          placeholder="E.G Case #/Assumption/Email/Account # / NOB"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="h-[45px] px-4 bg-white rounded-ch shadow-ch outline-none font-body text-body text-ch-main"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(([v, l]) => (
          <Pill key={v} active={filterMode === v} onClick={() => setFilterMode(v)}>
            {l}
          </Pill>
        ))}
        {(search || filterDate || filterMode !== 'all') && (
          <Pill active={false} onClick={() => { setSearch(''); setFilterDate(''); setFilterMode('all'); }}>
            ✕ Clear
          </Pill>
        )}
      </div>

      <div className="flex flex-col gap-2.5 w-full">
        {loadState === 'error' && (
          <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-red">Couldn&apos;t load cases.</div>
        )}
        {loadState === 'ready' && filtered.length === 0 && (
          <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">
            {cases.length === 0 ? 'No cases yet — complete and save a Post-Live Amend to see it here.' : 'No results — try adjusting your search or filters.'}
          </div>
        )}

        {filtered.map((c, i) => {
          const key = c._id || i;
          const isOpen = openId === key;
          const isEditing = editingId === key;
          return (
            <Accordion
              key={key}
              isOpen={isOpen}
              onToggle={() => setOpenId(isOpen ? null : key)}
              header={
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-heading font-bold text-h6 text-ch-main">
                      {c.caseNum || '—'} - {c.accountNum || '—'}
                    </p>
                    <span
                      className="px-2.5 py-1 rounded-full text-white text-badge font-label font-bold uppercase whitespace-nowrap"
                      style={{ background: modeBadgeColor(c._mode) }}
                    >
                      {modeLabel(c._mode)} - {complexityLabel(c._caseComplexity)}
                    </span>
                  </div>
                  <p className="font-body text-body text-ch-main opacity-60">
                    {c.amendType || '—'} · {c.savedAt}
                  </p>
                </div>
              }
              actions={
                <>
                  <Button variant="outline" size="sm" onClick={() => downloadCase(c)}>
                    Download
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingId(isEditing ? null : key);
                      setOpenId(key);
                    }}
                  >
                    {isEditing ? 'Close Edit' : 'Edit Case'}
                  </Button>
                  <Button variant="outline" size="sm" className="!border-ch-red !text-ch-red" onClick={() => setPendingDelete({ id: c._id, caseNum: c.caseNum })}>
                    Delete
                  </Button>
                </>
              }
            >
              {isEditing ? (
                <CaseEditForm caseData={c} saving={saving} onCancel={() => setEditingId(null)} onSave={(patch) => saveEdit(key, patch)} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-ch-secondary rounded-ch p-4 flex flex-col gap-1.5">
                    <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Account Number</p>
                    <p className="font-body text-body text-ch-main">{c.accountNum || '—'}</p>
                    <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mt-2">Case Number</p>
                    <p className="font-body text-body text-ch-main">{c.caseNum || '—'}</p>
                    <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mt-2">Amend Type</p>
                    <p className="font-body text-body text-ch-main">{c.amendType || '—'}</p>
                    <Divider tone="secondary" className="my-2 !bg-white" />
                    {(c.entries || [])
                      .filter((e) => e.note || e.clarification)
                      .map((e, ei) => (
                        <p key={ei} className="font-body text-body text-ch-main opacity-70 whitespace-pre-wrap">
                          {e.note}
                          {e.clarification ? ` — ${e.clarification}` : ''}
                        </p>
                      ))}
                    {c.trackerChecklistLink && (
                      <a href={c.trackerChecklistLink} target="_blank" rel="noopener noreferrer" className="font-body text-body text-[#4760FF] break-all underline mt-2">
                        {c.trackerChecklistLink}
                      </a>
                    )}
                  </div>
                  <div className="bg-ch-secondary rounded-ch p-4 flex flex-col gap-1.5">
                    <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Devices Checklist</p>
                    {Object.keys(c.devices || {}).filter((k) => c.devices[k]).length > 0 ? (
                      Object.entries(c.devices)
                        .filter(([, v]) => v)
                        .map(([k]) => (
                          <p key={k} className="font-body text-body text-ch-main">
                            {k}
                          </p>
                        ))
                    ) : (
                      <p className="font-body text-body text-ch-main opacity-50">—</p>
                    )}
                    <Divider tone="secondary" className="my-2 !bg-white" />
                    <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Screenshots</p>
                    <div className="flex gap-2 flex-wrap">
                      {[...(c.images || []), ...(c.backupImages || [])].map((img, ii) => (
                        <div key={ii} className="w-16 h-16 rounded-ch overflow-hidden cursor-pointer" onClick={() => setLightboxImg(img.url)}>
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Accordion>
          );
        })}
      </div>

      {lightboxImg && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-6" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Screenshot" className="max-w-full max-h-full rounded-ch" />
        </div>
      )}

      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)}>
        <p className="font-heading font-bold text-h6 text-ch-main">Delete Case?</p>
        <p className="font-body text-body text-ch-main opacity-70 mt-1">
          Case #{pendingDelete?.caseNum} will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-2.5 justify-center mt-5">
          <Button variant="outline" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      <Toast msg={toast.msg} type={toast.type} />
    </AppLayout>
  );
}
