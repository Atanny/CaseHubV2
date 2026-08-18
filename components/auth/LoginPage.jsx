import { useState } from 'react';
import AuthLogo from './AuthLogo';

export default function LoginPage({ onLogin, goSignup }) {
  const [form,setForm]=useState({email:"",password:""});
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const submit=async()=>{
    if(!form.email||!form.password){setErr("Please fill all fields");return;}
    setLoading(true);setErr("");
    try{
      const res=await fetch("/api/auth/signin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await res.json();
      if(!res.ok){setErr(data.error||"Sign in failed");return;}
      // Persist session to localStorage
      localStorage.setItem("ch_token",data.access_token);
      localStorage.setItem("ch_refresh",data.refresh_token);
      localStorage.setItem("ch_user",JSON.stringify(data.user));
      onLogin(data.user);
    }catch(e){setErr("Network error — please try again");}
    finally{setLoading(false);}
  };
  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthLogo/>
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Sign in to your CaseHub workspace</div>
        {err&&<div style={{background:"var(--btn-cancel-bg)",border:"1px solid var(--btn-cancel-border)",color:"var(--btn-cancel-text)",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:16,textAlign:"center"}}>{err}</div>}
        <div className="field"><label>Email</label><input className="inp" type="email" placeholder="you@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} disabled={loading}/></div>
        <div className="field"><label>Password</label><input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} disabled={loading}/></div>
        <button className="btn btn-save" style={{width:"100%",justifyContent:"center",marginTop:4}} onClick={submit} disabled={loading}>{loading?"Signing in...":"Sign In →"}</button>
        <div className="auth-divider">or</div>
        <div style={{textAlign:"center",fontSize:13,color:"var(--muted)"}}>Don't have an account? <button className="auth-link" onClick={goSignup}>Sign up</button></div>
      </div>
    </div>
  );
}

