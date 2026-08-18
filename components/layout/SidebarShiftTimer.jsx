import { useState, useEffect } from 'react';

export default function SidebarShiftTimer({globalTimeIn, shiftEndTime}){
  const [elapsed,setElapsed]=useState(Math.floor((Date.now()-globalTimeIn)/1000));
  useEffect(()=>{
    const t=setInterval(()=>setElapsed(Math.floor((Date.now()-globalTimeIn)/1000)),1000);
    return()=>clearInterval(t);
  },[globalTimeIn]);
  const h=Math.floor(elapsed/3600);
  const m=Math.floor((elapsed%3600)/60);
  const s=elapsed%60;
  const startLabel=new Date(globalTimeIn).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  const endLabel=shiftEndTime?(()=>{
    const [hh,mm]=shiftEndTime.split(":").map(Number);
    const end=new Date();
    end.setHours(hh,mm,0,0);
    return end.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  })():null;
  const pct=shiftEndTime?(()=>{
    const [hh,mm]=shiftEndTime.split(":").map(Number);
    const end=new Date();end.setHours(hh,mm,0,0);
    if(end<=new Date()) end.setDate(end.getDate()+1);
    const total=end.getTime()-globalTimeIn;
    const spent=Date.now()-globalTimeIn;
    return Math.min(100,Math.round((spent/total)*100));
  })():null;
  const isWarn=pct!==null&&pct>=80;
  return (
    <div className="sidebar-shift-timer" style={{borderColor:isWarn?"var(--amber)":"var(--border)"}}>
      <div className="sidebar-shift-row">
        <span className="sidebar-shift-label" style={{color:isWarn?"var(--amber)":"var(--muted)"}}>
          {isWarn?"⚠ Shift ending soon":"⏱ Shift Time"}
        </span>
        <span className="sidebar-shift-meta">
          <span>{startLabel}</span>
          {endLabel&&<><span>→</span><span>{endLabel}</span></>}
        </span>
      </div>
      <div className="sidebar-shift-elapsed" style={{color:isWarn?"var(--amber)":"var(--green)",marginBottom:pct!==null?7:0}}>
        {String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
      </div>
      {pct!==null&&(
        <div style={{height:3,background:"var(--border)",borderRadius:99,overflow:"hidden",marginTop:2}}>
          <div style={{height:"100%",width:`${pct}%`,background:isWarn?"var(--amber)":"var(--green)",borderRadius:99,transition:"width 1s linear"}}/>
        </div>
      )}
    </div>
  );
}

