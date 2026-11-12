import { useEffect, useRef, useState } from 'react'

export function useFormTimers({ breakActive, caseStartTime, isDraftResumed, isEditMode, isQueued, onTimerTick, originalOutcome, originalTotalSecs, p2Key, phase2StartRef, prevElapsedSecs, resumeStartRef, setPhase2Elapsed, startTimeRef }) {
  // {label,mins} for break confirmation
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

  return { footerElapsed, frozenElapsedRef, frozenResumeRef, setFooterElapsed, setResumeElapsed }
}
