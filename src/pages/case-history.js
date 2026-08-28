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
import { useSession } from '../hooks/useSession';
import { casesService } from '../services/casesService';
import downloadCase from '../utils/downloadCase';
import { cls } from '../utils/cls';

const DEVICE_ORDER = [
  ['desktop', 'Desktop'],
  ['tablet', 'Tablet'],
  ['mobile', 'Mobile'],
];

// Figma shows checklist progress as three named step groups with a done/total
// count each (e.g. "First Step: 3/3"). These match the exact grouping and
// item set from the Post-Live Amends Final Checklist wizard step.
const STEP_GROUPS = [
  ['First Step', ['closeSiteComment', 'uploadBackup', 'uploadCaseComment']],
  ['Second Step', ['completeClarify', 'emailRequestor', 'tagStatusTracker']],
  ['Last Step', ['fillCombinedTracker', 'fillQaChecklist']],
];

/** Right panel of an expanded case: devices checklist, final checklist step counts, tracker link, screenshots. */
function CaseDetailCard({ caseRecord, onImageClick }) {
  const c = caseRecord;
  const devices = DEVICE_ORDER.filter(([key]) => c.devices?.[key]);
  const shots = [...(c.images || []), ...(c.backupImages || [])];

  return (
    <div className="bg-ch-secondary border border-ch-border rounded-[5px] shadow-ch p-5 flex flex-col gap-2.5 flex-1 min-w-[280px]">
      <p className="text-[10px] font-label font-bold uppercase text-ch-main">Devices Checklist</p>
      {devices.length === 0 && <p className="font-body text-body text-ch-main opacity-50">—</p>}
      {devices.map(([key, label]) => (
        <p key={key} className="font-body text-body text-ch-main capitalize">
          {label}
        </p>
      ))}

      <Divider className="!bg-white !h-[2px]" />

      <p className="text-[10px] font-label font-bold uppercase text-ch-main">Final Checklist</p>
      {STEP_GROUPS.map(([label, keys]) => {
        const done = keys.filter((k) => c.checklist?.[k]).length;
        return (
          <p key={label} className="font-body text-body text-ch-main">
            <span className="font-bold">{label}:</span> {done}/{keys.length}
          </p>
        );
      })}
      <p className="font-body text-body text-ch-main break-all">
        <span className="font-bold">Tracker Link:</span> {c.trackerChecklistLink || '—'}
      </p>

      <Divider className="!bg-white !h-[2px]" />

      <p className="text-[10px] font-label font-bold uppercase text-ch-main">Screenshots</p>
      {shots.length === 0 ? (
        <p className="font-body text-body text-ch-main opacity-50">No screenshots.</p>
      ) : (
        <div className="flex gap-2.5 flex-wrap">
          {shots.map((img, i) => (
            <button key={i} onClick={() => onImageClick(img.url)} className="w-[222px] h-[222px] max-w-full rounded-ch border border-ch-border shadow-ch overflow-hidden">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** The accordion row: header (case#, badge, description, always-visible Download/Edit buttons, rotating chevron) + expanded detail. */
function CaseAccordion({ caseRecord, entryLabel, isOpen, onToggle, onDownload, onEdit, onImageClick }) {
  const c = caseRecord;
  return (
    <div className="bg-white rounded-ch shadow-ch p-5 w-full flex flex-col gap-2.5">
      <button onClick={onToggle} className="flex items-center justify-between gap-3 w-full text-left">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="font-heading font-bold text-h6 text-ch-main uppercase">
              {c.caseNum} - {c.accountNum}
            </p>
            <CaseTypeBadge caseType={c._mode} complexity={c._caseComplexity} />
          </div>
          <p className="font-body text-body text-ch-main capitalize">
            {c.amendType || 'No amend type'} - {c.savedAt}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={onDownload}>
            Download for Backup
          </Button>
          <Button variant="primary" size="sm" onClick={onEdit}>
            Edit Case
          </Button>
          <button onClick={onToggle} className="w-6 h-6 flex items-center justify-center">
            <Icon name="chevron" size={24} color="#40513B" className={cls('transition-transform', isOpen ? 'rotate-180' : '')} />
          </button>
        </div>
      </button>

      {isOpen && (
        <>
          <Divider tone="secondary" />
          <div className="flex gap-2.5 flex-wrap w-full">
            <CaseSummaryCard caseRecord={c} entryLabel={entryLabel} />
            <CaseDetailCard caseRecord={c} onImageClick={onImageClick} />
          </div>
        </>
      )}
    </div>
  );
}

const EDIT_FIELDS = [
  ['caseNum', 'Case Number'],
  ['accountNum', 'Account Number'],
  ['amendType', 'Amend Type'],
  ['customerName', 'Customer Name'],
  ['customerEmail', 'Customer Email'],
  ['businessName', 'Business Name'],
  ['trackerChecklistLink', 'Tracker Checklist Link'],
];

/**
 * Lightweight editor for a case's core fields. The legacy app's "Edit Case"
 * opens the full Post-Live editor (image upload, entries, device checklist) —
 * that's the same shared editor Post-Live Amends itself uses, so it isn't
 * duplicated here. This covers the fields that are safe to edit standalone.
 */
function CaseEditForm({ caseData, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => {
    const initial = {};
    EDIT_FIELDS.forEach(([key]) => {
      initial[key] = caseData[key] || '';
    });
    return initial;
  });

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EDIT_FIELDS.map(([key, label]) => (
          <div key={key} className="flex flex-col gap-1.5">
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">{label}</p>
            <input
              className="w-full h-[42px] px-3.5 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2.5">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

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
