import { useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { PageHeader } from '@/components/layout/PageHeader'

export function LinksPage({ links, setLinks, addLink, updateLink, removeLink }) {
  const dragLinkRef=useRef(null);
  const [dragLinkActive,setDragLinkActive]=useState(null);
  const [dragLinkOver,setDragLinkOver]=useState(null);
  const [adding,setAdding]=useState(false);
  const [editing,setEditing]=useState(null); // link object being edited
  const [form,setForm]=useState({title:"",url:"",icon:"🔗"});
  const [editForm,setEditForm]=useState({title:"",url:"",icon:"🔗"});
  const [toast,showToast]=useToast();
  const ICONS=["🔗","📄","📊","🛠️","📧","🌐","📱","💼","📝","⚙️","🔑","📂","🏠","🎯","📌","💡","🔒","🚀","⭐","🧩"];

  const submit=()=>{
    if(!form.title.trim()||!form.url.trim())return showToast("Title and URL required","error");
    let url=form.url.trim();if(!url.startsWith("http"))url="https://"+url;
    addLink({...form,url});
    setForm({title:"",url:"",icon:"🔗"});setAdding(false);showToast("Link added!");
  };

  const startEdit=(l)=>{setEditing(l);setEditForm({title:l.title,url:l.url,icon:l.icon||"🔗"});};
  const saveEdit=()=>{
    if(!editForm.title.trim()||!editForm.url.trim())return showToast("Title and URL required","error");
    let url=editForm.url.trim();if(!url.startsWith("http"))url="https://"+url;
    updateLink(editing.id,{...editForm,url});
    setEditing(null);showToast("Link updated ✅");
  };
  const remove=(id)=>{removeLink(id);showToast("Link removed","info");};

  const iconPicker=(val,onChange)=>(
    <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:4}}>
      {ICONS.map(ic=>(
        <button key={ic} style={{width:36,height:36,borderRadius:20,background:val===ic?"var(--entry-accent-bg)":"var(--card2)",border:val===ic?"1.5px solid var(--accent)":"1.5px solid var(--border)",fontSize:18,cursor:"pointer",transition:".15s"}} onClick={()=>onChange(ic)}>{ic}</button>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader title="Quick Links" subtitle="View And Manage Links" />
      <div className="ph-toolbar">
        <button className="btn btn-primary" onClick={()=>setAdding(true)}>Add Link</button>
      </div>

      {/* Add modal */}
      {adding&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>Add Quick Link</h3>
        <div className="field"><label>Label <span className="req">*</span></label><input className="inp" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Salesforce" autoFocus/></div>
        <div className="field"><label>URL <span className="req">*</span></label><input className="inp" value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="https://..." onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
        <div className="field"><label>Icon</label>{iconPicker(form.icon,ic=>setForm(f=>({...f,icon:ic})))}</div>
        <div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={submit}>Add Link</button></div>
      </div></div>)}

      {/* Edit modal */}
      {editing&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>Edit Link</h3>
        <div className="field"><label>Label <span className="req">*</span></label><input className="inp" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} autoFocus/></div>
        <div className="field"><label>URL <span className="req">*</span></label><input className="inp" value={editForm.url} onChange={e=>setEditForm(f=>({...f,url:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveEdit()}/></div>
        <div className="field"><label>Icon</label>{iconPicker(editForm.icon,ic=>setEditForm(f=>({...f,icon:ic})))}</div>
        <div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setEditing(null)}>Cancel</button><button className="btn btn-save" onClick={saveEdit}>Save Changes</button></div>
      </div></div>)}

      {links.length===0&&(<div className="empty-history"><div style={{fontSize:52,marginBottom:14}}>🔗</div><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>No links yet</div><div>Add a link to have it appear in the sidebar.</div></div>)}

      {links.map((l,i)=>(
        <div key={l.id}>
          {dragLinkOver===i&&dragLinkActive!==i&&(
            <div className="link-drag-skeleton"><Icon name="links" size={14} color="var(--accent)"/>Drop here</div>
          )}
          <div className="link-card"
            draggable
            onDragStart={()=>{dragLinkRef.current=i;setDragLinkActive(i);}}
            onDragOver={e=>{e.preventDefault();if(dragLinkOver!==i)setDragLinkOver(i);}}
            onDrop={()=>{
              const from=dragLinkRef.current;
              if(from!=null&&from!==i){const arr=[...links];const[m]=arr.splice(from,1);arr.splice(i,0,m);setLinks(arr);}
              dragLinkRef.current=null;setDragLinkActive(null);setDragLinkOver(null);
            }}
            onDragEnd={()=>{dragLinkRef.current=null;setDragLinkActive(null);setDragLinkOver(null);}}
            style={{cursor:"grab",userSelect:"none",opacity:dragLinkActive===i?0.25:1,transition:"opacity .12s"}}
          >
          <div className="drag-handle" title="Drag to reorder" style={{flexDirection:"row",gap:3,padding:"6px 4px"}}>
            <span style={{width:2,height:16,background:"var(--muted)",borderRadius:1,display:"block"}}/>
            <span style={{width:2,height:16,background:"var(--muted)",borderRadius:1,display:"block"}}/>
            <span style={{width:2,height:16,background:"var(--muted)",borderRadius:1,display:"block"}}/>
          </div>
          <div className="link-icon">{l.icon}</div>
          <div className="link-info"><div className="link-title">{l.title}</div><div className="link-url">{l.url}</div></div>
          <div className="link-actions">
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="h-btn" style={{textDecoration:"none"}}>↗ Open</a>
            <button className="h-btn" style={{borderColor:"var(--accent)",color:"var(--accent)"}} onClick={()=>startEdit(l)}>Edit</button>
            <button className="h-btn danger" onClick={()=>remove(l.id)}><Icon name="trash" size={13} color="var(--red)"/></button>
          </div>
          </div>
        </div>
      ))}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}
