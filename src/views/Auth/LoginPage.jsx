import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { AuthCheck } from './components/AuthCheck'
import { AuthLogo } from './components/AuthLogo'
import { PasswordField } from './components/PasswordField'
import * as authService from '@/services/authService'

export function LoginPage({ onLogin, goSignup }) {
  const [form,setForm]=useState(()=>({email:(typeof window!=="undefined"&&localStorage.getItem("ch_remember_email"))||"",password:""}));
  const [remember,setRemember]=useState(()=>typeof window!=="undefined"&&!!localStorage.getItem("ch_remember_email"));
  const [mode,setMode]=useState("login"); // login | reset
  const [err,setErr]=useState("");
  const [info,setInfo]=useState("");
  const [loading,setLoading]=useState(false);
  const submit=async()=>{
    if(!form.email||!form.password){setErr("Please fill all fields");return;}
    setLoading(true);setErr("");
    try{
      const res=await authService.signIn(form);
      const data=await res.json();
      if(!res.ok){setErr(data.error||"Sign in failed");return;}
      if(remember) localStorage.setItem("ch_remember_email",form.email); else localStorage.removeItem("ch_remember_email");
      localStorage.setItem("ch_token",data.access_token);
      localStorage.setItem("ch_refresh",data.refresh_token);
      localStorage.setItem("ch_user",JSON.stringify(data.user));
      onLogin(data.user);
    }catch(e){setErr("Network error — please try again");}
    finally{setLoading(false);}
  };
  const sendReset=async()=>{
    if(!form.email){setErr("Enter your email address");return;}
    setLoading(true);setErr("");setInfo("");
    try{
      const res=await authService.requestPasswordReset({email:form.email});
      const data=await res.json();
      if(!res.ok){setErr(data.error||"Could not send reset link");return;}
      setInfo(data.message);
    }catch(e){setErr("Network error — please try again");}
    finally{setLoading(false);}
  };
  return (
    <div className="auth-page">
      <div className="auth-card" style={{maxWidth:470}}>
        <AuthLogo/>
        <div className="auth-rule"/>
        {err&&<div className="auth-msg err">{err}</div>}
        {info&&<div className="auth-msg ok">{info}</div>}
        <div className="field"><label className="auth-label">Email Address</label><input className="inp" type="email" placeholder="John.Doe@Gmail.Com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?submit():sendReset())} disabled={loading}/></div>
        {mode==="login"?(<>
          <div className="field"><label className="auth-label">Password</label><PasswordField placeholder="" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} disabled={loading}/></div>
          <AuthCheck checked={remember} onChange={setRemember}>Remember Me</AuthCheck>
          <div className="auth-rule"/>
          <button className="btn btn-primary btn-noicon" style={{width:"100%",justifyContent:"center",padding:"14px 20px"}} onClick={submit} disabled={loading}>{loading?"Signing in...":"Login"}<Icon name="login" size={16} color="#fff"/></button>
          <div className="auth-foot">Forget Password? <button className="auth-link" onClick={()=>{setMode("reset");setErr("");setInfo("");}}>Reset Your Password Now</button></div>
          <div className="auth-foot">Dont Have An Account Yet? <button className="auth-link" onClick={goSignup}>Sign Up Now</button></div>
        </>):(<>
          <div className="auth-rule"/>
          <button className="btn btn-primary btn-noicon" style={{width:"100%",justifyContent:"center",padding:"14px 20px"}} onClick={sendReset} disabled={loading}>{loading?"Sending...":"Send Reset Link"}</button>
          <div className="auth-foot"><button className="auth-link" onClick={()=>{setMode("login");setErr("");setInfo("");}}>Back To Login</button></div>
        </>)}
      </div>
    </div>
  );
}
