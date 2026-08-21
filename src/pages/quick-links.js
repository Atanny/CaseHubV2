import { useEffect, useRef, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import HeaderQuickActions from '../components/layout/HeaderQuickActions';
import Divider from '../components/ui/Divider';
import Button from '../components/ui/Button';
import Toast, { useToast } from '../components/ui/Toast';
import Icon from '../components/icons/Icon';
import { useSession } from '../hooks/useSession';
import { linksService } from '../services/linksService';
import { cls } from '../utils/cls';

const ICONS = ['🔗', '📧', '🏅', '🚩', '📘', '🧭', '🎵', '📄', '🔖', '🗂️', '🏠', '🎯', '🧩'];
const EMPTY_FORM = { title: '', url: '', icon: ICONS[0] };

export default function QuickLinksPage() {
  const { user } = useSession();
  const [links, setLinks] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, showToast] = useToast();
  const dragRef = useRef(null);
  const [dragActive, setDragActive] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      setLoadState('loading');
      try {
        const data = await linksService.list(user.email);
        setLinks(data);
        setLoadState('ready');
      } catch (e) {
        setLoadState('error');
      }
    })();
  }, [user?.email]);

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  async function submit() {
    if (!form.title.trim() || !form.url.trim()) {
      showToast('Title and URL required', 'error');
      return;
    }
    let url = form.url.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    try {
      if (editing) {
        const updated = await linksService.update(editing, { ...form, url });
        setLinks((list) => list.map((l) => (l.id === editing ? updated : l)));
        showToast('Link updated');
      } else {
        const created = await linksService.create({ ...form, url, userEmail: user.email });
        setLinks((list) => [...list, created]);
        showToast('Link added!');
      }
      resetForm();
      setEditing(null);
    } catch (e) {
      showToast('Failed to save', 'error');
    }
  }

  function startEdit(l) {
    setEditing(l.id);
    setForm({ title: l.title, url: l.url, icon: l.icon || ICONS[0] });
  }
  function cancelEdit() {
    setEditing(null);
    resetForm();
  }

  async function remove(id) {
    try {
      await linksService.remove(id);
      setLinks((list) => list.filter((l) => l.id !== id));
      if (editing === id) cancelEdit();
      showToast('Link removed', 'info');
    } catch (e) {
      showToast('Failed to remove', 'error');
    }
  }

  function handleDrop(i) {
    const from = dragRef.current;
    if (from != null && from !== i) {
      const arr = [...links];
      const [moved] = arr.splice(from, 1);
      arr.splice(i, 0, moved);
      setLinks(arr);
    }
    dragRef.current = null;
    setDragActive(null);
    setDragOver(null);
  }

  return (
    <AppLayout customLinks={links.map((l) => ({ id: l.id, title: l.title, url: l.url, icon: l.icon }))}>
      <PageHeader title="Quick Links" subtitle="Custom links shown in the sidebar" actions={<HeaderQuickActions />} />
      <Divider className="mb-1" />

      <div className="flex gap-2.5 items-start w-full flex-wrap">
        <div className="flex flex-col gap-3 items-start bg-white rounded-ch shadow-ch p-5 w-full max-w-[360px]">
          <p className="font-heading font-bold text-h6 text-ch-main">{editing ? 'Edit Link' : 'Create Link'}</p>
          <Divider tone="secondary" />

          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Icon</p>
          <div className="grid grid-cols-7 gap-1.5">
            {ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                className={cls(
                  'flex items-center justify-center w-9 h-9 rounded-ch text-lg border',
                  form.icon === ic ? 'bg-ch-main border-ch-main' : 'bg-ch-secondary border-transparent'
                )}
              >
                {ic}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Title</p>
          <input
            className="w-full h-[45px] px-4 bg-ch-secondary rounded-ch-lg outline-none font-body text-body text-ch-main placeholder:opacity-50"
            placeholder="Title here"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />

          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Link</p>
          <input
            className="w-full h-[45px] px-4 bg-ch-secondary rounded-ch-lg outline-none font-body text-body text-ch-main placeholder:opacity-50"
            placeholder="insert link here"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />

          <Divider tone="secondary" />
          <div className="flex gap-2.5 w-full">
            <Button variant="outline" className="flex-1 !border-ch-red !text-ch-red" onClick={editing ? cancelEdit : resetForm}>
              {editing ? 'Cancel' : 'Remove Fill'}
            </Button>
            <Button variant="primary" className="flex-1" onClick={submit}>
              {editing ? 'Save Changes' : 'Add Link'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 flex-1 min-w-[320px]">
          {loadState === 'ready' && links.length === 0 && (
            <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">
              No links yet — add one to have it appear in the sidebar.
            </div>
          )}
          {links.map((l, i) => (
            <div key={l.id}>
              {dragOver === i && dragActive !== i && (
                <div className="flex items-center gap-2 px-4 py-2 mb-2 rounded-ch border-2 border-dashed border-ch-main text-ch-main font-body text-body">
                  <Icon name="links" size={14} color="#40513B" />
                  Drop here
                </div>
              )}
              <div
                draggable
                onDragStart={() => {
                  dragRef.current = i;
                  setDragActive(i);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOver !== i) setDragOver(i);
                }}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => {
                  dragRef.current = null;
                  setDragActive(null);
                  setDragOver(null);
                }}
                style={{ opacity: dragActive === i ? 0.25 : 1 }}
                className="flex items-center justify-between gap-3 bg-white rounded-ch shadow-ch p-4 cursor-grab"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-ch bg-ch-secondary text-lg shrink-0">{l.icon || '🔗'}</div>
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-h6 text-ch-main">{l.title}</p>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="font-body text-body text-ch-main opacity-60 underline break-all">
                      {l.url}
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => startEdit(l)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => remove(l.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </AppLayout>
  );
}
