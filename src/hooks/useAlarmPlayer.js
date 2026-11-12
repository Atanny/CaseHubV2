import { useRef, useState } from 'react'

export function useAlarmPlayer() {
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

  return { activeAlarm, dismissAlarm, setActiveAlarm, snoozeAlarm, startAlarmLoop, stopAlarmLoop }
}
