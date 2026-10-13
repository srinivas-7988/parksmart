import { useEffect, useState } from "react"
import { useApp } from "../context/AppContext"
import { getMyVehicles, addVehicle, deleteVehicle, getCurrentUser } from "../api"

export default function Profile() {
  const {
    userData,
    setUserData,
    myBookings,
    logout,
    showToast,
    setActiveTab,
    themePref,
    setThemePref,
  } = useApp()

  const [vehicles, setVehicles] = useState(() => {
    const v = userData?.vehicle || userData?.vehicle_number
    return v ? [{ vehicle_number: v, vehicle_type: "CAR" }] : []
  })
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [newVehicleNumber, setNewVehicleNumber] = useState("")
  const [newVehicleType, setNewVehicleType] = useState("CAR")
  const [savingVehicle, setSavingVehicle] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)

  const loadVehicles = () => {
    getMyVehicles()
      .then((data) => {
        let list = data.vehicles || []
        const userV = userData?.vehicle || userData?.vehicle_number
        if (list.length === 0 && userV) {
          list = [{ vehicle_number: userV, vehicle_type: "CAR" }]
        }
        setVehicles(list)
      })
      .catch((err) => console.error("Vehicle fetch error:", err))
  }

  useEffect(() => {
    loadVehicles()

    // Sync latest user profile details
    getCurrentUser()
      .then((u) => {
        if (u) {
          const updated = {
            ...userData,
            ...u,
            name: u.full_name || userData?.name || "User",
            initials: (u.full_name || "User")
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
          }
          if (setUserData) setUserData(updated)
          localStorage.setItem("ps_user", JSON.stringify(updated))
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddVehicle = async (e) => {
    e.preventDefault()
    if (!newVehicleNumber.trim()) {
      showToast("Required", "Please enter vehicle number.")
      return
    }

    try {
      setSavingVehicle(true)
      await addVehicle({
        vehicle_number: newVehicleNumber.trim().toUpperCase(),
        vehicle_type: newVehicleType,
        brand: "Standard",
        model: "Vehicle",
        color: "Default"
      })
      showToast("Success", "Vehicle registered.")
      setNewVehicleNumber("")
      setShowAddVehicle(false)
      loadVehicles()
    } catch (err) {
      showToast("Error", err.message || "Could not add vehicle.")
    } finally {
      setSavingVehicle(false)
    }
  }

  const handleDeleteVehicle = async (vehicleNumber) => {
    try {
      await deleteVehicle(vehicleNumber)
      showToast("Deleted", `Vehicle ${vehicleNumber} removed.`)
      loadVehicles()
    } catch (err) {
      showToast("Error", err.message || "Could not delete vehicle.")
    }
  }

  const totalSpent = myBookings.reduce(
    (sum, b) => sum + Number(b.total || 0),
    0
  )

  const initials = userData?.initials ||
    (userData?.full_name || userData?.name || "U")
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()

  const displayName = userData?.full_name || userData?.name || "User"
  const displayEmail = userData?.email || "user@parksmart.in"

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-title">My Profile</div>
        <button
          type="button"
          className="theme-quick-pill"
          onClick={() => {
            const next = themePref === 'dark' ? 'light' : 'dark'
            setThemePref(next)
            showToast('Theme', `Switched to ${next} mode`)
          }}
          title="Toggle Light / Dark Mode"
        >
          {themePref === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <div className="profile-hero">
        <div className="profile-avatar">
          {initials}
        </div>

        <div>
          <div style={{ fontWeight: 700 }}>
            {displayName}
          </div>

          <div className="muted" style={{ fontSize: ".82rem" }}>
            {displayEmail}
          </div>

          {userData?.phone && (
            <div className="muted" style={{ fontSize: ".75rem", marginTop: ".2rem" }}>
              📱 {userData.phone}
            </div>
          )}
        </div>
      </div>

      <div className="profile-section-title">
        Account
      </div>

      {/* VEHICLES */}
      <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
        <div className="row-between" style={{ marginBottom: ".5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
            <span style={{ fontSize: "1.2rem" }}>🚗</span>
            <strong style={{ fontSize: ".9rem" }}>My Registered Vehicles</strong>
          </div>

          <button
            className="btn-sm"
            style={{ fontSize: ".75rem", padding: "4px 10px" }}
            onClick={() => setShowAddVehicle((v) => !v)}
          >
            {showAddVehicle ? "Close" : "+ Add"}
          </button>
        </div>

        {showAddVehicle && (
          <form onSubmit={handleAddVehicle} style={{ margin: ".75rem 0", padding: ".75rem", background: "rgba(0,0,0,.15)", borderRadius: 10 }}>
            <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem" }}>
              <input
                className="input"
                placeholder="KA 01 AB 1234"
                value={newVehicleNumber}
                onChange={(e) => setNewVehicleNumber(e.target.value)}
                style={{ flex: 2, fontSize: ".85rem" }}
              />
              <select
                className="select"
                value={newVehicleType}
                onChange={(e) => setNewVehicleType(e.target.value)}
                style={{ flex: 1, fontSize: ".85rem" }}
              >
                <option value="CAR">CAR</option>
                <option value="BIKE">BIKE</option>
                <option value="EV">EV</option>
              </select>
            </div>
            <button
              type="submit"
              className="btn-sm"
              style={{ width: "100%" }}
              disabled={savingVehicle}
            >
              {savingVehicle ? "Saving..." : "Save Vehicle"}
            </button>
          </form>
        )}

        {vehicles.length ? (
          vehicles.map((v) => (
            <div
              key={v.vehicle_number}
              className="row-between"
              style={{
                padding: ".5rem 0",
                borderBottom: "1px solid rgba(var(--fgc),.05)",
              }}
            >
              <div>
                <strong className="mono" style={{ fontSize: ".85rem", color: "#00c896" }}>
                  {v.vehicle_number}
                </strong>
                <span className="pi-sub" style={{ marginLeft: ".5rem" }}>
                  {v.vehicle_type || "CAR"}
                </span>
              </div>

              <span
                onClick={() => handleDeleteVehicle(v.vehicle_number)}
                style={{ cursor: "pointer", fontSize: ".85rem", opacity: 0.7 }}
                title="Delete Vehicle"
              >
                🗑
              </span>
            </div>
          ))
        ) : (
          <div className="pi-sub" style={{ padding: ".5rem 0" }}>
            No vehicle added yet. Add one to start booking slots!
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="profile-section-title">
        Stats
      </div>

      <div className="grid2" style={{ marginBottom: "1.25rem" }}>
        <div className="mini-stat">
          <div className="v">
            {myBookings.length}
          </div>
          <div className="l">
            Total Bookings
          </div>
        </div>

        <div className="mini-stat">
          <div className="v">
            ₹{totalSpent}
          </div>
          <div className="l">
            Total Spent
          </div>
        </div>
      </div>


      {/* OPERATIONS */}
      <div className="profile-section-title">
        Staff & Admin
      </div>

      <div
        className="profile-item"
        onClick={() => setActiveTab('admin')}
        style={{ cursor: "pointer", border: "1px solid rgba(0, 200, 150, 0.25)", background: "rgba(0, 200, 150, 0.05)", marginBottom: "1rem" }}
      >
        <div
          className="pi-icon"
          style={{
            background: "rgba(0,200,150,.15)",
          }}
        >
          🛡️
        </div>

        <div style={{ flex: 1 }}>
          <div className="pi-label" style={{ color: "#00c896", fontWeight: 700 }}>
            Guard & Admin Console
          </div>
          <div className="muted" style={{ fontSize: ".72rem" }}>
            Gate QR pass verification & slot metrics
          </div>
        </div>
        <span style={{ color: "#00c896", fontWeight: 700 }}>→</span>
      </div>

      {/* SUPPORT & LOGOUT */}
      <div className="profile-section-title">
        Support
      </div>

      <div
        className="profile-item"
        onClick={() => setShowSupportModal(true)}
      >
        <div
          className="pi-icon"
          style={{
            background: "rgba(14,165,233,.12)",
          }}
        >
          🎧
        </div>

        <div style={{ flex: 1 }}>
          <div className="pi-label">Customer Support</div>
          <div className="pi-sub">24/7 Helpline & email ticket assistance</div>
        </div>

        <span style={{ opacity: 0.35, fontSize: "1.1rem" }}>›</span>
      </div>

      <div
        className="profile-item"
        onClick={() => setShowRulesModal(true)}
      >
        <div
          className="pi-icon"
          style={{
            background: "rgba(245,158,11,.12)",
          }}
        >
          📜
        </div>

        <div style={{ flex: 1 }}>
          <div className="pi-label">Rules</div>
          <div className="pi-sub">Grace period, bay allocation & cancellation policy</div>
        </div>

        <span style={{ opacity: 0.35, fontSize: "1.1rem" }}>›</span>
      </div>

      <div
        className="profile-item"
        onClick={logout}
      >
        <div
          className="pi-icon"
          style={{
            background: "rgba(239,68,68,.1)",
          }}
        >
          🚪
        </div>

        <div
          className="pi-label"
          style={{ color: "#f87171" }}
        >
          Sign Out
        </div>
      </div>

      {/* CUSTOMER SUPPORT MODAL */}
      <div
        className={`modal-overlay${showSupportModal ? " open" : ""}`}
        style={{ position: "fixed", zIndex: 100 }}
        onClick={() => setShowSupportModal(false)}
      >
        <div
          className="modal-sheet"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: "88vh" }}
        >
          <div className="row-between" style={{ marginBottom: ".75rem" }}>
            <div className="modal-title" style={{ margin: 0 }}>
              🎧 Customer Support
            </div>
            <button
              type="button"
              className="btn-outline"
              style={{ padding: "4px 10px", fontSize: ".8rem" }}
              onClick={() => setShowSupportModal(false)}
            >
              ✕
            </button>
          </div>

          <div className="muted" style={{ fontSize: ".82rem", marginBottom: "1.25rem" }}>
            Need help with your booking, slot, or gate access? Our dedicated support team is active 24/7.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem", marginBottom: "1.25rem" }}>
            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: ".85rem 1rem",
                borderRadius: 14,
                border: "1px solid rgba(var(--fgc), .08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <span style={{ fontSize: "1.3rem" }}>📞</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: ".88rem" }}>24/7 Toll-Free Helpline</div>
                  <div className="muted" style={{ fontSize: ".76rem" }}>+91 98765 43210 / 1800-PARK-SMART</div>
                </div>
              </div>
              <a
                href="tel:+919876543210"
                className="btn-sm"
                style={{ textDecoration: "none", padding: "6px 14px", fontSize: ".78rem" }}
              >
                Call
              </a>
            </div>

            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: ".85rem 1rem",
                borderRadius: 14,
                border: "1px solid rgba(var(--fgc), .08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <span style={{ fontSize: "1.3rem" }}>✉️</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: ".88rem" }}>Email Inquiries</div>
                  <div className="muted" style={{ fontSize: ".76rem" }}>support@parksmart.in</div>
                </div>
              </div>
              <a
                href="mailto:support@parksmart.in"
                className="btn-sm"
                style={{ textDecoration: "none", padding: "6px 14px", fontSize: ".78rem" }}
              >
                Email
              </a>
            </div>
          </div>

          <div className="profile-section-title" style={{ marginTop: "1rem", marginBottom: ".6rem" }}>
            Common Questions
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: ".6rem", marginBottom: "1.25rem" }}>
            <div style={{ padding: ".65rem .85rem", background: "rgba(var(--fgc), .04)", borderRadius: 10 }}>
              <div style={{ fontWeight: 600, fontSize: ".82rem", marginBottom: ".2rem" }}>
                ❓ Someone parked in my reserved slot?
              </div>
              <div className="muted" style={{ fontSize: ".75rem", lineHeight: 1.4 }}>
                Show your booking QR code to the barrier security attendant. They will instantly route you to an available priority slot.
              </div>
            </div>

            <div style={{ padding: ".65rem .85rem", background: "rgba(var(--fgc), .04)", borderRadius: 10 }}>
              <div style={{ fontWeight: 600, fontSize: ".82rem", marginBottom: ".2rem" }}>
                ❓ Gate QR scanner failed to read?
              </div>
              <div className="muted" style={{ fontSize: ".75rem", lineHeight: 1.4 }}>
                Show your 6-digit booking reference ID or vehicle plate number to the guard booth for instant manual entry.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn"
            style={{ width: "100%" }}
            onClick={() => setShowSupportModal(false)}
          >
            Close
          </button>
        </div>
      </div>

      {/* RULES OF THE APP MODAL */}
      <div
        className={`modal-overlay${showRulesModal ? " open" : ""}`}
        style={{ position: "fixed", zIndex: 100 }}
        onClick={() => setShowRulesModal(false)}
      >
        <div
          className="modal-sheet"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: "88vh" }}
        >
          <div className="row-between" style={{ marginBottom: ".75rem" }}>
            <div className="modal-title" style={{ margin: 0 }}>
              📜 Rules
            </div>
            <button
              type="button"
              className="btn-outline"
              style={{ padding: "4px 10px", fontSize: ".8rem" }}
              onClick={() => setShowRulesModal(false)}
            >
              ✕
            </button>
          </div>

          <div className="muted" style={{ fontSize: ".82rem", marginBottom: "1.25rem" }}>
            Follow these rules for a smooth, compliant, and secure parking experience.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: ".75rem", padding: ".75rem", background: "rgba(var(--fgc), .04)", borderRadius: 12 }}>
              <span style={{ fontSize: "1.3rem" }}>⏱️</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: ".85rem", marginBottom: ".2rem" }}>
                  1. 30-Minute Grace Period
                </div>
                <div className="muted" style={{ fontSize: ".76rem", lineHeight: 1.4 }}>
                  You must check in within 30 minutes of your reservation start time. If unattended, the slot is automatically cancelled to prevent congestion, and an 80% refund is initiated.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: ".75rem", padding: ".75rem", background: "rgba(var(--fgc), .04)", borderRadius: 12 }}>
              <span style={{ fontSize: "1.3rem" }}>🚗</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: ".85rem", marginBottom: ".2rem" }}>
                  2. Registered Vehicle Match
                </div>
                <div className="muted" style={{ fontSize: ".76rem", lineHeight: 1.4 }}>
                  Entry is strictly permitted only for the vehicle number associated with the booking. Automated ANPR cameras and guards verify plates at the entry barrier.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: ".75rem", padding: ".75rem", background: "rgba(var(--fgc), .04)", borderRadius: 12 }}>
              <span style={{ fontSize: "1.3rem" }}>🅿️</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: ".85rem", marginBottom: ".2rem" }}>
                  3. Park in Designated Slot Only
                </div>
                <div className="muted" style={{ fontSize: ".76rem", lineHeight: 1.4 }}>
                  Park strictly within the boundary lines of your assigned slot (e.g. A-01, B-02). Parking in unauthorized spots or blocking aisles incurs wheel clamping.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: ".75rem", padding: ".75rem", background: "rgba(var(--fgc), .04)", borderRadius: 12 }}>
              <span style={{ fontSize: "1.3rem" }}>⏳</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: ".85rem", marginBottom: ".2rem" }}>
                  4. Overstay & Extension Policy
                </div>
                <div className="muted" style={{ fontSize: ".76rem", lineHeight: 1.4 }}>
                  Remaining parked beyond the booked duration is billed at ₹50/hr overtime surcharge before exit. Please extend your booking in the app if you need more time.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: ".75rem", padding: ".75rem", background: "rgba(var(--fgc), .04)", borderRadius: 12 }}>
              <span style={{ fontSize: "1.3rem" }}>💳</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: ".85rem", marginBottom: ".2rem" }}>
                  5. Cancellation & Refunds
                </div>
                <div className="muted" style={{ fontSize: ".76rem", lineHeight: 1.4 }}>
                  Bookings cancelled before the scheduled start time receive an automatic 80% refund (20% reservation fee). Expired bookings are non-refundable.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: ".75rem", padding: ".75rem", background: "rgba(var(--fgc), .04)", borderRadius: 12 }}>
              <span style={{ fontSize: "1.3rem" }}>🦺</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: ".85rem", marginBottom: ".2rem" }}>
                  6. Speed Limit & Premises Safety
                </div>
                <div className="muted" style={{ fontSize: ".76rem", lineHeight: 1.4 }}>
                  Maintain a strict 10 km/h speed limit on parking ramps and premises. Ensure all doors and windows are locked; ParkSmart is not liable for unsecured valuables.
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn"
            style={{ width: "100%" }}
            onClick={() => setShowRulesModal(false)}
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </>
  )
}