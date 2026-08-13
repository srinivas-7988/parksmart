import { useApp } from '../context/AppContext'

export default function Success() {
  const { screen, lastBooking, backToApp } = useApp()
  const b = lastBooking

  return (
    <div className={`screen${screen !== 'success' ? ' hidden' : ''}`} id="s-success">
      <div className="status-bar">
        <span>9:41</span>
        <div>📶 🔋</div>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div className="success-anim">✅</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.4rem' }}>Booking Confirmed!</div>
        <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00c896', margin: '.5rem 0' }} id="success-id">
          {b?.id ?? 'PS123456'}
        </div>
        <div className="muted" style={{ fontSize: '.85rem', marginTop: '.4rem' }} id="success-sub">
          {b ? `Slot ${b.slot} · ${b.loc}` : 'Slot A3 · Brigade Road'}
        </div>
        <div className="card" style={{ margin: '1.5rem 0', textAlign: 'left' }}>
          <div className="detail-row">
            <span>Location</span>
            <span id="sd-loc">{b?.loc ?? 'Brigade Road'}</span>
          </div>
          <div className="detail-row">
            <span>Slot</span>
            <span id="sd-slot">{b?.slot ?? 'A3'}</span>
          </div>
          <div className="detail-row">
            <span>Date</span>
            <span id="sd-date">{b?.date ?? '—'}</span>
          </div>
          <div className="detail-row">
            <span>Duration</span>
            <span id="sd-dur">{b ? `${b.dur} hr${b.dur > 1 ? 's' : ''}` : '2 hrs'}</span>
          </div>
          <div className="detail-row">
            <span>Paid</span>
            <span style={{ color: '#00c896' }} id="sd-paid">
              ₹{b?.total ?? 60}
            </span>
          </div>
        </div>
        <div className="warn-box" style={{ width: '100%', marginBottom: '1.5rem' }}>
          ⚠ Arrive within 30 minutes to avoid a 20% no-show penalty.
        </div>
        <button className="btn" onClick={backToApp}>
          Back to Home →
        </button>
      </div>
    </div>
  )
}
