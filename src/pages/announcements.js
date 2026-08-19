import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import HeaderQuickActions from '../components/layout/HeaderQuickActions';
import Divider from '../components/ui/Divider';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Toast, { useToast } from '../components/ui/Toast';
import ComposerCard from '../components/announcements/ComposerCard';
import AnnouncementCard from '../components/announcements/AnnouncementCard';
import SearchFilterRow from '../components/announcements/SearchFilterRow';
import { announcementsService } from '../services/announcementsService';
import { useSession } from '../hooks/useSession';

const EMPTY_FORM = { title: '', body: '', badge: 'info' };

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
