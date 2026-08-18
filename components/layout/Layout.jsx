import { createPortal } from 'react-dom';
import Icon from '../icons/Icon';
import Sidebar from './Sidebar';
import { cls } from '../../lib/helpers';
import { useApp } from '../../context/AppContext';

export default function Layout({ children }) {
  const {
    sidebarIsCollapsed, setSidebarHoverOpen, formInFields, page, dataLoading,
    breakTimer, setCancelBreakConfirm, breakPending, setBreakPending, startBreak,
    openHourPending, setOpenHourPending, startOpenHour, cancelBreakConfirm, stopBreak,
    cancelOpenHourConfirm, setCancelOpenHourConfirm, stopOpenHour, activeAlarm, timerLimit,
    qaLimit, shiftStartWarnMins, shiftWarnMins, snoozeAlarm, dismissAlarm, openHourActive,
    formActive, resumeInProgressForm,
  } = useApp();

  return (
    <>
      <div className={cls("shell",sidebarIsCollapsed&&"sidebar-collapsed")}>
        <div className="sidebar-wrap" onMouseEnter={()=>setSidebarHoverOpen(true)} onMouseLeave={()=>setSidebarHoverOpen(false)}>
        <Sidebar/>
        </div>

        <main className={cls("main-area", formInFields&&page==="postlive"&&"form-mode")} style={{paddingBottom: formInFields&&page==="postlive" ? 0 : (breakTimer?80:32)}}>
          {dataLoading&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"80vh",flexDirection:"column",gap:16}}><div style={{animation:"float 1.5s ease-in-out infinite"}}><Icon name="loading" size={48} color="var(--accent)"/></div><div style={{color:"var(--muted)",fontSize:13,fontFamily:"Poppins,sans-serif"}}>Loading your workspace...</div></div>}
          {!dataLoading&&children}
        </main>
      </div>
      {/* ── Break Timer Bar — hidden when user is inside a form (TimerBar above already shows it) ── */}
      {breakTimer&&!formInFields&&(()=>{
        const pct=breakTimer.ended?100:Math.round((1-(breakTimer.secsLeft/(breakTimer.mins*60)))*100);
        const st=breakTimer.ended?"ended":breakTimer.warned?"warn":"";
        const mm=Math.floor((breakTimer.secsLeft||0)/60);
        const ss=String((breakTimer.secsLeft||0)%60).padStart(2,"0");
        return (
          <div className={cls("break-bar",st)}>
            <span style={{fontSize:18}}>{breakTimer.label.split(" ")[0]}</span>
            <div>
              <div className="break-label">{breakTimer.label.split(" ").slice(1).join(" ")}</div>
              <div style={{fontSize:10,color:"var(--muted)"}}>
                {breakTimer.ended?"✅ Break over!":breakTimer.warned?"⚠️ 5 min warning!":"On break"}
              </div>
            </div>
            <div className="break-time">{breakTimer.ended?"Done!":mm+":"+ss}</div>
            <div className="break-progress" style={{flex:1}}>
              <div className="break-progress-fill" style={{width:pct+"%"}}/>
            </div>
            <button className="break-stop" onClick={()=>setCancelBreakConfirm(true)}>✕ End</button>
          </div>
        );
      })()}

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
        <div style={{marginBottom:14}}><Icon name="close" size={40} color="var(--red)"/></div>
        <h3>End Break Early?</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:20}}>Are you sure you want to end your break now?</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setCancelBreakConfirm(false)}>Keep Break</button>
          <button className="btn btn-danger" onClick={stopBreak}>End Break</button>
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
        <div className="alarm-overlay">
          <div className="alarm-modal">
            <span className="alarm-icon">{<Icon name={activeAlarm==="case"?"timer":activeAlarm==="shift_start"?"clock":activeAlarm==="shift_end"?"bell":activeAlarm==="warn"?"timer":"bell"} size={56} color="var(--accent)"/>}</span>
            <div className="alarm-title">
              {activeAlarm==="warn"?"5 Minutes Left!"
               :activeAlarm==="case"?`Combined Tracker: ${timerLimit} min reached!`
               :activeAlarm==="case_qa"?`QA Checklist: ${qaLimit} min reached!`
               :activeAlarm==="shift_start"?"Shift Starting Soon!"
               :activeAlarm==="shift_end"?"Shift Ending Soon!"
               :"Break Over!"}
            </div>
            <div className="alarm-sub">
              {activeAlarm==="warn"?"Your break is almost up — wrap it up!"
               :activeAlarm==="case"?`You've been on this case for ${timerLimit} minutes. Check if it needs to escalate or wrap up.`
               :activeAlarm==="case_qa"?`QA Checklist has been running for ${qaLimit} minutes. Time to review and finalize.`
               :activeAlarm==="shift_start"?`Your shift starts in ${shiftStartWarnMins} minute${shiftStartWarnMins!==1?"s":""} — get ready to clock in!`
               :activeAlarm==="shift_end"?`Your shift ends in ${shiftWarnMins} minute${shiftWarnMins!==1?"s":""} — wrap up your current case!`
               :"Your break has ended. Time to get back to work!"}
            </div>
            <div className="alarm-btns">
              {(activeAlarm==="case"||activeAlarm==="case_qa"||activeAlarm==="shift_start"||activeAlarm==="shift_end")&&<button className="alarm-snooze" onClick={snoozeAlarm}><Icon name="snooze" size={14} style={{marginRight:6}}/>Snooze 5 min</button>}
              <button className="alarm-dismiss" onClick={dismissAlarm}>✅ {activeAlarm==="warn"?"Got it!":"I'm Aware"}</button>
            </div>
          </div>
        </div>,
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
          <button onClick={()=>setCancelOpenHourConfirm(true)} style={{padding:"8px 18px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:8,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Poppins',sans-serif",backdropFilter:"blur(4px)"}}>End Open Hour</button>
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
