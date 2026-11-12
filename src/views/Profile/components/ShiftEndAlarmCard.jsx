export function ShiftEndAlarmCard({ saveShiftEndTime, saveShiftWarnMins, setShiftEndInput, setShiftWarnInput, shiftEndInput, shiftEndTime, shiftWarnInput, shiftWarnMins, showToast }) {
  return (
    <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>⏰ Shift End Alarm</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Set your shift end time and how many minutes before it you want to be alerted. Leave blank to disable.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div className="field" style={{marginBottom:0}}>
            <label>Shift End Time</label>
            <input className="inp" type="time" value={shiftEndInput} onChange={e=>setShiftEndInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>e.g. 05:00 for 5:00 AM</div>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label>Warn me this many minutes before</label>
            <input className="inp" type="number" min="1" max="60" value={shiftWarnInput} onChange={e=>setShiftWarnInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Default: 10 minutes</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="btn btn-primary" style={{padding:"8px 18px",fontSize:12}} onClick={()=>{
            saveShiftEndTime(shiftEndInput);
            saveShiftWarnMins(shiftWarnInput);
            showToast("Shift alarm updated ✅");
          }}>Save</button>
          {shiftEndTime&&<button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>{
            setShiftEndInput(""); saveShiftEndTime(""); showToast("Shift alarm disabled");
          }}>Disable</button>}
        </div>
        {shiftEndTime&&<div style={{fontSize:11,color:"var(--muted)",marginTop:10}}>
          Active: alarm fires at <strong style={{color:"var(--accent)"}}>{(()=>{
            const [hh,mm]=shiftEndTime.split(":").map(Number);
            const warn=new Date();warn.setHours(hh,mm,0,0);
            warn.setMinutes(warn.getMinutes()-shiftWarnMins);
            return warn.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()}</strong> ({shiftWarnMins} min before {(()=>{
            const [hh,mm]=shiftEndTime.split(":").map(Number);
            return new Date(0,0,0,hh,mm).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()})
        </div>}
      </div>
  )
}
