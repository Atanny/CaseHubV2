import { LineIcon } from '@/components/ui/LineIcon'
import { cls } from '@/utils/classNames'
import { useShell } from '@/core/ShellContext'

// The three timed breaks. `label` is what the confirm dialog and break banner show.
const BREAKS = [
  { label: '15 min', mins: 15, icon: 'coffee', short: '15 MIN' },
  { label: '30 min', mins: 30, icon: 'burger', short: '30 MIN' },
  { label: 'Lunch', mins: 60, icon: 'umbrella', short: '1 HOUR' },
]

function BreakPill({ icon, children, active, disabled, title, onClick }) {
  return (
    <button
      type="button"
      className={cls('ph-pill', active && 'active')}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      <LineIcon name={icon} size={22} strokeWidth={1.6} />
      <span>{children}</span>
    </button>
  )
}

// Shared page header: title/subtitle on the left; break pills, meeting and Log Out on the right.
export function PageHeader({ title, subtitle }) {
  const { breakTimer, timedIn, formInFields, openHourActive, requestBreak, requestCancelBreak,
    requestOpenHour, requestCancelOpenHour, logout } = useShell()

  const meetingDisabled = !openHourActive && (!timedIn || !!breakTimer || !!formInFields)

  return (
    <header className="ph">
      <div className="ph-row">
        <div className="ph-titles">
          <h1 className="ph-title">{title}</h1>
          {subtitle && <div className="ph-sub">{subtitle}</div>}
        </div>
        <div className="ph-actions">
          {BREAKS.map(({ label, mins, icon, short }) => {
            const isActive = !!breakTimer && breakTimer.mins === mins
            const isOther = !!breakTimer && breakTimer.mins !== mins
            const lockedByForm = !!formInFields && !isActive
            return (
              <BreakPill
                key={mins} icon={icon} active={isActive}
                disabled={isOther || lockedByForm}
                title={isActive ? 'End this break' : lockedByForm ? 'Finish or save the open form first' : `Start a ${label} break`}
                onClick={() => (isActive ? requestCancelBreak() : requestBreak(label, mins))}
              >
                {short}
              </BreakPill>
            )
          })}
          <BreakPill
            icon="meeting" active={openHourActive} disabled={meetingDisabled}
            title={openHourActive ? 'End the meeting' : !timedIn ? 'Clock in to start a meeting' : 'Start a meeting'}
            onClick={() => (openHourActive ? requestCancelOpenHour() : requestOpenHour())}
          >
            MEETING
          </BreakPill>
          <button type="button" className="ph-logout" onClick={() => logout()}>
            <span>Log Out</span>
            <LineIcon name="logout" size={22} strokeWidth={1.9} />
          </button>
        </div>
      </div>
      <div className="ph-rule" />
    </header>
  )
}
