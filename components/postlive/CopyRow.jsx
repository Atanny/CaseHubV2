import { useState } from 'react';
import { copyToClipboard } from '../../lib/helpers';

export function CopyRow({ label, value, groupColor, groupBorder }) {
  const [c,setC]=useState(false);
  const empty = !value || !value.trim();
  const handleClick = () => {
    if(empty) return;
    copyToClipboard(value).then(()=>{setC(true);setTimeout(()=>setC(false),1800);});
  };
  return (
    <div
      className="copy-row-wrap"
      onClick={handleClick}
      title={empty ? undefined : "Click to copy"}
      style={{cursor: empty ? "default" : "pointer", userSelect:"none", position:"relative", ...(groupColor?{background:groupColor}:{}), ...(groupBorder?{borderColor:groupBorder}:{})}}
    >
      <div className="copy-row-label" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span>{label}</span>
        {!empty && <span style={{fontSize:10,opacity:c?1:0.45,color:c?"var(--green)":"var(--muted)",transition:"opacity .2s",fontWeight:700}}>{c?"✓ Copied":"Copy"}</span>}
      </div>
      {empty ? (
        <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",padding:"3px 0"}}>—</div>
      ) : (
        <div className="copy-row-val">{value}</div>
      )}
    </div>
  );
}

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

