import { useEffect, useState } from 'react'

export function useLiveTabs() {
  // {id,mode}
  // ── Chrome-style multi-case tab system ─────────────────────────────────────
  // activeLiveTabs: open form tabs (each has its own PostLiveForm instance) — persisted across minimise/refresh
  const [activeLiveTabs,setActiveLiveTabs]=useState(()=>{
    if(typeof window==="undefined") return [];
    try{ const v=localStorage.getItem("ch_live_tabs"); return v?JSON.parse(v):[]; }catch{ return []; }
  });
  const [showAddTabPicker,setShowAddTabPicker]=useState(false);
  const [showFnGen,setShowFnGen]=useState(false);
  const [activeFormTabId,setActiveFormTabId]=useState(()=>{
    if(typeof window==="undefined") return null;
    return localStorage.getItem("ch_live_tab_active")||null;
  });
  // Persist live tabs + active tab ID so they survive minimise/refresh
  useEffect(()=>{
    if(typeof window==="undefined") return;
    if(activeLiveTabs.length>0){
      localStorage.setItem("ch_live_tabs",JSON.stringify(activeLiveTabs));
    } else {
      localStorage.removeItem("ch_live_tabs");
    }
  },[activeLiveTabs]);
  useEffect(()=>{
    if(typeof window==="undefined") return;
    if(activeFormTabId) localStorage.setItem("ch_live_tab_active",activeFormTabId);
    else localStorage.removeItem("ch_live_tab_active");
  },[activeFormTabId]);

  return {
    activeFormTabId, activeLiveTabs, setActiveFormTabId, setActiveLiveTabs,
    showAddTabPicker, setShowAddTabPicker, showFnGen, setShowFnGen,
  }
}
