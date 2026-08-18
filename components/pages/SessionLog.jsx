import { useState, useEffect } from 'react';
import { cls } from '../../lib/helpers';
import Toast, { useToast } from '../ui/Toast';

export default function SessionLogPage({ user, refreshKey=0 }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [openDay, setOpenDay] = useState(null);
  const [deleteDay, setDeleteDay] = useState(null); // {dateKey, sessionIds}
  const [toast, showToast] = useToast();

  const load = async (filterDate) => {
    setLoading(true);
    try {
      const q = filterDate
        ? `?email=${encodeURIComponent(user.email)}&date=${filterDate}`
        : `?email=${encodeURIComponent(user.email)}`;
      const res = await fetch(`/api/sessions${q}`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch { setSessions([]); }
    setLoading(false);
  };

  useEffect(() => { load(date); }, [date, refreshKey]);

  const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '—';
  const fmtDur = (start, end) => {
    if (!start) return '—';
    const ms = (end ? new Date(end) : new Date()) - new Date(start);
    const m = Math.floor(ms/60000), h = Math.floor(m/60);
    return h > 0 ? `${h}h ${m%60}m` : `${m}m`;
  };
  const fmtDayLabel = (d) => new Date(d).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});

  // Figma groups rows by calendar day rather than by individual time-in/out session
  const dayGroups = (() => {
    const map = {};
    sessions.forEach(s => {
      if (!s.time_in) return;
      const dateKey = new Date(s.time_in).toDateString();
      if (!map[dateKey]) map[dateKey] = { dateKey, sessions: [], firstIn: s.time_in, lastOut: s.time_out };
      map[dateKey].sessions.push(s);
      if (new Date(s.time_in) < new Date(map[dateKey].firstIn)) map[dateKey].firstIn = s.time_in;
      if (!map[dateKey].lastOut || (s.time_out && new Date(s.time_out) > new Date(map[dateKey].lastOut))) map[dateKey].lastOut = s.time_out;
    });
    return Object.values(map)
      .map(g => ({ ...g, cases: g.sessions.flatMap(s => s.session_cases || []) }))
      .filter(g => !search || g.cases.some(c => (c.case_num||"").toLowerCase().includes(search.toLowerCase())))
      .sort((a,b)=> new Date(b.firstIn) - new Date(a.firstIn));
  })();

  const modeBadgeColor = mode => mode==="inbound" ? "var(--inbound,#8a38f5)" : "var(--site-comment,#4760ff)";
  const modeLabel = mode => mode==="inbound" ? "Inbound Email" : "Site Comment";

  const confirmDeleteDay = async () => {
    if (!deleteDay) return;
    try {
      await Promise.all(deleteDay.sessionIds.map(id => fetch(`/api/sessions?id=${id}`,{method:'DELETE'})));
      setSessions(s => s.filter(x => !deleteDay.sessionIds.includes(x.id)));
      showToast("Session deleted","success");
    } catch { showToast("Failed to delete","error"); }
    setDeleteDay(null);
  };

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div><p className="chd-h4">Session Logs</p><p className="chd-p-muted">Check your Time History</p></div>
      </div>
      <div className="chd-divider"/>

      <div className="chd-search-row">
        <input className="chd-search-inp" placeholder="E.G Case # / Account #" value={search} onChange={e=>setSearch(e.target.value)}/>
        <input type="date" className="chd-date-inp" value={date} onChange={e=>setDate(e.target.value)}/>
      </div>

      {loading && <div className="chd-empty-box">Loading sessions…</div>}
      {!loading && dayGroups.length===0 && <div className="chd-empty-box">No sessions found for this date.</div>}

      {dayGroups.map(g => {
        const isOpen = openDay === g.dateKey;
        return (
          <div className="chd-accordion" key={g.dateKey}>
            <div className="chd-accordion-head" onClick={()=>setOpenDay(isOpen?null:g.dateKey)}>
              <div>
                <div className="chd-title-row">
                  <p className="chd-h6">{fmtDayLabel(g.firstIn)}</p>
                  <span className="chd-badge" style={{background:"var(--text)"}}>{g.cases.length} Case{g.cases.length!==1?"s":""}</span>
                </div>
                <p className="chd-p-muted"><b>Total:</b> {fmtDur(g.firstIn,g.lastOut)} | {fmtTime(g.firstIn)} - {fmtTime(g.lastOut)}</p>
              </div>
              <div className="chd-row-actions" onClick={e=>e.stopPropagation()}>
                <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}}
                  onClick={()=>setDeleteDay({dateKey:g.dateKey, sessionIds:g.sessions.map(s=>s.id)})}>
                  Delete Session
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="chd-accordion-body">
                {g.cases.length===0 ? (
                  <div className="chd-empty-box">No cases logged this day.</div>
                ) : (
                  <div style={{overflowX:"auto"}}>
                    <table className="chd-table">
                      <thead><tr>{["Case Type","Case Number","Combine Tracker","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {g.cases.map((c,ci)=>(
                          <tr key={c.id||ci}>
                            <td><span className="chd-badge" style={{background:modeBadgeColor(c.case_type)}}>{modeLabel(c.case_type)}</span></td>
                            <td>{c.case_num||"—"}</td>
                            <td>{fmtDur(c.started_at,c.ended_at)}</td>
                            <td style={{fontWeight:700,color:c.ended_at?"var(--green)":"var(--red)"}}>{c.ended_at?"Completed":"Suspended"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {(g.sessions.flatMap(s=>s.session_breaks||[])).length>0 && (
                  <div style={{marginTop:14}}>
                    <p className="chd-label" style={{opacity:.6,marginBottom:8}}>Breaks</p>
                    {g.sessions.flatMap(s=>s.session_breaks||[]).map((b,i)=>(
                      <div key={b.id||i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 12px",background:"var(--card2)",borderRadius:8,marginBottom:6}}>
                        <span style={{flex:1}} className="chd-p">{b.break_type}</span>
                        <span className="chd-p-muted">{fmtTime(b.started_at)} → {fmtTime(b.ended_at)}</span>
                        <span className="chd-p-muted">{fmtDur(b.started_at,b.ended_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {deleteDay&&(
        <div className="chd-modal-bg">
          <div className="chd-modal-card">
            <p className="chd-h6">Delete this session?</p>
            <p className="chd-p-muted">All time-in/out records for this day will be permanently deleted.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14}}>
              <button className="chd-btn-secondary" onClick={()=>setDeleteDay(null)}>Cancel</button>
              <button className="chd-btn-primary" style={{background:"var(--red)",borderColor:"var(--red)"}} onClick={confirmDeleteDay}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

