import { useState, useRef } from 'react';
import Icon from '../icons/Icon';
import { cls } from '../../lib/helpers';
import Toast, { useToast } from '../ui/Toast';

export default function LinksPage({ links, setLinks, addLink, updateLink, removeLink }) {
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
        <button key={ic} style={{width:36,height:36,borderRadius:8,background:val===ic?"var(--entry-accent-bg)":"var(--card2)",border:val===ic?"1.5px solid var(--accent)":"1.5px solid var(--border)",fontSize:18,cursor:"pointer",transition:".15s"}} onClick={()=>onChange(ic)}>{ic}</button>
      ))}
    </div>
  );

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div><p className="chd-h4">Quick Links</p><p className="chd-p-muted">Custom links shown in the sidebar</p></div>
        <button className="chd-btn-primary" onClick={()=>setAdding(true)}>＋ Add Link</button>
      </div>
      <div className="chd-divider"/>

      {/* Add modal */}
      {adding&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>🔗 Add Quick Link</h3>
        <div className="field"><label>Label <span className="req">*</span></label><input className="inp" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Salesforce" autoFocus/></div>
        <div className="field"><label>URL <span className="req">*</span></label><input className="inp" value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="https://..." onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
        <div className="field"><label>Icon</label>{iconPicker(form.icon,ic=>setForm(f=>({...f,icon:ic})))}</div>
        <div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={submit}>Add Link</button></div>
      </div></div>)}

      {/* Edit modal */}
      {editing&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>✏️ Edit Link</h3>
        <div className="field"><label>Label <span className="req">*</span></label><input className="inp" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} autoFocus/></div>
        <div className="field"><label>URL <span className="req">*</span></label><input className="inp" value={editForm.url} onChange={e=>setEditForm(f=>({...f,url:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveEdit()}/></div>
        <div className="field"><label>Icon</label>{iconPicker(editForm.icon,ic=>setEditForm(f=>({...f,icon:ic})))}</div>
        <div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setEditing(null)}>Cancel</button><button className="btn btn-save" onClick={saveEdit}>💾 Save Changes</button></div>
      </div></div>)}

      {links.length===0&&(<div className="chd-empty-box">No links yet — add one to have it appear in the sidebar.</div>)}

      <div className="chd-link-grid">
        {links.map((l,i)=>(
          <div key={l.id}>
            {dragLinkOver===i&&dragLinkActive!==i&&(
              <div className="link-drag-skeleton"><Icon name="links" size={14} color="var(--accent)"/>Drop here</div>
            )}
            <div className="chd-link-card"
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
              <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
                <span style={{fontSize:20}}>{l.icon}</span>
                <div style={{minWidth:0}}>
                  <p className="chd-h6">{l.title}</p>
                  <p className="chd-p-muted" style={{wordBreak:"break-all"}}>{l.url}</p>
                </div>
              </div>
              <div className="chd-row-actions">
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="chd-btn-secondary" style={{textDecoration:"none"}}>Open</a>
                <button className="chd-btn-secondary" onClick={()=>startEdit(l)}>Edit</button>
                <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>remove(l.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

