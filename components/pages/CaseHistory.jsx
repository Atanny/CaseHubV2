import { useState } from 'react';
import { cls } from '../../lib/helpers';
import downloadCase from '../../lib/downloadCase';
import EditableCaseCard from '../postlive/EditableCaseCard';

export default function CaseHistory({ cases, onUpdate, onDelete }) {
  const [lightboxImg,setLightboxImg]=useState(null);
  const [search,setSearch]=useState("");
  const [filterMode,setFilterMode]=useState("all");
  const [filterDate,setFilterDate]=useState("");
  const [openCaseId,setOpenCaseId]=useState(null);
  const [editingId,setEditingId]=useState(null);
  const [pendingDelete,setPendingDelete]=useState(null); // {id,caseNum}

  const filtered = [...cases].filter(c=>{
    const q=search.toLowerCase();
    const matchQ=!q||c.caseNum?.toLowerCase().includes(q)||c.accountNum?.toLowerCase().includes(q)||c.amendType?.toLowerCase().includes(q)||c.entries?.some(e=>e.note?.toLowerCase().includes(q)||e.clarification?.toLowerCase().includes(q));
    const matchMode=filterMode==="all"||(filterMode==="site"&&c._mode==="siteComment")||(filterMode==="inbound"&&c._mode==="inbound");
    const matchDate=!filterDate||c.savedAt?.includes(filterDate);
    return matchQ&&matchMode&&matchDate;
  });

  const modeBadgeColor = mode => mode==="inbound" ? "var(--inbound,#8a38f5)" : "var(--site-comment,#4760ff)";
  const modeLabel = mode => mode==="inbound" ? "Inbound Email" : "Site Comment";
  const cxLabel = cx => cx==="major"?"Major":cx==="complex"?"Complex":"Minor";

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div>
          <p className="chd-h4">Case History</p>
          <p className="chd-p-muted">Where the Cases stored</p>
        </div>
      </div>
      <div className="chd-divider"/>

      <div className="chd-search-row">
        <input className="chd-search-inp" placeholder="E.G Case #/Assumption/Email/Account # / NOB" value={search} onChange={e=>setSearch(e.target.value)}/>
        <input type="date" className="chd-date-inp" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/>
      </div>
      <div className="chd-radio-row">
        {[["all","All"],["site","Site Comment"],["inbound","Inbound Email"]].map(([v,l])=>(
          <div key={v} className={cls("chd-radio-pill",filterMode===v&&"active")} onClick={()=>setFilterMode(v)}><div className="chd-radio-dot"/>{l}</div>
        ))}
        {(search||filterDate||filterMode!=="all")&&(
          <div className="chd-radio-pill" onClick={()=>{setSearch("");setFilterDate("");setFilterMode("all");}}>✕ Clear</div>
        )}
      </div>

      {filtered.length===0 ? (
        <div className="chd-empty-box">{cases.length===0?"No cases yet — complete and save a Post-Live Amend to see it here.":"No results — try adjusting your search or filters."}</div>
      ) : (
        filtered.map((c,i)=>{
          const key=c._id||i;
          const isOpen=openCaseId===key;
          const isEditing=editingId===key;
          return (
            <div className="chd-accordion" key={key}>
              <div className="chd-accordion-head" onClick={()=>setOpenCaseId(isOpen?null:key)}>
                <div>
                  <div className="chd-title-row">
                    <p className="chd-h6">{c.caseNum||"—"} - {c.accountNum||"—"}</p>
                    <span className="chd-badge" style={{background:modeBadgeColor(c._mode)}}>{modeLabel(c._mode)} - {cxLabel(c._caseComplexity)}</span>
                  </div>
                  <p className="chd-p-muted">{c.amendType||"—"} · {c.savedAt}</p>
                </div>
                <div className="chd-row-actions" onClick={e=>e.stopPropagation()}>
                  <button className="chd-btn-secondary" onClick={()=>downloadCase(c)}>Download ZIP</button>
                  <button className="chd-btn-primary" onClick={()=>{setEditingId(isEditing?null:key);setOpenCaseId(key);}}>{isEditing?"Close Edit":"Edit Case"}</button>
                  <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>setPendingDelete({id:c._id,caseNum:c.caseNum})}>Delete</button>
                </div>
              </div>
              {isOpen&&(
                <div className="chd-accordion-body">
                  {isEditing ? (
                    /* Real, fully-featured editor — image upload, entries, checklist, Supabase save */
                    <EditableCaseCard c={c} onUpdate={(id,patch)=>{onUpdate(id,patch);}}
                      onRequestDelete={(id,caseNum)=>setPendingDelete({id,caseNum})}
                      onLightbox={setLightboxImg} openId={key} setOpenId={()=>{}}/>
                  ) : (
                    <div className="chd-info-grid">
                      <div className="chd-info-card">
                        <div className="chd-info-cols">
                          <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:150}}>
                            <p className="chd-label" style={{opacity:.6}}>Account Number</p><p className="chd-p">{c.accountNum||"—"}</p>
                            <p className="chd-label" style={{opacity:.6}}>Case Number</p><p className="chd-p">{c.caseNum||"—"}</p>
                            <p className="chd-label" style={{opacity:.6}}>Amend Type</p><p className="chd-p">{c.amendType||"—"}</p>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:150}}>
                            <p className="chd-label" style={{opacity:.6}}>Customer Name</p><p className="chd-p">{c.customerName||"—"}</p>
                            <p className="chd-label" style={{opacity:.6}}>Customer Email</p><p className="chd-p">{c.customerEmail||"—"}</p>
                            <p className="chd-label" style={{opacity:.6}}>Business Name</p><p className="chd-p">{c.businessName||"—"}</p>
                          </div>
                        </div>
                        <div style={{height:2,background:"#fff",borderRadius:100}}/>
                        <p className="chd-label" style={{opacity:.6}}>{modeLabel(c._mode)}</p>
                        {(c.entries||[]).filter(e=>e.note||e.clarification).map((e,ei)=>(
                          <p key={ei} className="chd-p-muted" style={{whiteSpace:"pre-wrap"}}>{e.note}{e.clarification?` — ${e.clarification}`:""}</p>
                        ))}
                        {c.trackerChecklistLink&&(
                          <a href={c.trackerChecklistLink} target="_blank" rel="noopener noreferrer" className="chd-p" style={{color:"var(--site-comment,#4760ff)",wordBreak:"break-all"}}>{c.trackerChecklistLink}</a>
                        )}
                      </div>
                      <div className="chd-info-card" style={{flex:1}}>
                        <p className="chd-label" style={{opacity:.6}}>Devices Checklist</p>
                        {Object.keys(c.devices||{}).filter(k=>c.devices[k]).length>0
                          ? Object.entries(c.devices).filter(([,v])=>v).map(([k])=>(<p key={k} className="chd-p">{k}</p>))
                          : <p className="chd-p-muted">—</p>}
                        <div style={{height:2,background:"#fff",borderRadius:100}}/>
                        <p className="chd-label" style={{opacity:.6}}>Screenshots</p>
                        <div className="chd-shots">
                          {[...(c.images||[]),...(c.backupImages||[])].map((img,ii)=>(
                            <div className="chd-shot" key={ii} onClick={()=>setLightboxImg(img.url)}><img src={img.url} alt=""/></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {lightboxImg&&(<div className="lightbox-bg" onClick={()=>setLightboxImg(null)}><img className="lightbox-img" src={lightboxImg} alt="Screenshot"/></div>)}

      {pendingDelete&&(
        <div className="chd-modal-bg">
          <div className="chd-modal-card">
            <p className="chd-h6">Delete Case?</p>
            <p className="chd-p-muted">Case #{pendingDelete.caseNum} will be permanently deleted. This cannot be undone.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14}}>
              <button className="chd-btn-secondary" onClick={()=>setPendingDelete(null)}>Cancel</button>
              <button className="chd-btn-primary" style={{background:"var(--red)",borderColor:"var(--red)"}} onClick={()=>{onDelete(pendingDelete.id);setPendingDelete(null);}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

