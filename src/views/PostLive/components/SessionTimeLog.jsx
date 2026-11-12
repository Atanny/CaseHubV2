import { CopyCaseBtn } from './CopyCaseBtn'

export function SessionTimeLog({ activeBundleCaseNum, allSavedCases, breakActive, dbDrafts, editCase, enterEditFromLog, enterMode, isMinimised, sessionLog, setShowLog, showLog }) {
  return (
    <div className="session-log-wrap">
          <div className="session-log-header">
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              
              <div className="section-title" style={{marginBottom:0,borderBottom:"none",paddingBottom:0,fontSize:13}}>Session Time Log</div>
              <span style={{fontSize:10,padding:"2px 8px",background:"rgba(64,81,59,.12)",color:"var(--accent)",borderRadius:20,fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>{new Set(sessionLog.filter(e=>e.caseNum).map(e=>e.caseNum)).size} cases</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-ghost" style={{fontSize:11,padding:"5px 12px",borderRadius:20}} onClick={()=>setShowLog(s=>!s)}>{showLog?"▲ Hide":"▼ Show"} Log</button>
              
            </div>
          </div>
          {showLog&&(
            <>
              {(()=>{
  const caseNumCounts=sessionLog.reduce((acc,e)=>{
    const key=(e.caseNum||"").trim();
    if(key) acc[key]=(acc[key]||0)+1;
    return acc;
  },{});
  
  // FIX 2: Create a unique color map for each duplicated case number
  const dupColors = [
    { border: "#f59e0b", bg: "rgba(245,158,11,.15)" }, // amber
    { border: "#10b981", bg: "rgba(16,185,129,.15)" }, // green
    { border: "#3b82f6", bg: "rgba(59,130,246,.15)" }, // blue
    { border: "#8b5cf6", bg: "rgba(139,92,246,.15)" }, // violet
    { border: "#ec4899", bg: "rgba(236,72,153,.15)" }, // pink
    { border: "#06b6d4", bg: "rgba(6,182,212,.15)" }   // cyan
  ];
  
  let dupIndex = 0;
  const dupColorMap = {};
  Object.entries(caseNumCounts).forEach(([num, count]) => {
    if (count > 1) {
      dupColorMap[num] = dupColors[dupIndex % dupColors.length];
      dupIndex++;
    }
  });
  
  // Display: open Time In entry pinned first, rest in chronological order (newest at bottom)
  const openEntry = sessionLog.find(e => e.status === "Time In" && !e.endedAt);
  const otherEntries = sessionLog.filter(e => !(e.status === "Time In" && !e.endedAt));
  // Newest at bottom: closed entries in chronological order, open entry pinned at bottom
  const displayLog = openEntry ? [...otherEntries, openEntry] : [...sessionLog];

  // Find the latest entry per case by endedAt time (on original sessionLog for correctness)
  const caseNumLastIdx={};
  sessionLog.forEach((e,idx)=>{
    const key=(e.caseNum||"").trim();
    if(!key) return;
    if(!e.endedAt) return;
    if(caseNumLastIdx[key]===undefined){
      caseNumLastIdx[key]=idx;
    }else{
      const currentLatest=sessionLog[caseNumLastIdx[key]];
      if(e.endedAt > currentLatest.endedAt){
        caseNumLastIdx[key]=idx;
      }
    }
  });
  // Remap caseNumLastIdx to displayLog indices
  const displayCaseNumLastIdx={};
  displayLog.forEach((e,idx)=>{
    const key=(e.caseNum||"").trim();
    if(!key||!e.endedAt) return;
    if(displayCaseNumLastIdx[key]===undefined){
      displayCaseNumLastIdx[key]=idx;
    }else{
      const currentLatest=displayLog[displayCaseNumLastIdx[key]];
      if(e.endedAt > currentLatest.endedAt){
        displayCaseNumLastIdx[key]=idx;
      }
    }
  });

  const hasDuplicateCases=Object.values(caseNumCounts).some(v=>v>1);
  return <>
    {hasDuplicateCases&&<div style={{padding:"10px 16px",background:"rgba(245,158,11,.1)",borderBottom:"1px solid rgba(245,158,11,.2)",fontSize:11,fontWeight:700,color:"var(--amber)",fontFamily:"'Poppins',sans-serif"}}>Duplicate case numbers — only the latest entry per case can be edited.</div>}
    
    <div className="session-log-table-head">
      <span>Case Number</span><span>Status</span><span>Started</span><span>Ended</span><span>Duration</span><span>Complexity</span><span>Outcome</span><span>Actions</span>
    </div>
    
    {displayLog.map((entry,i)=>{
      const start=new Date(entry.startedAt);
      const end=entry.endedAt?new Date(entry.endedAt):null;
      const durMs=end?(entry.endedAt-entry.startedAt):null;
      const h=durMs!=null?Math.floor(durMs/3600000):0;
      const m=durMs!=null?Math.floor((durMs%3600000)/60000):0;
      const s=durMs!=null?Math.floor((durMs%60000)/1000):0;
      const durStr=durMs!=null?(h>0?`${h}h ${m}m ${s}s`:m>0?`${m}m ${s}s`:`${s}s`):"–";
      const fmtT=(d)=>d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
      
      const statusColors={
        "Time In":"#7c3aed","Time Out":"#6b7280",
        "Ongoing":"var(--amber)",
        "Site Comment":"#40513b","Inbound Email":"#7c3aed",
        "Break":"var(--green)",
      };
      
      const outcomeColors={
        "Completed":"var(--green)",
        "Updated":"var(--accent)",
        "Clarification":"var(--amber)",
        "Suspended":"var(--red)",
        "Deleted":"#c54446",
        "Editing…":"var(--muted)",
        "Continued Draft Saved":"var(--amber)",
        "Draft Saved":"var(--amber)",
        "Prolonged":"#f59e0b",
        "Completed Prolonged":"var(--green)",
        "Pending":"#f59e0b",
        "Break Ended":"var(--amber)",
        "Open Hour Ended":"var(--accent)",
        "Cancelled":"var(--red)",
        "Archived":"var(--amber)"
      };
      
      const col=statusColors[entry.status]||"var(--text)";
      const isOngoing=!end;
      const outcome=entry.outcome||"";
      const caseNum=entry.caseNum||"";
      
      // Determine if duplicate and get unique color
      const isDuplicate=!!caseNum&&caseNumCounts[caseNum]>1;
      const activeDupColor = isDuplicate ? dupColorMap[caseNum] : null;

      const outcomeColor=outcome?outcomeColors[outcome]||"var(--muted)":"var(--muted)";
      const isLatestForCase=!!caseNum&&displayCaseNumLastIdx[caseNum.trim()]===i;
      const editButtonDisabled = !!editCase && (editCase._mode === "siteComment" || editCase._mode === "inbound");
      
      const isSuspended = outcome === "Suspended";
      
      const isCaseEntry = entry.status==="Site Comment" || 
                          entry.status==="Inbound Email" || 
                          (entry.status==="Ongoing" && caseNum && outcome);
      
      const isContinueSuspended = outcome === "Suspended";
      const isDeleted = outcome === "Deleted";
      const buttonText = isContinueSuspended ? "Continue" : "Edit";

      // A suspended entry should lose its "Continue" button once the case has been
      // completed — either as a later entry in this same session log, or saved to
      // allSavedCases (continued in a previous / the same session and fully saved).
      const suspendedButLaterCompleted = isContinueSuspended && caseNum && (() => {
        // Check if a later session-log entry for the same case is Completed/Updated
        const laterCompletedInLog = sessionLog.some((e, j) =>
          j > i &&
          (e.caseNum || "").trim() === caseNum.trim() &&
          (e.outcome === "Completed" || e.outcome === "Updated")
        );
        if (laterCompletedInLog) return true;
        // Check if the case exists in allSavedCases (completed and persisted)
        const isSavedCompleted = !!(allSavedCases || []).find(c => c.caseNum === caseNum);
        if (isSavedCompleted) return true;
        return false;
      })();

      const showButton = isCaseEntry && 
                         caseNum && 
                         !isOngoing && 
                         outcome !== "Prolonged" && outcome !== "Pending" && outcome !== "Completed Prolonged" &&
                         !suspendedButLaterCompleted &&
                         (!isDuplicate || isLatestForCase);

      // ── Bundle badge: look up this case in saved cases and drafts ──
      // ── Post-save bundle: look up _bundledWith on saved/draft case ──
      // Use only the correct source: suspended entries live in drafts, completed ones in saved cases.
      // Merging both caused cross-contamination (e.g. completed case showing suspended partner badge).
      const entryIsSuspended = outcome === "Suspended";
      const savedCaseForEntry = !entryIsSuspended && caseNum ? allSavedCases?.find(c => c.caseNum === caseNum) : null;
      const draftCaseForEntry = entryIsSuspended && caseNum ? dbDrafts?.find(d => d.caseNum === caseNum) : null;
      const rawBundledWith = savedCaseForEntry?._bundledWith ?? draftCaseForEntry?._bundledWith ?? null;
      const savedBundleNums = rawBundledWith
        ? (Array.isArray(rawBundledWith) ? rawBundledWith : [rawBundledWith]).filter(Boolean)
        : [];
      const isSavedBundle = savedBundleNums.length > 0;

      // ── Pre-save bundle: detect using activeBundleCaseNum (the chosen partner) ──
      // The EXISTING chosen case: its caseNum matches activeBundleCaseNum
      const isChosenBundle = !!activeBundleCaseNum && caseNum === activeBundleCaseNum;
      // The NEW active case: it is the current open (not yet ended) form entry while a bundle is set
      const isNewActiveBundle = !!activeBundleCaseNum && !entry.endedAt &&
        (entry.status === "Site Comment" || entry.status === "Inbound Email" || entry.status === "Ongoing");

      const isBundled = isSavedBundle || isChosenBundle || isNewActiveBundle;

      // Build the label text for the badge
      const bundleNums = isSavedBundle
        ? savedBundleNums
        : isChosenBundle
          ? ["new case"]           // existing case: partner is the new case being worked on
          : [activeBundleCaseNum]; // new active case: partner is the chosen existing case
   
      return (
        <div key={entry.id} className="session-log-row" style={{
          background: i%2===0?"var(--none)":"transparent",
          borderLeft: isDuplicate ? `3px solid ${activeDupColor.border}` : "3px solid transparent"
        }}>
          
          {/* Case Number cell — wraps case # + bundle badge in one grid column */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-center",gap:4,justifyContent:"center"}}>
            <span style={{
              color: isDuplicate ? activeDupColor.border : (caseNum ? "var(--text)" : "var(--muted)"),
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: caseNum ? 700 : 400,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: isDuplicate ? activeDupColor.bg : "transparent",
              padding: isDuplicate ? "2px 8px" : "0",
              borderRadius: isDuplicate ? "4px" : "0"
            }}>
              {caseNum ? `#${caseNum}` : "-"}
              {isDuplicate && <span style={{fontSize:9,fontFamily:"'Poppins',sans-serif",fontWeight:800}}></span>}
              {caseNum && <CopyCaseBtn caseNum={caseNum}/>}
            </span>
            {isBundled && (()=>{
              const isMulti = bundleNums.length > 1;
              const col = isMulti ? "#f59e0b" : "#10b981";
              const bg  = isMulti ? "rgba(245,158,11,.14)" : "rgba(16,185,129,.14)";
              const bdr = isMulti ? "1px solid rgba(245,158,11,.35)" : "1px solid rgba(16,185,129,.35)";
              return (
                <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:9,fontWeight:800,color:col,background:bg,border:bdr,padding:"2px 7px",borderRadius:20,whiteSpace:"nowrap",fontFamily:"'Poppins',sans-serif",lineHeight:1.4}}>
                  {isSavedBundle ? `🔗 w/ #${bundleNums.join(", #")}` : isChosenBundle ? "Bundling w/ new case" : `🔗 Bundle of #${activeBundleCaseNum}`}
                </span>
              );
            })()}
            {(()=>{
              const logCase = caseNum ? ((allSavedCases||[]).find(c=>c.caseNum===caseNum)||(dbDrafts||[]).find(d=>d.caseNum===caseNum)) : null;
              const cx = logCase?._caseComplexity;
              if(!cx||cx==="minor") return null;
              if(cx==="major") return <span style={{display:"inline-flex",alignItems:"center",fontSize:9,fontWeight:800,color:"#f59e0b",background:"rgba(245,158,11,.14)",border:"1px solid rgba(245,158,11,.35)",padding:"2px 7px",borderRadius:20,whiteSpace:"nowrap",fontFamily:"'Poppins',sans-serif",lineHeight:1.4}}>Major</span>;
              return <span style={{display:"inline-flex",alignItems:"center",fontSize:9,fontWeight:800,color:"#c54446",background:"rgba(197,68,70,.14)",border:"1px solid rgba(197,68,70,.35)",padding:"2px 7px",borderRadius:20,whiteSpace:"nowrap",fontFamily:"'Poppins',sans-serif",lineHeight:1.4}}>Complex</span>;
            })()}
          </div>
          
          <div style={{color:col,display:"flex",alignItems:"center",gap:6,fontWeight:700,fontFamily:"'Poppins',sans-serif",fontSize:11,whiteSpace:"nowrap"}}>
            <span className={`session-log-status-dot${isOngoing?" ongoing-dot":""}`} style={{background:col,boxShadow:`0 0 6px ${col}55`,width:7,height:7,borderRadius:"50%",flexShrink:0}}/>
            {entry.status}
          </div>
          
          <span style={{color:"var(--text)",fontFamily:"monospace",fontSize:11}}>{fmtT(start)}</span>
          <span style={{color:end?"var(--text)":"var(--accent)",fontFamily:"monospace",fontSize:11}}>
            {end?fmtT(end):<span className="session-log-ongoing">-</span>}
          </span>
          <span style={{color:isOngoing?"var(--accent)":"var(--muted)",fontSize:11,fontFamily:"monospace",fontWeight:isOngoing?700:400}}>
            {isOngoing?"-":durStr}
          </span>
          <span style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
            {caseNum&&(()=>{
              const logCase = (allSavedCases||[]).find(c=>c.caseNum===caseNum)||(dbDrafts||[]).find(d=>d.caseNum===caseNum);
              const cx = logCase?._caseComplexity||"minor";
              if(cx==="major") return <span style={{fontSize:9,fontWeight:800,color:"#f59e0b",background:"rgba(245,158,11,.14)",border:"1px solid rgba(245,158,11,.35)",padding:"2px 7px",borderRadius:20,fontFamily:"'Poppins',sans-serif"}}>Major</span>;
              if(cx==="complex") return <span style={{fontSize:9,fontWeight:800,color:"#c54446",background:"rgba(197,68,70,.14)",border:"1px solid rgba(197,68,70,.35)",padding:"2px 7px",borderRadius:20,fontFamily:"'Poppins',sans-serif"}}>Complex</span>;
              return <span style={{fontSize:9,fontWeight:800,color:"#10b981",background:"rgba(16,185,129,.14)",border:"1px solid rgba(16,185,129,.35)",padding:"2px 7px",borderRadius:20,fontFamily:"'Poppins',sans-serif"}}>Minor</span>;
            })()}
          </span>
          <span style={{color:outcomeColor,fontSize:10,fontWeight:700,fontFamily:"'Poppins',sans-serif",letterSpacing:".2px"}}>
            {outcome||"-"}
          </span>
          <div>
            {isDeleted?(
              <span style={{fontSize:10,fontWeight:700,color:"#c54446",fontFamily:"'Poppins',sans-serif",background:"rgba(197,68,70,.12)",padding:"3px 8px",borderRadius:2,border:"1px solid rgba(197,68,70,.3)"}}>Deleted</span>
            ):(outcome==="Prolonged"||outcome==="Pending")?(
              <span style={{fontSize:9,fontWeight:700,color:"#f59e0b",fontFamily:"'Poppins',sans-serif",background:"rgba(245,158,11,.1)",padding:"3px 8px",borderRadius:6,border:"1px solid rgba(245,158,11,.3)"}}>⏳ Tracker pending</span>
            ):outcome==="Completed Prolonged"?(
              <span style={{fontSize:9,fontWeight:700,color:"var(--green)",fontFamily:"'Poppins',sans-serif",background:"rgba(16,185,129,.1)",padding:"3px 8px",borderRadius:6,border:"1px solid rgba(16,185,129,.3)"}}>Prolonged done</span>
            ):showButton?(
              <button
                className="session-log-edit-btn"
                disabled={breakActive || isMinimised || editButtonDisabled}
                onClick={() => {
                  const draft = dbDrafts?.find(d => d.caseNum === caseNum);
                  if (draft && isSuspended) {
                    enterMode(draft._mode, true, draft._id);
                  } else {
                    enterEditFromLog(entry);
                  }
                }}
                style={{
                  opacity: (breakActive || isMinimised || editButtonDisabled) ? 0.45 : 1,
                  cursor: (breakActive || isMinimised || editButtonDisabled) ? "not-allowed" : "pointer",
                }}
              >
                {buttonText}
              </button>
            ):<span style={{color:"var(--muted)",fontSize:10}}></span>}
          </div>
        </div>
      );
    })}
                  {(()=>{
                    // ── Total time: sum ALL closed entries (every row in the table is a sequential,
                    // non-overlapping block, so plain addition gives the real wall-clock total) ──
                    const totalMs=sessionLog.filter(e=>e.endedAt).reduce((acc,e)=>acc+(e.endedAt-e.startedAt),0);

                    // ── Break total (for display) ──
                    const breakMs=sessionLog.filter(e=>e.status==="Break"&&e.endedAt).reduce((acc,e)=>acc+(e.endedAt-e.startedAt),0);

                    // ── Outcome counters ──
                    const uniqueCases=new Set(sessionLog.filter(e=>e.caseNum).map(e=>(e.caseNum||"").trim()));
                    const totalCasesCount=uniqueCases.size;
                    const completedCount=sessionLog.filter(e=>e.outcome==="Completed").length;
                    const clarificationCount=sessionLog.filter(e=>e.outcome==="Clarification").length;
                    const suspendedCount=sessionLog.filter(e=>e.outcome==="Suspended").length;

                    // ── Weighted case score (Minor=1, Major=2, Complex=3) ──
                    const cxWeight=(cx)=>cx==="complex"?3:cx==="major"?2:1;
                    const weightedScore=[...uniqueCases].reduce((acc,cn)=>{
                      const saved=(allSavedCases||[]).find(c=>c.caseNum===cn);
                      const draft=(dbDrafts||[]).find(d=>d.caseNum===cn);
                      return acc+cxWeight((saved||draft)?._caseComplexity);
                    },0);

                    const fmtMs=(ms)=>{
                      const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);
                      return h>0?`${h}h ${m}m ${s}s`:m>0?`${m}m ${s}s`:`${s}s`;
                    };

                    const pill=(label,val,color,bg)=>(
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 14px",background:bg||"var(--entry-bg)",border:`1.5px solid ${color}33`,borderRadius:8,minWidth:70,flex:1}}>
                        <span style={{fontSize:16,fontWeight:800,color,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1}}>{val}</span>
                        <span style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".7px",fontFamily:"'Poppins',sans-serif",marginTop:3,fontWeight:700,textAlign:"center"}}>{label}</span>
                      </div>
                    );

                    return (
                      <>
                        <div className="session-log-total">
                          <span style={{fontWeight:800,fontSize:11,color:"var(--accent)",fontFamily:"'Poppins',sans-serif"}}>⏱ Total tracked time</span>
                          <span/><span/><span/>
                          <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'Poppins',sans-serif",fontStyle:"italic"}}>
                            {breakMs>0&&`☕ ${fmtMs(breakMs)} breaks`}
                          </span>
                          <span/>
                          <span style={{fontWeight:800,fontSize:12,color:"var(--accent)",fontFamily:"monospace"}}>{fmtMs(totalMs)}</span>
                        </div>
                        {/* ── Summary footer pills ── */}
                        <div style={{display:"flex",gap:8,padding:"12px 16px",borderTop:"1px solid var(--border)",background:"var(--glass-bg)",flexWrap:"wrap"}}>
                          {pill("Total Hours",fmtMs(totalMs),"var(--accent)")}
                          {pill("Cases",totalCasesCount,"var(--accent2)")}
                          {pill("Weighted",weightedScore,"#a855f7","rgba(168,85,247,.07)")}
                          {pill("Completed",completedCount,"var(--green)","rgba(16,185,129,.07)")}
                          {pill("Clarification",clarificationCount,"var(--amber)","rgba(245,158,11,.07)")}
                          {pill("Suspended",suspendedCount,"var(--red)","rgba(197,68,70,.07)")}
                          {(()=>{const pendingCount=(sessionLog||[]).filter(e=>e.outcome==="Pending").length;const doneCount=(sessionLog||[]).filter(e=>e.outcome==="Completed Prolonged").length;return<>{pendingCount>0&&pill("Pending",pendingCount,"#f59e0b","rgba(245,158,11,.07)")}{doneCount>0&&pill("Prolonged Done",doneCount,"var(--green)","rgba(16,185,129,.07)")}</>})()}
                          {breakMs>0&&pill("Break Time",fmtMs(breakMs),"var(--muted)")}
                        </div>
                      </>
                    );
                  })()}
                </>;
              })()}
            </>
          )}
        </div>
  )
}
