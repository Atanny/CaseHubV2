import { useContext } from 'react'
import { FngContext } from '../FngContext'

export function FngSection({title,vals,sk,children}){
  const {copyAll,copiedAll}=useContext(FngContext);
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,borderBottom:'1px solid var(--border)',paddingBottom:6}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'var(--muted)',fontFamily:"'Poppins',sans-serif"}}>{title}</div>
        {(vals||[]).filter(Boolean).length>0&&<button onClick={()=>copyAll(vals,sk)} style={{padding:'3px 10px',fontSize:10,background:copiedAll===sk?'var(--green)':'var(--card2)',color:copiedAll===sk?'#fff':'var(--muted)',border:'1px solid var(--border)',cursor:'pointer',fontWeight:700,borderRadius:20,transition:'.15s',flexShrink:0}}>{copiedAll===sk?'Copied All':'Copy All'}</button>}
      </div>
      {children}
    </div>
  );
}
