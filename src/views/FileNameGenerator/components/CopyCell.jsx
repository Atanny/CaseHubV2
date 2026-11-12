import { useContext, useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cls } from '@/utils/classNames'
import { FngContext } from '../FngContext'
import { fngDownloadName } from '../fngUtils'
import { fetchImageBlob } from '@/utils/files'

// CopyCell doubles as the Figma "upload slot": generated filename + copy button (v1 behavior,
// unchanged) PLUS a compact upload dropzone (click / drag-drop / paste-when-focused) and a
// selection checkbox once an image is attached, so the same cell drives both the text-copy flow
// and the new image-upload-and-auto-rename flow from one place.
export function CopyCell({val,id}){
  const {copy,copied,uploads,setUploadFor,removeUploadFor,selected,toggleSelected,activeSlotId,setActiveSlotId}=useContext(FngContext);
  const done=copied===id;
  const img = uploads?.[id];
  const isSelected = selected?.has(id);
  const fileRef = useRef();
  const [drag,setDrag]=useState(false);
  const [uploading,setUploading]=useState(false);

  const addFile = async(file)=>{
    if(!file || !val) return;
    setUploading(true);
    try{
      const url = URL.createObjectURL(file);
      setUploadFor(id, { url, name: val, _file: file, id: `fng-${id}` });
    } finally { setUploading(false); }
  };

  useEffect(()=>{
    if(activeSlotId!==id) return;
    const h=(e)=>{
      const tag=(document.activeElement?.tagName||"").toLowerCase();
      if(tag==="input"||tag==="textarea") return;
      const items=Array.from(e.clipboardData?.items||[]).filter(i=>i.kind==="file");
      if(items.length){ e.preventDefault(); addFile(items[0].getAsFile()); }
    };
    window.addEventListener("paste",h);
    return ()=>window.removeEventListener("paste",h);
  },[activeSlotId,id,val]);

  const download = async()=>{
    if(!img) return;
    const fileName = fngDownloadName(val, img);
    const blob = img._file instanceof Blob ? img._file : await fetchImageBlob(img.url);
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div
      className={cls("fng-slot", drag&&"drag", img&&"has-img")}
      onMouseDown={()=>val&&setActiveSlotId(id)}
      onDragOver={e=>{if(val){e.preventDefault();setDrag(true);}}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);if(val&&e.dataTransfer.files[0])addFile(e.dataTransfer.files[0]);}}
    >
      {img&&(
        <label className="fng-slot-check" title="Select for bulk download" onClick={e=>e.stopPropagation()}>
          <input type="checkbox" checked={!!isSelected} onChange={()=>toggleSelected(id)}/>
        </label>
      )}
      <div className="fng-slot-thumb" onClick={()=>val&&!uploading&&fileRef.current?.click()} title={val?(img?"Click to replace image":"Click, drag-drop, or paste an image"):""}>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])addFile(e.target.files[0]);e.target.value="";}}/>
        {img
          ? <img src={img.url} alt={val} className="fng-slot-img"/>
          : <span className="fng-slot-icon">{uploading?<Icon name="loading" size={16} color="var(--accent)"/>:<Icon name="image" size={16} color="var(--muted)"/>}</span>
        }
      </div>
      <div className="fng-slot-body" onClick={()=>val&&copy(val,id)} title={val?"Click to copy filename":""}>
        <span className="fng-slot-name">{val||'—'}</span>
        {val&&<span className="fng-slot-copy">{done?'Copied':'⌘ Copy'}</span>}
      </div>
      {img&&(
        <div className="fng-slot-actions">
          <button type="button" title="Download renamed file" onClick={e=>{e.stopPropagation();download();}}><Icon name="download" size={12} color="var(--accent)"/></button>
          <button type="button" title="Remove image" onClick={e=>{e.stopPropagation();removeUploadFor(id);}}>✕</button>
        </div>
      )}
    </div>
  );
}
