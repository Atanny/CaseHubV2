import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { LineIcon } from '@/components/ui/LineIcon'
import { AmendmentsDonut } from './components/AmendmentsDonut'
import { QuotaLineChart } from './components/QuotaLineChart'
import { StageBars } from './components/StageBars'
import { caseBadge, computeDashboardStats } from './dashboardData'

const initialsOf = (name) => (name || 'U').split(' ').map((w) => w && w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()

function StatTile({ value, label, color }) {
  return (
    <div className="dash-tile">
      <div className="dash-tile-value" style={color ? { color } : undefined}>{value}</div>
      <div className="dash-tile-label">{label}</div>
    </div>
  )
}

function SeeAll({ children, onClick }) {
  return (
    <button type="button" className="dash-seeall" onClick={onClick}>
      {children}<LineIcon name="chevronRight" size={12} strokeWidth={2.4} />
    </button>
  )
}

export function DashboardPage({ savedCases, setPage, user, announcements = [] }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  const stats = computeDashboardStats(savedCases, now)
  const avatar = user?.avatarUrl || user?.avatar_url
  const name = user?.name || 'there'
  const go = (page) => () => setPage(page)

  return (
    <div className="dash">
      <PageHeader title="Dashboard" subtitle="Summary Of Data" />

      <section className="dash-top">
        <div className="dash-card dash-hello">
          {avatar
            ? <img className="dash-avatar" src={avatar} alt="" />
            : <div className="dash-avatar dash-avatar-initials">{initialsOf(name)}</div>}
          <div>
            <h2 className="dash-hello-name">Hello, {name}</h2>
            <div className="dash-hello-role">{user?.jobTitle || user?.role || 'Web Designer'}</div>
          </div>
        </div>
        <StatTile value={stats.total} label="Overall Cases" />
        <StatTile value={stats.completedThisWeek} label="My Latest Quota" />
        <StatTile value={stats.today} label="Cases Finished Today" />
      </section>

      <section className="dash-mid">
        <div className="dash-card">
          <div className="dash-label">Date &amp; Time</div>
          <div className="dash-clock">
            <span>{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            <span>{now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-label">Quick Actions (Post-Live)</div>
          <div className="dash-actions">
            <button type="button" className="dash-action" onClick={go('postlive')}>Site Comment</button>
            <button type="button" className="dash-action" onClick={go('postlive')}>Inbound</button>
            <button type="button" className="dash-action" onClick={go('postlive')}>Bundle</button>
          </div>
        </div>
      </section>

      <section className="dash-main">
        <div className="dash-card dash-left">
          <div className="dash-label">Pre-Live</div>
          <div className="dash-tiles">
            <StatTile value={0} label="Total Site Comments" color="#4760ff" />
            <StatTile value={0} label="Archived Case" color="#ecbd0b" />
            <StatTile value={0} label="Total Cases Finished" color="#58a767" />
          </div>

          <div className="dash-label">Post-Live</div>
          <div className="dash-tiles">
            <StatTile value={stats.siteComments} label="Total Site Comments" color="#4760ff" />
            <StatTile value={stats.inbound} label="Total Inbound Email" color="#8a38f5" />
            <StatTile value={stats.total} label="Total Cases Finished" color="#58a767" />
          </div>

          <div className="dash-label-row">
            <div className="dash-label">Announcement</div>
            <SeeAll onClick={go('announcements')}>See All Announcement</SeeAll>
          </div>
          <div className="dash-panel">
            {announcements.length === 0 && <div className="dash-empty">No announcements yet.</div>}
            {announcements.slice(0, 2).map((a) => (
              <article key={a.id} className="dash-ann">
                <h3>{a.title}</h3>
                <p>{a.body}</p>
                <SeeAll onClick={go('announcements')}>See All Announcement</SeeAll>
              </article>
            ))}
          </div>

          <div className="dash-label-row">
            <div className="dash-label">Latest Case Processed</div>
            <SeeAll onClick={go('history')}>See All Cases</SeeAll>
          </div>
          <div className="dash-panel">
            {stats.latest.length === 0 && <div className="dash-empty">No cases saved yet.</div>}
            {stats.latest.map((c, i) => {
              const badge = caseBadge(c)
              return (
                <button key={c._id || i} type="button" className="dash-case" onClick={go('history')}>
                  <span>
                    <b className="dash-case-num">{c.caseNum} <em>-</em> {c.accountNum}</b>
                    <span className="dash-case-type">{c.amendType}</span>
                  </span>
                  <span className="dash-badge" style={{ background: badge.color }}>{badge.text}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="dash-right">
          <div className="dash-card">
            <div className="dash-label">Amendments</div>
            <div className="dash-inner">
              {stats.total > 0 ? <AmendmentsDonut slices={stats.slices} /> : <div className="dash-empty">No data yet</div>}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">Quota Graph</div>
            <QuotaLineChart counts={stats.weekCounts} />
          </div>
          <div className="dash-card">
            <div className="dash-label">Amendments</div>
            <StageBars stages={stats.stages} />
          </div>
        </div>
      </section>
    </div>
  )
}
