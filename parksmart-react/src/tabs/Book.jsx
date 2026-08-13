import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { DURATIONS, LOCS, TIMES } from '../data/constants'
import { getParkingSlots } from '../api'
import { formatTimeOption } from '../utils/time'

const BOOK_DURATIONS = [...DURATIONS, 5]
const STATUS_ICON = { occ: '🚗', res: '📌', avail: '🟢' }

function makeZones(slots) {
  const grouped = { A: [], B: [], C: [] }
  slots.forEach((slot) => {
    const section = String(slot.section || slot.slot_number?.[0] || 'A').toUpperCase()
    if (!grouped[section]) grouped[section] = []
    grouped[section].push({
      id: slot.slot_number,
      status: slot.is_available ? 'avail' : 'occ',
    })
  })

  return Object.entries(grouped)
    .filter(([, boxes]) => boxes.length)
    .map(([zone, boxes]) => ({ zone, boxes }))
}

export default function Book() {
  const { bookPrefill, clearBookPrefill, startBooking, showToast } = useApp()
  const [loc, setLoc] = useState(LOCS[0].name)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dur, setDur] = useState(2)
  const [time, setTime] = useState(18)
  const [slotsVisible, setSlotsVisible] = useState(false)
  const [zones, setZones] = useState([])
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadSlotGrid = async (locOverride) => {
    const useLoc = locOverride ?? loc
    setLoading(true)
    try {
      const data = await getParkingSlots()
      setZones(makeZones(data.slots || []))
      setSlotsVisible(true)
      setSelectedSlotId(null)
      showToast('Slots Loaded', `Showing available bays for ${useLoc}`)
    } catch (error) {
      showToast('Slots Error', error.message || 'Could not load parking slots.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!bookPrefill) return
    setLoc(bookPrefill.loc)
    setDur(bookPrefill.dur)
    loadSlotGrid(bookPrefill.loc)
    clearBookPrefill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookPrefill])

  const pickSlot = (id, status) => {
    if (status !== 'avail') return
    setSelectedSlotId(id)
  }

  const openBookModal = () => {
    if (!selectedSlotId) return
    startBooking({ loc, dur, date, time, slot: selectedSlotId })
  }

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-title">Book a Slot</div>
        <div className="notif-btn">🔔</div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label className="label">Location</label>
        <select className="select" value={loc} onChange={(e) => setLoc(e.target.value)}>
          {LOCS.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
        </select>
      </div>

      <div className="grid2" style={{ marginBottom: '1rem' }}>
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Duration</label>
          <select className="select" value={dur} onChange={(e) => setDur(Number(e.target.value))}>
            {BOOK_DURATIONS.map((d) => <option key={d} value={d}>{d} hr · ₹{d * 30}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label className="label">Start Time</label>
        <select className="select" value={time} onChange={(e) => setTime(Number(e.target.value))}>
          {TIMES.map((t) => <option key={t} value={t}>{formatTimeOption(t)}</option>)}
        </select>
      </div>

      <button
        className="btn"
        style={{ marginBottom: '1.25rem', boxShadow: '0 6px 20px rgba(0,200,150,.25)' }}
        onClick={() => loadSlotGrid()}
        disabled={loading}
      >
        {loading ? 'Loading Slots...' : '🔍 Show Available Slots'}
      </button>

      {slotsVisible && (
        <div id="slot-section">
          <div className="pill row-between" style={{ marginBottom: '1rem', background: 'rgba(0,200,150,.06)', borderColor: 'rgba(0,200,150,.15)' }}>
            <div className="muted" style={{ fontSize: '.82rem' }}>{loc} · {dur} hour{dur > 1 ? 's' : ''}</div>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00c896' }}>₹{dur * 30}</div>
          </div>

          <div className="legend-row">
            <div className="leg"><i style={{ background: 'rgba(34,197,94,.5)', border: '1px solid #22c55e' }} />Available</div>
            <div className="leg"><i style={{ background: 'rgba(239,68,68,.3)' }} />Occupied</div>
            <div className="leg"><i style={{ background: 'rgba(14,165,233,.5)', border: '1px solid #0ea5e9' }} />Selected</div>
          </div>

          <div id="slot-zones-main">
            {zones.map((z) => (
              <div key={z.zone}>
                <div className="zone-title">Zone {z.zone}</div>
                <div className="slot-grid">
                  {z.boxes.map((box) => {
                    const isSel = box.id === selectedSlotId
                    const cls = isSel ? 'slot-sel' : `slot-${box.status}`
                    const icon = isSel ? '✓' : STATUS_ICON[box.status]
                    return (
                      <div
                        key={box.id}
                        className={`slot-box ${cls}`}
                        onClick={() => pickSlot(box.id, box.status)}
                      >
                        <span>{icon}</span>{box.id}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {selectedSlotId && (
            <div className="slot-selected-bar row-between">
              <div>
                <div className="muted" style={{ fontSize: '.82rem' }}>Selected Slot</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00c896' }}>{selectedSlotId}</div>
              </div>
              <button className="btn-sm" onClick={openBookModal}>Book This Slot →</button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
