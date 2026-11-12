import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Toast } from '@/components/ui/Toast'
import { STEP_PAGE, WIZARD_PAGES } from '@/config/wizard'
import { useToast } from '@/hooks/useToast'
import { emptyBase, emptyEntry } from '@/models/caseModels'
import { idbClearImages } from '@/services/pendingImageStore'
import { cls } from '@/utils/classNames'
import { fmtElapsed } from '@/utils/format'
import { cleanSpaces } from '@/utils/text'
import { CopyName } from './CopyName'
import { ImageUpload } from './ImageUpload'
import { StepCard } from './StepCard'
import { StickyPanel } from './StickyPanel'
import { WizardStepBar } from './WizardStepBar'
import { QuickToolsPanel } from './QuickToolsPanel'
import { BreakConfirmModal } from './BreakConfirmModal'
import { FinalChecklistStep } from './FinalChecklistStep'
import { NotepadStep } from './NotepadStep'
import { useFormExports } from '../hooks/useFormExports'
import { useFormTimers } from '../hooks/useFormTimers'

export function PostLiveForm({ mode, onSave, onBack, onCancelForm, onSaveDraftDirect, onAutoSaveDraft, onStartBreak, onStartOpenHour, onStopOpenHour, openHourActive=false, breakActive=false, draftData, user, onTimerEnd, onQaTimerEnd, specialRequestors, timerLimitSecs, qaTimerLimitSecs=600, globalTimeIn, isEditMode=false, isMinimisedResume=false, caseStartTime=null, externalFormRef=null, isResumingDraft=false, originalOutcome="", originalTotalSecs=0, containerStyle={}, onTimerTick=null, tabStorageKey=null, onTabDataChange=null, onOpenFileNameGenerator=null }) {
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
  const [breakConfirmData,setBreakConfirmData] = useState(null);
  const {
    footerElapsed, frozenElapsedRef, frozenResumeRef, setFooterElapsed, setResumeElapsed,
  } = useFormTimers({
    breakActive, caseStartTime, isDraftResumed, isEditMode, isQueued, onTimerTick, originalOutcome,
    originalTotalSecs, p2Key, phase2StartRef, prevElapsedSecs, resumeStartRef, setPhase2Elapsed,
    startTimeRef,
  });
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
    ? ["backup","caseComment","combinedTracker","qaChecklist","closeSiteComment","completeJob","emailSales","trackerChecklist","completeStatus"]
    : ["backup","caseComment","combinedTracker","qaChecklist","completeJob","closeInboundCase","emailSales","trackerChecklist","completeStatus"];
  const step7Done = relevantChecklistKeys.every(k => !!form.checklist[k]);

  const addEntry    = ()=>setF({entries:[...form.entries,emptyEntry()]});
  const updateEntry = (id,val)=>setF({entries:form.entries.map(e=>e.id===id?val:e)});
  const deleteEntry = (id)=>setF({entries:form.entries.filter(e=>e.id!==id)});

  const {
    buildEmailText, buildEntriesText, getCleanForm, handleCopyAll, handleDraft, handleSave,
  } = useFormExports({
    formRef, isSC, setCopiedAll, setModal, showToast, startTimeRef, step1Done, step4Done,
    step7Done,
  });

 

  const confirmSaveDraft = async() => {
    if(draftSaving) return;
    setDraftSaving(true);
    try{
      setModal(null);
      await onSaveDraftDirect(getCleanForm());
    }catch(e){
      setDraftSaving(false);
      showToast("Failed to Suspend Case — check connection","error");
    }
  };

  // ── Wizard page state ──────────────────────────────────────────────────
  // activePage is simply STEP_PAGE[openStep]; we keep openStep (1-8) as the
  // source of truth so every existing isActive={openStep===N} / step*Done /
  // scroll-to-id reference below keeps working untouched.
  const activePage = STEP_PAGE[openStep] || 1;
  // Per-page "done" = every underlying step in that page is done (same flags v1 already computed).
  const pageDoneMap = {
    1: step1Done,
    2: step2Done && (form.backupImages?.length>0 || true), // additional backups are optional, only the name-copy is required
    3: step3Done && step5Done,
    4: step6Done && step7NameDone,
    5: step7Done,
  };
  // Per-page "reachable" = every prior page is done (or this is a resumed draft, which unlocks free navigation like v1 did).
  const pageReachableMap = {
    1: true,
    2: isDraft || pageDoneMap[1],
    3: isDraft || (pageDoneMap[1] && pageDoneMap[2]),
    4: isDraft || (pageDoneMap[1] && pageDoneMap[2] && pageDoneMap[3]),
    5: isDraft || (pageDoneMap[1] && pageDoneMap[2] && pageDoneMap[3] && pageDoneMap[4]),
  };
  const goToPage = (p) => {
    const firstStep = (WIZARD_PAGES.find(w=>w.page===p)||{}).steps?.[0] || 1;
    setOpenStep(firstStep);
  };
  const goNext = () => { if(activePage<5 && pageReachableMap[activePage+1]) goToPage(activePage+1); };
  const goBack = () => { if(activePage>1) goToPage(activePage-1); };
  const WizardNav = ({ showNext=true }) => (
    <div className="wizard-nav">
      {activePage>1 && <button type="button" className="wizard-nav-btn wizard-nav-back" onClick={goBack} aria-label="Back">←</button>}
      {showNext && activePage<5 && (
        <button type="button" className="wizard-nav-btn wizard-nav-next" disabled={!pageReachableMap[activePage+1]} onClick={goNext} aria-label="Next">→</button>
      )}
    </div>
  );

  return (
    <div className="form-cols" style={containerStyle}>
      <div className="form-right">
        <StickyPanel startTimeRef={startTimeRef} form={form} isSC={isSC} buildEntriesText={buildEntriesText} buildEmailText={buildEmailText} onTimerEnd={onTimerEnd} onQaTimerEnd={onQaTimerEnd} specialRequestors={specialRequestors} timerLimitSecs={timerLimitSecs} qaTimerLimitSecs={qaTimerLimitSecs} greetingMessages={user?.greetingMessages} footerElapsed={footerElapsed} phase2Elapsed={phase2Elapsed}/>
      </div>

      <div className="form-left" style={isEditMode?{paddingBottom:140}:undefined}>

        {!isEditMode && (
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:6}}>
            <button type="button" onClick={()=>setModal("clear")} style={{background:'none',border:'none',color:'var(--muted)',fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontFamily:"'Poppins',sans-serif"}}>
              <Icon name="clear" size={11} color="var(--muted)"/> Clear All Fields
            </button>
          </div>
        )}
        <WizardStepBar activePage={activePage} goToPage={goToPage} isSC={isSC} pageDone={pageDoneMap} pageReachable={pageReachableMap}/>

        <StepCard num={1} title="Case Information" subtitle="Input the case information — all are required unless labeled optional" done={step1Done} isOpen={activePage===1}>
          <div className="field"><label>Case Number <span className="req">*</span></label><input className="inp" placeholder="e.g. 1234567" value={form.caseNum} onChange={e=>setF({caseNum:cleanSpaces(e.target.value)})}/></div>
          <div className="field"><label>Account Number <span className="req">*</span></label><input className="inp" placeholder="e.g. ACC-9876" value={form.accountNum} onChange={e=>setF({accountNum:cleanSpaces(e.target.value)})}/></div>
          {!isSC&&(<div className="field"><label>Inbound Number <span className="req">*</span></label><input className="inp" placeholder="Enter inbound number" value={form.inboundNum||""} onChange={e=>setF({inboundNum:cleanSpaces(e.target.value)})}/></div>)}
          <div className="field"><label>Amend Type <span className="req">*</span></label><input className="inp" placeholder="e.g. Content, Layout, Link..." value={form.amendType} onChange={e=>setF({amendType:cleanSpaces(e.target.value)})}/></div>
          <div className="field">
            <label>Complexity</label>
            <div style={{display:'flex',gap:10}}>
              {[["minor","Minor"],["major","Major"],["complex","Complex"]].map(([v,l])=>(
                <label key={v} onClick={()=>setF({_caseComplexity:v})} style={{flex:1,display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:8,border:`1.5px solid ${(form._caseComplexity||"minor")===v?"var(--accent)":"var(--border)"}`,background:"#fff",cursor:'pointer',fontSize:13,color:"var(--text)",transition:'.15s'}}>
                  <span style={{width:16,height:16,borderRadius:'50%',border:`1.5px solid ${(form._caseComplexity||"minor")===v?"var(--accent)":"var(--border)"}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(form._caseComplexity||"minor")===v&&<span style={{width:8,height:8,borderRadius:'50%',background:"var(--accent)"}}/>}
                  </span>
                  {l}
                </label>
              ))}
            </div>
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
          {activePage===1 && <WizardNav/>}
        </StepCard>

       <StepCard num={2} title="Before Screenshot Name" subtitle="Save your before screenshot backup of the file" done={form._beforeCopied} isOpen={activePage===2}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:9}}>Save your before screenshot with this name.</p>
          <CopyName name={beforeName} onCopy={()=>setF({_beforeCopied:true})}/>
        </StepCard>
      


          <StepCard num={3} title={`Additional Backup Screenshots${form.backupImages?.length>0?" ("+form.backupImages.length+")":""}`} subtitle="Optional — extra backups beyond the before screenshot" done={form.backupImages?.length>0} isOpen={activePage===2}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:11}}>Each renamed <span style={{color:"var(--accent)",fontWeight:600}}>backup-screenshot-N</span> on download.</p>
          <ImageUpload showToast={showToast} baseName="backup-screenshot" multiple onImages={imgs=>setF({backupImages:imgs,checklist:{...formRef.current.checklist}})} immediateUpload={false} initialImages={form.backupImages||[]} caseNum={form.caseNum||""} businessName={form.businessName||""} storageKey={tabStorageKey?`${tabStorageKey}-backup`:"backup"} isActive={activePage===2}/>
          {activePage===2 && <WizardNav/>}
        </StepCard>


        <NotepadStep
          WizardNav={WizardNav}
          activePage={activePage}
          addEntry={addEntry}
          copiedAll={copiedAll}
          deleteEntry={deleteEntry}
          dragActiveId={dragActiveId}
          dragFromId={dragFromId}
          dragToId={dragToId}
          entryLabel={entryLabel}
          form={form}
          handleCopyAll={handleCopyAll}
          isSC={isSC}
          setDragActiveId={setDragActiveId}
          setF={setF}
          setForm={setForm}
          step3Done={step3Done}
          updateEntry={updateEntry}
        />

        <StepCard num={6} title="After Screenshot Name" subtitle="Save your after screenshot backup of the file" done={form._afterCopied} isOpen={activePage===4}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:9}}>Save your after screenshot with this name.</p>
          <CopyName name={afterName} onCopy={()=>setF({_afterCopied:true})}/>
        </StepCard>

           <StepCard num={7} title="Before After Backup Screenshot" subtitle="Upload or paste your before and after screenshot — image auto-renamed on download" done={!!form._screenshotCopied||form.images?.length>0} isOpen={activePage===4}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:9}}>Upload screenshot — renamed automatically on download.</p>
          <CopyName name={screenshotName} onCopy={()=>setF({_screenshotCopied:true})}/>
          <div style={{marginTop:12}}><ImageUpload showToast={showToast} baseName={screenshotName} multiple={false} onImages={imgs=>{setF({images:imgs,_screenshotCopied:imgs&&imgs.length>0?true:form._screenshotCopied});}} immediateUpload={false} initialImages={form.images||[]} caseNum={form.caseNum||""} businessName={form.businessName||""} storageKey={tabStorageKey?`${tabStorageKey}-main`:"main"} isActive={activePage===4}/></div>
          {activePage===4 && <WizardNav/>}
        </StepCard>

     
        <FinalChecklistStep
          activePage={activePage}
          form={form}
          formRef={formRef}
          goBack={goBack}
          handleSave={handleSave}
          isEditMode={isEditMode}
          isSC={isSC}
          onSave={onSave}
          p2Key={p2Key}
          phase2StartRef={phase2StartRef}
          setF={setF}
          setFooterElapsed={setFooterElapsed}
          setPhase2Elapsed={setPhase2Elapsed}
          setResumeElapsed={setResumeElapsed}
          startTimeRef={startTimeRef}
          step7Done={step7Done}
        />

  
      {isEditMode && (
        <div className="action-bar">
          <div className="action-group action-group-left">
            <button className="btn btn-danger" style={{borderRadius:20}} onClick={() => onBack && onBack()}>Cancel Edit</button>
          </div>
          <div className="action-group action-group-center"/>
          <div className="action-group action-group-right">
            <button className="btn btn-save" style={{borderRadius:20}} onClick={handleSave}>Save Case</button>
          </div>
        </div>
      )}

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
        {modal==="save"&&(<div className="modal-bg"><div className="modal">
          <button onClick={()=>setModal(null)} aria-label="Close" style={{position:"absolute",top:18,right:16,width:12,height:12,border:"none",background:"none",cursor:"pointer",color:"var(--accent)",fontSize:16,lineHeight:1,padding:0}}>✕</button>
          <h3>Submit Case <span style={{color:"#4760ff"}}>#{form.caseNum}</span>?</h3>
          <p style={{color:"var(--accent)",fontSize:12,marginBottom:20,lineHeight:1.6}}>Submitted data will be saved to session logs.</p>
          <div style={{marginBottom:18,textAlign:"left"}}><div style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".7px",fontFamily:"'Poppins',sans-serif",marginBottom:8}}>Case Outcome</div><div style={{display:"flex",gap:10}}><button onClick={()=>setSaveOutcomeType("completed")} style={{flex:1,padding:"10px 12px",borderRadius:20,border:`2px solid ${saveOutcomeType==="completed"?"var(--accent)":"var(--border)"}`,background:saveOutcomeType==="completed"?"var(--entry-accent-bg)":"var(--card)",color:saveOutcomeType==="completed"?"var(--accent)":"var(--muted)",fontWeight:700,fontSize:12,fontFamily:"'Poppins',sans-serif",cursor:"pointer",transition:".15s",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:18}}>✅</span>Completed</button><button onClick={()=>setSaveOutcomeType("clarification")} style={{flex:1,padding:"10px 12px",borderRadius:20,border:`2px solid ${saveOutcomeType==="clarification"?"var(--amber)":"var(--border)"}`,background:saveOutcomeType==="clarification"?"rgba(200,134,58,.1)":"var(--card)",color:saveOutcomeType==="clarification"?"var(--amber)":"var(--muted)",fontWeight:700,fontSize:12,fontFamily:"'Poppins',sans-serif",cursor:"pointer",transition:".15s",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:18}}>🔄</span>Clarification</button></div></div><div className="modal-btns"><button className="btn btn-primary" onClick={()=>{showToast("Case saved! ✅");const elapsed=Math.floor((Date.now()-startTimeRef.current)/1000);const p2=phase2Elapsed!==null?phase2Elapsed:0;const totalSecs=elapsed+(isEditMode?0:p2);const f={...formRef.current,_saveOutcome:saveOutcomeType,_elapsedAtSave:elapsed,_phase2Elapsed:p2,_totalElapsed:totalSecs,trackerChecklistLink:formRef.current.trackerChecklistLink||""};onSave&&onSave(f);setModal("postSubmitBreak");}}>Submit Case</button><button className="btn btn-danger" onClick={()=>setModal(null)}>No, Cancel</button></div></div></div>)}

        {modal==="postSubmitBreak"&&(<div className="modal-bg"><div className="modal">
          <button onClick={()=>setModal(null)} aria-label="Close" style={{position:"absolute",top:18,right:16,width:12,height:12,border:"none",background:"none",cursor:"pointer",color:"var(--accent)",fontSize:16,lineHeight:1,padding:0}}>✕</button>
          <h3>Would You Like to Take a Break?</h3>
          <p style={{color:"var(--accent)",fontSize:12,marginBottom:22,lineHeight:1.6}}>Break start when the case submitted.. PS: Time is running, please choose.</p>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:18}}>
            {[{label:"15 min",icon:"coffee",mins:15},{label:"30 min",icon:"meditate",mins:30},{label:"1 hour",icon:"lunch",mins:60},{label:"Meeting",icon:"calendar",mins:60,isOpenHour:true}].map(({label,icon,mins,isOpenHour})=>(
              <button key={label} className="btn btn-ghost btn-noicon" style={{flexDirection:"column",gap:5,padding:"10px 18px"}} onClick={()=>{setModal(null);if(isOpenHour){onStartOpenHour&&onStartOpenHour();}else{onStartBreak&&onStartBreak(label+" break",mins);}}}>
                <Icon name={icon} size={18} color="var(--accent)"/>
                <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:"var(--accent)"}}>{label}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-danger" style={{width:"100%",justifyContent:"center"}} onClick={()=>setModal(null)}>No, I dont want to take a Break</button>
        </div></div>)}
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
            <button className="btn btn-draft" onClick={confirmSaveDraft} disabled={draftSaving} style={{opacity:draftSaving?.6:1}}>{draftSaving?"Saving…":"Save & Go Back"}</button>
          </div>
        </div></div>)}
        {modal==="breakConfirm"&&breakConfirmData&&(<BreakConfirmModal breakConfirmData={breakConfirmData} formRef={formRef} getCleanForm={getCleanForm} isResumingDraft={isResumingDraft} onSave={onSave} onSaveDraftDirect={onSaveDraftDirect} onStartBreak={onStartBreak} onStartOpenHour={onStartOpenHour} setBreakConfirmData={setBreakConfirmData} setDraftSaving={setDraftSaving} setModal={setModal} showToast={showToast} step1Done={step1Done} step4Done={step4Done} step7Done={step7Done} />)}
      </div>

      <QuickToolsPanel
        buildEmailText={buildEmailText}
        buildEntriesText={buildEntriesText}
        form={form}
        handleDraft={handleDraft}
        isResumingDraft={isResumingDraft}
        isSC={isSC}
        onOpenFileNameGenerator={onOpenFileNameGenerator}
        onStartBreak={onStartBreak}
        onStartOpenHour={onStartOpenHour}
        setBreakConfirmData={setBreakConfirmData}
        setModal={setModal}
        showToast={showToast}
      />

      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}
