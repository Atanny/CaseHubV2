export function ShiftStartAlarmCard({ saveShiftStartTime, saveShiftStartWarnMins, setShiftStartInput, setShiftStartWarnInput, shiftStartInput, shiftStartTime, shiftStartWarnInput, shiftStartWarnMins, showToast }) {
  return (
    <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>⏰ Shift Start Alarm</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Get alerted before your shift starts so you have time to prepare. Leave blank to disable.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div className="field" style={{marginBottom:0}}>
            <label>Shift Start Time</label>
            <input className="inp" type="time" value={shiftStartInput} onChange={e=>setShiftStartInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>e.g. 20:00 for 8:00 PM</div>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label>Warn me this many minutes before</label>
            <input className="inp" type="number" min="1" max="60" value={shiftStartWarnInput} onChange={e=>setShiftStartWarnInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Default: 10 minutes</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="btn btn-primary" style={{padding:"8px 18px",fontSize:12}} onClick={()=>{
            saveShiftStartTime(shiftStartInput);
            saveShiftStartWarnMins(shiftStartWarnInput);
            showToast("Shift start alarm updated ✅");
          }}>Save</button>
          {shiftStartTime&&<button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>{
            setShiftStartInput(""); saveShiftStartTime(""); showToast("Shift start alarm disabled");
          }}>Disable</button>}
        </div>
        {shiftStartTime&&<div style={{fontSize:11,color:"var(--muted)",marginTop:10}}>
          Active: alarm fires at <strong style={{color:"var(--accent)"}}>{(()=>{
            const [hh,mm]=shiftStartTime.split(":").map(Number);
            const warn=new Date();warn.setHours(hh,mm,0,0);
            warn.setMinutes(warn.getMinutes()-shiftStartWarnMins);
            return warn.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()}</strong> ({shiftStartWarnMins} min before {(()=>{
            const [hh,mm]=shiftStartTime.split(":").map(Number);
            return new Date(0,0,0,hh,mm).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()})
        </div>}
      </div>
  )
}
