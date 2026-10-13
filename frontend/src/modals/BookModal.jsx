import { useApp } from '../context/AppContext'
import { formatTimeOption } from '../utils/time'

export default function BookModal() {
  const { modal, currentBookingData, closeModal, goToPayment } = useApp()
  const b = currentBookingData

  return (
    <div className={`modal-overlay${modal === 'book' ? ' open' : ''}`} id="modal-book">
      <div className="modal-sheet">
        <div className="modal-title">Booking Summary</div>
        <div id="modal-book-content">
          {b && (
            <>
              <div className="detail-row"><span>Location</span><span>{b.loc}</span></div>
              <div className="detail-row"><span>Slot</span><span>{b.slot}</span></div>
              <div className="detail-row"><span>Date</span><span>{b.date}</span></div>
              <div className="detail-row"><span>Start Time</span><span>{formatTimeOption(b.time)}</span></div>
              <div className="detail-row"><span>Duration</span><span>{b.dur} hour{b.dur > 1 ? 's' : ''}</span></div>
              <div className="detail-row"><span>Rate</span><span>₹30 / hour</span></div>
              <div className="total-box"><span>Total Payable</span><b>₹{b.total}</b></div>
              <div className="warn-box">
                ⚠ No-show: If you don't arrive within 30 minutes, ₹{b.penalty} (20%) will be deducted. ₹{b.refund} (80%) will be refunded.
              </div>
              <div className="modal-btns">
                <button className="btn-outline" onClick={closeModal}>Cancel</button>
                <button className="btn" style={{ flex: 2 }} onClick={goToPayment}>Proceed to Pay →</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
