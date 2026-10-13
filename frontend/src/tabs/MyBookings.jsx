import { useEffect, useState } from "react"
import { useApp } from "../context/AppContext"
import { formatMMSS } from "../utils/time"
import { getQRUrl } from "../api"

export default function MyBookings() {
  const {
    myBookings,
    setActiveTab,
    confirmArrival,
    cancelBooking,
    loadMyBookings,
    checkNoShows,
  } = useApp()

  const [timers, setTimers] = useState({})
  const [activeQrBooking, setActiveQrBooking] = useState(null)

  useEffect(() => {
    let triggeredCheck = false

    const updateTimers = () => {
      setTimers((prev) => {
        const next = { ...prev }
        let hasExpired = false

        myBookings.forEach((b) => {
          const isPendingArrival = b.status === "active" || b.status === "confirmed"
          if (!isPendingArrival) return

          const key = b.id || b.slot
          let remaining = 1799

          if (b.bookedAt) {
            const elapsed = Math.floor((Date.now() - new Date(b.bookedAt).getTime()) / 1000)
            remaining = Math.max(0, 1800 - elapsed)
          } else {
            remaining = Math.max(0, (next[key] ?? 1799) - 1)
          }

          next[key] = remaining
          if (remaining === 0) {
            hasExpired = true
          }
        })

        if (hasExpired && !triggeredCheck && checkNoShows) {
          triggeredCheck = true
          checkNoShows()
            .then(() => loadMyBookings && loadMyBookings())
            .catch(() => {})
        }

        return next
      })
    }

    updateTimers()
    const timer = setInterval(updateTimers, 1000)
    return () => clearInterval(timer)
  }, [myBookings, checkNoShows, loadMyBookings])

  const statusStyle = {
    active: ["bg-green", "Active"],
    confirmed: ["bg-green", "Confirmed"],
    completed: ["bg-blue", "Completed"],
    cancelled: ["bg-amber", "Cancelled"],
    penalty: ["bg-amber", "No-Show (Late)"],
    no_show: ["bg-amber", "No-Show (Late)"],
  }

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-title">My Bookings</div>
        <div className="notif-btn">🔔</div>
      </div>

      <div className="scroll">
        {!myBookings.length ? (
          <div
            className="muted"
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
            }}
          >
            <div style={{ fontSize: "2.5rem" }}>🅿</div>

            <div
              style={{
                fontWeight: 600,
                margin: "1rem 0",
                color: "var(--text)",
              }}
            >
              No bookings yet
            </div>

            <button
              className="btn"
              onClick={() => setActiveTab("book")}
            >
              Book a Slot →
            </button>
          </div>
        ) : (
          myBookings.map((b, idx) => {
            const bookingKey = b.id || b.slot || idx
            const [bg, label] =
              statusStyle[b.status] ||
              ["bg-blue", b.status]

            const bookingTime = b.bookedAt
              ? new Date(b.bookedAt)
              : null

            const date = bookingTime
              ? bookingTime.toLocaleDateString("en-IN")
              : b.date || "Today"

            const time = bookingTime
              ? bookingTime.toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )
              : b.time || "N/A"

            return (
              <div
                className="card"
                key={bookingKey}
                style={{ marginBottom: ".875rem" }}
              >
                <div
                  className="row-between"
                  style={{
                    alignItems: "flex-start",
                    marginBottom: ".7rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: ".95rem",
                      }}
                    >
                      {b.loc || "Parking Area"}
                    </div>

                    <div
                      className="muted"
                      style={{
                        fontSize: ".73rem",
                        marginTop: ".25rem",
                      }}
                    >
                      Slot {b.slot} · {date} · {time}
                    </div>
                  </div>

                  <span className={`status-pill ${bg}`}>
                    {label}
                  </span>
                </div>

                <div
                  className="row-between muted"
                  style={{ fontSize: ".78rem" }}
                >
                  <span>
                    ID:{" "}
                    <strong
                      className="mono"
                      style={{ color: "#00c896" }}
                    >
                      {b.id ? b.id.slice(-8) : b.slot}
                    </strong>
                  </span>

                  <span>
                    Paid:{" "}
                    <strong style={{ color: "var(--text)" }}>
                      ₹{b.total || 0}
                    </strong>
                  </span>
                </div>

                {b.vehicle_number && (
                  <div
                    className="muted"
                    style={{ fontSize: ".73rem", marginTop: ".4rem" }}
                  >
                    Vehicle: <strong style={{ color: "var(--text)" }}>{b.vehicle_number}</strong>
                  </div>
                )}

                {(b.status === "active" || b.status === "confirmed") && (
                  <>
                    <div
                      className="row-between"
                      style={{
                        background: "rgba(0,0,0,.2)",
                        borderRadius: 10,
                        padding: ".625rem .875rem",
                        marginTop: ".75rem",
                      }}
                    >
                      <span
                        className="muted"
                        style={{ fontSize: ".72rem" }}
                      >
                        Arrival window closes in
                      </span>

                      <strong
                        className="mono"
                        style={{
                          color: "#f59e0b",
                        }}
                      >
                        {formatMMSS(
                          timers[bookingKey] ?? 1799
                        )}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: ".625rem",
                        marginTop: ".75rem",
                      }}
                    >
                      <button
                        className="btn-sm"
                        style={{ flex: 1 }}
                        onClick={() =>
                          confirmArrival(b.id)
                        }
                      >
                        ✓ I've Arrived
                      </button>

                      <button
                        className="btn-sm"
                        style={{
                          background: "rgba(0,200,150,.15)",
                          color: "#00c896",
                          border: "1px solid rgba(0,200,150,.3)"
                        }}
                        onClick={() => setActiveQrBooking(b)}
                      >
                        🎟 QR Pass
                      </button>

                      <button
                        className="btn-outline"
                        onClick={() =>
                          cancelBooking(b.id)
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {(b.status === "penalty" || b.status === "no_show" || b.status === "cancelled") && (
                  <div
                    style={{
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                      borderRadius: 10,
                      padding: ".65rem .875rem",
                      marginTop: ".75rem",
                      fontSize: ".78rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: ".35rem",
                      }}
                    >
                      <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                        {b.cancellation_reason === "NO_SHOW" || b.status === "penalty" || b.status === "no_show"
                          ? "⚠ Late Arrival / No-Show Applied"
                          : "↩ Booking Cancelled & 80% Refunded"}
                      </span>
                      <span
                        style={{
                          background: "rgba(0, 200, 150, 0.15)",
                          color: "#00c896",
                          padding: "2px 7px",
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: ".7rem",
                        }}
                      >
                        Refund Initiated
                      </span>
                    </div>

                    <div
                      className="muted"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: ".35rem",
                        paddingTop: ".35rem",
                        borderTop: "1px dashed rgba(255, 255, 255, 0.08)",
                        fontSize: ".75rem",
                      }}
                    >
                      <span>
                        Deduction (20% fee):{" "}
                        <strong style={{ color: "#ef4444" }}>
                          ₹{b.penalty_amount ?? Math.round((b.total || 0) * 0.2)}
                        </strong>
                      </span>
                      <span>
                        Refunded (80%):{" "}
                        <strong style={{ color: "#00c896" }}>
                          ₹{b.refund_amount ?? Math.round((b.total || 0) * 0.8)}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* QR PASS MODAL */}
      {activeQrBooking && (
        <div className="modal-overlay open" onClick={() => setActiveQrBooking(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Parking QR Pass</div>
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div
                style={{
                  background: "#fff",
                  display: "inline-block",
                  padding: "1rem",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,.2)"
                }}
              >
                <img
                  src={getQRUrl(activeQrBooking.id)}
                  alt="Parking QR Code"
                  style={{ width: 180, height: 180, display: "block" }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style="color:#000;font-size:.8rem;padding:2rem;">🎟 QR Generated<br/><small style="color:#666">Show booking ID at entrance</small></div>';
                  }}
                />
              </div>

              <div style={{ marginTop: "1rem", fontSize: ".9rem", fontWeight: 700 }}>
                Slot {activeQrBooking.slot} · {activeQrBooking.loc || "ParkSmart Zone"}
              </div>
              <div className="muted" style={{ fontSize: ".78rem", marginTop: ".25rem" }}>
                Vehicle: {activeQrBooking.vehicle_number || "Registered Vehicle"}
              </div>
              <div className="mono" style={{ fontSize: ".75rem", color: "#00c896", marginTop: ".4rem" }}>
                ID: {activeQrBooking.id}
              </div>
            </div>

            <div className="modal-btns">
              <button className="btn" onClick={() => setActiveQrBooking(null)}>
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}