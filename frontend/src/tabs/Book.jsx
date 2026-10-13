import { useEffect, useState } from "react"
import { useApp } from "../context/AppContext"
import { DURATIONS, LOCS, TIMES } from "../data/constants"
import { formatTimeOption } from "../utils/time"
import { getParkingSlots, getMyVehicles } from "../api"

const BOOK_DURATIONS = [...DURATIONS, 5]

const STATUS_ICON = {
  occ: "🚗",
  res: "📌",
  avail: "🟢",
}

export default function Book() {
  const {
    bookPrefill,
    clearBookPrefill,
    startBooking,
    showToast,
    userData,
  } = useApp()

  const defaultVehicleNumber =
    userData?.vehicle ||
    userData?.vehicle_number ||
    ""

  const [loc, setLoc] = useState(LOCS[0].name)
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  )
  const [dur, setDur] = useState(2)
  const [time, setTime] = useState(18)

  const [vehicles, setVehicles] = useState(() => {
    return defaultVehicleNumber
      ? [{ vehicle_number: defaultVehicleNumber, vehicle_type: "CAR" }]
      : []
  })
  const [vehicle, setVehicle] = useState(defaultVehicleNumber)

  const [slotsVisible, setSlotsVisible] = useState(false)
  const [zones, setZones] = useState([])
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  /* =========================
     LOAD USER VEHICLES
  ========================= */

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true)

      const data = await getMyVehicles()

      let list = data.vehicles || data || []

      const userV = userData?.vehicle || userData?.vehicle_number || ""

      // Fallback: If no vehicles returned from backend, but user has account vehicle
      if (list.length === 0 && userV) {
        list = [{ vehicle_number: userV, vehicle_type: "CAR" }]
      }

      setVehicles(list)

      if (list.length > 0) {
        const currentTarget = vehicle || userV
        const match = list.find(
          (v) => (v.vehicle_number || v.vehicleNumber || v.number) === currentTarget
        )
        if (match) {
          setVehicle(match.vehicle_number || match.vehicleNumber || match.number)
        } else {
          const first =
            list[0].vehicle_number ||
            list[0].vehicleNumber ||
            list[0].number ||
            ""
          setVehicle(first)
        }
      } else if (userV) {
        setVehicle(userV)
      }
    } catch (error) {
      console.error("Vehicle loading failed:", error)

      const userV = userData?.vehicle || userData?.vehicle_number || ""
      if (userV) {
        setVehicles([{ vehicle_number: userV, vehicle_type: "CAR" }])
        setVehicle(userV)
      } else {
        showToast(
          "Unable to Load Vehicles",
          error.message || "Please add a vehicle first."
        )
      }
    } finally {
      setLoadingVehicles(false)
    }
  }

  useEffect(() => {
    loadVehicles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!vehicle && (userData?.vehicle || userData?.vehicle_number)) {
      const v = userData.vehicle || userData.vehicle_number
      setVehicle(v)
      setVehicles((prev) => {
        if (prev.length === 0) {
          return [{ vehicle_number: v, vehicle_type: "CAR" }]
        }
        return prev
      })
    }
  }, [userData, vehicle])

  /* =========================
     LOAD PARKING SLOTS
  ========================= */

  const loadSlotGrid = async (locOverride) => {
    const useLoc = locOverride ?? loc

    try {
      setLoadingSlots(true)
      setSelectedSlotId(null)

      const data = await getParkingSlots(useLoc)

      const slots = data.slots || []

      const groupedZones = ["A", "B", "C"].map((zone) => ({
        zone,
        boxes: slots
          .filter(
            (slot) =>
              slot.section?.toUpperCase() === zone
          )
          .map((slot) => ({
            id: slot.slot_number,
            status: slot.is_available
              ? "avail"
              : "occ",
          })),
      }))

      setZones(groupedZones)
      setSlotsVisible(true)

      const availableCount = slots.filter(
        (slot) => slot.is_available
      ).length

      showToast(
        "Slots Loaded",
        `${availableCount} slots available at ${useLoc}`
      )
    } catch (error) {
      console.error("Failed to load parking slots:", error)

      setZones([])
      setSlotsVisible(false)

      showToast(
        "Unable to Load Slots",
        error.message || "Could not fetch parking slots"
      )
    } finally {
      setLoadingSlots(false)
    }
  }

  /* =========================
     QUICK BOOK
  ========================= */

  useEffect(() => {
    if (!bookPrefill) return

    setLoc(bookPrefill.loc)
    setDur(bookPrefill.dur)

    loadSlotGrid(bookPrefill.loc)

    clearBookPrefill()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookPrefill])

  /* =========================
     SELECT SLOT
  ========================= */

  const pickSlot = (id, status) => {
    if (status === "occ" || status === "res") {
      return
    }

    setSelectedSlotId(id)
  }

  /* =========================
     OPEN BOOKING
  ========================= */

  const openBookModal = () => {
    if (!vehicle) {
      showToast(
        "Select Vehicle",
        "Please select a vehicle before booking."
      )
      return
    }

    if (!selectedSlotId) {
      showToast(
        "Select a Slot",
        "Please select an available parking slot."
      )
      return
    }

    startBooking({
      loc,
      dur,
      date,
      time,
      slot: selectedSlotId,

      // IMPORTANT
      vehicle_number: vehicle,
      slot_number: selectedSlotId,
    })
  }

  return (
    <>
      {/* TOP BAR */}

      <div className="top-bar">
        <div className="top-bar-title">
          Book a Slot
        </div>

        <div className="notif-btn">
          🔔
        </div>
      </div>

      {/* LOCATION */}

      <div style={{ marginBottom: "1rem" }}>
        <label className="label">
          Location
        </label>

        <select
          className="select"
          value={loc}
          onChange={(e) => {
            const newLocation = e.target.value

            setLoc(newLocation)
            loadSlotGrid(newLocation)
          }}
        >
          {LOCS.map((l) => (
            <option
              key={l.name}
              value={l.name}
            >
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* VEHICLE */}

      <div style={{ marginBottom: "1rem" }}>
        <label className="label">
          Vehicle
        </label>

        <select
          className="select"
          value={vehicle}
          onChange={(e) =>
            setVehicle(e.target.value)
          }
          disabled={loadingVehicles}
        >
          <option value="">
            {loadingVehicles
              ? "Loading vehicles..."
              : "Select Vehicle"}
          </option>

          {vehicles.map((v, index) => {
            const number =
              v.vehicle_number ||
              v.vehicleNumber ||
              v.number ||
              ""

            return (
              <option
                key={v._id || number || index}
                value={number}
              >
                {number}
                {v.vehicle_type
                  ? ` · ${v.vehicle_type}`
                  : ""}
              </option>
            )
          })}
        </select>

        {!loadingVehicles &&
          vehicles.length === 0 && (
            <div
              className="muted"
              style={{
                fontSize: ".75rem",
                marginTop: ".4rem",
              }}
            >
              No vehicles found. Please add a
              vehicle to your profile first.
            </div>
          )}
      </div>

      {/* DATE + DURATION */}

      <div
        className="grid2"
        style={{ marginBottom: "1rem" }}
      >
        <div>
          <label className="label">
            Date
          </label>

          <input
            className="input"
            type="date"
            value={date}
            min={new Date()
              .toISOString()
              .split("T")[0]}
            onChange={(e) =>
              setDate(e.target.value)
            }
          />
        </div>

        <div>
          <label className="label">
            Duration
          </label>

          <select
            className="select"
            value={dur}
            onChange={(e) =>
              setDur(Number(e.target.value))
            }
          >
            {BOOK_DURATIONS.map((d) => (
              <option
                key={d}
                value={d}
              >
                {d} hr · ₹{d * 30}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* START TIME */}

      <div style={{ marginBottom: "1rem" }}>
        <label className="label">
          Start Time
        </label>

        <select
          className="select"
          value={time}
          onChange={(e) =>
            setTime(Number(e.target.value))
          }
        >
          {TIMES.map((t) => (
            <option
              key={t}
              value={t}
            >
              {formatTimeOption(t)}
            </option>
          ))}
        </select>
      </div>

      {/* SHOW SLOTS */}

      <button
        className="btn"
        style={{
          marginBottom: "1.25rem",
          boxShadow:
            "0 6px 20px rgba(0,200,150,.25)",
        }}
        onClick={() => loadSlotGrid()}
        disabled={loadingSlots}
      >
        {loadingSlots
          ? "⏳ Loading Slots..."
          : "🔍 Show Available Slots"}
      </button>

      {/* SLOT SECTION */}

      {slotsVisible && (
        <div id="slot-section">

          {/* PRICE */}

          <div
            className="pill row-between"
            style={{
              marginBottom: "1rem",
              background:
                "rgba(0,200,150,.06)",
              borderColor:
                "rgba(0,200,150,.15)",
            }}
          >
            <div
              className="muted"
              style={{ fontSize: ".82rem" }}
            >
              {loc} · {dur} hour
              {dur > 1 ? "s" : ""}
            </div>

            <div
              className="mono"
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#00c896",
              }}
            >
              ₹{dur * 30}
            </div>
          </div>

          {/* SELECTED VEHICLE */}

          {vehicle && (
            <div
              className="pill"
              style={{
                marginBottom: "1rem",
                padding: ".75rem 1rem",
              }}
            >
              <span
                className="muted"
                style={{ fontSize: ".75rem" }}
              >
                Vehicle
              </span>

              <strong
                className="mono"
                style={{
                  marginLeft: ".5rem",
                  color: "#00c896",
                }}
              >
                {vehicle}
              </strong>
            </div>
          )}

          {/* LEGEND */}

          <div className="legend-row">

            <div className="leg">
              <i
                style={{
                  background:
                    "rgba(34,197,94,.5)",
                  border:
                    "1px solid #22c55e",
                }}
              />
              Available
            </div>

            <div className="leg">
              <i
                style={{
                  background:
                    "rgba(239,68,68,.3)",
                }}
              />
              Occupied
            </div>

            <div className="leg">
              <i
                style={{
                  background:
                    "rgba(245,158,11,.4)",
                }}
              />
              Reserved
            </div>

            <div className="leg">
              <i
                style={{
                  background:
                    "rgba(14,165,233,.5)",
                  border:
                    "1px solid #0ea5e9",
                }}
              />
              Selected
            </div>

          </div>

          {/* PARKING ZONES */}

          <div id="slot-zones-main">

            {zones.map((z) => (
              <div key={z.zone}>

                <div className="zone-title">
                  Zone {z.zone}
                </div>

                <div className="slot-grid">

                  {z.boxes.map((box) => {

                    const isSel =
                      box.id === selectedSlotId

                    const cls = isSel
                      ? "slot-sel"
                      : `slot-${box.status}`

                    const icon = isSel
                      ? "✓"
                      : STATUS_ICON[box.status]

                    return (
                      <div
                        key={box.id}
                        className={`slot-box ${cls}`}
                        onClick={() =>
                          pickSlot(
                            box.id,
                            box.status
                          )
                        }
                      >
                        <span>
                          {icon}
                        </span>

                        {box.id}
                      </div>
                    )
                  })}

                </div>
              </div>
            ))}

            {/* NO SLOTS */}

            {zones.length > 0 &&
              zones.every(
                (z) => z.boxes.length === 0
              ) && (
                <div
                  className="muted"
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                  }}
                >
                  No parking slots found
                  for this location.
                </div>
              )}

          </div>

          {/* SELECTED SLOT */}

          {selectedSlotId && (
            <div
              className="slot-selected-bar row-between"
            >
              <div>

                <div
                  className="muted"
                  style={{ fontSize: ".82rem" }}
                >
                  Selected Slot
                </div>

                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#00c896",
                  }}
                >
                  {selectedSlotId}
                </div>

              </div>

              <button
                className="btn-sm"
                onClick={openBookModal}
              >
                Book This Slot →
              </button>

            </div>
          )}

        </div>
      )}
    </>
  )
}