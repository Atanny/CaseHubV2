import { useState, useRef } from 'react';
import Icon from '../icons/Icon';
import { cls } from '../../lib/helpers';
import ImageUpload from './ImageUpload';
import InlineEdit from './InlineEdit';

export const CHECKLIST_LABELS={backup:"Before/After Backup",caseComment:"Case Comment",combinedTracker:"Combined Tracker",qaChecklist:"QA Checklist",completeJob:"Complete Job",closeSiteComment:"Close Site Comment",closeInboundCase:"Close Inbound Case",emailSales:"Email Sales",trackerChecklist:"Complete Status Tracker",completeStatus:"Tracker Checklist"};

export const emptyEditEntry=()=>({id:Date.now()+Math.random(),number:"",note:"",clarification:""});

export default function EditableCaseCard({ c, onUpdate, onRequestDelete, onLightbox, openId, setOpenId }) {
  const isSC = c._mode==="siteComment";
  const isOpen = openId === c._id;
  const setIsOpen = (val) => setOpenId(val ? c._id : null);
  const [editMode,setEditMode]=useState(false);
  const [draft,setDraft]=useState(null); // local edit draft
  const [toast,showToast]=useToast();

  const allImages=[...(c.images||[]),...(c.backupImages||[])];
  const checkDone=c.checklist?Object.values(c.checklist).filter(Boolean).length:0;
  const checkTotal=c.checklist?Object.keys(c.checklist).length:8;

  const startEdit=()=>{
    setDraft({...c,
      entries:(c.entries||[]).map(e=>({...e})),
      devices:{...(c.devices||{})},
      checklist:{...(c.checklist||{})},
      images:[...(c.images||[])],
      backupImages:[...(c.backupImages||[])],
      trackerChecklistLink:c.trackerChecklistLink||"",
    });
    setEditMode(true);
    setIsOpen(true);
  };
  const cancelEdit=()=>{setDraft(null);setEditMode(false);};
  const saveEdit=()=>{
    onUpdate(c._id,{...draft});
    setDraft(null);setEditMode(false);
    showToast("Case updated ✅");
  };

  const D = draft; // shorthand
  const setD=(patch)=>setDraft(d=>({...d,...patch}));

  // Entry helpers
  const updateEntry=(id,val)=>setD({entries:D.entries.map(e=>e.id===id?{...e,...val}:e)});
  const deleteEntry=(id)=>setD({entries:D.entries.filter(e=>e.id!==id)});
  const addEntry=()=>setD({entries:[...D.entries,emptyEditEntry()]});

  // Upload to Supabase Storage immediately, return persistent URL
  const uploadImg=async(file,name)=>{
    const ext=file.name?.split(".").pop()||"png";
    return new Promise(resolve=>{
      const reader=new FileReader();
      reader.onload=async(e)=>{
        try{
          const res=await fetch("/api/images/upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fileBase64:e.target.result,fileName:`${name}.${ext}`,mimeType:file.type||"image/png"})});
          const data=await res.json();
          if(!res.ok)throw new Error(data.error||"Upload failed");
          resolve({url:data.url,path:data.path,name,id:data.path});
        }catch(err){
          console.warn("Edit upload failed:",err.message);
          resolve({url:URL.createObjectURL(file),name,id:`blob-${Date.now()}`,_unsynced:true});
        }
      };
      reader.onerror=()=>resolve({url:URL.createObjectURL(file),name,id:`blob-${Date.now()}`,_unsynced:true});
      reader.readAsDataURL(file);
    });
  };
  // Image helpers for edit mode
  const addImages=async(files,type)=>{
    const cur=D[type]||[];
    const uploaded=await Promise.all(Array.from(files).map((f,i)=>{
      const name=type==="backupImages"?`backup-screenshot-${cur.length+i+1}`:`screenshot-${cur.length+i+1}`;
      return uploadImg(f,name);
    }));
    setD({[type]:[...cur,...uploaded]});
  };
  const removeImage=(type,id)=>setD({[type]:(D[type]||[]).filter(img=>img.id!==id)});
  const replaceImage=async(type,id,file)=>{
    const existing=(D[type]||[]).find(img=>img.id===id);
    const uploaded=await uploadImg(file,existing?.name||"screenshot");
    setD({[type]:(D[type]||[]).map(img=>img.id===id?uploaded:img)});
  };

  return (
    <div className={cls("case-card",isOpen&&"expanded")}>
      {/* Header */}
      <div className="case-card-header" onClick={()=>setIsOpen(o=>!o)}>
        <div className="case-num-badge">#{c.caseNum||"—"}</div>
        <div style={{flex:1,minWidth:0,marginLeft:4}}>
          <div className="case-meta-main">{c.accountNum||"—"} &nbsp;·&nbsp; {c.amendType||"—"}</div>
          <div className="case-meta-sub">
            <span className={cls("act-badge",isSC?"site":"email")} style={{fontSize:10,padding:"2px 8px",marginRight:6}}>{isSC?"Site Comment":"Inbound Email"}</span>
            {(()=>{
              const cx=c._caseComplexity;
              if(!cx||cx==="minor") return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",color:"#10b981",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginRight:4}}>Minor</span>;
              if(cx==="major") return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",color:"#f59e0b",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginRight:4}}>Major</span>;
              return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(244,63,94,.12)",border:"1px solid rgba(244,63,94,.3)",color:"#f43f5e",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginRight:4}}>Complex</span>;
            })()}
            {(()=>{
              const bundled = c._bundledWith;
              if(!bundled) return null;
              const nums = Array.isArray(bundled) ? bundled : [bundled];
              if(!nums.length) return null;
              const isMulti=nums.length>1;const col=isMulti?"#f59e0b":"#10b981";const bg=isMulti?"rgba(245,158,11,.14)":"rgba(16,185,129,.14)";const bdr=isMulti?"1px solid rgba(245,158,11,.35)":"1px solid rgba(16,185,129,.35)";
              return <span style={{marginLeft:4,fontSize:10,padding:"2px 9px",borderRadius:20,background:bg,border:bdr,color:col,fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>🔗 Bundled w/ #{nums.join(", #")}</span>;
            })()}
            {c.savedAt}{c.endedAt&&<span style={{marginLeft:8,color:"var(--green)",fontWeight:600}}> · Done {c.endedAt}</span>}
            {(()=>{
              const secs=c._totalElapsed||c._elapsedAtSave||0;
              if(!secs) return null;
              const h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=secs%60;
              const dur=h>0?`${h}h ${m}m ${s}s`:m>0?`${m}m ${s}s`:`${s}s`;
              return <span style={{marginLeft:8,color:"var(--accent)",fontFamily:"monospace",fontWeight:700,fontSize:10}}>⏱ {dur}</span>;
            })()}
            {allImages.length>0&&<span style={{marginLeft:8,opacity:.7}}>{allImages.length} img</span>}
            {c.checklist&&<span style={{marginLeft:8,color:checkDone===checkTotal?"var(--green)":"var(--amber)"}}>✓ {checkDone}/{checkTotal}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0}} onClick={e=>e.stopPropagation()}>
          {!editMode&&<button className="case-expand-btn" onClick={()=>{startEdit();}}>✏️ Edit</button>}
          <button className="case-expand-btn" onClick={()=>setIsOpen(o=>!o)}>
            <span className="case-expand-icon">▼</span>{isOpen?"Collapse":"Details"}
          </button>
        </div>
      </div>

      {/* Body */}
      {isOpen&&(
        <div className="case-body">
          <div className="case-body-inner">

            {editMode&&(
              <div className="edit-mode-banner">
                ✏️ Editing mode — all fields are now editable. Click Save when done.
              </div>
            )}

            {/* ── CASE INFO ── */}
            <div className="case-section">
              <div className="case-section-title">Case Info</div>
              {editMode ? (
                <>
                  <div className="field-row-edit"><label>Case # <span className="req">*</span></label><input className="inp" value={D.caseNum||""} onChange={e=>setD({caseNum:e.target.value})}/></div>
                  <div className="field-row-edit"><label>Account # <span className="req">*</span></label><input className="inp" value={D.accountNum||""} onChange={e=>setD({accountNum:e.target.value})}/></div>
                  {!isSC&&<div className="field-row-edit"><label>Inbound #</label><input className="inp" value={D.inboundNum||""} onChange={e=>setD({inboundNum:e.target.value})}/></div>}
                  <div className="field-row-edit"><label>Amend Type</label><input className="inp" value={D.amendType||""} onChange={e=>setD({amendType:e.target.value})}/></div>
                  <div className="field-row-edit">
                    <label>Case Complexity</label>
                    <select className="inp" value={D._caseComplexity||"minor"} onChange={e=>setD({_caseComplexity:e.target.value})} style={{cursor:"pointer"}}>
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="complex">Complex</option>
                    </select>
                  </div>
                  <label className={cls("check-label",D.inProgress&&"checked")} style={{marginTop:4,width:"fit-content",fontSize:12}}><input type="checkbox" checked={!!D.inProgress} onChange={e=>setD({inProgress:e.target.checked})}/>In-Progress Salesforce</label>
                </>
              ) : (
                <>
                  <div className="case-field-row"><div className="case-field-label">Case #</div><div className="case-field-val">{c.caseNum||"—"}</div></div>
                  <div className="case-field-row"><div className="case-field-label">Account #</div><div className="case-field-val">{c.accountNum||"—"}</div></div>
                  {!isSC&&<div className="case-field-row"><div className="case-field-label">Inbound #</div><div className="case-field-val">{c.inboundNum||"—"}</div></div>}
                  <div className="case-field-row"><div className="case-field-label">Amend Type</div><div className="case-field-val">{c.amendType||"—"}</div></div>
                  <div className="case-field-row"><div className="case-field-label">Complexity</div><div className="case-field-val">{c._caseComplexity==="major"?"Major":c._caseComplexity==="complex"?"Complex":"Minor"}</div></div>
                  <div className="case-field-row"><div className="case-field-label">In-Progress</div><div className="case-field-val">{c.inProgress?"✅ Yes":"—"}</div></div>
                </>
              )}
            </div>

            {/* ── SITE COMMENTS / ASSUMPTIONS ── */}
            <div className="case-section">
              <div className="edit-section-header">
                <div className="case-section-title" style={{marginBottom:0}}>{isSC?"Site Comments":"Assumptions"}</div>
                {editMode&&<button className="add-entry-btn-sm" onClick={addEntry}>＋ Add {isSC?"Comment":"Assumption"}</button>}
              </div>
              {editMode ? (
                (D.entries||[]).map((e,ei)=>(
                  <div key={e.id} className="edit-entry-card">
                    {(isSC||(D.entries.length>1))&&<button className="entry-del" onClick={()=>deleteEntry(e.id)}><Icon name="trash" size={13} color="var(--red)"/></button>}
                    {isSC&&<div className="field-row-edit"><label>SC Number <span className="req">*</span></label><input className="inp" placeholder="e.g. 25" value={e.number||""} onChange={ev=>updateEntry(e.id,{number:ev.target.value})}/></div>}
                    <div className="field-row-edit"><label>Note</label><textarea className="inp" rows={3} value={e.note||""} onChange={ev=>updateEntry(e.id,{note:ev.target.value})} placeholder="Note..."/></div>
                    <div className="field-row-edit"><label>Clarification</label><textarea className="inp" rows={3} value={e.clarification||""} onChange={ev=>updateEntry(e.id,{clarification:ev.target.value})} placeholder="Clarification..."/></div>
                  </div>
                ))
              ) : (
                (c.entries||[]).filter(e=>e.note||e.clarification||e.number).length===0
                  ? <div style={{color:"var(--muted)",fontSize:12,padding:"8px 0"}}>No entries</div>
                  : (c.entries||[]).filter(e=>e.note||e.clarification||e.number).map((e,ei)=>(
                    <div key={ei} className="case-entry-card">
                      <div className="case-entry-num">{isSC?`Site Comment #${e.number||ei+1}`:`Assumption ${ei+1}`}</div>
                      {e.note&&<div className="case-entry-field"><span className="case-entry-key">Note: </span>{e.note}</div>}
                      {e.clarification&&<div className="case-entry-field"><span className="case-entry-key">Clarification: </span>{e.clarification}</div>}
                    </div>
                  ))
              )}
            </div>

            {/* ── EMAIL DETAILS (inbound) ── */}
            {!isSC&&(
              <div className="case-section">
                <div className="case-section-title">Email Details</div>
                {editMode ? (
                  <>
                    <div className="field-row-edit"><label>Email Address</label><input className="inp" type="email" value={D.emailAddress||""} onChange={e=>setD({emailAddress:e.target.value})}/></div>
                    <div className="field-row-edit"><label>Email Type</label>
                      <div className="radio-group">
                        <label className={cls("radio-label",D.emailType==="clarification"&&"selected-clarif")}><input type="radio" checked={D.emailType==="clarification"} onChange={()=>setD({emailType:"clarification"})}/>Clarification</label>
                        <label className={cls("radio-label",D.emailType==="completed"&&"selected-complete")}><input type="radio" checked={D.emailType==="completed"} onChange={()=>setD({emailType:"completed"})}/>Completed</label>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="case-field-row"><div className="case-field-label">Email Address</div><div className="case-field-val">{c.emailAddress||"—"}</div></div>
                    <div className="case-field-row"><div className="case-field-label">Email Type</div><div className="case-field-val" style={{color:c.emailType==="clarification"?"var(--amber)":"var(--green)",fontWeight:700}}>{c.emailType==="clarification"?"❓ Clarification":"✅ Completed"}</div></div>
                  </>
                )}
              </div>
            )}

            {/* ── DEVICE CHECK ── */}
            <div className="case-section">
              <div className="case-section-title">📱 Device Check</div>
              {editMode ? (
                <div className="device-edit-group">
                  {[["mobile","Mobile"],["tablet","Tablet"],["desktop","Desktop"]].map(([k,l])=>(
                    <label key={k} className={cls("check-label",D.devices?.[k]&&"checked")} style={{fontSize:12}}>
                      <input type="checkbox" checked={!!D.devices?.[k]} onChange={e=>setD({devices:{...D.devices,[k]:e.target.checked}})}/>{l}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="case-device-chips">
                  {[["mobile","Mobile"],["tablet","Tablet"],["desktop","Desktop"]].map(([k,l])=>(
                    <div key={k} className={cls("case-device-chip",c.devices?.[k]?"active":"inactive")}>{l}{c.devices?.[k]?" ✓":" ✗"}</div>
                  ))}
                </div>
              )}
            </div>

            {/* ── FINAL CHECKLIST ── */}
            {(c.checklist||editMode)&&(
              <div className="case-section">
                <div className="case-section-title">✅ Final Checklist{!editMode&&` — ${checkDone}/${checkTotal}`}</div>
                {editMode ? (
                  <div className="checklist-edit-grid">
                    {Object.entries(CHECKLIST_LABELS).map(([k,l])=>(
                      <label key={k} className={cls("checklist-edit-item",D.checklist?.[k]&&"checked")}>
                        <input type="checkbox" checked={!!D.checklist?.[k]} onChange={e=>setD({checklist:{...D.checklist,[k]:e.target.checked}})}/>
                        <span style={{fontSize:11}}>{l}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="case-checklist-grid">
                    {Object.entries(CHECKLIST_LABELS).map(([k,l])=>(
                      <div key={k} className={cls("case-check-item",c.checklist?.[k]?"done":"undone")}>
                        <span>{c.checklist?.[k]?"✅":"⬜"}</span><span style={{fontSize:11}}>{l}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SCREENSHOTS ── */}
            <div className="case-section">
              <div className="edit-section-header">
                <div className="case-section-title" style={{marginBottom:0}}> Screenshots {editMode?"":`(${allImages.length})`}</div>
              </div>
              {editMode ? (
                <>
                  {/* Main screenshots */}
                  <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>Main Screenshots</div>
                  <div className="img-edit-grid">
                    {(D.images||[]).map(img=>(
                      <div key={img.id} className="img-edit-item">
                        <img src={img.url} alt={img.name}/>
                        <button className="img-edit-del" onClick={()=>removeImage("images",img.id)}>✕</button>
                        <label className="img-edit-replace">
                          🔄 Replace
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&replaceImage("images",img.id,e.target.files[0])}/>
                        </label>
                      </div>
                    ))}
                    <label className="img-add-zone">
                      <input type="file" accept="image/*" multiple onChange={e=>addImages(e.target.files,"images")}/>
                      <span style={{fontSize:20}}>＋</span>
                      <span>Add</span>
                    </label>
                  </div>
                  {/* Backup screenshots */}
                  <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",margin:"14px 0 6px",textTransform:"uppercase",letterSpacing:".5px"}}>Backup Screenshots</div>
                  <div className="img-edit-grid">
                    {(D.backupImages||[]).map(img=>(
                      <div key={img.id} className="img-edit-item">
                        <img src={img.url} alt={img.name}/>
                        <button className="img-edit-del" onClick={()=>removeImage("backupImages",img.id)}>✕</button>
                        <label className="img-edit-replace">
                          🔄 Replace
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&replaceImage("backupImages",img.id,e.target.files[0])}/>
                        </label>
                      </div>
                    ))}
                    <label className="img-add-zone">
                      <input type="file" accept="image/*" multiple onChange={e=>addImages(e.target.files,"backupImages")}/>
                      <span style={{fontSize:20}}>＋</span>
                      <span>Add</span>
                    </label>
                  </div>
                </>
              ) : (
                allImages.length===0
                  ? <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                      <span style={{color:"var(--muted)",fontSize:12}}>No screenshots</span>
                      <button className="h-btn" style={{fontSize:11,padding:"4px 10px",borderColor:"var(--accent)",color:"var(--accent)"}} onClick={startEdit}>＋ Add via Edit</button>
                    </div>
                  : <>
                      <div className="case-imgs">
                        {allImages.map(img=>(<div key={img.id||img.name} className="case-img-thumb" title={img.name} onClick={()=>onLightbox(img.url)}><img src={img.url} alt={img.name}/></div>))}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,color:"var(--muted)"}}>Click to enlarge</span>
                        <button className="h-btn" style={{fontSize:11,padding:"4px 10px",borderColor:"var(--accent)",color:"var(--accent)"}} onClick={startEdit}>＋ Add / Edit</button>
                        <button className="h-btn" style={{fontSize:11,padding:"4px 10px",borderColor:"var(--green)",color:"var(--green)",fontWeight:700}} onClick={async()=>{
                          try{
                            const bizPart=(c.businessName||"").trim();const folderName=`${c.caseNum||"unknown"}${bizPart?" - "+bizPart:""}`.replace(/[^a-zA-Z0-9 _()-]/g,"").replace(/\s+/g," ").trim();
                            if(window.showDirectoryPicker){
                              try{
                                const rootDir=await getOrPickDir();
                                const caseDir=await rootDir.getDirectoryHandle(folderName,{create:true});
                                for(const img of allImages){
                                  try{
                                    const urlExt=(img.url||"").split("?")[0].split(".").pop().toLowerCase();
                                    const safeExt=["jpg","jpeg","png","gif","webp"].includes(urlExt)?urlExt:"png";
                                    const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
                                    const fileName=`${baseName}.${safeExt}`;
                                    const r=await fetch(img.url);const blob=await r.blob();
                                    const fh=await caseDir.getFileHandle(fileName,{create:true});
                                    const wr=await fh.createWritable();
                                    await wr.write(blob);await wr.close();
                                  }catch(e){console.warn("Image save failed:",e);}
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
                              }catch(e){console.warn("Image fetch failed:",e);}
                            }
                          }catch(e){console.error("Bulk download failed:",e);}
                        }}>⬇ Bulk Download</button>
                      </div>
                    </>
              )}
            </div>

            {/* ── TRACKER LINK ── */}
            {(true) && (
              <div className="case-section">
                <div className="case-section-title">🔗 Tracker Link</div>
                {editMode ? (
                  <div className="field" style={{marginBottom:0}}>
                    <input
                      className="inp"
                      type="url"
                      placeholder="https://..."
                      value={D.trackerChecklistLink||""}
                      onChange={e=>setD({trackerChecklistLink:e.target.value})}
                      style={{fontSize:12}}
                    />
                  </div>
                ) : (
                  c.trackerChecklistLink ? (
                    <a
                      href={c.trackerChecklistLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display:"inline-flex",alignItems:"center",gap:6,
                        fontSize:13,fontWeight:600,color:"var(--accent)",
                        wordBreak:"break-all",padding:"6px 10px",
                        background:"var(--entry-accent-bg)",
                        border:"1px solid rgba(1,118,211,.2)",
                        borderRadius:8,textDecoration:"none",
                        transition:".15s",maxWidth:"100%",
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(1,118,211,.18)"}
                      onMouseLeave={e=>e.currentTarget.style.background="var(--entry-accent-bg)"}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      {c.trackerChecklistLink}
                    </a>
                  ) : <span style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",fontFamily:"'Poppins',sans-serif"}}>— No tracker link saved</span>
                )}
              </div>
            )}

            {/* ── ACTIONS ── */}
            <div className="case-actions">
              {editMode ? (
                <>
                  <button className="btn btn-ghost" onClick={cancelEdit}>✕ Cancel</button>
                  <div style={{flex:1}}/>
                  <button className="btn btn-save" onClick={saveEdit}>💾 Save Changes</button>
                </>
              ) : (
                <>
                  <button className="h-btn dl" onClick={()=>downloadCase(c)}>⬇️ Download ZIP</button>
                  <div style={{flex:1}}/>
                  <button className="h-btn" onClick={startEdit} style={{borderColor:"var(--accent)",color:"var(--accent)"}}>✏️ Edit Case</button>
                  <button className="h-btn danger" onClick={()=>onRequestDelete&&onRequestDelete(c._id,c.caseNum)}>🗑 Delete</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

