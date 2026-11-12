import { useState } from 'react'
import { copyToClipboard } from '@/utils/clipboard'

// ── CopyCaseBtn — tiny inline copy icon for session log case numbers ──
export function CopyCaseBtn({ caseNum }) {
  const [copied,setCopied]=useState(false);
  const handleClick=(e)=>{
    e.stopPropagation();
    copyToClipboard(caseNum).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500);});
  };
  return (
    <button onClick={handleClick} title="Copy case number" style={{background:"none",border:"none",cursor:"pointer",padding:"0 2px",color:copied?"var(--green)":"var(--muted)",fontSize:10,lineHeight:1,transition:"color .2s",flexShrink:0,display:"inline-flex",alignItems:"center"}}>
      {copied?"✓":"Copy"}
    </button>
  );
}
