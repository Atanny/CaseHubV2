/** Simple SVG donut chart. `data` = [{label,val,color}]. */
export default function DonutChart({ data, total }) {
  const donutR = 90 - 34 / 2;
  const donutCirc = 2 * Math.PI * donutR;
  let donutOff = 0;

  if (total <= 0) {
    return <div className="font-body text-body text-ch-main opacity-50 py-8 text-center w-full">No data yet</div>;
  }

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      {data.map((d, i) => {
        const pct = d.val / (total || 1);
        const len = pct * donutCirc;
        const dashArr = `${len} ${donutCirc - len}`;
        const rotation = (donutOff / (total || 1)) * 360 - 90;
        donutOff += d.val;
        return (
          <circle
            key={i}
            cx={90}
            cy={90}
            r={donutR}
            fill="none"
            stroke={d.color}
            strokeWidth={34}
            strokeDasharray={dashArr}
            strokeDashoffset={-(rotation / 360) * donutCirc}
          />
        );
      })}
    </svg>
  );
}
