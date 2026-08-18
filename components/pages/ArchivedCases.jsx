import { useState } from 'react';

export default function ArchivePage({ archivedDrafts=[], onDelete }) {
  const [expandedId,setExpandedId]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null);

  const modeBadgeColor = mode => mode==="inbound" ? "var(--inbound,#8a38f5)" : "var(--site-comment,#4760ff)";
  const modeLabel = mode => mode==="inbound" ? "Inbound Email" : "Site Comment";

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div><p className="chd-h4">Archived Cases</p><p className="chd-p-muted">{archivedDrafts.length} archived case{archivedDrafts.length!==1?"s":""} — view-only</p></div>
      </div>
      <div className="chd-divider"/>

      {archivedDrafts.length===0 ? (
        <div className="chd-empty-box">No archived cases yet. When you archive a suspended case it will appear here.</div>
      ) : (
        archivedDrafts.map((d,i)=>{
          const isOpen=expandedId===d._id;
          const nums=(Array.isArray(d._bundledWith)?d._bundledWith:(d._bundledWith?[d._bundledWith]:[])).filter(Boolean);
          return (
            <div className="chd-accordion" key={d._id||i}>
              <div className="chd-accordion-head" onClick={()=>setExpandedId(isOpen?null:d._id)}>
                <div>
                  <div className="chd-title-row">
                    <p className="chd-h6">{d.caseNum||"—"} - {d.accountNum||"—"}</p>
                    <span className="chd-badge" style={{background:modeBadgeColor(d._mode)}}>{modeLabel(d._mode)}</span>
                    {nums.length>0&&<span className="chd-badge" style={{background:"var(--amber)"}}>w/ #{nums.join(", #")}</span>}
                  </div>
                  <p className="chd-p-muted">{d.amendType||"No amend type"} · Archived {d.archivedAt}</p>
                </div>
                <div className="chd-row-actions" onClick={e=>e.stopPropagation()}>
                  <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>setConfirmDelete(d._id)}>Delete Forever</button>
                </div>
              </div>
              {isOpen&&(
                <div className="chd-accordion-body">
                  <div className="chd-info-card" style={{marginTop:10}}>
                    {(d.entries||[]).filter(e=>e.note||e.number||e.clarification).length>0 ? (
                      (d.entries||[]).filter(e=>e.note||e.number||e.clarification).map((e,ei)=>(
                        <p key={ei} className="chd-p-muted" style={{whiteSpace:"pre-wrap"}}>{e.note}{e.clarification?` — ${e.clarification}`:""}</p>
                      ))
                    ) : <p className="chd-p-muted">No entries recorded.</p>}
                    {d.emailAddress&&<p className="chd-p-muted">Email: {d.emailAddress}</p>}
                    {d.trackerChecklistLink&&(
                      <a href={d.trackerChecklistLink} target="_blank" rel="noreferrer" className="chd-p" style={{color:"var(--site-comment,#4760ff)"}}>Tracker Link</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {confirmDelete&&(
        <div className="chd-modal-bg">
          <div className="chd-modal-card">
            <p className="chd-h6">Permanently Delete?</p>
            <p className="chd-p-muted">This archived case will be permanently deleted and cannot be recovered.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14}}>
              <button className="chd-btn-secondary" onClick={()=>setConfirmDelete(null)}>Cancel</button>
              <button className="chd-btn-primary" style={{background:"var(--red)",borderColor:"var(--red)"}} onClick={()=>{onDelete&&onDelete(confirmDelete);setConfirmDelete(null);}}>Yes, Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

