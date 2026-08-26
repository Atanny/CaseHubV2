import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import HeaderQuickActions from '../components/HeaderQuickActions';
import Divider from '../components/Divider';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Toast, { useToast } from '../components/Toast';
import SearchDateBar from '../components/SearchDateBar';
import RadioFilterList from '../components/RadioFilterList';
import CaseAccordion from '../components/CaseAccordion';
import CaseEditForm from '../components/CaseEditForm';
import { useSession } from '../hooks/useSession';
import { casesService } from '../services/casesService';
import downloadCase from '../utils/downloadCase';

const FILTERS = [
  ['all', 'All'],
  ['siteComment', 'Site Comment'],
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
        setCases(await casesService.list(user.email));
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
      c.entries?.some((e) => (e.notes || e.note)?.toLowerCase().includes(q) || e.clarification?.toLowerCase().includes(q));
    const matchMode = filterMode === 'all' || c._mode === filterMode;
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

      <SearchDateBar placeholder="E.G Case #/Assumption/Email/Account # / NOB" search={search} onSearch={setSearch} date={filterDate} onDate={setFilterDate} />
      <RadioFilterList options={FILTERS} value={filterMode} onChange={setFilterMode} />

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
          const entryLabel = c._mode === 'inbound' ? 'Assumptions' : 'Site Comments';

          if (isEditing) {
            return (
              <div key={key} className="bg-white rounded-ch shadow-ch p-5 w-full">
                <CaseEditForm caseData={c} saving={saving} onCancel={() => setEditingId(null)} onSave={(patch) => saveEdit(key, patch)} />
              </div>
            );
          }

          return (
            <CaseAccordion
              key={key}
              caseRecord={c}
              entryLabel={entryLabel}
              isOpen={isOpen}
              onToggle={() => setOpenId(isOpen ? null : key)}
              onDownload={() => downloadCase(c)}
              onEdit={() => {
                setEditingId(key);
                setOpenId(key);
              }}
              onImageClick={setLightboxImg}
            />
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
