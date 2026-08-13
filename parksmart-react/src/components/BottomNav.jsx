import { NAV } from '../data/constants'
import { useApp } from '../context/AppContext'

export default function BottomNav() {
  const { activeTab, setActiveTab } = useApp()

  return (
    <div className="bottom-nav" id="bottom-nav">
      {NAV.map(([id, icon, label]) => (
        <div
          key={id}
          className={`bnav-item${activeTab === id ? ' active' : ''}`}
          id={`bn-${id}`}
          onClick={() => setActiveTab(id)}
        >
          <div style={{ fontSize: '1.3rem' }}>{icon}</div>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}
