// ═══ QUICK BOOK / SLOTS ═══
function quickBook(){
  document.getElementById('book-loc-main').value=document.getElementById('qb-loc').value;
  document.getElementById('book-dur-main').value=document.getElementById('qb-dur').value;
  showTab('book');loadSlotGrid();document.getElementById('tab-book').scrollTo(0,0);
}
function loadSlotGrid(){
  const loc=document.getElementById('book-loc-main').value;
  const dur=parseInt(document.getElementById('book-dur-main').value);
  const locData=LOCS.find(l=>l.name===loc);
  document.getElementById('slot-section').style.display='block';
  document.getElementById('slot-loc-label').textContent=`${loc} · ${dur} hour${dur>1?'s':''}`;
  document.getElementById('slot-price-label').textContent=`₹${dur*30}`;
  document.getElementById('slot-proceed-bar').style.display='none';
  selectedSlotId=null;

  const thresh=locData.avail/100;
  document.getElementById('slot-zones-main').innerHTML=['A','B','C'].map(z=>{
    const boxes=Array.from({length:8},(_,i)=>{
      const id=`${z}${i+1}`, r=Math.random();
      const [cls,icon]=r<(1-thresh-0.05)?['slot-occ','🚗']:r<(1-thresh+0.05)?['slot-res','📌']:['slot-avail','🟢'];
      return `<div class="slot-box ${cls}" id="sbox-${id}" onclick="pickSlot('${id}','${cls}')"><span>${icon}</span>${id}</div>`;
    }).join('');
    return `<div class="zone-title">Zone ${z}</div><div class="slot-grid">${boxes}</div>`;
  }).join('');
  showToast('Slots Loaded',`Showing bays for ${loc}`);
}
function pickSlot(id,cls){
  if(cls.includes('occ')||cls.includes('res'))return;
  document.querySelectorAll('.slot-sel').forEach(s=>{s.className='slot-box slot-avail';s.querySelector('span').textContent='🟢'});
  const el=document.getElementById(`sbox-${id}`); if(!el)return;
  el.className='slot-box slot-sel';el.querySelector('span').textContent='✓';
  selectedSlotId=id;
  document.getElementById('ssb-slot-name').textContent=id;
  document.getElementById('slot-proceed-bar').style.display='flex';
}

// ═══ BOOKING / PAYMENT FLOW ═══
function openBookModal(){
  if(!selectedSlotId)return;
  const loc=document.getElementById('book-loc-main').value;
  const dur=parseInt(document.getElementById('book-dur-main').value);
  const date=document.getElementById('book-date-main').value;
  const time=parseInt(document.getElementById('book-time-main').value);
  const total=dur*30, penalty=Math.round(total*0.2), refund=total-penalty;
  const timeStr=time<=12?`${time}:00 AM`:`${time-12}:00 PM`;
  currentBookingData={loc,dur,date,time,total,penalty,refund,slot:selectedSlotId};

  document.getElementById('modal-book-content').innerHTML=`
    <div class="detail-row"><span>Location</span><span>${loc}</span></div>
    <div class="detail-row"><span>Slot</span><span>${selectedSlotId}</span></div>
    <div class="detail-row"><span>Date</span><span>${date}</span></div>
    <div class="detail-row"><span>Start Time</span><span>${timeStr}</span></div>
    <div class="detail-row"><span>Duration</span><span>${dur} hour${dur>1?'s':''}</span></div>
    <div class="detail-row"><span>Rate</span><span>₹30 / hour</span></div>
    <div class="total-box"><span>Total Payable</span><b>₹${total}</b></div>
    <div class="warn-box">⚠ No-show: If you don't arrive within 30 minutes, ₹${penalty} (20%) will be deducted. ₹${refund} (80%) will be refunded.</div>
    <div class="modal-btns"><button class="btn-outline" onclick="closeBookModal()">Cancel</button><button class="btn" style="flex:2" onclick="goToPayment()">Proceed to Pay →</button></div>`;
  document.getElementById('modal-book').classList.add('open');
}
function closeBookModal(){document.getElementById('modal-book').classList.remove('open')}
function goToPayment(){
  closeBookModal();
  document.getElementById('pay-slot-name').textContent=currentBookingData.slot;
  document.getElementById('pay-amount').textContent=currentBookingData.total;
  document.getElementById('pay-btn-amt').textContent=currentBookingData.total;
  document.getElementById('modal-pay').classList.add('open');
}
function closePayModal(){document.getElementById('modal-pay').classList.remove('open')}
function fastPay(){processPayment()}
function processPayment(){
  closePayModal();
  const b=currentBookingData, id='PS'+Date.now().toString().slice(-6);
  myBookings.unshift({id,...b,status:'active',bookedAt:new Date().toISOString()});
  localStorage.setItem('ps_bk',JSON.stringify(myBookings));

  document.getElementById('success-id').textContent=id;
  document.getElementById('success-sub').textContent=`Slot ${b.slot} · ${b.loc}`;
  document.getElementById('sd-loc').textContent=b.loc;
  document.getElementById('sd-slot').textContent=b.slot;
  document.getElementById('sd-date').textContent=b.date;
  document.getElementById('sd-dur').textContent=`${b.dur} hr${b.dur>1?'s':''}`;
  document.getElementById('sd-paid').textContent=`₹${b.total}`;
  show('s-success');
}
function backToApp(){show('s-app');showTab('mybookings');renderMyBookings()}

