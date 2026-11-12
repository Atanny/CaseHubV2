import { PageHeader } from '@/components/layout/PageHeader'
import { fmtElapsed } from '@/utils/format'

export function PostLiveHero({ elapsed, globalTimeIn, onTimeIn, onTimeOut, timedIn }) {
  return (
    <>
      <PageHeader
        title="Post-Live Amends"
        subtitle={timedIn ? "Session active — choose your amend type below." : "Clock in to begin your session."}
      />
      <div className="page-hero" style={{justifyContent:"flex-end"}}>
        {/* TIME IN / OUT card */}
       <div className="timeinout-card">
          {timedIn ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%" }}>
              
              {/* LEFT: all text inline */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>Session Active</span>
                
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Since:</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {globalTimeIn ? new Date(globalTimeIn).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}) : ""}
                </span>

                <span style={{ fontSize: 28, fontWeight: 800, color: "var(--green)", letterSpacing:"-1px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {fmtElapsed(elapsed)}
                </span>
              </div>

              {/* RIGHT: button */}
              <button className="btn btn-danger timeout-btn" style={{ fontSize: 12, padding: "9px 16px" }} onClick={()=>onTimeOut&&onTimeOut()}>
                Time Out
              </button>

            </div>
          ) : (
            <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  gap: "10px"
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    lineHeight: 1
                  }}
                >
                  Start your session
                </span>

                <button
                  className="btn btn-save timein-btn"
                  onClick={() => onTimeIn && onTimeIn()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  Clock In
                </button>
              </div>
          )}
        </div>

      </div>
    </>
  )
}
