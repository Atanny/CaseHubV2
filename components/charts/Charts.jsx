import { cls } from '../../lib/helpers';

export function BarChart({ data, colorClass }) {
  const max = Math.max(...data.map(d=>d.val),1);
  return (
    <div>
      {data.map((d,i)=>(
        <div key={i} className="bar-row">
          <div className="bar-label" title={d.label}>{d.label}</div>
          <div className="bar-track"><div className={cls("bar-fill",Array.isArray(colorClass)?colorClass[i%colorClass.length]:colorClass)} style={{width:`${(d.val/max)*100}%`}}/></div>
          <div className="bar-count">{d.val}</div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ data, size=100, stroke=14 }) {
  const r = (size-stroke)/2; const circ = 2*Math.PI*r;
  const total = data.reduce((s,d)=>s+d.val,0)||1;
  let off = 0;
  const colors = ["#f5945c","#d4724a","#10b981","#f59e0b","#f43f5e"];
  return (
    <div className="donut-wrap">
      <svg className="donut-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d,i)=>{
          const pct = d.val/total; const len = pct*circ; const dashArr = `${len} ${circ-len}`;
          const rotation = (off/total)*360-90; off+=d.val;
          return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={colors[i%colors.length]} strokeWidth={stroke} strokeDasharray={dashArr} strokeDashoffset={-(rotation/360)*circ} strokeLinecap="round" style={{transition:"stroke-dasharray .8s cubic-bezier(.4,0,.2,1)"}}/>;
        })}
        <text x={size/2} y={size/2} textAnchor="middle" dy=".35em" fill="var(--text)" fontSize="14" fontWeight="800" fontFamily="Plus Jakarta Sans,sans-serif">{total}</text>
      </svg>
      <div className="donut-legend">
        {data.map((d,i)=>(<div key={i} className="donut-legend-item"><div className="donut-legend-dot" style={{background:colors[i%colors.length]}}/><span style={{color:"var(--muted)"}}>{d.label}</span><strong style={{marginLeft:"auto",paddingLeft:8}}>{d.val}</strong></div>))}
      </div>
    </div>
  );
}

export function SparkLine({ data, color="#f5945c", height=40, width=200 }) {
  if(!data||data.length<2) return <div style={{color:"var(--muted)",fontSize:11,textAlign:"center",paddingTop:16}}>Not enough data</div>;
  const max=Math.max(...data,1); const min=0;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/(max-min))*height}`).join(" ");
  const area=`0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:"visible"}}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".35"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={area} fill="url(#sg)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v,i)=><circle key={i} cx={(i/(data.length-1))*width} cy={height-((v-min)/(max-min))*height} r="3" fill={color} stroke="var(--card)" strokeWidth="1.5"/>)}
    </svg>
  );
}

