export function BundleCasesModal({ bundleForm, caseOptions, enterMode, setBundleForm, setBundleModal, showToast }) {
  return (
    <div className="modal-bg">
  <div className="modal" style={{ maxWidth: 440 }}>
    
    <div style={{ marginBottom: 10, fontSize: 32, textAlign: "center" }}>🔗</div>

    <h3 style={{ marginBottom: 6, textAlign: "center" }}>Bundle Cases</h3>

    <p
      style={{
        color: "var(--muted)",
        fontSize: 13,
        marginBottom: 18,
        lineHeight: 1.6,
        textAlign: "center",
      }}
    >
      Start a new case bundled with an existing one. A{" "}
      <span style={{ color: "#10b981", fontWeight: 700 }}>Bundled</span>{" "}
      badge will appear on <strong>both</strong> cases in Case History.
    </p>

    <div className="field" style={{ marginBottom: 14 }}>
      <label style={{ marginBottom: 6, display: "block" }}>
        New Case Type
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <label
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            background:
              bundleForm.type === "site"
                ? "#fef3c7"
                : "var(--entry-bg)",
            borderColor:
              bundleForm.type === "site"
                ? "#f59e0b"
                : "var(--border)",
            color:
              bundleForm.type === "site"
                ? "#92400e"
                : "var(--text)",
          }}
        >
          <input
            type="radio"
            name="bundleType"
            checked={bundleForm.type === "site"}
            onChange={() =>
              setBundleForm((f) => ({ ...f, type: "site" }))
            }
          />
          Site Comment
        </label>

        <label
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            background:
              bundleForm.type === "inbound"
                ? "#dcfce7"
                : "var(--entry-bg)",
            borderColor:
              bundleForm.type === "inbound"
                ? "#22c55e"
                : "var(--border)",
            color:
              bundleForm.type === "inbound"
                ? "#166534"
                : "var(--text)",
          }}
        >
          <input
            type="radio"
            name="bundleType"
            checked={bundleForm.type === "inbound"}
            onChange={() =>
              setBundleForm((f) => ({ ...f, type: "inbound" }))
            }
          />
          Inbound Email
        </label>
      </div>
    </div>

    <div className="field">
      <label>
        Bundle with Case from This Session{" "}
        <span className="req">*</span>
      </label>

      {caseOptions.length > 0 ? (
        <select
          className="inp"
          value={bundleForm.caseNum}
          onChange={(e) =>
            setBundleForm((f) => ({
              ...f,
              caseNum: e.target.value,
            }))
          }
          style={{ cursor: "pointer" }}
        >
          <option value="">— Select a case —</option>
          {caseOptions.map((c) => (
            <option key={c._id || c.caseNum} value={c.caseNum}>
              #{c.caseNum}
              {c.accountNum ? ` — ${c.accountNum}` : ""}
              {c.amendType ? ` · ${c.amendType}` : ""}
              {c.source === "suspended" ? " ⏸" : ""}
              {c.source === "saved" ? " ✅" : ""}
              {c.source === "session" ? " 🕐" : ""}
              {c._bundledWith ? " 🔗" : ""}
            </option>
          ))}
        </select>
      ) : (
        <div
          style={{
            padding: "12px 14px",
            background: "var(--entry-bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--muted)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          No saved cases found.
          <br />
          Complete or suspend a case first, then bundle.
        </div>
      )}

      {bundleForm.caseNum &&
        (() => {
          const sel = caseOptions.find(
            (o) => o.caseNum === bundleForm.caseNum
          );
          if (!sel) return null;

          const statusLabel =
            sel.source === "suspended"
              ? "Suspended"
              : sel.source === "saved"
              ? "Saved"
              : "Session";

          return (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "var(--muted)",
                padding: "6px 10px",
                background: "var(--entry-bg)",
                borderRadius: 6,
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <strong style={{ color: "var(--text)" }}>
                #{sel.caseNum}
              </strong>

              {sel.accountNum && (
                <span>· {sel.accountNum}</span>
              )}

              {sel._mode && (
                <span>
                  ·{" "}
                  {sel._mode === "siteComment"
                    ? "Site Comment"
                    : "Inbound Email"}
                </span>
              )}

              {(()=>{
                const cx=sel._caseComplexity||"minor";
                if(cx==="major") return <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",color:"#f59e0b",fontWeight:700}}>Major</span>;
                if(cx==="complex") return <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"rgba(197,68,70,.12)",border:"1px solid rgba(197,68,70,.3)",color:"#c54446",fontWeight:700}}>Complex</span>;
                return <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",color:"#10b981",fontWeight:700}}>Minor</span>;
              })()}

              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  padding: "1px 7px",
                  borderRadius: 20,
                  background: "var(--card2)",
                  color: "var(--muted)",
                  fontWeight: 600,
                }}
              >
                {statusLabel}
              </span>

              {sel._bundledWith && (
                <span
                  style={{
                    color: "#10b981",
                    fontWeight: 700,
                    fontSize: 10,
                  }}
                >
                  🔗 Already bundled
                </span>
              )}
            </div>
          );
        })()}
    </div>

    <div className="modal-btns">
      <button
        className="btn btn-ghost"
        onClick={() => setBundleModal(false)}
      >
        Cancel
      </button>

      <button
        className="btn btn-primary"
        onClick={() => {
          if (!bundleForm.caseNum.trim()) {
            showToast("Select a case to bundle", "error");
            return;
          }

          // Store the full existing case data so the new bundle form can be prefilled
          const selCase = caseOptions.find(o=>o.caseNum===bundleForm.caseNum.trim());
          if(selCase?._fullData && typeof window!=="undefined"){
            try{
              // Only carry over images already in storage (have url, no pending _file blob).
              // Note: images loaded from DB don't carry _inDB:true, so we check url+!_file instead.
              const safeImages = (selCase._fullData.images||[])
                .filter(i=>i.url&&!i._file)
                .map(i=>({...i,_inDB:true}));
              const safeBackups = (selCase._fullData.backupImages||[])
                .filter(i=>i.url&&!i._file)
                .map(i=>({...i,_inDB:true}));
              const prefill = {
                // CASE INFORMATION (except case number)
                accountNum: selCase._fullData.accountNum||"",
                amendType: selCase._fullData.amendType||"",
                customerName: selCase._fullData.customerName||"",
                customerEmail: selCase._fullData.customerEmail||"",
                businessName: selCase._fullData.businessName||"",
                businessSuffix: selCase._fullData.businessSuffix||"",
                inboundNum: selCase._fullData.inboundNum||"",
                inProgress: selCase._fullData.inProgress||false,
                emailAddress: selCase._fullData.emailAddress||"",
                emailType: selCase._fullData.emailType||"clarification",
                trackerChecklistLink: selCase._fullData.trackerChecklistLink||"",
                _caseComplexity: selCase._fullData._caseComplexity||"minor",
                // ASSUMPTION/CASE COMMENT
                entries: selCase._fullData.entries||[],
                // ADDITIONAL BACKUP SCREENSHOT
                images: safeImages,
                // BEFORE/AFTER BACKUP
                backupImages: safeBackups,
                _sourceMode: selCase._fullData._mode||"",
              };
              localStorage.setItem("ch_bundle_prefill", JSON.stringify(prefill));
            }catch(e){ /* ignore serialisation errors */ }
          }

          setBundleModal(false);

          enterMode(
            bundleForm.type === "inbound"
              ? "inbound"
              : "siteComment",
            false,
            null,
            bundleForm.caseNum.trim()
          );

          showToast(
            "Bundle set — info from the existing case has been pre-filled",
            "info"
          );
        }}
      >
        🔗 Start Bundled Case
      </button>
    </div>
  </div>
</div>
  )
}
