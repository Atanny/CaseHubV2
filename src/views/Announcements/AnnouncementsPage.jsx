import { useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { cls } from '@/utils/classNames'
import * as imageService from '@/services/imageService'
import { PageHeader } from '@/components/layout/PageHeader'

export function AnnouncementsPage({ announcements, addAnnouncement, updateAnnouncement, removeAnnouncement, user }) {
  const [adding,setAdding]=useState(false);
  const [confirming,setConfirming]=useState(false);
  const [saving,setSaving]=useState(false);
  const [deleteTarget,setDeleteTarget]=useState(null);
  const [editTarget,setEditTarget]=useState(null); // announcement being edited
  const [editForm,setEditForm]=useState({title:"",body:"",badge:"info",image_url:""});
  const [form,setForm]=useState({title:"",body:"",badge:"info",image_url:""});
  const [imgUploading,setImgUploading]=useState(false);
  const [toast,showToast]=useToast();

  const BADGE_OPTS=[["info","ℹ️ Info"],["update","Update"],["urgent","Urgent"]];

  // Upload an image file to the `announcement-images` Supabase Storage bucket
  // (see supabase/migrations/20260907_add_announcement_images.sql) and return its public URL.
  const uploadImage = (file, setTo) => {
    if(!file || !file.type?.startsWith("image/")) return;
    setImgUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try{
        const res = await imageService.uploadImageData({fileBase64:reader.result,fileName:file.name,mimeType:file.type,bucket:"announcement-images"});
        const data = await res.json();
        if(!res.ok) throw new Error(data.error||"Upload failed");
        setTo(f=>({...f,image_url:data.url}));
      }catch(e){
        showToast("❌ "+(e.message||"Image upload failed"),"error");
      }finally{
        setImgUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Compact upload dropzone: click, drag-drop, or paste an image
  const ImagePicker = ({value,onChange,uploading}) => {
    const fileRef=useRef();
    const [drag,setDrag]=useState(false);
    return value ? (
      <div style={{position:"relative",width:"fit-content"}}>
        <img src={value} alt="Attached" style={{maxWidth:"100%",maxHeight:180,borderRadius:10,border:"1px solid var(--border)",display:"block"}}/>
        <button type="button" onClick={()=>onChange(null)} title="Remove image" style={{position:"absolute",top:6,right:6,width:22,height:22,borderRadius:20,border:"none",background:"rgba(44,36,24,.65)",color:"#fff",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
    ) : (
      <div
        onClick={()=>!uploading&&fileRef.current?.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true);}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);if(e.dataTransfer.files[0])onChange(e.dataTransfer.files[0]);}}
        style={{border:`1.5px dashed ${drag?"var(--accent)":"var(--border)"}`,borderRadius:10,padding:"20px 14px",textAlign:"center",cursor:uploading?"default":"pointer",background:drag?"var(--entry-accent-bg)":"var(--entry-bg)",transition:".15s"}}
      >
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])onChange(e.target.files[0]);e.target.value="";}}/>
        {uploading
          ? <div style={{fontSize:12,color:"var(--muted)"}}>Uploading…</div>
          : <div style={{fontSize:12,color:"var(--muted)"}}><Icon name="image" size={18} color="var(--muted)"/><div style={{marginTop:6}}>Click or drag an image here</div></div>
        }
      </div>
    );
  };

  const startPost=()=>{
    if(!form.title.trim())return showToast("Title required","error");
    setConfirming(true);
  };

  const confirmPost=async()=>{
    setSaving(true);
    try{
      await addAnnouncement({...form,author:user.name,createdAt:new Date().toLocaleString()});
      setForm({title:"",body:"",badge:"info",image_url:""});
      setAdding(false);setConfirming(false);
      showToast("Announcement posted!");
    }catch(e){
      showToast("Failed to save — check connection","error");
    }finally{setSaving(false);}
  };

  const startEdit=(a)=>{
    setEditTarget(a);
    setEditForm({title:a.title,body:a.body||"",badge:a.badge||"info",image_url:a.image_url||""});
  };

  const saveEdit=async()=>{
    if(!editForm.title.trim())return showToast("Title required","error");
    setSaving(true);
    try{
      await updateAnnouncement(editTarget.id,{title:editForm.title,body:editForm.body,badge:editForm.badge,image_url:editForm.image_url||""});
      setEditTarget(null);
      showToast("Announcement updated!");
    }catch(e){
      showToast("Failed to update","error");
    }finally{setSaving(false);}
  };

  const confirmDelete=async()=>{
    if(!deleteTarget)return;
    try{
      await removeAnnouncement(deleteTarget);
      showToast("Removed","info");
    }catch(e){showToast("Failed to delete","error");}
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
    <div>
      <PageHeader title="Updates &amp; Announcement" subtitle="View And Manage Latest Announcement." />
      <div className="ph-toolbar">
        <button className="btn btn-primary" onClick={()=>{setAdding(true);setConfirming(false);}}>New Announcement</button>
      </div>

      {/* ── Write form ── */}
      {adding&&!confirming&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>New Announcement</h3>
        <div className="field"><label>Title <span className="req">*</span></label><input className="inp" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Announcement title" autoFocus/></div>
        <div className="field"><label>Message</label><textarea className="inp" rows={4} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} placeholder="Write your message..."/></div>
        <div className="field"><label>Image (optional)</label><ImagePicker value={form.image_url} uploading={imgUploading} onChange={fileOrNull=>fileOrNull?uploadImage(fileOrNull,setForm):setForm(f=>({...f,image_url:""}))}/></div>
        <div className="field"><label>Type</label>{badgePicker(form.badge,v=>setForm(f=>({...f,badge:v})))}</div>
        <div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={startPost} disabled={imgUploading}>Review & Post →</button></div>
      </div></div>)}

      {/* ── Confirm before posting ── */}
      {confirming&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14}}><Icon name="announce" size={40} color="var(--accent)"/></div>
        <h3>Post Announcement?</h3>
        <p style={{color:"var(--muted)",fontSize:13,margin:"10px 0 4px"}}>Title: <strong style={{color:"var(--text)"}}>{form.title}</strong></p>
        {form.image_url&&<img src={form.image_url} alt="" style={{maxWidth:"100%",maxHeight:140,borderRadius:8,margin:"6px 0"}}/>}
        {form.body&&<p style={{color:"var(--muted)",fontSize:12,marginBottom:4,maxHeight:80,overflow:"hidden"}}>{form.body}</p>}
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Visible to your whole team.</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setConfirming(false)} disabled={saving}>Go Back</button>
          <button className="btn btn-primary" onClick={confirmPost} disabled={saving}>{saving?"Saving…":"Confirm & Post"}</button>
        </div>
      </div></div>)}

      {/* ── Edit modal (author only) ── */}
      {editTarget&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>Edit Announcement</h3>
        <div className="field"><label>Title <span className="req">*</span></label><input className="inp" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} autoFocus/></div>
        <div className="field"><label>Message</label><textarea className="inp" rows={4} value={editForm.body} onChange={e=>setEditForm(f=>({...f,body:e.target.value}))}/></div>
        <div className="field"><label>Image (optional)</label><ImagePicker value={editForm.image_url} uploading={imgUploading} onChange={fileOrNull=>fileOrNull?uploadImage(fileOrNull,setEditForm):setEditForm(f=>({...f,image_url:""}))}/></div>
        <div className="field"><label>Type</label>{badgePicker(editForm.badge,v=>setEditForm(f=>({...f,badge:v})))}</div>
        <div style={{fontSize:11,color:"var(--muted)",marginBottom:14}}>Only you can edit this — posted by {editTarget.author}</div>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setEditTarget(null)} disabled={saving}>Cancel</button>
          <button className="btn btn-save" onClick={saveEdit} disabled={saving}>{saving?"Saving…":"Save Changes"}</button>
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

      {announcements.length===0&&(<div className="empty-history"><div style={{marginBottom:14}}><Icon name="empty" size={52} color="var(--muted)"/></div><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>No announcements</div><div>Post one to inform your team!</div></div>)}

      {announcements.map(a=>(
        <div key={a.id} className="announcement-card">
          <div className="ann-header">
            <div style={{flex:1,minWidth:0}}>
              <div className="ann-title">{a.title}</div>
              <div className="ann-meta">By {a.author} · {a.createdAt}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <span className={cls("ann-badge",a.badge||"info")}>{a.badge==="urgent"?"Urgent":a.badge==="update"?"Update":"ℹ️ Info"}</span>
              {isAuthor(a)&&(
                <button className="h-btn" style={{borderColor:"var(--accent)",color:"var(--accent)",padding:"4px 10px",fontSize:11}} onClick={()=>startEdit(a)}>Edit</button>
              )}
              {isAuthor(a)&&(
                <button className="entry-del" onClick={()=>setDeleteTarget(a.id)}><Icon name="trash" size={13} color="var(--red)"/></button>
              )}
            </div>
          </div>
          {a.image_url&&(
            <a href={a.image_url} target="_blank" rel="noreferrer">
              <img src={a.image_url} alt="" style={{width:"100%",maxHeight:260,objectFit:"cover",borderRadius:10,border:"1px solid var(--border)",margin:"10px 0"}}/>
            </a>
          )}
          {a.body&&<div className="ann-body">{a.body}</div>}
        </div>
      ))}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}
