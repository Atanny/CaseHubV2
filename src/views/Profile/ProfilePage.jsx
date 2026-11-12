import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Icon } from '@/components/ui/Icon'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import * as authService from '@/services/authService'
import * as imageService from '@/services/imageService'
import * as profileService from '@/services/profileService'
import { ShiftEndAlarmCard } from './components/ShiftEndAlarmCard'
import { ShiftStartAlarmCard } from './components/ShiftStartAlarmCard'
import { GreetingMessagesCard } from './components/GreetingMessagesCard'

export function ProfilePage({ user, setUser, onLogout, timerLimit, saveTimerLimit, qaLimit=10, saveQaLimit, shiftStartTime="", saveShiftStartTime, shiftStartWarnMins=10, saveShiftStartWarnMins, shiftEndTime="", saveShiftEndTime, shiftWarnMins=10, saveShiftWarnMins, specialRequestors=[], addRequestor, removeRequestor, onStartBreak, onStartOpenHour }) {
  const [editing,setEditing]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [toast,showToast]=useToast();
  const avatarInputRef=useRef();
  const [newReq,setNewReq]=useState("");
  const [addingReq,setAddingReq]=useState(false);
  const handleAddRequestor=()=>{
    const name=newReq.trim();
    if(!name)return showToast("Name required","error");
    if(specialRequestors.includes(name)){showToast("Already exists","error");return;}
    addRequestor(name);setNewReq("");setAddingReq(false);showToast(`Added ${name}!`);
  };

  const defNames=(name)=>{
    const n=(name||"User").trim().replace(/\s+/g,"_");
    return {beforeName:`Post_Live_Amend_Before_${n}_Amends`,afterName:`Post_Live_Amend_After_${n}_Amends`,screenshotName:`Post_Live_Amend_Screenshot_${n}_Amends`};
  };

  const defaultMsgs=[{id:"default",label:"Check-in",base:"Hi po Ms. Tina, magpapacheck lang po",fillType:"caseNum"}];
  const [form,setForm]=useState({
    name:user.name||"",email:user.email||"",role:user.role||"",
    beforeName:user.beforeName||defNames(user.name).beforeName,
    afterName:user.afterName||defNames(user.name).afterName,
    screenshotName:user.screenshotName||defNames(user.name).screenshotName,
    avatarUrl:user.avatarUrl||"",
    greetingMessages:(user.greetingMessages||defaultMsgs).map(m=>({...m,base:m.base||(m.template||"").replace("[Case #]","").replace("[Inbound #]","").replace("[Type]","").trim()})),
  });
  const [pwForm,setPwForm]=useState({next:"",confirm:""});
  const [timerInput,setTimerInput]=useState(String(timerLimit||30));
  const [qaTimerInput,setQaTimerInput]=useState(String(qaLimit||10));
  const [shiftStartInput,setShiftStartInput]=useState(shiftStartTime||"");
  const [shiftStartWarnInput,setShiftStartWarnInput]=useState(String(shiftStartWarnMins||10));
  const [shiftEndInput,setShiftEndInput]=useState(shiftEndTime||"");
  const [shiftWarnInput,setShiftWarnInput]=useState(String(shiftWarnMins||10));

  // ── Load latest profile from DB on mount ──
  useEffect(()=>{
    profileService.getProfile(user.email)
      .then(r=>r.json())
      .then(data=>{
        if(data && data.email){
          const merged={
            ...user,
            name:       data.name        || user.name,
            role:       data.role        || user.role||"",
            avatarUrl:  data.avatar_url  || user.avatarUrl||"",
            beforeName: data.before_name || user.beforeName||defNames(user.name).beforeName,
            afterName:  data.after_name  || user.afterName||defNames(user.name).afterName,
            screenshotName: data.screenshot_name || user.screenshotName||defNames(user.name).screenshotName,
            greetingMessages: ((data.greeting_messages && data.greeting_messages.length>0) ? data.greeting_messages : (user.greetingMessages||defaultMsgs))
              .map(m=>({...m, base: m.base || (m.template||"").replace("[Case #]","").replace("[Inbound #]","").replace("[Type]","").trim() })),
          };
          setForm(f=>({...f,
            name:merged.name,role:merged.role,avatarUrl:merged.avatarUrl,
            beforeName:merged.beforeName,afterName:merged.afterName,screenshotName:merged.screenshotName,
            greetingMessages:(merged.greetingMessages||defaultMsgs).map(m=>({...m,base:m.base||(m.template||"").replace("[Case #]","").replace("[Inbound #]","").replace("[Type]","").trim()})),
          }));
          // Sync to localStorage so rest of app sees it
          localStorage.setItem("ch_user",JSON.stringify(merged));
          setUser(merged);
        }
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  // ── Save profile to DB ──
  const saveProfile=async()=>{
    if(!form.name.trim())return showToast("Name required","error");
    setSaving(true);
    try{
      const payload={
        email:user.email,
        name:form.name,
        role:form.role,
        before_name:form.beforeName,
        after_name:form.afterName,
        screenshot_name:form.screenshotName,
        avatar_url:form.avatarUrl||null,
        greeting_messages:form.greetingMessages||[],
      };
      const res=await profileService.saveProfile(payload);
      const data=await res.json();
      if(!res.ok)return showToast(data.error||"Error saving profile","error");
      // Update local state and localStorage
      const updated={...user,...form,
        beforeName:form.beforeName,afterName:form.afterName,
        screenshotName:form.screenshotName,avatarUrl:form.avatarUrl||user.avatarUrl||"",
        greetingMessages:form.greetingMessages||[]};
      localStorage.setItem("ch_user",JSON.stringify(updated));
      setUser(updated);
      setEditing(false);
      showToast("Profile saved ✅");
    }catch(e){showToast("Error saving profile","error");}
    finally{setSaving(false);}
  };

  // ── Avatar upload ──
  const handleAvatarChange=async(e)=>{
    const file=e.target.files?.[0]; if(!file)return;
    setForm(f=>({...f,avatarUrl:URL.createObjectURL(file)})); // preview
    try{
      const reader=new FileReader();
      reader.onload=async(ev)=>{
        const res=await imageService.uploadImageData({fileBase64:ev.target.result,fileName:`avatar_${user.id}`,mimeType:file.type||"image/jpeg"});
        const data=await res.json();
        if(res.ok){
          const newUrl=data.url;
          setForm(f=>({...f,avatarUrl:newUrl}));
          // Immediately persist to DB so it isn't lost
          await profileService.saveProfile({email:user.email,avatar_url:newUrl});
          const updated={...user,avatarUrl:newUrl};
          localStorage.setItem("ch_user",JSON.stringify(updated));
          setUser(updated);
          showToast("Photo updated ✅");
        }else{ showToast("Upload failed","error"); }
      };
      reader.readAsDataURL(file);
    }catch(e){ showToast("Upload error","error"); }
  };

  // ── Change password (still uses Supabase Auth via access token) ──
  const changePw=async()=>{
    if(pwForm.next.length<6)return showToast("Min. 6 characters","error");
    if(pwForm.next!==pwForm.confirm)return showToast("Passwords don't match","error");
    setSaving(true);
    try{
      const accessToken=localStorage.getItem("ch_token");
      const res=await authService.changePassword({accessToken,newPassword:pwForm.next});
      const data=await res.json();
      if(!res.ok)return showToast(data.error||"Error","error");
      setPwForm({next:"",confirm:""});showToast("Password changed ✅");
    }catch(e){showToast("Error","error");}
    finally{setSaving(false);}
  };

  const initials=(form.name||user.name).split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div>
      <PageHeader title="Profile &amp; Settings" subtitle="Manage Your Profile" />
      {loading&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}>Loading profile…</div>}
      {!loading&&<>

      {/* ── Info card ── */}
      <div className="profile-card">
        <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:20}}>
          <div className="profile-avatar-large" title="Click to change photo" onClick={()=>avatarInputRef.current?.click()}>
            {form.avatarUrl?<img src={form.avatarUrl} alt="Profile"/>:<span>{initials}</span>}
            <div className="profile-avatar-overlay"><Icon name="camera" size={18} color="#fff"/></div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{display:"none"}}/>
          </div>
          <div>
            <h3 style={{fontSize:20,fontWeight:800}}>{form.name||user.name}</h3>
            <p style={{color:"var(--muted)",fontSize:13,marginTop:3}}>{user.email}</p>
            {form.role&&<p style={{fontSize:12,color:"var(--accent)",marginTop:3,fontWeight:600}}>{form.role}</p>}
          </div>
          <div style={{marginLeft:"auto"}}><button className="btn btn-ghost" onClick={()=>setEditing(e=>!e)}>{editing?"Cancel":"Edit Profile"}</button></div>
        </div>
        {editing&&(<div style={{borderTop:"1px solid var(--border)",paddingTop:20}}>
          <div className="field"><label>Full Name</label><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
          <div className="field"><label>Role / Title</label><input className="inp" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} placeholder="e.g. Web Specialist"/></div>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
        </div>)}
      </div>

      {/* ── Check-in Messages card ── */}
      <GreetingMessagesCard form={form} saveProfile={saveProfile} saving={saving} setForm={setForm} />

      {/* ── Special Requestors card ── */}
      <div className="profile-card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <h3 style={{fontSize:16,fontWeight:700,margin:0}}>Special Requestors</h3>
          <button className="btn btn-primary" style={{fontSize:11,padding:"5px 12px"}} onClick={()=>setAddingReq(true)}>Add Requestor</button>
        </div>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Names shown in the Live Summary panel as a reminder during active cases.</p>
        <div className="requestor-grid">
          {(specialRequestors||[]).map((name,i)=>(
            <div key={i} className="requestor-chip">
              <div className="requestor-avatar">{(name||"").split(" ").map(w=>w&&w[0]).filter(Boolean).join("").slice(0,2).toUpperCase()}</div>
              <span>{name}</span>
              <button className="requestor-del" onClick={()=>removeRequestor(name)}>✕</button>
            </div>
          ))}
          {specialRequestors.length===0&&<div style={{color:"var(--muted)",fontSize:13}}>No special requestors yet.</div>}
        </div>
        {addingReq&&(<div className="modal-bg"><div className="modal">
          <div style={{marginBottom:14}}><Icon name="requestors" size={40} color="var(--amber)"/></div>
          <h3>Add Special Requestor</h3>
          <div className="field" style={{textAlign:"left",marginBottom:16}}>
            <label>Full Name</label>
            <input className="inp" placeholder="e.g. John Smith" value={newReq} onChange={e=>setNewReq(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddRequestor()} autoFocus/>
          </div>
          <div className="modal-btns">
            <button className="btn btn-ghost" onClick={()=>{setAddingReq(false);setNewReq("");}}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddRequestor}>Add</button>
          </div>
        </div></div>)}
      </div>

      {/* ── File naming card ── */}
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Screenshot File Names</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>These names are used when uploading screenshots in Post-Live Amends. Fully independent from your profile name.</p>
        <div className="field">
          <label>Before Screenshot Name</label>
          <input className="inp" value={form.beforeName||""} onChange={e=>setForm(f=>({...f,beforeName:e.target.value}))}/>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Used in: Step 2 — Before Screenshot</div>
        </div>
        <div className="field">
          <label>After / Main Screenshot Name</label>
          <input className="inp" value={form.afterName||""} onChange={e=>setForm(f=>({...f,afterName:e.target.value}))}/>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Used in: Step 5 — After Screenshot</div>
        </div>
        <div className="field">
          <label>Backup Screenshot Name</label>
          <input className="inp" value={form.screenshotName||""} onChange={e=>setForm(f=>({...f,screenshotName:e.target.value}))}/>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Used in: Step 6 — Backup Screenshots</div>
        </div>
        <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving?"Saving...":"Save File Names"}</button>
      </div>

      {/* ── Password card ── */}
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Change Password</h3>
        <div className="field"><label>New Password</label><input className="inp" type="password" placeholder="Min. 6 characters" value={pwForm.next} onChange={e=>setPwForm(f=>({...f,next:e.target.value}))}/></div>
        <div className="field"><label>Confirm New Password</label><input className="inp" type="password" placeholder="••••••••" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&changePw()}/></div>
        <button className="btn btn-primary" onClick={changePw} disabled={saving}>{saving?"Updating...":"Update Password"}</button>
      </div>

      {/* ── Combined Tracker timer card ── */}
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>⏱ Combined Tracker Alert</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Alarm fires after this many minutes of case elapsed time. Default is 30 min.</p>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <input className="inp" type="number" min="1" max="240" style={{width:90,textAlign:"center",fontWeight:700,fontSize:15}}
            value={timerInput} onChange={e=>setTimerInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&(saveTimerLimit(timerInput),showToast("Combined Tracker timer updated ✅"))}/>
          <span style={{fontSize:13,color:"var(--muted)"}}>minutes</span>
          <button className="btn btn-primary" style={{marginLeft:"auto",padding:"8px 18px",fontSize:12}}
            onClick={()=>{saveTimerLimit(timerInput);showToast("Combined Tracker timer updated ✅");}}>Save</button>
        </div>
        <div style={{fontSize:11,color:"var(--muted)",marginTop:8}}>Currently: <strong style={{color:"var(--accent)"}}>{timerLimit} min</strong></div>
      </div>

      {/* ── QA Checklist timer card ── */}
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>QA Checklist Alert</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Alarm fires after this many minutes since QA Checklist was started. Default is 10 min.</p>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <input className="inp" type="number" min="1" max="240" style={{width:90,textAlign:"center",fontWeight:700,fontSize:15}}
            value={qaTimerInput} onChange={e=>setQaTimerInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&(saveQaLimit(qaTimerInput),showToast("QA Checklist timer updated ✅"))}/>
          <span style={{fontSize:13,color:"var(--muted)"}}>minutes</span>
          <button className="btn btn-primary" style={{marginLeft:"auto",padding:"8px 18px",fontSize:12}}
            onClick={()=>{saveQaLimit(qaTimerInput);showToast("QA Checklist timer updated ✅");}}>Save</button>
        </div>
        <div style={{fontSize:11,color:"var(--muted)",marginTop:8}}>Currently: <strong style={{color:"var(--accent)"}}>{qaLimit} min</strong></div>
      </div>

      {/* ── Shift Start Alarm card ── */}
      <ShiftStartAlarmCard
        saveShiftStartTime={saveShiftStartTime}
        saveShiftStartWarnMins={saveShiftStartWarnMins}
        setShiftStartInput={setShiftStartInput}
        setShiftStartWarnInput={setShiftStartWarnInput}
        shiftStartInput={shiftStartInput}
        shiftStartTime={shiftStartTime}
        shiftStartWarnInput={shiftStartWarnInput}
        shiftStartWarnMins={shiftStartWarnMins}
        showToast={showToast}
      />

      {/* ── Shift End Alarm card ── */}
      <ShiftEndAlarmCard
        saveShiftEndTime={saveShiftEndTime}
        saveShiftWarnMins={saveShiftWarnMins}
        setShiftEndInput={setShiftEndInput}
        setShiftWarnInput={setShiftWarnInput}
        shiftEndInput={shiftEndInput}
        shiftEndTime={shiftEndTime}
        shiftWarnInput={shiftWarnInput}
        shiftWarnMins={shiftWarnMins}
        showToast={showToast}
      />

      {/* ── Danger zone ── */}
      <div className="profile-card" style={{borderColor:"rgba(197,68,70,.3)"}}>
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:8,color:"var(--red)"}}>Danger Zone</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:14}}>Signing out will end your current session.</p>
        <button className="btn btn-danger" onClick={onLogout}>Sign Out</button>
      </div>
      </>}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}
