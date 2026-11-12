import { storage } from '@/services/storage'
import { idbClearImages } from '@/services/pendingImageStore'

export function usePostLiveModes({ activeFormTabId, allSavedCases, breakActive, caseStartTimeRef, dbDrafts, editingCase, globalTimeIn, minimisedFormData, mode, onFormActive, onFormInFields, onMinimise, setActiveBundleCaseNum, setActiveDraftId, setActiveFormTabId, setActiveLiveTabs, setBackConfirm, setEditingCase, setIsMinimised, setMinimisedFormData, setMode, setSessionLog, setTabTimerStates, setUseDraft, showToast, useDraft }) {
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
      storage.set("ch_case_start_time", String(t));
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
        storage.set("ch_session_log", JSON.stringify(next));
        return next;
      });
    }
  };
  const exitMode=()=>{
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
    storage.set("ch_active_form_use_draft","0");
    if(formData){
      const toSave={...formData, _mode: mode||formData._mode};
      setMinimisedFormData(toSave);
      storage.set("ch_minimised_form",JSON.stringify(toSave));
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
      storage.set("ch_session_log",JSON.stringify(next));
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
      const raw=storage.get("ch_case_extra_cache");
      if(raw){const cache=JSON.parse(raw);const cached=cache[foundCase.caseNum];if(cached){enrichedCase={...enrichedCase,customerName:enrichedCase.customerName||cached.customerName||"",customerEmail:enrichedCase.customerEmail||cached.customerEmail||"",businessName:enrichedCase.businessName||cached.businessName||"",businessSuffix:enrichedCase.businessSuffix||cached.businessSuffix||"",inboundNum:enrichedCase.inboundNum||cached.inboundNum||"",inProgress:enrichedCase.inProgress??cached.inProgress??false,entries:(enrichedCase.entries&&enrichedCase.entries.length>0)?enrichedCase.entries:(cached.entries||enrichedCase.entries||[]),checklist:enrichedCase.checklist||cached.checklist||{},devices:enrichedCase.devices||cached.devices||{},trackerChecklistLink:enrichedCase.trackerChecklistLink||cached.trackerChecklistLink||"",emailAddress:enrichedCase.emailAddress||cached.emailAddress||"",emailType:enrichedCase.emailType||cached.emailType||""};}}
    }catch(e){}
    try{
      const minData=storage.get("ch_minimised_form");
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
        storage.set("ch_session_log",JSON.stringify(next));
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
        storage.set("ch_session_log",JSON.stringify(next));
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

  return { cancelMode, enterEditFromLog, enterMode, exitMode, minimiseMode }
}
