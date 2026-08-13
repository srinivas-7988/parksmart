// ═══ MY BOOKINGS ═══
function renderMyBookings(){
  const el=document.getElementById('my-bookings-list');
  document.getElementById('profile-total-bookings').textContent=myBookings.length;
  document.getElementById('profile-total-spent').textContent='₹'+myBookings.reduce((s,b)=>s+b.total,0);

  if(!myBookings.length){
    el.innerHTML=`<div style="text-align:center;padding:3rem 1rem" class="muted">
      <div style="font-size:2.5rem;margin-bottom:1rem">🅿</div>
      <div style="font-weight:600;margin-bottom:.5rem;color:var(--text)">No bookings yet</div>
      <button class="btn" onclick="showTab('book')">Book a Slot →</button></div>`;
    return;
  }
  el.innerHTML=myBookings.map(b=>{
    const [bg,,lbl]=statusMeta[b.status]||statusMeta.completed;
    const timeStr=b.time<=12?`${b.time}:00 AM`:`${b.time-12}:00 PM`;
    return `<div class="card" style="margin-bottom:.875rem">
      <div class="row-between" style="align-items:flex-start;margin-bottom:.625rem">
        <div><div style="font-weight:600;font-size:.92rem">${b.loc}</div>
        <div class="muted" style="font-size:.73rem;margin-top:.2rem">Slot ${b.slot} · ${b.date} · ${timeStr} · ${b.dur}hr</div></div>
        <span class="status-pill ${bg}">${lbl}</span>
      </div>
      <div class="row-between muted" style="font-size:.78rem">
        <span>ID: <strong class="mono" style="color:#00c896;font-size:.82rem">${b.id}</strong></span>
        <span>Paid: <strong style="color:var(--text)">₹${b.total}</strong></span>
      </div>
      ${b.status==='active'?`
      <div class="row-between" style="background:rgba(0,0,0,.2);border-radius:10px;padding:.625rem .875rem;margin-top:.75rem">
        <div class="muted" style="font-size:.72rem">Arrival window closes in</div>
        <div class="mono" style="font-size:1rem;font-weight:700;color:#f59e0b" id="tmr-${b.id}">29:59</div>
      </div>
      <div style="display:flex;gap:.625rem;margin-top:.75rem">
        <button style="flex:1;padding:.65rem;background:rgba(0,200,150,.1);border:1px solid rgba(0,200,150,.25);border-radius:10px;font-family:'Outfit';font-size:.8rem;font-weight:600;color:#00c896;cursor:pointer" onclick="confirmArrival('${b.id}')">✓ I've Arrived</button>
        <button style="padding:.65rem .875rem;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:10px;font-family:'Outfit';font-size:.8rem;color:#f87171;cursor:pointer" onclick="cancelBooking('${b.id}')">Cancel</button>
      </div>`:''}
    </div>`;
  }).join('');
  startTimers();
}
function startTimers(){
  myBookings.filter(b=>b.status==='active').forEach(b=>{
    if(tInts[b.id]||!document.getElementById(`tmr-${b.id}`))return;
    let s=1799;
    tInts[b.id]=setInterval(()=>{
      if(s<=0){clearInterval(tInts[b.id]);return}
      s--;
      const tel=document.getElementById(`tmr-${b.id}`);
      if(tel)tel.textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    },1000);
  });
}
function confirmArrival(id){
  const b=myBookings.find(x=>x.id===id);
  if(b){b.status='completed';localStorage.setItem('ps_bk',JSON.stringify(myBookings))}
  renderMyBookings();showToast('Arrived!','No penalty applies. Enjoy your parking! 🎉');
}
function cancelBooking(id){
  const b=myBookings.find(x=>x.id===id);
  if(b){b.status='penalty';localStorage.setItem('ps_bk',JSON.stringify(myBookings))}
  renderMyBookings();showToast('Cancelled',`₹${b.penalty} deducted · ₹${b.refund} refunded`);
}

