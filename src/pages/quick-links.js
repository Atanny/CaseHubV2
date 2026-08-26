import { useEffect, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import HeaderQuickActions from '../components/HeaderQuickActions';
import Divider from '../components/Divider';
import Button from '../components/Button';
import Toast, { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import { useSession } from '../hooks/useSession';
import { linksService } from '../services/linksService';
import { cls } from '../utils/cls';

const ICONS = ['📣', '📧', '🏷️', '🚩', '📘', '🧭', '🎵', '📄', '🔖', '🗂️'];
const EMPTY_FORM = { title: '', url: '', icon: ICONS[0] };

export default function QuickLinksPage() {
  const { user } = useSession();
  const [links, setLinks] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [sortAZ, setSortAZ] = useState(true);
  const [toast, showToast] = useToast();
  const dragRef = useRef(null);
  const [dragActive, setDragActive] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      setLoadState('loading');
      try {
        setLinks(await linksService.list(user.email));
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
      showToast('Title and Link required', 'error');
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

  async function remove(id) {
    try {
      await linksService.remove(id);
      setLinks((list) => list.filter((l) => l.id !== id));
      if (editing === id) {
        setEditing(null);
        resetForm();
      }
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
  }

  const visible = links
    .filter((l) => !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.url.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sortAZ ? a.title.localeCompare(b.title) : 0));

  return (
    <AppLayout customLinks={links.map((l) => ({ id: l.id, title: l.title, url: l.url, icon: l.icon }))}>
      <PageHeader title="Quick Links" subtitle="View and Manage Links" actions={<HeaderQuickActions />} />
      <Divider className="mb-1" />

      <div className="flex items-stretch bg-white rounded-ch shadow-ch w-full max-w-[870px] h-[55px] overflow-hidden">
        <div className="flex items-center gap-2 flex-1 px-6">
          <Icon name="search" size={20} color="#40513B" />
          <input
            className="flex-1 min-w-0 outline-none font-body text-body text-ch-main placeholder:opacity-50"
            placeholder="E.G Name/Link"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setSortAZ((s) => !s)} className="flex items-center px-6 border-l border-ch-secondary font-body text-body text-ch-main">
          {sortAZ ? 'a-z' : 'unsorted'}
        </button>
      </div>

      <div className="flex gap-2.5 items-start w-full flex-wrap">
        <div className="flex flex-col gap-3 items-start bg-white rounded-ch shadow-ch p-5 w-full max-w-[402px]">
          <p className="font-heading font-bold text-h6 text-ch-main">Create post</p>
          <Divider tone="secondary" />

          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Icon</p>
          <div className="grid grid-cols-7 gap-1.5">
            {ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                className={cls('flex items-center justify-center w-9 h-9 rounded-ch text-lg border', form.icon === ic ? 'bg-ch-main border-ch-main' : 'bg-ch-secondary border-transparent')}
              >
                {ic}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Title</p>
          <input
            className="w-full h-[52px] px-4 bg-ch-secondary rounded-ch-lg outline-none font-body text-body text-ch-main placeholder:opacity-50"
            placeholder="Title here"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />

          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Link</p>
          <input
            className="w-full h-[52px] px-4 bg-ch-secondary rounded-ch-lg outline-none font-body text-body text-ch-main placeholder:opacity-50"
            placeholder="insert link here"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />

          <Divider tone="secondary" />
          <div className="flex gap-2.5 w-full">
            <Button variant="outline" onClick={editing ? () => { setEditing(null); resetForm(); } : resetForm}>
              {editing ? 'Cancel' : 'Remove Fill'}
            </Button>
            <Button variant="primary" className="flex-1" onClick={submit}>
              {editing ? 'Save Changes' : 'Add Link'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 flex-1 min-w-[320px] bg-white rounded-ch shadow-ch p-5">
          {loadState === 'ready' && visible.length === 0 && (
            <p className="font-body text-body text-ch-main opacity-60 text-center py-6">No links yet — add one to have it appear in the sidebar.</p>
          )}
          {visible.map((l) => {
            const i = links.indexOf(l);
            return (
              <div
                key={l.id}
                draggable
                onDragStart={() => {
                  dragRef.current = i;
                  setDragActive(i);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => {
                  dragRef.current = null;
                  setDragActive(null);
                }}
                style={{ opacity: dragActive === i ? 0.25 : 1 }}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="flex items-center justify-center w-11 h-11 rounded-ch bg-ch-secondary text-xl shrink-0">{l.icon || '🔗'}</span>
                  <div className="min-w-0">
                    <p className="font-body text-body font-bold text-ch-main truncate">{l.title}</p>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="font-body text-body text-ch-main opacity-60 truncate block">
                      {l.url}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => startEdit(l)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="!border-ch-red !text-ch-red" onClick={() => remove(l.id)}>
                    Delete
                  </Button>
                  <span className="cursor-grab px-1 opacity-50">
                    <Icon name="links" size={14} color="#40513B" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </AppLayout>
  );
}
