import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { forgotPassword, verifyOTP, resetPassword } from '../api'

export default function Otp() {
  const { screen, setScreen, showToast } = useApp()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const sendOtp = async () => {
    if (!email) return showToast('OTP', 'Enter your registered email.')
    setLoading(true)
    try {
      await forgotPassword(email.trim())
      setStep(2)
      showToast('OTP Sent', 'Check your email for the 6-digit OTP.')
    } catch (error) {
      showToast('OTP Failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  const checkOtp = async () => {
    if (otp.length !== 6) return showToast('OTP', 'Enter the 6-digit OTP.')
    setLoading(true)
    try {
      await verifyOTP(email.trim(), otp)
      setStep(3)
      showToast('OTP Verified', 'Enter your new password.')
    } catch (error) {
      showToast('Invalid OTP', error.message)
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (newPassword.length < 8) return showToast('Password', 'Use at least 8 characters.')
    setLoading(true)
    try {
      await resetPassword(email.trim(), otp, newPassword)
      showToast('Password Changed', 'You can now login with your new password.')
      setStep(1)
      setOtp('')
      setNewPassword('')
      setScreen('login')
    } catch (error) {
      showToast('Reset Failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`screen${screen !== 'otp' ? ' hidden' : ''}`} id="s-otp">
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '2rem' }}>
          <div className="back-btn" onClick={() => setScreen('login')}>←</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Reset Password</div>
        </div>

        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
              <div style={{ fontSize: '2.5rem' }}>📧</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '.75rem' }}>Forgot your password?</div>
              <div className="muted" style={{ fontSize: '.83rem', marginTop: '.5rem' }}>We will send an OTP to your email.</div>
            </div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <button className="btn" onClick={sendOtp} disabled={loading}>{loading ? 'Sending...' : 'Send OTP →'}</button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="muted" style={{ marginBottom: '1rem' }}>OTP sent to <strong>{email}</strong></div>
            <label className="label">6-digit OTP</label>
            <input className="input" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" />
            <button className="btn" onClick={checkOtp} disabled={loading}>{loading ? 'Checking...' : 'Verify OTP →'}</button>
          </>
        )}

        {step === 3 && (
          <>
            <label className="label">New Password</label>
            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" />
            <button className="btn" onClick={changePassword} disabled={loading}>{loading ? 'Updating...' : 'Reset Password →'}</button>
          </>
        )}
      </div>
    </div>
  )
}
