import { useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'

// ── Figma-matched dropzone for the left-column per-page reference upload
//    ("Upload Image" — click, drag-drop, or paste; shows a small preview once set) ──
export function FngPageDropzone({ imgUrl, onFile }){
  const fileRef=useRef();
  const [drag,setDrag]=useState(false);
  if(imgUrl){
    return (
      <div style={{position:'relative',border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'}}>
        <img src={imgUrl} alt="" style={{width:'100%',maxHeight:140,objectFit:'cover',display:'block'}}/>
        <button type="button" onClick={()=>onFile(null)} title="Remove" style={{position:'absolute',top:6,right:6,width:22,height:22,borderRadius:20,border:'none',background:'rgba(44,36,24,.65)',color:'#fff',cursor:'pointer',fontSize:12}}>✕</button>
      </div>
    );
  }
  return (
    <div
      onClick={()=>fileRef.current?.click()}
      onDragOver={e=>{e.preventDefault();setDrag(true);}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);if(e.dataTransfer.files[0])onFile(e.dataTransfer.files[0]);}}
      style={{border:`1.5px dashed ${drag?'var(--accent)':'var(--border)'}`,borderRadius:8,padding:'20px 14px',textAlign:'center',cursor:'pointer',background:drag?'var(--entry-accent-bg)':'#fff',transition:'.15s'}}
    >
      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files[0])onFile(e.target.files[0]);e.target.value='';}}/>
      <Icon name="upload" size={20} color="var(--muted)"/>
      <div style={{fontSize:11,color:'var(--muted)',marginTop:8}}>Paste or upload your screenshot here</div>
    </div>
  );
}
