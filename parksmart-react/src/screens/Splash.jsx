import { useApp } from '../context/AppContext'

export default function Splash() {
  const { screen } = useApp()
  return (
    <div className={`screen${screen !== 'splash' ? ' hidden' : ''}`} id="s-splash">
      <div>
        <div className="splash-icon">🅿</div>
        <div className="splash-title">
          Park<span>Smart</span>
        </div>
        <div className="dots">
          <i></i>
          <i></i>
          <i></i>
        </div>
      </div>
    </div>
  )
}
