import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Toast } from '@/components/ui/Toast'
import { CHECKLIST_LABELS } from '@/config/checklist'
import { useToast } from '@/hooks/useToast'
import { emptyEditEntry } from '@/models/caseModels'
import { downloadCase } from '@/services/caseExportService'
import { cls } from '@/utils/classNames'
import * as imageService from '@/services/imageService'
import { TrackerLinkSection } from './TrackerLinkSection'
import { ScreenshotsSection } from './ScreenshotsSection'
import { CaseCardHeader } from './CaseCardHeader'

// A single editable case card (extracted so it has its own state)
export function EditableCaseCard({ c, onUpdate, onRequestDelete, onLightbox, openId, setOpenId }) {
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
          const res=await imageService.uploadImageData({fileBase64:e.target.result,fileName:`${name}.${ext}`,mimeType:file.type||"image/png"});
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
      <CaseCardHeader
        allImages={allImages}
        c={c}
        checkDone={checkDone}
        checkTotal={checkTotal}
        editMode={editMode}
        isOpen={isOpen}
        isSC={isSC}
        setIsOpen={setIsOpen}
        startEdit={startEdit}
      />

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
                  <div className="case-field-row"><div className="case-field-label">In-Progress</div><div className="case-field-val">{c.inProgress?"Yes":"—"}</div></div>
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
                    <div className="case-field-row"><div className="case-field-label">Email Type</div><div className="case-field-val" style={{color:c.emailType==="clarification"?"var(--amber)":"var(--green)",fontWeight:700}}>{c.emailType==="clarification"?"Clarification":"Completed"}</div></div>
                  </>
                )}
              </div>
            )}

            {/* ── DEVICE CHECK ── */}
            <div className="case-section">
              <div className="case-section-title">Device Check</div>
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
                <div className="case-section-title">Final Checklist{!editMode&&` — ${checkDone}/${checkTotal}`}</div>
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
            <ScreenshotsSection
              D={D}
              addImages={addImages}
              allImages={allImages}
              c={c}
              editMode={editMode}
              onLightbox={onLightbox}
              removeImage={removeImage}
              replaceImage={replaceImage}
              startEdit={startEdit}
            />

            {/* ── TRACKER LINK ── */}
            {(true) && (
              <TrackerLinkSection D={D} c={c} editMode={editMode} setD={setD} />
            )}

            {/* ── ACTIONS ── */}
            <div className="case-actions">
              {editMode ? (
                <>
                  <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
                  <div style={{flex:1}}/>
                  <button className="btn btn-save" onClick={saveEdit}>Save Changes</button>
                </>
              ) : (
                <>
                  <button className="h-btn dl" onClick={()=>downloadCase(c)}>⬇️ Download ZIP</button>
                  <div style={{flex:1}}/>
                  <button className="h-btn" onClick={startEdit} style={{borderColor:"var(--accent)",color:"var(--accent)"}}>Edit Case</button>
                  <button className="h-btn danger" onClick={()=>onRequestDelete&&onRequestDelete(c._id,c.caseNum)}>Delete</button>
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
