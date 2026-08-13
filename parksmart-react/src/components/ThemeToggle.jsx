import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'

export default function ThemeToggle() {
  const { themePref, setThemePref } = useApp()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (!open) return
      if (menuRef.current && !menuRef.current.contains(e.target) && e.target.id !== 'theme-btn') {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  const options = [
    ['light', '☀️ Light'],
    ['dark', '🌙 Dark'],
    ['system', '🖥 System Default'],
  ]

  return (
    <div style={{ position: 'absolute', top: 10, right: 14, zIndex: 150 }}>
      <div
        className="theme-btn"
        id="theme-btn"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        🌓
      </div>
      <div className={`theme-menu${open ? ' open' : ''}`} ref={menuRef}>
        {options.map(([val, label]) => (
          <div
            key={val}
            className={`theme-opt${themePref === val ? ' active' : ''}`}
            data-val={val}
            onClick={() => {
              setThemePref(val)
              setOpen(false)
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
