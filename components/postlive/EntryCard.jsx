import { useState } from 'react';
import Icon from '../icons/Icon';

export default function EntryCard({ entry, label, index, onChange, onDelete, showNumber, onDragHandlePointerDown, isDragging }) {
  const [checking,setChecking]=useState(null);
  // New entries start in edit mode; saved entries start locked
  const [saved,setSaved]=useState(!!entry._saved);
  const ai=async(field)=>{ if(!entry[field]?.trim())return; setChecking(field); const {result,changes}=await checkGrammar(entry[field]); onChange({...entry,[field]:result}); setChecking(changes>0?`fixed-${field}`:null); setTimeout(()=>setChecking(null),2000); };
  const handleSave=()=>{ setSaved(true); onChange({...entry,_saved:true}); };
  const handleEdit=()=>{ setSaved(false); onChange({...entry,_saved:false}); };

  return (
    <div className={cls("entry-card entry-card-wrap",saved&&"saved")} style={{opacity:isDragging?0.3:1,transition:"opacity .1s"}}>
      <div className="entry-header">
        {/* Drag handle — pointer down here starts drag */}
        <div className="drag-handle" title="Drag to reorder"
          onPointerDown={ev=>{ev.stopPropagation();onDragHandlePointerDown&&onDragHandlePointerDown(ev);}}>
          <span/><span/><span/>
        </div>
        <span className="entry-label" style={{flex:1}}>{showNumber?`${label} #${entry.number||(index+1)}`:label}</span>
        {saved
          ? <button className="h-btn" style={{fontSize:11,padding:"3px 10px",borderColor:"var(--accent)",color:"var(--accent)"}} onClick={handleEdit}><Icon name="edit" size={11} style={{marginRight:4}}/>Edit</button>
          : <button className="btn btn-primary" style={{fontSize:11,padding:"4px 12px"}} onClick={handleSave}><Icon name="save" size={11} style={{marginRight:4}}/>Save</button>
        }
        {(showNumber||(index>0))&&<button className="entry-del" onClick={onDelete}><Icon name="trash" size={13} color="var(--red)"/></button>}
      </div>
      {saved ? (
        <div className="entry-saved-preview">
          {entry.number&&<div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>#{entry.number}</div>}
          {entry.note ? <div>{entry.note}</div> : <em>No note</em>}
          {entry.clarification&&<div style={{marginTop:6,paddingTop:6,borderTop:"1px solid var(--border)",color:"var(--muted)",fontSize:12}}>{entry.clarification}</div>}
        </div>
      ) : (
        <>
          {showNumber&&(<div className="field"><label>Number <span className="req">*</span></label><input draggable={false} className="inp" placeholder="e.g. 25" value={entry.number} onChange={e=>onChange({...entry,number:e.target.value})}/></div>)}
          <div className="field"><label>Note (optional)</label><textarea draggable={false} className="inp" rows={3} value={entry.note} onChange={e=>onChange({...entry,note:e.target.value})} placeholder="Describe what was done or assumed..."/><div className="ai-row"><button className="ai-btn" disabled={!entry.note?.trim()||checking==="note"} onClick={()=>ai("note")}>{checking==="note"?"Checking...":(checking===`fixed-note`?"✓ Fixed!":"Grammar Check")}</button></div></div>
          <div className="field"><label>Clarification (optional)</label><textarea draggable={false} className="inp" rows={3} value={entry.clarification} onChange={e=>onChange({...entry,clarification:e.target.value})} placeholder="Confirmation or extra details..."/><div className="ai-row"><button className="ai-btn" disabled={!entry.clarification?.trim()||checking==="clarification"} onClick={()=>ai("clarification")}>{checking==="clarification"?"Checking...":(checking===`fixed-clarification`?"✓ Fixed!":"Grammar Check")}</button></div></div>
        </>
      )}
    </div>
  );
}

