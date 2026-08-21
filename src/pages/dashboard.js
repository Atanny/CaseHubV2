import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import HeaderQuickActions from '../components/layout/HeaderQuickActions';
import Divider from '../components/ui/Divider';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import DonutChart from '../components/dashboard/DonutChart';
import QuotaLineChart from '../components/dashboard/QuotaLineChart';
import { modeBadgeColor, modeLabel, complexityLabel } from '../components/dashboard/caseHelpers';
import { useSession } from '../hooks/useSession';
import { casesService } from '../services/casesService';
import { archivedDraftsService } from '../services/archivedDraftsService';
import { announcementsService } from '../services/announcementsService';
import { ROUTES } from '../constants/routes';

export default function DashboardPage() {
  const { user } = useSession();
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [archivedDrafts, setArchivedDrafts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadState, setLoadState] = useState('loading');

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      setLoadState('loading');
      try {
        const [c, a, ann] = await Promise.all([
          casesService.list(user.email),
          archivedDraftsService.list(user.email),
          announcementsService.list(),
        ]);
        setCases(c);
        setArchivedDrafts(a);
        setAnnouncements(ann);
        setLoadState('ready');
      } catch (e) {
        setLoadState('error');
      }
    })();
  }, [user?.email]);

  const now = new Date();
  const total = cases.length;
  const today = cases.filter((c) => new Date(c.savedAt).toDateString() === now.toDateString()).length;
  const scCount = cases.filter((c) => c._mode === 'siteComment').length;
  const ibCount = cases.filter((c) => c._mode === 'inbound').length;
  const completed = cases.filter((c) => c.checklist && Object.values(c.checklist).every(Boolean)).length;

  const dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = {};
  dayKeys.forEach((k) => {
    byDay[k] = 0;
  });
  cases.forEach((c) => {
    const k = dayKeys[new Date(c.savedAt).getDay()];
    byDay[k] = (byDay[k] || 0) + 1;
  });
  const dayData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => ({ label, val: byDay[label] }));

  const latestCases = [...cases].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)).slice(0, 6);
  const latestAnnouncement =
    announcements.length > 0
      ? [...announcements].sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0))[0]
      : null;

  const amendData = [
    { label: 'Site Comment', val: scCount, color: '#4760FF' },
    { label: 'Inbound Email', val: ibCount, color: '#8A38F5' },
  ];
  const maxAmend = Math.max(...amendData.map((d) => d.val), 1);

  return (
    <AppLayout>
      <PageHeader title="Dashboard" subtitle="Summary of Data" actions={<HeaderQuickActions />} />
      <Divider className="mb-1" />

      {loadState === 'error' && (
        <Card className="w-full text-center text-ch-red">Couldn&apos;t load dashboard data — check your connection.</Card>
      )}

      {/* Greeting + mini stats */}
      <div className="flex gap-2.5 w-full flex-wrap">
        <Card className="flex items-center gap-4 flex-1 min-w-[260px]">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}`}
            alt=""
            className="w-14 h-14 rounded-full object-cover"
          />
          <div>
            <p className="font-heading font-bold text-h4 text-ch-main">Hello, {user?.name || 'there'}</p>
            <p className="font-body text-body text-ch-main opacity-60">{user?.role || '—'}</p>
          </div>
        </Card>
        <div className="flex gap-2.5 flex-1 min-w-[260px]">
          {[
            ['Overall Cases', total],
            ['My Latest Quota', '—'],
            ['Cases Finished Today', today],
          ].map(([label, val]) => (
            <Card key={label} className="flex-1 text-center">
              <p className="font-heading font-bold text-h4 text-ch-main">{val}</p>
              <p className="font-body text-body text-ch-main opacity-60">{label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Date/time + quick actions */}
      <div className="flex gap-2.5 w-full flex-wrap">
        <Card className="flex-1 min-w-[220px]">
          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-2">Date &amp; Time</p>
          <div className="flex items-baseline gap-3 font-heading font-bold text-h6 text-ch-main">
            <span>{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            <span className="font-body text-body font-normal opacity-70">
              {now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </Card>
        <Card className="flex-[2] min-w-[320px]">
          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-2">Quick Actions (Post Live)</p>
          <div className="flex items-center justify-between gap-2.5 flex-wrap">
            <div className="flex gap-2.5 flex-wrap">
              {['Site Comment', 'Inbound', 'Bundle'].map((l) => (
                <Button key={l} variant="outline" size="sm" onClick={() => router.push(ROUTES.postlive)}>
                  {l}
                </Button>
              ))}
            </div>
            <Button variant="primary" onClick={() => router.push(ROUTES.postlive)}>
              Time-In
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex gap-2.5 w-full flex-wrap items-start">
        {/* Totals + lists */}
        <div className="flex flex-col gap-2.5 flex-[3] min-w-[320px]">
          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Pre-Live</p>
          <div className="flex gap-2.5 flex-wrap">
            <Card className="flex-1 min-w-[140px] text-center">
              <p className="font-heading font-bold text-h4 text-[#4760FF]">—</p>
              <p className="font-body text-body text-ch-main">Total Site Comments</p>
            </Card>
            <Card className="flex-1 min-w-[140px] text-center">
              <p className="font-heading font-bold text-h4 text-amber-600">{archivedDrafts.length}</p>
              <p className="font-body text-body text-ch-main">Archived Case</p>
            </Card>
            <Card className="flex-1 min-w-[140px] text-center">
              <p className="font-heading font-bold text-h4 text-green-700">—</p>
              <p className="font-body text-body text-ch-main">Total Cases Finished</p>
            </Card>
          </div>

          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Post-Live</p>
          <div className="flex gap-2.5 flex-wrap">
            <Card className="flex-1 min-w-[140px] text-center">
              <p className="font-heading font-bold text-h4 text-[#4760FF]">{scCount}</p>
              <p className="font-body text-body text-ch-main">Total Site Comments</p>
            </Card>
            <Card className="flex-1 min-w-[140px] text-center">
              <p className="font-heading font-bold text-h4 text-[#8A38F5]">{ibCount}</p>
              <p className="font-body text-body text-ch-main">Total Inbound Email</p>
            </Card>
            <Card className="flex-1 min-w-[140px] text-center">
              <p className="font-heading font-bold text-h4 text-green-700">{completed}</p>
              <p className="font-body text-body text-ch-main">Total Cases Finished</p>
            </Card>
          </div>

          <div className="flex items-center justify-between w-full">
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Announcement</p>
            <button className="font-body text-body text-ch-main underline" onClick={() => router.push(ROUTES.announcements)}>
              See All Announcement ›
            </button>
          </div>
          <Card className="w-full">
            {latestAnnouncement ? (
              <>
                <p className="font-heading font-bold text-h6 text-ch-main">{latestAnnouncement.title || 'Announcement'}</p>
                <p className="font-body text-body text-ch-main opacity-70">{latestAnnouncement.body || ''}</p>
              </>
            ) : (
              <p className="font-body text-body text-ch-main opacity-50">No announcements yet.</p>
            )}
          </Card>

          <div className="flex items-center justify-between w-full">
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Latest Case Processed</p>
            <button className="font-body text-body text-ch-main underline" onClick={() => router.push(ROUTES.history)}>
              See All Cases ›
            </button>
          </div>
          <div className="flex flex-col gap-2 w-full">
            {latestCases.length === 0 && (
              <Card className="w-full text-center text-ch-main opacity-50">No cases saved yet.</Card>
            )}
            {latestCases.map((c, i) => (
              <Card
                key={i}
                className="flex items-center justify-between gap-2.5 cursor-pointer"
                onClick={() => router.push(ROUTES.history)}
              >
                <div>
                  <p className="font-heading font-bold text-h6 text-ch-main">
                    {c.caseNum} - {c.accountNum}
                  </p>
                  <p className="font-body text-body text-ch-main opacity-60">{c.amendType || '—'}</p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-white text-badge font-label font-bold uppercase whitespace-nowrap"
                  style={{ background: modeBadgeColor(c._mode) }}
                >
                  {modeLabel(c._mode)} - {complexityLabel(c._caseComplexity)}
                </span>
              </Card>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="flex flex-col gap-2.5 flex-[2] min-w-[280px]">
          <Card className="w-full">
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-2">Amendments</p>
            <div className="flex gap-4 mb-3 flex-wrap">
              {amendData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 font-body text-body text-ch-main">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  {d.label} {total > 0 ? Math.round((d.val / (total || 1)) * 1000) / 10 : 0}%
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <DonutChart data={amendData} total={total} />
            </div>
          </Card>

          <Card className="w-full">
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-2">Quota Graph</p>
            <QuotaLineChart dayData={dayData} />
          </Card>

          <Card className="w-full">
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-2">Amendments</p>
            {total > 0 ? (
              <div className="flex flex-col gap-2.5 w-full">
                {amendData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-24 shrink-0 font-body text-body text-ch-main">{d.label}</div>
                    <div className="flex-1 h-2 bg-ch-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(d.val / maxAmend) * 100}%`, background: d.color }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body text-body text-ch-main opacity-50 text-center py-4">No data yet</p>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
