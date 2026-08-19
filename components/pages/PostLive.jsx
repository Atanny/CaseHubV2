import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../icons/Icon';
import { cls, fmtElapsed } from '../../lib/helpers';
import { idbClearImages } from '../../lib/idb';
import PostLiveForm from '../postlive/PostLiveForm';
import SavedCaseCard from '../postlive/SavedCaseCard';
import Toast, { useToast } from '../ui/Toast';
import TimerBar from '../postlive/TimerBar';
import { CopyCaseBtn } from '../postlive/CopyRow';
import FileNameGeneratorPage from './FileNameGenerator';

export default function PostLivePage({ onSaveCase, onUpdateCase, onUpdateDraft, onFormActive, onFormInFields, onMinimise, allSavedCases, dbDrafts, onSaveDraft, onDeleteDraft, onArchiveDraft, user, onTimerEnd, specialRequestors=[], alarmMins=30, qaAlarmMins=10, globalTimeIn, timedIn, breakActive=false, breakTimer=null, openHourActive=false, onTimeIn, onTimeOut, onTimerReset, sessionDbId, sessionLog=[], addSessionLog, setSessionLog, closeWithOutcome, closeSessionLog, clearSessionLog, onStartBreak, onStartBreakFull, onStopBreak, onStartOpenHour, onStopOpenHour, resumeTick=0 }) {
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
  const [deleteDraftConfirm,setDeleteDraftConfirm]=useState(null); // {id,mode}
  // ── Chrome-style multi-case tab system ─────────────────────────────────────
  const [formTabs,setFormTabs]=useState([]);        // [{id,mode,caseNum,label,status,timerDeadline,timerMins,warnFired}]
  // activeLiveTabs: open form tabs (each has its own PostLiveForm instance) — persisted across minimise/refresh
  const [activeLiveTabs,setActiveLiveTabs]=useState(()=>{
    if(typeof window==="undefined") return [];
    try{ const v=localStorage.getItem("ch_live_tabs"); return v?JSON.parse(v):[]; }catch{ return []; }
  });
  const [showTabPicker,setShowTabPicker]=useState(false);
  const [showAddTabPicker,setShowAddTabPicker]=useState(false);
  const [showFnGen,setShowFnGen]=useState(false);
  const [prolongedMins,setProlongedMins]=useState(30);
  const [prolongedMode,setProlongedMode]=useState(false);
  const [prolongedWarnToast,setProlongedWarnToast]=useState(null);
  const prolongedActive=formTabs.some(t=>t.status!=='done');
  const [activeFormTabId,setActiveFormTabId]=useState(()=>{
    if(typeof window==="undefined") return null;
    return localStorage.getItem("ch_live_tab_active")||null;
  });
  const [formTabTick,setFormTabTick]=useState(0);
  // Persist live tabs + active tab ID so they survive minimise/refresh
  useEffect(()=>{
    if(typeof window==="undefined") return;
    if(activeLiveTabs.length>0){
      localStorage.setItem("ch_live_tabs",JSON.stringify(activeLiveTabs));
    } else {
      localStorage.removeItem("ch_live_tabs");
    }
  },[activeLiveTabs]);
  useEffect(()=>{
    if(typeof window==="undefined") return;
    if(activeFormTabId) localStorage.setItem("ch_live_tab_active",activeFormTabId);
    else localStorage.removeItem("ch_live_tab_active");
  },[activeFormTabId]);
  // Tick every second while a tab is running
  useEffect(()=>{
    const hasRun=formTabs.some(t=>t.status==='running');
    if(!hasRun) return;
    const iv=setInterval(()=>setFormTabTick(n=>n+1),1000);
    return ()=>clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[formTabs.map(t=>t.status).join(',')]);
  // Auto-advance timer queue
  useEffect(()=>{
    if(!formTabs.length) return;
    setFormTabs(tabs=>{
      const running=tabs.find(t=>t.status==='running');
      if(!running) return tabs;
      const rem=running.timerDeadline-Date.now();
      // 1-min warning
      if(!running.warnFired&&rem<=60000&&rem>0){
        onTimerEnd&&onTimerEnd();
        return tabs.map(t=>t.id===running.id?{...t,warnFired:true}:t);
      }
      // Expired — mark overdue, update log, auto-start next
      if(rem<=0){
        setSessionLog&&setSessionLog(prev=>{
          const next=prev.map(e=>e.caseNum===running.caseNum&&e.outcome==='Pending'?{...e,outcome:'Completed Prolonged'}:e);
          if(typeof window!=='undefined') localStorage.setItem('ch_session_log',JSON.stringify(next));
          return next;
        });
        setTimeout(()=>setFormTabs(ts=>{
          const upd=ts.map(t=>t.id===running.id?{...t,status:'done'}:t);
          const np=upd.find(t=>t.status==='pending');
          if(np) return upd.map(t=>t.id===np.id?{...t,status:'running',timerDeadline:Date.now()+(t.timerMins*60000),warnFired:false}:t);
          return upd;
        }),1200);
        return tabs.map(t=>t.id===running.id?{...t,status:'overdue'}:t);
      }
      return tabs;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[formTabTick]);
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

  const handleProceedWithNextCase=(savedForm,timerMins)=>{
    const id=String(Date.now());
    const caseNum=savedForm?.caseNum||'';
    const label=(mode==='inbound'?'Inbound Email':'Site Comment')+(caseNum?' — #'+caseNum:'');
    setFormTabs(tabs=>{
      const hasRunning=tabs.some(t=>t.status==='running');
      const status=hasRunning?'pending':'running';
      const deadline=hasRunning?0:Date.now()+(timerMins*60000);
      return [...tabs,{id,mode,caseNum,label,status,timerDeadline:deadline,timerMins,warnFired:false}];
    });
    // Add a new live tab for the next case (same mode)
    const newTabId=String(Date.now()+1);
    setActiveLiveTabs(ts=>[...ts,{id:newTabId,mode,key:newTabId}]);
    setActiveFormTabId(newTabId);
  };
  const enterMode = (m, withDraft = false, draftId = null, bundleCaseNum = null) => {
    // Always create a fresh live tab when opening a new form
    if(!withDraft && !editingCase){
      const tid=String(Date.now());
      setActiveLiveTabs(ts=>{
        // If there's already an empty unfilled tab of same mode, reuse it
        const existing=ts.find(t=>t.mode===m&&t.label.includes('New')&&!t.caseNum);
        if(existing){ setActiveFormTabId(existing.id); return ts; }
        const label=(m==='inbound'?'Inbound Email':'Site Comment')+' — New';
        setActiveFormTabId(tid);
        const t0 = globalTimeIn || Date.now();
        return [...ts,{id:tid,mode:m,key:tid,label,caseNum:'',startTime:t0}];
      });
    }
    if (breakActive) {
      showToast("Finish your break first before opening an amend form", "error");
      return;
    }

    const isResumingMinimised = minimisedFormData && minimisedFormData._mode === m && !withDraft;

    // Persist the case start time across Site Comment ↔ Inbound switches.
    // Only stamp a fresh start time when opening a completely new form (not resuming anything).
    const isResumingAny = isResumingMinimised || withDraft;
    if (!isResumingAny) {
      // Fresh form (Site Comment or Inbound clicked directly, not resuming).
      // Use globalTimeIn (session clock-in time) so the form timer is consistent with the session timer.
      const t = globalTimeIn || Date.now();
      caseStartTimeRef.current = t;
      if(typeof window !== "undefined") localStorage.setItem("ch_case_start_time", String(t));
    } else if (isResumingMinimised && minimisedFormData?._startTime) {
      // Resuming minimised — restore its start time
      caseStartTimeRef.current = minimisedFormData._startTime;
    } else if (withDraft && draftId) {
      // Resuming a suspended draft — use globalTimeIn so the form timer matches the session active timer.
      // Also clear ch_resume_start so the form's "Elapsed now" timer starts fresh.
      const t = globalTimeIn || Date.now();
      caseStartTimeRef.current = t;
      if(typeof window !== "undefined"){
        localStorage.setItem("ch_case_start_time", String(t));
        localStorage.removeItem("ch_resume_start");
      }
    }
    // If mode is already set (switching between siteComment ↔ inbound), keep existing caseStartTimeRef

    setMode(m);
    setUseDraft(withDraft);
    setActiveDraftId(draftId || null);
    setIsMinimised(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("ch_active_form_mode", m);
      localStorage.setItem("ch_active_form_use_draft", withDraft ? "1" : "0");
      if(bundleCaseNum) localStorage.setItem("ch_bundle_case_num", bundleCaseNum);
      else localStorage.removeItem("ch_bundle_case_num");
    }
    onFormActive && onFormActive(true);
    onFormInFields && onFormInFields(true);
    
    // Only update session log when resuming a suspended draft — not for new forms or minimised resume.
    // Status rename (Site Comment / Inbound Email) happens on Save or Suspend, not on open.
    if (!isResumingMinimised && withDraft && draftId) {
      // We are resuming a draft. Get the case number so we can attach it to the log.
      const draft = dbDrafts?.find(d => d._id === draftId);
      const draftCaseNum = draft?.caseNum || "";

      setSessionLog && setSessionLog(prev => {
        let next = [...prev];
        const hasOpen = next.some(e => !e.endedAt);
        
        if (hasOpen) {
          // Rename the active "Ongoing" entry to the specific status and attach the Case Number
          const label = m === "siteComment" ? "Site Comment" : "Inbound Email";
          next = next.map((e, i) => i === next.length - 1 && !e.endedAt
            ? { ...e, status: label, caseNum: draftCaseNum }
            : e);
        } else {
          // If no open entry exists for some reason, create a fresh one
          const label = m === "siteComment" ? "Site Comment" : "Inbound Email";
          const nowMs = Date.now();
          next = [...next, { id: nowMs, status: label, note: "Resumed draft", startedAt: nowMs, endedAt: null, outcome: "", caseNum: draftCaseNum, endNote: "" }];
        }
        if (typeof window !== "undefined") localStorage.setItem("ch_session_log", JSON.stringify(next));
        return next;
      });
    }
  };
  const exitMode=()=>{
    setProlongedMode(false);
    setActiveFormTabId(null);
    setActiveLiveTabs([]);
    setMode(null);
    setUseDraft(false);
    setActiveDraftId(null);
    setEditingCase(null);
    setIsMinimised(false);
    setMinimisedFormData(null);
    setActiveBundleCaseNum("");
    if(typeof window!=="undefined"){
      localStorage.removeItem("ch_active_form_mode");
      localStorage.removeItem("ch_active_form_use_draft");
      localStorage.removeItem("ch_minimised_form");
      localStorage.removeItem("ch_case_start_time");
      localStorage.removeItem("ch_resume_start");
      localStorage.removeItem("ch_bundle_case_num");
      localStorage.removeItem("ch_bundle_prefill");
      localStorage.removeItem("ch_live_tabs");
      localStorage.removeItem("ch_live_tab_active");
      // Clear all per-tab form persistence keys
      Object.keys(localStorage).filter(k=>k.startsWith("ch_tab_form_")).forEach(k=>localStorage.removeItem(k));
    }
    idbClearImages("backup").catch(()=>{});
    idbClearImages("main").catch(()=>{});
    onFormActive&&onFormActive(false);
    onFormInFields&&onFormInFields(false);
  };
  const pauseMode=(formData=null)=>{
    setMode(null);
    setIsMinimised(true);
    // Always clear useDraft when minimising so that on resume, isResumingMinimised
    // evaluates to true and minimisedFormData (with the user's latest edits) is used
    // rather than the stale DB draft.
    setUseDraft(false);
    if(typeof window!=="undefined") localStorage.setItem("ch_active_form_use_draft","0");
    if(formData){
      const toSave={...formData, _mode: mode||formData._mode};
      setMinimisedFormData(toSave);
      if(typeof window!=="undefined") localStorage.setItem("ch_minimised_form",JSON.stringify(toSave));
      if(typeof window!=="undefined") window.dispatchEvent(new Event("ch_case_saved"));
    }
    // NOTE: Do NOT clear IDB images or ch_live_tabs here — preserve all tab data across minimise/refresh.
    // Data is only wiped by the Clear button (clearAll) or explicit save.
    onFormActive&&onFormActive(true);
    onFormInFields&&onFormInFields(false);
  };

  // ── Edit a recently saved case from the session log ──
  // No new session log row is ever stacked.
  // The current open "Ongoing" row status is updated in-place to reflect the case being edited.
  // If a form is currently open, its open log entry is closed as "Suspended" first,
  // then the Ongoing row is updated for the edit.
  const enterEditFromLog=(entry)=>{
    if(breakActive){
      showToast("Finish your break first before editing a case","error");
      return;
    }
    const foundCase=allSavedCases.find(c=>c.caseNum&&c.caseNum===entry.caseNum);
    if(!foundCase){
      showToast("Could not find saved case #"+entry.caseNum,"error");
      return;
    }
    const editModeVal=(foundCase._mode||"")==="inbound"?"inbound":"siteComment";
    const editStatusLabel=editModeVal==="siteComment"?"Site Comment":"Inbound Email";
    const editCaseNum=foundCase.caseNum||"";

    setSessionLog&&setSessionLog(prev=>{
      let next=[...prev];
      if(mode){
        const nowMs=Date.now();
        next=next.map((e,i)=>i===next.length-1&&!e.endedAt
          ?{...e,endedAt:nowMs,outcome:"Suspended",caseNum:e.caseNum||""}
          :e);
      }
      const lastIdx=next.map((e,i)=>({e,i})).filter(({e})=>e.caseNum===editCaseNum&&e.endedAt).pop()?.i;
      if(lastIdx!=null){
        next=next.map((e,i)=>i===lastIdx?{...e,outcome:"Editing…"}:e);
      }
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });

    // Stamp globalTimeIn so edit mode timer matches the session active timer.
    // Also clear ch_resume_start so the form's "Elapsed now" timer starts fresh.
    const editT = globalTimeIn || Date.now();
    caseStartTimeRef.current = editT;
    if(typeof window!=="undefined"){
      localStorage.setItem("ch_case_start_time", String(editT));
      localStorage.removeItem("ch_resume_start");
    }

    let enrichedCase={...foundCase};
    try{
      const raw=typeof window!=="undefined"?localStorage.getItem("ch_case_extra_cache"):null;
      if(raw){const cache=JSON.parse(raw);const cached=cache[foundCase.caseNum];if(cached){enrichedCase={...enrichedCase,customerName:enrichedCase.customerName||cached.customerName||"",customerEmail:enrichedCase.customerEmail||cached.customerEmail||"",businessName:enrichedCase.businessName||cached.businessName||"",businessSuffix:enrichedCase.businessSuffix||cached.businessSuffix||"",inboundNum:enrichedCase.inboundNum||cached.inboundNum||"",inProgress:enrichedCase.inProgress??cached.inProgress??false,entries:(enrichedCase.entries&&enrichedCase.entries.length>0)?enrichedCase.entries:(cached.entries||enrichedCase.entries||[]),checklist:enrichedCase.checklist||cached.checklist||{},devices:enrichedCase.devices||cached.devices||{},trackerChecklistLink:enrichedCase.trackerChecklistLink||cached.trackerChecklistLink||"",emailAddress:enrichedCase.emailAddress||cached.emailAddress||"",emailType:enrichedCase.emailType||cached.emailType||""};}}
    }catch(e){}
    try{
      const minData=typeof window!=="undefined"?localStorage.getItem("ch_minimised_form"):null;
      if(minData){const fd=JSON.parse(minData);if(fd.caseNum===foundCase.caseNum){enrichedCase={...enrichedCase,customerName:enrichedCase.customerName||fd.customerName||"",customerEmail:enrichedCase.customerEmail||fd.customerEmail||"",businessName:enrichedCase.businessName||fd.businessName||"",businessSuffix:enrichedCase.businessSuffix||fd.businessSuffix||""};}}
    }catch(e){}
    setEditingCase({savedCase:enrichedCase,mode:editModeVal});
    setMode(editModeVal);
    setUseDraft(false);
    if(typeof window!=="undefined"){
      localStorage.setItem("ch_active_form_mode",editModeVal);
      localStorage.setItem("ch_active_form_use_draft","0");
    }
    onFormActive&&onFormActive(true);
    onFormInFields&&onFormInFields(true);
  };
  const returnToChooser=(formData=null)=>{
    setBackConfirm(false);
    pauseMode(formData);
  };
  const minimiseMode=(formData=null)=>{
    setBackConfirm(false);
    pauseMode(formData);
    onMinimise&&onMinimise();
    // Do NOT clear activeLiveTabs or IDB images — all tab data must survive minimise
  };
  const cancelMode=()=>{
    idbClearImages("backup").catch(()=>{});
    idbClearImages("main").catch(()=>{});
    setBackConfirm(false);
    // Cancelling an edit from the session log: revert the Ongoing row back to "Ongoing"
    // with no caseNum — no new row, no stack, nothing logged.
    if(editingCase){
      const cancelCaseNum=editingCase.savedCase?.caseNum||"";
      setSessionLog&&setSessionLog(prev=>{
        // Clear the "Editing…" marker from the entry we tagged, revert open row to plain Ongoing
        const next=prev.map(e=>{
          if(e.outcome==="Editing…"&&e.caseNum===cancelCaseNum) return {...e,outcome:e._prevOutcome||""};
          if(!e.endedAt&&e.caseNum===cancelCaseNum) return {...e,caseNum:"",status:"Ongoing"};
          return e;
        });
        if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
        return next;
      });
      exitMode();
      return;
    }
    // If we were resuming a suspended draft (which renamed the log entry), revert it back to Ongoing.
    if(useDraft){
      setSessionLog&&setSessionLog(prev=>{
        const next=prev.map((e,i)=>i===prev.length-1&&!e.endedAt
          ?{...e,status:"Ongoing",caseNum:""}
          :e);
        if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
        return next;
      });
    }
    // For all other cancels (new form, minimised resume): close only THIS tab.
    // If other queued tabs remain, keep them open and activate the next one — don't wipe the whole session.
    setActiveLiveTabs(prev=>{
      const cancelledId=activeFormTabId;
      if(!cancelledId || prev.length===0){ exitMode(); return prev.length===0?prev:[]; }
      const remaining=prev.filter(t=>t.id!==cancelledId);
      if(remaining.length===0){
        exitMode();
        return [];
      }
      const idx=prev.findIndex(t=>t.id===cancelledId);
      const nextIdx=Math.min(idx,remaining.length-1);
      const now=Date.now();
      const updated=remaining.map((t,i)=> (i===nextIdx&&t.startTime===null&&!breakActive) ? {...t,startTime:now} : t);
      const nextTab=updated[nextIdx];
      setActiveFormTabId(nextTab?.id||null);
      setTabTimerStates(p=>{const n={...p};delete n[cancelledId];return n;});
      if(nextTab) setMode(nextTab.mode||mode);
      idbClearImages(`${cancelledId}-backup`).catch(()=>{});
      idbClearImages(`${cancelledId}-main`).catch(()=>{});
      return updated;
    });
  };

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
    const activeLiveTab=activeLiveTabs.find(t=>t.id===activeFormTabId)||activeLiveTabs[0];
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",minHeight:0}}>

        {/* Chrome-style tab bar at the very top */}
        {(activeLiveTabs.length>0)&&(
          <div style={{display:"flex",alignItems:"stretch",gap:0,background:"#1a1f2e",borderBottom:"1px solid rgba(255,255,255,.08)",padding:"0 8px",flexShrink:0,minHeight:46,overflowX:"auto"}}>
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
              const cxColor=cx==='complex'?'#f43f5e':cx==='major'?'#f59e0b':'#10b981';
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
                          if(typeof window!=="undefined") localStorage.removeItem(`ch_tab_form_${closedTabId}`);
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
                        if(typeof window!=="undefined") localStorage.removeItem(`ch_tab_form_${closedTabId}`);
                        return updated;
                      });
                    }} style={{background:"none",border:"none",color:isActive?"var(--text)":"rgba(255,255,255,.5)",cursor:"pointer",fontSize:15,padding:"0 0 0 4px",marginLeft:2,lineHeight:1,flexShrink:0,opacity:.6}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.6}>×</button>}
                </div>
              );
            })}
            {/* Saved/timer tabs */}
            {formTabs.map(tab=>{
              const isRunning=tab.status==="running";
              const isOverdue=tab.status==="overdue";
              const isDone=tab.status==="done";
              const rem=isRunning?Math.max(0,tab.timerDeadline-Date.now()):0;
              const remM=Math.floor(rem/60000);
              const remS=String(Math.floor((rem%60000)/1000)).padStart(2,"0");
              return (
                <div key={tab.id} style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px",minWidth:160,maxWidth:220,borderRadius:"6px 6px 0 0",marginTop:4,marginRight:2,background:"rgba(255,255,255,.04)",borderTop:"2px solid transparent",flexShrink:0,cursor:"default"}}>
                  <span style={{fontSize:11}}>{isOverdue?"🚨":isRunning?"⏳":isDone?"✅":"⌛"}</span>
                  <span style={{fontSize:11,color:"rgba(255,255,255,.5)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100,fontFamily:"'Poppins',sans-serif"}}>{tab.label}</span>
                  {isRunning&&<span style={{fontSize:10,fontFamily:"monospace",fontWeight:700,color:rem<=60000?"#f43f5e":"#f59e0b",marginLeft:"auto",flexShrink:0}}>{remM}:{remS}</span>}
                  {isDone&&<button onClick={()=>setFormTabs(ts=>ts.filter(t=>t.id!==tab.id))} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",cursor:"pointer",fontSize:13,padding:0,marginLeft:"auto",lineHeight:1,flexShrink:0}}>×</button>}
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
                        if(typeof window!=="undefined") localStorage.setItem("ch_active_form_mode",m);
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
        )}

        <div className="page-header" style={{padding:"12px 32px 10px",flexShrink:0,borderBottom:"1px solid var(--glass-border)",margin:0,display:"flex",alignItems:"center",gap:12,justifyContent:"space-between"}}>
          <div>
            {(()=>{
              const activeTabMode=(activeLiveTabs.find(t=>t.id===activeFormTabId)||activeLiveTabs[0])?.mode||mode;
              const isSC=activeTabMode==="siteComment";
              return (<>
                <div className="page-title" style={{fontSize:20}}>{isEditingFromLog?`Editing Case #${editingCase.savedCase.caseNum}`:currentDraft&&!isResumingMinimised?`Continuing Suspended Case #${currentDraft.caseNum||""}`:isSC?"Post-Live — Site Comment":"Post-Live — Inbound Email"}</div>
                <div className="page-sub">{isEditingFromLog?"Editing saved case — all fields are editable.":currentDraft&&!isResumingMinimised?"Resuming suspended case — all fields are editable.":isSC?"Fill in each step. Steps unlock as you progress.":"Assumption-based format with email details."}</div>
              </>);
            })()}
          </div>
          {/* ── File Name Generator button ── */}
          <button style={{fontSize:11,padding:"6px 13px",borderRadius:8,border:"1px solid var(--accent)",background:"var(--accent)",color:"#fff",display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontWeight:600,letterSpacing:".2px",flexShrink:0}}
            onClick={()=>{
              // Trigger a fresh sync so the FNG reads the current active tab's data immediately
              if(typeof window!=="undefined") window.dispatchEvent(new Event("ch_case_saved"));
              setShowFnGen(true);
            }}>
            <span style={{fontSize:13}}>📋</span> File Name Generator
          </button>
          <TimerBar {...(()=>{
            const activeTab=activeLiveTabs.find(t=>t.id===activeFormTabId)||activeLiveTabs[0];
            if(activeTab&&activeTab.startTime===null) return zeroTimerState;
            return tabTimerStates[activeFormTabId]||zeroTimerState;
          })()} fmtElapsed={fmtElapsed}/>
        </div>



        {/* Break timer banner — same design as global break-bar */}
        {breakActive&&breakTimer&&(()=>{
          const pct=breakTimer.ended?100:Math.round((1-(breakTimer.secsLeft/(breakTimer.mins*60)))*100);
          const st=breakTimer.ended?"ended":breakTimer.warned?"warn":"";
          const mm=Math.floor((breakTimer.secsLeft||0)/60);
          const ss=String((breakTimer.secsLeft||0)%60).padStart(2,"0");
          return (
            <div className={cls("break-bar",st)} style={{position:"relative",flexShrink:0}}>
              <span style={{fontSize:18}}>{breakTimer.label.split(" ")[0]}</span>
              <div>
                <div className="break-label">{breakTimer.label.split(" ").slice(1).join(" ")}</div>
                <div style={{fontSize:10,color:"var(--muted)"}}>
                  {breakTimer.ended?"✅ Break over!":breakTimer.warned?"⚠️ 5 min warning!":"On break"}
                </div>
              </div>
              <div className="break-time">{breakTimer.ended?"Done!":mm+":"+ss}</div>
              <div className="break-progress" style={{flex:1}}>
                <div className="break-progress-fill" style={{width:pct+"%"}}/>
              </div>
              <button className="break-stop" onClick={onStopBreak}>✕ End</button>
            </div>
          );
        })()}

        {/* Open Hour / Meeting banner — same design as the break bar */}
        {openHourActive&&(
          <div className="break-bar" style={{position:"relative",flexShrink:0}}>
            <span style={{fontSize:18}}>🏢</span>
            <div>
              <div className="break-label">Open Hour / Meeting</div>
              <div style={{fontSize:10,color:"var(--muted)"}}>Active — session timer paused</div>
            </div>
            <div className="break-progress" style={{flex:1}}/>
            <button className="break-stop" onClick={onStopOpenHour}>✕ End</button>
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
          <PostLiveForm key={tab.key||`${tabMode}-${activeDraftId||"new"}-${isEditingFromLog?"edit":"new"}`} mode={tabMode} draftData={tabDraftData} user={user} onTimerEnd={isActiveTab&&(alarmMins>0)?onTimerEnd:null} onQaTimerEnd={isActiveTab&&(qaAlarmMins>0)?onTimerEnd:null} specialRequestors={specialRequestors} timerLimitSecs={alarmMins*60} qaTimerLimitSecs={qaAlarmMins*60} isEditMode={tabIsEdit} isMinimisedResume={tabIsResumingMin} caseStartTime={tab.startTime!==undefined?tab.startTime:caseStartTimeRef.current} externalFormRef={isFirstTab?sharedFormRef:null} isResumingDraft={tabUseDraft} onTimerTick={tab.startTime!==null?t=>setTabTimerStates(prev=>({...prev,[tab.id]:t})):null} prolongedActive={prolongedActive} onProlongedDismiss={()=>{setProlongedActive(false);setProlongedDeadline(null);}} onProceedWithNext={prolongedMode?handleProceedWithNextCase:null} prolongedMinsForNext={prolongedMins} tabStorageKey={tab.id||null} onTabDataChange={({caseNum,businessName,complexity})=>setActiveLiveTabs(ts=>ts.map(t=>t.id===tab.id?{...t,caseNum,complexity:complexity||'minor',label:(t.mode==='inbound'?'Inbound Email':'Site Comment')+(businessName?' — '+businessName:'')+(caseNum?' #'+caseNum:'')}:t))}
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
    if(typeof window!=="undefined") localStorage.removeItem("ch_bundle_case_num");
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
  const outcomeLabel = isEditingFromLog ? "Updated" : prolongedMode ? "Pending" : (useDraft ? "Completed" : rawOutcome);
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
    if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
    return next;
  });
   idbClearImages("backup").catch(()=>{});
    idbClearImages("main").catch(()=>{});
    // Clear per-tab IDB keys for this specific tab
    idbClearImages(`${tabId}-backup`).catch(()=>{});
    idbClearImages(`${tabId}-main`).catch(()=>{});
    // Clear per-tab form persistence key
    if(typeof window!=="undefined") localStorage.removeItem(`ch_tab_form_${tabId}`);
  if(prolongedMode){
    setProlongedMode(false);
    enqueueProlongedTimer(f.caseNum||"", tabMode, prolongedMins);
  }
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
    if(typeof window!=="undefined") localStorage.setItem("ch_active_form_mode",updated[nextIdx].mode||mode);
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
            if(typeof window!=="undefined") localStorage.removeItem("ch_minimised_form");
            onTimerReset&&onTimerReset();
            const nowMs=Date.now();
            const statusLabel = tabMode === "siteComment" ? "Site Comment" : "Inbound Email";
            setSessionLog&&setSessionLog(prev=>{
              const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,status:statusLabel,endedAt:nowMs,outcome:"Suspended",caseNum:fd.caseNum||e.caseNum||""}:e);
              const fresh={id:nowMs+1,status:"Ongoing",note:"",startedAt:nowMs,endedAt:null,outcome:"",endNote:""};
              const next=[...closed,fresh];
              if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
              return next;
            });
            if(sessionDbId) fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'log_case',session_id:sessionDbId,email:user?.email,case_num:fd.caseNum,case_type:tabMode,note:'draft'})}).catch(()=>{});
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
              if(typeof window!=="undefined") localStorage.setItem("ch_active_form_mode",updated[nextIdx].mode||mode);
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
                <h3 style={{margin:0,fontSize:18,fontWeight:700}}>📋 File Name Generator</h3>
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
          <div className="modal-bg">
            <div className="modal">

              <div style={{ marginBottom: 14, textAlign: "center" }}>
                <Icon name="pin" size={36} color="var(--accent)" />
              </div>

              <h3 style={{ marginBottom: 6, textAlign: "center" }}>
                Leave this form?
              </h3>

              <p style={{
                color: "var(--muted)",
                fontSize: 13,
                marginBottom: 20,
                lineHeight: 1.6,
                textAlign: "center"
              }}>
                You can continue editing, minimize this form for later, or cancel it completely.
              </p>

              {/* BUTTONS */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>

                <div style={{ display: "flex", gap: 10, justifyContent: "center", width: "100%" }}>
                
                   <button
                  className="btn btn-danger"
                  style={{ flex: 1, justifyContent: "center"  }}
                  onClick={cancelMode}
                >
                  Cancel Case Form
                </button>

                 <button 
                        className="btn btn-primary" 
                        style={{ }}
                        onClick={() => {
                          minimiseMode(sharedFormRef.current || undefined);
                        }}
                      >
                        Minimize
                      </button>
                </div>

               
                  <button
                    className="btn btn-ghost"
                    style={{ width: "100%", justifyContent: "center"}}
                    onClick={() => setBackConfirm(false)}
                  >
                    Keep Editing
                  </button>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Page Hero — title + Time In card */}
      <div className="chd-page-head">
        <div>
          <p className="chd-h4">Post-Live Amends</p>
          <p className="chd-p-muted">{timedIn ? "Session active — choose your amend type below." : "Clock in to begin your session."}</p>
        </div>
        {/* TIME IN / OUT card */}
       <div className="chd-datetime-card" style={{minWidth:0}}>
          {timedIn ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="chd-label" style={{opacity:.6}}>Session Active</span>
                <span className="chd-p-muted">Since:</span>
                <span className="chd-p" style={{fontWeight:700}}>
                  {globalTimeIn ? new Date(globalTimeIn).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}) : ""}
                </span>
                <span className="chd-h4" style={{color:"var(--green)"}}>{fmtElapsed(elapsed)}</span>
              </div>
              <button className="chd-btn-primary" style={{background:"var(--red)",borderColor:"var(--red)"}} onClick={()=>onTimeOut&&onTimeOut()}>
                <Icon name="stop" size={12} style={{ marginRight: 5 }} />Time Out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "10px" }}>
              <span className="chd-p-muted">Start your session</span>
              <button className="chd-btn-primary" onClick={() => onTimeIn && onTimeIn()} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="play" size={14} />Clock In
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="chd-divider"/>

      {/* Amend type chooser */}
      <div style={{display:"flex",gap:10,marginBottom:formTabs.length?8:20,flexWrap:"wrap"}}>
        {deleteDraftConfirm&&(<div className="chd-modal-bg"><div className="chd-modal-card">
          <p className="chd-h6">Archive Suspended Case?</p>
          <p className="chd-p-muted">This case will be moved to the Archive page. You can view it there anytime — nothing is permanently deleted.</p>
          <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14}}>
            <button className="chd-btn-secondary" onClick={()=>setDeleteDraftConfirm(null)}>Keep Suspended</button>
            <button className="chd-btn-primary" style={{background:"var(--amber)",borderColor:"var(--amber)"}} onClick={()=>{onArchiveDraft&&onArchiveDraft(deleteDraftConfirm.id,deleteDraftConfirm.mode);setDeleteDraftConfirm(null);}}>Move to Archive</button>
          </div>
        </div></div>)}
        <button className="chd-big-btn" disabled={amendTypesDisabled||prolongedActive} onClick={()=>enterMode("siteComment")} style={{opacity:(amendTypesDisabled||prolongedActive)?.4:1}}>
          <div className="chd-big-btn-left">
            <div className="chd-big-btn-icon"><Icon name="sitecomment" size={22} color="#fff"/></div>
            <div><p className="chd-h6">Site Comment</p><p className="chd-p">Multiple Site Comment</p></div>
          </div>
          <Icon name="back" size={16} color="var(--muted)" style={{transform:"rotate(180deg)"}}/>
        </button>
        <button className="chd-big-btn" disabled={amendTypesDisabled||prolongedActive} onClick={()=>enterMode("inbound")} style={{opacity:(amendTypesDisabled||prolongedActive)?.4:1}}>
          <div className="chd-big-btn-left">
            <div className="chd-big-btn-icon"><Icon name="inbound" size={22} color="#fff"/></div>
            <div><p className="chd-h6">Inbound Email</p><p className="chd-p">Assumption Based Format</p></div>
          </div>
          <Icon name="back" size={16} color="var(--muted)" style={{transform:"rotate(180deg)"}}/>
        </button>
        <button className="chd-big-btn" disabled={amendTypesDisabled||prolongedActive} onClick={()=>{setBundleForm({type:"site",caseNum:""});setBundleModal(true);}} style={{opacity:(amendTypesDisabled||prolongedActive)?.4:1}}>
          <div className="chd-big-btn-left">
            <div className="chd-big-btn-icon">🔗</div>
            <div><p className="chd-h6">Bundle</p><p className="chd-p">Linked with existing Case</p></div>
          </div>
          <Icon name="back" size={16} color="var(--muted)" style={{transform:"rotate(180deg)"}}/>
        </button>
      </div>

      {/* Tab picker modal for adding new prolonged case */}
      {showTabPicker&&(
        <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget){setShowTabPicker(false);setProlongedMode(false);}}}>
          <div className="modal" style={{maxWidth:400}}>
            <div style={{textAlign:"center",marginBottom:14}}>
              <span style={{fontSize:28}}>⏳</span>
              <h3 style={{margin:"8px 0 4px"}}>New Prolonged Case</h3>
              <p style={{fontSize:12,color:"var(--muted)",lineHeight:1.5,margin:0}}>
                Fill the form normally — combined tracker reminder fires after you submit.
              </p>
            </div>
            <div className="field" style={{marginBottom:16}}>
              <label style={{display:"block",marginBottom:6}}>Tracker reminder after</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[15,30,45,60,90,120].map(m=>(
                  <button key={m} onClick={()=>setProlongedMins(m)} style={{padding:"4px 12px",borderRadius:8,border:prolongedMins===m?"2px solid #f59e0b":"1px solid var(--border)",background:prolongedMins===m?"rgba(245,158,11,.12)":"var(--glass-bg)",color:prolongedMins===m?"#f59e0b":"var(--muted)",fontWeight:prolongedMins===m?700:400,cursor:"pointer",fontSize:12,fontFamily:"'Poppins',sans-serif"}}>{m}m</button>
                ))}
                <input type="number" min={1} max={480} value={prolongedMins} onChange={e=>setProlongedMins(Math.max(1,Number(e.target.value)))} className="inp" style={{width:64,textAlign:"center"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="pl-type-btn" style={{flex:1}} onClick={()=>{setShowTabPicker(false);enterMode("siteComment");}}>
                <div className="pl-type-icon"><Icon name="sitecomment" size={20} color="var(--accent)"/></div>
                <div style={{flex:1}}><div className="pl-type-title" style={{fontSize:12}}>Site Comment</div></div>
              </button>
              <button className="pl-type-btn" style={{flex:1}} onClick={()=>{setShowTabPicker(false);enterMode("inbound");}}>
                <div className="pl-type-icon" style={{background:"rgba(124,58,237,.1)",borderColor:"rgba(124,58,237,.25)"}}><Icon name="inbound" size={20} color="#7c3aed"/></div>
                <div style={{flex:1}}><div className="pl-type-title" style={{fontSize:12,color:"#7c3aed"}}>Inbound</div></div>
              </button>
            </div>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:10,textAlign:"center",justifyContent:"center"}} onClick={()=>{setShowTabPicker(false);setProlongedMode(false);}}>Cancel</button>
          </div>
        </div>
      )}



      {/* 1-min warning toast */}
      {prolongedWarnToast&&(
        <div style={{position:"fixed",top:20,right:20,zIndex:9999,background:"rgba(244,63,94,.95)",border:"1px solid rgba(244,63,94,.6)",borderRadius:10,padding:"12px 18px",color:"#fff",fontFamily:"'Poppins',sans-serif",fontSize:13,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,.3)",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🚨</span>
          <div><div>1 minute left!</div><div style={{fontFamily:"monospace",fontSize:15}}>Fill tracker for #{prolongedWarnToast}</div></div>
        </div>
      )}

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
        <div className="modal-bg">
  <div className="modal" style={{ maxWidth: 440 }}>
    
    <div style={{ marginBottom: 10, fontSize: 32, textAlign: "center" }}>🔗</div>

    <h3 style={{ marginBottom: 6, textAlign: "center" }}>Bundle Cases</h3>

    <p
      style={{
        color: "var(--muted)",
        fontSize: 13,
        marginBottom: 18,
        lineHeight: 1.6,
        textAlign: "center",
      }}
    >
      Start a new case bundled with an existing one. A{" "}
      <span style={{ color: "#10b981", fontWeight: 700 }}>🔗 Bundled</span>{" "}
      badge will appear on <strong>both</strong> cases in Case History.
    </p>

    <div className="field" style={{ marginBottom: 14 }}>
      <label style={{ marginBottom: 6, display: "block" }}>
        New Case Type
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <label
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            background:
              bundleForm.type === "site"
                ? "#fef3c7"
                : "var(--entry-bg)",
            borderColor:
              bundleForm.type === "site"
                ? "#f59e0b"
                : "var(--border)",
            color:
              bundleForm.type === "site"
                ? "#92400e"
                : "var(--text)",
          }}
        >
          <input
            type="radio"
            name="bundleType"
            checked={bundleForm.type === "site"}
            onChange={() =>
              setBundleForm((f) => ({ ...f, type: "site" }))
            }
          />
          Site Comment
        </label>

        <label
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            background:
              bundleForm.type === "inbound"
                ? "#dcfce7"
                : "var(--entry-bg)",
            borderColor:
              bundleForm.type === "inbound"
                ? "#22c55e"
                : "var(--border)",
            color:
              bundleForm.type === "inbound"
                ? "#166534"
                : "var(--text)",
          }}
        >
          <input
            type="radio"
            name="bundleType"
            checked={bundleForm.type === "inbound"}
            onChange={() =>
              setBundleForm((f) => ({ ...f, type: "inbound" }))
            }
          />
          Inbound Email
        </label>
      </div>
    </div>

    <div className="field">
      <label>
        Bundle with Case from This Session{" "}
        <span className="req">*</span>
      </label>

      {caseOptions.length > 0 ? (
        <select
          className="inp"
          value={bundleForm.caseNum}
          onChange={(e) =>
            setBundleForm((f) => ({
              ...f,
              caseNum: e.target.value,
            }))
          }
          style={{ cursor: "pointer" }}
        >
          <option value="">— Select a case —</option>
          {caseOptions.map((c) => (
            <option key={c._id || c.caseNum} value={c.caseNum}>
              #{c.caseNum}
              {c.accountNum ? ` — ${c.accountNum}` : ""}
              {c.amendType ? ` · ${c.amendType}` : ""}
              {c.source === "suspended" ? " ⏸" : ""}
              {c.source === "saved" ? " ✅" : ""}
              {c.source === "session" ? " 🕐" : ""}
              {c._bundledWith ? " 🔗" : ""}
            </option>
          ))}
        </select>
      ) : (
        <div
          style={{
            padding: "12px 14px",
            background: "var(--entry-bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--muted)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          No saved cases found.
          <br />
          Complete or suspend a case first, then bundle.
        </div>
      )}

      {bundleForm.caseNum &&
        (() => {
          const sel = caseOptions.find(
            (o) => o.caseNum === bundleForm.caseNum
          );
          if (!sel) return null;

          const statusLabel =
            sel.source === "suspended"
              ? "⏸ Suspended"
              : sel.source === "saved"
              ? "✅ Saved"
              : "🕐 Session";

          return (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "var(--muted)",
                padding: "6px 10px",
                background: "var(--entry-bg)",
                borderRadius: 6,
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <strong style={{ color: "var(--text)" }}>
                #{sel.caseNum}
              </strong>

              {sel.accountNum && (
                <span>· {sel.accountNum}</span>
              )}

              {sel._mode && (
                <span>
                  ·{" "}
                  {sel._mode === "siteComment"
                    ? "Site Comment"
                    : "Inbound Email"}
                </span>
              )}

              {(()=>{
                const cx=sel._caseComplexity||"minor";
                if(cx==="major") return <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",color:"#f59e0b",fontWeight:700}}>Major</span>;
                if(cx==="complex") return <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"rgba(244,63,94,.12)",border:"1px solid rgba(244,63,94,.3)",color:"#f43f5e",fontWeight:700}}>Complex</span>;
                return <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",color:"#10b981",fontWeight:700}}>Minor</span>;
              })()}

              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  padding: "1px 7px",
                  borderRadius: 20,
                  background: "var(--card2)",
                  color: "var(--muted)",
                  fontWeight: 600,
                }}
              >
                {statusLabel}
              </span>

              {sel._bundledWith && (
                <span
                  style={{
                    color: "#10b981",
                    fontWeight: 700,
                    fontSize: 10,
                  }}
                >
                  🔗 Already bundled
                </span>
              )}
            </div>
          );
        })()}
    </div>

    <div className="modal-btns">
      <button
        className="btn btn-ghost"
        onClick={() => setBundleModal(false)}
      >
        Cancel
      </button>

      <button
        className="btn btn-primary"
        onClick={() => {
          if (!bundleForm.caseNum.trim()) {
            showToast("Select a case to bundle", "error");
            return;
          }

          // Store the full existing case data so the new bundle form can be prefilled
          const selCase = caseOptions.find(o=>o.caseNum===bundleForm.caseNum.trim());
          if(selCase?._fullData && typeof window!=="undefined"){
            try{
              // Only carry over images already in storage (have url, no pending _file blob).
              // Note: images loaded from DB don't carry _inDB:true, so we check url+!_file instead.
              const safeImages = (selCase._fullData.images||[])
                .filter(i=>i.url&&!i._file)
                .map(i=>({...i,_inDB:true}));
              const safeBackups = (selCase._fullData.backupImages||[])
                .filter(i=>i.url&&!i._file)
                .map(i=>({...i,_inDB:true}));
              const prefill = {
                // CASE INFORMATION (except case number)
                accountNum: selCase._fullData.accountNum||"",
                amendType: selCase._fullData.amendType||"",
                customerName: selCase._fullData.customerName||"",
                customerEmail: selCase._fullData.customerEmail||"",
                businessName: selCase._fullData.businessName||"",
                businessSuffix: selCase._fullData.businessSuffix||"",
                inboundNum: selCase._fullData.inboundNum||"",
                inProgress: selCase._fullData.inProgress||false,
                emailAddress: selCase._fullData.emailAddress||"",
                emailType: selCase._fullData.emailType||"clarification",
                trackerChecklistLink: selCase._fullData.trackerChecklistLink||"",
                _caseComplexity: selCase._fullData._caseComplexity||"minor",
                // ASSUMPTION/CASE COMMENT
                entries: selCase._fullData.entries||[],
                // ADDITIONAL BACKUP SCREENSHOT
                images: safeImages,
                // BEFORE/AFTER BACKUP
                backupImages: safeBackups,
                _sourceMode: selCase._fullData._mode||"",
              };
              localStorage.setItem("ch_bundle_prefill", JSON.stringify(prefill));
            }catch(e){ /* ignore serialisation errors */ }
          }

          setBundleModal(false);

          enterMode(
            bundleForm.type === "inbound"
              ? "inbound"
              : "siteComment",
            false,
            null,
            bundleForm.caseNum.trim()
          );

          showToast(
            "🔗 Bundle set — info from the existing case has been pre-filled",
            "info"
          );
        }}
      >
        🔗 Start Bundled Case
      </button>
    </div>
  </div>
</div>
     
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
        <button className="btn btn-ghost" style={{fontSize:11,padding:"5px 12px",borderRadius:6,color:"var(--amber)",borderColor:"rgba(245,158,11,.4)"}} onClick={()=>{const m=minimisedFormData?._mode||(typeof window!=="undefined"?localStorage.getItem("ch_active_form_mode"):null);if(m==="siteComment"||m==="inbound"){setMode(m);setIsMinimised(false);onFormActive&&onFormActive(true);onFormInFields&&onFormInFields(true);}}}> Resume</button>
      </div>}

      {/* Session Time Log */}
      

      {dbDrafts&&dbDrafts.length>0&&(
        <div style={{marginBottom:22}}>
          <p className="chd-h6" style={{marginBottom:10}}>Suspended Case</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {dbDrafts.map((d,i)=>(
            <div key={d._id||i} className="chd-case-card" style={{cursor:"default"}}>
              <div>
                <div className="chd-title-row">
                  <p className="chd-h6">{d.caseNum||"—"} - {d.accountNum||"—"}</p>
                  <span className="chd-badge" style={{background:d._mode==="siteComment"?"var(--site-comment,#4760ff)":"var(--inbound,#8a38f5)"}}>{d._mode==="siteComment"?"Site Comment":"Inbound Email"} - {(d._caseComplexity||"minor").charAt(0).toUpperCase()+(d._caseComplexity||"minor").slice(1)}</span>
                  {(()=>{const b=d._bundledWith;if(!b)return null;const nums=(Array.isArray(b)?b:[b]).filter(Boolean);if(!nums.length)return null;return <span className="chd-badge" style={{background:"var(--amber)"}}>w/ #{nums.join(", #")}</span>;})()}
                </div>
                <p className="chd-p-muted">{d.amendType||"No amend type"} · {d.draftAt}</p>
              </div>
              <div className="chd-row-actions">
                <button className="chd-btn-primary" disabled={!timedIn||breakActive||isMinimised} onClick={()=>enterMode(d._mode, true, d._id)} style={{opacity:(!timedIn||breakActive||isMinimised)?.45:1,cursor:(!timedIn||breakActive||isMinimised)?"not-allowed":"pointer"}}>Continue</button>
                <button className="chd-btn-secondary" disabled={!timedIn||breakActive||isMinimised} onClick={() => setDeleteDraftConfirm({ id: d._id, mode: d._mode })} style={{opacity:(!timedIn||breakActive||isMinimised)?.45:1,cursor:(!timedIn||breakActive||isMinimised)?"not-allowed":"pointer",borderColor:"var(--amber)",color:"var(--amber)"}}>Archive case</button>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}


      {sessionLog.length>0&&(
        <div className="session-log-wrap">
          <div className="session-log-header">
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              
              <div className="section-title" style={{marginBottom:0,borderBottom:"none",paddingBottom:0,fontSize:13}}>Session Time Log</div>
              <span style={{fontSize:10,padding:"2px 8px",background:"rgba(1,118,211,.12)",color:"var(--accent)",borderRadius:20,fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>{new Set(sessionLog.filter(e=>e.caseNum).map(e=>e.caseNum)).size} cases</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-ghost" style={{fontSize:11,padding:"5px 12px",borderRadius:7}} onClick={()=>setShowLog(s=>!s)}>{showLog?"▲ Hide":"▼ Show"} Log</button>
              
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
    {hasDuplicateCases&&<div style={{padding:"10px 16px",background:"rgba(245,158,11,.1)",borderBottom:"1px solid rgba(245,158,11,.2)",fontSize:11,fontWeight:700,color:"var(--amber)",fontFamily:"'Poppins',sans-serif"}}>⚠ Duplicate case numbers — only the latest entry per case can be edited.</div>}
    
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
        "Site Comment":"#0176D3","Inbound Email":"#7c3aed",
        "Break":"var(--green)",
      };
      
      const outcomeColors={
        "Completed":"var(--green)",
        "Updated":"var(--accent)",
        "Clarification":"var(--amber)",
        "Suspended":"var(--red)",
        "Deleted":"#f43f5e",
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
      
      const hasSuspendedDraft = !!dbDrafts?.find(d => d.caseNum === caseNum);
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
                  {isSavedBundle ? `🔗 w/ #${bundleNums.join(", #")}` : isChosenBundle ? "🔗 Bundling w/ new case" : `🔗 Bundle of #${activeBundleCaseNum}`}
                </span>
              );
            })()}
            {(()=>{
              const logCase = caseNum ? ((allSavedCases||[]).find(c=>c.caseNum===caseNum)||(dbDrafts||[]).find(d=>d.caseNum===caseNum)) : null;
              const cx = logCase?._caseComplexity;
              if(!cx||cx==="minor") return null;
              if(cx==="major") return <span style={{display:"inline-flex",alignItems:"center",fontSize:9,fontWeight:800,color:"#f59e0b",background:"rgba(245,158,11,.14)",border:"1px solid rgba(245,158,11,.35)",padding:"2px 7px",borderRadius:20,whiteSpace:"nowrap",fontFamily:"'Poppins',sans-serif",lineHeight:1.4}}>Major</span>;
              return <span style={{display:"inline-flex",alignItems:"center",fontSize:9,fontWeight:800,color:"#f43f5e",background:"rgba(244,63,94,.14)",border:"1px solid rgba(244,63,94,.35)",padding:"2px 7px",borderRadius:20,whiteSpace:"nowrap",fontFamily:"'Poppins',sans-serif",lineHeight:1.4}}>Complex</span>;
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
              if(cx==="complex") return <span style={{fontSize:9,fontWeight:800,color:"#f43f5e",background:"rgba(244,63,94,.14)",border:"1px solid rgba(244,63,94,.35)",padding:"2px 7px",borderRadius:20,fontFamily:"'Poppins',sans-serif"}}>Complex</span>;
              return <span style={{fontSize:9,fontWeight:800,color:"#10b981",background:"rgba(16,185,129,.14)",border:"1px solid rgba(16,185,129,.35)",padding:"2px 7px",borderRadius:20,fontFamily:"'Poppins',sans-serif"}}>Minor</span>;
            })()}
          </span>
          <span style={{color:outcomeColor,fontSize:10,fontWeight:700,fontFamily:"'Poppins',sans-serif",letterSpacing:".2px"}}>
            {outcome||"-"}
          </span>
          <div>
            {isDeleted?(
              <span style={{fontSize:10,fontWeight:700,color:"#f43f5e",fontFamily:"'Poppins',sans-serif",background:"rgba(244,63,94,.12)",padding:"3px 8px",borderRadius:2,border:"1px solid rgba(244,63,94,.3)"}}>🗑 Deleted</span>
            ):(outcome==="Prolonged"||outcome==="Pending")?(
              <span style={{fontSize:9,fontWeight:700,color:"#f59e0b",fontFamily:"'Poppins',sans-serif",background:"rgba(245,158,11,.1)",padding:"3px 8px",borderRadius:6,border:"1px solid rgba(245,158,11,.3)"}}>⏳ Tracker pending</span>
            ):outcome==="Completed Prolonged"?(
              <span style={{fontSize:9,fontWeight:700,color:"var(--green)",fontFamily:"'Poppins',sans-serif",background:"rgba(16,185,129,.1)",padding:"3px 8px",borderRadius:6,border:"1px solid rgba(16,185,129,.3)"}}>✅ Prolonged done</span>
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
                    const prolongedCount=sessionLog.filter(e=>e.outcome==="Prolonged").length;

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
                          {pill("Suspended",suspendedCount,"var(--red)","rgba(244,63,94,.07)")}
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
        <div className="modal-bg"><div className="modal" style={{maxWidth:520,width:"100%",maxHeight:"85vh",overflowY:"auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <h3 style={{margin:0}}>Edit Case #{editCase.caseNum}</h3>
            <span style={{fontSize:11,padding:"2px 10px",background:"var(--entry-accent-bg)",border:"1px solid var(--border)",color:"var(--accent)",fontWeight:700}}>{isEditSC?"Site Comment":"Inbound Email"}</span>
          </div>

          {/* Core fields */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div className="field" style={{marginBottom:0}}>
              <label>Case #</label>
              <input className="inp" value={editCase.caseNum||""} onChange={e=>setEditCase(c=>({...c,caseNum:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Account #</label>
              <input className="inp" value={editCase.accountNum||""} onChange={e=>setEditCase(c=>({...c,accountNum:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Amend Type</label>
              <input className="inp" value={editCase.amendType||""} onChange={e=>setEditCase(c=>({...c,amendType:e.target.value}))}/>
            </div>
            {!isEditSC&&(
              <div className="field" style={{marginBottom:0}}>
                <label>Inbound #</label>
                <input className="inp" value={editCase.inboundNum||""} onChange={e=>setEditCase(c=>({...c,inboundNum:e.target.value}))}/>
              </div>
            )}
            <div className="field" style={{marginBottom:0}}>
              <label>Customer Name</label>
              <input className="inp" placeholder="e.g. John Smith" value={editCase.customerName||""} onChange={e=>setEditCase(c=>({...c,customerName:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Customer Email</label>
              <input className="inp" type="email" placeholder="e.g. client@email.com" value={editCase.customerEmail||""} onChange={e=>setEditCase(c=>({...c,customerEmail:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0,gridColumn:"1/-1"}}>
              <label>Business Name</label>
              <div style={{display:"flex",gap:8}}>
                <input className="inp" placeholder="e.g. Fire Force" style={{flex:2}} value={editCase.businessName||""} onChange={e=>setEditCase(c=>({...c,businessName:e.target.value}))}/>
                <input className="inp" placeholder="LLC / Corp / Inc…" style={{flex:1}} value={editCase.businessSuffix||""} onChange={e=>setEditCase(c=>({...c,businessSuffix:e.target.value}))}/>
              </div>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Time In</label>
              <input className="inp" value={editCase.savedAt||""} onChange={e=>setEditCase(c=>({...c,savedAt:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Completed Time</label>
              <input className="inp" value={editCase.endedAt||""} placeholder="e.g. 02:30 PM" onChange={e=>setEditCase(c=>({...c,endedAt:e.target.value}))}/>
            </div>
          </div>

          {/* Inbound email fields */}
          {!isEditSC&&(
            <div style={{marginBottom:12,padding:"10px 12px",background:"var(--entry-bg)",border:"1px solid var(--border)",borderRadius:8}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:8,textTransform:"uppercase",letterSpacing:".6px"}}>Email Details</div>
              <div className="field" style={{marginBottom:8}}>
                <label>Email Address</label>
                <input className="inp" value={editCase.emailAddress||""} onChange={e=>setEditCase(c=>({...c,emailAddress:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                {["clarification","completed"].map(v=>(
                  <label key={v} className={`radio-label${editCase.emailType===v?" selected-"+(v==="clarification"?"clarif":"complete"):""}`}>
                    <input type="radio" name="editEmailType" checked={editCase.emailType===v} onChange={()=>setEditCase(c=>({...c,emailType:v}))} style={{display:"none"}}/>
                    {v==="clarification"?"Clarification":"Completed"}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Entries */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:8,textTransform:"uppercase",letterSpacing:".6px"}}>{isEditSC?"Site Comments":"Assumptions"}</div>
            {(editCase.entries||[]).map((e,ei)=>(
              <div key={e.id||ei} style={{background:"var(--entry-bg)",border:"1px solid var(--border)",padding:"10px 12px",marginBottom:8,borderRadius:8}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--accent)"}}>{isEditSC?`SC #${e.number||ei+1}`:`Assumption ${ei+1}`}</span>
                  <button className="entry-del" onClick={()=>setEditCase(c=>({...c,entries:c.entries.filter((_,i)=>i!==ei)}))}>
                    <Icon name="trash" size={12} color="var(--red)"/>
                  </button>
                </div>
                {isEditSC&&<div className="field" style={{marginBottom:6}}><label>SC #</label><input className="inp" value={e.number||""} onChange={ev=>setEditCase(c=>({...c,entries:c.entries.map((x,i)=>i===ei?{...x,number:ev.target.value}:x)}))}/></div>}
                <div className="field" style={{marginBottom:6}}><label>Note</label><textarea className="inp" rows={2} value={e.note||""} onChange={ev=>setEditCase(c=>({...c,entries:c.entries.map((x,i)=>i===ei?{...x,note:ev.target.value}:x)}))}/></div>
                <div className="field" style={{marginBottom:0}}><label>Clarification</label><textarea className="inp" rows={2} value={e.clarification||""} onChange={ev=>setEditCase(c=>({...c,entries:c.entries.map((x,i)=>i===ei?{...x,clarification:ev.target.value}:x)}))}/></div>
              </div>
            ))}
          </div>

          <div className="modal-btns">
            <button className="btn btn-ghost" onClick={()=>setEditCase(null)}>Cancel</button>
            <button className="btn btn-save" onClick={()=>{onUpdateCase&&onUpdateCase(editCase._id,editCase);setEditCase(null);showToast("Case updated ✅");}}>💾 Save Changes</button>
          </div>
        </div></div>
        );
      })()}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

