// Donut of saved cases by type, with a legend on the right.
const SIZE = 200
const STROKE = 62
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R

export function AmendmentsDonut({ slices }) {
  const total = slices.reduce((n, s) => n + s.value, 0)
  let offset = 0
  return (
    <div className="dash-donut">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="dash-donut-svg" role="img" aria-label="Cases by type">
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {total === 0 && <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#efe8d6" strokeWidth={STROKE} />}
          {slices.filter((s) => s.value > 0).map((s) => {
            const len = (s.value / total) * C
            const el = (
              <circle
                key={s.key} cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={s.color} strokeWidth={STROKE}
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
              >
                <title>{`${s.label}: ${s.value} (${s.pct}%)`}</title>
              </circle>
            )
            offset += len
            return el
          })}
        </g>
      </svg>
      <ul className="dash-legend">
        {slices.map((s) => (
          <li key={s.key}>
            <i style={{ background: s.color }} />
            <b>{s.label}</b>
            <span>{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
