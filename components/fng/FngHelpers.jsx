import { useState, useContext, createContext } from 'react';
import { copyToClipboard } from '../../lib/helpers';

export const FngCtx = createContext({});

export function CopyCell({val,id}){
  const {copy,copied}=useContext(FngCtx);
  const done=copied===id;
  return (
    <div
      onClick={()=>val&&copy(val,id)}
      title={val?"Click to copy":""}
      style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        gap:8,padding:'6px 14px',marginBottom:4,minHeight:34,borderRadius:7,
        background: done?'rgba(16,185,129,.12)':'var(--entry-bg)',
        border: done?'1px solid var(--green)':'1px solid var(--border)',
        cursor: val?'pointer':'default',
        transition:'background .15s,border .15s',
        userSelect:'none',
      }}
      onMouseEnter={e=>{if(val&&!done){e.currentTarget.style.background='var(--card2)';e.currentTarget.style.borderColor='var(--accent)';}}}
      onMouseLeave={e=>{if(!done){e.currentTarget.style.background='var(--entry-bg)';e.currentTarget.style.borderColor='var(--border)';}}}
    >
      <span style={{flex:1,fontSize:12,fontFamily:'monospace',color:val?'var(--text)':'var(--muted)',wordBreak:'break-all'}}>{val||'—'}</span>
      {val&&<span style={{fontSize:10,fontWeight:700,flexShrink:0,color:done?'var(--green)':'var(--muted)',opacity:done?1:.5,transition:'.15s'}}>{done?'✓ Copied':'⌘ Copy'}</span>}
    </div>
  );
}

export function FngSection({title,vals,sk,children}){
  const {copyAll,copiedAll}=useContext(FngCtx);
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,borderBottom:'1px solid var(--border)',paddingBottom:6}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'var(--muted)',fontFamily:"'Poppins',sans-serif"}}>{title}</div>
        {(vals||[]).filter(Boolean).length>0&&<button onClick={()=>copyAll(vals,sk)} style={{padding:'3px 10px',fontSize:10,background:copiedAll===sk?'var(--green)':'var(--card2)',color:copiedAll===sk?'#fff':'var(--muted)',border:'1px solid var(--border)',cursor:'pointer',fontWeight:700,borderRadius:6,transition:'.15s',flexShrink:0}}>{copiedAll===sk?'✓ Copied All':'Copy All'}</button>}
      </div>
      {children}
    </div>
  );
}

export function DynList({field,placeholder}){
  const {form,setItem,removeItem,addItem}=useContext(FngCtx);
  return (
    <div>
      {form[field].map((val,i)=>(
        <div key={i} style={{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}>
          <input className="inp" style={{fontSize:12,flex:1}} placeholder={`${placeholder} ${i+1}`} value={val} onChange={e=>setItem(field,i,e.target.value)}/>
          <button onClick={()=>removeItem(field,i)} style={{background:'var(--btn-cancel-bg)',border:'1px solid var(--btn-cancel-border)',color:'var(--btn-cancel-text)',borderRadius:6,padding:'5px 9px',fontSize:12,cursor:'pointer',flexShrink:0}} title="Remove">✕</button>
        </div>
      ))}
      <button onClick={()=>addItem(field)} style={{background:'none',border:'2px dashed var(--border)',borderRadius:7,color:'var(--muted)',padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',width:'100%',transition:'.15s',fontFamily:"'Poppins',sans-serif"}} onMouseOver={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}} onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)';}}>+ Add {placeholder}</button>
    </div>
  );
}

