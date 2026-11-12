import { Icon } from '@/components/ui/Icon'

export function SuspendedCasesList({ breakActive, dbDrafts, enterMode, isMinimised, setDeleteDraftConfirm, timedIn }) {
  return (
    <div style={{marginBottom:22}}>
          <div className="section-title">Suspended Cases</div>
          {dbDrafts.map((d,i)=>(
            <div key={d._id||i} className="draft-row">
              <div className="draft-dot"/>
              <div className="saved-info">
                <div className="saved-case">Case #{d.caseNum||"—"} — {d.accountNum||"—"}</div>
                <div className="saved-meta">{d.amendType||"No amend type"} · {d.draftAt}</div>
                {(d.customerName||d.customerEmail||d.businessName)&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>
                    {d.customerName&&<span style={{fontSize:10,padding:"1px 7px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:20,color:"var(--muted)",fontFamily:"'Poppins',sans-serif"}}>👤 {d.customerName}</span>}
                    {d.customerEmail&&<span style={{fontSize:10,padding:"1px 7px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:20,color:"var(--muted)",fontFamily:"'Poppins',sans-serif"}}>✉️ {d.customerEmail}</span>}
                    {d.businessName&&<span style={{fontSize:10,padding:"1px 7px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:20,color:"var(--muted)",fontFamily:"'Poppins',sans-serif"}}>🏢 {d.businessName}{d.businessSuffix?' '+d.businessSuffix:''}</span>}
                  </div>
                )}
              </div>
              <span className="draft-badge">{d._mode==="siteComment"?"Site Comment":"Inbound Email"}</span>
              {(()=>{const b=d._bundledWith;if(!b)return null;const nums=(Array.isArray(b)?b:[b]).filter(Boolean);if(!nums.length)return null;const isMulti=nums.length>1;const col=isMulti?"#f59e0b":"#10b981";const bg=isMulti?"rgba(245,158,11,.14)":"rgba(16,185,129,.14)";const bdr=isMulti?"1px solid rgba(245,158,11,.35)":"1px solid rgba(16,185,129,.35)";return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:bg,border:bdr,color:col,fontWeight:700,flexShrink:0,fontFamily:"'Poppins',sans-serif"}}>w/ #{nums.join(", #")}</span>;})()}
              <button className="draft-resume" disabled={!timedIn||breakActive||isMinimised} onClick={()=>enterMode(d._mode, true, d._id)} style={{opacity:(!timedIn||breakActive||isMinimised)?.45:1,cursor:(!timedIn||breakActive||isMinimised)?"not-allowed":"pointer"}}><Icon name="play" size={11} style={{marginRight:4}}/> Continue</button>
              <button
                className="entry-del"
                title="Archive"
                disabled={!timedIn||breakActive||isMinimised}
                onClick={() => setDeleteDraftConfirm({ id: d._id, mode: d._mode })}
                style={{
                  marginLeft: 4,
                  borderRadius: "6px",
                  backgroundColor: "var(--amber)",
                  padding: "10px 10px",
                  border: "rgba(245,158,11,.4) 1px solid",
                  cursor: (!timedIn||breakActive||isMinimised)?"not-allowed":"pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  opacity: (!timedIn||breakActive||isMinimised)?0.45:1,
                  fontSize: "clamp(12px, 1vw, 14px)"
                }}
                onMouseEnter={(e) => {
                  if(!(!timedIn||breakActive||isMinimised)) e.currentTarget.style.boxShadow = "0 0 8px 2px rgba(245,158,11,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Icon name="archive" size={13} color="#fff" />
              </button>
            
            </div>
          ))}
        </div>
  )
}
