import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function PayModal() {
  const { modal, currentBookingData, closeModal, processPayment } = useApp()
  const b = currentBookingData
  const [name, setName] = useState('Arjun Kumar')
  const [card, setCard] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('08/27')
  const [cvv, setCvv] = useState('123')

  return (
    <div className={`modal-overlay${modal === 'pay' ? ' open' : ''}`} id="modal-pay">
      <div className="modal-sheet">
        <div className="modal-title">Secure Payment</div>
        <div className="pay-amt">
          <div className="muted" style={{ fontSize: '.8rem', marginBottom: '.3rem' }}>
            ParkSmart Bangalore · Slot <span>{b?.slot ?? 'A3'}</span>
          </div>
          <div className="n"><span>₹</span><span>{b?.total ?? 60}</span></div>
        </div>
        <div style={{ marginBottom: '.875rem' }}>
          <div className="label" style={{ marginBottom: '.5rem' }}>Pay via UPI</div>
          <div className="upi-row">
            <button onClick={() => processPayment('upi')}>GPay</button>
            <button onClick={() => processPayment('upi')}>PhonePe</button>
            <button onClick={() => processPayment('upi')}>Paytm</button>
            <button onClick={() => processPayment('upi')}>UPI ID</button>
          </div>
        </div>
        <div className="divider" style={{ fontSize: '.75rem' }}>or pay by card</div>
        <div className="field">
          <label>Cardholder Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Card Number</label>
          <input className="input" value={card} onChange={(e) => setCard(e.target.value)} maxLength={19} />
        </div>
        <div className="grid2">
          <div className="field">
            <label>Expiry</label>
            <input className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
          <div className="field">
            <label>CVV</label>
            <input className="input" value={cvv} onChange={(e) => setCvv(e.target.value)} maxLength={3} />
          </div>
        </div>
        <div className="secure-note">🔒 Secured by Razorpay · PCI-DSS Compliant</div>
        <div className="modal-btns">
          <button className="btn-outline" onClick={closeModal}>Cancel</button>
          <button className="btn" style={{ flex: 2 }} onClick={() => processPayment('card')}>Pay ₹{b?.total ?? 60} →</button>
        </div>
      </div>
    </div>
  )
}
