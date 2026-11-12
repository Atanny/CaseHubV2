export function AuthCheck({ checked, onChange, children }) {
  return (
    <label className="auth-check" onClick={e=>{e.preventDefault();onChange(!checked);}}>
      <span className="auth-check-box" style={{background:checked?"var(--accent)":"#fff"}}>{checked&&<span style={{color:"#fff",fontSize:12,lineHeight:1}}>✓</span>}</span>
      <span>{children}</span>
    </label>
  );
}
