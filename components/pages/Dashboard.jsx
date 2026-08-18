import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard({ savedCases, setPage, specialRequestors, addRequestor, removeRequestor, user, announcements=[], archivedDrafts=[] }) {
  const now = new Date();
  const total     = savedCases.length;
  const today     = savedCases.filter(c=>new Date(c.savedAt).toDateString()===now.toDateString()).length;
  const scCount   = savedCases.filter(c=>c._mode==="siteComment").length;
  const ibCount   = savedCases.filter(c=>c._mode==="inbound").length;
  const completed = savedCases.filter(c=>c.checklist&&Object.values(c.checklist).every(Boolean)).length;

  const dayKeys=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const byDay={}; dayKeys.forEach(k=>{byDay[k]=0;});
  savedCases.forEach(c=>{const k=dayKeys[new Date(c.savedAt).getDay()]; byDay[k]=(byDay[k]||0)+1;});
  const dayData=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(label=>({label,val:byDay[label]}));

  const latestCases=[...savedCases].sort((a,b)=>new Date(b.savedAt)-new Date(a.savedAt)).slice(0,6);
  const latestAnnouncement = announcements&&announcements.length>0
    ? [...announcements].sort((a,b)=>new Date(b.createdAt||b.date||0)-new Date(a.createdAt||a.date||0))[0]
    : null;

  const modeBadgeColor = mode => mode==="inbound" ? "var(--inbound,#8a38f5)" : "var(--site-comment,#4760ff)";
  const modeLabel = mode => mode==="inbound" ? "Inbound Email" : "Site Comment";
  const cxLabel = cx => cx==="major"?"Major":cx==="complex"?"Complex":"Minor";

  // Amendments split — real Site Comment vs Inbound Email data.
  // Swap for real Build/Pre-Live/Post-Live once those pages are live (currently "Coming soon").
  const amendData=[
    {label:"Site Comment", val:scCount, color:"var(--site-comment,#4760ff)"},
    {label:"Inbound Email", val:ibCount, color:"var(--inbound,#8a38f5)"},
  ];

  const donutR=90-34/2, donutCirc=2*Math.PI*donutR;
  let donutOff=0;
  const maxDay=Math.max(...dayData.map(d=>d.val),1);
  const qWidth=520,qHeight=140,qStep=qWidth/(dayData.length-1||1);
  const qPts=dayData.map((d,i)=>({x:i*qStep,y:qHeight-(d.val/maxDay)*qHeight}));
  const qPath=qPts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
  const maxAmend=Math.max(...amendData.map(d=>d.val),1);

  return (
    <div className="chd-dash">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <p className="chd-h4">Dashboard</p>
          <p className="chd-p-muted">Summary of Data</p>
        </div>
      </div>
      <div className="chd-divider"/>

      <div className="chd-greet-row">
        <div className="chd-greet-card">
          <img className="chd-avatar" src={user?.avatarUrl||"https://api.dicebear.com/7.x/initials/svg?seed="+(user?.name||"U")} alt=""/>
          <div>
            <p className="chd-h4">Hello, {user?.name||"there"}</p>
            <p className="chd-p-muted">{user?.role||"—"}</p>
          </div>
        </div>
        <div className="chd-mini-row">
          <div className="chd-mini-card"><p className="chd-h4">{total}</p><p className="chd-p-muted">Overall Cases</p></div>
          <div className="chd-mini-card"><p className="chd-h4">—</p><p className="chd-p-muted">My Latest Quota</p></div>
          <div className="chd-mini-card"><p className="chd-h4">{today}</p><p className="chd-p-muted">Cases Finished Today</p></div>
        </div>
      </div>

      <div className="chd-quick-row">
        <div className="chd-datetime-card">
          <p className="chd-label" style={{opacity:.6}}>Date &amp; Time</p>
          <div className="chd-datetime-row">
            <span>{now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</span>
            <span>{now.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</span>
          </div>
        </div>
        <div className="chd-quickactions-card">
          <p className="chd-label" style={{opacity:.6}}>Quick Actions (Post Live)</p>
          <div className="chd-qa-buttons">
            <div className="chd-qa-left">
              <button className="chd-btn-secondary" onClick={()=>setPage("postlive")}>Site Comment</button>
              <button className="chd-btn-secondary" onClick={()=>setPage("postlive")}>Inbound</button>
              <button className="chd-btn-secondary" onClick={()=>setPage("postlive")}>Bundle</button>
            </div>
            <button className="chd-btn-primary" onClick={()=>setPage("postlive")}>Time-In</button>
          </div>
        </div>
      </div>

      <div className="chd-main-row">
        <div className="chd-totals-col">
          <p className="chd-label" style={{opacity:.6}}>Pre-Live</p>
          <div className="chd-totalcards">
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--site-comment,#4760ff)"}}>—</p><p className="chd-p">Total Site Comments</p></div>
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--amber)"}}>{archivedDrafts.length}</p><p className="chd-p">Archived Case</p></div>
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--green)"}}>—</p><p className="chd-p">Total Cases Finished</p></div>
          </div>

          <p className="chd-label" style={{opacity:.6}}>Post-Live</p>
          <div className="chd-totalcards">
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--site-comment,#4760ff)"}}>{scCount}</p><p className="chd-p">Total Site Comments</p></div>
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--inbound,#8a38f5)"}}>{ibCount}</p><p className="chd-p">Total Inbound Email</p></div>
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--green)"}}>{completed}</p><p className="chd-p">Total Cases Finished</p></div>
          </div>

          <div className="chd-headline">
            <p className="chd-label" style={{opacity:.6}}>Announcement</p>
            <button className="chd-seeall" onClick={()=>setPage("announcements")}>See All Announcement ›</button>
          </div>
          <div className="chd-list-box" style={{maxHeight:120}}>
            {latestAnnouncement ? (
              <div className="chd-ann-card">
                <div>
                  <p className="chd-h6">{latestAnnouncement.title||"Announcement"}</p>
                  <p className="chd-p-muted">{latestAnnouncement.body||latestAnnouncement.content||""}</p>
                </div>
              </div>
            ) : <div className="chd-empty">No announcements yet.</div>}
          </div>

          <div className="chd-headline">
            <p className="chd-label" style={{opacity:.6}}>Latest Case Processed</p>
            <button className="chd-seeall" onClick={()=>setPage("history")}>See All Cases ›</button>
          </div>
          <div className="chd-list-box">
            {latestCases.length>0 ? latestCases.map((c,i)=>(
              <div key={i} className="chd-case-card" onClick={()=>setPage("history")}>
                <div>
                  <p className="chd-h6">{c.caseNum} - {c.accountNum}</p>
                  <p className="chd-p-muted">{c.amendType||"—"}</p>
                </div>
                <span className="chd-badge" style={{background:modeBadgeColor(c._mode)}}>
                  {modeLabel(c._mode)} - {cxLabel(c._caseComplexity)}
                </span>
              </div>
            )) : <div className="chd-empty">No cases saved yet.</div>}
          </div>
        </div>

        <div className="chd-charts-col">
          <div className="chd-chart-card">
            <p className="chd-label" style={{opacity:.6}}>Amendments</p>
            <div className="chd-legend-row">
              {amendData.map((d,i)=>(
                <div key={i} className="chd-legend-item">
                  <div className="chd-legend-dot" style={{background:d.color}}/>
                  {d.label} {total>0?Math.round((d.val/(total||1))*1000)/10:0}%
                </div>
              ))}
            </div>
            {total>0 ? (
              <div className="chd-donut-wrap">
                <svg width={180} height={180} viewBox="0 0 180 180">
                  {amendData.map((d,i)=>{
                    const pct=d.val/(total||1), len=pct*donutCirc, dashArr=`${len} ${donutCirc-len}`;
                    const rotation=(donutOff/(total||1))*360-90; donutOff+=d.val;
                    return <circle key={i} cx={90} cy={90} r={donutR} fill="none" stroke={d.color} strokeWidth={34} strokeDasharray={dashArr} strokeDashoffset={-(rotation/360)*donutCirc}/>;
                  })}
                </svg>
              </div>
            ) : <div className="chd-empty">No data yet</div>}
          </div>

          <div className="chd-chart-card">
            <p className="chd-label" style={{opacity:.6}}>Quota Graph</p>
            {total>0 ? (
              <div style={{width:"100%",overflowX:"auto"}}>
                <svg width={qWidth} height={qHeight+30} viewBox={`0 0 ${qWidth} ${qHeight+30}`}>
                  {[0,0.25,0.5,0.75,1].map((f,i)=>(<line key={i} x1={0} x2={qWidth} y1={qHeight*f} y2={qHeight*f} stroke="var(--card2)" strokeWidth={1}/>))}
                  <path d={qPath} fill="none" stroke="#8a38f5" strokeWidth={2}/>
                  {qPts.map((p,i)=>(<circle key={i} cx={p.x} cy={p.y} r={5} fill="#8a38f5" stroke="#fff" strokeWidth={2}/>))}
                  {dayData.map((d,i)=>(<text key={i} x={i*qStep} y={qHeight+20} textAnchor="middle" fontSize="10" fontFamily="Prompt,sans-serif" fontWeight="700" fill="var(--text)">{d.label}</text>))}
                </svg>
              </div>
            ) : <div className="chd-empty">No data yet</div>}
          </div>

          <div className="chd-chart-card">
            <p className="chd-label" style={{opacity:.6}}>Amendments</p>
            {total>0 ? (
              <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%"}}>
                {amendData.map((d,i)=>(
                  <div key={i} className="chd-hbar-row">
                    <div className="chd-hbar-label">{d.label}</div>
                    <div className="chd-hbar-track"><div className="chd-hbar-fill" style={{width:`${(d.val/maxAmend)*100}%`,background:d.color}}/></div>
                  </div>
                ))}
              </div>
            ) : <div className="chd-empty">No data yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

