import { useState } from 'react';
import Icon from '../icons/Icon';
import { cls } from '../../lib/helpers';
import { getOrPickDir } from '../../lib/idb';

export default function SavedCaseCard({ c, openId, setOpenId, idx=0, onEdit }) {
  const cardId = c._id || `local-${idx}`;
  const open = openId === cardId;
  const isSC=c._mode==="siteComment";
  const allImages=[...(c.images||[]),...(c.backupImages||[])];
  return (
    <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:12,marginBottom:10,overflow:"hidden",transition:".2s",boxShadow:"var(--shadow-sm)"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}} onClick={()=>setOpenId(open ? null : cardId)}>
        <div className="saved-dot"/>
        <div className="saved-info">
          <div className="saved-case">Case #{c.caseNum} — {c.accountNum}</div>
          <div className="saved-meta">{c.amendType} · {c.savedAt}{c.endedAt&&<span style={{marginLeft:8,color:"var(--green)",fontWeight:700}}>✓ {c.endedAt}</span>}</div>
        </div>
        <span className="saved-type">{isSC?"Site Comment":"Inbound Email"}</span>
        {(()=>{const b=c._bundledWith;if(!b)return null;const nums=(Array.isArray(b)?b:[b]).filter(Boolean);if(!nums.length)return null;const isMulti=nums.length>1;const col=isMulti?"#f59e0b":"#10b981";const bg=isMulti?"rgba(245,158,11,.14)":"rgba(16,185,129,.14)";const bdr=isMulti?"1px solid rgba(245,158,11,.35)":"1px solid rgba(16,185,129,.35)";return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:bg,border:bdr,color:col,fontWeight:700,flexShrink:0,fontFamily:"'Poppins',sans-serif"}}>🔗 w/ #{nums.join(", #")}</span>;})()}
        {onEdit&&<button className="btn btn-ghost" style={{fontSize:10,padding:"3px 10px",marginLeft:4}} onClick={e=>{e.stopPropagation();onEdit(c);}}><Icon name="edit" size={11} style={{marginRight:3}}/>Edit</button>}
        <span style={{color:"var(--muted)",fontSize:12,transition:".25s",display:"inline-block",transform:open?"rotate(180deg)":"none"}}>▼</span>
      </div>
      {open&&(
        <div style={{borderTop:"1px solid var(--border)",padding:"14px 16px",background:"var(--entry-bg)"}}>
          {(c.entries||[]).filter(e=>e.note||e.number||e.clarification).map((e,ei)=>(
            <div key={ei} className="case-entry-card" style={{marginBottom:8}}>
              <div className="case-entry-num">{isSC?`Site Comment #${e.number||ei+1}`:`Assumption ${ei+1}`}</div>
              {e.note&&<div className="case-entry-field"><span className="case-entry-key">Note: </span>{e.note}</div>}
              {e.clarification&&<div className="case-entry-field"><span className="case-entry-key">Clarification: </span>{e.clarification}</div>}
            </div>
          ))}
          {(c.customerName||c.customerEmail||c.businessName)&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {c.customerName&&<span style={{fontSize:11,padding:"2px 10px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:20,color:"var(--text)",fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>👤 {c.customerName}</span>}
              {c.customerEmail&&<span style={{fontSize:11,padding:"2px 10px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:20,color:"var(--text)",fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>✉️ {c.customerEmail}</span>}
              {c.businessName&&<span style={{fontSize:11,padding:"2px 10px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:20,color:"var(--text)",fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>🏢 {c.businessName}{c.businessSuffix?' '+c.businessSuffix:''}</span>}
            </div>
          )}
          {!isSC&&c.emailAddress&&(<div style={{fontSize:13,color:"var(--muted)",marginBottom:8}}><Icon name="inbound" size={12} style={{marginRight:4,verticalAlign:"middle"}}/>{c.emailType==="clarification"?"Clarification":"Completed"} → <span style={{color:"var(--text)",fontWeight:600}}>{c.emailAddress}</span></div>)}
          <div style={{marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".8px",color:"var(--muted)",marginBottom:5,fontFamily:"'Poppins',sans-serif"}}>🔗 Tracker Link</div>
            {c.trackerChecklistLink ? (
              <a href={c.trackerChecklistLink} target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,fontWeight:600,color:"var(--accent)",wordBreak:"break-all",padding:"5px 10px",background:"var(--entry-accent-bg)",border:"1px solid rgba(1,118,211,.2)",borderRadius:8,textDecoration:"none",transition:".15s",maxWidth:"100%"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(1,118,211,.18)"}
                onMouseLeave={e=>e.currentTarget.style.background="var(--entry-accent-bg)"}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                {c.trackerChecklistLink}
              </a>
            ) : (
              <span style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",fontFamily:"'Poppins',sans-serif"}}>—</span>
            )}
          </div>
          {allImages.length>0&&(
            <div style={{marginTop:10}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".8px",color:"var(--muted)",marginBottom:8}}>Screenshots ({allImages.length})</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                {allImages.map(img=>{
                  const isValidUrl=(img.url||"").startsWith("https://");
                  return (
                    <div key={img.id||img.name} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,maxWidth:80}}>
                      <div style={{width:80,height:60,borderRadius:6,overflow:"hidden",border:"1.5px solid var(--border)",background:"var(--entry-bg)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {isValidUrl
                          ? <img src={img.url} alt={img.name||""} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                              onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentNode.querySelector(".img-fallback").style.display="flex";}}
                            />
                          : null
                        }
                        <div className="img-fallback" style={{display:isValidUrl?"none":"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",gap:3}}>
                          <Icon name="image" size={20} color="var(--muted)"/>
                        </div>
                      </div>
                      <div style={{fontSize:9,color:"var(--muted)",textAlign:"center",wordBreak:"break-all",lineHeight:1.3,maxWidth:80,fontFamily:"'Poppins',sans-serif"}}>
                        {(img.name||"screenshot").replace(/\.[^.]+$/,"").slice(0,22)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="h-btn" style={{marginTop:10,fontSize:11,padding:"5px 12px",borderColor:"var(--green)",color:"var(--green)",fontWeight:700,display:"inline-flex",alignItems:"center",gap:6}} onClick={async(e)=>{
                e.stopPropagation();
                try{
                  const bizPart=(c.businessName||"").trim();const cx2=(c._caseComplexity||"minor");const cxLabel2=cx2==="major"?"Major":cx2==="complex"?"Complex":"Minor";const folderName=`${cxLabel2} ${c.caseNum||"unknown"}${bizPart?" "+bizPart:""}`.replace(/[^a-zA-Z0-9 _()-]/g,"").replace(/\s+/g," ").trim();
                  if(window.showDirectoryPicker){
                    try{
                      const rootDir=await getOrPickDir();
                      const caseDir=await rootDir.getDirectoryHandle(folderName,{create:true});
                      for(const img of allImages){
                        try{
                          const urlExt=(img.url||"").split("?")[0].split(".").pop().toLowerCase();
                          const safeExt=["jpg","jpeg","png","gif","webp"].includes(urlExt)?urlExt:"png";
                          const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
                          const r=await fetch(img.url);const blob=await r.blob();
                          const fh=await caseDir.getFileHandle(`${baseName}.${safeExt}`,{create:true});
                          const wr=await fh.createWritable();await wr.write(blob);await wr.close();
                        }catch(e){console.warn("img failed:",e);}
                      }
                      return;
                    }catch(e){if(e.name==="AbortError")return;}
                  }
                  // Fallback: individual downloads with folder/filename path
                  for(const img of allImages){
                    try{
                      const urlExt=(img.url||"").split("?")[0].split(".").pop().toLowerCase();
                      const safeExt=["jpg","jpeg","png","gif","webp"].includes(urlExt)?urlExt:"png";
                      const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
                      const r=await fetch(img.url);const blob=await r.blob();
                      const a=document.createElement("a");a.href=URL.createObjectURL(blob);
                      a.download=`${folderName}/${baseName}.${safeExt}`;
                      document.body.appendChild(a);a.click();document.body.removeChild(a);
                      URL.revokeObjectURL(a.href);
                      await new Promise(r=>setTimeout(r,120));
                    }catch(e){console.warn("img failed:",e);}
                  }
                }catch(e){console.error("Bulk download failed:",e);}
              }}>⬇ Bulk Download ({allImages.length})</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

