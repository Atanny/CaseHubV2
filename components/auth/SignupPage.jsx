import { useState } from 'react';
import AuthLogo from './AuthLogo';

export default function SignupPage({ onSignup, goLogin }) {
  const [form,setForm]=useState({name:"",email:"",password:"",confirm:""});
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const submit=async()=>{
    if(!form.name||!form.email||!form.password){setErr("Please fill all fields");return;}
    if(form.password.length<6){setErr("Password must be at least 6 characters");return;}
    if(form.password!==form.confirm){setErr("Passwords do not match");return;}
    setLoading(true);setErr("");
    try{
      const res=await fetch("/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await res.json();
      if(!res.ok){setErr(data.error||"Sign up failed");return;}
      // Email confirmation required (Supabase default)
      if(data.needsConfirmation){
        setErr(""); 
        setForm(f=>({...f,_confirmed:true,_msg:data.message}));
        return;
      }
      localStorage.setItem("ch_token",data.access_token);
      localStorage.setItem("ch_refresh",data.refresh_token);
      localStorage.setItem("ch_user",JSON.stringify(data.user));
      onSignup(data.user);
    }catch(e){setErr("Network error — please try again");}
    finally{setLoading(false);}
  };
  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthLogo/>
        <div className="auth-title">Create account</div>
        <div className="auth-sub">Join your CaseHub workspace</div>
        {err&&<div style={{background:"var(--btn-cancel-bg)",border:"1px solid var(--btn-cancel-border)",color:"var(--btn-cancel-text)",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:16,textAlign:"center"}}>{err}</div>}
        {form._confirmed&&<div style={{background:"rgba(16,185,129,.1)",border:"1px solid var(--green)",color:"var(--green)",borderRadius:8,padding:"14px",fontSize:13,marginBottom:16,textAlign:"center",lineHeight:1.6}}>✅ Account created!<br/><span style={{opacity:.8,fontSize:12}}>{form._msg}</span><br/><button className="auth-link" style={{marginTop:8,display:"block",textAlign:"center"}} onClick={goLogin}>← Back to Sign In</button></div>}
        {!form._confirmed&&<><div className="field"><label>Full Name</label><input className="inp" placeholder="Your name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} disabled={loading}/></div>
        <div className="field"><label>Email</label><input className="inp" type="email" placeholder="you@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} disabled={loading}/></div>
        <div className="field"><label>Password</label><input className="inp" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} disabled={loading}/></div>
        <div className="field"><label>Confirm Password</label><input className="inp" type="password" placeholder="••••••••" value={form.confirm} onChange={e=>setForm(f=>({...f,confirm:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} disabled={loading}/></div></>}
        {!form._confirmed&&<button className="btn btn-save" style={{width:"100%",justifyContent:"center",marginTop:4}} onClick={submit} disabled={loading}>{loading?"Creating account...":"Create Account →"}</button>}
        {!form._confirmed&&<><div className="auth-divider">or</div>
        <div style={{textAlign:"center",fontSize:13,color:"var(--muted)"}}>Already have an account? <button className="auth-link" onClick={goLogin}>Sign in</button></div></>}
      </div>
    </div>
  );
}

