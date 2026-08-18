import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../icons/Icon';
import GreetingRow from './GreetingRow';
import { copyToClipboard } from '../../lib/helpers';

export default function StickyPanel({ startTimeRef, form, isSC, buildEntriesText, buildEmailText, onTimerEnd, onQaTimerEnd, specialRequestors, timerLimitSecs, qaTimerLimitSecs=600, greetingMessages, footerElapsed=0, phase2Elapsed=null }) {
  const [elapsed,setElapsed]=useState(0);
  const [now,setNow]=useState(new Date());
  const firedRef=useRef(false);
  const qaFiredRef=useRef(false);
  const [dlState,setDlState]=useState("idle"); // idle | downloading | done | error
  const summaryPanelRef=useRef(null);

  const scrollToGroup = useCallback((id) => {
    const panel = summaryPanelRef.current;
    const el = document.getElementById(id);
    if (el && panel) {
      const offset = el.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
      panel.scrollTo({ top: Math.max(0, offset - 8), behavior: 'smooth' });
    }
  }, []);

  // Display-only sync — alarm firing now happens at the PostLivePage parent level
  // (more reliable across mount/queue/activation cycles, since it's keyed off the same
  // tabTimerStates that already drives the tab strip and TimerBar). This effect just
  // keeps StickyPanel's own visual clock in sync; it does not fire any alarm itself.
  useEffect(()=>{
    setElapsed(footerElapsed);
    setNow(new Date());
  },[footerElapsed]);
  // form is real React state — re-renders on every form change, images update instantly
  const f=form;
  const emailTypeLabel=f.emailType==="clarification"?"Clarification":"Completed";
  const allImages=[...(f.images||[]),...(f.backupImages||[])];

  // Color dot nav entries — only show dots for visible groups
  const navDots = [
    { id:'sum-g-caseinfo',  color:'#0176D3', label:'Case Info',     abbr:'CI'  },
    ...(f.customerName||f.customerEmail||f.businessName ? [{ id:'sum-g-customer', color:'#f59e0b', label:'Customer Info', abbr:'CU'  }] : []),
    { id:'sum-g-amends',   color:'#f5945c', label:'Amends Copy',  abbr:'AC'  },
    ...(f.caseNum ? [{ id:'sum-g-messages', color:'#38bdf8', label:'Messages',     abbr:'MSG' }] : []),
    ...(!isSC ? [{ id:'sum-g-email', color:'#a78bfa', label:'Email',          abbr:'EM'  }] : []),
  ];

  return (
    <div className="right-panel">
      <div className="right-panel-header">
        <span style={{fontSize:16,marginRight:8}}>📊</span> Live Summary
        {f.caseNum&&<span style={{marginLeft:"auto",fontSize:11,fontWeight:600,color:"var(--accent)",background:"var(--entry-accent-bg)",padding:"2px 10px",borderRadius:20,border:"1px solid rgba(1,118,211,.2)"}}>#{f.caseNum}</span>}
      </div>

      {/* ── Body: summary content + right-side dot rail ── */}
      <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>

      <div className="summary-panel" ref={summaryPanelRef} style={{flex:1,minWidth:0}}>
        {/* ── GROUP 1: Case Info (blue) ── */}
        <div id="sum-g-caseinfo" style={{marginBottom:10}}>
          <div style={{fontSize:9,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Case Info</div>
          <CopyRow label="Account #" value={f.accountNum} groupColor="rgba(1,118,211,.13)" groupBorder="rgba(1,118,211,.28)"/>
          <CopyRow label="Case #" value={f.caseNum} groupColor="rgba(1,118,211,.13)" groupBorder="rgba(1,118,211,.28)"/>
          {!isSC&&<CopyRow label="Inbound #" value={f.inboundNum} groupColor="rgba(1,118,211,.13)" groupBorder="rgba(1,118,211,.28)"/>}
          <CopyRow label="Amend Type" value={f.amendType} groupColor="rgba(1,118,211,.13)" groupBorder="rgba(1,118,211,.28)"/>
        </div>
        {/* ── GROUP 2: Customer Info (amber) — only if any filled ── */}
        {(f.customerName||f.customerEmail||f.businessName)&&(
          <div id="sum-g-customer" style={{marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--amber)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Customer Info</div>
            {f.customerName&&<CopyRow label="Customer Name" value={f.customerName} groupColor="rgba(245,158,11,.1)" groupBorder="rgba(245,158,11,.3)"/>}
            {f.customerEmail&&<CopyRow label="Customer Email" value={f.customerEmail} groupColor="rgba(245,158,11,.1)" groupBorder="rgba(245,158,11,.3)"/>}
            {f.businessName&&<CopyRow label="Business Name" value={f.businessName+(f.businessSuffix?' '+f.businessSuffix:'')} groupColor="rgba(245,158,11,.1)" groupBorder="rgba(245,158,11,.3)"/>}
          </div>
        )}
        {/* ── GROUP 3: Amends Copy (orange-accent) ── */}
        <div id="sum-g-amends" style={{marginBottom:10}}>
          <div style={{fontSize:9,fontWeight:700,color:"rgb(245,148,92)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Amends Copy</div>
          <CopyRow label={isSC?"Site Comments":"Assumptions"} value={isSC?buildEntriesText():buildEmailText()} groupColor="rgba(245,148,92,.1)" groupBorder="rgba(245,148,92,.3)"/>
          {(()=>{
            const entries=f.entries.filter(e=>e.clarification&&e.clarification.trim());
            if(!entries.length)return null;
            const clarifLines=isSC
              ?entries.map(e=>`Site Comment #${e.number}: ${e.clarification.trim()}`).join("\n\n")
              :entries.map(e=>e.clarification.trim()).join("\n\n");
            return <CopyRow label="Email Format" value={clarifLines} groupColor="rgba(245,148,92,.1)" groupBorder="rgba(245,148,92,.3)"/>;
          })()}
        </div>
        {/* ── GROUP 4: Messages (blue chips) ── */}
        {f.caseNum&&(
          <div id="sum-g-messages" style={{marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Messages</div>
            <GreetingRow greetingMessages={greetingMessages} caseNum={f.caseNum} inboundNum={f.inboundNum} isSC={isSC}/>
          </div>
        )}
        {/* ── GROUP 5: Email (purple) — inbound only ── */}
        {!isSC&&(
          <div id="sum-g-email" style={{marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Email</div>
            <CopyRow label="Email Type" value={emailTypeLabel} groupColor="rgba(124,58,237,.1)" groupBorder="rgba(124,58,237,.3)"/>
            <CopyRow label="Email Address" value={f.emailAddress} groupColor="rgba(124,58,237,.1)" groupBorder="rgba(124,58,237,.3)"/>
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
          const r = await fetch(img.url); return r.blob();
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
            {img._inDB ? "✓ SAVED" : "⏳ ON SAVE"}
          </div>
        </div>
      ))}
    </div>

    {/* 👇 STATUS TEXT */}
    <div style={{marginTop:6,fontSize:11,fontWeight:700,textAlign:"center",transition:".2s",
      color: dlState==="done"?"var(--green)":dlState==="downloading"?"var(--accent)":dlState==="error"?"var(--red)":"var(--muted)",
    }}>
      {dlState==="done"   && "✅ Download Complete!"}
      {dlState==="downloading" && "⏳ Downloading…"}
      {dlState==="error"  && "❌ Download failed"}
      {dlState==="idle"   && "Click to download All"}
    </div>
  </div>
)}
      </div>

      {/* ── Right-side color dot rail ── */}
      <div style={{
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        gap:10,padding:"10px 4px",
        borderLeft:"1px solid var(--border)",
        background:"var(--card)",
        flexShrink:0,width:28,
      }}>
        {navDots.map(dot=>(
          <button
            key={dot.id}
            onClick={()=>scrollToGroup(dot.id)}
            title={dot.label}
            style={{
              display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              background:"none",border:"none",padding:"3px 2px",
              cursor:"pointer",flexShrink:0,
              borderRadius:6,
              transition:".15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background=`${dot.color}18`;}}
            onMouseLeave={e=>{e.currentTarget.style.background="none";}}
          >
            <span style={{
              width:9,height:9,borderRadius:"50%",
              background:dot.color,
              display:"inline-block",flexShrink:0,
              opacity:.7,
              transition:".15s",
            }}/>
            <span style={{
              fontSize:7,fontWeight:800,
              color:dot.color,
              letterSpacing:".4px",
              lineHeight:1,
              fontFamily:"'Poppins',sans-serif",
              opacity:.8,
            }}>{dot.abbr}</span>
          </button>
        ))}
      </div>

      </div>{/* closes flex body wrapper */}
    </div>
  );
}

