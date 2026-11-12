import { Icon } from '@/components/ui/Icon'

export function EditCaseModal({ editCase, isEditSC, onUpdateCase, setEditCase, showToast }) {
  return (
    <div className="modal-bg"><div className="modal" style={{maxWidth:520,width:"100%",maxHeight:"85vh",overflowY:"auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <h3 style={{margin:0}}>Edit Case #{editCase.caseNum}</h3>
            <span style={{fontSize:11,padding:"2px 10px",background:"var(--entry-accent-bg)",border:"1px solid var(--border)",color:"var(--accent)",fontWeight:700}}>{isEditSC?"Site Comment":"Inbound Email"}</span>
          </div>

          {/* Core fields */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div className="field" style={{marginBottom:0}}>
              <label>Case #</label>
              <input className="inp" value={editCase.caseNum||""} onChange={e=>setEditCase(c=>({...c,caseNum:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Account #</label>
              <input className="inp" value={editCase.accountNum||""} onChange={e=>setEditCase(c=>({...c,accountNum:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Amend Type</label>
              <input className="inp" value={editCase.amendType||""} onChange={e=>setEditCase(c=>({...c,amendType:e.target.value}))}/>
            </div>
            {!isEditSC&&(
              <div className="field" style={{marginBottom:0}}>
                <label>Inbound #</label>
                <input className="inp" value={editCase.inboundNum||""} onChange={e=>setEditCase(c=>({...c,inboundNum:e.target.value}))}/>
              </div>
            )}
            <div className="field" style={{marginBottom:0}}>
              <label>Customer Name</label>
              <input className="inp" placeholder="e.g. John Smith" value={editCase.customerName||""} onChange={e=>setEditCase(c=>({...c,customerName:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Customer Email</label>
              <input className="inp" type="email" placeholder="e.g. client@email.com" value={editCase.customerEmail||""} onChange={e=>setEditCase(c=>({...c,customerEmail:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0,gridColumn:"1/-1"}}>
              <label>Business Name</label>
              <div style={{display:"flex",gap:8}}>
                <input className="inp" placeholder="e.g. Fire Force" style={{flex:2}} value={editCase.businessName||""} onChange={e=>setEditCase(c=>({...c,businessName:e.target.value}))}/>
                <input className="inp" placeholder="LLC / Corp / Inc…" style={{flex:1}} value={editCase.businessSuffix||""} onChange={e=>setEditCase(c=>({...c,businessSuffix:e.target.value}))}/>
              </div>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Time In</label>
              <input className="inp" value={editCase.savedAt||""} onChange={e=>setEditCase(c=>({...c,savedAt:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Completed Time</label>
              <input className="inp" value={editCase.endedAt||""} placeholder="e.g. 02:30 PM" onChange={e=>setEditCase(c=>({...c,endedAt:e.target.value}))}/>
            </div>
          </div>

          {/* Inbound email fields */}
          {!isEditSC&&(
            <div style={{marginBottom:12,padding:"10px 12px",background:"var(--entry-bg)",border:"1px solid var(--border)",borderRadius:8}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:8,textTransform:"uppercase",letterSpacing:".6px"}}>Email Details</div>
              <div className="field" style={{marginBottom:8}}>
                <label>Email Address</label>
                <input className="inp" value={editCase.emailAddress||""} onChange={e=>setEditCase(c=>({...c,emailAddress:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                {["clarification","completed"].map(v=>(
                  <label key={v} className={`radio-label${editCase.emailType===v?" selected-"+(v==="clarification"?"clarif":"complete"):""}`}>
                    <input type="radio" name="editEmailType" checked={editCase.emailType===v} onChange={()=>setEditCase(c=>({...c,emailType:v}))} style={{display:"none"}}/>
                    {v==="clarification"?"Clarification":"Completed"}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Entries */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:8,textTransform:"uppercase",letterSpacing:".6px"}}>{isEditSC?"Site Comments":"Assumptions"}</div>
            {(editCase.entries||[]).map((e,ei)=>(
              <div key={e.id||ei} style={{background:"var(--entry-bg)",border:"1px solid var(--border)",padding:"10px 12px",marginBottom:8,borderRadius:8}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--accent)"}}>{isEditSC?`SC #${e.number||ei+1}`:`Assumption ${ei+1}`}</span>
                  <button className="entry-del" onClick={()=>setEditCase(c=>({...c,entries:c.entries.filter((_,i)=>i!==ei)}))}>
                    <Icon name="trash" size={12} color="var(--red)"/>
                  </button>
                </div>
                {isEditSC&&<div className="field" style={{marginBottom:6}}><label>SC #</label><input className="inp" value={e.number||""} onChange={ev=>setEditCase(c=>({...c,entries:c.entries.map((x,i)=>i===ei?{...x,number:ev.target.value}:x)}))}/></div>}
                <div className="field" style={{marginBottom:6}}><label>Note</label><textarea className="inp" rows={2} value={e.note||""} onChange={ev=>setEditCase(c=>({...c,entries:c.entries.map((x,i)=>i===ei?{...x,note:ev.target.value}:x)}))}/></div>
                <div className="field" style={{marginBottom:0}}><label>Clarification</label><textarea className="inp" rows={2} value={e.clarification||""} onChange={ev=>setEditCase(c=>({...c,entries:c.entries.map((x,i)=>i===ei?{...x,clarification:ev.target.value}:x)}))}/></div>
              </div>
            ))}
          </div>

          <div className="modal-btns">
            <button className="btn btn-ghost" onClick={()=>setEditCase(null)}>Cancel</button>
            <button className="btn btn-save" onClick={()=>{onUpdateCase&&onUpdateCase(editCase._id,editCase);setEditCase(null);showToast("Case updated ✅");}}>Save Changes</button>
          </div>
        </div></div>
  )
}
