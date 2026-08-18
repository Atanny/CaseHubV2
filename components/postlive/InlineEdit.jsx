import { useState } from 'react';

export default function InlineEdit({ value, onSave }) {
  const [v,setV]=useState(value);
  return (
    <div style={{flex:1,display:"flex",gap:6}}>
      <input className="inline-edit-inp" value={v} onChange={e=>setV(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&onSave(v)}/>
      <button className="inline-save-btn" onClick={()=>onSave(v)}>✓</button>
    </div>
  );
}

