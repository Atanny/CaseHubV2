import { useState } from 'react';
import { copyToClipboard } from '../../lib/helpers';

export default function GreetingRow({ greetingMessages, caseNum, inboundNum, isSC }) {
  const DEFAULT_MSGS = [{ id:"default", label:"Check-in", base:"Hi po Ms. Tina, magpapacheck lang po", fillType:"caseNum" }];
  const msgs = (greetingMessages&&greetingMessages.length>0) ? greetingMessages : DEFAULT_MSGS;
  const [copiedId,setCopiedId]=useState(null);

  // Build the filled message — radio picks which number(s) to insert
  const buildMsg=(m)=>{
    const b=(m.base||m.template||"Hi po Ms. Tina, magpapacheck lang po").trim();
    if(m.fillType==="none")        return b;
    if(m.fillType==="siteComment") return `${b} Site Comment #${caseNum||"—"}`;
    if(m.fillType==="caseNum")     return `${b} Case #${caseNum||"—"}`;
    if(m.fillType==="inbound")     return `${b} Inbound #${inboundNum||"—"}`;
    return `${b} Case #${caseNum||"—"}`;
  };

  const copy=(m)=>{
    const txt=buildMsg(m);
    copyToClipboard(txt).then(()=>{setCopiedId(m.id);setTimeout(()=>setCopiedId(null),1800);});
  };

  if(!caseNum) return null;

  return (
    <div className="copy-row-wrap" style={{paddingBottom:10,background:"rgba(1,118,211,.07)",borderColor:"rgba(1,118,211,.22)"}}>
      <div className="copy-row-label" style={{marginBottom:8}}>Messages</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {msgs.map(m=>(
          <button
            key={m.id}
            onClick={()=>copy(m)}
            title={buildMsg(m)}
            style={{
              padding:"4px 12px",
              borderRadius:20,
              border:`1px solid ${copiedId===m.id?"var(--green)":"rgba(1,118,211,.35)"}`,
              background:copiedId===m.id?"rgba(16,185,129,.12)":"rgba(1,118,211,.1)",
              color:copiedId===m.id?"var(--green)":"var(--accent)",
              fontSize:11,fontWeight:600,cursor:"pointer",
              fontFamily:"'Poppins',sans-serif",
              transition:".18s",userSelect:"none",
              whiteSpace:"nowrap",
            }}
          >
            {copiedId===m.id?"✓ Copied":m.label||"Message"}
          </button>
        ))}
      </div>
    </div>
  );
}

