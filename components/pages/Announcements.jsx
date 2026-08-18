import { useState } from 'react';
import Icon from '../icons/Icon';
import { cls } from '../../lib/helpers';
import Toast, { useToast } from '../ui/Toast';

// Figma's mockup shows likes/bookmarks/image-attachments on announcement cards —
// none of those exist in the real data model (no likes table, no image field,
// no rich-text). Rather than fabricate fake interactive UI with nothing behind
// it, this keeps the real fields (title, body, author, badge, createdAt) and
// matches Figma's card layout, inline Create Post panel, and filter row —
// the parts that map to real functionality.
export default function AnnouncementsPage({ announcements, addAnnouncement, updateAnnouncement, removeAnnouncement, user }) {
  const [saving,setSaving]=useState(false);
  const [deleteTarget,setDeleteTarget]=useState(null);
  const [editTarget,setEditTarget]=useState(null); // announcement being edited, or null when creating new
  const [form,setForm]=useState({title:"",body:"",badge:"info"});
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all"); // all | update | info(announcements)
  const [toast,showToast]=useToast();

  const BADGE_OPTS=[["info","Info"],["update","Update"],["urgent","Urgent"]];
  const badgeColor = b => b==="urgent"?"var(--red)":b==="update"?"var(--green)":"var(--site-comment,#4760ff)";
  const badgeLabel = b => b==="urgent"?"Urgent":b==="update"?"Update":"Announcement";

  const resetForm = () => setForm({title:"",body:"",badge:"info"});

  const submit=async()=>{
    if(!form.title.trim())return showToast("Title required","error");
    setSaving(true);
    try{
      if(editTarget){
        await updateAnnouncement(editTarget,{title:form.title,body:form.body,badge:form.badge});
        showToast("Announcement updated");
      } else {
        await addAnnouncement({...form,author:user.name,createdAt:new Date().toLocaleDateString()});
        showToast("Announcement posted!");
      }
      resetForm();setEditTarget(null);
    }catch(e){
      showToast("Failed to save — check connection","error");
    }finally{setSaving(false);}
  };

  const startEdit=(a)=>{setEditTarget(a.id);setForm({title:a.title,body:a.body||"",badge:a.badge||"info"});};
  const cancelEdit=()=>{setEditTarget(null);resetForm();};

  const confirmDelete=async()=>{
    if(!deleteTarget)return;
    try{
      await removeAnnouncement(deleteTarget);
      showToast("Removed","info");
    }catch(e){showToast("Failed to delete","error");}
    setDeleteTarget(null);
  };

  const isAuthor=(a)=> a.author && user?.name && a.author===user.name;
  const initialsOf = name => (name||"?").split(" ").map(w=>w&&w[0]).filter(Boolean).join("").slice(0,2).toUpperCase();

  const filtered = announcements.filter(a=>{
    const matchQ = !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.body?.toLowerCase().includes(search.toLowerCase());
    const matchF = filter==="all" || a.badge===filter || (filter==="info"&&(!a.badge||a.badge==="info"));
    return matchQ && matchF;
  });

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div><p className="chd-h4">Updates & Announcement</p><p className="chd-p-muted">View and Manage latest announcement</p></div>
      </div>
      <div className="chd-divider"/>

      <div className="chd-search-row">
        <input className="chd-search-inp" placeholder="Search Announcement" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="chd-radio-row" style={{marginBottom:0}}>
          {[["all","All"],["update","Updates"],["info","Announcements"]].map(([v,l])=>(
            <div key={v} className={cls("chd-radio-pill",filter===v&&"active")} onClick={()=>setFilter(v)}><div className="chd-radio-dot"/>{l}</div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:10,alignItems:"flex-start",width:"100%",flexWrap:"wrap"}}>
        {/* ── Create Post panel (left) ── */}
        <div className="chd-ql-create">
          <p className="chd-h6">{editTarget?"Edit Post":"Create post"}</p>
          <div className="chd-divider" style={{background:"var(--card2)"}}/>

          <p className="chd-label" style={{opacity:.6}}>Title</p>
          <input className="chd-search-inp" style={{borderRadius:15,width:"100%"}} placeholder="Title here"
            value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>

          <p className="chd-label" style={{opacity:.6}}>Message</p>
          <div className="chd-radio-row" style={{marginBottom:0}}>
            {BADGE_OPTS.map(([v,l])=>(
              <div key={v} className={cls("chd-radio-pill",form.badge===v&&"active")} onClick={()=>setForm(f=>({...f,badge:v}))}><div className="chd-radio-dot"/>{l}</div>
            ))}
          </div>
          <textarea className="chd-search-inp" style={{borderRadius:15,width:"100%",minHeight:140,resize:"vertical"}} placeholder="Insert Message Here"
            value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))}/>

          <div className="chd-divider" style={{background:"var(--card2)"}}/>
          <div style={{display:"flex",gap:10}}>
            <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={editTarget?cancelEdit:resetForm} disabled={saving}>
              {editTarget?"Cancel":"Remove Fill"}
            </button>
            <button className="chd-btn-primary" onClick={submit} disabled={saving}>{saving?"Saving…":editTarget?"Save Changes":"Create Post"}</button>
          </div>
        </div>

        {/* ── Feed (right) ── */}
        <div style={{display:"flex",flexDirection:"column",gap:10,flex:"1 1 500px",minWidth:320}}>
          {filtered.length===0&&(<div className="chd-empty-box">{announcements.length===0?"No announcements — post one to inform your team!":"No results — try adjusting your search or filter."}</div>)}
          {filtered.map(a=>(
            <div key={a.id} className="chd-ann-card">
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:41,height:41,borderRadius:"50%",background:"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"var(--text)",flexShrink:0}}>
                  {initialsOf(a.author)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p className="chd-h6">{a.author}</p>
                </div>
                <span className="chd-badge" style={{background:badgeColor(a.badge)}}>{badgeLabel(a.badge)}</span>
                {isAuthor(a)&&(<button className="chd-btn-secondary" onClick={()=>startEdit(a)}>Edit</button>)}
                {isAuthor(a)&&(<button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>setDeleteTarget(a.id)}>Delete</button>)}
              </div>
              <div className="chd-divider" style={{background:"var(--card2)"}}/>
              <p className="chd-h6">{a.title}</p>
              {a.body&&<p className="chd-p-muted" style={{whiteSpace:"pre-wrap"}}>{a.body}</p>}
              <p className="chd-p-muted">{a.createdAt} — {badgeLabel(a.badge)}</p>
            </div>
          ))}
        </div>
      </div>

      {deleteTarget&&(
        <div style={{position:"fixed",inset:0,background:"rgba(64,81,59,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:60}}>
          <div style={{background:"#fff",borderRadius:10,padding:30,maxWidth:360,textAlign:"center"}}>
            <p className="chd-h6">Delete Announcement?</p>
            <p className="chd-p-muted">This will be permanently removed.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14}}>
              <button className="chd-btn-secondary" onClick={()=>setDeleteTarget(null)}>Cancel</button>
              <button className="chd-btn-primary" style={{background:"var(--red)",borderColor:"var(--red)"}} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}
