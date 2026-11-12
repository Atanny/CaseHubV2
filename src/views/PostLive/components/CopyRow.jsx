import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { copyToClipboard } from '@/utils/clipboard'

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
      style={{cursor: empty ? "default" : "pointer", userSelect:"none", position:"relative", background:"#fff", borderColor:"var(--border)"}}
    >
      <div className="copy-row-label" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span>{label}</span>
        {!empty && <span style={{opacity:c?1:0.55,color:c?"var(--green)":"var(--muted)",transition:"opacity .2s",display:"flex",alignItems:"center"}}>{c?<span style={{fontSize:10,fontWeight:700}}>✓</span>:<Icon name="copy" size={12} color="var(--muted)"/>}</span>}
      </div>
      {empty ? (
        <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",padding:"3px 0"}}>—</div>
      ) : (
        <div className="copy-row-val">{value}</div>
      )}
    </div>
  );
}
