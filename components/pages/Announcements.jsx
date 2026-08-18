import { useState } from 'react';
import Icon from '../icons/Icon';
import { cls } from '../../lib/helpers';
import Toast, { useToast } from '../ui/Toast';

export default function AnnouncementsPage({ announcements, addAnnouncement, updateAnnouncement, removeAnnouncement, user }) {
  const [adding,setAdding]=useState(false);
  const [confirming,setConfirming]=useState(false);
  const [saving,setSaving]=useState(false);
  const [deleteTarget,setDeleteTarget]=useState(null);
  const [editTarget,setEditTarget]=useState(null); // announcement being edited
  const [editForm,setEditForm]=useState({title:"",body:"",badge:"info"});
  const [form,setForm]=useState({title:"",body:"",badge:"info"});
  const [toast,showToast]=useToast();

  const BADGE_OPTS=[["info","ℹ️ Info"],["update","✅ Update"],["urgent","🚨 Urgent"]];

  const startPost=()=>{
    if(!form.title.trim())return showToast("Title required","error");
    setConfirming(true);
  };

  const confirmPost=async()=>{
    setSaving(true);
    try{
      await addAnnouncement({...form,author:user.name,createdAt:new Date().toLocaleString()});
      setForm({title:"",body:"",badge:"info"});
      setAdding(false);setConfirming(false);
      showToast("✅ Announcement posted!");
    }catch(e){
      showToast("❌ Failed to save — check connection","error");
    }finally{setSaving(false);}
  };

  const startEdit=(a)=>{
    setEditTarget(a);
    setEditForm({title:a.title,body:a.body||"",badge:a.badge||"info"});
  };

  const saveEdit=async()=>{
    if(!editForm.title.trim())return showToast("Title required","error");
    setSaving(true);
    try{
      await updateAnnouncement(editTarget.id,{title:editForm.title,body:editForm.body,badge:editForm.badge});
      setEditTarget(null);
      showToast("✅ Announcement updated!");
    }catch(e){
      showToast("❌ Failed to update","error");
    }finally{setSaving(false);}
  };

  const confirmDelete=async()=>{
    if(!deleteTarget)return;
    try{
      await removeAnnouncement(deleteTarget);
      showToast("Removed","info");
    }catch(e){showToast("❌ Failed to delete","error");}
    setDeleteTarget(null);
  };

  const isAuthor=(a)=> a.author && user?.name && a.author===user.name;

  const badgePicker=(val,onChange)=>(
    <div className="radio-group">
      {BADGE_OPTS.map(([v,l])=>(
        <label key={v} className={cls("radio-label",val===v&&"selected-clarif")}>
          <input type="radio" checked={val===v} onChange={()=>onChange(v)}/>{l}
        </label>
      ))}
    </div>
  );

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div><p className="chd-h4">Announcements</p><p className="chd-p-muted">Team updates and notices</p></div>
        <button className="chd-btn-primary" onClick={()=>{setAdding(true);setConfirming(false);}}>＋ New Announcement</button>
      </div>
      <div className="chd-divider"/>

      {/* ── Write form ── */}
      {adding&&!confirming&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>New Announcement</h3>
        <div className="field"><label>Title <span className="req">*</span></label><input className="inp" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Announcement title" autoFocus/></div>
        <div className="field"><label>Message</label><textarea className="inp" rows={4} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} placeholder="Write your message..."/></div>
        <div className="field"><label>Type</label>{badgePicker(form.badge,v=>setForm(f=>({...f,badge:v})))}</div>
        <div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={startPost}>Review & Post →</button></div>
      </div></div>)}

      {/* ── Confirm before posting ── */}
      {confirming&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14}}><Icon name="announce" size={40} color="var(--accent)"/></div>
        <h3>Post Announcement?</h3>
        <p style={{color:"var(--muted)",fontSize:13,margin:"10px 0 4px"}}>Title: <strong style={{color:"var(--text)"}}>{form.title}</strong></p>
        {form.body&&<p style={{color:"var(--muted)",fontSize:12,marginBottom:4,maxHeight:80,overflow:"hidden"}}>{form.body}</p>}
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Visible to your whole team.</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setConfirming(false)} disabled={saving}>← Go Back</button>
          <button className="btn btn-primary" onClick={confirmPost} disabled={saving}>{saving?"Saving…":"✅ Confirm & Post"}</button>
        </div>
      </div></div>)}

      {/* ── Edit modal (author only) ── */}
      {editTarget&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>✏️ Edit Announcement</h3>
        <div className="field"><label>Title <span className="req">*</span></label><input className="inp" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} autoFocus/></div>
        <div className="field"><label>Message</label><textarea className="inp" rows={4} value={editForm.body} onChange={e=>setEditForm(f=>({...f,body:e.target.value}))}/></div>
        <div className="field"><label>Type</label>{badgePicker(editForm.badge,v=>setEditForm(f=>({...f,badge:v})))}</div>
        <div style={{fontSize:11,color:"var(--muted)",marginBottom:14}}>Only you can edit this — posted by {editTarget.author}</div>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setEditTarget(null)} disabled={saving}>Cancel</button>
          <button className="btn btn-save" onClick={saveEdit} disabled={saving}>{saving?"Saving…":"💾 Save Changes"}</button>
        </div>
      </div></div>)}

      {/* ── Delete confirm ── */}
      {deleteTarget&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14}}><Icon name="trash" size={40} color="var(--red)"/></div>
        <h3>Delete Announcement?</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:16}}>This will be permanently removed.</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setDeleteTarget(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </div></div>)}

      {announcements.length===0&&(<div className="chd-empty-box">No announcements — post one to inform your team!</div>)}

      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%"}}>
        {announcements.map(a=>(
          <div key={a.id} className="chd-ann-card">
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:0}}>
                <p className="chd-h6">{a.title}</p>
                <p className="chd-p-muted">By {a.author} · {a.createdAt}</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <span className="chd-badge" style={{background:a.badge==="urgent"?"var(--red)":a.badge==="update"?"var(--green)":"var(--site-comment,#4760ff)"}}>{a.badge==="urgent"?"Urgent":a.badge==="update"?"Update":"Info"}</span>
                {isAuthor(a)&&(<button className="chd-btn-secondary" onClick={()=>startEdit(a)}>Edit</button>)}
                {isAuthor(a)&&(<button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>setDeleteTarget(a.id)}>Delete</button>)}
              </div>
            </div>
            {a.body&&<p className="chd-p-muted">{a.body}</p>}
          </div>
        ))}
      </div>
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

