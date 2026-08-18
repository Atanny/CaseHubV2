import { useState, useRef } from 'react';
import Icon from '../icons/Icon';
import { cls } from '../../lib/helpers';
import Toast, { useToast } from '../ui/Toast';

// Figma's icon-grid uses a fixed set of glyphs for link cards — mapped to emoji
// equivalents so we don't need new icon assets, same real add/update/remove logic.
const ICONS = ["🔗","📧","🏅","🚩","📘","🧭","🎵","📄","🔖","🗂️","🏠","🎯","🧩"];

export default function LinksPage({ links, setLinks, addLink, updateLink, removeLink }) {
  const dragLinkRef=useRef(null);
  const [dragLinkActive,setDragLinkActive]=useState(null);
  const [dragLinkOver,setDragLinkOver]=useState(null);
  const [editing,setEditing]=useState(null); // link id being edited, or null when creating new
  const [form,setForm]=useState({title:"",url:"",icon:ICONS[0]});
  const [toast,showToast]=useToast();

  const resetForm = () => setForm({title:"",url:"",icon:ICONS[0]});

  const submit=()=>{
    if(!form.title.trim()||!form.url.trim())return showToast("Title and URL required","error");
    let url=form.url.trim();if(!url.startsWith("http"))url="https://"+url;
    if(editing){
      updateLink(editing,{...form,url});
      showToast("Link updated");
    } else {
      addLink({...form,url});
      showToast("Link added!");
    }
    resetForm();setEditing(null);
  };

  const startEdit=(l)=>{setEditing(l.id);setForm({title:l.title,url:l.url,icon:l.icon||ICONS[0]});};
  const cancelEdit=()=>{setEditing(null);resetForm();};
  const remove=(id)=>{removeLink(id);if(editing===id)cancelEdit();showToast("Link removed","info");};

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div><p className="chd-h4">Quick Links</p><p className="chd-p-muted">Custom links shown in the sidebar</p></div>
      </div>
      <div className="chd-divider"/>

      <div style={{display:"flex",gap:10,alignItems:"flex-start",width:"100%",flexWrap:"wrap"}}>
        {/* ── Create Post panel (left) ── */}
        <div className="chd-ql-create">
          <p className="chd-h6">{editing?"Edit Link":"Create Post"}</p>
          <div className="chd-divider" style={{background:"var(--card2)"}}/>

          <p className="chd-label" style={{opacity:.6}}>Icon</p>
          <div className="chd-ql-icon-grid">
            {ICONS.map(ic=>(
              <button key={ic} className={cls("chd-ql-icon-btn", form.icon===ic&&"active")} onClick={()=>setForm(f=>({...f,icon:ic}))}>{ic}</button>
            ))}
          </div>

          <p className="chd-label" style={{opacity:.6}}>Title</p>
          <input className="chd-search-inp" style={{borderRadius:15,width:"100%"}} placeholder="Title here"
            value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>

          <p className="chd-label" style={{opacity:.6}}>Link</p>
          <input className="chd-search-inp" style={{borderRadius:15,width:"100%"}} placeholder="insert link Here"
            value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()}/>

          <div className="chd-divider" style={{background:"var(--card2)"}}/>
          <div style={{display:"flex",gap:10}}>
            <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={editing?cancelEdit:resetForm}>
              {editing?"Cancel":"Remove Fill"}
            </button>
            <button className="chd-btn-primary" onClick={submit}>{editing?"Save Changes":"Create Quick Message"}</button>
          </div>
        </div>

        {/* ── Link list (right) ── */}
        <div style={{display:"flex",flexDirection:"column",gap:10,flex:"1 1 400px",minWidth:320}}>
          {links.length===0&&(<div className="chd-empty-box">No links yet — add one to have it appear in the sidebar.</div>)}
          {links.map((l,i)=>(
            <div key={l.id}>
              {dragLinkOver===i&&dragLinkActive!==i&&(
                <div className="link-drag-skeleton"><Icon name="links" size={14} color="var(--accent)"/>Drop here</div>
              )}
              <div className="chd-ql-row"
                draggable
                onDragStart={()=>{dragLinkRef.current=i;setDragLinkActive(i);}}
                onDragOver={e=>{e.preventDefault();if(dragLinkOver!==i)setDragLinkOver(i);}}
                onDrop={()=>{
                  const from=dragLinkRef.current;
                  if(from!=null&&from!==i){const arr=[...links];const[m]=arr.splice(from,1);arr.splice(i,0,m);setLinks(arr);}
                  dragLinkRef.current=null;setDragLinkActive(null);setDragLinkOver(null);
                }}
                onDragEnd={()=>{dragLinkRef.current=null;setDragLinkActive(null);setDragLinkOver(null);}}
                style={{opacity:dragLinkActive===i?0.25:1}}
              >
                <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
                  <div className="chd-ql-row-icon">{l.icon||"🔗"}</div>
                  <div style={{minWidth:0}}>
                    <p className="chd-h6">{l.title}</p>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="chd-p-muted" style={{wordBreak:"break-all",textDecoration:"underline"}}>{l.url}</a>
                  </div>
                </div>
                <div className="chd-row-actions">
                  <button className="chd-btn-secondary" onClick={()=>startEdit(l)}>Edit</button>
                  <button className="chd-btn-primary" style={{background:"var(--red)",borderColor:"var(--red)"}} onClick={()=>remove(l.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}
