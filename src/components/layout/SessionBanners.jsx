// Sticky banners shown at the top of the main area while a break or meeting is active.
const bannerStyle = { position: "sticky", top: -32, zIndex: 20, margin: "-32px -32px 24px", padding: "10px 32px" }

export function BreakBanner({ breakTimer, onEnd }) {
  const pct = breakTimer.ended ? 100 : Math.round((1 - (breakTimer.secsLeft / (breakTimer.mins * 60))) * 100)
  const mm = Math.floor((breakTimer.secsLeft || 0) / 60)
  const ss = String((breakTimer.secsLeft || 0) % 60).padStart(2, "0")
  return (
    <div className="pl-break-banner" style={bannerStyle}>
      <div style={{fontWeight:700,fontSize:12,textTransform:"uppercase",letterSpacing:".4px"}}>{breakTimer.ended?"Break over":breakTimer.warned?"Break ending soon":"You are on break"} · {breakTimer.label}</div>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18}}>{breakTimer.ended?"Done":mm+":"+ss}</div>
      <div className="pl-break-track"><div style={{width:pct+"%"}}/></div>
      <button className="btn btn-primary" onClick={onEnd}>End Break</button>
    </div>
  )
}

export function MeetingBanner({ onEnd }) {
  return (
    <div className="pl-break-banner" style={bannerStyle}>
      <div style={{fontWeight:700,fontSize:12,textTransform:"uppercase",letterSpacing:".4px"}}>Meeting · session timer paused</div>
      <div style={{flex:1}}/>
      <button className="btn btn-primary" onClick={onEnd}>End Meeting</button>
    </div>
  )
}
