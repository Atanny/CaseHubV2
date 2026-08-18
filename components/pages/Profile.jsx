import { useState, useRef, useEffect } from 'react';
import Icon from '../icons/Icon';
import { cls } from '../../lib/helpers';
import Toast, { useToast } from '../ui/Toast';

export default function ProfilePage({ user, setUser, onLogout, timerLimit, saveTimerLimit, qaLimit=10, saveQaLimit, shiftStartTime="", saveShiftStartTime, shiftStartWarnMins=10, saveShiftStartWarnMins, shiftEndTime="", saveShiftEndTime, shiftWarnMins=10, saveShiftWarnMins, specialRequestors=[], addRequestor, removeRequestor }) {
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
    fetch(`/api/profile?email=${encodeURIComponent(user.email)}`)
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
      const res=await fetch("/api/profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
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
        const res=await fetch("/api/images/upload",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({fileBase64:ev.target.result,fileName:`avatar_${user.id}`,mimeType:file.type||"image/jpeg"})});
        const data=await res.json();
        if(res.ok){
          const newUrl=data.url;
          setForm(f=>({...f,avatarUrl:newUrl}));
          // Immediately persist to DB so it isn't lost
          await fetch("/api/profile",{method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({email:user.email,avatar_url:newUrl})});
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
      const res=await fetch("/api/auth/password",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({accessToken,newPassword:pwForm.next})});
      const data=await res.json();
      if(!res.ok)return showToast(data.error||"Error","error");
      setPwForm({next:"",confirm:""});showToast("Password changed ✅");
    }catch(e){showToast("Error","error");}
    finally{setSaving(false);}
  };

  const initials=(form.name||user.name).split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div>
      <div className="page-header"><div className="page-title">Profile & Settings</div><div className="page-sub">Manage your account, requestors, and preferences</div></div>
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
      <div className="profile-card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <h3 style={{fontSize:16,fontWeight:700,margin:0}}>Check-in Messages</h3>
          <button className="btn btn-primary" style={{fontSize:11,padding:"5px 12px"}} onClick={()=>{
            const newMsg={id:Date.now().toString(),label:"New Message",base:"Hi po Ms. Tina, magpapacheck lang po",fillType:"caseNum"};
            setForm(f=>({...f,greetingMessages:[...(f.greetingMessages||[]),newMsg]}));
          }}>＋ Add Message</button>
        </div>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Write your message base text. The radio button automatically appends what type to include when copying.</p>
        {(form.greetingMessages||[]).length===0&&(
          <div style={{fontSize:13,color:"var(--muted)",padding:"12px 0"}}>No messages yet. Click <b>＋ Add Message</b> to create one.</div>
        )}
        {(form.greetingMessages||[]).map((m,mi)=>{
          // Auto-build preview from base + fillType
          const buildPreview=(base,ft)=>{
            const b=base||"Hi po Ms. Tina, magpapacheck lang po";
            if(ft==="none")        return b;
            if(ft==="siteComment") return `${b} Site Comment #12345`;
            if(ft==="caseNum")     return `${b} Case #12345`;
            if(ft==="inbound")     return `${b} Inbound #67890`;
            return b;
          };
          const updateMsg=(patch)=>{
            const arr=[...(form.greetingMessages||[])];arr[mi]={...arr[mi],...patch};
            setForm(f=>({...f,greetingMessages:arr}));
          };
          return (
          <div key={m.id} style={{background:"var(--entry-bg)",border:"1.5px solid var(--border)",padding:"14px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <input className="inp" style={{flex:1,fontWeight:700,fontSize:13}} value={m.label||""} onChange={e=>updateMsg({label:e.target.value})} placeholder="Label (e.g. Site Comment)"/>
              <button className="entry-del" onClick={()=>{
                const arr=(form.greetingMessages||[]).filter((_,i)=>i!==mi);setForm(f=>({...f,greetingMessages:arr}));
              }}><Icon name="trash" size={13} color="var(--red)"/></button>
            </div>
            <div className="field" style={{marginBottom:10}}>
              <label>Message</label>
              <textarea className="inp" rows={3} value={m.base||""} onChange={e=>updateMsg({base:e.target.value})} placeholder="Hi po Ms. Tina, magpapacheck lang po" style={{resize:"vertical",minHeight:68,lineHeight:1.6}}/>
            </div>
            <div className="field" style={{marginBottom:8}}>
              <label style={{marginBottom:6,display:"block"}}>Append number <span style={{fontWeight:400,opacity:.6,textTransform:"none",fontSize:10}}>(optional)</span></label>
              <div className="radio-group">
                {[
                  {v:"none",        l:"None",             cls:""},
                  {v:"siteComment", l:"Site Comment #",   cls:"selected-complete"},
                  {v:"caseNum",     l:"Case #",            cls:"selected-clarif"},
                  {v:"inbound",     l:"Inbound #",         cls:"selected-complete"},
                ].map(({v,l,cls:sc})=>(
                  <label key={v} className={cls("radio-label",m.fillType===v&&sc)}>
                    <input type="radio" name={`fillType-${m.id}`} checked={m.fillType===v} onChange={()=>updateMsg({fillType:v})} style={{display:"none"}}/>
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:8,padding:"7px 10px",background:"var(--card)",border:"1px solid var(--border)"}}>
              <span style={{opacity:.6}}>Preview: </span>
              <span style={{color:"var(--accent)",fontWeight:600}}>{buildPreview(m.base,m.fillType)}</span>
            </div>
          </div>
          );
        })}
        <button className="btn btn-primary" style={{marginTop:4}} onClick={saveProfile} disabled={saving}>{saving?"Saving...":"💾 Save Messages"}</button>
      </div>

      {/* ── Special Requestors card ── */}
      <div className="profile-card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <h3 style={{fontSize:16,fontWeight:700,margin:0}}>Special Requestors</h3>
          <button className="btn btn-primary" style={{fontSize:11,padding:"5px 12px"}} onClick={()=>setAddingReq(true)}>＋ Add Requestor</button>
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
        <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving?"Saving...":"💾 Save File Names"}</button>
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
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>✅ QA Checklist Alert</h3>
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
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>⏰ Shift Start Alarm</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Get alerted before your shift starts so you have time to prepare. Leave blank to disable.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div className="field" style={{marginBottom:0}}>
            <label>Shift Start Time</label>
            <input className="inp" type="time" value={shiftStartInput} onChange={e=>setShiftStartInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>e.g. 20:00 for 8:00 PM</div>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label>Warn me this many minutes before</label>
            <input className="inp" type="number" min="1" max="60" value={shiftStartWarnInput} onChange={e=>setShiftStartWarnInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Default: 10 minutes</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="btn btn-primary" style={{padding:"8px 18px",fontSize:12}} onClick={()=>{
            saveShiftStartTime(shiftStartInput);
            saveShiftStartWarnMins(shiftStartWarnInput);
            showToast("Shift start alarm updated ✅");
          }}>Save</button>
          {shiftStartTime&&<button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>{
            setShiftStartInput(""); saveShiftStartTime(""); showToast("Shift start alarm disabled");
          }}>Disable</button>}
        </div>
        {shiftStartTime&&<div style={{fontSize:11,color:"var(--muted)",marginTop:10}}>
          Active: alarm fires at <strong style={{color:"var(--accent)"}}>{(()=>{
            const [hh,mm]=shiftStartTime.split(":").map(Number);
            const warn=new Date();warn.setHours(hh,mm,0,0);
            warn.setMinutes(warn.getMinutes()-shiftStartWarnMins);
            return warn.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()}</strong> ({shiftStartWarnMins} min before {(()=>{
            const [hh,mm]=shiftStartTime.split(":").map(Number);
            return new Date(0,0,0,hh,mm).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()})
        </div>}
      </div>

      {/* ── Shift End Alarm card ── */}
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>⏰ Shift End Alarm</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Set your shift end time and how many minutes before it you want to be alerted. Leave blank to disable.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div className="field" style={{marginBottom:0}}>
            <label>Shift End Time</label>
            <input className="inp" type="time" value={shiftEndInput} onChange={e=>setShiftEndInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>e.g. 05:00 for 5:00 AM</div>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label>Warn me this many minutes before</label>
            <input className="inp" type="number" min="1" max="60" value={shiftWarnInput} onChange={e=>setShiftWarnInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Default: 10 minutes</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="btn btn-primary" style={{padding:"8px 18px",fontSize:12}} onClick={()=>{
            saveShiftEndTime(shiftEndInput);
            saveShiftWarnMins(shiftWarnInput);
            showToast("Shift alarm updated ✅");
          }}>Save</button>
          {shiftEndTime&&<button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>{
            setShiftEndInput(""); saveShiftEndTime(""); showToast("Shift alarm disabled");
          }}>Disable</button>}
        </div>
        {shiftEndTime&&<div style={{fontSize:11,color:"var(--muted)",marginTop:10}}>
          Active: alarm fires at <strong style={{color:"var(--accent)"}}>{(()=>{
            const [hh,mm]=shiftEndTime.split(":").map(Number);
            const warn=new Date();warn.setHours(hh,mm,0,0);
            warn.setMinutes(warn.getMinutes()-shiftWarnMins);
            return warn.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()}</strong> ({shiftWarnMins} min before {(()=>{
            const [hh,mm]=shiftEndTime.split(":").map(Number);
            return new Date(0,0,0,hh,mm).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()})
        </div>}
      </div>

      {/* ── Danger zone ── */}
      <div className="profile-card" style={{borderColor:"rgba(244,63,94,.3)"}}>
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:8,color:"var(--red)"}}>Danger Zone</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:14}}>Signing out will end your current session.</p>
        <button className="btn btn-danger" onClick={onLogout}>Sign Out</button>
      </div>
      </>}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

