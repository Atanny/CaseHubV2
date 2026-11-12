export function BreakConfirmModal({ breakConfirmData, formRef, getCleanForm, isResumingDraft, onSave, onSaveDraftDirect, onStartBreak, onStartOpenHour, setBreakConfirmData, setDraftSaving, setModal, showToast, step1Done, step4Done, step7Done }) {
  return (
    <div className="modal-bg"><div className="modal">
          <div style={{marginBottom:14,fontSize:36}}>{breakConfirmData.label.split(" ")[0]}</div>
          <h3 style={{marginBottom:6}}>{breakConfirmData.isOpenHour?"Starting Open Hour / Meeting":`Starting ${breakConfirmData.label} Break`}</h3>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:20,lineHeight:1.6}}>How would you like to save your current case before going {breakConfirmData.isOpenHour?"into Open Hour":"on break"}?</p>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
            {!isResumingDraft&&(<button
              className="btn btn-draft"
              style={{borderRadius:8,justifyContent:"flex-start",padding:"12px 16px",textAlign:"left",display:"flex",alignItems:"center",gap:10}}
              onClick={async()=>{
                if(!step1Done){showToast("Fill in Case Information (Step 1) first","error");return;}
                setModal(null);
                const data=breakConfirmData;
                setBreakConfirmData(null);
                setDraftSaving(true);
                try{
                  await onSaveDraftDirect(getCleanForm());
                  if(data.isOpenHour){
                    setTimeout(()=>onStartOpenHour&&onStartOpenHour(),80);
                  } else {
                    setTimeout(()=>onStartBreak&&onStartBreak(data.label.replace(/[☕🧘🍱]/g,"").trim()+" break",data.mins),80);
                  }
                }catch(e){
                  setDraftSaving(false);
                  showToast("Failed to suspend case — check connection","error");
                }
              }}
            >
              <span style={{fontSize:18}}>💾</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>Save as Suspended / Draft</div>
                <div style={{fontSize:11,opacity:.75,fontWeight:400}}>Requires Case Information (Step 1)</div>
              </div>
            </button>)}
            <button
              className="btn btn-save"
              style={{borderRadius:8,justifyContent:"flex-start",padding:"12px 16px",textAlign:"left",display:"flex",alignItems:"center",gap:10}}
              onClick={()=>{
                if(!step1Done){showToast("Complete Step 1 (Case Information) first","error");return;}
                if(!step4Done){showToast("All 3 devices must be checked","error");return;}
                if(!step7Done){showToast("Complete the Final Checklist first","error");return;}
                const data=breakConfirmData;
                setModal(null);
                setBreakConfirmData(null);
                onSave&&onSave({...formRef.current,trackerChecklistLink:formRef.current.trackerChecklistLink||"",_breakPending:true});
                if(data.isOpenHour){
                  setTimeout(()=>onStartOpenHour&&onStartOpenHour(),80);
                } else {
                  setTimeout(()=>onStartBreak&&onStartBreak(data.label.replace(/[☕🧘🍱]/g,"").trim()+" break",data.mins),80);
                }
              }}
            >
              <span style={{fontSize:18}}>✅</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>Save Case</div>
                <div style={{fontSize:11,opacity:.75,fontWeight:400}}>Requires all steps complete</div>
              </div>
            </button>
          </div>
          <div style={{borderTop:"1px solid var(--glass-border)",margin:"4px 0 14px",paddingTop:14}}>
            <button
              className="btn btn-ghost"
              style={{borderRadius:8,justifyContent:"flex-start",padding:"12px 16px",textAlign:"left",display:"flex",alignItems:"center",gap:10,width:"100%"}}
              onClick={()=>{
                const data=breakConfirmData;
                setModal(null);
                setBreakConfirmData(null);
                // Don't save/draft anything — the tab stays exactly as-is, just paused.
                if(data.isOpenHour){
                  onStartOpenHour&&onStartOpenHour();
                } else {
                  onStartBreak&&onStartBreak(data.label.replace(/[☕🧘🍱]/g,"").trim()+" break",data.mins);
                }
              }}
            >
              <span style={{fontSize:18}}>⏸️</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>Break for a while</div>
                <div style={{fontSize:11,opacity:.75,fontWeight:400}}>Don&apos;t save — case stays open in this tab, timer pauses and resumes after</div>
              </div>
            </button>
          </div>
          <div className="modal-btns" style={{justifyContent:"center"}}>
            <button className="btn btn-ghost" style={{borderRadius:20}} onClick={()=>{setModal(null);setBreakConfirmData(null);}}>Cancel</button>
          </div>
        </div></div>
  )
}
