import { useCallback, useEffect, useRef } from 'react'

export function useAlarmSignals({ alarmMins, qaLimit, setActiveAlarm, startAlarmLoop, stopAlarmLoop }) {
  // ── Case 30-min alarm (passed as prop to PostLiveForm) ──
  const playEndAlarm=useCallback((type)=>startAlarmLoop(type==="qa"?"case_qa":"case"),[]);

  // ── GLOBAL alarm — reads ONLY from localStorage, zero React dependency.
  //    startAlarmLoop is captured via ref to avoid any stale closure issues. ──
  const globalCtFiredRef=useRef(new Set());
  const globalQaFiredRef=useRef(new Set());
  const alarmMinsRef=useRef(alarmMins);
  const qaLimitRef=useRef(qaLimit);
  const startAlarmLoopRef=useRef(null);
  useEffect(()=>{ alarmMinsRef.current=alarmMins; },[alarmMins]);
  useEffect(()=>{ qaLimitRef.current=qaLimit; },[qaLimit]);
  useEffect(()=>{ startAlarmLoopRef.current=startAlarmLoop; });

  // Poll ch_alarm_signal from localStorage every 500ms as a guaranteed fallback.
  // The interval below writes this key; this poller reads it and calls setActiveAlarm
  // directly in the App render cycle — bypassing any closure/stale-state issue.
  useEffect(()=>{
    const poller=setInterval(()=>{
      if(typeof window==="undefined") return;
      const sig=localStorage.getItem("ch_alarm_signal");
      if(!sig) return;
      try{
        const {type,ts}=JSON.parse(sig);
        // Only act if the signal is fresh (within the last 3 seconds)
        if(Date.now()-ts>3000){ localStorage.removeItem("ch_alarm_signal"); return; }
        localStorage.removeItem("ch_alarm_signal");
        if(startAlarmLoopRef.current) startAlarmLoopRef.current(type);
      }catch{ localStorage.removeItem("ch_alarm_signal"); }
    },500);
    return()=>clearInterval(poller);
  },[]);

  // showDomAlarm / dismissDomAlarm — directly create/remove alarm DOM node.
  // This BYPASSES React state and render scheduling entirely, so the alarm
  // shows immediately on any page regardless of React's batching or concurrency.
  const showDomAlarm = useCallback((type) => {
    if (document.getElementById("ch-dom-alarm")) return; // already showing
    const ct = alarmMinsRef.current;
    const qa = qaLimitRef.current;
    const title = type === "case"
      ? `Combined Tracker: ${ct} min reached!`
      : `QA Checklist: ${qa} min reached!`;
    const sub = type === "case"
      ? `You've been on this case for ${ct} minutes. Check if it needs to escalate or wrap up.`
      : `QA Checklist has been running for ${qa} minutes. Time to review and finalize.`;
    const icon = type === "case" ? "⏱" : "✅";
    const el = document.createElement("div");
    el.id = "ch-dom-alarm";
    // Match original .alarm-overlay exactly: 50% dark bg, centered
    el.className = "alarm-overlay";
    el.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;backdrop-filter:blur(6px);";
    el.innerHTML = `
      <div class="alarm-modal" style="animation:popIn .25s ease,alarmPulse 1.4s ease-in-out infinite;">
        <span class="alarm-icon">${icon}</span>
        <div class="alarm-title">${title}</div>
        <div class="alarm-sub">${sub}</div>
        <div class="alarm-btns">
          <button id="ch-dom-alarm-snooze" class="alarm-snooze">⏰ Snooze 30 min</button>
          <button id="ch-dom-alarm-dismiss" class="alarm-dismiss">I'm Aware</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    const remove = () => document.getElementById("ch-dom-alarm")?.remove();
    document.getElementById("ch-dom-alarm-dismiss")?.addEventListener("click", () => {
      remove(); stopAlarmLoop(); setActiveAlarm(null);
    });
    document.getElementById("ch-dom-alarm-snooze")?.addEventListener("click", () => {
      remove(); stopAlarmLoop(); setActiveAlarm(null);
      // Re-fire after 30 minutes by removing the fired flag after delay
      const tabId = el.dataset?.tabId;
      setTimeout(() => {
        globalCtFiredRef.current.delete(tabId||"");
        globalQaFiredRef.current.delete(tabId||"");
      }, 30 * 60 * 1000);
    });
    // Also fire sound
    if (startAlarmLoopRef.current) startAlarmLoopRef.current(type);
    return el;
  }, []);

  useEffect(()=>{
    const interval=setInterval(()=>{
      if(typeof window==="undefined") return;
      let tabs=[];
      try{
        const raw=localStorage.getItem("ch_live_tabs");
        if(raw) tabs=JSON.parse(raw);
      }catch{ return; }
      if(!tabs.length) return;
      // ── CRITICAL: alarm is ALWAYS based on the FIRST RUNNING tab (startTime!==null),
      //    NOT the currently displayed tab (ch_live_tab_active may point to a queued tab
      //    with startTime===null when user switches view, which was causing early exit). ──
      const activeTab=tabs.find(t=>t.startTime!==null&&t.startTime!==undefined);
      if(!activeTab||!activeTab.startTime) return; // no running tab
      const now=Date.now();
      const fe=Math.floor((now-Number(activeTab.startTime))/1000);
      if(fe<0) return;
      let p2=null;
      const p2Raw=localStorage.getItem(`ch_phase2_start_${activeTab.id}`);
      if(p2Raw){ const v=Math.floor((now-Number(p2Raw))/1000); if(v>0) p2=v; }
      if(fe<=0) globalCtFiredRef.current.delete(activeTab.id);
      if(!p2||p2<=0) globalQaFiredRef.current.delete(activeTab.id);
      const ctLimit=alarmMinsRef.current*60;
      if(ctLimit>0 && fe>0 && fe>=ctLimit && !globalCtFiredRef.current.has(activeTab.id)){
        globalCtFiredRef.current.add(activeTab.id);
        const domEl = showDomAlarm("case");
        if(domEl) domEl.dataset.tabId = activeTab.id;
      }
      const qaLimit2=qaLimitRef.current*60;
      if(qaLimit2>0 && p2!==null && p2>0 && p2>=qaLimit2 && !globalQaFiredRef.current.has(activeTab.id)){
        globalQaFiredRef.current.add(activeTab.id);
        const domElQa = showDomAlarm("case_qa");
        if(domElQa) domElQa.dataset.tabId = activeTab.id;
      }
    },1000);
    return()=>clearInterval(interval);
  },[showDomAlarm]);

  return { playEndAlarm }
}
