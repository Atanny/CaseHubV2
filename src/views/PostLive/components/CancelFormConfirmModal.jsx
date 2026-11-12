export function CancelFormConfirmModal({ cancelMode, minimiseMode, setBackConfirm, sharedFormRef }) {
  return (
    <div className="modal-bg">
            <div className="modal">
              <button onClick={() => setBackConfirm(false)} aria-label="Close" style={{position:"absolute",top:18,right:16,width:12,height:12,border:"none",background:"none",cursor:"pointer",color:"var(--accent)",fontSize:16,lineHeight:1,padding:0}}>✕</button>

              <h3 style={{ textAlign: "center" }}>
                Would You Like to Cancel Case Form?
              </h3>

              <p style={{
                color: "var(--accent)",
                fontSize: 12,
                marginBottom: 20,
                lineHeight: 1.6,
                textAlign: "center"
              }}>
                The inserted data wont be retrieve once canceled.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>

                <div style={{ display: "flex", gap: 10, justifyContent: "center", width: "100%" }}>

                  <button
                    className="btn btn-danger"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={cancelMode}
                  >
                    Yes, Cancel Form
                  </button>

                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => setBackConfirm(false)}
                  >
                    No, Return to Form
                  </button>
                </div>

                <a
                  href="#"
                  style={{ fontSize: 12, color: "var(--accent)", textDecoration: "underline", cursor: "pointer" }}
                  onClick={(e) => { e.preventDefault(); minimiseMode(sharedFormRef.current || undefined); }}
                >
                  Minimize Form Instead
                </a>
              </div>

            </div>
          </div>
  )
}
