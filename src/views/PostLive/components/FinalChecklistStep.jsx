import { StepCard } from './StepCard'
import { cls } from '@/utils/classNames'

export function FinalChecklistStep({ activePage, form, formRef, goBack, handleSave, isEditMode, isSC, onSave, p2Key, phase2StartRef, setF, setFooterElapsed, setPhase2Elapsed, setResumeElapsed, startTimeRef, step7Done }) {
  return (
    <StepCard num={8} title="Final Checklist" subtitle="Check all of the changes you've made — all checklists are required" done={step7Done} isOpen={activePage===5}>
          <p style={{fontSize:12,color:"var(--muted)",marginBottom:11}}>All items must be checked <span className="req">*</span></p>
          {(()=>{
            const closeItem = isSC ? ["closeSiteComment","Close Your Site Comment"] : ["closeInboundCase","Close Your Inbound Case"];
            const groups = [
              {label:"First Steps (all items must be checked)*", items:[closeItem, ["backup","Upload Your Before/After Backup"], ["caseComment","Upload Your Case Comment"]]},
              {label:"Second Steps (all items must be checked)*", items:[["completeJob","Complete/Clarify Your Case"], ["emailSales","Email Your Requestor"], ["trackerChecklist","Tag Your Status Tracker"]]},
              {label:"Last Steps (all items must be checked)*", items:[["combinedTracker","Fill Combined Tracker Form"], ["qaChecklist","Fill QA Checklist Form"], ["completeStatus","Tracker Checklist"]]},
            ];
            const renderItem=([k,l])=>{
              return (
              <div key={k}>
                <label className={cls("check-label",form.checklist[k]&&"checked")} style={{width:"fit-content"}}><input type="checkbox" checked={!!form.checklist[k]} onChange={e=>{
                  const newChecklist={...form.checklist,[k]:e.target.checked};
                  if(phase2StartRef.current===null){
                    const allThree=newChecklist.backup&&newChecklist.caseComment&&newChecklist.combinedTracker;
                    if(allThree){
                      const t=Date.now();
                      phase2StartRef.current=t;
                      if(p2Key&&typeof window!=="undefined") localStorage.setItem(p2Key,String(t));
                      setFooterElapsed(f=>f);
                      setResumeElapsed(r=>r);
                      setPhase2Elapsed(0);
                    }
                  }
                  setF({checklist:newChecklist});
                }}/>{l}</label>
              </div>
              );
            };
            return groups.map(g=>(
              <div key={g.label} className="checklist-group">
                <label className="wizard-subsection-label">{g.label}</label>
                <div className="check-group" style={{flexDirection:"column"}}>
                  {g.items.map(renderItem)}
                </div>
              </div>
            ));
          })()}
          <div className="field" style={{marginTop:14,marginBottom:0}}>
            <label style={{fontSize:10,fontWeight:700,color:"var(--accent)",marginBottom:4,display:"block",textTransform:"uppercase",letterSpacing:".7px"}}>Tracker Link</label>
            <input
              className="inp"
              type="url"
              placeholder="https://..."
              value={form.trackerChecklistLink||""}
              onChange={e=>setF({trackerChecklistLink:e.target.value})}
              style={{fontSize:12}}
            />
          </div>
          <div className="wizard-nav" style={{justifyContent:"space-between"}}>
            <div>{activePage>1 && <button type="button" className="wizard-nav-btn wizard-nav-back" onClick={goBack} aria-label="Back">←</button>}</div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-primary" onClick={handleSave}>Submit This Case</button>
            </div>
          </div>
        </StepCard>
  )
}
