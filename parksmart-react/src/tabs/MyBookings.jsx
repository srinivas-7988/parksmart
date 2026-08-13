import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { STATUS_META } from '../data/constants'
import { formatMMSS } from '../utils/time'

export default function MyBookings() {
  const { myBookings, setActiveTab, confirmArrival, cancelBooking } = useApp()
  const [timers, setTimers] = useState({})

  // Ported from mybookings.js startTimers(): each active booking counts
  // down from 29:59 once and stays put — never resets on re-render.
  useEffect(() => {
    const id = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev }
        myBookings.forEach((b) => {
          if (b.status !== 'active') return
          if (next[b.id] === undefined) next[b.id] = 1799
          else if (next[b.id] > 0) next[b.id] -= 1
        })
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [myBookings])

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-title">My Bookings</div>
        <div className="notif-btn">🔔</div>
      </div>
      <div id="my-bookings-list">
        {!myBookings.length ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }} className="muted">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🅿</div>
            <div style={{ fontWeight: 600, marginBottom: '.5rem', color: 'var(--text)' }}>No bookings yet</div>
            <button className="btn" onClick={() => setActiveTab('book')}>Book a Slot →</button>
          </div>
        ) : (
          myBookings.map((b) => {
            const [bg, , lbl] = STATUS_META[b.status] || STATUS_META.completed
            const timeStr = b.time <= 12 ? `${b.time}:00 AM` : `${b.time - 12}:00 PM`
            return (
              <div className="card" style={{ marginBottom: '.875rem' }} key={b.id}>
                <div className="row-between" style={{ alignItems: 'flex-start', marginBottom: '.625rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.92rem' }}>{b.loc}</div>
                    <div className="muted" style={{ fontSize: '.73rem', marginTop: '.2rem' }}>
                      Slot {b.slot} · {b.date} · {timeStr} · {b.dur}hr
                    </div>
                  </div>
                  <span className={`status-pill ${bg}`}>{lbl}</span>
                </div>
                <div className="row-between muted" style={{ fontSize: '.78rem' }}>
                  <span>ID: <strong className="mono" style={{ color: '#00c896', fontSize: '.82rem' }}>{b.id}</strong></span>
                  <span>Paid: <strong style={{ color: 'var(--text)' }}>₹{b.total}</strong></span>
                </div>
                {b.status === 'active' && (
                  <>
                    <div className="row-between" style={{ background: 'rgba(0,0,0,.2)', borderRadius: 10, padding: '.625rem .875rem', marginTop: '.75rem' }}>
                      <div className="muted" style={{ fontSize: '.72rem' }}>Arrival window closes in</div>
                      <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>
                        {formatMMSS(timers[b.id] ?? 1799)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '.625rem', marginTop: '.75rem' }}>
                      <button
                        style={{ flex: 1, padding: '.65rem', background: 'rgba(0,200,150,.1)', border: '1px solid rgba(0,200,150,.25)', borderRadius: 10, fontFamily: 'Outfit', fontSize: '.8rem', fontWeight: 600, color: '#00c896', cursor: 'pointer' }}
                        onClick={() => confirmArrival(b.id)}
                      >
                        ✓ I've Arrived
                      </button>
                      <button
                        style={{ padding: '.65rem .875rem', background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, fontFamily: 'Outfit', fontSize: '.8rem', color: '#f87171', cursor: 'pointer' }}
                        onClick={() => cancelBooking(b.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
