// Share of cases per workflow stage (Build / Pre-Live / Post-Live) as horizontal bars with a legend.
export function StageBars({ stages }) {
  const max = Math.max(1, ...stages.map((s) => s.value))
  return (
    <div className="dash-stages">
      {stages.map((s) => (
        <div key={s.key} className="dash-stage-row">
          <span className="dash-stage-label">{s.label.toUpperCase()}</span>
          <div className="dash-stage-track">
            <div
              className="dash-stage-bar"
              style={{ width: `${(s.value / max) * 100}%`, background: s.color }}
              title={`${s.label}: ${s.value} (${s.pct}%)`}
            />
          </div>
        </div>
      ))}
      <ul className="dash-legend dash-legend-inline">
        {stages.map((s) => (
          <li key={s.key}><i style={{ background: s.color }} /><b>{s.label.toUpperCase()}</b><span>{s.pct}%</span></li>
        ))}
      </ul>
    </div>
  )
}
