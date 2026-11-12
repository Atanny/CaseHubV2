import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { AuthCheck } from './components/AuthCheck'
import { AuthLogo } from './components/AuthLogo'
import { PasswordField } from './components/PasswordField'
import * as authService from '@/services/authService'

export function SignupPage({ onSignup, goLogin }) {
  const [form,setForm]=useState({first:"",last:"",email:"",password:"",confirm:""});
  const [agree,setAgree]=useState(false);
  const [err,setErr]=useState("");
  const [done,setDone]=useState(null);
  const [loading,setLoading]=useState(false);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const submit=async()=>{
    const name=`${form.first.trim()} ${form.last.trim()}`.trim();
    if(!form.first.trim()||!form.email||!form.password){setErr("Please fill all fields");return;}
    if(form.password.length<6){setErr("Password must be at least 6 characters");return;}
    if(form.password!==form.confirm){setErr("Passwords do not match");return;}
    if(!agree){setErr("Please agree to the Terms And Conditions");return;}
    setLoading(true);setErr("");
    try{
      const res=await authService.signUp({name,email:form.email,password:form.password,confirm:form.confirm});
      const data=await res.json();
      if(!res.ok){setErr(data.error||"Sign up failed");return;}
      if(data.needsConfirmation){setDone(data.message);return;}
      localStorage.setItem("ch_token",data.access_token);
      localStorage.setItem("ch_refresh",data.refresh_token);
      localStorage.setItem("ch_user",JSON.stringify(data.user));
      onSignup(data.user);
    }catch(e){setErr("Network error — please try again");}
    finally{setLoading(false);}
  };
  return (
    <div className="auth-page">
      <div className="auth-card" style={{maxWidth:580}}>
        <AuthLogo/>
        <div className="auth-rule"/>
        {err&&<div className="auth-msg err">{err}</div>}
        {done?(
          <div className="auth-msg ok" style={{lineHeight:1.6}}>Account created!<br/><span style={{opacity:.85,fontSize:12}}>{done}</span><br/><button className="auth-link" style={{marginTop:8}} onClick={goLogin}>Back To Login</button></div>
        ):(<>
          <div className="auth-row">
            <div className="field"><label className="auth-label">First Name</label><input className="inp" placeholder="John" value={form.first} onChange={set("first")} disabled={loading}/></div>
            <div className="field"><label className="auth-label">Last Name</label><input className="inp" placeholder="Doe" value={form.last} onChange={set("last")} disabled={loading}/></div>
          </div>
          <div className="field"><label className="auth-label">Email Address</label><input className="inp" type="email" placeholder="John.Doe@Gmail.Com" value={form.email} onChange={set("email")} disabled={loading}/></div>
          <div className="auth-row">
            <div className="field"><label className="auth-label">Password</label><PasswordField placeholder="" value={form.password} onChange={set("password")} disabled={loading}/></div>
            <div className="field"><label className="auth-label">Confirm Password</label><PasswordField placeholder="" value={form.confirm} onChange={set("confirm")} onKeyDown={e=>e.key==="Enter"&&submit()} disabled={loading}/></div>
          </div>
          <AuthCheck checked={agree} onChange={setAgree}>By Checking This, You Are Agreeing With Our Terms And Conditions.</AuthCheck>
          <div className="auth-rule"/>
          <button className="btn btn-primary btn-noicon" style={{width:"100%",justifyContent:"center",padding:"14px 20px"}} onClick={submit} disabled={loading}>{loading?"Creating account...":"Sign Up Now"}<Icon name="login" size={16} color="#fff"/></button>
          <div className="auth-foot">Already Have An Account? <button className="auth-link" onClick={goLogin}>Log In Now</button></div>
        </>)}
      </div>
    </div>
  );
}
