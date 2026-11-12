import { useRef, useState } from 'react'
import { getOrPickDir, resetSessionDir } from '@/services/downloadDirectory'
import { CopyRow } from './CopyRow'
import { GreetingRow } from './GreetingRow'
import { fetchImageBlob } from '@/utils/files'

export function StickyPanel({ startTimeRef, form, isSC, buildEntriesText, buildEmailText, onTimerEnd, onQaTimerEnd, specialRequestors, timerLimitSecs, qaTimerLimitSecs=600, greetingMessages, footerElapsed=0, phase2Elapsed=null }) {
  const [dlState,setDlState]=useState("idle"); // idle | downloading | done | error
  const summaryPanelRef=useRef(null);

  // form is real React state — re-renders on every form change, images update instantly
  const f=form;
  const emailTypeLabel=f.emailType==="clarification"?"Clarification":"Completed";
  const allImages=[...(f.images||[]),...(f.backupImages||[])];

  return (
    <div className="right-panel">
      <div className="right-panel-header" style={{display:"block"}}>
        <div style={{display:"flex",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Information Summary</span>
          {f.caseNum&&<span style={{marginLeft:"auto",fontSize:11,fontWeight:600,color:"var(--accent)",background:"var(--entry-accent-bg)",padding:"2px 10px",borderRadius:20,border:"1px solid rgba(64,81,59,.2)"}}>#{f.caseNum}</span>}
        </div>
        <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Click the card to copy the information</div>
      </div>

      {/* ── Body: summary content + right-side dot rail ── */}
      <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>

      <div className="summary-panel" ref={summaryPanelRef} style={{flex:1,minWidth:0}}>
        {/* ── GROUP 1: Case Info (blue) ── */}
        <div id="sum-g-caseinfo" style={{marginBottom:10}}>
          <div style={{fontSize:9,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>1. Case Information</div>
          <CopyRow label="Account #" value={f.accountNum}/>
          <CopyRow label="Case #" value={f.caseNum}/>
          {!isSC&&<CopyRow label="Inbound #" value={f.inboundNum}/>}
          <CopyRow label="Amend Type" value={f.amendType}/>
        </div>
        {/* ── GROUP 2: Customer Info — only if any filled ── */}
        {(f.customerName||f.customerEmail||f.businessName)&&(
          <div id="sum-g-customer" style={{marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>2. Customer Information</div>
            {f.customerName&&<CopyRow label="Customer Name" value={f.customerName}/>}
            {f.customerEmail&&<CopyRow label="Customer Email" value={f.customerEmail}/>}
            {f.businessName&&<CopyRow label="Business Name" value={f.businessName+(f.businessSuffix?' '+f.businessSuffix:'')}/>}
          </div>
        )}
        {/* ── GROUP 3: Assumptions ── */}
        <div id="sum-g-amends" style={{marginBottom:10}}>
          <div style={{fontSize:9,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>3. Assumptions</div>
          <CopyRow label={isSC?"Site Comments":"Assumptions"} value={isSC?buildEntriesText():buildEmailText()}/>
          {(()=>{
            const entries=f.entries.filter(e=>e.clarification&&e.clarification.trim());
            if(!entries.length)return null;
            const clarifLines=isSC
              ?entries.map(e=>`Site Comment #${e.number}: ${e.clarification.trim()}`).join("\n\n")
              :entries.map(e=>e.clarification.trim()).join("\n\n");
            return <CopyRow label="Email Format" value={clarifLines}/>;
          })()}
        </div>
        {/* ── GROUP 4: Messages (blue chips) ── */}
        {f.caseNum&&(
          <div id="sum-g-messages" style={{marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Messages</div>
            <GreetingRow greetingMessages={greetingMessages} caseNum={f.caseNum} inboundNum={f.inboundNum} isSC={isSC}/>
          </div>
        )}
        {/* ── GROUP 5: Email — inbound only ── */}
        {!isSC&&(
          <div id="sum-g-email" style={{marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Email</div>
            <CopyRow label="Email Type" value={emailTypeLabel}/>
            <CopyRow label="Email Address" value={f.emailAddress}/>
          </div>
        )}
        {allImages.length > 0 && (
  <div
    className="copy-row-wrap"
    style={{
      cursor: dlState==="downloading"?"wait":"pointer",
      border: dlState==="done"?"1px solid var(--green)":dlState==="error"?"1px solid var(--red)":"",
      transition:".25s",
    }}
    onClick={async () => {
      if(dlState==="downloading") return;
      setDlState("downloading");
      try {
        const bizPart = (f.businessName || "").trim();
        const cx=(f._caseComplexity||"minor");const cxLabel=cx==="major"?"Major":cx==="complex"?"Complex":"Minor";const folderName = `${cxLabel} ${f.caseNum||"unknown"}${bizPart?" "+bizPart:""}`
          .replace(/[^a-zA-Z0-9 _()-]/g, "").replace(/\s+/g," ").trim();

        // Helper: get blob — prefer _file (in-memory), fallback fetch
        const getBlob = async (img) => {
          if (img._file instanceof File || img._file instanceof Blob) return img._file;
          return fetchImageBlob(img.url);
        };

        if (window.showDirectoryPicker) {
          // Must call getOrPickDir immediately (first await) to preserve user-gesture context
          let rootDir;
          try { rootDir = await getOrPickDir(); }
          catch (err) {
            if (err.name === "AbortError"){ setDlState("idle"); return; }
            // Permission/security error — reset cached handle so next click re-asks
            if (err.name === "SecurityError") { resetSessionDir(); }
            throw err; // re-throw so outer catch shows error state
          }

          const caseDir = await rootDir.getDirectoryHandle(folderName, { create: true });
          for (const img of allImages) {
            try {
              const urlExt = (img.url || "").split("?")[0].split(".").pop().toLowerCase();
              const safeExt = ["jpg","jpeg","png","gif","webp"].includes(urlExt) ? urlExt : "png";
              const baseName = (img.name || "screenshot").replace(/\.[^/.]+$/, "");
              const blob = await getBlob(img);
              const fh = await caseDir.getFileHandle(`${baseName}.${safeExt}`, { create: true });
              const wr = await fh.createWritable();
              await wr.write(blob);
              await wr.close();
            } catch (imgErr) { console.warn("img failed:", imgErr); }
          }
          setDlState("done"); setTimeout(()=>setDlState("idle"),3000);
          return;
        }

        // Fallback for browsers without File System API (Firefox etc): individual <a> downloads — no zip
        for (const img of allImages) {
          try {
            const urlExt = (img.url||"").split("?")[0].split(".").pop().toLowerCase();
            const safeExt = ["jpg","jpeg","png","gif","webp"].includes(urlExt) ? urlExt : "png";
            const baseName = (img.name || "screenshot").replace(/\.[^/.]+$/,"");
            const blob = await getBlob(img);
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${baseName}.${safeExt}`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
          } catch (err) { console.warn("img failed:", err); }
        }
        setDlState("done"); setTimeout(()=>setDlState("idle"),3000);
      } catch (err) {
        console.error("Bulk download failed:", err);
        setDlState("error"); setTimeout(()=>setDlState("idle"),3000);
      }
    }}
  >
    <div className="copy-row-label">
      Screenshots ({allImages.length})
    </div>

    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
      {allImages.map((img) => (
        <div
          key={img.id}
          style={{
            width: 68,
            height: 52,
            borderRadius: 6,
            overflow: "hidden",
            border: img._inDB ? "1.5px solid var(--green)" : "1.5px solid var(--amber)",
            position: "relative",
          }}
        >
          <img
            src={img.url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: img._inDB ? "rgba(16,185,129,.85)" : "rgba(245,158,11,.85)",
            color: "#fff", fontSize: 8, textAlign: "center",
            padding: "2px 0", fontWeight: 700, letterSpacing: ".3px",
          }}>
            {img._inDB ? "SAVED" : "⏳ ON SAVE"}
          </div>
        </div>
      ))}
    </div>

    {/* 👇 STATUS TEXT */}
    <div style={{marginTop:6,fontSize:11,fontWeight:700,textAlign:"center",transition:".2s",
      color: dlState==="done"?"var(--green)":dlState==="downloading"?"var(--accent)":dlState==="error"?"var(--red)":"var(--muted)",
    }}>
      {dlState==="done"   && "Download Complete!"}
      {dlState==="downloading" && "⏳ Downloading…"}
      {dlState==="error"  && "Download failed"}
      {dlState==="idle"   && "Click to download All"}
    </div>
  </div>
)}
      </div>

      </div>{/* closes flex body wrapper */}
    </div>
  );
}
