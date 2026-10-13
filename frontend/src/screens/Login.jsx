import { useState } from 'react'
import { useApp } from '../context/AppContext'

// Decorative floating location markers on the login art panel
// (ported from navigation.js buildStaticUI's auth-art-login injection)
const ART_MARKERS = [
  { top: 60, left: 80, label: 'Brigade Rd' },
  { top: 120, left: 200, label: 'MG Road' },
  { top: 80, right: 80, label: 'Koramangala' },
]

export default function Login() {
  const { screen, setScreen, login } = useApp()

  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleLogin = () => {
    login(email, pass)
  }

  return (
    <div className={`screen${screen !== 'login' ? ' hidden' : ''}`} id="s-login">
      <div className="auth-art" id="auth-art-login">
        <div className="auth-brand">
          <b>
            Park<span>Smart</span>
          </b>
          <small>BANGALORE · ML-POWERED</small>
        </div>

        {ART_MARKERS.map((d, i) => {
          const size = 10 - i
          const posStyle = d.right !== undefined ? { right: d.right } : { left: d.left }
          return (
            <div key={i}>
              <div
                className="dotmark"
                style={{
                  width: size,
                  height: size,
                  top: d.top,
                  ...posStyle,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: d.top - 12,
                  ...(d.right !== undefined ? { right: d.right } : { left: d.left + 16 }),
                  background: 'rgba(0,200,150,.15)',
                  border: '1px solid rgba(0,200,150,.3)',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: '.65rem',
                  fontWeight: 600,
                  color: '#00c896',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.label}
              </div>
            </div>
          )
        })}
      </div>

      <div className="auth-body">
        <div className="auth-title fade">Welcome back 👋</div>
        <div className="auth-sub fade">
          New here?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setScreen('signup')
            }}
          >
            Create an account
          </a>
        </div>

        <div className="field fade">
          <label>Email</label>
          <div className="field-wrap">
            <i>✉️</i>
            <input
              type="email"
              id="login-email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
        </div>

        <div className="field fade">
          <label>Password</label>
          <div className="field-wrap">
            <i>🔒</i>
            <input
              type={showPass ? 'text' : 'password'}
              id="login-pass"
              placeholder="Enter password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
            <span className="eye" onClick={() => setShowPass((v) => !v)}>
              {showPass ? '🙈' : '👁'}
            </span>
          </div>
        </div>

        <a
          href="#"
          className="forgot fade"
          onClick={(e) => {
            e.preventDefault()
            setScreen('otp')
          }}
        >
          Forgot password?
        </a>

        <button className="btn fade" onClick={handleLogin}>
          Sign In →
        </button>

        <div className="divider fade">or continue with</div>

        <div className="social-row fade">
          <button onClick={handleLogin}>🔵 Google</button>
          <button onClick={() => setScreen('otp')}>📱 Phone OTP</button>
        </div>
      </div>
    </div>
  )
}
