import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import HeaderQuickActions from '../components/HeaderQuickActions';
import Divider from '../components/Divider';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Toast, { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import SearchDateBar from '../components/SearchDateBar';
import SessionRow, { SessionRowHeader } from '../components/SessionRow';
import { cls } from '../utils/cls';
import { useSession } from '../hooks/useSession';
import { sessionsService } from '../services/sessionsService';
import { ROUTES } from '../constants/routes';

function fmtDayLabel(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function fmtClock(ts) {
  return ts ? new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—';
}
function fmtTotalHours(start, end) {
  if (!start) return '—';
  const hrs = Math.round(((end ? new Date(end) : new Date()) - new Date(start)) / 3600000);
  return `${hrs} Hour${hrs !== 1 ? 's' : ''}`;
}

export default function SessionLogPage() {
  const { user } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [openDay, setOpenDay] = useState(null);
  const [deleteDay, setDeleteDay] = useState(null);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      setLoadState('loading');
      try {
        const data = await sessionsService.list({ email: user.email, date });
        setSessions(Array.isArray(data) ? data : []);
        setLoadState('ready');
      } catch (e) {
        setLoadState('error');
      }
    })();
  }, [user?.email, date]);

  const dayGroups = (() => {
    const map = {};
    sessions.forEach((s) => {
      if (!s.time_in) return;
      const dateKey = new Date(s.time_in).toDateString();
      if (!map[dateKey]) map[dateKey] = { dateKey, sessions: [], firstIn: s.time_in, lastOut: s.time_out };
      map[dateKey].sessions.push(s);
      if (new Date(s.time_in) < new Date(map[dateKey].firstIn)) map[dateKey].firstIn = s.time_in;
      if (!map[dateKey].lastOut || (s.time_out && new Date(s.time_out) > new Date(map[dateKey].lastOut))) map[dateKey].lastOut = s.time_out;
    });
    return Object.values(map)
      .map((g) => ({ ...g, cases: g.sessions.flatMap((s) => s.session_cases || []) }))
      .filter((g) => !search || g.cases.some((c) => (c.case_num || '').toLowerCase().includes(search.toLowerCase())))
      .sort((a, b) => new Date(b.firstIn) - new Date(a.firstIn));
  })();

  async function confirmDeleteDay() {
    if (!deleteDay) return;
    try {
      await Promise.all(deleteDay.sessionIds.map((id) => sessionsService.remove(id)));
      setSessions((s) => s.filter((x) => !deleteDay.sessionIds.includes(x.id)));
      showToast('Session deleted');
    } catch (e) {
      showToast('Failed to delete', 'error');
    }
    setDeleteDay(null);
  }

  return (
    <AppLayout>
      <PageHeader title="Session Logs" subtitle="Check your Time History" actions={<HeaderQuickActions />} />
      <Divider className="mb-1" />

      <SearchDateBar placeholder="E.G Case # / Account #" search={search} onSearch={setSearch} date={date} onDate={setDate} />

      <div className="flex flex-col gap-2.5 w-full">
        {loadState === 'loading' && <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">Loading sessions…</div>}
        {loadState === 'error' && <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-red">Couldn&apos;t load sessions.</div>}
        {loadState === 'ready' && dayGroups.length === 0 && (
          <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">No sessions found for this date.</div>
        )}

        {dayGroups.map((g) => {
          const isOpen = openDay === g.dateKey;
          return (
            <div key={g.dateKey} className="bg-white rounded-ch shadow-ch p-5 w-full flex flex-col gap-2.5">
              <button onClick={() => setOpenDay(isOpen ? null : g.dateKey)} className="flex items-center justify-between gap-3 w-full text-left">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-heading font-bold text-h6 text-ch-main uppercase">{fmtDayLabel(g.firstIn)}</p>
                    <span className="px-2.5 py-1 rounded-full border border-white text-badge font-label font-bold uppercase whitespace-nowrap bg-ch-secondary text-ch-main">
                      {g.cases.length} Cases
                    </span>
                  </div>
                  <p className="font-body text-body text-ch-main">
                    <span className="font-bold">Total:</span> {fmtTotalHours(g.firstIn, g.lastOut)} | {fmtClock(g.firstIn)} - {fmtClock(g.lastOut)}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="!border-ch-red !text-ch-red" onClick={() => setDeleteDay({ dateKey: g.dateKey, label: fmtDayLabel(g.firstIn), sessionIds: g.sessions.map((s) => s.id) })}>
                    Delete Session
                  </Button>
                  <button onClick={() => setOpenDay(isOpen ? null : g.dateKey)} className="w-6 h-6 flex items-center justify-center">
                    <Icon name="chevron" size={24} color="#40513B" className={cls('transition-transform', isOpen ? 'rotate-180' : '')} />
                  </button>
                </div>
              </button>

              {isOpen && (
                <>
                  <Divider tone="secondary" />
                  {g.cases.length === 0 ? (
                    <div className="w-full bg-ch-secondary rounded-ch p-4 text-center font-body text-body text-ch-main opacity-60">No cases logged this day.</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <SessionRowHeader />
                      {g.cases.map((c, ci) => (
                        <SessionRow key={c.id || ci} row={c} onView={() => router.push(ROUTES.history)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={!!deleteDay} onClose={() => setDeleteDay(null)}>
        <p className="font-heading font-bold text-h6 text-ch-main">Would you like to delete the session &ldquo;{deleteDay?.label}&rdquo;</p>
        <p className="font-body text-body text-ch-main opacity-70 mt-1">Deleting will never be reverted again</p>
        <div className="flex gap-2.5 justify-center mt-5">
          <Button variant="primary" onClick={confirmDeleteDay}>
            Yes, Delete
          </Button>
          <Button variant="outline" onClick={() => setDeleteDay(null)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Toast msg={toast.msg} type={toast.type} />
    </AppLayout>
  );
}
