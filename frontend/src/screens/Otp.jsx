import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { sendPhoneOTP, verifyPhoneOTP } from '../api'

export default function Otp() {
  const { screen, setScreen, showToast, setUserData } = useApp()
  const [phone, setPhone] = useState('+91 98765 43210')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const inputsRef = useRef([])

  const handleSendCode = async () => {
    if (!phone.trim()) {
      showToast("Error", "Please enter phone number.")
      return
    }

    try {
      setLoading(true)
      const res = await sendPhoneOTP(phone.trim())
      setOtpSent(true)
      showToast("Code Sent", res.dev_otp ? `OTP: ${res.dev_otp}` : "Verification code sent.")
    } catch (err) {
      showToast("Error", err.message || "Failed to send OTP.")
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (idx, val) => {
    const next = [...otpDigits]
    next[idx] = val.slice(-1)
    setOtpDigits(next)

    if (val && idx < 5) {
      inputsRef.current[idx + 1]?.focus()
    }
    if (idx === 5 && val) {
      const fullCode = next.join('')
      if (fullCode.length === 6) {
        handleVerify(fullCode)
      }
    }
  }

  const handleVerify = async (codeToVerify) => {
    const otp = codeToVerify || otpDigits.join('')
    if (otp.length < 6) {
      showToast("Error", "Please enter 6-digit OTP.")
      return
    }

    try {
      setLoading(true)
      const data = await verifyPhoneOTP(phone.trim(), otp)
      const user = {
        ...data.user,
        name: data.user?.full_name || "User",
        initials: (data.user?.full_name || "User")
          .split(" ")
          .map((x) => x[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      }
      if (setUserData) setUserData(user)
      localStorage.setItem("ps_user", JSON.stringify(user))
      setScreen("app")
      showToast("Verified!", `Welcome ${user.name} 👋`)
    } catch (err) {
      showToast("Verification Failed", err.message || "Invalid OTP code.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`screen${screen !== 'otp' ? ' hidden' : ''}`} id="s-otp">
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '2rem' }}>
          <div className="back-btn" onClick={() => setScreen('login')}>
            ←
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Phone Login</div>
        </div>

        <div style={{ textAlign: 'center', padding: '1rem 0 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📲</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '.5rem' }}>
            {otpSent ? "Enter verification code" : "Login with Phone OTP"}
          </div>
          <div className="muted" style={{ fontSize: '.83rem' }}>
            {otpSent ? (
              <>Sent to <strong style={{ color: '#00c896' }}>{phone}</strong></>
            ) : (
              "Enter your registered mobile number"
            )}
          </div>
        </div>

        {!otpSent ? (
          <div style={{ marginBottom: "1.5rem" }}>
            <div className="field" style={{ marginBottom: "1rem" }}>
              <label>Phone Number</label>
              <input
                className="input"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button
              className="btn"
              onClick={handleSendCode}
              disabled={loading}
            >
              {loading ? "Sending Code..." : "Send Verification Code →"}
            </button>
          </div>
        ) : (
          <>
            <div className="otp-row" id="otp-row">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  maxLength={1}
                  value={otpDigits[i]}
                  ref={(el) => (inputsRef.current[i] = el)}
                  onChange={(e) => handleInput(i, e.target.value)}
                />
              ))}
            </div>

            <button
              className="btn"
              onClick={() => handleVerify()}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Continue →"}
            </button>

            <div
              className="muted"
              style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.82rem', cursor: 'pointer' }}
              onClick={handleSendCode}
            >
              Didn't receive code? <strong style={{ color: '#00c896' }}>Resend</strong>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
