import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import Icon from '../components/icons/Icon';
import { cls, useDbStatus, copyToClipboard, fmtDT, fmtElapsed, checkGrammar } from '../lib/helpers';
import { resetSessionDir } from '../lib/idb';

const AppCtx = createContext(null);

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }) {
  const router = useRouter();

  const [authPage,setAuthPage]=useState("login");
  const [user,setUser]=useState(null);
  const [sessionChecked,setSessionChecked]=useState(false); // prevents flash of login screen
  const [page,setPage]=useState(()=>{
    if(typeof window!=="undefined"){
      const saved=localStorage.getItem("ch_page");
      if(saved&&["dashboard","postlive","history","announcements","links","profile","build","prelive","sessions","filenames","archives"].includes(saved)) return saved;
    }
    return "dashboard";
  });
  const sidebarDragRef=useRef(null);
  const sidebarElRef=useRef(null);
  const [pendingPage,setPendingPage]=useState(null);
  const [navConfirm,setNavConfirm]=useState(false);
  const dbStatus = useDbStatus();
  const [allCases,setAllCases]=useState([]);
  const [drafts,setDrafts]=useState([]);
  const [archivedDrafts,setArchivedDrafts]=useState([]);
  const [formActive,setFormActive]=useState(false);
  const [globalTimeIn,setGlobalTimeIn]=useState(()=>{
    if(typeof window!=="undefined"){const v=localStorage.getItem("ch_timein");return v?parseInt(v):null;}
    return null;
  });
  const [timedIn,setTimedIn]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_timed_in")==="1";
    return false;
  });
  // Safety sync — restore timedIn from localStorage in case state was lost
  useEffect(()=>{
    if(typeof window!=="undefined"&&localStorage.getItem("ch_timed_in")==="1") setTimedIn(true);
  },[]);
  const [sessionDbId,setSessionDbId]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_session_db_id")||null;
    return null;
  });
  const [sessionRefreshKey,setSessionRefreshKey]=useState(0);
  const doTimeIn=()=>{
    // Fresh session — clear any leftover dir handle so first download asks for path
    resetSessionDir();
    const now=Date.now();
    setTimedIn(true);
    setGlobalTimeIn(now);
    if(typeof window!=="undefined"){
      localStorage.setItem("ch_timed_in","1");
      localStorage.setItem("ch_timein",String(now));
    }
    // Time In entry: duration from page open → button click
    const timeInEntry={id:APP_LOAD_TIME,status:"Time In",note:"Session started",startedAt:APP_LOAD_TIME,endedAt:now,endNote:""};
    // Immediately follow with Ongoing entry
    const ongoingEntry={id:now+1,status:"Ongoing",note:"Waiting for amend type",startedAt:now,endedAt:null,endNote:""};
    setSessionLog(prev=>{
      const next=[...prev,timeInEntry,ongoingEntry];
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });
    // Write to DB
    fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'time_in',email:user?.email})
    }).then(r=>r.json()).then(d=>{
      if(d.id){setSessionDbId(d.id);if(typeof window!=="undefined")localStorage.setItem("ch_session_db_id",d.id);}
    }).catch(()=>{});
  };
  const doTimerReset=()=>{
    const now=Date.now();
    setGlobalTimeIn(now);
    if(typeof window!=="undefined") localStorage.setItem("ch_timein",String(now));
  };
  const doTimeOut=()=>{
    // Clear the saved folder handle — next session will ask for path on first download
    resetSessionDir();
    // Close the current open entry first, then add Time Out entry
    const now=Date.now();
    setSessionLog(prev=>{
      const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now,endNote:""}:e);
      const timeOutEntry={id:now+2,status:"Time Out",note:"Manual time-out",startedAt:now,endedAt:now,endNote:""};
      const finalLog=[...closed,timeOutEntry];
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(finalLog));

      // Write time_out to DB, then save all session_cases from the log, then clear local log
      const currentDbId=sessionDbId;
      if(currentDbId){
        fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'time_out',session_id:currentDbId,email:user?.email})
        }).then(()=>{
          // Save each case/form entry from the session log to DB
          const caseEntries=finalLog.filter(e=>e.status==="Site Comment"||e.status==="Inbound Email");
          return Promise.all(caseEntries.map(e=>
            fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({
                action:'log_case',
                session_id:currentDbId,
                email:user?.email,
                case_num:e.caseNum||null,
                case_type:e.status==="Site Comment"?"siteComment":"inbound",
                note:e.note||""
              })
            }).catch(()=>{})
          ));
        }).then(()=>{
          // Refresh session data but keep the user on Post-Live Amends
          setSessionRefreshKey(k=>k+1);
          setPage("postlive");
          if(typeof window!=="undefined") localStorage.setItem("ch_page","postlive");
        }).catch(()=>{
          setSessionRefreshKey(k=>k+1);
        });
      } else {
        // No DB session, still stay on Post-Live Amends
        setSessionRefreshKey(k=>k+1);
        setPage("postlive");
        if(typeof window!=="undefined") localStorage.setItem("ch_page","postlive");
      }

      // Clear local session log after saving
      setTimeout(()=>{
        setSessionLog([]);
        if(typeof window!=="undefined") localStorage.removeItem("ch_session_log");
      },400);

      return finalLog;
    });
    // Stop any active break/open hour when timing out
    setBreakTimer(null); stopAlarmLoop(); setActiveAlarm(null);
    if(typeof window!=="undefined") localStorage.removeItem("ch_break");
    setOpenHourActive(false);
    if(typeof window!=="undefined") localStorage.removeItem("ch_openhour");
    setTimedIn(false);
    setGlobalTimeIn(null);
    if(typeof window!=="undefined"){
      localStorage.removeItem("ch_timed_in");
      localStorage.removeItem("ch_timein");
    }
    setSessionDbId(null);
    if(typeof window!=="undefined") localStorage.removeItem("ch_session_db_id");
  };



  // ── Session Log ──
  const [sessionLog,setSessionLog]=useState(()=>{
    if(typeof window!=="undefined"){
      try{
        const raw=JSON.parse(localStorage.getItem("ch_session_log")||"[]");
        // Filter out malformed entries — valid entries must have id and startedAt (numbers)
        return raw.filter(e=>e&&typeof e==="object"&&typeof e.id==="number"&&typeof e.startedAt==="number"&&typeof e.status==="string");
      }catch{return [];}
    }
    return [];
  });

  // ── Persist session log to DB whenever it changes (debounced 2s) ──
  const saveLogTimer=useRef(null);
  useEffect(()=>{
    if(!sessionDbId||!user?.email||!sessionLog.length) return;
    if(saveLogTimer.current) clearTimeout(saveLogTimer.current);
    saveLogTimer.current=setTimeout(()=>{
      fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'save_log',session_id:sessionDbId,email:user.email,log_data:sessionLog})
      }).catch(()=>{});
    },2000);
    return()=>{ if(saveLogTimer.current) clearTimeout(saveLogTimer.current); };
  },[sessionLog,sessionDbId]);

  // ── Restore session log from DB if active session exists on mount ──
  useEffect(()=>{
    const dbId=typeof window!=="undefined"?localStorage.getItem("ch_session_db_id"):null;
    const localLog=typeof window!=="undefined"?localStorage.getItem("ch_session_log"):null;
    if(!dbId) return;
    // If local log is empty but DB session exists, try to restore from DB
    const localParsed=localLog?JSON.parse(localLog):[];
    if(localParsed.length>0) return; // Local has data, use it
    fetch(`/api/sessions?action=get_log&session_id=${dbId}`)
      .then(r=>r.json()).then(d=>{
      if(d.log&&d.log.length>0){
        const clean=d.log.filter(e=>e&&typeof e==="object"&&typeof e.id==="number"&&typeof e.startedAt==="number"&&typeof e.status==="string");
        setSessionLog(clean);
        localStorage.setItem("ch_session_log",JSON.stringify(clean));
      }
    }).catch(()=>{});
  },[]);
  // addSessionLog variants:
  //   addSessionLog("Site Comment","","renameOngoing")  — rename last open Ongoing to Site Comment, leave open
  //   addSessionLog("Break","15 min","renameOngoing")   — rename last open Ongoing to Break, leave open
  //   addSessionLog("Ongoing","")                       — close any open entry, add fresh Ongoing
  //   addSessionLog("Time Out","")                      — normal: close last open, add Time Out row
  //   closeWithOutcome("Case Saved"|"Draft Saved"|"Cancelled") — close last open entry, set outcome field
  const addSessionLog=(status,note="",endNote="")=>{
    const now=Date.now();
    setSessionLog(prev=>{
      if(endNote==="renameOngoing"){
        // Find last open Ongoing and rename it to the chosen type (Site Comment, Inbound, Break)
        // Keep the entry OPEN (endedAt stays null) — it becomes the live entry
        const lastOngoingIdx=prev.map(e=>e.status).lastIndexOf("Ongoing");
        if(lastOngoingIdx!==-1&&!prev[lastOngoingIdx].endedAt){
          const updated=prev.map((e,i)=>
            i===lastOngoingIdx ? {...e,status} : e
          );
          if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(updated));
          return updated;
        }
        // No open Ongoing found — open a new entry with this status
        const entry={id:now,status,note,startedAt:now,endedAt:null,outcome:"",endNote:""};
        const next=[...prev,entry];
        if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
        return next;
      }
      // Default: close last open entry, add new one
      const entry={id:now,status,note,startedAt:now,endedAt:null,outcome:"",endNote:""};
      const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now}:e);
      const next=[...closed,entry];
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });
  };
  // Close the last open entry and stamp an outcome label (Case Saved / Draft Saved / Cancelled)
  const closeWithOutcome=(outcome,caseNum="")=>{
    const now=Date.now();
    setSessionLog(prev=>{
      const next=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now,outcome,caseNum:caseNum||e.caseNum||""}:e);
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });
  };
  const closeSessionLog=(endNote="")=>{
    setSessionLog(prev=>{
      const next=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:Date.now(),endNote}:e);
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });
  };
  const clearSessionLog=()=>{
    setSessionLog([]);
    if(typeof window!=="undefined") localStorage.removeItem("ch_session_log");
  };
  // Persist formActive so pill shows even after page switch
  const [formInFields,setFormInFieldsRaw]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_form_in_fields")==="1";
    return false;
  });
  const setFormInFields=(v)=>{
    setFormInFieldsRaw(v);
    if(typeof window!=="undefined"){
      if(v) localStorage.setItem("ch_form_in_fields","1");
      else localStorage.removeItem("ch_form_in_fields");
    }
  };
  const [resumeFormTick,setResumeFormTick]=useState(0);
  const setFormActivePersist=(v)=>{
    setFormActive(v);
    if(typeof window!=="undefined"){
      if(v) localStorage.setItem("ch_form_active","1");
      else {
        localStorage.removeItem("ch_form_active");
        localStorage.removeItem("ch_active_form_mode");
        localStorage.removeItem("ch_active_form_use_draft");
        localStorage.removeItem("ch_form_in_fields");
        localStorage.removeItem("ch_minimised_form");
      }
    }
  };
  useEffect(()=>{
    if(typeof window!=="undefined"&&localStorage.getItem("ch_form_active")==="1"){
      const savedMode=localStorage.getItem("ch_active_form_mode");
      if(savedMode==="siteComment"||savedMode==="inbound") setFormActive(true);
      else localStorage.removeItem("ch_form_active");
    }
  },[]);
  const resumeInProgressForm=()=>{
    setFormActivePersist(true);
    setPage("postlive");
    setFormInFields(true);
    setResumeFormTick(t=>t+1);
    if(typeof window!=="undefined") localStorage.setItem("ch_page","postlive");
  };
  const [sidebarHoverOpen,setSidebarHoverOpen]=useState(false);
  const sidebarIsCollapsed=!sidebarHoverOpen;
  // Scroll sidebar back to top whenever it collapses so reopening always starts at the top
  useEffect(()=>{
    if(sidebarIsCollapsed&&sidebarElRef.current) sidebarElRef.current.scrollTop=0;
  },[sidebarIsCollapsed]);
  const [lightMode,setLightMode]=useState(()=>{
    if(typeof window!=="undefined"){return localStorage.getItem("ch_theme")==="light";}
    return false;
  });
  const [specialRequestors,setSpecialRequestors]=useState([]);
  const [ctLimit,setCtLimit]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_ct_limit"));return isNaN(v)?30:v;}
    return 30;
  });
  const saveCtLimit=(mins)=>{ const v=Math.max(1,Math.min(240,parseInt(mins)||30)); setCtLimit(v); if(typeof window!=="undefined") localStorage.setItem("ch_ct_limit",v); };
  const [qaLimit,setQaLimit]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_qa_limit"));return isNaN(v)?10:v;}
    return 10;
  });
  const saveQaLimit=(mins)=>{ const v=Math.max(1,Math.min(240,parseInt(mins)||10)); setQaLimit(v); if(typeof window!=="undefined") localStorage.setItem("ch_qa_limit",v); };
  // Legacy alias so nothing else breaks
  const timerLimit=ctLimit;
  const saveTimerLimit=saveCtLimit;
  // ── Shift End Alarm: shiftEndTime = "HH:MM" (24h), shiftWarnMins = minutes before end to alarm ──
  const [shiftStartTime,setShiftStartTime]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_shift_start")||"";
    return "";
  });
  const saveShiftStartTime=(t)=>{
    setShiftStartTime(t);
    if(typeof window!=="undefined") localStorage.setItem("ch_shift_start",t);
  };
  const [shiftStartWarnMins,setShiftStartWarnMins]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_shift_start_warn"));return isNaN(v)?10:v;}
    return 10;
  });
  const saveShiftStartWarnMins=(m)=>{
    const v=Math.max(1,Math.min(60,parseInt(m)||10));
    setShiftStartWarnMins(v);
    if(typeof window!=="undefined") localStorage.setItem("ch_shift_start_warn",v);
  };
  const [shiftEndTime,setShiftEndTime]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_shift_end")||"";
    return "";
  });
  const saveShiftEndTime=(t)=>{
    setShiftEndTime(t);
    if(typeof window!=="undefined") localStorage.setItem("ch_shift_end",t);
  };
  const [shiftWarnMins,setShiftWarnMins]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_shift_warn"));return isNaN(v)?10:v;}
    return 10;
  });
  const saveShiftWarnMins=(m)=>{
    const v=Math.max(1,Math.min(60,parseInt(m)||10));
    setShiftWarnMins(v);
    if(typeof window!=="undefined") localStorage.setItem("ch_shift_warn",v);
  };

  const [announcements,setAnnouncements]=useState([]); // always loaded from DB
  const [links,setLinks]=useState([]);
  const [dataLoading,setDataLoading]=useState(false);
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
  }); // {label,mins,endsAt,warnAt,warned,ended,secsLeft}
  // timerLimit (mins) is the single source of truth — also aliased as alarmMins for legacy compat
  const alarmMins = timerLimit;
  const saveAlarmMins = saveTimerLimit;


  // ── Shift-start alarm: fires shiftStartWarnMins before shift start ──
  useEffect(()=>{
    if(!shiftStartTime) return;
    const schedule=()=>{
      const now=new Date();
      const [hh,mm]=shiftStartTime.split(":").map(Number);
      const start=new Date(now);start.setHours(hh,mm,0,0);
      if(start<=now) start.setDate(start.getDate()+1);
      const alarmAt=new Date(start.getTime()-shiftStartWarnMins*60*1000);
      const delay=alarmAt-now;
      if(delay<=0){ startAlarmLoop("shift_start"); return null; }
      return setTimeout(()=>startAlarmLoop("shift_start"),delay);
    };
    const t=schedule();
    return()=>{ if(t) clearTimeout(t); };
  },[shiftStartTime,shiftStartWarnMins]);

  // ── Shift-end alarm: fires shiftWarnMins before the configured shift end time ──
  useEffect(()=>{
    if(!shiftEndTime) return;
    const schedule=()=>{
      const now=new Date();
      const [hh,mm]=shiftEndTime.split(":").map(Number);
      const end=new Date(now);
      end.setHours(hh,mm,0,0);
      // If end time already passed today, schedule for tomorrow
      if(end<=now) end.setDate(end.getDate()+1);
      const alarmAt=new Date(end.getTime()-shiftWarnMins*60*1000);
      const delay=alarmAt-now;
      if(delay<=0){ startAlarmLoop("shift_end"); return null; }
      return setTimeout(()=>startAlarmLoop("shift_end"),delay);
    };
    const t=schedule();
    return()=>{ if(t) clearTimeout(t); };
  },[shiftEndTime,shiftWarnMins]);

  useEffect(()=>{document.body.classList.toggle("light",lightMode);if(typeof window!=="undefined") localStorage.setItem("ch_theme",lightMode?"light":"dark");},[lightMode]);
  useEffect(()=>{ const h=e=>{const d=document.getElementById("fngen-dropdown");if(d&&!d.closest(".fngen-wrap")?.contains(e.target)) d.classList.remove("open");}; document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h); },[]);

  // ── Alarm state: null | "warn" | "end" | "case" ──
  const [activeAlarm,setActiveAlarm]=useState(null);
  const alarmLoopRef=useRef(null);
  const alarmCtxRef=useRef(null);

  // ── Web Audio looping alarm ──
  function startAlarmLoop(type){
    stopAlarmLoop();
    const loop=()=>{
      try{
        const ctx=new (window.AudioContext||window.webkitAudioContext)();
        alarmCtxRef.current=ctx;
        const isWarn=type==="warn"||type==="shift_start"||type==="shift_end";
        const isCase=type==="case";
        // Gentle chime: two-tone sine wave, soft attack/release, low gain
        const notes=isCase?[523,659,784]:[523,659]; // C5-E5-G5 for case, C5-E5 for warn
        const gap=0.55;
        const gain=0.18; // quiet — not jarring
        const totalDur=notes.length*gap+0.8;
        notes.forEach((freq,i)=>{
          const o=ctx.createOscillator();
          const g=ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value=freq;
          o.type="sine";
          const t=ctx.currentTime+i*gap;
          g.gain.setValueAtTime(0,t);
          g.gain.linearRampToValueAtTime(gain,t+0.06);
          g.gain.setValueAtTime(gain,t+0.35);
          g.gain.linearRampToValueAtTime(0,t+0.55);
          o.start(t); o.stop(t+0.6);
        });
        // schedule next loop
        alarmLoopRef.current=setTimeout(()=>{ ctx.close(); loop(); },totalDur*1000);
      }catch(e){console.warn("Audio error",e);}
    };
    loop();
    setActiveAlarm(type);
  }

  function stopAlarmLoop(){
    if(alarmLoopRef.current){clearTimeout(alarmLoopRef.current);alarmLoopRef.current=null;}
    try{alarmCtxRef.current?.close();}catch(e){}
    alarmCtxRef.current=null;
  }

  function dismissAlarm(){ stopAlarmLoop(); setActiveAlarm(null); }
  function snoozeAlarm(){
    stopAlarmLoop(); setActiveAlarm(null);
    // re-trigger in 5 minutes
    setTimeout(()=>startAlarmLoop("end"),5*60*1000);
  }

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
            if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
            return next;
          });
          if(typeof window!=="undefined") localStorage.removeItem("ch_break");
          // Auto-hide the bar after 1.5s — alarm modal stays until user dismisses it
          setTimeout(()=>{
            setBreakTimer(null);
            const t=Date.now();
            setGlobalTimeIn(t);
            if(typeof window!=="undefined") localStorage.setItem("ch_timein",String(t));
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
    if(typeof window!=="undefined") localStorage.setItem("ch_break",JSON.stringify(bt));
    // Rename the current open Ongoing → "Break" (keeps it open, no outcome yet)
    addSessionLog("Break",label,"renameOngoing");
  }
  const [openHourPending,setOpenHourPending]=useState(false);
  const [openHourActive,setOpenHourActive]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_openhour")==="1";
    return false;
  });
  function startOpenHour(){
    const now=Date.now();
    setOpenHourActive(true);
    if(typeof window!=="undefined") localStorage.setItem("ch_openhour","1");
    // Rename last Ongoing -> Open Hour (keep open, no outcome)
    setSessionLog(prev=>{
      const renamed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,status:"Open Hour"}:e);
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(renamed));
      return renamed;
    });
    setOpenHourPending(false);
  }
  function stopOpenHour(){
    const now=Date.now();
    setOpenHourActive(false);
    if(typeof window!=="undefined") localStorage.removeItem("ch_openhour");
    // Close Open Hour entry, reset timer, add fresh Ongoing
    setSessionLog(prev=>{
      const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now,outcome:"Open Hour Ended"}:e);
      const fresh={id:now+1,status:"Ongoing",note:"",startedAt:now,endedAt:null,outcome:"",endNote:""};
      const next=[...closed,fresh];
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });
    setGlobalTimeIn(now);
    if(typeof window!=="undefined") localStorage.setItem("ch_timein",String(now));
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
        if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
        return next;
      });
      // Reset the session timer on manual end only
      setGlobalTimeIn(now);
      if(typeof window!=="undefined") localStorage.setItem("ch_timein",String(now));
      return null;
    });
    stopAlarmLoop(); setActiveAlarm(null);
    if(typeof window!=="undefined") localStorage.removeItem("ch_break");
    setCancelBreakConfirm(false);
  }

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
          <button id="ch-dom-alarm-dismiss" class="alarm-dismiss">✅ I'm Aware</button>
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

  // ── On mount: restore session from localStorage ──
  useEffect(()=>{
    const tryRestore=async()=>{
      const stored=localStorage.getItem("ch_user");
      const refresh=localStorage.getItem("ch_refresh");
      if(!stored||!refresh){setSessionChecked(true);return;}
      try{
        const res=await fetch("/api/auth/refresh",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refresh_token:refresh})});
        if(res.ok){
          const data=await res.json();
          localStorage.setItem("ch_token",data.access_token);
          localStorage.setItem("ch_refresh",data.refresh_token);
          localStorage.setItem("ch_user",JSON.stringify(data.user));
          setUser(data.user);
        }else{
          // Session expired or invalid — clear and show login
          const errData=await res.json().catch(()=>({}));
          console.warn("Session refresh failed:",errData.error||res.status);
          localStorage.removeItem("ch_token");
          localStorage.removeItem("ch_refresh");
          localStorage.removeItem("ch_user");
        }
      }catch(e){
        // Network error — try using cached user anyway
        try{setUser(JSON.parse(stored));}catch(_){}
      }
      setSessionChecked(true);
    };
    tryRestore();
  },[]);

  // ── Load all data when user is set ──
  useEffect(()=>{
    if(!user)return;
    setDataLoading(true);
    Promise.all([
      fetch(`/api/cases?email=${encodeURIComponent(user.email)}`).then(r=>r.json()).catch(()=>[]),
      fetch("/api/announcements").then(r=>r.json()).catch(()=>[]),
      fetch(`/api/links?email=${encodeURIComponent(user.email)}`).then(r=>r.json()).catch(()=>[]),
      fetch("/api/requestors").then(r=>r.json()).catch(()=>[]),
      fetch(`/api/drafts?email=${encodeURIComponent(user.email)}`).then(r=>r.json()).catch(()=>[]),
      fetch(`/api/profile?email=${encodeURIComponent(user.email)}`).then(r=>r.json()).catch(()=>({})),
      fetch(`/api/archived-drafts?email=${encodeURIComponent(user.email)}`).then(r=>r.json()).catch(()=>[]),
    ]).then(([cases,anns,lnks,reqs,draftList,profile,archivedList])=>{
      const mergeWithCache=(rawCases)=>{
        if(!Array.isArray(rawCases)) return [];
        try{
          const raw=typeof window!=="undefined"?localStorage.getItem("ch_case_extra_cache"):null;
          if(!raw) return rawCases;
          const cache=JSON.parse(raw);
          return rawCases.map(c=>{
            const cached=c.caseNum?cache[c.caseNum]:null;
            if(!cached) return c;
            return{...c,customerName:c.customerName||cached.customerName||"",customerEmail:c.customerEmail||cached.customerEmail||"",businessName:c.businessName||cached.businessName||"",businessSuffix:c.businessSuffix||cached.businessSuffix||"",inboundNum:c.inboundNum||cached.inboundNum||"",inProgress:c.inProgress??cached.inProgress??false,entries:(c.entries&&c.entries.length>0)?c.entries:(cached.entries||c.entries||[]),checklist:c.checklist||cached.checklist||{},devices:c.devices||cached.devices||{},trackerChecklistLink:c.trackerChecklistLink||cached.trackerChecklistLink||"",emailAddress:c.emailAddress||cached.emailAddress||"",emailType:c.emailType||cached.emailType||""};
          });
        }catch(e){return rawCases;}
      };
      setAllCases(mergeWithCache(Array.isArray(cases)?[...cases].reverse():[]));
      setAnnouncements(Array.isArray(anns)?anns:[]);
      setLinks(Array.isArray(lnks)?lnks:[]);
      setSpecialRequestors(Array.isArray(reqs)?reqs:[]);
      setDrafts(Array.isArray(draftList)?draftList:[]);
      setArchivedDrafts(Array.isArray(archivedList)?archivedList:[]);
      // Merge profile data into user object so filenames/avatar are always current
      if(profile && profile.email){
        const merged={...user,
          name:       profile.name         || user.name,
          role:       profile.role         || user.role||"",
          avatarUrl:  profile.avatar_url   || user.avatarUrl||"",
          beforeName: profile.before_name  || user.beforeName||"",
          afterName:  profile.after_name   || user.afterName||"",
          screenshotName: profile.screenshot_name || user.screenshotName||"",
          greetingMessages: (profile.greeting_messages&&profile.greeting_messages.length>0) ? profile.greeting_messages : (user.greetingMessages||[]),
        };
        localStorage.setItem("ch_user",JSON.stringify(merged));
        setUser(merged);
      }
    }).catch(console.error).finally(()=>setDataLoading(false));
  },[user?.email]);

  // ── Cases ──
  const addCase=async(c)=>{
    try{
      // Upload any RAM (blob) images to Supabase Storage before saving the case
      const uploadPending=async(imgs)=>{
        return Promise.all((imgs||[]).map(async(img)=>{
          if(img._inDB||!img._file)return{url:img.url,name:img.name,id:img.id||img.path,path:img.path||img.id};
          const uploaded=await uploadImageToStorage(img._file,img.name);
          return uploaded?{url:uploaded.url,name:uploaded.name,id:uploaded.path,path:uploaded.path}:{url:img.url,name:img.name,id:img.id,path:img.id};
        }));
      };
      const [uploadedImages,uploadedBackup]=await Promise.all([uploadPending(c.images),uploadPending(c.backupImages)]);
      const payload={
        ...c,
        userEmail:user.email,
        images:uploadedImages,
        backupImages:uploadedBackup,
        entries:(c.entries||[]).map(({_file,...rest})=>rest),
        trackerChecklistLink:c.trackerChecklistLink||"",
      };
      const res=await fetch("/api/cases",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const saved=await res.json();
      if(!res.ok){console.error("addCase API error:",saved.error);return;}
      const merged={...payload,...saved,
        customerName:   saved.customerName   || payload.customerName   || "",
        customerEmail:  saved.customerEmail  || payload.customerEmail  || "",
        businessName:   saved.businessName   || payload.businessName   || "",
        businessSuffix: saved.businessSuffix || payload.businessSuffix || "",
        inboundNum:     saved.inboundNum     || payload.inboundNum     || "",
        inProgress:     saved.inProgress     ?? payload.inProgress     ?? false,
        entries:        (saved.entries&&saved.entries.length>0)?saved.entries:(payload.entries||[]),
        checklist:      saved.checklist      || payload.checklist      || {},
        devices:        saved.devices        || payload.devices        || {},
        trackerChecklistLink:saved.trackerChecklistLink||payload.trackerChecklistLink||"",
        emailAddress:   saved.emailAddress   || payload.emailAddress   || "",
        emailType:      saved.emailType      || payload.emailType      || "",
        images:         (saved.images&&saved.images.length>0)?saved.images:(payload.images||[]),
        backupImages:   (saved.backupImages&&saved.backupImages.length>0)?saved.backupImages:(payload.backupImages||[]),
      };
      try{
        const cacheKey="ch_case_extra_cache";
        const raw=typeof window!=="undefined"?localStorage.getItem(cacheKey):null;
        const cache=raw?JSON.parse(raw):{};
        if(merged.caseNum){
          cache[merged.caseNum]={customerName:merged.customerName,customerEmail:merged.customerEmail,businessName:merged.businessName,businessSuffix:merged.businessSuffix,inboundNum:merged.inboundNum,inProgress:merged.inProgress,entries:merged.entries,checklist:merged.checklist,devices:merged.devices,trackerChecklistLink:merged.trackerChecklistLink,emailAddress:merged.emailAddress,emailType:merged.emailType};
          if(typeof window!=="undefined") localStorage.setItem(cacheKey,JSON.stringify(cache));
        }
      }catch(e){}
      setAllCases(a=>[merged,...a]);
      dbStatus.markSaved();
    }catch(e){
      console.error("addCase exception:",e);
    }
  };
  const updateCase=async(id,updated)=>{
    try{
      // EditableCaseCard already uploads immediately, but strip any residual _file refs
      const cleanImgs=(imgs)=>(imgs||[]).map(({_file,url,name,id,path,_inDB})=>({url,name,id,path:path||id,_inDB:_inDB||false}));
      const payload={
        ...updated,
        userEmail:user.email,
        images:cleanImgs(updated.images),
        backupImages:cleanImgs(updated.backupImages),
        entries:(updated.entries||[]).map(({_file,...rest})=>rest),
        trackerChecklistLink:updated.trackerChecklistLink||"",
      };
      const res=await fetch(`/api/cases/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const saved=await res.json();
      if(!res.ok){console.error("updateCase error:",saved.error);return;}
      const merged={...payload,...saved,
        customerName:   saved.customerName   || payload.customerName   || "",
        customerEmail:  saved.customerEmail  || payload.customerEmail  || "",
        businessName:   saved.businessName   || payload.businessName   || "",
        businessSuffix: saved.businessSuffix || payload.businessSuffix || "",
        inboundNum:     saved.inboundNum     || payload.inboundNum     || "",
        inProgress:     saved.inProgress     ?? payload.inProgress     ?? false,
        entries:        (saved.entries&&saved.entries.length>0)?saved.entries:(payload.entries||[]),
        checklist:      saved.checklist      || payload.checklist      || {},
        devices:        saved.devices        || payload.devices        || {},
        trackerChecklistLink:saved.trackerChecklistLink||payload.trackerChecklistLink||"",
        emailAddress:   saved.emailAddress   || payload.emailAddress   || "",
        emailType:      saved.emailType      || payload.emailType      || "",
        images:         (saved.images&&saved.images.length>0)?saved.images:(payload.images||[]),
        backupImages:   (saved.backupImages&&saved.backupImages.length>0)?saved.backupImages:(payload.backupImages||[]),
      };
      try{
        const cacheKey="ch_case_extra_cache";
        const raw=typeof window!=="undefined"?localStorage.getItem(cacheKey):null;
        const cache=raw?JSON.parse(raw):{};
        if(merged.caseNum){
          cache[merged.caseNum]={customerName:merged.customerName,customerEmail:merged.customerEmail,businessName:merged.businessName,businessSuffix:merged.businessSuffix,inboundNum:merged.inboundNum,inProgress:merged.inProgress,entries:merged.entries,checklist:merged.checklist,devices:merged.devices,trackerChecklistLink:merged.trackerChecklistLink,emailAddress:merged.emailAddress,emailType:merged.emailType};
          if(typeof window!=="undefined") localStorage.setItem(cacheKey,JSON.stringify(cache));
        }
      }catch(e){}
      setAllCases(a=>a.map(c=>c._id===id?merged:c));
      dbStatus.markSaved();
    }catch(e){console.error("updateCase exception:",e);}
  };
  const deleteCase=async(id)=>{
    try{await fetch(`/api/cases/${id}`,{method:"DELETE"});}catch(e){console.error(e);}
    setAllCases(a=>a.filter(c=>c._id!==id));
  };

  // ── Drafts ──
  const saveDraft=async(mode,draftData)=>{
    const clean=(imgs)=>(imgs||[]).map(({file,url,name,id,path,type})=>({url,name,id,path:path||id||name,type}));
    const cleanData={...draftData,images:clean(draftData.images||[]),backupImages:clean(draftData.backupImages||[])};
    const res=await fetch("/api/drafts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userEmail:user.email,mode,draftData:cleanData})});
    const saved=await res.json();
    if(!res.ok) throw new Error(saved.error||"Failed to Suspend Case");
    setDrafts(ds=>[...ds.filter(d=>d._mode!==mode),saved]);
  };
  const updateDraft=async(id,updatedData)=>{
    try{
      const res=await fetch(`/api/drafts/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({draftData:updatedData})});
      if(!res.ok) return;
      setDrafts(ds=>ds.map(d=>d._id===id?{...d,...updatedData}:d));
    }catch(e){console.error("updateDraft error:",e);}
  };
  const deleteDraft=async(id,mode,skipDeleteLog=false)=>{
    // Used only when completing/saving a suspended case (skipDeleteLog=true).
    // Direct user-triggered removal now goes through archiveDraft instead.
    const draft=drafts.find(d=>d._id===id||d._mode===mode);
    const deletedCaseNum=draft?.caseNum||"";
    try{await fetch(`/api/drafts/${id}`,{method:"DELETE"});}catch(e){console.error(e);}
    setDrafts(ds=>ds.filter(d=>d._id!==id&&d._mode!==mode));
    if(deletedCaseNum&&!skipDeleteLog){
      setSessionLog(prev=>{
        const updated=prev.map(e=>{
          if((e.caseNum||"")===(deletedCaseNum||"")&&e.outcome==="Suspended"){
            return {...e,outcome:"Deleted"};
          }
          return e;
        });
        if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(updated));
        return updated;
      });
    }
  };

  const archiveDraft=async(id,mode)=>{
    const draft=drafts.find(d=>d._id===id||d._mode===mode);
    if(!draft) return;
    const archivedCaseNum=draft.caseNum||"";
    try{
      // 1. Copy to archived_drafts
      const res=await fetch("/api/archived-drafts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        userEmail:user.email,
        mode,
        draftData:{...draft,_id:undefined,draftAt:undefined},
        savedAt:draft.draftAt||null,
      })});
      const saved=await res.json();
      if(!res.ok) throw new Error(saved.error||"Failed to archive");
      setArchivedDrafts(a=>[saved,...a]);
      // 2. Remove from drafts
      await fetch(`/api/drafts/${id}`,{method:"DELETE"});
      setDrafts(ds=>ds.filter(d=>d._id!==id&&d._mode!==mode));
      // 3. Mark session log entry as Archived
      if(archivedCaseNum){
        setSessionLog(prev=>{
          const updated=prev.map(e=>{
            if((e.caseNum||"")===(archivedCaseNum||"")&&e.outcome==="Suspended"){
              return {...e,outcome:"Archived"};
            }
            return e;
          });
          if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(updated));
          return updated;
        });
      }
    }catch(e){
      console.error("[archiveDraft]",e);
    }
  };

  // ── Announcements ──
  const addAnnouncement=async(a)=>{
    const res=await fetch("/api/announcements",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)});
    const saved=await res.json();
    if(!res.ok)throw new Error(saved.error||"Failed to save announcement");
    setAnnouncements(p=>[saved,...p]);
  };
  const updateAnnouncement=async(id,updates)=>{
    const res=await fetch(`/api/announcements/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(updates)});
    const saved=await res.json();
    if(!res.ok)throw new Error(saved.error||"Failed to update announcement");
    setAnnouncements(a=>a.map(x=>x.id===id?saved:x));
  };
  const removeAnnouncement=async(id)=>{
    const res=await fetch(`/api/announcements/${id}`,{method:"DELETE"});
    if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error(d.error||"Failed to delete");}
    setAnnouncements(a=>a.filter(x=>x.id!==id));
  };

  // ── Links ──
  const addLink=async(l)=>{
    try{
      const res=await fetch("/api/links",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...l,userEmail:user.email})});
      const saved=await res.json();
      setLinks(p=>[...p,saved]);
    }catch(e){console.error(e);setLinks(p=>[...p,{...l,id:Date.now()}]);}
  };
  const updateLink=async(id,updates)=>{
    try{
      const res=await fetch(`/api/links/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(updates)});
      const saved=await res.json();
      if(res.ok) setLinks(l=>l.map(x=>x.id===id?saved:x));
    }catch(e){console.error(e);}
  };
  const removeLink=async(id)=>{
    try{await fetch(`/api/links/${id}`,{method:"DELETE"});}catch(e){console.error(e);}
    setLinks(l=>l.filter(x=>x.id!==id));
  };

  // ── Requestors ──
  const addRequestor=async(name)=>{
    try{await fetch("/api/requestors",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});}catch(e){console.error(e);}
    setSpecialRequestors(s=>[...s,name]);
  };
  const removeRequestor=async(name)=>{
    try{await fetch(`/api/requestors/${encodeURIComponent(name)}`,{method:"DELETE"});}catch(e){console.error(e);}
    setSpecialRequestors(s=>s.filter(x=>x!==name));
  };

 const PAGE_TO_ROUTE = {
   dashboard:'/dashboard', postlive:'/post-live', history:'/case-history',
   sessions:'/session-log', archives:'/archived-cases', announcements:'/announcements',
   links:'/quick-links', filenames:'/file-name-generator', profile:'/profile',
   build:'/dashboard', prelive:'/dashboard',
 };
 const handleNav = (id) => {
  // 🚫 Only block build/prelive when a form is active on postlive
  // postlive itself must always be navigatable so users can return to their in-progress form
  const restricted = ["build", "prelive"].includes(id);

  if (restricted && formActive && page !== id) {
    return;
  }

  if (id === "postlive") {
    // If a form is active, restore the full form layout (form-mode class)
    // so the user sees their in-progress form, not the chooser.
    if (formActive) {
      setFormInFields(true);
    } else {
      setFormInFields(false);
    }
    setPage("postlive");
    if (typeof window !== "undefined") localStorage.setItem("ch_page", "postlive");
    router.push(PAGE_TO_ROUTE.postlive);
    return;
  }

  if (id === page) return;

  // ✅ allow ALL other pages (dashboard, history, etc.)
  // If a form is active, mark that the user is no longer viewing form fields
  // so the floating "Form In Progress" pill becomes visible on other pages.
  if (formActive) setFormInFields(false);
  setPage(id);
  if (typeof window !== "undefined") localStorage.setItem("ch_page", id);
  if (PAGE_TO_ROUTE[id]) router.push(PAGE_TO_ROUTE[id]);
};

  const logout=()=>{
    // If session is active, time out first
    if(timedIn) doTimeOut();
    localStorage.removeItem("ch_token");
    localStorage.removeItem("ch_refresh");
    localStorage.removeItem("ch_user");
    localStorage.removeItem("ch_form_active");
    localStorage.removeItem("ch_active_form_mode");
    localStorage.removeItem("ch_active_form_use_draft");
    localStorage.removeItem("ch_page");
    localStorage.removeItem("ch_timed_in");
    localStorage.removeItem("ch_timein");
    localStorage.removeItem("ch_break");
    localStorage.removeItem("ch_session_db_id");
    setUser(null);setAuthPage("login");setPage("dashboard");
    setAllCases([]);setDrafts([]);setArchivedDrafts([]);setLinks([]);setAnnouncements([]);setSpecialRequestors([]);
  };const coreNav=[
    {group:"Work"},
    {id:"dashboard",label:"Dashboard",icon:"dashboard"},
    {id:"postlive",label:"Post-Live Amends",icon:"postlive"},
    {id:"history",label:"Case History",icon:"history"},
    {id:"sessions",label:"Session Logs",icon:"history"},
    {id:"archives",label:"Archived Cases",icon:"archive"},
    {group:"Tools"},
    {id:"announcements",label:"Updates & Announcement",icon:"announce"},
    {id:"links",label:"Quick Links",icon:"links"},
    {id:"filenames",label:"File Name Generator",icon:"draft"},
    {id:"profile",label:"Profile & Settings",icon:"user"},
  ];

  const initials=((user&&user.name)||(user&&user.email)||"U").split(" ").map(w=>w&&w[0]).filter(Boolean).join("").slice(0,2).toUpperCase();
  // ── Keep internal `page` state in sync with the actual URL route ──
  useEffect(() => {
    const routeToPage = {
      '/dashboard':'dashboard', '/post-live':'postlive', '/case-history':'history',
      '/session-log':'sessions', '/archived-cases':'archives', '/announcements':'announcements',
      '/quick-links':'links', '/file-name-generator':'filenames', '/profile':'profile',
    };
    const p = routeToPage[router.pathname];
    if (p && p !== page) setPage(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  const value = {
    authPage,
    setAuthPage,
    user,
    setUser,
    sessionChecked,
    setSessionChecked,
    page,
    setPage,
    sidebarDragRef,
    sidebarElRef,
    pendingPage,
    setPendingPage,
    navConfirm,
    setNavConfirm,
    dbStatus,
    allCases,
    setAllCases,
    drafts,
    setDrafts,
    archivedDrafts,
    setArchivedDrafts,
    formActive,
    setFormActive,
    globalTimeIn,
    setGlobalTimeIn,
    timedIn,
    setTimedIn,
    sessionDbId,
    setSessionDbId,
    sessionRefreshKey,
    setSessionRefreshKey,
    doTimeIn,
    doTimerReset,
    doTimeOut,
    sessionLog,
    setSessionLog,
    saveLogTimer,
    addSessionLog,
    closeWithOutcome,
    closeSessionLog,
    clearSessionLog,
    formInFields,
    setFormInFieldsRaw,
    setFormInFields,
    resumeFormTick,
    setResumeFormTick,
    setFormActivePersist,
    resumeInProgressForm,
    sidebarHoverOpen,
    setSidebarHoverOpen,
    sidebarIsCollapsed,
    lightMode,
    setLightMode,
    specialRequestors,
    setSpecialRequestors,
    ctLimit,
    setCtLimit,
    saveCtLimit,
    qaLimit,
    setQaLimit,
    saveQaLimit,
    timerLimit,
    saveTimerLimit,
    shiftStartTime,
    setShiftStartTime,
    saveShiftStartTime,
    shiftStartWarnMins,
    setShiftStartWarnMins,
    saveShiftStartWarnMins,
    shiftEndTime,
    setShiftEndTime,
    saveShiftEndTime,
    shiftWarnMins,
    setShiftWarnMins,
    saveShiftWarnMins,
    announcements,
    setAnnouncements,
    links,
    setLinks,
    dataLoading,
    setDataLoading,
    breakTimer,
    setBreakTimer,
    alarmMins,
    saveAlarmMins,
    activeAlarm,
    setActiveAlarm,
    alarmLoopRef,
    alarmCtxRef,
    startAlarmLoop,
    stopAlarmLoop,
    dismissAlarm,
    snoozeAlarm,
    breakPending,
    setBreakPending,
    cancelBreakConfirm,
    setCancelBreakConfirm,
    cancelOpenHourConfirm,
    setCancelOpenHourConfirm,
    startBreak,
    openHourPending,
    setOpenHourPending,
    openHourActive,
    setOpenHourActive,
    startOpenHour,
    stopOpenHour,
    stopBreak,
    playEndAlarm,
    globalCtFiredRef,
    globalQaFiredRef,
    alarmMinsRef,
    qaLimitRef,
    startAlarmLoopRef,
    showDomAlarm,
    addCase,
    updateCase,
    deleteCase,
    saveDraft,
    updateDraft,
    deleteDraft,
    archiveDraft,
    addAnnouncement,
    updateAnnouncement,
    removeAnnouncement,
    addLink,
    updateLink,
    removeLink,
    addRequestor,
    removeRequestor,
    handleNav,
    logout,
    coreNav,
    initials
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
