import { cls } from '@/utils/classNames'
import { LineIcon, LINE_ICON_NAMES } from '@/components/ui/LineIcon'

// Custom links store a free-form icon value; use it when it names a known icon, else a chain link.
const linkIcon = (icon) => (LINE_ICON_NAMES.includes(icon) ? icon : 'link')

function RailGroup({ label }) {
  return <div className="rail-group">{label}</div>
}

function RailButton({ label, icon, active, onClick, badge, dot, children }) {
  return (
    <button
      type="button"
      className={cls('rail-item', active && 'active')}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <LineIcon name={icon} size={22} />
      {badge > 0 && <span className="rail-badge">{badge > 99 ? '99+' : badge}</span>}
      {dot && <span className="rail-dot" title="Form in progress" />}
      {children}
    </button>
  )
}

export function Sidebar({
  allCases, announcements, archivedDrafts, coreNav, dbStatus, formActive,
  handleNav, links, logout, page, setLinks, sidebarDragRef,
}) {
  const badgeFor = (id) => {
    if (id === 'history') return allCases.length
    if (id === 'announcements') return announcements.length
    if (id === 'archives') return archivedDrafts.length
    return 0
  }

  return (
    <aside className="rail" aria-label="Main navigation">
      <button type="button" className="rail-logo" onClick={() => handleNav('dashboard')} title="CaseHub" aria-label="CaseHub dashboard">
        <LineIcon name="speedometer" size={38} strokeWidth={2.1} />
      </button>

      <nav className="rail-nav">
        {coreNav.map((n, i) =>
          n.group ? (
            <RailGroup key={`g${i}`} label={n.group} />
          ) : (
            <RailButton
              key={n.id}
              label={n.label}
              icon={n.icon}
              active={page === n.id}
              onClick={() => handleNav(n.id)}
              badge={badgeFor(n.id)}
              dot={n.id === 'postlive' && formActive && page !== 'postlive'}
            />
          )
        )}

        {links.length > 0 && (
          <>
            <RailGroup label="Links" />
            {links.map((l, i) => (
              <div
                key={l.id}
                draggable
                onDragStart={() => { sidebarDragRef.current = i }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  const from = sidebarDragRef.current
                  if (from == null || from === i) return
                  const arr = [...links]
                  const [moved] = arr.splice(from, 1)
                  arr.splice(i, 0, moved)
                  setLinks(arr)
                  sidebarDragRef.current = null
                }}
                onDragEnd={() => { sidebarDragRef.current = null }}
                className="rail-link-wrap"
              >
                <a
                  href={l.url} target="_blank" rel="noopener noreferrer"
                  className="rail-item" title={l.title} aria-label={l.title}
                >
                  <LineIcon name={linkIcon(l.icon)} size={22} />
                </a>
              </div>
            ))}
          </>
        )}
      </nav>

      <div className="rail-foot">
        <button
          type="button"
          className={cls('rail-db', dbStatus.status)}
          onClick={dbStatus.recheck}
          title={
            dbStatus.status === 'connected' ? `Database connected${dbStatus.latency ? ` · ${dbStatus.latency}ms` : ''}`
              : dbStatus.status === 'connecting' ? 'Connecting to database…' : 'Database offline — click to retry'
          }
          aria-label="Database status"
        />
        <button type="button" className="rail-logout" onClick={() => logout()} title="Sign out" aria-label="Sign out">
          <LineIcon name="logout" size={22} />
        </button>
      </div>
    </aside>
  )
}
