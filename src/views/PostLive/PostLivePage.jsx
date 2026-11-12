import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { SavedCaseCard } from './components/SavedCaseCard'
import { storage } from '@/services/storage'
import { EditCaseModal } from './components/EditCaseModal'
import { SessionTimeLog } from './components/SessionTimeLog'
import { SuspendedCasesList } from './components/SuspendedCasesList'
import { BundleCasesModal } from './components/BundleCasesModal'
import { PostLiveHero } from './components/PostLiveHero'
import { useLiveTabs } from './hooks/useLiveTabs'
import { usePostLiveModes } from './hooks/usePostLiveModes'
import { PostLiveFormView } from './components/PostLiveFormView'
import { PostLiveContext } from './PostLiveContext'

export function PostLivePage({ onSaveCase, onUpdateCase, onUpdateDraft, onFormActive, onFormInFields, onMinimise, allSavedCases, dbDrafts, onSaveDraft, onDeleteDraft, onArchiveDraft, user, onTimerEnd, specialRequestors=[], alarmMins=30, qaAlarmMins=10, globalTimeIn, timedIn, breakActive=false, breakTimer=null, openHourActive=false, onTimeIn, onTimeOut, onTimerReset, sessionDbId, sessionLog=[], addSessionLog, setSessionLog, closeWithOutcome, closeSessionLog, clearSessionLog, onStartBreak, onStartBreakFull, onStopBreak, onStartOpenHour, onStopOpenHour, resumeTick=0 }) {
  const [mode,setMode]=useState(()=>{
    if(typeof window==="undefined") return null;
    // If live tabs are persisted, restore mode from the active tab
    try{
      const tabs=JSON.parse(localStorage.getItem("ch_live_tabs")||"[]");
      const activeId=localStorage.getItem("ch_live_tab_active");
      if(tabs.length>0){
        const activeTab=tabs.find(t=>t.id===activeId)||tabs[0];
        return activeTab.mode||localStorage.getItem("ch_active_form_mode")||null;
      }
    }catch{}
    return localStorage.getItem("ch_form_active")==="1"
      ? (localStorage.getItem("ch_active_form_mode")||null)
      : null;
  });
  const [useDraft,setUseDraft]=useState(()=>{
    if(typeof window==="undefined") return false;
    return localStorage.getItem("ch_active_form_use_draft")==="1";
  });
  const [backConfirm,setBackConfirm]=useState(false);
  const [deleteDraftConfirm,setDeleteDraftConfirm]=useState(null);
  const {
    activeFormTabId, activeLiveTabs, setActiveFormTabId, setActiveLiveTabs,
    showAddTabPicker, setShowAddTabPicker, showFnGen, setShowFnGen,
  } = useLiveTabs();
  const [openSavedId,setOpenSavedId]=useState(null);
  const [editCase,setEditCase]=useState(null);
  const [showLog,setShowLog]=useState(true);
  const [editingCase,setEditingCase]=useState(null); // {savedCase, mode} — for editing from session log
  const [isMinimised,setIsMinimised]=useState(false); // true when a form is minimised (paused)
  const [minimisedFormData,setMinimisedFormData]=useState(()=>{ // saves form inputs when minimised
    if(typeof window==="undefined") return null;
    try{ const v=localStorage.getItem("ch_minimised_form"); return v?JSON.parse(v):null; }catch{ return null; }
  });
  const [activeDraftId,setActiveDraftId]=useState(null); // tracks which specific draft to resume
  const [toast,showToast]=useToast();
  const [bundleModal,setBundleModal]=useState(false); // bundle linking modal
  const [bundleForm,setBundleForm]=useState({type:"site",caseNum:""});
  // Tracks the case number of the existing case chosen in the bundle modal (a DIFFERENT case number)
  const [activeBundleCaseNum,setActiveBundleCaseNum]=useState(()=>{
    if(typeof window==="undefined") return "";
    return localStorage.getItem("ch_bundle_case_num")||"";
  });
  const handledResumeTick=useRef(0);
  const sharedFormRef=useRef(null); // shared ref so minimiseMode can access PostLiveForm's current fields
  const [tabTimerStates,setTabTimerStates]=useState({}); // {[tabId]: timerState}
  const zeroTimerState={footerElapsed:0,resumeElapsed:0,phase2Elapsed:null,isDraftResumed:false,isEditMode:false,prevElapsedSecs:0,originalTotalSecs:0,originalOutcome:""};
  // ── Sync activeLiveTabs and activeFormTabId to App-level global refs for the global alarm interval ──
  // Global alarm reads directly from localStorage — no ref syncing needed here
  // ── Draggable tab state ──
  const dragTabRef=useRef(null);
  const handleTabDragStart=(e,tabId)=>{ dragTabRef.current=tabId; e.dataTransfer.effectAllowed="move"; };
  const handleTabDrop=(e,targetTabId)=>{
    e.preventDefault();
    const dragId=dragTabRef.current;
    if(!dragId||dragId===targetTabId) return;
    setActiveLiveTabs(prev=>{
      const from=prev.findIndex(t=>t.id===dragId);
      const to=prev.findIndex(t=>t.id===targetTabId);
      if(from===-1||to===-1) return prev;
      const next=[...prev];
      const [moved]=next.splice(from,1);
      next.splice(to,0,moved);
      return next;
    });
    dragTabRef.current=null;
  };
  // ── Browser tab title: always CaseHub ──
  useEffect(()=>{ document.title="CaseHub"; },[]);

  // Alarm is now handled at App level (globalCtFiredRef/globalQaFiredRef interval)
  // computing directly from tab.startTime and localStorage p2 keys — no React state deps.
  // Tracks when the current case was started — persists across Site Comment ↔ Inbound switches
  const caseStartTimeRef=useRef((()=>{
    if(typeof window==="undefined") return globalTimeIn||Date.now();
    const v=localStorage.getItem("ch_case_start_time");
    return v?Number(v):(globalTimeIn||Date.now());
  })());

  const {
    cancelMode, enterEditFromLog, enterMode, exitMode, minimiseMode,
  } = usePostLiveModes({
    activeFormTabId, allSavedCases, breakActive, caseStartTimeRef, dbDrafts, editingCase,
    globalTimeIn, minimisedFormData, mode, onFormActive, onFormInFields, onMinimise,
    setActiveBundleCaseNum, setActiveDraftId, setActiveFormTabId, setActiveLiveTabs,
    setBackConfirm, setEditingCase, setIsMinimised, setMinimisedFormData, setMode, setSessionLog,
    setTabTimerStates, setUseDraft, showToast, useDraft,
  });

  useEffect(()=>{
    if(!resumeTick||resumeTick===handledResumeTick.current||typeof window==="undefined") return;
    handledResumeTick.current=resumeTick;
    const savedMode=localStorage.getItem("ch_active_form_mode");
    const savedUseDraft=localStorage.getItem("ch_active_form_use_draft")==="1";
    if(savedMode==="siteComment"||savedMode==="inbound"){
      setMode(savedMode);
      setUseDraft(savedUseDraft);
      onFormActive&&onFormActive(true);
      onFormInFields&&onFormInFields(true);
    }
  },[resumeTick]);

  // ── When break ends, auto-activate the first queued tab ──
  const prevBreakActive=useRef(breakActive);
  useEffect(()=>{
    const wasActive=prevBreakActive.current;
    prevBreakActive.current=breakActive;
    if(wasActive&&!breakActive){
      // Break just ended — find first queued tab and activate it
      setActiveLiveTabs(prev=>{
        const queuedIdx=prev.findIndex(t=>t.startTime===null);
        if(queuedIdx===-1) return prev;
        const now=Date.now();
        const updated=prev.map((t,i)=>i===queuedIdx?{...t,startTime:now}:t);
        setActiveFormTabId(updated[queuedIdx].id);
        return updated;
      });
    }
  },[breakActive]);

  // Only load draft when user explicitly clicked "Continue Suspended" — never on new form button
  // When editing from session log, use the savedCase as the form's initial data
  // When resuming minimised form, use the saved minimised form data
  const isResumingMinimised = !editingCase && !useDraft && minimisedFormData && minimisedFormData._mode === mode;
  const currentDraft=editingCase?editingCase.savedCase
    :isResumingMinimised?minimisedFormData
    :useDraft?(activeDraftId?dbDrafts?.find(d=>d._id===activeDraftId):dbDrafts?.find(d=>d._mode===mode)||null):null;
  const isEditingFromLog=!!editingCase;

  // ── hooks must be before any conditional return ──
  const recentAll = [...(allSavedCases||[])].slice(0,6);
  const [elapsed,setElapsed]=useState(0);
  useEffect(()=>{
    if(!timedIn) return;
    const t=setInterval(()=>setElapsed(globalTimeIn?Math.floor((Date.now()-globalTimeIn)/1000):0),1000);
    return()=>clearInterval(t);
  },[timedIn,globalTimeIn]);

  const amendTypesDisabled=!timedIn||isMinimised; // break no longer blocks adding new tabs

  if(mode==="siteComment"||mode==="inbound"){
    // Determine active live tab label for display
    return (
      <PostLiveContext.Provider
      value={{
        activeDraftId, activeFormTabId, activeLiveTabs, alarmMins, allSavedCases, backConfirm,
        breakActive, breakTimer, cancelMode, caseStartTimeRef, currentDraft, dbDrafts, editingCase,
        exitMode, handleTabDragStart, handleTabDrop, isEditingFromLog, isResumingMinimised,
        minimiseMode, mode, onDeleteDraft, onMinimise, onSaveCase, onSaveDraft, onStartBreak,
        onStartBreakFull, onStartOpenHour, onStopBreak, onStopOpenHour, onTimerEnd, onTimerReset,
        onUpdateCase, onUpdateDraft, openHourActive, qaAlarmMins, sessionDbId, sessionLog,
        setActiveBundleCaseNum, setActiveFormTabId, setActiveLiveTabs, setBackConfirm,
        setEditingCase, setMinimisedFormData, setMode, setSessionLog, setShowAddTabPicker,
        setShowFnGen, setTabTimerStates, sharedFormRef, showAddTabPicker, showFnGen,
        specialRequestors, tabTimerStates, timedIn, useDraft, user, zeroTimerState,
      }}
    >
      <PostLiveFormView />
    </PostLiveContext.Provider>
    );
  }

  return (
    <div>
      {/* Page Hero — title + Time In card */}
      <PostLiveHero elapsed={elapsed} globalTimeIn={globalTimeIn} onTimeIn={onTimeIn} onTimeOut={onTimeOut} timedIn={timedIn} />

      {/* Amend type chooser */}
      <div style={{display:"flex",gap:14,marginBottom:28,flexWrap:"wrap"}}>
        {deleteDraftConfirm&&(<div className="modal-bg"><div className="modal">
          <div style={{marginBottom:14,fontSize:36}}>📦</div>
          <h3>Archive Suspended Case?</h3>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:20,lineHeight:1.6}}>This case will be moved to the <strong style={{color:"var(--text)"}}>Archive</strong> page. You can view it there anytime — nothing is permanently deleted.</p>
          <div className="modal-btns">
            <button className="btn btn-ghost" onClick={()=>setDeleteDraftConfirm(null)}>Keep Suspended</button>
            <button className="btn btn-primary" style={{background:"var(--amber)",borderColor:"var(--amber)"}} onClick={()=>{onArchiveDraft&&onArchiveDraft(deleteDraftConfirm.id,deleteDraftConfirm.mode);setDeleteDraftConfirm(null);}}>Move to Archive</button>
          </div>
        </div></div>)}
        <button className="pl-type-btn" disabled={amendTypesDisabled} onClick={()=>enterMode("siteComment")} style={{opacity:amendTypesDisabled?.4:1,flex:1,minWidth:220}}>
          <div className="pl-type-icon"><Icon name="sitecomment" size={26} color="var(--accent)"/></div>
          <div style={{flex:1}}>
            <div className="pl-type-title">Site Comment</div>
            <div className="pl-type-sub">Step-by-step · live timer</div>
          </div>
          <Icon name="back" size={14} color="var(--muted)" style={{transform:"rotate(180deg)",opacity:.5}}/>
        </button>
        <button className="pl-type-btn" disabled={amendTypesDisabled} onClick={()=>enterMode("inbound")} style={{opacity:amendTypesDisabled?.4:1,flex:1,minWidth:220}}>
          <div className="pl-type-icon" style={{background:"rgba(124,58,237,.1)",borderColor:"rgba(124,58,237,.25)"}}><Icon name="inbound" size={26} color="#7c3aed"/></div>
          <div style={{flex:1}}>
            <div className="pl-type-title" style={{color:"#7c3aed"}}>Inbound Email</div>
            <div className="pl-type-sub">Assumption-based format</div>
          </div>
          <Icon name="back" size={14} color="var(--muted)" style={{transform:"rotate(180deg)",opacity:.5}}/>
        </button>
        <button className="pl-type-btn" disabled={amendTypesDisabled} onClick={()=>{setBundleForm({type:"site",caseNum:""});setBundleModal(true);}} style={{opacity:amendTypesDisabled?.4:1,flex:1,minWidth:220,borderColor:"rgba(16,185,129,.3)"}}>
          <div className="pl-type-icon" style={{background:"rgba(16,185,129,.12)",borderColor:"rgba(16,185,129,.25)"}}><span style={{fontSize:22}}>🔗</span></div>
          <div style={{flex:1}}>
            <div className="pl-type-title">Bundle</div>
            <div className="pl-type-sub">Link cases together</div>
          </div>
          <Icon name="back" size={14} color="var(--muted)" style={{transform:"rotate(180deg)",opacity:.5}}/>
        </button>
      </div>

      {/* Bundle Modal */}
      {bundleModal&&(()=>{
        // Only show cases that are active in the CURRENT session log
        const sessionCaseNums = [...new Set(
          (sessionLog||[]).filter(e=>e.caseNum&&e.caseNum.trim()).map(e=>e.caseNum.trim())
        )];

        const caseOptions = sessionCaseNums.map(cn=>{
          const saved = allSavedCases.find(c=>c.caseNum===cn);
          const draft = (dbDrafts||[]).find(d=>d.caseNum===cn);
          const src = saved ? "saved" : draft ? "suspended" : "session";
          return {
            caseNum: cn,
            accountNum: (saved||draft)?.accountNum||"",
            amendType: (saved||draft)?.amendType||"",
            _mode: (saved||draft)?._mode||"",
            _bundledWith: saved?._bundledWith||null,
            _caseComplexity: (saved||draft)?._caseComplexity||"minor",
            source: src,
            _id: saved?._id||draft?._id||cn,
            _fullData: saved||draft||null,
          };
        });

        return (
        <BundleCasesModal
          bundleForm={bundleForm}
          caseOptions={caseOptions}
          enterMode={enterMode}
          setBundleForm={setBundleForm}
          setBundleModal={setBundleModal}
          showToast={showToast}
        />
     
        );
      })()}
      {!timedIn&&<div style={{fontSize:12,color:"var(--muted)",marginTop:-16,marginBottom:24,fontFamily:"'Poppins',sans-serif",padding:"10px 14px",background:"var(--entry-bg)",border:"1px solid var(--border)",borderRadius:8,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>⏰</span> Click <strong style={{color:"var(--text)"}}>Clock In</strong> above to start your session and unlock amend types.
      </div>}
      {breakActive&&<div style={{fontSize:12,color:"var(--muted)",marginTop:-16,marginBottom:24,fontFamily:"'Poppins',sans-serif",padding:"10px 14px",background:"var(--entry-bg)",border:"1px solid var(--border)",borderRadius:8,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>☕</span> Finish your break first to open <strong style={{color:"var(--text)"}}>Site Comment</strong> or <strong style={{color:"var(--text)"}}>Inbound Email</strong>.
      </div>}
      {isMinimised&&!breakActive&&<div style={{fontSize:12,color:"var(--amber)",marginTop:-16,marginBottom:24,fontFamily:"'Poppins',sans-serif",padding:"10px 14px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.35)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
        <span style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>🗕</span> A form is currently <strong style={{color:"var(--amber)"}}>minimised</strong> — resume or cancel it before starting a new one.</span>
        <button className="btn btn-ghost" style={{fontSize:11,padding:"5px 12px",borderRadius:20,color:"var(--amber)",borderColor:"rgba(245,158,11,.4)"}} onClick={()=>{const m=minimisedFormData?._mode||(storage.get("ch_active_form_mode"));if(m==="siteComment"||m==="inbound"){setMode(m);setIsMinimised(false);onFormActive&&onFormActive(true);onFormInFields&&onFormInFields(true);}}}> Resume</button>
      </div>}

      {/* Session Time Log */}
      

      {dbDrafts&&dbDrafts.length>0&&(
        <SuspendedCasesList
          breakActive={breakActive}
          dbDrafts={dbDrafts}
          enterMode={enterMode}
          isMinimised={isMinimised}
          setDeleteDraftConfirm={setDeleteDraftConfirm}
          timedIn={timedIn}
        />
      )}


      {sessionLog.length>0&&(
        <SessionTimeLog
          activeBundleCaseNum={activeBundleCaseNum}
          allSavedCases={allSavedCases}
          breakActive={breakActive}
          dbDrafts={dbDrafts}
          editCase={editCase}
          enterEditFromLog={enterEditFromLog}
          enterMode={enterMode}
          isMinimised={isMinimised}
          sessionLog={sessionLog}
          setShowLog={setShowLog}
          showLog={showLog}
        />
      )}

      <div>
        <div className="section-title">Recently Saved Cases</div>
        {recentAll.length===0&&<div style={{color:"var(--muted)",fontSize:13,padding:"8px 0"}}>No cases saved yet.</div>}
        {recentAll.map((c,i)=>(
          <SavedCaseCard key={c._id||`local-${i}`} c={c} idx={i} openId={openSavedId} setOpenId={setOpenSavedId}
            onEdit={(rec)=>{
              // Open edit modal
              setEditCase(rec);
            }}
          />
        ))}
      </div>
      {editCase&&(()=>{
        const isEditSC = editCase._mode==="siteComment";
        return (
        <EditCaseModal
          editCase={editCase}
          isEditSC={isEditSC}
          onUpdateCase={onUpdateCase}
          setEditCase={setEditCase}
          showToast={showToast}
        />
        );
      })()}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}
