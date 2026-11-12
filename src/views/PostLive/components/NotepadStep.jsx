import { StepCard } from './StepCard'
import { EntryCard } from './EntryCard'
import { cls } from '@/utils/classNames'

export function NotepadStep({ WizardNav, activePage, addEntry, copiedAll, deleteEntry, dragActiveId, dragFromId, dragToId, entryLabel, form, handleCopyAll, isSC, setDragActiveId, setF, setForm, step3Done, updateEntry }) {
  return (
    <StepCard num={4} title={isSC?"Post-Live Amends Notepad":"Assumptions Notepad"} subtitle="Insert your description and documentation" done={step3Done} isOpen={activePage===3}>
          <div id="entries-list">
          {form.entries.map((e,i)=>(
            <div key={e.id} className="entry-drag-row" data-entryid={e.id}>
              <EntryCard
                entry={e} label={entryLabel} index={i} showNumber={isSC}
                onChange={val=>updateEntry(e.id,val)}
                onDelete={()=>deleteEntry(e.id)}
                isDragging={dragActiveId===e.id}
                onDragHandlePointerDown={(ev)=>{
                  ev.preventDefault();
                  ev.stopPropagation();
                  const fromId=String(e.id);
                  dragFromId.current=fromId;
                  dragToId.current=fromId;
                  setDragActiveId(fromId);
                  document.body.style.cursor="grabbing";
                  document.body.style.userSelect="none";

                  const getRows=()=>document.querySelectorAll(".entry-drag-row");

                  const onMove=(mv)=>{
                    const y=mv.clientY;
                    // clear old lines
                    getRows().forEach(r=>r.querySelectorAll(".drop-line").forEach(l=>l.remove()));
                    let bestId=null, bestPos="after";
                    getRows().forEach(row=>{
                      const rid=row.dataset.entryid;
                      if(rid===fromId) return;
                      const rect=row.getBoundingClientRect();
                      if(y>=rect.top && y<=rect.bottom){
                        bestId=rid;
                        bestPos=y<rect.top+rect.height/2?"before":"after";
                      }
                    });
                    if(bestId){
                      dragToId.current=bestId+"::"+bestPos;
                      const targetRow=document.querySelector(`.entry-drag-row[data-entryid="${bestId}"]`);
                      if(targetRow){
                        const line=document.createElement("div");
                        line.className="drop-line";
                        if(bestPos==="before") targetRow.prepend(line);
                        else targetRow.appendChild(line);
                      }
                    } else {
                      dragToId.current=null;
                    }
                    // fade source row
                    getRows().forEach(row=>{
                      row.style.opacity=row.dataset.entryid===fromId?"0.3":"1";
                    });
                  };

                  const onUp=()=>{
                    document.body.style.cursor="";
                    document.body.style.userSelect="";
                    getRows().forEach(row=>{
                      row.querySelectorAll(".drop-line").forEach(l=>l.remove());
                      row.style.opacity="1";
                    });
                    const rawTo=dragToId.current;
                    setDragActiveId(null);
                    dragFromId.current=null;
                    dragToId.current=null;
                    if(rawTo && rawTo.includes("::")){
                      const [toId,pos]=rawTo.split("::");
                      setForm(prev=>{
                        const arr=[...prev.entries];
                        const fi=arr.findIndex(x=>String(x.id)===fromId);
                        let ti=arr.findIndex(x=>String(x.id)===toId);
                        if(fi===-1||ti===-1||fi===ti) return prev;
                        const [moved]=arr.splice(fi,1);
                        ti=arr.findIndex(x=>String(x.id)===toId);
                        const insertAt=pos==="after"?ti+1:ti;
                        arr.splice(insertAt,0,moved);
                        return{...prev,entries:arr};
                      });
                    }
                    window.removeEventListener("pointermove",onMove,true);
                    window.removeEventListener("pointerup",onUp,true);
                  };

                  window.addEventListener("pointermove",onMove,true);
                  window.addEventListener("pointerup",onUp,true);
                }}
              />
            </div>
          ))}
          </div>
          {isSC&&<button className="add-entry-btn" onClick={addEntry}>＋ Add New Site Comment</button>}
          {!isSC&&(
            <div style={{marginTop:16,padding:"15px",background:"var(--code-bg)",borderRadius:10,border:"1.5px solid var(--border)"}}>
              <div className="field"><label>Email Address <span className="req">*</span></label><input className="inp" type="email" placeholder="client@email.com" value={form.emailAddress} onChange={e=>setF({emailAddress:e.target.value,_emailAddressManuallySet:true})}/>{form.customerEmail&&!form.emailAddress&&<div style={{fontSize:10,color:"var(--accent)",marginTop:4,fontFamily:"'Poppins',sans-serif"}}>↑ Will auto-fill from Customer Email in Step 1</div>}</div>
              <div className="field" style={{marginBottom:0}}><label>Email Type <span className="req">*</span></label>
                <div className="radio-group">
                  <label className={cls("radio-label",form.emailType==="clarification"&&"selected-clarif")}><input type="radio" name="emailType" value="clarification" checked={form.emailType==="clarification"} onChange={()=>setF({emailType:"clarification"})} style={{display:"none"}}/>Clarification</label>
                  <label className={cls("radio-label",form.emailType==="completed"&&"selected-complete")}><input type="radio" name="emailType" value="completed" checked={form.emailType==="completed"} onChange={()=>setF({emailType:"completed"})} style={{display:"none"}}/>Completed</label>
                </div>
              </div>
            </div>
          )}
          <button className={cls("copy-all-btn",copiedAll&&"copied")} onClick={handleCopyAll}>{copiedAll?"Copied!":"Copy All "+(isSC?"Site Comments":"Assumptions + Email")}</button>
          {/* Device Check — folded into the same wizard page as the notepad, matching the Figma "Notepad/Assumption" tab */}
          <div className="check-devices-inline">
            <label className="wizard-subsection-label">Check Devices</label>
            <p style={{fontSize:12,color:"var(--muted)",marginBottom:11}}>All three must be checked <span className="req">*</span></p>
            <div className="check-group">
              {[["mobile","Mobile"],["tablet","Tablet"],["desktop","Desktop"]].map(([k,l])=>(<label key={k} className={cls("check-label",form.devices[k]&&"checked")}><input type="checkbox" checked={form.devices[k]} onChange={e=>setF({devices:{...form.devices,[k]:e.target.checked}})}/>{l}</label>))}
            </div>
          </div>
          {activePage===3 && <WizardNav/>}
        </StepCard>
  )
}
