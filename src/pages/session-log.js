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
import { sessionsService } from '../services/sessionsService';

function fmtTime(ts) {
  return ts ? new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
}
function fmtDur(start, end) {
  if (!start) return '—';
  const ms = (end ? new Date(end) : new Date()) - new Date(start);
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}
function fmtDayLabel(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function SessionLogPage() {
  const { user } = useSession();
  const [sessions, setSessions] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
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

      <div className="flex items-center gap-3 w-full flex-wrap">
        <input
          className="flex-1 min-w-[240px] h-[45px] px-4 bg-white rounded-ch shadow-ch outline-none font-body text-body text-ch-main placeholder:opacity-50"
          placeholder="E.G Case # / Account #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="h-[45px] px-4 bg-white rounded-ch shadow-ch outline-none font-body text-body text-ch-main"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2.5 w-full">
        {loadState === 'loading' && (
          <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">Loading sessions…</div>
        )}
        {loadState === 'error' && (
          <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-red">Couldn&apos;t load sessions.</div>
        )}
        {loadState === 'ready' && dayGroups.length === 0 && (
          <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">No sessions found for this date.</div>
        )}

        {dayGroups.map((g) => {
          const isOpen = openDay === g.dateKey;
          return (
            <Accordion
              key={g.dateKey}
              isOpen={isOpen}
              onToggle={() => setOpenDay(isOpen ? null : g.dateKey)}
              header={
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-heading font-bold text-h6 text-ch-main">{fmtDayLabel(g.firstIn)}</p>
                    <span className="px-2.5 py-1 rounded-full text-white text-badge font-label font-bold uppercase whitespace-nowrap bg-ch-main">
                      {g.cases.length} Case{g.cases.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="font-body text-body text-ch-main opacity-60">
                    <b>Total:</b> {fmtDur(g.firstIn, g.lastOut)} | {fmtTime(g.firstIn)} - {fmtTime(g.lastOut)}
                  </p>
                </div>
              }
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  className="!border-ch-red !text-ch-red"
                  onClick={() => setDeleteDay({ dateKey: g.dateKey, sessionIds: g.sessions.map((s) => s.id) })}
                >
                  Delete Session
                </Button>
              }
            >
              {g.cases.length === 0 ? (
                <div className="w-full bg-ch-secondary rounded-ch p-4 text-center font-body text-body text-ch-main opacity-60">No cases logged this day.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body text-body text-ch-main">
                    <thead>
                      <tr className="opacity-60">
                        {['Case Type', 'Case Number', 'Duration', 'Status'].map((h) => (
                          <th key={h} className="pb-2 pr-4 text-[10px] font-label font-bold uppercase">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {g.cases.map((c, ci) => (
                        <tr key={c.id || ci} className="border-t border-ch-secondary">
                          <td className="py-2 pr-4">
                            <span
                              className="px-2.5 py-1 rounded-full text-white text-badge font-label font-bold uppercase whitespace-nowrap"
                              style={{ background: modeBadgeColor(c.case_type) }}
                            >
                              {modeLabel(c.case_type)}
                            </span>
                          </td>
                          <td className="py-2 pr-4">{c.case_num || '—'}</td>
                          <td className="py-2 pr-4">{fmtDur(c.started_at, c.ended_at)}</td>
                          <td className={`py-2 pr-4 font-bold ${c.ended_at ? 'text-green-700' : 'text-ch-red'}`}>{c.ended_at ? 'Completed' : 'Suspended'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {g.sessions.flatMap((s) => s.session_breaks || []).length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-2">Breaks</p>
                  {g.sessions
                    .flatMap((s) => s.session_breaks || [])
                    .map((b, i) => (
                      <div key={b.id || i} className="flex items-center gap-3 px-3 py-2.5 bg-ch-secondary rounded-ch mb-1.5">
                        <span className="flex-1 font-body text-body text-ch-main capitalize">{b.break_type}</span>
                        <span className="font-body text-body text-ch-main opacity-60">
                          {fmtTime(b.started_at)} → {fmtTime(b.ended_at)}
                        </span>
                        <span className="font-body text-body text-ch-main opacity-60">{fmtDur(b.started_at, b.ended_at)}</span>
                      </div>
                    ))}
                </div>
              )}
            </Accordion>
          );
        })}
      </div>

      <Modal open={!!deleteDay} onClose={() => setDeleteDay(null)}>
        <p className="font-heading font-bold text-h6 text-ch-main">Delete this session?</p>
        <p className="font-body text-body text-ch-main opacity-70 mt-1">All time-in/out records for this day will be permanently deleted.</p>
        <div className="flex gap-2.5 justify-center mt-5">
          <Button variant="outline" onClick={() => setDeleteDay(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteDay}>
            Delete
          </Button>
        </div>
      </Modal>

      <Toast msg={toast.msg} type={toast.type} />
    </AppLayout>
  );
}
