import { getOrPickDir } from '@/services/downloadDirectory'
import { fetchImageBlob } from '@/utils/files'

export function ScreenshotsSection({ D, addImages, allImages, c, editMode, onLightbox, removeImage, replaceImage, startEdit }) {
  return (
    <div className="case-section">
              <div className="edit-section-header">
                <div className="case-section-title" style={{marginBottom:0}}> Screenshots {editMode?"":`(${allImages.length})`}</div>
              </div>
              {editMode ? (
                <>
                  {/* Main screenshots */}
                  <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>Main Screenshots</div>
                  <div className="img-edit-grid">
                    {(D.images||[]).map(img=>(
                      <div key={img.id} className="img-edit-item">
                        <img src={img.url} alt={img.name}/>
                        <button className="img-edit-del" onClick={()=>removeImage("images",img.id)}>✕</button>
                        <label className="img-edit-replace">
                          🔄 Replace
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&replaceImage("images",img.id,e.target.files[0])}/>
                        </label>
                      </div>
                    ))}
                    <label className="img-add-zone">
                      <input type="file" accept="image/*" multiple onChange={e=>addImages(e.target.files,"images")}/>
                      <span style={{fontSize:20}}>＋</span>
                      <span>Add</span>
                    </label>
                  </div>
                  {/* Backup screenshots */}
                  <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",margin:"14px 0 6px",textTransform:"uppercase",letterSpacing:".5px"}}>Backup Screenshots</div>
                  <div className="img-edit-grid">
                    {(D.backupImages||[]).map(img=>(
                      <div key={img.id} className="img-edit-item">
                        <img src={img.url} alt={img.name}/>
                        <button className="img-edit-del" onClick={()=>removeImage("backupImages",img.id)}>✕</button>
                        <label className="img-edit-replace">
                          🔄 Replace
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&replaceImage("backupImages",img.id,e.target.files[0])}/>
                        </label>
                      </div>
                    ))}
                    <label className="img-add-zone">
                      <input type="file" accept="image/*" multiple onChange={e=>addImages(e.target.files,"backupImages")}/>
                      <span style={{fontSize:20}}>＋</span>
                      <span>Add</span>
                    </label>
                  </div>
                </>
              ) : (
                allImages.length===0
                  ? <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                      <span style={{color:"var(--muted)",fontSize:12}}>No screenshots</span>
                      <button className="h-btn" style={{fontSize:11,padding:"4px 10px",borderColor:"var(--accent)",color:"var(--accent)"}} onClick={startEdit}>＋ Add via Edit</button>
                    </div>
                  : <>
                      <div className="case-imgs">
                        {allImages.map(img=>(<div key={img.id||img.name} className="case-img-thumb" title={img.name} onClick={()=>onLightbox(img.url)}><img src={img.url} alt={img.name}/></div>))}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,color:"var(--muted)"}}>Click to enlarge</span>
                        <button className="h-btn" style={{fontSize:11,padding:"4px 10px",borderColor:"var(--accent)",color:"var(--accent)"}} onClick={startEdit}>＋ Add / Edit</button>
                        <button className="h-btn" style={{fontSize:11,padding:"4px 10px",borderColor:"var(--green)",color:"var(--green)",fontWeight:700}} onClick={async()=>{
                          try{
                            const bizPart=(c.businessName||"").trim();const folderName=`${c.caseNum||"unknown"}${bizPart?" - "+bizPart:""}`.replace(/[^a-zA-Z0-9 _()-]/g,"").replace(/\s+/g," ").trim();
                            if(window.showDirectoryPicker){
                              try{
                                const rootDir=await getOrPickDir();
                                const caseDir=await rootDir.getDirectoryHandle(folderName,{create:true});
                                for(const img of allImages){
                                  try{
                                    const urlExt=(img.url||"").split("?")[0].split(".").pop().toLowerCase();
                                    const safeExt=["jpg","jpeg","png","gif","webp"].includes(urlExt)?urlExt:"png";
                                    const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
                                    const fileName=`${baseName}.${safeExt}`;
                                    const blob=await fetchImageBlob(img.url);
                                    const fh=await caseDir.getFileHandle(fileName,{create:true});
                                    const wr=await fh.createWritable();
                                    await wr.write(blob);await wr.close();
                                  }catch(e){console.warn("Image save failed:",e);}
                                }
                                return;
                              }catch(e){if(e.name==="AbortError")return;}
                            }
                            // Fallback: individual downloads with folder/filename path
                            for(const img of allImages){
                              try{
                                const urlExt=(img.url||"").split("?")[0].split(".").pop().toLowerCase();
                                const safeExt=["jpg","jpeg","png","gif","webp"].includes(urlExt)?urlExt:"png";
                                const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
                                const blob=await fetchImageBlob(img.url);
                                const a=document.createElement("a");a.href=URL.createObjectURL(blob);
                                a.download=`${folderName}/${baseName}.${safeExt}`;
                                document.body.appendChild(a);a.click();document.body.removeChild(a);
                                URL.revokeObjectURL(a.href);
                                await new Promise(r=>setTimeout(r,120));
                              }catch(e){console.warn("Image fetch failed:",e);}
                            }
                          }catch(e){console.error("Bulk download failed:",e);}
                        }}>⬇ Bulk Download</button>
                      </div>
                    </>
              )}
            </div>
  )
}
