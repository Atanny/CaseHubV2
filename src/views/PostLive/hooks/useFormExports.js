import { copyToClipboard } from '@/utils/clipboard'

export function useFormExports({ formRef, isSC, setCopiedAll, setModal, showToast, startTimeRef, step1Done, step4Done, step7Done }) {
  const buildEntriesText = ()=>{
    const es=formRef.current.entries;
    let out="Post-Live Amends:";
    es.forEach(e=>{
      if(!e.number&&!e.note&&!e.clarification)return;
      if(isSC){
        out+=`\n\nSite Comment #${e.number}:\n`;
        if(e.note)out+=`Note: ${e.note}`;
        if(e.clarification)out+=`\n\nClarification:  ${e.clarification}`;
      } else {
        out+=`\n\nAssumption:\n`;
        if(e.note)out+=`Note: ${e.note}`;
        if(e.clarification)out+=`\n\nClarification:  ${e.clarification}`;
      }
    });
    return out.trimEnd();
  };
  const buildEmailText = ()=>{
    const f=formRef.current;
    const tl=f.emailType==="clarification"?"Clarification email sent to":"Email completed sent to";
    return `${buildEntriesText()}\n\n${tl} ${f.emailAddress||"—"}.`;
  };

  const handleCopyAll=()=>{ const txt=isSC?buildEntriesText():buildEmailText(); copyToClipboard(txt).then(()=>{setCopiedAll(true);setTimeout(()=>setCopiedAll(false),1800);}); };
  const handleSave=()=>{
    if(!step1Done)return showToast("Complete Step 1 first","error");
    if(!step4Done)return showToast("All 3 devices must be checked","error");
    if(!step7Done)return showToast("Complete the Final Checklist first","error");
    setModal("save");
  };

  const handleDraft=()=>{
    if(!step1Done)return showToast("Complete Step 1 first","error");
    setModal("draft");
  };
  
  const getCleanForm = () => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current)/1000);
    const strip=(imgs)=>(imgs||[]).map(({_file,url,name,id,path,_inDB})=>({url,name,id,path:path||id,_inDB:_inDB||false}));
    return {...formRef.current,images:strip(formRef.current.images),backupImages:strip(formRef.current.backupImages),_elapsedAtSave:elapsed,_startTime:startTimeRef.current,trackerChecklistLink:formRef.current.trackerChecklistLink||""};
  };

  return { buildEmailText, buildEntriesText, getCleanForm, handleCopyAll, handleDraft, handleSave }
}
