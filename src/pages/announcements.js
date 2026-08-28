import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import HeaderQuickActions from '../components/HeaderQuickActions';
import Divider from '../components/Divider';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Toast, { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import Pill from '../components/Pill';
import { announcementsService } from '../services/announcementsService';
import { useSession } from '../hooks/useSession';

const EMPTY_FORM = { title: '', body: '', badge: 'info' };
const BADGE_OPTIONS = [
  ['info', 'Info'],
  ['update', 'Update'],
  ['urgent', 'Urgent'],
];
const FILTER_OPTIONS = [
  ['all', 'All'],
  ['update', 'Updates'],
  ['info', 'Announcements'],
];

function badgeColor(badge) {
  if (badge === 'urgent') return '#C54446';
  if (badge === 'update') return '#40513B';
  return '#4760FF';
}
function badgeLabel(badge) {
  if (badge === 'urgent') return 'Urgent';
  if (badge === 'update') return 'Update';
  return 'Announcement';
}
function initialsOf(name) {
  return (name || '?')
    .split(' ')
    .map((w) => w && w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Search input (left) + filter pills (right), matching the Figma search row. */
function SearchFilterRow({ search, setSearch, filter, setFilter }) {
  return (
    <div className="flex items-center justify-between gap-3 w-full flex-wrap">
      <div className="flex items-center gap-2.5 bg-white rounded-ch shadow-ch px-4 h-[45px] flex-1 min-w-[220px] max-w-[360px]">
        <Icon name="search" size={16} color="#40513B" />
        <input
          className="flex-1 min-w-0 outline-none font-body text-body text-ch-main placeholder:opacity-50"
          placeholder="Search Announcement"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_OPTIONS.map(([v, l]) => (
          <Pill key={v} active={filter === v} onClick={() => setFilter(v)}>
            {l}
          </Pill>
        ))}
      </div>
    </div>
  );
}

/** Single feed card: avatar + author + badge chip (+ edit/delete for the author), title, body, date. */
function AnnouncementCard({ announcement, isAuthor, onEdit, onDelete }) {
  const a = announcement;
  return (
    <div className="flex flex-col gap-3 items-start bg-white rounded-ch shadow-ch p-5 w-full">
      <div className="flex items-center gap-2.5 w-full">
        <div className="flex items-center justify-center w-[41px] h-[41px] rounded-full bg-ch-secondary text-ch-main font-body font-bold text-sm shrink-0">
          {initialsOf(a.author)}
        </div>
        <p className="font-heading font-bold text-h6 text-ch-main flex-1 min-w-0 truncate">{a.author}</p>
        <span
          className="px-2.5 py-1 rounded-full text-white text-badge font-label font-bold uppercase whitespace-nowrap"
          style={{ background: badgeColor(a.badge) }}
        >
          {badgeLabel(a.badge)}
        </span>
        {isAuthor && (
          <>
            <Button variant="outline" size="sm" onClick={() => onEdit(a)}>
              Edit
            </Button>
            <Button variant="outline" size="sm" className="!border-ch-red !text-ch-red" onClick={() => onDelete(a.id)}>
              Delete
            </Button>
          </>
        )}
      </div>
      <Divider tone="secondary" />
      <p className="font-heading font-bold text-h6 text-ch-main">{a.title}</p>
      {a.body && <p className="font-body text-body text-ch-main whitespace-pre-wrap">{a.body}</p>}
      <p className="font-body text-body text-ch-main opacity-60">
        {a.createdAt} — {badgeLabel(a.badge)}
      </p>
    </div>
  );
}

/**
 * Left-column "Create post" / "Edit Post" panel. Fields map 1:1 to the real
 * data model (title, body, badge) — the Figma mockup shows rich-text
 * formatting and image attachments that have no backing field, so those are
 * intentionally left out rather than faked. See README for the same call
 * made in the legacy app.
 */
function ComposerCard({ form, setForm, isEditing, onSubmit, onCancel, saving }) {
  return (
    <div className="flex flex-col gap-3 items-start bg-white rounded-ch shadow-ch p-5 w-full max-w-[360px]">
      <p className="font-heading font-bold text-h6 text-ch-main">{isEditing ? 'Edit Post' : 'Create post'}</p>
      <Divider tone="secondary" />

      <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Title</p>
      <input
        className="w-full h-[45px] px-4 bg-ch-secondary rounded-ch-lg outline-none font-body text-body text-ch-main placeholder:opacity-50"
        placeholder="Title here"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />

      <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Type</p>
      <div className="flex flex-wrap gap-2">
        {BADGE_OPTIONS.map(([v, l]) => (
          <Pill key={v} active={form.badge === v} onClick={() => setForm((f) => ({ ...f, badge: v }))}>
            {l}
          </Pill>
        ))}
      </div>

      <textarea
        className="w-full min-h-[140px] p-4 bg-ch-secondary rounded-ch-lg outline-none resize-y font-body text-body text-ch-main placeholder:opacity-50"
        placeholder="Insert Message Here"
        value={form.body}
        onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
      />

      <Divider tone="secondary" />
      <div className="flex gap-2.5 w-full">
        <Button variant="outline" className="flex-1 !border-ch-red !text-ch-red" onClick={onCancel} disabled={saving}>
          {isEditing ? 'Cancel' : 'Remove Fill'}
        </Button>
        <Button variant="primary" className="flex-1" onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Post'}
        </Button>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const { user } = useSession();
  const [announcements, setAnnouncements] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // id being edited, or null when creating
  const [deleteTarget, setDeleteTarget] = useState(null); // id pending delete confirmation
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, showToast] = useToast();

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await announcementsService.list();
      setAnnouncements(data);
      setLoadState('ready');
    } catch (e) {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function startEdit(a) {
    setEditTarget(a.id);
    setForm({ title: a.title, body: a.body || '', badge: a.badge || 'info' });
  }

  function cancelEdit() {
    setEditTarget(null);
    resetForm();
  }

  async function submit() {
    if (!form.title.trim()) {
      showToast('Title required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await announcementsService.update(editTarget, form);
        setAnnouncements((list) => list.map((a) => (a.id === editTarget ? updated : a)));
        showToast('Announcement updated');
      } else {
        const created = await announcementsService.create({
          ...form,
          author: user?.name,
          createdAt: new Date().toLocaleDateString(),
        });
        setAnnouncements((list) => [created, ...list]);
        showToast('Announcement posted!');
      }
      resetForm();
      setEditTarget(null);
    } catch (e) {
      showToast('Failed to save — check connection', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await announcementsService.remove(deleteTarget);
      setAnnouncements((list) => list.filter((a) => a.id !== deleteTarget));
      showToast('Removed', 'info');
    } catch (e) {
      showToast('Failed to delete', 'error');
    }
    setDeleteTarget(null);
  }

  const isAuthor = (a) => a.author && user?.name && a.author === user.name;

  const filtered = announcements.filter((a) => {
    const matchQ =
      !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.body?.toLowerCase().includes(search.toLowerCase());
    const matchF = filter === 'all' || a.badge === filter || (filter === 'info' && (!a.badge || a.badge === 'info'));
    return matchQ && matchF;
  });

  return (
    <AppLayout>
      <PageHeader
        title="Updates & Announcement"
        subtitle="View and Manage latest announcement"
        actions={<HeaderQuickActions />}
      />
      <Divider className="mb-1" />

      <SearchFilterRow search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} />

      <div className="flex gap-2.5 items-start w-full flex-wrap">
        <ComposerCard
          form={form}
          setForm={setForm}
          isEditing={!!editTarget}
          onSubmit={submit}
          onCancel={editTarget ? cancelEdit : resetForm}
          saving={saving}
        />

        <div className="flex flex-col gap-2.5 flex-1 min-w-[320px]">
          {loadState === 'loading' && (
            <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">
              Loading announcements…
            </div>
          )}
          {loadState === 'error' && (
            <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-red">
              Couldn&apos;t load announcements.{' '}
              <button className="underline" onClick={load}>
                Retry
              </button>
            </div>
          )}
          {loadState === 'ready' && filtered.length === 0 && (
            <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">
              {announcements.length === 0
                ? 'No announcements — post one to inform your team!'
                : 'No results — try adjusting your search or filter.'}
            </div>
          )}
          {loadState === 'ready' &&
            filtered.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                isAuthor={isAuthor(a)}
                onEdit={startEdit}
                onDelete={setDeleteTarget}
              />
            ))}
        </div>
      </div>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <p className="font-heading font-bold text-h6 text-ch-main">Delete Announcement?</p>
        <p className="font-body text-body text-ch-main opacity-70 mt-1">This will be permanently removed.</p>
        <div className="flex gap-2.5 justify-center mt-5">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
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
