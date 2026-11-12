import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'

// Password input with show/hide eye toggle (Figma auth screens)
export function PasswordField({ value, onChange, onKeyDown, disabled, placeholder }) {
  const [show,setShow]=useState(false);
  return (
    <div style={{position:"relative"}}>
      <input className="inp" type={show?"text":"password"} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} disabled={disabled} style={{paddingRight:44}}/>
      <button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?"Hide password":"Show password"} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",padding:0}}>
        <Icon name={show?"eyeOff":"eye"} size={16} color="var(--accent)"/>
      </button>
    </div>
  );
}
