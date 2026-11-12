import { WEEK_LABELS, niceAxisMax } from '../dashboardData'

// Cases saved per day for the current week (Mon..Sun). Days that have not happened yet have no point.
const W = 540, H = 250
const PAD = { l: 38, r: 16, t: 14, b: 30 }

export function QuotaLineChart({ counts }) {
  const max = niceAxisMax(Math.max(0, ...counts.filter((v) => v != null)))
  const x = (i) => PAD.l + (i * (W - PAD.l - PAD.r)) / (counts.length - 1)
  const y = (v) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b)
  const points = counts.map((v, i) => (v == null ? null : [x(i), y(v), v]))
  const drawn = points.filter(Boolean)
  const ticks = [0, 1, 2, 3, 4].map((n) => (max / 4) * n)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dash-line" role="img" aria-label="Cases per day this week">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#ece4d2" strokeWidth="1" />
          <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="dash-axis">{t}</text>
        </g>
      ))}
      {WEEK_LABELS.map((d, i) => (
        <text key={d} x={x(i)} y={H - 8} textAnchor="middle" className="dash-axis">{d}</text>
      ))}
      {drawn.length > 1 && (
        <polyline fill="none" stroke="#40513b" strokeWidth="2" strokeLinejoin="round" points={drawn.map((p) => `${p[0]},${p[1]}`).join(' ')} />
      )}
      {drawn.map(([px, py, v], i) => (
        <circle key={i} cx={px} cy={py} r="5" fill="#8a38f5"><title>{`${v} case${v === 1 ? '' : 's'}`}</title></circle>
      ))}
    </svg>
  )
}
