import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Signup() {
  const { screen, setScreen, signup } = useApp()
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)

  return (
    <div className={`screen${screen !== 'signup' ? ' hidden' : ''}`} id="s-signup">
      <div className="auth-art" style={{ height: 130 }}>
        <div className="auth-brand">
          <b>
            Park<span>Smart</span>
          </b>
          <small>CREATE YOUR ACCOUNT</small>
        </div>
      </div>
      <div className="auth-body">
        <div className="auth-title">Join ParkSmart 🚗</div>
        <div className="auth-sub">
          Already have an account?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setScreen('login')
            }}
          >
            Sign in
          </a>
        </div>
        <div className="form-2col">
          <div className="field">
            <label>First Name</label>
            <input className="input" placeholder="Arjun" id="su-fname" value={fname} onChange={(e) => setFname(e.target.value)} />
          </div>
          <div className="field">
            <label>Last Name</label>
            <input className="input" placeholder="Kumar" id="su-lname" value={lname} onChange={(e) => setLname(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Email Address</label>
          <input className="input" type="email" placeholder="you@example.com" id="su-email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Phone Number</label>
          <input className="input" type="tel" placeholder="+91 98765 43210" id="su-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label>Vehicle Number</label>
          <input className="input" placeholder="KA 01 AB 1234" id="su-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <div className="field-wrap">
            <input
              className="input"
              type={showPass ? 'text' : 'password'}
              placeholder="Min 8 characters"
              id="su-pass"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            <span className="eye" onClick={() => setShowPass((v) => !v)}>
              {showPass ? '🙈' : '👁'}
            </span>
          </div>
        </div>
        <button className="btn" onClick={() => signup({ fname, lname, email, phone, vehicle, pass })}>
          Create Account →
        </button>
      </div>
    </div>
  )
}
