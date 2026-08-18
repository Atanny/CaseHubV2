export default async function downloadCase(c) {
  const isSC=c._mode==="siteComment"; const entries=(c.entries||[]);
  let txt="Post-Live Amends:\n";
  entries.forEach(e=>{if(!e.number&&!e.note&&!e.clarification)return;txt+="\n";if(isSC){txt+=`Site Comment #${e.number}:\n`;if(e.note)txt+=`Note: ${e.note}\n`;if(e.clarification)txt+=`\nClarification: ${e.clarification}\n`;}else{txt+=`Assumption:\n`;if(e.note)txt+=`Note: ${e.note}\n`;if(e.clarification)txt+=`\nClarification: ${e.clarification}\n`;}txt+="\n";});
  if(!isSC&&c.emailAddress){const tl=c.emailType==="clarification"?"Clarification email sent to":"Email completed sent to";txt+=`\n${tl} ${c.emailAddress}.`;}
  const meta=[`Post-Live Amends Case Export`,"─".repeat(36),`Saved: ${c.savedAt}`,`Type: ${isSC?"Site Comment":"Inbound Email"}`,`Case #: ${c.caseNum||"—"}`,`Account #: ${c.accountNum||"—"}`,...(isSC?[]:[`Inbound #: ${c.inboundNum||"—"}`]),`Amend Type: ${c.amendType||"—"}`,``,txt].join("\n");
  const bizPart=(c.businessName||"").trim();
  const cx3=(c._caseComplexity||"minor");const cxLabel3=cx3==="major"?"Major":cx3==="complex"?"Complex":"Minor";const folderName=`${cxLabel3} ${c.caseNum||"unknown"}${bizPart?" "+bizPart:""}`.replace(/[^a-zA-Z0-9 _()-]/g,"").replace(/\s+/g," ").trim();

  // Try folder picker API (Chrome/Edge) — save files into a real folder
  if(window.showDirectoryPicker){
    try{
      const dir=await getOrPickDir();
      const caseDir=await dir.getDirectoryHandle(folderName,{create:true});
      // Save case data text
      const txtHandle=await caseDir.getFileHandle("case_data.txt",{create:true});
      const txtWr=await txtHandle.createWritable();
      await txtWr.write(new Blob([meta],{type:"text/plain"}));
      await txtWr.close();
      // Save images
      for(const img of [...(c.images||[]),...(c.backupImages||[])]){
        try{
          const r=await fetch(img.url);const blob=await r.blob();
          const ext=(img.name||"screenshot").split(".").pop()||"png";
          const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
          const fh=await caseDir.getFileHandle(`${baseName}.${ext}`,{create:true});
          const wr=await fh.createWritable();await wr.write(blob);await wr.close();
        }catch(e){console.warn("Image fetch failed:",e);}
      }
      return;
    }catch(e){
      if(e.name==="AbortError")return;
    }
  }
  // Fallback: download case_data.txt + each image with folder/filename path
  const txtBlob=new Blob([meta],{type:"text/plain"});
  const ta=document.createElement("a");ta.href=URL.createObjectURL(txtBlob);
  ta.download=`${folderName}/case_data.txt`;ta.click();URL.revokeObjectURL(ta.href);
  await new Promise(r=>setTimeout(r,120));
  for(const img of [...(c.images||[]),...(c.backupImages||[])]){
    try{
      const r=await fetch(img.url);const blob=await r.blob();
      const ext=(img.name||"screenshot").split(".").pop()||"png";
      const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
      const a=document.createElement("a");a.href=URL.createObjectURL(blob);
      a.download=`${folderName}/${baseName}.${ext}`;
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      await new Promise(r=>setTimeout(r,120));
    }catch(e){console.warn("Image fetch failed:",e);}
  }
}

