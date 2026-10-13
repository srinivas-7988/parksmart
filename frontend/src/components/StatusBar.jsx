import { useClock } from '../hooks/useClock'

export default function StatusBar() {
  const { timeStr } = useClock()

  return (
    <div className="status-bar-wrapper">
      <div className="status-bar">
        <span className="status-time" id="status-time">
          {timeStr || '10:00'}
        </span>
        <div className="status-icons">
          <span className="status-signal" title="Cellular Signal">
            <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
              <rect x="0" y="8" width="2.5" height="3" rx="0.75" fill="currentColor" />
              <rect x="4.5" y="5.5" width="2.5" height="5.5" rx="0.75" fill="currentColor" />
              <rect x="9" y="3" width="2.5" height="8" rx="0.75" fill="currentColor" />
              <rect x="13.5" y="0.5" width="2.5" height="10.5" rx="0.75" fill="currentColor" />
            </svg>
          </span>
          <span className="status-wifi" title="Wi-Fi">
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
              <path d="M0.5 3C4.5 -0.5 10.5 -0.5 14.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M3 5.8C5.8 3.5 9.2 3.5 12 5.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M5.5 8.6C6.7 7.6 8.3 7.6 9.5 8.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="7.5" cy="10.2" r="0.9" fill="currentColor" />
            </svg>
          </span>
          <span className="status-battery" title="Battery 100%">
            <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
              <rect x="0.75" y="0.75" width="18" height="9.5" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
              <rect x="2.5" y="2.5" width="12" height="6" rx="1.5" fill="currentColor" />
              <path d="M20.5 3.5V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}
