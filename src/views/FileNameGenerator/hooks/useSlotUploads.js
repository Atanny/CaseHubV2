import { useState } from 'react'
import { fngDownloadName } from '../fngUtils'
import { fetchImageBlob } from '@/utils/files'

export function useSlotUploads({ showToast }) {
  // ── Upload state for the Figma-style upload slots (id = same key already used for copy/CopyCell) ──
  const [uploads,setUploads]   = useState({});      // id -> {url,name,_file,id}
  const [selected,setSelected] = useState(()=>new Set());
  const [activeSlotId,setActiveSlotId] = useState(null);
  const setUploadFor = (id,img) => { setUploads(u=>({...u,[id]:img})); setSelected(s=>new Set(s).add(id)); };
  const removeUploadFor = (id) => { setUploads(u=>{const n={...u};delete n[id];return n;}); setSelected(s=>{const n=new Set(s);n.delete(id);return n;}); };
  const toggleSelected = (id) => setSelected(s=>{const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n;});
  const selectableIds = () => Object.keys(uploads);
  const allSelected = selectableIds().length>0 && selectableIds().every(id=>selected.has(id));
  const selectAll = () => setSelected(allSelected ? new Set() : new Set(selectableIds()));
  const downloadSelected = async() => {
    const ids = selectableIds().filter(id=>selected.has(id));
    if(!ids.length){ showToast('No images selected','info'); return; }
    for(const id of ids){
      const img = uploads[id];
      if(!img) continue;
      const fileName = fngDownloadName(img.name, img);
      const blob = img._file instanceof Blob ? img._file : await fetchImageBlob(img.url);
      const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=fileName;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      await new Promise(r=>setTimeout(r,120)); // avoid the browser dropping rapid-fire downloads
    }
    showToast(`Downloaded ${ids.length} file${ids.length!==1?'s':''} ✅`,'success');
  };

  return { activeSlotId, allSelected, downloadSelected, removeUploadFor, selectAll, selected, setActiveSlotId, setUploadFor, toggleSelected, uploads }
}
