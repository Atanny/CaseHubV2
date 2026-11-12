export function TrackerLinkSection({ D, c, editMode, setD }) {
  return (
    <div className="case-section">
                <div className="case-section-title">Tracker Link</div>
                {editMode ? (
                  <div className="field" style={{marginBottom:0}}>
                    <input
                      className="inp"
                      type="url"
                      placeholder="https://..."
                      value={D.trackerChecklistLink||""}
                      onChange={e=>setD({trackerChecklistLink:e.target.value})}
                      style={{fontSize:12}}
                    />
                  </div>
                ) : (
                  c.trackerChecklistLink ? (
                    <a
                      href={c.trackerChecklistLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display:"inline-flex",alignItems:"center",gap:6,
                        fontSize:13,fontWeight:600,color:"var(--accent)",
                        wordBreak:"break-all",padding:"6px 10px",
                        background:"var(--entry-accent-bg)",
                        border:"1px solid rgba(64,81,59,.2)",
                        borderRadius:8,textDecoration:"none",
                        transition:".15s",maxWidth:"100%",
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(64,81,59,.18)"}
                      onMouseLeave={e=>e.currentTarget.style.background="var(--entry-accent-bg)"}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      {c.trackerChecklistLink}
                    </a>
                  ) : <span style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",fontFamily:"'Poppins',sans-serif"}}>— No tracker link saved</span>
                )}
              </div>
  )
}
