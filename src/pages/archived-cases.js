import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import HeaderQuickActions from '../components/HeaderQuickActions';
import Divider from '../components/Divider';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Toast, { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import SearchDateBar from '../components/SearchDateBar';
import RadioFilterList from '../components/RadioFilterList';
import CaseTypeBadge from '../components/CaseTypeBadge';
import CaseSummaryCard from '../components/CaseSummaryCard';
import { cls } from '../utils/cls';
import { useSession } from '../hooks/useSession';
import { archivedDraftsService } from '../services/archivedDraftsService';

const FILTERS = [
  ['all', 'All'],
  ['siteComment', 'Site Comment'],
  ['inbound', 'Inbound Email'],
];

export default function ArchivedCasesPage() {
  const { user } = useSession();
  const [drafts, setDrafts] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [openId, setOpenId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      setLoadState('loading');
      try {
        setDrafts(await archivedDraftsService.list(user.email));
        setLoadState('ready');
      } catch (e) {
        setLoadState('error');
      }
    })();
  }, [user?.email]);

  const filtered = drafts.filter((d) => {
    const q = search.toLowerCase();
    const matchQ = !q || d.caseNum?.toLowerCase().includes(q) || d.accountNum?.toLowerCase().includes(q) || d.amendType?.toLowerCase().includes(q);
    const matchMode = filterMode === 'all' || d._mode === filterMode;
    const matchDate = !filterDate || d.archivedAt?.includes(filterDate);
    return matchQ && matchMode && matchDate;
  });

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
      <PageHeader title="Archived Cases" subtitle="Manage Archived Cases" actions={<HeaderQuickActions />} />
      <Divider className="mb-1" />

      <SearchDateBar placeholder="E.G Case #/Assumption/Email/Account # / NOB" search={search} onSearch={setSearch} date={filterDate} onDate={setFilterDate} />
      <RadioFilterList options={FILTERS} value={filterMode} onChange={setFilterMode} />

      <div className="flex flex-col gap-2.5 w-full">
        {loadState === 'error' && (
          <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-red">Couldn&apos;t load archived cases.</div>
        )}
        {loadState === 'ready' && filtered.length === 0 && (
          <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">
            {drafts.length === 0 ? 'No archived cases yet. When you archive a suspended case it will appear here.' : 'No results — try adjusting your search or filters.'}
          </div>
        )}

        {filtered.map((d, i) => {
          const key = d._id || i;
          const isOpen = openId === key;
          const entryLabel = d._mode === 'inbound' ? 'Assumptions' : 'Site Comments';
          return (
            <div key={key} className="bg-white rounded-ch shadow-ch p-5 w-full flex flex-col gap-2.5">
              <button onClick={() => setOpenId(isOpen ? null : key)} className="flex items-center justify-between gap-3 w-full text-left">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-heading font-bold text-h6 text-ch-main uppercase">
                      {d.caseNum || '—'} - {d.accountNum || '—'}
                    </p>
                    <CaseTypeBadge caseType={d._mode} complexity={d._caseComplexity} />
                  </div>
                  <p className="font-body text-body text-ch-main capitalize">
                    {d.amendType || 'No amend type'} - Archived {d.archivedAt}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="!border-ch-red !text-ch-red" onClick={() => setConfirmDeleteId(key)}>
                    Delete Forever
                  </Button>
                  <button onClick={() => setOpenId(isOpen ? null : key)} className="w-6 h-6 flex items-center justify-center">
                    <Icon name="chevron" size={24} color="#40513B" className={cls('transition-transform', isOpen ? 'rotate-180' : '')} />
                  </button>
                </div>
              </button>

              {isOpen && (
                <>
                  <Divider tone="secondary" />
                  <CaseSummaryCard caseRecord={d} entryLabel={entryLabel} />
                </>
              )}
            </div>
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
