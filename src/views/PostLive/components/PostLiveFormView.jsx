import { LiveTabBar } from './LiveTabBar'
import { TimerBar } from './TimerBar'
import { fmtElapsed } from '@/utils/format'
import { PostLiveForm } from './PostLiveForm'
import { storage } from '@/services/storage'
import { idbClearImages } from '@/services/pendingImageStore'
import * as sessionService from '@/services/sessionService'
import { FileNameGeneratorPage } from '@/views/FileNameGenerator/FileNameGeneratorPage'
import { CancelFormConfirmModal } from './CancelFormConfirmModal'
import { usePostLive } from '../PostLiveContext'

export function PostLiveFormView() {
  const {
    activeDraftId, activeFormTabId, activeLiveTabs, alarmMins, allSavedCases, backConfirm,
    breakActive, breakTimer, cancelMode, caseStartTimeRef, currentDraft, dbDrafts, editingCase,
    exitMode, handleTabDragStart, handleTabDrop, isEditingFromLog, isResumingMinimised,
    minimiseMode, mode, onDeleteDraft, onMinimise, onSaveCase, onSaveDraft, onStartBreak,
    onStartBreakFull, onStartOpenHour, onStopBreak, onStopOpenHour, onTimerEnd, onTimerReset,
    onUpdateCase, onUpdateDraft, openHourActive, qaAlarmMins, sessionDbId, sessionLog,
    setActiveBundleCaseNum, setActiveFormTabId, setActiveLiveTabs, setBackConfirm, setEditingCase,
    setMinimisedFormData, setMode, setSessionLog, setShowAddTabPicker, setShowFnGen,
    setTabTimerStates, sharedFormRef, showAddTabPicker, showFnGen, specialRequestors,
    tabTimerStates, timedIn, useDraft, user, zeroTimerState,
  } = usePostLive()

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",minHeight:0}}>

        {/* Chrome-style tab bar at the very top */}
        {(activeLiveTabs.length>0)&&(
          <LiveTabBar
            activeFormTabId={activeFormTabId}
            activeLiveTabs={activeLiveTabs}
            breakActive={breakActive}
            exitMode={exitMode}
            handleTabDragStart={handleTabDragStart}
            handleTabDrop={handleTabDrop}
            mode={mode}
            setActiveFormTabId={setActiveFormTabId}
            setActiveLiveTabs={setActiveLiveTabs}
            setMode={setMode}
            setShowAddTabPicker={setShowAddTabPicker}
            setTabTimerStates={setTabTimerStates}
            showAddTabPicker={showAddTabPicker}
            tabTimerStates={tabTimerStates}
            timedIn={timedIn}
          />
        )}

        <div className="page-header pl-dark-header" style={{padding:"16px 32px",flexShrink:0,margin:0,display:"flex",alignItems:"center",gap:16,justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,minWidth:0}}>
            <button onClick={()=>onMinimise&&onMinimise()} title="Minimize" style={{width:34,height:34,borderRadius:20,border:"1.5px solid rgba(255,255,255,.35)",background:"rgba(255,255,255,.08)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>←</button>
            <div style={{minWidth:0}}>
              {(()=>{
                const activeTabMode=(activeLiveTabs.find(t=>t.id===activeFormTabId)||activeLiveTabs[0])?.mode||mode;
                const isSC=activeTabMode==="siteComment";
                return (<>
                  <div className="page-title" style={{fontSize:20,color:"#fff",margin:0}}>{isEditingFromLog?`Editing Case #${editingCase.savedCase.caseNum}`:currentDraft&&!isResumingMinimised?`Continuing Suspended Case #${currentDraft.caseNum||""}`:"Post-Live Amends Form"}</div>
                  <div className="page-sub" style={{color:"rgba(255,255,255,.7)",margin:0}}>{isEditingFromLog?"Editing saved case — all fields are editable.":currentDraft&&!isResumingMinimised?"Resuming suspended case — all fields are editable.":isSC?"Site Comment":"Inbound Email"}</div>
                </>);
              })()}
            </div>
          </div>
          <div style={{'--accent':'#ffffff','--muted':'rgba(255,255,255,.75)','--green':'#8fd98f','--glass-border':'rgba(255,255,255,.25)',flexShrink:0}}>
            <TimerBar {...(()=>{
              const activeTab=activeLiveTabs.find(t=>t.id===activeFormTabId)||activeLiveTabs[0];
              if(activeTab&&activeTab.startTime===null) return zeroTimerState;
              return tabTimerStates[activeFormTabId]||zeroTimerState;
            })()} fmtElapsed={fmtElapsed}/>
          </div>
        </div>



        {/* Break / Meeting banner — amber bar under the header (Figma), no emoji */}
        {breakActive&&breakTimer&&(()=>{
          const pct=breakTimer.ended?100:Math.round((1-(breakTimer.secsLeft/(breakTimer.mins*60)))*100);
          const mm=Math.floor((breakTimer.secsLeft||0)/60);
          const ss=String((breakTimer.secsLeft||0)%60).padStart(2,"0");
          return (
            <div className="pl-break-banner">
              <div style={{fontWeight:700,fontSize:12,textTransform:"uppercase",letterSpacing:".4px"}}>
                {breakTimer.ended?"Break over":breakTimer.warned?"Break ending soon":"You are on break"} · {breakTimer.label}
              </div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18}}>{breakTimer.ended?"Done":mm+":"+ss}</div>
              <div className="pl-break-track"><div style={{width:pct+"%"}}/></div>
              <button className="btn btn-primary" onClick={onStopBreak}>End Break</button>
            </div>
          );
        })()}
        {openHourActive&&(
          <div className="pl-break-banner">
            <div style={{fontWeight:700,fontSize:12,textTransform:"uppercase",letterSpacing:".4px"}}>Meeting · session timer paused</div>
            <div className="pl-break-track" style={{opacity:0}}><div/></div>
            <button className="btn btn-primary" onClick={onStopOpenHour}>End Meeting</button>
          </div>
        )}

        {/* Render one PostLiveForm per live tab; only show active */}
        {(activeLiveTabs.length>0?activeLiveTabs:[{id:'default',mode,key:`${mode}-${activeDraftId||"new"}-${isEditingFromLog?"edit":"new"}`,isFirstTab:true}]).map((tab,tabIdx)=>{
          const tabMode=tab.mode||mode; // each tab can have its own mode
          const isActiveTab=tab.id===activeFormTabId||(activeLiveTabs.length<=1&&!activeFormTabId)||activeLiveTabs.length===0;
          // Only the first tab gets draft/edit data; additional tabs are always fresh
          const isFirstTab = tabIdx===0 || tab.isFirstTab;
          // For non-first tabs: restore from per-tab localStorage key if available.
          // PostLiveForm's own useState already checks this key first, so this is
          // a belt-and-suspenders pass for the draftData prop path.
          const tabPersistedData = (!isFirstTab && typeof window!=="undefined")
            ? (()=>{ try{ const v=localStorage.getItem(`ch_tab_form_${tab.id}`); return v?JSON.parse(v):null; }catch{return null;} })()
            : null;
          const tabDraftData = isFirstTab ? currentDraft : tabPersistedData;
          const tabIsEdit = isFirstTab && isEditingFromLog;
          const tabIsResumingMin = isFirstTab && isResumingMinimised;
          const tabUseDraft = isFirstTab && useDraft;
          return (
          <div key={tab.key||tab.id} style={{display:isActiveTab?"flex":"none",flexDirection:"column",flex:isActiveTab?1:undefined,overflow:"hidden",minHeight:isActiveTab?0:undefined}}>
          <PostLiveForm key={tab.key||`${tabMode}-${activeDraftId||"new"}-${isEditingFromLog?"edit":"new"}`} mode={tabMode} draftData={tabDraftData} user={user} onTimerEnd={isActiveTab&&(alarmMins>0)?onTimerEnd:null} onQaTimerEnd={isActiveTab&&(qaAlarmMins>0)?onTimerEnd:null} specialRequestors={specialRequestors} timerLimitSecs={alarmMins*60} qaTimerLimitSecs={qaAlarmMins*60} isEditMode={tabIsEdit} isMinimisedResume={tabIsResumingMin} caseStartTime={tab.startTime!==undefined?tab.startTime:caseStartTimeRef.current} externalFormRef={isFirstTab?sharedFormRef:null} isResumingDraft={tabUseDraft} onTimerTick={tab.startTime!==null?t=>setTabTimerStates(prev=>({...prev,[tab.id]:t})):null} tabStorageKey={tab.id||null} onTabDataChange={({caseNum,businessName,complexity})=>setActiveLiveTabs(ts=>ts.map(t=>t.id===tab.id?{...t,caseNum,complexity:complexity||'minor',label:(t.mode==='inbound'?'Inbound Email':'Site Comment')+(businessName?' — '+businessName:'')+(caseNum?' #'+caseNum:'')}:t))} onOpenFileNameGenerator={()=>{if(typeof window!=="undefined") window.dispatchEvent(new Event("ch_case_saved")); setShowFnGen(true);}}
          originalOutcome={tabIsEdit?(editingCase.savedCase._saveOutcome||""):tabUseDraft?"Suspended":""}
          originalTotalSecs={(()=>{
            const targetCase = tabIsEdit ? editingCase.savedCase : tabDraftData;
            const caseNum = (targetCase?.caseNum||"").trim();
            // Use only the LATEST closed entry for this caseNum to avoid double-counting duplicates
            if(caseNum && sessionLog?.length){
              const entries = sessionLog.filter(e=>
                e.endedAt && (e.caseNum||"").trim()===caseNum &&
                e.status!=="Time In" && e.status!=="Time Out" && e.status!=="Break"
              );
              if(entries.length>0){
                const latest = entries.reduce((a,b)=>b.endedAt>a.endedAt?b:a);
                const ms = latest.endedAt - latest.startedAt;
                if(ms>0) return Math.floor(ms/1000);
              }
            }
            // Fallback: use stored _totalElapsed on the saved case
            return targetCase?._totalElapsed || targetCase?._elapsedAtSave || 0;
          })()}
          containerStyle={{flex:1,overflow:"hidden",minHeight:0}}
          onSave={f=>{
  const tabId=tab.id;
  const now=new Date();const rec={...f,_mode:tabMode,savedAt:now.toLocaleString(),endedAt:now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})};
  // Check if this case was started as a bundle
  const bundledWith = typeof window!=="undefined" ? (localStorage.getItem("ch_bundle_case_num")||"").trim() : "";
  if(bundledWith) {
    // New case stores bundled-with as array
    const prevOwn = rec._bundledWith ? (Array.isArray(rec._bundledWith)?rec._bundledWith:[rec._bundledWith]) : [];
    rec._bundledWith = [...new Set([...prevOwn, bundledWith])];
    // Update the existing case to point back at this new case number (deferred — newCaseNum available after save)
    const newNum = f.caseNum||"";
    const existingCase = allSavedCases.find(c=>c.caseNum===bundledWith);
    if(existingCase) {
      const prevExisting = existingCase._bundledWith ? (Array.isArray(existingCase._bundledWith)?existingCase._bundledWith:[existingCase._bundledWith]) : [];
      if(newNum && !prevExisting.includes(newNum)) {
        onUpdateCase&&onUpdateCase(existingCase._id,{...existingCase,_bundledWith:[...prevExisting,newNum]});
      }
    } else {
      // Partner may be a suspended draft — update it too
      const existingDraft = (dbDrafts||[]).find(d=>d.caseNum===bundledWith);
      if(existingDraft) {
        const prevExisting = existingDraft._bundledWith ? (Array.isArray(existingDraft._bundledWith)?existingDraft._bundledWith:[existingDraft._bundledWith]) : [];
        if(newNum && !prevExisting.includes(newNum)) {
          onUpdateDraft&&onUpdateDraft(existingDraft._id,{...existingDraft,_bundledWith:[...prevExisting,newNum]});
        }
      }
    }
    storage.remove("ch_bundle_case_num");
    setActiveBundleCaseNum("");
  }
  if(isEditingFromLog){
    onUpdateCase&&onUpdateCase(editingCase.savedCase._id,rec);
    setEditingCase(null);
  } else {
    if(currentDraft?._id) onDeleteDraft&&onDeleteDraft(currentDraft._id,tabMode,true);
    onSaveCase&&onSaveCase(rec);
  }
  // Clear minimised form data since it's now saved
  setMinimisedFormData(null);
  if(typeof window!=="undefined"){
    // Persist key fields so File Name Generator auto-fills from latest saved case
    localStorage.setItem("ch_last_saved_case",JSON.stringify({businessName:f.businessName||"",businessSuffix:f.businessSuffix||"",accountNum:f.accountNum||""}));
    localStorage.removeItem("ch_minimised_form");
    localStorage.removeItem("ch_fng_last_source"); // reset so next new case triggers fresh autofill
    // Notify FNG on the same tab (storage event only fires across tabs)
    window.dispatchEvent(new Event("ch_case_saved"));
  }
  if(!isEditingFromLog) onTimerReset&&onTimerReset();
  
  // Set outcome based on save type (clarification / completed) and whether it was a draft
  const rawOutcome = f._saveOutcome === "clarification" ? "Clarification" : "Completed";
  const outcomeLabel = isEditingFromLog ? "Updated" : (useDraft ? "Completed" : rawOutcome);
  const statusLabel = tabMode === "siteComment" ? "Site Comment" : "Inbound Email";
  
  // For edit mode: just update the existing open row's caseNum/outcome in-place, revert to Ongoing — no new row added.
  // For new/suspended saves: close the open row and add a fresh Ongoing row.
  const nowMs=Date.now();
  setSessionLog&&setSessionLog(prev=>{
    let next;
    if(isEditingFromLog){
      // Only update the CLOSED "Editing…" row (endedAt set) — never touch the open Ongoing row.
      const entries=[...prev];
      const lastCaseIdx=entries.map((e,i)=>({e,i})).filter(({e})=>e.caseNum===f.caseNum&&e.endedAt).pop()?.i;
      next=entries.map((e,i)=>{
        if(i===lastCaseIdx) return {...e,outcome:"Updated",status:e.status==="Ongoing"?statusLabel:e.status};
        return e;
      });
    } else {
      // Normal save / suspended complete: close open entry, add fresh Ongoing
      const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,status:statusLabel,endedAt:nowMs,outcome:outcomeLabel,caseNum:f.caseNum||e.caseNum||""}:e);
      const fresh={id:nowMs+1,status:"Ongoing",note:"",startedAt:nowMs,endedAt:null,outcome:"",endNote:""};
      next=[...closed,fresh];
    }
    storage.set("ch_session_log",JSON.stringify(next));
    return next;
  });
   idbClearImages("backup").catch(()=>{});
    idbClearImages("main").catch(()=>{});
    // Clear per-tab IDB keys for this specific tab
    idbClearImages(`${tabId}-backup`).catch(()=>{});
    idbClearImages(`${tabId}-main`).catch(()=>{});
    // Clear per-tab form persistence key
    storage.remove(`ch_tab_form_${tabId}`);
  // Close only the saved tab; if more tabs remain keep them open, else full exit
  setActiveLiveTabs(prev=>{
    const remaining=prev.filter(t=>t.id!==tabId);
    if(remaining.length===0){
      // Last tab saved — full exit
      exitMode();
      return [];
    }
    // Switch to adjacent tab — DO NOT remount other tabs (would wipe their form state)
    const savedIdx=prev.findIndex(t=>t.id===tabId);
    const nextIdx=Math.min(savedIdx,remaining.length-1);
    // Just update which tab is active — no key change
    // Only auto-start a queued tab if we are NOT on a break AND this save wasn't triggered by a break button
    const isBreakSave = !!(f&&f._breakPending);
    const updated=remaining.map((t,i)=>{
      if(i===nextIdx && t.startTime===null && !breakActive && !isBreakSave){
        // Not on break — activate the next queued tab immediately
        return {...t,startTime:Date.now()};
      }
      return t; // All other tabs: keep exactly as-is, no remount
    });
    setActiveFormTabId(updated[nextIdx].id);
    // Clean up ONLY the saved tab's timer state — leave others alone
    setTabTimerStates(prev=>{const n={...prev};delete n[tabId];return n;});
    // Update global mode to match newly active tab
    setMode(updated[nextIdx].mode||mode);
    storage.set("ch_active_form_mode",updated[nextIdx].mode||mode);
    return updated;
  });
}}
          onSaveDraftDirect={async(fd)=>{
            // Apply bundle info before suspending (mirrors onSave logic)
            const bundledWithDraft = typeof window!=="undefined" ? (localStorage.getItem("ch_bundle_case_num")||"").trim() : "";
            if(bundledWithDraft){
              const prevOwn = fd._bundledWith ? (Array.isArray(fd._bundledWith)?fd._bundledWith:[fd._bundledWith]) : [];
              fd = {...fd, _bundledWith:[...new Set([...prevOwn,bundledWithDraft])]};
            }
            await onSaveDraft(tabMode,{...fd,_mode:tabMode});
            // Clear minimised form data since it's now properly suspended
            setMinimisedFormData(null);
            storage.remove("ch_minimised_form");
            onTimerReset&&onTimerReset();
            const nowMs=Date.now();
            const statusLabel = tabMode === "siteComment" ? "Site Comment" : "Inbound Email";
            setSessionLog&&setSessionLog(prev=>{
              const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,status:statusLabel,endedAt:nowMs,outcome:"Suspended",caseNum:fd.caseNum||e.caseNum||""}:e);
              const fresh={id:nowMs+1,status:"Ongoing",note:"",startedAt:nowMs,endedAt:null,outcome:"",endNote:""};
              const next=[...closed,fresh];
              storage.set("ch_session_log",JSON.stringify(next));
              return next;
            });
            if(sessionDbId) sessionService.postSessionAction({action:'log_case',session_id:sessionDbId,email:user?.email,case_num:fd.caseNum,case_type:tabMode,note:'draft'}).catch(()=>{});
            // Close only this tab; full exit if last one
            setActiveLiveTabs(prev=>{
              const remaining=prev.filter(t=>t.id!==tab.id);
              if(remaining.length===0){ exitMode(); return []; }
              const savedIdx=prev.findIndex(t=>t.id===tab.id);
              const nextIdx=Math.min(savedIdx,remaining.length-1);
              const t2=Date.now();
              // Only activate the NEXT tab if it is genuinely queued (startTime===null)
              // and we are not on a break. NEVER remount other tabs (kills in-progress form state).
              // All other queued tabs remain frozen at startTime===null — no unintended activation.
              const updated=remaining.map((t,i)=>{
                if(i===nextIdx && t.startTime===null && !breakActive){
                  return {...t,startTime:t2};
                }
                return t;
              });
              setActiveFormTabId(updated[nextIdx].id);
              setTabTimerStates(prev=>{const n={...prev};delete n[tab.id];return n;});
              // Each tab clears its own scoped ch_phase2_start_{tabId} key on save — no global clear needed
              setMode(updated[nextIdx].mode||mode);
              storage.set("ch_active_form_mode",updated[nextIdx].mode||mode);
              return updated;
            });
          }}
          onBack={()=>setBackConfirm(true)}
          onCancelForm={cancelMode}
          onStartBreak={onStartBreakFull||onStartBreak}
          onStartOpenHour={onStartOpenHour}
          onStopOpenHour={onStopOpenHour}
          openHourActive={openHourActive}
          breakActive={breakActive}
          setSessionLog={setSessionLog}/>
          </div>
          );
        })}
        
        {/* ── File Name Generator modal — rendered at root level so it covers the full viewport ── */}
        {showFnGen&&(
          <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)setShowFnGen(false);}}>
            <div style={{background:"var(--glass-bg)",border:"1px solid var(--glass-border)",backdropFilter:"var(--glass-blur)",WebkitBackdropFilter:"var(--glass-blur)",borderRadius:14,padding:"24px 28px",width:"95%",maxWidth:1100,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"var(--glass-shadow)",overflowY:"auto"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexShrink:0}}>
                <h3 style={{margin:0,fontSize:18,fontWeight:700}}>File Name Generator</h3>
                <button onClick={()=>setShowFnGen(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"var(--muted)",lineHeight:1}}>×</button>
              </div>
              {(()=>{
                // Compute active tab's current form data from per-tab localStorage key
                const activeTab=activeLiveTabs.find(t=>t.id===activeFormTabId)||activeLiveTabs[0];
                let liveTabData=null;
                if(activeTab&&typeof window!=="undefined"){
                  try{
                    const raw=localStorage.getItem(`ch_tab_form_${activeTab.id}`)||localStorage.getItem("ch_minimised_form");
                    if(raw){const fd=JSON.parse(raw);liveTabData={businessName:fd.businessName||"",businessSuffix:fd.businessSuffix||"",accountNum:fd.accountNum||"",caseNum:fd.caseNum||""};}
                  }catch{}
                }
                return (
                  <FileNameGeneratorPage
                    activeTabData={liveTabData}
                    onFill={({bizFilename,bizAlt,accountNum})=>{
                      if(activeTab){
                        window.dispatchEvent(new CustomEvent("fngen_fill",{detail:{
                          businessName: bizFilename||bizAlt||"",
                          caseNum: activeTab.caseNum||"",
                          complexity: activeTab.complexity||"minor"
                        }}));
                      }
                    }}/>
                );
              })()}
            </div>
          </div>
        )}

        {backConfirm && (
          <CancelFormConfirmModal
            cancelMode={cancelMode}
            minimiseMode={minimiseMode}
            setBackConfirm={setBackConfirm}
            sharedFormRef={sharedFormRef}
          />
        )}
      </div>
  )
}
