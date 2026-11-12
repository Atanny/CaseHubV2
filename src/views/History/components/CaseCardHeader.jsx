import { cls } from '@/utils/classNames'

export function CaseCardHeader({ allImages, c, checkDone, checkTotal, editMode, isOpen, isSC, setIsOpen, startEdit }) {
  return (
    <div className="case-card-header" onClick={()=>setIsOpen(o=>!o)}>
        <div className="case-num-badge">#{c.caseNum||"—"}</div>
        <div style={{flex:1,minWidth:0,marginLeft:4}}>
          <div className="case-meta-main">{c.accountNum||"—"} &nbsp;·&nbsp; {c.amendType||"—"}</div>
          <div className="case-meta-sub">
            <span className={cls("act-badge",isSC?"site":"email")} style={{fontSize:10,padding:"2px 8px",marginRight:6}}>{isSC?"Site Comment":"Inbound Email"}</span>
            {(()=>{
              const cx=c._caseComplexity;
              if(!cx||cx==="minor") return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",color:"#10b981",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginRight:4}}>Minor</span>;
              if(cx==="major") return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",color:"#f59e0b",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginRight:4}}>Major</span>;
              return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(197,68,70,.12)",border:"1px solid rgba(197,68,70,.3)",color:"#c54446",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginRight:4}}>Complex</span>;
            })()}
            {(()=>{
              const bundled = c._bundledWith;
              if(!bundled) return null;
              const nums = Array.isArray(bundled) ? bundled : [bundled];
              if(!nums.length) return null;
              const isMulti=nums.length>1;const col=isMulti?"#f59e0b":"#10b981";const bg=isMulti?"rgba(245,158,11,.14)":"rgba(16,185,129,.14)";const bdr=isMulti?"1px solid rgba(245,158,11,.35)":"1px solid rgba(16,185,129,.35)";
              return <span style={{marginLeft:4,fontSize:10,padding:"2px 9px",borderRadius:20,background:bg,border:bdr,color:col,fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>Bundled w/ #{nums.join(", #")}</span>;
            })()}
            {c.savedAt}{c.endedAt&&<span style={{marginLeft:8,color:"var(--green)",fontWeight:600}}> · Done {c.endedAt}</span>}
            {(()=>{
              const secs=c._totalElapsed||c._elapsedAtSave||0;
              if(!secs) return null;
              const h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=secs%60;
              const dur=h>0?`${h}h ${m}m ${s}s`:m>0?`${m}m ${s}s`:`${s}s`;
              return <span style={{marginLeft:8,color:"var(--accent)",fontFamily:"monospace",fontWeight:700,fontSize:10}}>⏱ {dur}</span>;
            })()}
            {allImages.length>0&&<span style={{marginLeft:8,opacity:.7}}>{allImages.length} img</span>}
            {c.checklist&&<span style={{marginLeft:8,color:checkDone===checkTotal?"var(--green)":"var(--amber)"}}>✓ {checkDone}/{checkTotal}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0}} onClick={e=>e.stopPropagation()}>
          {!editMode&&<button className="case-expand-btn" onClick={()=>{startEdit();}}>Edit</button>}
          <button className="case-expand-btn" onClick={()=>setIsOpen(o=>!o)}>
            <span className="case-expand-icon">▼</span>{isOpen?"Collapse":"Details"}
          </button>
        </div>
      </div>
  )
}
