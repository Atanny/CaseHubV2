import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Icon } from '@/components/ui/Icon'
import { EditableCaseCard } from './components/EditableCaseCard'

export function CaseHistoryPage({ cases, onUpdate, onDelete, onStartBreak, onStartOpenHour, onLogout }) {
  const [lightboxImg,setLightboxImg]=useState(null);
  const [search,setSearch]=useState("");
  const [filterMode,setFilterMode]=useState("all");
  const [filterDate,setFilterDate]=useState("");
  const [openCaseId,setOpenCaseId]=useState(null);
  const [pendingDelete,setPendingDelete]=useState(null); // {id,caseNum}

  const filtered = [...cases].filter(c=>{
    const q=search.toLowerCase();
    const matchQ=!q||c.caseNum?.toLowerCase().includes(q)||c.accountNum?.toLowerCase().includes(q)||c.amendType?.toLowerCase().includes(q)||c.entries?.some(e=>e.note?.toLowerCase().includes(q)||e.clarification?.toLowerCase().includes(q));
    const matchMode=filterMode==="all"||(filterMode==="site"&&c._mode==="siteComment")||(filterMode==="inbound"&&c._mode==="inbound")||(filterMode==="bundle"&&!!c._bundledWith);
    const matchDate=!filterDate||c.savedAt?.includes(filterDate);
    return matchQ&&matchMode&&matchDate;
  });

  return (
    <div>
      <PageHeader title="Case History" subtitle="Where The Cases Stored" />

      <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        <div className="search-wrap" style={{flex:1,minWidth:260,marginBottom:0}}>
          <span className="search-icon"><Icon name="search" size={14} color="var(--muted)"/></span>
          <input className="search-inp" placeholder="E.g Case #/Assumption/Email/Account #/ NOB" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <input type="date" className="inp" style={{width:180,padding:"10px 14px",fontSize:12}} value={filterDate} onChange={e=>setFilterDate(e.target.value)} title="Filter by date"/>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
        {[["all","All"],["site","Site Comment"],["inbound","Inbound Email"],["bundle","Bundle Cases"]].map(([v,l])=>(
          <label key={v} onClick={()=>setFilterMode(v)} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:20,border:`1.5px solid ${filterMode===v?"var(--accent)":"var(--border)"}`,background:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,color:filterMode===v?"var(--accent)":"var(--text)"}}>
            <span style={{width:14,height:14,borderRadius:"50%",border:`1.5px solid ${filterMode===v?"var(--accent)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {filterMode===v&&<span style={{width:7,height:7,borderRadius:"50%",background:"var(--accent)"}}/>}
            </span>
            {l}
          </label>
        ))}
        {(search||filterDate||filterMode!=="all")&&<button className="btn btn-ghost btn-noicon" onClick={()=>{setSearch("");setFilterDate("");setFilterMode("all");}}>Clear</button>}
      </div>

      {filtered.length===0?(
        <div className="empty-history">
          <div style={{marginBottom:14}}><Icon name="empty" size={52} color="var(--muted)"/></div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>{cases.length===0?"No cases yet":"No results"}</div>
          <div>{cases.length===0?"Complete and save a Post-Live Amend to see it here.":"Try adjusting your search or filters."}</div>
        </div>
      ):(
        filtered.map((c,i)=>(
          <EditableCaseCard key={c._id||i} c={c} onUpdate={onUpdate}
            onRequestDelete={(id,caseNum)=>setPendingDelete({id,caseNum})}
            onLightbox={setLightboxImg} openId={openCaseId} setOpenId={setOpenCaseId}/>
        ))
      )}

      {lightboxImg&&(<div className="lightbox-bg" onClick={()=>setLightboxImg(null)}><img className="lightbox-img" src={lightboxImg} alt="Screenshot"/></div>)}

      {/* Delete confirm — rendered at CaseHistory level, outside overflow:hidden cards */}
      {pendingDelete&&(
        <div className="modal-bg">
          <div className="modal">
            <div style={{marginBottom:14,fontSize:40}}>🗑</div>
            <h3>Delete Case?</h3>
            <p>Case <strong style={{color:"var(--text)"}}>#{pendingDelete.caseNum}</strong> will be permanently deleted. This cannot be undone.</p>
            <div className="modal-btns">
              <button className="btn btn-ghost" onClick={()=>setPendingDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={()=>{onDelete(pendingDelete.id);setPendingDelete(null);}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
