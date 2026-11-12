import { useEffect, useState } from 'react'
import { storage } from '@/services/storage'

export function useBreakTimer({ addSessionLog, globalTimeIn, setActiveAlarm, setGlobalTimeIn, setSessionLog, startAlarmLoop, stopAlarmLoop }) {
  const [breakTimer,setBreakTimer]=useState(()=>{
    if(typeof window==="undefined") return null;
    try{
      const v=localStorage.getItem("ch_break");
      if(!v) return null;
      const bt=JSON.parse(v);
      const now=Date.now();
      const secsLeft=Math.ceil((bt.endsAt-now)/1000);
      if(secsLeft<=0) return null;
      return {...bt,secsLeft,warned:now>=bt.warnAt,ended:false};
    }catch{return null;}
  });

  // ── Break timer tick ──
  useEffect(()=>{
    if(!breakTimer)return;
    const tick=setInterval(()=>{
      const now=Date.now();
      setBreakTimer(bt=>{
        if(!bt)return null;
        const secsLeft=Math.ceil((bt.endsAt-now)/1000);
        if(!bt.warned && now>=bt.warnAt){
          startAlarmLoop("warn");
          return {...bt,warned:true};
        }
        if(!bt.ended && secsLeft<=0){
          startAlarmLoop("end");
          // Auto-close the break log entry and push fresh Ongoing
          const nowMs=Date.now();
          setSessionLog(prev=>{
            const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:nowMs,outcome:"Break Ended"}:e);
            const freshOngoing={id:nowMs+1,status:"Ongoing",note:"",startedAt:nowMs,endedAt:null,outcome:"",endNote:""};
            const next=[...closed,freshOngoing];
            storage.set("ch_session_log",JSON.stringify(next));
            return next;
          });
          storage.remove("ch_break");
          // Auto-hide the bar after 1.5s — alarm modal stays until user dismisses it
          setTimeout(()=>{
            setBreakTimer(null);
            const t=Date.now();
            setGlobalTimeIn(t);
            storage.set("ch_timein",String(t));
          },1500);
          return {...bt,ended:true,secsLeft:0};
        }
        return {...bt,secsLeft:Math.max(0,secsLeft)};
      });
    },500);
    return()=>clearInterval(tick);
  },[breakTimer]);

  const [breakPending,setBreakPending]=useState(null); // {label,mins} waiting confirm
  const [cancelBreakConfirm,setCancelBreakConfirm]=useState(false);
  const [cancelOpenHourConfirm,setCancelOpenHourConfirm]=useState(false);
  function startBreak(label,mins,fullDuration=false){
    const now=Date.now();
    // Sidebar break: subtract session elapsed so the countdown reflects remaining time
    // Form break (fullDuration=true): always use the full break duration
    const sessionElapsedMs=(!fullDuration&&globalTimeIn)?Math.max(0,now-globalTimeIn):0;
    const adjustedMs=Math.max(0,mins*60*1000-sessionElapsedMs);
    const endsAt=now+adjustedMs;
    const warnAt=Math.max(now+1000, endsAt-5*60*1000);
    const bt={label,mins,endsAt,warnAt,warned:false,ended:false,secsLeft:Math.floor(adjustedMs/1000)};
    setBreakTimer(bt);
    storage.set("ch_break",JSON.stringify(bt));
    // Rename the current open Ongoing → "Break" (keeps it open, no outcome yet)
    addSessionLog("Break",label,"renameOngoing");
  }
  const [openHourPending,setOpenHourPending]=useState(false);
  const [openHourActive,setOpenHourActive]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_openhour")==="1";
    return false;
  });
  function startOpenHour(){
    setOpenHourActive(true);
    storage.set("ch_openhour","1");
    // Rename last Ongoing -> Open Hour (keep open, no outcome)
    setSessionLog(prev=>{
      const renamed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,status:"Open Hour"}:e);
      storage.set("ch_session_log",JSON.stringify(renamed));
      return renamed;
    });
    setOpenHourPending(false);
  }
  function stopOpenHour(){
    const now=Date.now();
    setOpenHourActive(false);
    storage.remove("ch_openhour");
    // Close Open Hour entry, reset timer, add fresh Ongoing
    setSessionLog(prev=>{
      const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now,outcome:"Open Hour Ended"}:e);
      const fresh={id:now+1,status:"Ongoing",note:"",startedAt:now,endedAt:null,outcome:"",endNote:""};
      const next=[...closed,fresh];
      storage.set("ch_session_log",JSON.stringify(next));
      return next;
    });
    setGlobalTimeIn(now);
    storage.set("ch_timein",String(now));
  }
  function stopBreak(){
    // If the timer already auto-ended (bt.ended=true), the session log was already updated
    // by the tick — just clear the timer state without adding another Ongoing entry.
    setBreakTimer(bt=>{
      if(bt?.ended){
        // Already ended — session log already has fresh Ongoing from the tick, skip it
        return null;
      }
      // Manual end mid-break: close the Break entry and add fresh Ongoing
      const now=Date.now();
      setSessionLog(prev=>{
        const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now,outcome:"Break Ended"}:e);
        const freshOngoing={id:now+1,status:"Ongoing",note:"",startedAt:now,endedAt:null,outcome:"",endNote:""};
        const next=[...closed,freshOngoing];
        storage.set("ch_session_log",JSON.stringify(next));
        return next;
      });
      // Reset the session timer on manual end only
      setGlobalTimeIn(now);
      storage.set("ch_timein",String(now));
      return null;
    });
    stopAlarmLoop(); setActiveAlarm(null);
    storage.remove("ch_break");
    setCancelBreakConfirm(false);
  }

  return { breakPending, breakTimer, cancelBreakConfirm, cancelOpenHourConfirm, openHourActive, openHourPending, setBreakPending, setBreakTimer, setCancelBreakConfirm, setCancelOpenHourConfirm, setOpenHourActive, setOpenHourPending, startBreak, startOpenHour, stopBreak, stopOpenHour }
}
