import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../icons/Icon';
import { cls, copyToClipboard, checkGrammar } from '../../lib/helpers';
import { idbOpen, dataURLtoFile } from '../../lib/idb';
import StepCard from '../ui/StepCard';
import CopyName from '../ui/CopyName';
import ImageUpload from './ImageUpload';
import EntryCard from './EntryCard';
import { CopyRow, CopyCaseBtn } from './CopyRow';
import GreetingRow from './GreetingRow';
import StickyPanel from './StickyPanel';
import TimerBar from './TimerBar';
import TocPanel from './TocPanel';

export const emptyEntry = ()=>({id:String(Date.now()+Math.random()),number:"",note:"",clarification:""});

export const emptyBase  = ()=>({
  caseNum:"",accountNum:"",amendType:"",inProgress:false,inboundNum:"",
  customerName:"",customerEmail:"",businessName:"",businessSuffix:"",
  _caseComplexity:"minor",
  entries:[emptyEntry()],
  devices:{mobile:false,tablet:false,desktop:false},
  checklist:{backup:false,caseComment:false,combinedTracker:false,qaChecklist:false,completeJob:false,closeSiteComment:false,emailSales:false,trackerChecklist:false,completeStatus:false},
  trackerChecklistLink:"",
  images:[],backupImages:[],emailAddress:"",emailType:"clarification",
  _startTime: Date.now(), _elapsedAtSave: 0
});

export default function PostLiveForm({ mode, onSave, onBack, onCancelForm, onSaveDraftDirect, onAutoSaveDraft, onStartBreak, onStartOpenHour, onStopOpenHour, openHourActive=false, breakActive=false, draftData, user, onTimerEnd, onQaTimerEnd, specialRequestors, timerLimitSecs, qaTimerLimitSecs=600, globalTimeIn, isEditMode=false, isMinimisedResume=false, caseStartTime=null, externalFormRef=null, isResumingDraft=false, originalOutcome="", originalTotalSecs=0, containerStyle={}, onTimerTick=null, prolongedActive=false, onProlongedDismiss=null, onProceedWithNext=null, prolongedMinsForNext=30, tabStorageKey=null, onTabDataChange=null }) {
  const isSC = mode==="siteComment";
  const entryLabel = isSC?"Site Comment":"Assumption";
  const rawName = user?.name || "User";
  const userName = rawName.trim().replace(/\s+/g,"_");
  const beforeName    = user?.beforeName  || `Post_Live_Amend_Before_${userName}_Amends`;
  const afterName     = user?.afterName   || `Post_Live_Amend_After_${userName}_Amends`;
  const screenshotName= user?.screenshotName || `Post_Live_Amend_Screenshot_${userName}_Amends`;

  const [form,setForm] = useState(()=>{
    // 1. Per-tab persistence — restores this specific tab's form after page refresh
    if(tabStorageKey && typeof window!=="undefined"){
      const tabSaved=localStorage.getItem(`ch_tab_form_${tabStorageKey}`);
      if(tabSaved){ try{ return {...emptyBase(),...JSON.parse(tabSaved)}; }catch{} }
    }
    // 2. Draft / minimised form (first-tab restore path)
    if(draftData) return {...emptyBase(),...draftData};
    // Check for bundle prefill — data from the existing case chosen in the bundle modal
    if(typeof window!=="undefined"){
      const raw = localStorage.getItem("ch_bundle_prefill");
      if(raw){
        try{
          const prefill = JSON.parse(raw);
          localStorage.removeItem("ch_bundle_prefill");
          const base = emptyBase();
          const newIsSC = mode==="siteComment";
          const srcIsSC = prefill._sourceMode==="siteComment";
          // Map entries: copy them regardless of mode switch — label will adapt via entryLabel
          // For cross-mode bundles, entries carry the text content; the label (Site Comment/Assumption) changes automatically
          return {
            ...base,
            accountNum: prefill.accountNum||"",
            amendType: prefill.amendType||"",
            customerName: prefill.customerName||"",
            customerEmail: prefill.customerEmail||"",
            businessName: prefill.businessName||"",
            businessSuffix: prefill.businessSuffix||"",
            inboundNum: newIsSC ? "" : (prefill.inboundNum||""),
            inProgress: prefill.inProgress||false,
            // ASSUMPTION/CASE COMMENT
            entries: (prefill.entries&&prefill.entries.length>0) ? prefill.entries : base.entries,
            // ADDITIONAL BACKUP SCREENSHOT
            images: prefill.images||[],
            // BEFORE/AFTER BACKUP
            backupImages: prefill.backupImages||[],
            // CASE INFORMATION (except case number)
            emailAddress: newIsSC ? "" : (prefill.emailAddress||""),
            emailType: newIsSC ? "clarification" : (prefill.emailType||"clarification"),
            trackerChecklistLink: prefill.trackerChecklistLink||"",
            _caseComplexity: prefill._caseComplexity||"minor",
          };
        }catch(e){ localStorage.removeItem("ch_bundle_prefill"); }
      }
    }
    return emptyBase();
  });
  const formRef = useRef(form);
  useEffect(()=>{
    formRef.current=form;
    if(externalFormRef) externalFormRef.current=form;
    // Auto-persist form to localStorage on every change so refresh restores it
    // Only do this for active (non-edit) forms — edit mode doesn't need persistence
    if(!isEditMode && typeof window!=="undefined"){
      const toSave={...form,_mode:mode,_startTime:startTimeRef.current,images:(form.images||[]).filter(i=>i._inDB),backupImages:(form.backupImages||[]).filter(i=>i._inDB)};
      localStorage.setItem("ch_minimised_form",JSON.stringify(toSave));
      // Per-tab key so ALL tabs survive page refresh independently
      if(tabStorageKey) localStorage.setItem(`ch_tab_form_${tabStorageKey}`,JSON.stringify(toSave));
      window.dispatchEvent(new Event("ch_case_saved"));
    }
    // Notify parent tab strip with latest caseNum + businessName + complexity for live label update
    if(onTabDataChange) onTabDataChange({ caseNum: form.caseNum||'', businessName: form.businessName||'', complexity: form._caseComplexity||'minor' });
  },[form]);

  // ── File Name Generator — listen for fill event, only apply to the active tab ──
  useEffect(()=>{
    if(caseStartTime===null) return; // queued tab — ignore
    const h=(e)=>{
      const {caseNum,businessName,complexity}=e.detail||{};
      setF({
        ...(caseNum?{caseNum}:{}),
        ...(businessName?{businessName}:{}),
        ...(complexity?{_caseComplexity:complexity}:{}),
      });
    };
    window.addEventListener("fngen_fill",h);
    return()=>window.removeEventListener("fngen_fill",h);
  },[caseStartTime]);

  // Always use caseStartTime (globalTimeIn passed from session) so the form timer is consistent
  // with the session active timer — whether opening fresh, continuing suspended, or editing.
  // If caseStartTime is null the tab is queued and not yet active — timer stays frozen at 0.
  const isQueued = caseStartTime === null;
  const startTimeRef = useRef(isQueued ? Date.now() : (caseStartTime || (draftData?._startTime) || Date.now()));

  // isDraft: true only for resumed *suspended* drafts — locks case info fields.
  // Minimised resume is NOT a draft lock — user should be able to edit case info.
  const isDraft = !isMinimisedResume && !!(draftData && (draftData.caseNum || draftData.accountNum || draftData._elapsedAtSave));

  // isDraftResumed: true when resuming a suspended draft OR editing (shows split timer)
  const isDraftResumed = isEditMode || (!isMinimisedResume && !!(draftData && draftData._elapsedAtSave));

  // For suspended/edit: store how long elapsed before this resume so we can show "Before: X / Now: Y"
  // For suspended: prevElapsedSecs = _elapsedAtSave (time on case before suspend)
  // For edit: snapshot elapsed at mount time — static, does not tick
  // resumeStartRef = wall-clock when this resume/edit session began — persisted so refresh doesn't reset it
  const _resumeInit = typeof window!=="undefined" ? (() => { const v=localStorage.getItem("ch_resume_start"); return v?Number(v):Date.now(); })() : Date.now();
  const resumeStartRef = useRef(_resumeInit);
  // On first mount, stamp it so subsequent refreshes restore correctly
  useEffect(()=>{
    if(typeof window!=="undefined"&&!localStorage.getItem("ch_resume_start")){
      localStorage.setItem("ch_resume_start",String(resumeStartRef.current));
    }
  },[]);

  // For suspended/edit: store how long elapsed before this resume so we can show "Before: X / Now: Y"
  // For suspended: prevElapsedSecs = _elapsedAtSave (time on case before suspend)
  // For edit: snapshot elapsed at mount time — static, does not tick
  const prevElapsedSecs = isDraftResumed
    ? (isEditMode
        ? Math.floor((_resumeInit - (caseStartTime || _resumeInit)) / 1000)
        : (draftData?._elapsedAtSave || 0))
    : 0;

  // Phase 2 timer: starts when Combined Tracker checkbox is first checked
  // Scoped per-tab using tabStorageKey so tabs never share phase2 state
  const p2Key = tabStorageKey ? `ch_phase2_start_${tabStorageKey}` : null;
  const _phase2Init = (p2Key && typeof window!=="undefined") ? (() => { const v=localStorage.getItem(p2Key); return v?Number(v):null; })() : null;
  const phase2StartRef = useRef(_phase2Init);
  const [phase2Elapsed, setPhase2Elapsed] = useState(()=>{
    if(!p2Key||typeof window==="undefined") return null;
    const v=localStorage.getItem(p2Key);
    return v?Math.floor((Date.now()-Number(v))/1000):null;
  });

  const [openStep,setOpenStep] = useState(1);
  const [modal,setModal] = useState(null);
  const [saveOutcomeType,setSaveOutcomeType] = useState("completed"); // "completed" | "clarification"
  const [toast,showToast] = useToast();
  const [copiedAll,setCopiedAll] = useState(false);
  const [draftSaving,setDraftSaving] = useState(false);
  const [breakConfirmData,setBreakConfirmData] = useState(null); // {label,mins} for break confirmation
  // Footer timer — ticks every second for the action-bar elapsed display
  const [footerElapsed,setFooterElapsed] = useState(()=> isQueued ? 0 : Math.floor((Date.now()-startTimeRef.current)/1000));
  const [resumeElapsed,setResumeElapsed] = useState(0); // seconds since this resume started
  // Freeze the main elapsed value the moment Phase 2 starts — it won't tick further
  const frozenElapsedRef = useRef(null);
  const frozenResumeRef  = useRef(null);
  // Keep onTimerTick in a ref so the interval always calls the latest version
  const onTimerTickRef = useRef(onTimerTick);
  useEffect(()=>{ onTimerTickRef.current=onTimerTick; },[onTimerTick]);
  // Track active state — starts false for queued tabs, flips true when caseStartTime becomes non-null
  const timerActiveRef = useRef(!isQueued);
  useEffect(()=>{
    if(caseStartTime===null){
      // Tab was queued or reset — fully clear phase2 state
      timerActiveRef.current = false;
      frozenElapsedRef.current = null;
      frozenResumeRef.current = null;
      phase2StartRef.current = null;
      setPhase2Elapsed(null);
      setFooterElapsed(0);
      setResumeElapsed(0);
      if(p2Key && typeof window!=="undefined") localStorage.removeItem(p2Key);
    } else if(!timerActiveRef.current){
      // Tab just became active — stamp startTime and begin ticking
      startTimeRef.current = caseStartTime;
      resumeStartRef.current = caseStartTime;
      timerActiveRef.current = true;
      // Reset phase2 frozen refs so newly activated tab never inherits stale values
      frozenElapsedRef.current = null;
      frozenResumeRef.current = null;
      phase2StartRef.current = null;
      setPhase2Elapsed(null);
      if(p2Key && typeof window!=="undefined") localStorage.removeItem(p2Key);
    }
  },[caseStartTime]);
  // ── "Break for a while" pause/resume — freezes THIS tab's clock while on break ──
  // (only relevant if this tab stayed active/mounted through the break, i.e. wasn't saved away)
  const breakPausedRef = useRef(false);
  const breakPauseStartRef = useRef(null);
  useEffect(()=>{
    if(breakActive){
      // Only pause if this tab is genuinely running (not a queued tab sitting at 0)
      if(timerActiveRef.current && !breakPausedRef.current){
        breakPausedRef.current = true;
        breakPauseStartRef.current = Date.now();
      }
    } else if(breakPausedRef.current){
      // Break just ended — shift all start references forward by however long we were paused,
      // so the clock continues from exactly where it was instead of jumping ahead.
      const pausedMs = Date.now() - (breakPauseStartRef.current||Date.now());
      startTimeRef.current += pausedMs;
      resumeStartRef.current += pausedMs;
      if(phase2StartRef.current !== null) phase2StartRef.current += pausedMs;
      breakPausedRef.current = false;
      breakPauseStartRef.current = null;
    }
  },[breakActive]);
  useEffect(()=>{
    const tick=()=>{
      if(!timerActiveRef.current) return; // still queued
      if(breakPausedRef.current) return; // on break — keep display frozen, don't advance
      const phase2Active = phase2StartRef.current !== null;
      if(phase2Active && frozenElapsedRef.current === null){
        frozenElapsedRef.current = Math.floor((Date.now()-startTimeRef.current)/1000);
        frozenResumeRef.current  = Math.floor((Date.now()-resumeStartRef.current)/1000);
      }
      const fe = phase2Active ? frozenElapsedRef.current : Math.floor((Date.now()-startTimeRef.current)/1000);
      const re = phase2Active ? frozenResumeRef.current  : Math.floor((Date.now()-resumeStartRef.current)/1000);
      const p2 = phase2Active ? Math.floor((Date.now()-phase2StartRef.current)/1000) : null;
      setFooterElapsed(fe);
      setResumeElapsed(re);
      if(p2!==null) setPhase2Elapsed(p2);
      if(onTimerTickRef.current) onTimerTickRef.current({footerElapsed:fe,resumeElapsed:re,phase2Elapsed:p2,isDraftResumed,isEditMode,prevElapsedSecs,originalTotalSecs,originalOutcome});
    };
    const t=setInterval(tick,1000);
    return()=>clearInterval(t);
  },[]);
  // ── Drag: track by entry ID not index ──
  const dragFromId  = useRef(null);
  const dragToId    = useRef(null);
  const [dragActiveId, setDragActiveId] = useState(null);

  // Auto-save removed — only user can decide to suspend/draft via the Suspend Case button.

  const setF=(patch)=>setForm(f=>({...f,...patch}));

  // Auto-fill emailAddress from customerEmail whenever customerEmail changes (inbound only)
  useEffect(()=>{
    if(!isSC && form.customerEmail && !form._emailAddressManuallySet){
      setForm(f=>({...f, emailAddress: form.customerEmail}));
    }
  },[form.customerEmail]);

  const step1Done = !!(form.caseNum&&form.accountNum&&form.amendType&&(isSC||form.inboundNum));
  const step2Done = !!form._beforeCopied;
  const step3Done = isSC
    ?form.entries.some(e=>e.number.trim())
    :form.entries.some(e=>e.note.trim()||e.clarification.trim());
  const step4Done = form.devices.mobile&&form.devices.tablet&&form.devices.desktop;
  const step5Done = step4Done;
  const step6Done = !!form._afterCopied;
  const step7NameDone = !!form._screenshotCopied||form.images?.length>0;
  // Only check the keys that are actually rendered for this mode.
  // For inbound: exclude closeSiteComment (SC-only) and check closeInboundCase instead.
  // For siteComment: exclude closeInboundCase and check closeSiteComment instead.
  const relevantChecklistKeys = isSC
    ? ["backup","caseComment",...(prolongedActive?[]:["combinedTracker"]),"qaChecklist","closeSiteComment","completeJob","emailSales","trackerChecklist","completeStatus"]
    : ["backup","caseComment",...(prolongedActive?[]:["combinedTracker"]),"qaChecklist","completeJob","closeInboundCase","emailSales","trackerChecklist","completeStatus"];
  const step7Done = relevantChecklistKeys.every(k => !!form.checklist[k]);

  const addEntry    = ()=>setF({entries:[...form.entries,emptyEntry()]});
  const updateEntry = (id,val)=>setF({entries:form.entries.map(e=>e.id===id?val:e)});
  const deleteEntry = (id)=>setF({entries:form.entries.filter(e=>e.id!==id)});
  const moveEntry = (fromId,toId)=>setF(f=>{
    const arr=[...f.entries];
    const fi=arr.findIndex(e=>e.id===fromId);
    const ti=arr.findIndex(e=>e.id===toId);
    if(fi===-1||ti===-1||fi===ti) return f;
    const [moved]=arr.splice(fi,1);
    arr.splice(ti,0,moved);
    return{...f,entries:arr};
  });

  const buildEntriesText = ()=>{
    const es=formRef.current.entries;
    let out="Post-Live Amends:";
    es.forEach(e=>{
      if(!e.number&&!e.note&&!e.clarification)return;
      if(isSC){
        out+=`\n\nSite Comment #${e.number}:\n`;
        if(e.note)out+=`Note: ${e.note}`;
        if(e.clarification)out+=`\n\nClarification:  ${e.clarification}`;
      } else {
        out+=`\n\nAssumption:\n`;
        if(e.note)out+=`Note: ${e.note}`;
        if(e.clarification)out+=`\n\nClarification:  ${e.clarification}`;
      }
    });
    return out.trimEnd();
  };
  const buildEmailText = ()=>{
    const f=formRef.current;
    const tl=f.emailType==="clarification"?"Clarification email sent to":"Email completed sent to";
    return `${buildEntriesText()}\n\n${tl} ${f.emailAddress||"—"}.`;
  };

  const handleCopyAll=()=>{ const txt=isSC?buildEntriesText():buildEmailText(); copyToClipboard(txt).then(()=>{setCopiedAll(true);setTimeout(()=>setCopiedAll(false),1800);}); };
  const handleSave=()=>{
    if(!step1Done)return showToast("Complete Step 1 first","error");
    if(!step4Done)return showToast("All 3 devices must be checked","error");
    if(!step7Done)return showToast("Complete the Final Checklist first","error");
    setModal("save");
  };

  const handleDraft=()=>{
    if(!step1Done)return showToast("Complete Step 1 first","error");
    setModal("draft");
  };
  
  const getCleanForm = () => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current)/1000);
    const strip=(imgs)=>(imgs||[]).map(({_file,url,name,id,path,_inDB})=>({url,name,id,path:path||id,_inDB:_inDB||false}));
    return {...formRef.current,images:strip(formRef.current.images),backupImages:strip(formRef.current.backupImages),_elapsedAtSave:elapsed,_startTime:startTimeRef.current,trackerChecklistLink:formRef.current.trackerChecklistLink||""};
  };

 

  const confirmSaveDraft = async() => {
    if(draftSaving) return;
    setDraftSaving(true);
    try{
      setModal(null);
      await onSaveDraftDirect(getCleanForm());
    }catch(e){
      setDraftSaving(false);
      showToast("❌ Failed to Suspend Case — check connection","error");
    }
  };

  const stepProps = {openStep, setOpenStep};

  return (
    <div className="form-cols" style={containerStyle}>
      <div className="form-right">
        <StickyPanel startTimeRef={startTimeRef} form={form} isSC={isSC} buildEntriesText={buildEntriesText} buildEmailText={buildEmailText} onTimerEnd={onTimerEnd} onQaTimerEnd={onQaTimerEnd} specialRequestors={specialRequestors} timerLimitSecs={timerLimitSecs} qaTimerLimitSecs={qaTimerLimitSecs} greetingMessages={user?.greetingMessages} footerElapsed={footerElapsed} phase2Elapsed={phase2Elapsed}/>
      </div>

      <div className="form-left">

        <StepCard num={1} title="Case Information" done={step1Done} locked={false} {...stepProps}>
          <div className="field"><label>Case Number <span className="req">*</span></label><input className="inp" placeholder="e.g. 1234567" value={form.caseNum} onChange={e=>setF({caseNum:cleanSpaces(e.target.value)})}/></div>
          <div className="field"><label>Account Number <span className="req">*</span></label><input className="inp" placeholder="e.g. ACC-9876" value={form.accountNum} onChange={e=>setF({accountNum:cleanSpaces(e.target.value)})}/></div>
          {!isSC&&(<div className="field"><label>Inbound Number <span className="req">*</span></label><input className="inp" placeholder="Enter inbound number" value={form.inboundNum||""} onChange={e=>setF({inboundNum:cleanSpaces(e.target.value)})}/></div>)}
          <div className="field"><label>Amend Type <span className="req">*</span></label><input className="inp" placeholder="e.g. Content, Layout, Link..." value={form.amendType} onChange={e=>setF({amendType:cleanSpaces(e.target.value)})}/></div>
          <div className="field">
            <label>Case Complexity</label>
            <select className="inp" value={form._caseComplexity||"minor"} onChange={e=>setF({_caseComplexity:e.target.value})} style={{cursor:"pointer"}}>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="complex">Complex</option>
            </select>
          </div>
          <div className="field"><label>Customer Name</label><input className="inp" placeholder="e.g. John Smith" value={form.customerName||""} onChange={e=>setF({customerName:cleanSpaces(e.target.value)})}/></div>
          <div className="field"><label>Customer Email</label><input className="inp" type="email" placeholder="e.g. client@email.com" value={form.customerEmail||""} onChange={e=>setF({customerEmail:cleanSpaces(e.target.value)})}/></div>
          <div className="field" style={{marginBottom:0}}>
            <label>Business Name</label>
            <div style={{display:"flex",gap:8}}>
              <input className="inp" placeholder="e.g. Fire Force" style={{flex:2}} value={form.businessName||""} onChange={e=>setF({businessName:cleanSpaces(e.target.value)})}/>
              <input className="inp" placeholder="LLC / Corp / Inc…" style={{flex:1}} value={form.businessSuffix||""} onChange={e=>setF({businessSuffix:cleanSpaces(e.target.value)})}/>
            </div>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Business name · Suffix (optional)</div>
          </div>
          <label className={cls("check-label",form.inProgress&&"checked")} style={{marginTop:4,width:"fit-content"}}><input type="checkbox" checked={form.inProgress} onChange={e=>setF({inProgress:e.target.checked})}/>In-Progress Salesforce</label>
        </StepCard>

         
          
       <StepCard num={2} title="Before Screenshot Name" done={form._beforeCopied} locked={!step1Done&&!isDraft} {...stepProps}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:9}}>Save your before screenshot with this name.</p>
          <CopyName name={beforeName} onCopy={()=>setF({_beforeCopied:true})}/>
        </StepCard>
      


          <StepCard num={3} title={`Additional Backup Screenshots${form.backupImages?.length>0?" ("+form.backupImages.length+")":""}`} done={form.backupImages?.length>0} locked={!step2Done&&!isDraft} {...stepProps}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:11}}>Each renamed <span style={{color:"var(--accent)",fontWeight:600}}>backup-screenshot-N</span> on download.</p>
          <ImageUpload baseName="backup-screenshot" multiple onImages={imgs=>setF({backupImages:imgs,checklist:{...formRef.current.checklist}})} immediateUpload={false} initialImages={form.backupImages||[]} caseNum={form.caseNum||""} businessName={form.businessName||""} storageKey={tabStorageKey?`${tabStorageKey}-backup`:"backup"} isActive={openStep===3}/>
        </StepCard>

        


        <StepCard num={4} title={isSC?"Post-Live Amends Notepad":"Assumptions Notepad"} done={step3Done} locked={!step2Done&&!isDraft} {...stepProps}>
          <div id="entries-list">
          {form.entries.map((e,i)=>(
            <div key={e.id} className="entry-drag-row" data-entryid={e.id}>
              <EntryCard
                entry={e} label={entryLabel} index={i} showNumber={isSC}
                onChange={val=>updateEntry(e.id,val)}
                onDelete={()=>deleteEntry(e.id)}
                isDragging={dragActiveId===e.id}
                onDragHandlePointerDown={(ev)=>{
                  ev.preventDefault();
                  ev.stopPropagation();
                  const fromId=String(e.id);
                  dragFromId.current=fromId;
                  dragToId.current=fromId;
                  setDragActiveId(fromId);
                  document.body.style.cursor="grabbing";
                  document.body.style.userSelect="none";

                  const getRows=()=>document.querySelectorAll(".entry-drag-row");

                  const onMove=(mv)=>{
                    const y=mv.clientY;
                    // clear old lines
                    getRows().forEach(r=>r.querySelectorAll(".drop-line").forEach(l=>l.remove()));
                    let bestId=null, bestPos="after";
                    getRows().forEach(row=>{
                      const rid=row.dataset.entryid;
                      if(rid===fromId) return;
                      const rect=row.getBoundingClientRect();
                      if(y>=rect.top && y<=rect.bottom){
                        bestId=rid;
                        bestPos=y<rect.top+rect.height/2?"before":"after";
                      }
                    });
                    if(bestId){
                      dragToId.current=bestId+"::"+bestPos;
                      const targetRow=document.querySelector(`.entry-drag-row[data-entryid="${bestId}"]`);
                      if(targetRow){
                        const line=document.createElement("div");
                        line.className="drop-line";
                        if(bestPos==="before") targetRow.prepend(line);
                        else targetRow.appendChild(line);
                      }
                    } else {
                      dragToId.current=null;
                    }
                    // fade source row
                    getRows().forEach(row=>{
                      row.style.opacity=row.dataset.entryid===fromId?"0.3":"1";
                    });
                  };

                  const onUp=()=>{
                    document.body.style.cursor="";
                    document.body.style.userSelect="";
                    getRows().forEach(row=>{
                      row.querySelectorAll(".drop-line").forEach(l=>l.remove());
                      row.style.opacity="1";
                    });
                    const rawTo=dragToId.current;
                    setDragActiveId(null);
                    dragFromId.current=null;
                    dragToId.current=null;
                    if(rawTo && rawTo.includes("::")){
                      const [toId,pos]=rawTo.split("::");
                      setForm(prev=>{
                        const arr=[...prev.entries];
                        const fi=arr.findIndex(x=>String(x.id)===fromId);
                        let ti=arr.findIndex(x=>String(x.id)===toId);
                        if(fi===-1||ti===-1||fi===ti) return prev;
                        const [moved]=arr.splice(fi,1);
                        ti=arr.findIndex(x=>String(x.id)===toId);
                        const insertAt=pos==="after"?ti+1:ti;
                        arr.splice(insertAt,0,moved);
                        return{...prev,entries:arr};
                      });
                    }
                    window.removeEventListener("pointermove",onMove,true);
                    window.removeEventListener("pointerup",onUp,true);
                  };

                  window.addEventListener("pointermove",onMove,true);
                  window.addEventListener("pointerup",onUp,true);
                }}
              />
            </div>
          ))}
          </div>
          {isSC&&<button className="add-entry-btn" onClick={addEntry}>＋ Add New Site Comment</button>}
          {!isSC&&(
            <div style={{marginTop:16,padding:"15px",background:"var(--code-bg)",borderRadius:10,border:"1.5px solid var(--border)"}}>
              <div className="field"><label>Email Address <span className="req">*</span></label><input className="inp" type="email" placeholder="client@email.com" value={form.emailAddress} onChange={e=>setF({emailAddress:e.target.value,_emailAddressManuallySet:true})}/>{form.customerEmail&&!form.emailAddress&&<div style={{fontSize:10,color:"var(--accent)",marginTop:4,fontFamily:"'Poppins',sans-serif"}}>↑ Will auto-fill from Customer Email in Step 1</div>}</div>
              <div className="field" style={{marginBottom:0}}><label>Email Type <span className="req">*</span></label>
                <div className="radio-group">
                  <label className={cls("radio-label",form.emailType==="clarification"&&"selected-clarif")}><input type="radio" name="emailType" value="clarification" checked={form.emailType==="clarification"} onChange={()=>setF({emailType:"clarification"})} style={{display:"none"}}/>Clarification</label>
                  <label className={cls("radio-label",form.emailType==="completed"&&"selected-complete")}><input type="radio" name="emailType" value="completed" checked={form.emailType==="completed"} onChange={()=>setF({emailType:"completed"})} style={{display:"none"}}/>Completed</label>
                </div>
              </div>
            </div>
          )}
          <button className={cls("copy-all-btn",copiedAll&&"copied")} onClick={handleCopyAll}>{copiedAll?"✓ Copied!":"📋 Copy All "+(isSC?"Site Comments":"Assumptions + Email")}</button>
        </StepCard>

          <StepCard num={5} title="Device Check" done={step4Done} locked={!step3Done&&!isDraft} {...stepProps}>
          <p style={{fontSize:12,color:"var(--muted)",marginBottom:11}}>All three must be checked <span className="req">*</span></p>
          <div className="check-group">
            {[["mobile","Mobile"],["tablet","Tablet"],["desktop","Desktop"]].map(([k,l])=>(<label key={k} className={cls("check-label",form.devices[k]&&"checked")}><input type="checkbox" checked={form.devices[k]} onChange={e=>setF({devices:{...form.devices,[k]:e.target.checked}})}/>{l}</label>))}
          </div>
        </StepCard>

      


        <StepCard num={6} title="After Screenshot Name" done={form._afterCopied} locked={!step5Done&&!isDraft} {...stepProps}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:9}}>Save your after screenshot with this name.</p>
          <CopyName name={afterName} onCopy={()=>setF({_afterCopied:true})}/>
        </StepCard>

           <StepCard num={7} title="Before/After Backup" done={!!form._screenshotCopied||form.images?.length>0} locked={!step6Done&&!isDraft} {...stepProps}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:9}}>Upload screenshot — renamed automatically on download.</p>
          <CopyName name={screenshotName} onCopy={()=>setF({_screenshotCopied:true})}/>
          <div style={{marginTop:12}}><ImageUpload baseName={screenshotName} multiple={false} onImages={imgs=>{setF({images:imgs,_screenshotCopied:imgs&&imgs.length>0?true:form._screenshotCopied});}} immediateUpload={false} initialImages={form.images||[]} caseNum={form.caseNum||""} businessName={form.businessName||""} storageKey={tabStorageKey?`${tabStorageKey}-main`:"main"} isActive={openStep===7}/></div>
        </StepCard>

     
        <StepCard num={8} title="Final Checklist" done={step7Done} locked={!step7NameDone&&!isDraft} {...stepProps}>
          <p style={{fontSize:12,color:"var(--muted)",marginBottom:11}}>All items must be checked <span className="req">*</span></p>
          <div className="check-group" style={{flexDirection:"column"}}>
            {(isSC
              ? [["closeSiteComment","Close Site Comment?"],["backup","Before/After Backup?"],["caseComment","Case Comment"],["completeJob","Complete Job?"],["emailSales","Email Sales?"],["trackerChecklist","Complete Status Tracker?"],["combinedTracker","Combined Tracker?"],["qaChecklist","QA Checklist?"],["completeStatus","Tracker Checklist?"]]
              : [["backup","Before/After Backup?"],["caseComment","Case Comment"],["completeJob","Complete Job?"],["closeInboundCase","Close Inbound Case?"],["emailSales","Email Sales?"],["trackerChecklist","Complete Status Tracker?"],["combinedTracker","Combined Tracker?"],["qaChecklist","QA Checklist?"],["completeStatus","Tracker Checklist?"]]
            ).map(([k,l])=>{
              const isProlongedTracker = k==="combinedTracker" && prolongedActive;
              return (
              <div key={k}>
                {isProlongedTracker ? (
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:30,border:"1px dashed rgba(245,158,11,.4)",background:"rgba(245,158,11,.06)",opacity:.7}}>
                    <span style={{fontSize:13}}>⏳</span>
                    <span style={{fontSize:12,color:"#f59e0b",fontFamily:"'Poppins',sans-serif",fontWeight:600}}>Combined Tracker — due after prolonged timer</span>
                  </div>
                ) : (
                <label className={cls("check-label",form.checklist[k]&&"checked")} style={{width:"fit-content"}}><input type="checkbox" checked={!!form.checklist[k]} onChange={e=>{
                  const newChecklist={...form.checklist,[k]:e.target.checked};
                  if(phase2StartRef.current===null){
                    const allThree=newChecklist.backup&&newChecklist.caseComment&&(prolongedActive||newChecklist.combinedTracker);
                    if(allThree){
                      const t=Date.now();
                      phase2StartRef.current=t;
                      if(p2Key&&typeof window!=="undefined") localStorage.setItem(p2Key,String(t));
                      setFooterElapsed(f=>f);
                      setResumeElapsed(r=>r);
                      setPhase2Elapsed(0);
                    }
                  }
                  setF({checklist:newChecklist});
                }}/>{l}</label>
                )}
              </div>
              );
            })}
          </div>
          <div className="field" style={{marginTop:14,marginBottom:0}}>
            <label style={{fontSize:10,fontWeight:700,color:"var(--accent)",marginBottom:4,display:"block",textTransform:"uppercase",letterSpacing:".7px"}}>🔗 Tracker Link</label>
            <input
              className="inp"
              type="url"
              placeholder="https://..."
              value={form.trackerChecklistLink||""}
              onChange={e=>setF({trackerChecklistLink:e.target.value})}
              style={{fontSize:12}}
            />
          </div>
          {/* Proceed with Next Case — multi-tab prolonged mode */}
          {onProceedWithNext&&!isEditMode&&(
            <div style={{marginTop:18,paddingTop:14,borderTop:"1px solid var(--border)"}}>
              <button
                style={{width:"100%",padding:"13px",borderRadius:10,border:"2px solid rgba(245,158,11,.4)",background:"rgba(245,158,11,.08)",color:"#f59e0b",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Poppins',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}
                onClick={()=>{
                  const elapsed=Math.floor((Date.now()-startTimeRef.current)/1000);
                  const f={...formRef.current,_saveOutcome:'completed',_elapsedAtSave:elapsed,_totalElapsed:elapsed};
                  onSave&&onSave(f);
                  onProceedWithNext(f,prolongedMinsForNext);
                }}
              >
                <span style={{fontSize:18}}>⏭</span>
                Proceed with Next Case
                <span style={{fontSize:11,fontWeight:400,color:"rgba(245,158,11,.7)"}}>saves this case &amp; opens next form</span>
              </button>
            </div>
          )}
        </StepCard>

  
      <div className="action-bar">
  {isEditMode ? (
    <>
      <div className="action-group action-group-left">
        <button 
          className="btn btn-danger" 
          style={{borderRadius:8}} 
          onClick={() => onBack && onBack()} 
        >
          ✕ Cancel Edit
        </button>

      </div>
      <div className="action-group action-group-center"/>
      <div className="action-group action-group-right">
        <button className="btn btn-save" style={{borderRadius:8}} onClick={handleSave}>💾 Save Case</button>
      </div>
    </>
  ) : (
    <>
      <div className="action-group action-group-left">
        {/* FIX: Using onBack here ensures new forms/inbound also cancel cleanly */}
        <button 
          className="btn btn-ghost" 
          style={{borderRadius:8}} 
          onClick={() => onBack && onBack()}
        >
          ← Back
        </button>
        <button className="btn btn-ghost" style={{borderRadius:8}} onClick={() => setModal("clear")}>🧹 Clear</button>

      </div>

      <div className="action-group action-group-center">
        {onStartBreak && [{label:"☕ 15m",mins:15},{label:"🧘 30m",mins:30},{label:"🍱 1h",mins:60}].map(({label,mins})=>(
          <button key={mins} className="btn btn-amber" style={{borderRadius:8,fontSize:12,padding:"8px 12px"}}
            onClick={() => {
              if(!form.caseNum){showToast("Enter a case number first","error");return;}
              setBreakConfirmData({label,mins});
              setModal("breakConfirm");
            }}>
            {label}
          </button>
        ))}
        {onStartOpenHour && (
          <button className="btn btn-amber" style={{borderRadius:8,fontSize:12,padding:"8px 12px"}}
            onClick={() => {
              if(!form.caseNum){showToast("Enter a case number first","error");return;}
              setBreakConfirmData({label:"🏢 Open Hour",mins:0,isOpenHour:true});
              setModal("breakConfirm");
            }}>
            🏢 Open Hour
          </button>
        )}
      </div>

      <div className="action-group action-group-right">
        {!isResumingDraft&&<button className="btn btn-draft" style={{borderRadius:8}} onClick={handleDraft}>💾 Suspend Case</button>}
        {onProceedWithNext&&!isEditMode&&(
          <button className="btn" style={{borderRadius:8,background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.4)",color:"#f59e0b",fontWeight:700,fontSize:13}} onClick={()=>{
            const elapsed=Math.floor((Date.now()-startTimeRef.current)/1000);
            const f={...formRef.current,_saveOutcome:'completed',_elapsedAtSave:elapsed,_totalElapsed:elapsed};
            onSave&&onSave(f);
            onProceedWithNext(f, prolongedMinsForNext);
          }}>⏭ Next Case</button>
        )}
        <button className="btn btn-save" style={{borderRadius:8}} onClick={handleSave}>✅ Save Case</button>
      </div>
    </>
  )}
</div>

        {modal==="clear"&&(<div className="modal-bg"><div className="modal"><div style={{marginBottom:14}}><Icon name="clear" size={40} color="var(--red)"/></div><h3>Clear All Fields?</h3><p style={{color:"var(--muted)",fontSize:13,marginBottom:20,lineHeight:1.6}}>All entered data will be cleared. The form stays open and the timer keeps running.</p><div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button><button className="btn btn-danger" onClick={()=>{
    setForm(emptyBase());
    resumeStartRef.current=Date.now();
    if(typeof window!=="undefined"){
        localStorage.setItem("ch_resume_start",String(Date.now()));
        if(p2Key) localStorage.removeItem(p2Key);
    }
    phase2StartRef.current=null;
    setPhase2Elapsed(null); frozenElapsedRef.current=null; frozenResumeRef.current=null;
    setModal(null);
    showToast("All fields cleared","info");
    // ADD THESE TWO LINES ↓
    idbClearImages("backup").catch(()=>{});
    idbClearImages("main").catch(()=>{});
}}>Clear All</button></div></div></div>)}
        {modal==="save"&&(<div className="modal-bg"><div className="modal"><div style={{marginBottom:14}}><Icon name="save" size={40} color="var(--accent)"/></div><h3>Save Case?</h3><p style={{color:"var(--muted)",fontSize:13,marginBottom:16,lineHeight:1.6}}>Case <strong style={{color:"var(--text)"}}>#{form.caseNum}</strong> — confirm everything is complete. The timer will reset.</p><div style={{marginBottom:18}}><div style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".7px",fontFamily:"'Poppins',sans-serif",marginBottom:8}}>Case Outcome</div><div style={{display:"flex",gap:10}}><button onClick={()=>setSaveOutcomeType("completed")} style={{flex:1,padding:"10px 12px",borderRadius:10,border:`2px solid ${saveOutcomeType==="completed"?"var(--accent)":"var(--border)"}`,background:saveOutcomeType==="completed"?"var(--entry-accent-bg)":"var(--card)",color:saveOutcomeType==="completed"?"var(--accent)":"var(--muted)",fontWeight:700,fontSize:12,fontFamily:"'Poppins',sans-serif",cursor:"pointer",transition:".15s",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:18}}>✅</span>Completed</button><button onClick={()=>setSaveOutcomeType("clarification")} style={{flex:1,padding:"10px 12px",borderRadius:10,border:`2px solid ${saveOutcomeType==="clarification"?"var(--amber)":"var(--border)"}`,background:saveOutcomeType==="clarification"?"rgba(245,158,11,.1)":"var(--card)",color:saveOutcomeType==="clarification"?"var(--amber)":"var(--muted)",fontWeight:700,fontSize:12,fontFamily:"'Poppins',sans-serif",cursor:"pointer",transition:".15s",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:18}}>🔄</span>Clarification</button></div></div><div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Go Back</button><button className="btn btn-primary" onClick={()=>{setModal(null);showToast("Case saved! ✅");const elapsed=Math.floor((Date.now()-startTimeRef.current)/1000);const p2=phase2Elapsed!==null?phase2Elapsed:0;const totalSecs=elapsed+(isEditMode?0:p2);const f={...formRef.current,_saveOutcome:saveOutcomeType,_elapsedAtSave:elapsed,_phase2Elapsed:p2,_totalElapsed:totalSecs,trackerChecklistLink:formRef.current.trackerChecklistLink||""};onSave&&onSave(f);}}>✅ Save Case</button></div></div></div>)}
        {modal==="draft"&&(<div className="modal-bg"><div className="modal">
          <div style={{marginBottom:14}}><Icon name="draft" size={44} color="var(--amber)"/></div>
          <h3 style={{marginBottom:8}}>Save as Draft?</h3>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:8,lineHeight:1.6}}>
            Your progress will be saved and you can resume anytime from Post-Live Amends.
          </p>
          <div style={{background:"var(--entry-accent-bg)",border:"1.5px solid var(--accent)",borderRadius:10,padding:"12px 16px",marginBottom:18,display:"flex",flexDirection:"column",gap:6}}>
            {form.caseNum&&<div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>Case #{form.caseNum}</div>}
            <div style={{fontSize:12,color:"var(--muted)"}}> Time on case: <strong style={{color:"var(--accent)",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15}}>{fmtElapsed(Math.floor((Date.now()-startTimeRef.current)/1000))}</strong></div>
            <div style={{fontSize:11,color:"var(--muted)"}}>This time will be restored when you resume.</div>
          </div>
          <div className="modal-btns">
            <button className="btn btn-ghost" onClick={()=>setModal(null)}>Keep Editing</button>
            <button className="btn btn-draft" onClick={confirmSaveDraft} disabled={draftSaving} style={{opacity:draftSaving?.6:1}}>{draftSaving?"Saving…":"💾 Save & Go Back"}</button>
          </div>
        </div></div>)}
        {modal==="breakConfirm"&&breakConfirmData&&(<div className="modal-bg"><div className="modal">
          <div style={{marginBottom:14,fontSize:36}}>{breakConfirmData.label.split(" ")[0]}</div>
          <h3 style={{marginBottom:6}}>{breakConfirmData.isOpenHour?"Starting Open Hour / Meeting":`Starting ${breakConfirmData.label} Break`}</h3>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:20,lineHeight:1.6}}>How would you like to save your current case before going {breakConfirmData.isOpenHour?"into Open Hour":"on break"}?</p>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
            {!isResumingDraft&&(<button
              className="btn btn-draft"
              style={{borderRadius:8,justifyContent:"flex-start",padding:"12px 16px",textAlign:"left",display:"flex",alignItems:"center",gap:10}}
              onClick={async()=>{
                if(!step1Done){showToast("Fill in Case Information (Step 1) first","error");return;}
                setModal(null);
                const data=breakConfirmData;
                setBreakConfirmData(null);
                setDraftSaving(true);
                try{
                  await onSaveDraftDirect(getCleanForm());
                  if(data.isOpenHour){
                    setTimeout(()=>onStartOpenHour&&onStartOpenHour(),80);
                  } else {
                    setTimeout(()=>onStartBreak&&onStartBreak(data.label.replace(/[☕🧘🍱]/g,"").trim()+" break",data.mins),80);
                  }
                }catch(e){
                  setDraftSaving(false);
                  showToast("❌ Failed to suspend case — check connection","error");
                }
              }}
            >
              <span style={{fontSize:18}}>💾</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>Save as Suspended / Draft</div>
                <div style={{fontSize:11,opacity:.75,fontWeight:400}}>Requires Case Information (Step 1)</div>
              </div>
            </button>)}
            <button
              className="btn btn-save"
              style={{borderRadius:8,justifyContent:"flex-start",padding:"12px 16px",textAlign:"left",display:"flex",alignItems:"center",gap:10}}
              onClick={()=>{
                if(!step1Done){showToast("Complete Step 1 (Case Information) first","error");return;}
                if(!step4Done){showToast("All 3 devices must be checked","error");return;}
                if(!step7Done){showToast("Complete the Final Checklist first","error");return;}
                const data=breakConfirmData;
                setModal(null);
                setBreakConfirmData(null);
                onSave&&onSave({...formRef.current,trackerChecklistLink:formRef.current.trackerChecklistLink||"",_breakPending:true});
                if(data.isOpenHour){
                  setTimeout(()=>onStartOpenHour&&onStartOpenHour(),80);
                } else {
                  setTimeout(()=>onStartBreak&&onStartBreak(data.label.replace(/[☕🧘🍱]/g,"").trim()+" break",data.mins),80);
                }
              }}
            >
              <span style={{fontSize:18}}>✅</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>Save Case</div>
                <div style={{fontSize:11,opacity:.75,fontWeight:400}}>Requires all steps complete</div>
              </div>
            </button>
          </div>
          <div style={{borderTop:"1px solid var(--glass-border)",margin:"4px 0 14px",paddingTop:14}}>
            <button
              className="btn btn-ghost"
              style={{borderRadius:8,justifyContent:"flex-start",padding:"12px 16px",textAlign:"left",display:"flex",alignItems:"center",gap:10,width:"100%"}}
              onClick={()=>{
                const data=breakConfirmData;
                setModal(null);
                setBreakConfirmData(null);
                // Don't save/draft anything — the tab stays exactly as-is, just paused.
                if(data.isOpenHour){
                  onStartOpenHour&&onStartOpenHour();
                } else {
                  onStartBreak&&onStartBreak(data.label.replace(/[☕🧘🍱]/g,"").trim()+" break",data.mins);
                }
              }}
            >
              <span style={{fontSize:18}}>⏸️</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>Break for a while</div>
                <div style={{fontSize:11,opacity:.75,fontWeight:400}}>Don't save — case stays open in this tab, timer pauses and resumes after</div>
              </div>
            </button>
          </div>
          <div className="modal-btns" style={{justifyContent:"center"}}>
            <button className="btn btn-ghost" style={{borderRadius:8}} onClick={()=>{setModal(null);setBreakConfirmData(null);}}>Cancel</button>
          </div>
        </div></div>)}
      </div>

      <TocPanel openStep={openStep} setOpenStep={setOpenStep} isSC={isSC} page="postlive"
        specialRequestors={specialRequestors}
        doneMap={{
          1:step1Done,
          2:!!form._beforeCopied,
          3:!!(form.backupImages&&form.backupImages.length>0),
          4:step3Done,
          5:step4Done,
          6:!!form._afterCopied,
          7:!!form._screenshotCopied||!!(form.images?.length>0),
          8:step7Done,
        }}
      />

      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

