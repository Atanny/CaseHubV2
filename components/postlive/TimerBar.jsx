import { useState } from 'react';
import { fmtElapsed } from '../../lib/helpers';

export default function TimerBar({ footerElapsed, resumeElapsed, phase2Elapsed, isDraftResumed, isEditMode, prevElapsedSecs, originalTotalSecs, originalOutcome, fmtElapsed }) {
  const sep = <span style={{color:"var(--glass-border)",fontSize:16,fontWeight:300,margin:"0 4px"}}>|</span>;
  const block = (label, val, color, extra={}) => (
    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",lineHeight:1.1,...(extra.style||{})}}>
      <span style={{fontSize:9,color:color||"var(--muted)",fontFamily:"'Poppins',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:".5px",opacity:.8,display:"flex",alignItems:"center",gap:4}}>
        {label}
        {extra.pulsing&&<span style={{width:6,height:6,borderRadius:"50%",background:"var(--green)",display:"inline-block",animation:"pulse-dot 1.2s infinite"}}/>}
        {extra.paused&&<span style={{fontSize:8,color:"var(--muted)",fontWeight:600,opacity:.7}}>⏸ paused</span>}
      </span>
      <span style={{fontSize:28,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",color:color||"var(--accent)",letterSpacing:"-1.5px",fontVariantNumeric:"tabular-nums"}}>{fmtElapsed(val)}</span>
    </div>
  );
  const phase2Active = phase2Elapsed !== null;

  if(isDraftResumed){
    if(isEditMode){
      return (
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 16px",borderLeft:"1px solid var(--glass-border)",marginLeft:8,flexWrap:"wrap"}}>
          {block("Total Time Spent", originalTotalSecs, "var(--muted)")}
          {sep}
          {block("Combined Tracker", footerElapsed, phase2Active?"var(--muted)":"var(--accent)", {paused:phase2Active})}
          {phase2Active && <>{sep}{block("QA Checklist", phase2Elapsed, "var(--green)", {pulsing:true})}</>}
        </div>
      );
    }
    return (
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 16px",borderLeft:"1px solid var(--glass-border)",marginLeft:8,flexWrap:"wrap"}}>
        {block("Combined Tracker", prevElapsedSecs, "var(--muted)")}
        {sep}
        {block("Combined Tracker", footerElapsed, phase2Active?"var(--muted)":"var(--accent)", {paused:phase2Active})}
        {phase2Active && <>{sep}{block("QA Checklist", phase2Elapsed, "var(--green)", {pulsing:true})}</>}
      </div>
    );
  }
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 16px",borderLeft:"1px solid var(--glass-border)",marginLeft:8}}>
      {block("Combined Tracker", footerElapsed, phase2Active?"var(--muted)":"var(--accent)", {paused:phase2Active})}
      {phase2Active && <>{sep}{block("QA Checklist", phase2Elapsed, "var(--green)", {pulsing:true})}</>}
    </div>
  );
}

