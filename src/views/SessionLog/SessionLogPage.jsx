import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Icon } from '@/components/ui/Icon'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import * as sessionService from '@/services/sessionService'

export function SessionLogPage({ user, refreshKey=0, onStartBreak, onStartOpenHour, onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [openId, setOpenId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, showToast] = useToast();

  const load = async (filterDate) => {
    setLoading(true);
    try {
      const q = filterDate
        ? `?email=${encodeURIComponent(user.email)}&date=${filterDate}`
        : `?email=${encodeURIComponent(user.email)}`;
      const res = await sessionService.listSessions(q);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch { setSessions([]); }
    setLoading(false);
  };

  const deleteSession = async (id) => {
    try {
      await sessionService.deleteSession(id);
      setSessions(s=>s.filter(x=>x.id!==id));
      showToast("Session deleted","success");
    } catch { showToast("Failed to delete","error"); }
    setDeleteId(null);
  };

  useEffect(() => { load(date); }, [date, refreshKey]);

  const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '—';
  const fmtDur = (start, end) => {
    if (!start) return '—';
    const ms = (end ? new Date(end) : new Date()) - new Date(start);
    const m = Math.floor(ms/60000), h = Math.floor(m/60);
    return h > 0 ? `${h}h ${m%60}m` : `${m}m`;
  };

  const totalCases = (() => {
    const seen = new Set();
    sessions.forEach(s => (s.session_cases||[]).forEach(c => { if(c.case_num) seen.add(c.case_num); }));
    return seen.size;
  })();
  const totalBreakMins = sessions.reduce((a,s) => {
    return a + (s.session_breaks||[]).reduce((b,br) => {
      if (!br.started_at || !br.ended_at) return b;
      return b + Math.round((new Date(br.ended_at)-new Date(br.started_at))/60000);
    }, 0);
  }, 0);

  return (
    <div>
      <PageHeader title="Session Logs" subtitle="Check Your Time History" />

      {/* Date picker + summary */}
      <div style={{background:"var(--glass-bg)",border:"1px solid var(--glass-border)",backdropFilter:"var(--glass-blur)",WebkitBackdropFilter:"var(--glass-blur)",borderRadius:12,padding:"16px 20px",marginBottom:24,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",boxShadow:"var(--glass-shadow)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:16}}>📅</span>
          <label style={{fontSize:11,color:"var(--muted)",fontFamily:"'Poppins',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:".6px"}}>Date</label>
          <input type="date" className="inp" style={{width:160,fontSize:13,borderRadius:8}} value={date} onChange={e=>setDate(e.target.value)} placeholder="Filter by date"/>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginLeft:"auto"}}>
          {[
            {label:"Sessions", val: sessions.length, color:"var(--accent)"},
            {label:"Cases Worked", val: totalCases, color:"var(--green)"},
            {label:"Break Time", val: `${totalBreakMins}m`, color:"var(--amber)"},
          ].map(({label,val,color})=>(
            <div key={label} style={{background:"var(--entry-bg)",border:"1.5px solid var(--border)",padding:"10px 18px",minWidth:100,textAlign:"center",borderRadius:10}}>
              <div style={{fontSize:20,fontWeight:800,color,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1}}>{val}</div>
              <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".8px",fontFamily:"'Poppins',sans-serif",marginTop:4,fontWeight:700}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {loading && <div style={{color:"var(--muted)",fontSize:13,padding:"20px 0",display:"flex",alignItems:"center",gap:8}}><span style={{animation:"float 1s ease-in-out infinite",display:"inline-block"}}>⏳</span> Loading sessions...</div>}
      {!loading && sessions.length === 0 && <div style={{color:"var(--muted)",fontSize:14,padding:"60px 0",textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>📭</div>No sessions found for this date.</div>}

      {sessions.map(s => {
        const isOpen = openId === s.id;
        const cases = s.session_cases || [];
        const breaks = s.session_breaks || [];
        return (
          <div key={s.id} style={{background:"var(--glass-bg)",border:"1.5px solid var(--glass-border)",backdropFilter:"var(--glass-blur)",WebkitBackdropFilter:"var(--glass-blur)",marginBottom:12,overflow:"hidden",borderRadius:12,boxShadow:"var(--glass-shadow)",transition:".2s"}}>
            {/* Session header */}
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",cursor:"pointer",userSelect:"none"}} onClick={()=>setOpenId(isOpen?null:s.id)}>
              <div style={{width:10,height:10,borderRadius:"50%",background:s.status==="active"?"var(--green)":"var(--muted)",flexShrink:0,boxShadow:s.status==="active"?"0 0 8px var(--green)":"none"}}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                  <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>In: <span style={{color:"var(--accent)"}}>{fmtTime(s.time_in)}</span></span>
                  <span style={{fontSize:13,color:"var(--muted)"}}>Out: {fmtTime(s.time_out)}</span>
                  <span style={{fontSize:12,color:"var(--green)",fontWeight:700,background:"rgba(16,185,129,.1)",padding:"2px 10px",borderRadius:20}}>⏱ {fmtDur(s.time_in, s.time_out)}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {cases.length>0 && <span style={{fontSize:10,padding:"3px 10px",background:"var(--entry-accent-bg)",border:"1px solid rgba(64,81,59,.25)",color:"var(--accent)",fontWeight:700,borderRadius:20}}>{cases.length} case{cases.length!==1?"s":""}</span>}
                {breaks.length>0 && <span style={{fontSize:10,padding:"3px 10px",background:"var(--entry-bg)",border:"1px solid var(--border)",color:"var(--amber)",fontWeight:700,borderRadius:20}}>{breaks.length} break{breaks.length!==1?"s":""}</span>}
                <button onClick={e=>{e.stopPropagation();setDeleteId(s.id);}} className="btn btn-danger" style={{padding:"5px 14px",fontSize:11}} title="Delete session">Delete Session</button>
                <span style={{color:"var(--muted)",fontSize:12,transform:isOpen?"rotate(180deg)":"none",display:"inline-block",transition:".2s"}}>▼</span>
              </div>
            </div>

            {isOpen && (
              <div style={{borderTop:"1px solid var(--border)",padding:"14px 18px",background:"var(--entry-bg)"}}>
                {cases.length > 0 && (
                  <div style={{marginBottom:14,overflowX:"auto"}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".8px",color:"var(--muted)",marginBottom:8,fontFamily:"'Poppins',sans-serif"}}>Cases</div>
                    <table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
                      <thead>
                        <tr>
                          {["Case Type","Case Number","Combine Tracker","QA Checklist","Status","Action"].map(h=>(
                            <th key={h} style={{textAlign:"left",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".6px",color:"var(--muted)",padding:"0 10px 8px",fontFamily:"'Poppins',sans-serif"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cases.map((c,i)=>(
                          <tr key={c.id||i} style={{background:"var(--card)"}}>
                            <td style={{padding:"9px 10px",borderRadius:"8px 0 0 8px"}}><span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,background:c.case_type==="siteComment"?"var(--h-badge-site-bg)":"var(--h-badge-email-bg)",color:c.case_type==="siteComment"?"#4760ff":"#7c5cff"}}>{c.case_type==="siteComment"?"Site Comment":"Inbound Email"}</span></td>
                            <td style={{padding:"9px 10px",fontSize:12,fontWeight:700}}>{c.case_num||"—"}</td>
                            <td style={{padding:"9px 10px",fontSize:12,color:"var(--muted)"}}>{fmtDur(c.started_at,c.ended_at)}</td>
                            <td style={{padding:"9px 10px",fontSize:12,color:"var(--muted)"}}>—</td>
                            <td style={{padding:"9px 10px"}}><span style={{fontSize:11,fontWeight:700,color:c.ended_at?"var(--green)":"var(--amber)"}}>{c.ended_at?"Completed":"In Progress"}</span></td>
                            <td style={{padding:"9px 10px",borderRadius:"0 8px 8px 0"}}><button className="btn btn-ghost btn-noicon" style={{padding:"4px 12px",fontSize:11}} onClick={()=>showToast(`Case #${c.case_num||"—"}`,"info")}>View Case</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {breaks.length > 0 && (
                  <div>
                    <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".8px",color:"var(--muted)",marginBottom:8,fontFamily:"'Poppins',sans-serif"}}>Breaks</div>
                    {breaks.map((b,i)=>(
                      <div key={b.id||i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 12px",background:"var(--card)",border:"1px solid var(--border)",marginBottom:6,borderRadius:8}}>
                        <Icon name="coffee" size={13} color="var(--amber)"/>
                        <span style={{flex:1,fontSize:12,fontWeight:600}}>{b.break_type}</span>
                        <span style={{fontSize:11,color:"var(--muted)",fontFamily:"monospace"}}>{fmtTime(b.started_at)} → {fmtTime(b.ended_at)}</span>
                        <span style={{fontSize:11,fontWeight:700,color:"var(--amber)",background:"rgba(245,158,11,.1)",padding:"2px 8px",borderRadius:20}}>{fmtDur(b.started_at,b.ended_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {cases.length===0 && breaks.length===0 && <div style={{fontSize:12,color:"var(--muted)",textAlign:"center",padding:"16px 0"}}>No activity recorded for this session.</div>}
              </div>
            )}
          </div>
        );
      })}
      {deleteId&&(
        <div className="modal-bg"><div className="modal">
          <div style={{marginBottom:14,fontSize:36}}>🗑</div>
          <h3>Delete Session?</h3>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:24}}>This will permanently remove this session and all its case/break records. Cannot be undone.</p>
          <div className="modal-btns">
            <button className="btn btn-ghost" onClick={()=>setDeleteId(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={()=>deleteSession(deleteId)}>Delete</button>
          </div>
        </div></div>
      )}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}
