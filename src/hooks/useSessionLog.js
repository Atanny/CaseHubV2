import { useEffect, useRef, useState } from 'react'
import * as sessionService from '@/services/sessionService'
import { storage } from '@/services/storage'

export function useSessionLog({ sessionDbId, user }) {
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
      sessionService.postSessionAction({action:'save_log',session_id:sessionDbId,email:user.email,log_data:sessionLog}).catch(()=>{});
    },2000);
    return()=>{ if(saveLogTimer.current) clearTimeout(saveLogTimer.current); };
  },[sessionLog,sessionDbId]);

  // ── Restore session log from DB if active session exists on mount ──
  useEffect(()=>{
    const dbId=storage.get("ch_session_db_id");
    const localLog=storage.get("ch_session_log");
    if(!dbId) return;
    // If local log is empty but DB session exists, try to restore from DB
    const localParsed=localLog?JSON.parse(localLog):[];
    if(localParsed.length>0) return; // Local has data, use it
    sessionService.getSessionLog(dbId)
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
          storage.set("ch_session_log",JSON.stringify(updated));
          return updated;
        }
        // No open Ongoing found — open a new entry with this status
        const entry={id:now,status,note,startedAt:now,endedAt:null,outcome:"",endNote:""};
        const next=[...prev,entry];
        storage.set("ch_session_log",JSON.stringify(next));
        return next;
      }
      // Default: close last open entry, add new one
      const entry={id:now,status,note,startedAt:now,endedAt:null,outcome:"",endNote:""};
      const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now}:e);
      const next=[...closed,entry];
      storage.set("ch_session_log",JSON.stringify(next));
      return next;
    });
  };
  // Close the last open entry and stamp an outcome label (Case Saved / Draft Saved / Cancelled)
  const closeWithOutcome=(outcome,caseNum="")=>{
    const now=Date.now();
    setSessionLog(prev=>{
      const next=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now,outcome,caseNum:caseNum||e.caseNum||""}:e);
      storage.set("ch_session_log",JSON.stringify(next));
      return next;
    });
  };
  const closeSessionLog=(endNote="")=>{
    setSessionLog(prev=>{
      const next=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:Date.now(),endNote}:e);
      storage.set("ch_session_log",JSON.stringify(next));
      return next;
    });
  };
  const clearSessionLog=()=>{
    setSessionLog([]);
    storage.remove("ch_session_log");
  };

  return { addSessionLog, clearSessionLog, closeSessionLog, closeWithOutcome, sessionLog, setSessionLog }
}
