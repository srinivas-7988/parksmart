import { useApp } from '../context/AppContext'
import StatusBar from '../components/StatusBar'
import BottomNav from '../components/BottomNav'
import Home from '../tabs/Home'
import Book from '../tabs/Book'
import MyBookings from '../tabs/MyBookings'
import Profile from '../tabs/Profile'
import Admin from '../tabs/Admin'

export default function MainApp() {
  const { screen, activeTab } = useApp()

  return (
    <div className={`screen${screen !== 'app' ? ' hidden' : ''}`} id="s-app">
      <StatusBar />

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
        <div id="tab-admin" className="scroll" style={{ position: 'absolute', inset: 0, display: activeTab === 'admin' ? 'block' : 'none' }}>
          <Admin />
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
