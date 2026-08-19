import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '../icons/Icon';
import { idbOpen, dataURLtoFile, idbPutImage, idbGetImages, idbDeleteImage, idbClearImages, getOrPickDir, uploadImageToStorage, uploadPendingImages, resetSessionDir } from '../../lib/idb';
import { cls } from '../../lib/helpers';

export default function ImageUpload({ baseName, multiple, onImages, immediateUpload=false, initialImages=[], caseNum="", businessName="", storageKey="default", isActive=false }) {
  // Filter out dead blob URLs that may come from server-saved drafts
  const validInitial = (initialImages || []).filter(img => !img.url?.startsWith('blob:'));
  const [images,setImages] = useState(()=>validInitial||[]);
  const [drag,setDrag] = useState(false);
  const [uploading,setUploading] = useState(false);
  const ref = useRef(); 
  const imgRef = useRef(images);
  useEffect(()=>{imgRef.current=images;},[images]);

  // Restore pending images from IndexedDB on mount (only for non-immediate upload)
  useEffect(() => {
    if (immediateUpload) return;
    let cancelled = false;
    idbGetImages(storageKey).then(stored => {
      if (cancelled) return;
      if (stored.length === 0 && validInitial.length === 0) return;
      const restored = stored.map(s => {
        const file = dataURLtoFile(s.data, s.name || 'image.png');
        return {
          id: s.id,
          url: URL.createObjectURL(file),
          name: s.meta.name || s.name,
          _file: file,
          _inDB: false,
          _fromIDB: true,
        };
      });
      // Merge valid initial images with restored pending images
      const existingIds = new Set(validInitial.map(i => i.id));
      const merged = [...validInitial, ...restored.filter(r => !existingIds.has(r.id))];
      setImages(merged);
      onImages && onImages(merged);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [immediateUpload, storageKey]); // intentional: do NOT re-run when initialImages changes

  // Sync if parent passes new initialImages (e.g. draft restore)
  const prevInit = useRef(initialImages);
  useEffect(()=>{
    const freshValid = (initialImages || []).filter(img => !img.url?.startsWith('blob:'));
    const hasNew = freshValid.some(img => !images.some(existing => existing.id === img.id));
    if(freshValid.length>0 && prevInit.current !== initialImages && (images.length===0 || hasNew)){
      const merged = [...images, ...freshValid.filter(img => !images.some(existing => existing.id === img.id))];
      setImages(merged); 
      imgRef.current=merged; 
      prevInit.current=initialImages;
      onImages && onImages(merged);
    }
  },[initialImages]);

  const addFiles = useCallback(async(files) => {
    const cur = imgRef.current;
    setUploading(true);
    try {
      let next;
      if (immediateUpload) {
        const uploaded = await Promise.all(
          Array.from(files).map((f, i) => {
            const name = multiple ? `backup-screenshot-${cur.length + i + 1}` : baseName;
            return uploadImageToStorage(f, name);
          })
        );
        const valid = uploaded.filter(Boolean);
        next = multiple ? [...cur, ...valid] : valid.slice(0, 1);
        idbClearImages(storageKey).catch(() => {});
      } else {
        const arr = Array.from(files).map((f, i) => {
          const id = `ram-${Date.now()}-${i}`;
          // Persist to IndexedDB so images survive page refresh
          idbPutImage(id, f, { name: multiple ? `backup-screenshot-${cur.length + i + 1}` : baseName, caseNum, storeKey: storageKey });
          return {
            _file: f,
            url: URL.createObjectURL(f),
            name: multiple ? `backup-screenshot-${cur.length + i + 1}` : baseName,
            id,
            _inDB: false,
          };
        });
        next = multiple ? [...cur, ...arr] : arr.slice(0, 1);
      }
      setImages(next); 
      onImages && onImages(next);
    } finally { 
      setUploading(false); 
    }
  }, [baseName, multiple, onImages, immediateUpload, caseNum, storageKey]);

  const remove = (id) => { 
    const n = imgRef.current.filter(i => i.id !== id); 
    setImages(n); 
    onImages && onImages(n); 
    idbDeleteImage(id).catch(() => {});
  };

  const dl = async(img) => {
    const urlExt = (img.url||"").split("?")[0].split(".").pop().toLowerCase();
    const safeExt = ["jpg","jpeg","png","gif","webp"].includes(urlExt) ? urlExt : "png";
    const baseName = (img.name||"screenshot").replace(/\.[^/.]+$/,"");
    const fileName = `${baseName}.${safeExt}`;
    if (window.showDirectoryPicker) {
      try {
        const dir = await getOrPickDir();
        const fh = await dir.getFileHandle(fileName, { create: true });
        const wr = await fh.createWritable();
        // Fetch blob — handle both http URLs and blob: URLs
        let blob;
        if (img._file) {
          blob = img._file;
        } else if (img.url?.startsWith("blob:")) {
          const r = await fetch(img.url);
          blob = await r.blob();
        } else {
          const r = await fetch(img.url);
          if (!r.ok) throw new Error("fetch failed: " + r.status);
          blob = await r.blob();
        }
        await wr.write(blob);
        await wr.close();
        showToast && showToast(`✅ Saved: ${fileName}`, "success");
        return;
      } catch(e) {
        if (e.name === "AbortError") return; // user cancelled folder picker
        // If folder picker failed (permission issue), reset so next click asks again
        if (e.name === "SecurityError") {
          resetSessionDir();
        }
        // Fallthrough to <a> download as fallback
      }
    }
    // Fallback: browser download
    const a = document.createElement("a"); a.href = img.url; a.download = fileName; a.click();
  };

  useEffect(() => {
    // Only capture paste events when this upload accordion is the active/open one
    if(!isActive) return;
    const h = (e) => { 
      // Don't intercept if user is typing in an input/textarea
      const tag=(document.activeElement?.tagName||"").toLowerCase();
      if(tag==="input"||tag==="textarea") return;
      const items = Array.from(e.clipboardData?.items||[]).filter(i=>i.kind==="file"); 
      if(items.length){ e.preventDefault(); addFiles(items.map(i=>i.getAsFile())); }
    };
    window.addEventListener("paste", h); 
    return () => window.removeEventListener("paste", h);
  }, [addFiles, isActive]);

  return (
    <div>
      <div className={cls("img-zone", drag&&"drag")} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files);}} onClick={()=>!uploading&&ref.current?.click()}>
        <input ref={ref} type="file" accept="image/*" multiple={multiple} onChange={e=>addFiles(e.target.files)} style={{pointerEvents:"none"}}/>
        <div style={{fontSize:28,marginBottom:8}}>{uploading ? <Icon name="loading" size={28} color="var(--accent)"/> : <Icon name="image" size={28} color="var(--muted)"/>}</div>
        <div style={{fontSize:13,color:"var(--muted)"}}>
          {uploading
            ? (immediateUpload ? "Uploading to database…" : "Preparing image…")
            : <span>Click, drag-drop, or <kbd style={{background:"var(--border)",padding:"1px 6px",borderRadius:4,fontSize:10}}>Ctrl+V</kbd> to paste</span>
          }
        </div>
        <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>
          {immediateUpload
            ? <>Saved as: <span style={{color:"var(--accent)",fontWeight:600}}>{baseName}</span></>
            : <>Name on save: <span style={{color:"var(--accent)",fontWeight:600}}>{baseName}</span> · <span style={{color:"var(--amber)"}}>⏳ uploads when case is saved</span></>
          }
        </div>
      </div>
      {images.length > 0 && (
        <div className="img-thumb-row">
          {images.map(img => (
            <div key={img.id} style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
              <div className="img-thumb" style={{position:"relative"}}>
                <img src={img.url} alt=""/>
                <button className="img-thumb-del" onClick={()=>remove(img.id)}>✕</button>
                {img._inDB && <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(16,185,129,.85)",color:"#fff",fontSize:9,textAlign:"center",padding:"1px 0"}}>✓ in DB</div>}
                {!img._inDB && <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(245,158,11,.85)",color:"#fff",fontSize:9,textAlign:"center",padding:"1px 0"}}>⏳ on save</div>}
              </div>
              <button className="img-dl-btn" onClick={()=>dl(img)}>⬇ Save</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

