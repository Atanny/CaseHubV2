import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Icon } from '@/components/ui/Icon'

export function ArchivePage({ archivedDrafts=[], onDelete, onStartBreak, onStartOpenHour, onLogout }) {
  const [expandedId,setExpandedId]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null);

  if(archivedDrafts.length===0){
    return (
      <div className="page-wrap">
        <PageHeader title="Archived Cases" subtitle="Manage Archived Cases" />
        <div style={{textAlign:"center",color:"var(--muted)",padding:"60px 0",fontSize:14}}>
          <div style={{marginBottom:16}}><Icon name="archive" size={52} color="var(--muted)"/></div>
          <div>No archived cases yet.</div>
          <div style={{fontSize:12,marginTop:6,opacity:.6}}>When you archive a suspended case it will appear here.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <PageHeader title="Archived Cases" subtitle="Manage Archived Cases" />

      {confirmDelete&&(
        <div className="modal-bg"><div className="modal">
          <div style={{marginBottom:14,fontSize:36}}>🗑</div>
          <h3>Permanently Delete?</h3>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:20,lineHeight:1.6}}>
            This archived case will be <strong style={{color:"var(--red)"}}>permanently deleted</strong> and cannot be recovered.
          </p>
          <div className="modal-btns">
            <button className="btn btn-ghost" onClick={()=>setConfirmDelete(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={()=>{onDelete&&onDelete(confirmDelete);setConfirmDelete(null);}}>Yes, Delete Forever</button>
          </div>
        </div></div>
      )}

      <div style={{marginTop:16}}>
        {archivedDrafts.map((d,i)=>{
          const isSC=d._mode==="siteComment";
          const isOpen=expandedId===d._id;
          const nums=(Array.isArray(d._bundledWith)?d._bundledWith:(d._bundledWith?[d._bundledWith]:[])).filter(Boolean);
          const isMulti=nums.length>1;
          const bundleCol=isMulti?"#f59e0b":"#10b981";
          const bundleBg=isMulti?"rgba(245,158,11,.14)":"rgba(16,185,129,.14)";
          const bundleBdr=isMulti?"1px solid rgba(245,158,11,.35)":"1px solid rgba(16,185,129,.35)";

          return (
            <div key={d._id||i} style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:12,marginBottom:10,overflow:"hidden",boxShadow:"var(--shadow-sm)"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}} onClick={()=>setExpandedId(isOpen?null:d._id)}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"var(--amber)",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:"var(--text)",fontFamily:"'Poppins',sans-serif"}}>Case #{d.caseNum||"—"} — {d.accountNum||"—"}</div>
                  <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{d.amendType||"No amend type"} · Archived {d.archivedAt}</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:30,background:isSC?"var(--h-badge-site-bg)":"var(--h-badge-email-bg)",color:isSC?"var(--accent)":"var(--accent2)",whiteSpace:"nowrap"}}>
                  {isSC?"Site Comment":"Inbound Email"}
                </span>
                {nums.length>0&&(
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:bundleBg,border:bundleBdr,color:bundleCol,fontWeight:700,flexShrink:0,fontFamily:"'Poppins',sans-serif"}}>
                    🔗 w/ #{nums.join(", #")}
                  </span>
                )}
                <button
                  className="entry-del"
                  title="Permanently delete"
                  onClick={e=>{e.stopPropagation();setConfirmDelete(d._id);}}
                  style={{borderRadius:6,backgroundColor:"var(--red)",padding:"8px 10px",border:"white 1px solid",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}
                >
                  <Icon name="trash" size={13} color="#fff"/>
                </button>
                <span style={{color:"var(--muted)",fontSize:12,transition:".25s",display:"inline-block",transform:isOpen?"rotate(180deg)":"none"}}>▼</span>
              </div>

              {isOpen&&(
                <div style={{borderTop:"1px solid var(--border)",padding:"14px 16px",background:"var(--entry-bg)"}}>
                  {(d.entries||[]).filter(e=>e.note||e.number||e.clarification).map((e,ei)=>(
                    <div key={ei} className="case-entry-card" style={{marginBottom:8}}>
                      <div className="case-entry-num">{isSC?`Site Comment #${e.number||ei+1}`:`Assumption ${ei+1}`}</div>
                      {e.note&&<div className="case-entry-field"><span className="case-entry-key">Note: </span>{e.note}</div>}
                      {e.clarification&&<div className="case-entry-field"><span className="case-entry-key">Clarification: </span>{e.clarification}</div>}
                    </div>
                  ))}
                  {(d.entries||[]).filter(e=>e.note||e.number||e.clarification).length===0&&(
                    <div style={{color:"var(--muted)",fontSize:12}}>No entries recorded.</div>
                  )}
                  {d.emailAddress&&(
                    <div style={{marginTop:8,fontSize:12,color:"var(--muted)"}}>
                      <Icon name="inbound" size={12} style={{marginRight:4,verticalAlign:"middle"}}/>
                      Email: <span style={{color:"var(--text)",fontWeight:600}}>{d.emailAddress}</span>
                    </div>
                  )}
                  {d.trackerChecklistLink&&(
                    <div style={{marginTop:8,fontSize:12}}>
                      <a href={d.trackerChecklistLink} target="_blank" rel="noreferrer" style={{color:"var(--accent)",fontWeight:600,textDecoration:"none"}}>Tracker Link</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
