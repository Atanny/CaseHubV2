/** Weekly line chart. `dayData` = [{label,val}] Mon..Sun. */
export default function QuotaLineChart({ dayData }) {
  const total = dayData.reduce((s, d) => s + d.val, 0);
  if (total <= 0) {
    return <div className="font-body text-body text-ch-main opacity-50 py-8 text-center w-full">No data yet</div>;
  }

  const qWidth = 520;
  const qHeight = 140;
  const qStep = qWidth / (dayData.length - 1 || 1);
  const maxDay = Math.max(...dayData.map((d) => d.val), 1);
  const pts = dayData.map((d, i) => ({ x: i * qStep, y: qHeight - (d.val / maxDay) * qHeight }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg width={qWidth} height={qHeight + 30} viewBox={`0 0 ${qWidth} ${qHeight + 30}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <line key={i} x1={0} x2={qWidth} y1={qHeight * f} y2={qHeight * f} stroke="#E8DFCA" strokeWidth={1} />
        ))}
        <path d={path} fill="none" stroke="#8A38F5" strokeWidth={2} />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={5} fill="#8A38F5" stroke="#fff" strokeWidth={2} />
        ))}
        {dayData.map((d, i) => (
          <text key={i} x={i * qStep} y={qHeight + 20} textAnchor="middle" fontSize="10" fontFamily="Prompt, sans-serif" fontWeight="700" fill="#40513B">
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
