import { useApp } from '../context/AppContext'
import { useClock } from '../hooks/useClock'
import BottomNav from '../components/BottomNav'
import Home from '../tabs/Home'
import Book from '../tabs/Book'
import MyBookings from '../tabs/MyBookings'
import Profile from '../tabs/Profile'

export default function MainApp() {
  const { screen, activeTab } = useApp()
  const { timeStr } = useClock()

  return (
    <div className={`screen${screen !== 'app' ? ' hidden' : ''}`} id="s-app">
      <div className="status-bar">
        <span className="status-time" id="status-time">
          {timeStr}
        </span>
        <div>📶 🔋</div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div id="tab-home" className="scroll" style={{ position: 'absolute', inset: 0, display: activeTab === 'home' ? 'block' : 'none' }}>
          <Home />
        </div>
        <div id="tab-book" className="scroll" style={{ position: 'absolute', inset: 0, display: activeTab === 'book' ? 'block' : 'none' }}>
          <Book />
        </div>
        <div id="tab-mybookings" className="scroll" style={{ position: 'absolute', inset: 0, display: activeTab === 'mybookings' ? 'block' : 'none' }}>
          <MyBookings />
        </div>
        <div id="tab-profile" className="scroll" style={{ position: 'absolute', inset: 0, display: activeTab === 'profile' ? 'block' : 'none' }}>
          <Profile />
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
