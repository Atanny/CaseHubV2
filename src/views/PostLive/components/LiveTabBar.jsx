import { storage } from '@/services/storage'
import { Icon } from '@/components/ui/Icon'

export function LiveTabBar({ activeFormTabId, activeLiveTabs, breakActive, exitMode, handleTabDragStart, handleTabDrop, mode, setActiveFormTabId, setActiveLiveTabs, setMode, setShowAddTabPicker, setTabTimerStates, showAddTabPicker, tabTimerStates, timedIn }) {
  return (
    <div style={{display:"flex",alignItems:"stretch",gap:0,background:"#33402f",borderBottom:"1px solid rgba(255,255,255,.08)",padding:"0 8px",flexShrink:0,minHeight:46,overflowX:"auto"}}>
            {/* Live (filling) tabs */}
            {activeLiveTabs.map((tab,i)=>{
              const isActive=tab.id===activeFormTabId||(activeLiveTabs.length===1&&!activeFormTabId);
              const isQueued=tab.startTime===null&&!isActive;
              // Build compact label from live tab data
              const tState=tabTimerStates[tab.id];
              const timerSecs=tState&&tab.startTime!==null?(tState.footerElapsed||0):0;
              const hasTimer=timerSecs>0;
              const timerMins=Math.floor(timerSecs/60);
              const timerRemSecs=String(timerSecs%60).padStart(2,"0");
              const timerStr=`${timerMins}:${timerRemSecs}`;
              const cx=tab.complexity||'minor';
              const cxLetter=cx==='complex'?'C':cx==='major'?'M':'m'; // C=Complex M=Major m=minor
              const cnum=tab.caseNum?`${cxLetter} #${tab.caseNum}`:'';
              // Business name = everything after the mode prefix in the label
              const bizRaw=(tab.label||'').replace(/^(Inbound Email|Site Comment)\s*[-—]?\s*/i,'').replace(/\s*#\S*\s*$/,'').trim();
              const tabDisplay=[cnum,bizRaw].filter(Boolean).join(' — ')||(tab.mode==='inbound'?'Inbound Email':'Site Comment');
              return (
                <div key={tab.id}
                  draggable
                  onDragStart={e=>handleTabDragStart(e,tab.id)}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>handleTabDrop(e,tab.id)}
                  onClick={()=>setActiveFormTabId(tab.id)}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"0 10px 0 12px",cursor:"grab",minWidth:150,maxWidth:240,borderRadius:"6px 6px 0 0",marginTop:4,marginRight:2,background:isActive?"var(--card)":"rgba(255,255,255,.07)",borderTop:isActive?"2px solid var(--accent)":"2px solid transparent",position:"relative",flexShrink:0}}>
                  <span style={{width:8,height:8,borderRadius:"50%",flexShrink:0,background:tab.mode==='inbound'?"#8b5cf6":"#3b82f6",boxShadow:isActive?(tab.mode==='inbound'?"0 0 6px rgba(139,92,246,.7)":"0 0 6px rgba(59,130,246,.7)"):"none",display:"inline-block"}} title={tab.mode==='inbound'?"Inbound Email":"Site Comment"}/>
                  <span style={{fontSize:11,fontWeight:isActive?700:400,color:isActive?"var(--text)":"rgba(255,255,255,.6)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1,minWidth:0,fontFamily:"'Poppins',sans-serif"}}>{tabDisplay}</span>
                  {hasTimer&&!isQueued&&<span style={{fontSize:9,fontWeight:700,fontFamily:"monospace",color:isActive?"var(--accent)":"rgba(255,255,255,.45)",flexShrink:0,letterSpacing:".3px"}}>{timerStr}</span>}
                  {isQueued&&<span style={{fontSize:9,fontWeight:700,color:"var(--amber)",background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.3)",borderRadius:4,padding:"1px 5px",flexShrink:0,fontFamily:"'Poppins',sans-serif",letterSpacing:".4px"}}>QUEUED</span>}
                  {activeLiveTabs.length>1&&<button onClick={e=>{
                      e.preventDefault();
                      e.stopPropagation();
                      const closedTabId=tab.id;
                      // ── KEY RULE ──
                      // A tab has a RUNNING timer only when tab.startTime !== null.
                      // startTime===null means it is QUEUED (timer never started, elapsed=0).
                      // Only a tab with a running timer (startTime!==null) may pass its
                      // elapsed time to the next queued tab. Closing a queued tab is a
                      // simple removal — no timer logic, no queue-advance, nothing else.
                      const hasRunningTimer = tab.startTime !== null;
                      // Use the live state snapshot to avoid closure staleness
                      setActiveLiveTabs(current=>{
                        const remaining=current.filter(t=>t.id!==closedTabId);
                        if(!hasRunningTimer){
                          // Queued tab (0 timer) — just remove it, no time transfer
                          storage.remove(`ch_tab_form_${closedTabId}`);
                          return remaining;
                        }
                        // Running (active) tab — pass its elapsed time to the next queued tab
                        if(remaining.length===0){ exitMode(); return []; }
                        const closedIdx=current.findIndex(t=>t.id===closedTabId);
                        const nextIdx=Math.min(closedIdx,remaining.length-1);
                        const now=Date.now();
                        const polledElapsed=tabTimerStates[closedTabId]?.footerElapsed||0;
                        const liveElapsed=Math.floor((now-tab.startTime)/1000);
                        const elapsedSecs=Math.max(polledElapsed,liveElapsed);
                        const updated=remaining.map((t,i)=>{
                          // Only activate the IMMEDIATELY NEXT tab; others stay queued at 0
                          if(i===nextIdx && t.startTime===null && !breakActive){
                            return {...t,startTime:now-(elapsedSecs*1000)};
                          }
                          return t;
                        });
                        const nextTab=updated[nextIdx];
                        setActiveFormTabId(nextTab?.id||null);
                        setTabTimerStates(prev=>{const n={...prev};delete n[closedTabId];return n;});
                        if(nextTab) setMode(nextTab.mode||mode);
                        // Clear the closed tab's persisted form data
                        storage.remove(`ch_tab_form_${closedTabId}`);
                        return updated;
                      });
                    }} style={{background:"none",border:"none",color:isActive?"var(--text)":"rgba(255,255,255,.5)",cursor:"pointer",fontSize:15,padding:"0 0 0 4px",marginLeft:2,lineHeight:1,flexShrink:0,opacity:.6}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.6}>×</button>}
                </div>
              );
            })}
            {/* Add new tab button — visible even when a form is minimised */}
            {timedIn&&(
              <button onClick={()=>setShowAddTabPicker(true)} style={{display:"flex",alignItems:"center",justifyContent:"center",width:34,height:30,marginTop:4,borderRadius:"6px 6px 0 0",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderBottom:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:20,fontWeight:300,flexShrink:0,alignSelf:"flex-end",lineHeight:1}}>+</button>
            )}
            {/* Add-tab type picker modal */}
            {showAddTabPicker&&(
              <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)setShowAddTabPicker(false);}}>
                <div className="modal" style={{maxWidth:480,width:"92%"}}>
                  <h3 style={{textAlign:"center",marginBottom:4}}>New Tab</h3>
                  <p style={{textAlign:"center",color:"var(--muted)",fontSize:13,marginBottom:18}}>What type of case is this?</p>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    {[{m:"siteComment",label:"Site Comment",icon:"sitecomment"},{m:"inbound",label:"Inbound Email",icon:"inbound"}].map(({m,label,icon})=>(
                      <button key={m} className="pl-type-btn" style={{flex:"1 1 180px",minWidth:0,padding:"16px 18px"}} onClick={()=>{
                        setShowAddTabPicker(false);
                        const tid=String(Date.now());
                        const tabLabel=label+' — New';
                        // New queued tabs start frozen (startTime=null) until the active tab is saved
                        setActiveLiveTabs(ts=>[...ts,{id:tid,mode:m,key:tid,label:tabLabel,caseNum:'',startTime:null}]);
                        setActiveFormTabId(tid);
                        // Update global mode so header/context stays correct
                        setMode(m);
                        storage.set("ch_active_form_mode",m);
                      }}>
                        <div className="pl-type-icon"><Icon name={icon} size={20} color="var(--accent)"/></div>
                        <div style={{fontSize:13,fontWeight:600}}>{label}</div>
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-ghost" style={{width:"100%",marginTop:10}} onClick={()=>setShowAddTabPicker(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
  )
}
