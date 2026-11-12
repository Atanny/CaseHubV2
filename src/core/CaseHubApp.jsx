import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { APP_LOAD_TIME } from './appLoadTime'
import { Icon } from '@/components/ui/Icon'
import { useDbStatus } from '@/hooks/useDbStatus'
import { resetSessionDir } from '@/services/downloadDirectory'
import { cls } from '@/utils/classNames'
import { LoginPage } from '@/views/Auth/LoginPage'
import { SignupPage } from '@/views/Auth/SignupPage'
import { DashboardPage } from '@/views/Dashboard/DashboardPage'
import { FileNameGeneratorPage } from '@/views/FileNameGenerator/FileNameGeneratorPage'
import { PostLivePage } from '@/views/PostLive/PostLivePage'
import * as authService from '@/services/authService'
import * as draftService from '@/services/draftService'
import * as sessionService from '@/services/sessionService'
import { storage } from '@/services/storage'
import { useCaseHubData } from '@/hooks/useCaseHubData'
import { useAlarmSignals } from '@/hooks/useAlarmSignals'
import { useBreakTimer } from '@/hooks/useBreakTimer'
import { useAlarmPlayer } from '@/hooks/useAlarmPlayer'
import { useShiftSettings } from '@/hooks/useShiftSettings'
import { useSessionLog } from '@/hooks/useSessionLog'
import { AlarmOverlay } from '@/components/ui/AlarmOverlay'
import { BreakBanner, MeetingBanner } from '@/components/layout/SessionBanners'
import { NAV_ITEMS, isValidPage } from '@/config/routes'
import { CaseHistoryPage, AnnouncementsPage, LinksPage, ProfilePage, SessionLogPage, ArchivePage } from './lazyViews'
import { ShellContext } from './ShellContext'
import { Sidebar } from '@/components/navigation/Sidebar'

export function CaseHubApp() {
  const [authPage,setAuthPage]=useState("login");
  const [user,setUser]=useState(null);
  const [sessionChecked,setSessionChecked]=useState(false); // prevents flash of login screen
  const [page,setPage]=useState(()=>{
    if(typeof window!=="undefined"){
      const saved=localStorage.getItem("ch_page");
      if(saved&&isValidPage(saved)) return saved;
    }
    return "dashboard";
  });
  const sidebarDragRef=useRef(null);
  const dbStatus = useDbStatus();
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
      storage.set("ch_session_log",JSON.stringify(next));
      return next;
    });
    // Write to DB
    sessionService.postSessionAction({action:'time_in',email:user?.email}).then(r=>r.json()).then(d=>{
      if(d.id){setSessionDbId(d.id);storage.set("ch_session_db_id",d.id);}
    }).catch(()=>{});
  };
  const doTimerReset=()=>{
    const now=Date.now();
    setGlobalTimeIn(now);
    storage.set("ch_timein",String(now));
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
      storage.set("ch_session_log",JSON.stringify(finalLog));

      // Write time_out to DB, then save all session_cases from the log, then clear local log
      const currentDbId=sessionDbId;
      if(currentDbId){
        sessionService.postSessionAction({action:'time_out',session_id:currentDbId,email:user?.email}).then(()=>{
          // Save each case/form entry from the session log to DB
          const caseEntries=finalLog.filter(e=>e.status==="Site Comment"||e.status==="Inbound Email");
          return Promise.all(caseEntries.map(e=>
            sessionService.postSessionAction({
                action:'log_case',
                session_id:currentDbId,
                email:user?.email,
                case_num:e.caseNum||null,
                case_type:e.status==="Site Comment"?"siteComment":"inbound",
                note:e.note||""
              }).catch(()=>{})
          ));
        }).then(()=>{
          // Refresh session data but keep the user on Post-Live Amends
          setSessionRefreshKey(k=>k+1);
          setPage("postlive");
          storage.set("ch_page","postlive");
        }).catch(()=>{
          setSessionRefreshKey(k=>k+1);
        });
      } else {
        // No DB session, still stay on Post-Live Amends
        setSessionRefreshKey(k=>k+1);
        setPage("postlive");
        storage.set("ch_page","postlive");
      }

      // Clear local session log after saving
      setTimeout(()=>{
        setSessionLog([]);
        storage.remove("ch_session_log");
      },400);

      return finalLog;
    });
    // Stop any active break/open hour when timing out
    setBreakTimer(null); stopAlarmLoop(); setActiveAlarm(null);
    storage.remove("ch_break");
    setOpenHourActive(false);
    storage.remove("ch_openhour");
    setTimedIn(false);
    setGlobalTimeIn(null);
    if(typeof window!=="undefined"){
      localStorage.removeItem("ch_timed_in");
      localStorage.removeItem("ch_timein");
    }
    setSessionDbId(null);
    storage.remove("ch_session_db_id");
  };



  const {
    addSessionLog, clearSessionLog, closeSessionLog, closeWithOutcome, sessionLog, setSessionLog,
  } = useSessionLog({
    sessionDbId, user,
  });
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
    storage.set("ch_page","postlive");
  };
  const {
    qaLimit, saveQaLimit, saveShiftEndTime, saveShiftStartTime, saveShiftStartWarnMins,
    saveTimerLimit, setShiftWarnMins, shiftEndTime, shiftStartTime, shiftStartWarnMins,
    shiftWarnMins, timerLimit,
  } = useShiftSettings();
  const saveShiftWarnMins=(m)=>{
    const v=Math.max(1,Math.min(60,parseInt(m)||10));
    setShiftWarnMins(v);
    storage.set("ch_shift_warn",v);
  };

 // always loaded from DB
 // {label,mins,endsAt,warnAt,warned,ended,secsLeft}
  // timerLimit (mins) is the single source of truth — also aliased as alarmMins for legacy compat
  const alarmMins = timerLimit;


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

  useEffect(()=>{ const h=e=>{const d=document.getElementById("fngen-dropdown");if(d&&!d.closest(".fngen-wrap")?.contains(e.target)) d.classList.remove("open");}; document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h); },[]);

  const { activeAlarm, dismissAlarm, setActiveAlarm, snoozeAlarm, startAlarmLoop, stopAlarmLoop } = useAlarmPlayer();

  const {
    breakPending, breakTimer, cancelBreakConfirm, cancelOpenHourConfirm, openHourActive,
    openHourPending, setBreakPending, setBreakTimer, setCancelBreakConfirm,
    setCancelOpenHourConfirm, setOpenHourActive, setOpenHourPending, startBreak, startOpenHour,
    stopBreak, stopOpenHour,
  } = useBreakTimer({
    addSessionLog, globalTimeIn, setActiveAlarm, setGlobalTimeIn, setSessionLog, startAlarmLoop,
    stopAlarmLoop,
  });

  const { playEndAlarm } = useAlarmSignals({ alarmMins, qaLimit, setActiveAlarm, startAlarmLoop, stopAlarmLoop });

  // ── On mount: restore session from localStorage ──
  useEffect(()=>{
    const tryRestore=async()=>{
      const stored=localStorage.getItem("ch_user");
      const refresh=localStorage.getItem("ch_refresh");
      if(!stored||!refresh){setSessionChecked(true);return;}
      try{
        const res=await authService.refreshSession({refresh_token:refresh});
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

  const {
    addAnnouncement, addCase, addLink, addRequestor, allCases, announcements, archiveDraft,
    archivedDrafts, dataLoading, deleteCase, deleteDraft, drafts, links, removeAnnouncement,
    removeLink, removeRequestor, saveDraft, setAllCases, setAnnouncements, setArchivedDrafts,
    setDrafts, setLinks, setSpecialRequestors, specialRequestors, updateAnnouncement, updateCase,
    updateDraft, updateLink,
  } = useCaseHubData({
    dbStatus, setSessionLog, setUser, user,
  });

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
    storage.set("ch_page", "postlive");
    return;
  }

  if (id === page) return;

  // ✅ allow ALL other pages (dashboard, history, etc.)
  // If a form is active, mark that the user is no longer viewing form fields
  // so the floating "Form In Progress" pill becomes visible on other pages.
  if (formActive) setFormInFields(false);
  setPage(id);
  storage.set("ch_page", id);
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
  };

  // ── Show nothing while checking stored session (prevents login flash) ──
  if(!sessionChecked){
    return (
      <>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--bg)",flexDirection:"column",gap:16}}>
          <div style={{animation:"float 1.5s ease-in-out infinite"}}><Icon name="loading" size={52} color="var(--accent)"/></div>
          <div style={{color:"var(--muted)",fontSize:14,fontFamily:"Poppins,sans-serif"}}>Loading CaseHub...</div>
        </div>
      </>
    );
  }

  // ── Auth screens ──
  if(!user){
    if(authPage==="signup") return <SignupPage onSignup={(u)=>setUser(u)} goLogin={()=>setAuthPage("login")}/>;
    return <LoginPage onLogin={(u)=>setUser(u)} goSignup={()=>setAuthPage("signup")}/>;
  }


  // Session controls shared with every page header (breaks, meeting, log out).
  const shell = {
    breakTimer, timedIn, formInFields, openHourActive,
    requestBreak: (label, mins) => setBreakPending({ label, mins }),
    requestCancelBreak: () => setCancelBreakConfirm(true),
    requestOpenHour: () => setOpenHourPending(true),
    requestCancelOpenHour: () => setCancelOpenHourConfirm(true),
    logout,
  };

  return (
    <>
      <ShellContext.Provider value={shell}>
      <div className="shell">
        <Sidebar
          allCases={allCases}
          announcements={announcements}
          archivedDrafts={archivedDrafts}
          coreNav={NAV_ITEMS}
          dbStatus={dbStatus}
          formActive={formActive}
          handleNav={handleNav}
          links={links}
          logout={logout}
          page={page}
          setLinks={setLinks}
          sidebarDragRef={sidebarDragRef}
        />

        <main className={cls("main-area", formInFields&&page==="postlive"&&"form-mode")} style={{paddingBottom: formInFields&&page==="postlive" ? 0 : 32}}>
          {/* Break / Meeting timer lives at the TOP of the page (never a footer). Inside the Post-Live form the form shows its own banner. */}
          {!dataLoading&&!(formInFields&&page==="postlive")&&breakTimer&&<BreakBanner breakTimer={breakTimer} onEnd={()=>setCancelBreakConfirm(true)} />}
          {!dataLoading&&!(formInFields&&page==="postlive")&&openHourActive&&!breakTimer&&<MeetingBanner onEnd={()=>setCancelOpenHourConfirm(true)} />}
          {dataLoading&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"80vh",flexDirection:"column",gap:16}}><div style={{animation:"float 1.5s ease-in-out infinite"}}><Icon name="loading" size={48} color="var(--accent)"/></div><div style={{color:"var(--muted)",fontSize:13,fontFamily:"Poppins,sans-serif"}}>Loading your workspace...</div></div>}

          {!dataLoading&&page==="dashboard"&&<DashboardPage savedCases={allCases} setPage={setPage} user={user} announcements={announcements}/>}
          {!dataLoading&&page==="build"&&<div className="soon-wrap"><div className="soon-badge"><Icon name="casebox" size={80} color="var(--muted)"/></div><div className="soon-title">Build</div><div className="soon-sub">Coming soon — hang tight!</div></div>}
          {!dataLoading&&page==="prelive"&&<div className="soon-wrap"><div className="soon-badge"><Icon name="prelive" size={80} color="var(--muted)"/></div><div className="soon-title">Pre-Live Amends</div><div className="soon-sub">Coming soon — hang tight!</div></div>}
          {!dataLoading&&<div style={{display:page==="postlive"?(formInFields?"flex":"block"):"none",flexDirection:"column"}}>
            <PostLivePage onSaveCase={addCase} onUpdateCase={updateCase} onUpdateDraft={updateDraft} onFormActive={setFormActivePersist} onFormInFields={setFormInFields} onMinimise={()=>{setPage("postlive"); storage.set("ch_page","postlive");}} allSavedCases={allCases} dbDrafts={drafts} onSaveDraft={saveDraft} onDeleteDraft={deleteDraft} onArchiveDraft={archiveDraft} user={user} onTimerEnd={playEndAlarm} specialRequestors={specialRequestors} alarmMins={alarmMins} qaAlarmMins={qaLimit} globalTimeIn={globalTimeIn} timedIn={timedIn} breakActive={!!breakTimer||openHourActive} breakTimer={breakTimer||null} openHourActive={openHourActive} onTimeIn={doTimeIn} onTimeOut={doTimeOut} onTimerReset={doTimerReset} sessionDbId={sessionDbId} sessionLog={sessionLog} addSessionLog={addSessionLog} setSessionLog={setSessionLog} closeWithOutcome={closeWithOutcome} closeSessionLog={closeSessionLog} clearSessionLog={clearSessionLog} onStartBreakFull={(label,mins)=>startBreak(label,mins,true)} onStopBreak={()=>setCancelBreakConfirm(true)} onStartBreak={startBreak} onStartOpenHour={startOpenHour} onStopOpenHour={()=>setCancelOpenHourConfirm(true)} resumeTick={resumeFormTick}/>
          </div>}
          {!dataLoading&&page==="history"&&<CaseHistoryPage cases={allCases} onUpdate={updateCase} onDelete={deleteCase}/>}
          {!dataLoading&&page==="announcements"&&<AnnouncementsPage announcements={announcements} addAnnouncement={addAnnouncement} updateAnnouncement={updateAnnouncement} removeAnnouncement={removeAnnouncement} user={user}/>}
          {!dataLoading&&page==="links"&&<LinksPage links={links} setLinks={setLinks} addLink={addLink} updateLink={updateLink} removeLink={removeLink}/>}
          {!dataLoading&&page==="profile"&&<ProfilePage user={user} setUser={setUser} timerLimit={timerLimit} saveTimerLimit={saveTimerLimit} qaLimit={qaLimit} saveQaLimit={saveQaLimit} shiftStartTime={shiftStartTime} saveShiftStartTime={saveShiftStartTime} shiftStartWarnMins={shiftStartWarnMins} saveShiftStartWarnMins={saveShiftStartWarnMins} shiftEndTime={shiftEndTime} saveShiftEndTime={saveShiftEndTime} shiftWarnMins={shiftWarnMins} saveShiftWarnMins={saveShiftWarnMins} specialRequestors={specialRequestors} addRequestor={addRequestor} removeRequestor={removeRequestor}/>}
          {!dataLoading&&page==="sessions"&&<SessionLogPage user={user} refreshKey={sessionRefreshKey}/>}
          {!dataLoading&&page==="archives"&&<ArchivePage archivedDrafts={archivedDrafts} onDelete={async(id)=>{try{await draftService.deleteArchivedDraft(id);setArchivedDrafts(a=>a.filter(x=>x._id!==id));}catch(e){console.error(e);}}}/>}
          {!dataLoading&&page==="filenames"&&<FileNameGeneratorPage/>}
        </main>
      </div>
      </ShellContext.Provider>

      {/* ── Break Modals (at root level so they overlay the full screen) ── */}
      {breakPending&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14}}><Icon name="coffee" size={40} color="var(--accent)"/></div>
        <h3>Start {breakPending.label} Break?</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:20}}>A break entry will be added to your session log.</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setBreakPending(null)}>Cancel</button>
          <button className="btn btn-save" onClick={()=>{startBreak(breakPending.label,breakPending.mins);setBreakPending(null);}}>Start Break</button>
        </div>
      </div></div>)}
      {openHourPending&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14,fontSize:36}}>🕐</div>
        <h3>Start Open Hour?</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:20,lineHeight:1.6}}>The current ongoing entry will be renamed to <strong>Open Hour</strong> in your session log. Your session timer will reset when you end it.</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setOpenHourPending(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={startOpenHour}>Start Open Hour</button>
        </div>
      </div></div>)}
      {cancelBreakConfirm&&(<div className="modal-bg"><div className="modal">
        <button onClick={()=>setCancelBreakConfirm(false)} aria-label="Close" style={{position:"absolute",top:18,right:16,width:12,height:12,border:"none",background:"none",cursor:"pointer",color:"var(--accent)",fontSize:16,lineHeight:1,padding:0}}>✕</button>
        <h3>Do You Want to End Your Break?</h3>
        <p style={{color:"var(--accent)",fontSize:12,marginBottom:22,lineHeight:1.6}}>You have still {breakTimer?Math.max(0,Math.ceil((breakTimer.secsLeft||0)/60)):0} Minutes, Continue?</p>
        <div className="modal-btns">
          <button className="btn btn-primary" onClick={()=>{setCancelBreakConfirm(false);stopBreak();}}>Yes, Continue</button>
          <button className="btn btn-outline-accent" onClick={()=>setCancelBreakConfirm(false)}>No, Return to Break</button>
        </div>
      </div></div>)}

      {cancelOpenHourConfirm&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14}}><Icon name="close" size={40} color="var(--red)"/></div>
        <h3>End Open Hour?</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:20}}>Your session timer will reset and a fresh Ongoing entry will start. Are you sure?</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setCancelOpenHourConfirm(false)}>Keep Going</button>
          <button className="btn btn-danger" onClick={()=>{setCancelOpenHourConfirm(false);stopOpenHour();}}>End Open Hour</button>
        </div>
      </div></div>)}

      {/* ── Alarm Overlay — portal to document.body so it renders OUTSIDE all CSS
           stacking contexts and shows on EVERY page, tab, and screen ── */}
      {activeAlarm&&typeof document!=="undefined"&&createPortal(
        <AlarmOverlay activeAlarm={activeAlarm} dismissAlarm={dismissAlarm} qaLimit={qaLimit} shiftStartWarnMins={shiftStartWarnMins} shiftWarnMins={shiftWarnMins} snoozeAlarm={snoozeAlarm} timerLimit={timerLimit} />,
        document.body
      )}

      {/* Nav no longer shows discard warning — form state preserved on page switch */}

      {/* ── Open Hour bar ── */}
      {openHourActive&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:1200,background:"linear-gradient(90deg,#7c3aed,#6d28d9)",padding:"10px 24px",display:"flex",alignItems:"center",gap:16,boxShadow:"0 -4px 24px rgba(124,58,237,.4)"}}>
          <div style={{fontSize:22,flexShrink:0}}>🕐</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>Open Hour Active</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.75)"}}>Helping a customer outside normal amends</div>
          </div>
          <button onClick={()=>setCancelOpenHourConfirm(true)} style={{padding:"8px 18px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:20,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Poppins',sans-serif",backdropFilter:"blur(4px)"}}>End Open Hour</button>
        </div>
      )}

      {/* ── Floating in-progress pill — shows everywhere except inside form fields ── */}
      <div className="form-progress-pill"
        onClick={resumeInProgressForm}
        style={{
          opacity:formActive&&!formInFields?1:0,
          pointerEvents:formActive&&!formInFields?"auto":"none",
          transform:formActive&&!formInFields?"translateY(0)":"translateY(16px)",
          transition:"opacity .25s, transform .25s",
        }}>
        <div className="form-progress-pill-dot"/>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2}}>
          <div style={{fontSize:12,fontWeight:700,lineHeight:1}}>Form In Progress</div>
          <div style={{fontSize:10,opacity:.85,lineHeight:1}}>Click to resume</div>
        </div>
        <Icon name="back" size={14} color="#fff" style={{transform:"rotate(180deg)",marginLeft:2,flexShrink:0}}/>
      </div>
    </>
  );
}
