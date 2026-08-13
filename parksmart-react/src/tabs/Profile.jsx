import { useApp } from '../context/AppContext'

export default function Profile() {
  const { userData, myBookings, logout } = useApp()

  const totalBookings = myBookings.length
  const totalSpent = myBookings.reduce((s, b) => s + b.total, 0)

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-title">My Profile</div>
      </div>
      <div className="profile-hero">
        <div className="profile-avatar">{userData?.initials ?? 'AK'}</div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{userData?.name ?? 'Arjun Kumar'}</div>
          <div className="muted" style={{ fontSize: '.78rem', marginTop: '.2rem' }}>{userData?.email ?? 'arjun@email.com'}</div>
          <div style={{ fontSize: '.72rem', color: 'rgba(0,200,150,.7)', marginTop: '.25rem' }}>Member since April 2024</div>
        </div>
      </div>
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="profile-section-title">Account</div>
        <div className="profile-item">
          <div className="pi-icon bg-green">🚗</div>
          <div style={{ flex: 1 }}>
            <div className="pi-label">Vehicle</div>
            <div className="pi-sub">{userData?.vehicle ?? 'KA 01 AB 1234'}</div>
          </div>
          <span className="muted">›</span>
        </div>
        <div className="profile-item">
          <div className="pi-icon bg-blue">💳</div>
          <div style={{ flex: 1 }}>
            <div className="pi-label">Payment Methods</div>
            <div className="pi-sub">Visa ••4242</div>
          </div>
          <span className="muted">›</span>
        </div>
        <div className="profile-item">
          <div className="pi-icon bg-amber">🔔</div>
          <div style={{ flex: 1 }}>
            <div className="pi-label">Notifications</div>
            <div className="pi-sub">Booking alerts, offers</div>
          </div>
          <span className="muted">›</span>
        </div>
      </div>
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="profile-section-title">Stats</div>
        <div className="grid2">
          <div className="mini-stat">
            <div className="v">{totalBookings}</div>
            <div className="l">Total Bookings</div>
          </div>
          <div className="mini-stat">
            <div className="v">₹{totalSpent}</div>
            <div className="l">Total Spent</div>
          </div>
          <div className="mini-stat">
            <div className="v">0</div>
            <div className="l">Penalties</div>
          </div>
          <div className="mini-stat">
            <div className="v">⭐ 4.8</div>
            <div className="l">Rating</div>
          </div>
        </div>
      </div>
      <div>
        <div className="profile-section-title">Support</div>
        <div className="profile-item">
          <div className="pi-icon bg-blue">❓</div>
          <div style={{ flex: 1 }}>
            <div className="pi-label">Help &amp; FAQ</div>
          </div>
          <span className="muted">›</span>
        </div>
        <div className="profile-item">
          <div className="pi-icon bg-amber">📜</div>
          <div style={{ flex: 1 }}>
            <div className="pi-label">Terms &amp; Privacy</div>
          </div>
          <span className="muted">›</span>
        </div>
        <div className="profile-item" onClick={logout}>
          <div className="pi-icon" style={{ background: 'rgba(239,68,68,.1)' }}>🚪</div>
          <div style={{ flex: 1 }}>
            <div className="pi-label" style={{ color: '#f87171' }}>Sign Out</div>
          </div>
        </div>
      </div>
    </>
  )
}
