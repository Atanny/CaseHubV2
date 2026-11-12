import { Icon } from '@/components/ui/Icon'

export function AlarmOverlay({ activeAlarm, dismissAlarm, qaLimit, shiftStartWarnMins, shiftWarnMins, snoozeAlarm, timerLimit }) {
  return (
    <div className="alarm-overlay">
          <div className="alarm-modal">
            <button onClick={dismissAlarm} aria-label="Close" style={{position:"absolute",top:18,right:16,width:12,height:12,border:"none",background:"none",cursor:"pointer",color:"var(--accent)",fontSize:16,lineHeight:1,padding:0}}>✕</button>
            <span className="alarm-icon">{<Icon name={activeAlarm==="case"?"timer":activeAlarm==="shift_start"?"clock":activeAlarm==="shift_end"?"bell":activeAlarm==="warn"?"timer":"bell"} size={54} color="var(--accent)"/>}</span>
            <div className="alarm-title">
              {activeAlarm==="warn"?"You Have 5 Mins Left"
               :activeAlarm==="case"?`You've Reached ${timerLimit} Minutes, Please Tag Now`
               :activeAlarm==="case_qa"?`QA Checklist: ${qaLimit} Min Reached!`
               :activeAlarm==="shift_start"?"Shift Starting Soon!"
               :activeAlarm==="shift_end"?"Shift Ending Soon!"
               :"Your Break Ends"}
            </div>
            <div className="alarm-sub">
              {activeAlarm==="warn"?"Prepare your Combined Tracker"
               :activeAlarm==="case"?"Tag your Case now to the Combined Tracker"
               :activeAlarm==="case_qa"?`QA Checklist has been running for ${qaLimit} minutes. Time to review and finalize.`
               :activeAlarm==="shift_start"?`Your shift starts in ${shiftStartWarnMins} minute${shiftStartWarnMins!==1?"s":""} — get ready to clock in!`
               :activeAlarm==="shift_end"?`Your shift ends in ${shiftWarnMins} minute${shiftWarnMins!==1?"s":""} — wrap up your current case!`
               :"Submit your tracker now."}
            </div>
            <div className="alarm-btns">
              {(activeAlarm==="case"||activeAlarm==="case_qa"||activeAlarm==="shift_start"||activeAlarm==="shift_end")&&<button className="btn btn-outline-accent" onClick={snoozeAlarm}>Snooze 5 Minutes</button>}
              <button className="btn btn-primary" onClick={dismissAlarm}>{activeAlarm==="warn"||activeAlarm==="end"?"Ok":"I'm Aware"}</button>
            </div>
          </div>
        </div>
  )
}
