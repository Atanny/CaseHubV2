import { useState } from 'react'
import { storage } from '@/services/storage'

export function useShiftSettings() {
  const [ctLimit,setCtLimit]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_ct_limit"));return isNaN(v)?30:v;}
    return 30;
  });
  const saveCtLimit=(mins)=>{ const v=Math.max(1,Math.min(240,parseInt(mins)||30)); setCtLimit(v); storage.set("ch_ct_limit",v); };
  const [qaLimit,setQaLimit]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_qa_limit"));return isNaN(v)?10:v;}
    return 10;
  });
  const saveQaLimit=(mins)=>{ const v=Math.max(1,Math.min(240,parseInt(mins)||10)); setQaLimit(v); storage.set("ch_qa_limit",v); };
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
    storage.set("ch_shift_start",t);
  };
  const [shiftStartWarnMins,setShiftStartWarnMins]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_shift_start_warn"));return isNaN(v)?10:v;}
    return 10;
  });
  const saveShiftStartWarnMins=(m)=>{
    const v=Math.max(1,Math.min(60,parseInt(m)||10));
    setShiftStartWarnMins(v);
    storage.set("ch_shift_start_warn",v);
  };
  const [shiftEndTime,setShiftEndTime]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_shift_end")||"";
    return "";
  });
  const saveShiftEndTime=(t)=>{
    setShiftEndTime(t);
    storage.set("ch_shift_end",t);
  };
  const [shiftWarnMins,setShiftWarnMins]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_shift_warn"));return isNaN(v)?10:v;}
    return 10;
  });

  return { qaLimit, saveQaLimit, saveShiftEndTime, saveShiftStartTime, saveShiftStartWarnMins, saveTimerLimit, setShiftWarnMins, shiftEndTime, shiftStartTime, shiftStartWarnMins, shiftWarnMins, timerLimit }
}
