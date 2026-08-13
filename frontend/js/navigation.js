// ═══ NAVIGATION ═══
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));document.getElementById(id).classList.remove('hidden')}

function buildStaticUI(){
  // OTP boxes
  document.getElementById('otp-row').innerHTML=[0,1,2,3,4,5].map(i=>`<input maxlength="1" oninput="otpNext(this,${i})">`).join('');
  // Auth art decorative dots (purely visual)
  document.getElementById('auth-art-login').innerHTML+=[[60,80,'Brigade Rd'],[120,200,'MG Road'],[80,'auto','Koramangala']].map((d,i)=>
    `<div class="dotmark" style="width:${10-i}px;height:${10-i}px;top:${d[0]}px;${i===2?'right:80px':'left:'+d[1]+'px'};animation-delay:${i*.4}s"></div>
     <div style="position:absolute;top:${d[0]-12}px;${i===2?'right:80px':'left:'+(d[1]+16)+'px'};background:rgba(0,200,150,.15);border:1px solid rgba(0,200,150,.3);border-radius:6px;padding:3px 8px;font-size:.65rem;font-weight:600;color:#00c896;white-space:nowrap">${d[2]}</div>`).join('');
  // Bottom nav
  document.getElementById('bottom-nav').innerHTML=NAV.map((n,i)=>
    `<div class="bnav-item${i===0?' active':''}" id="bn-${n[0]}" onclick="showTab('${n[0]}')"><div style="font-size:1.3rem">${n[1]}</div><span>${n[2]}</span></div>`).join('');
}

function showTab(id){
  NAV.forEach(n=>{
    const tab=document.getElementById(`tab-${n[0]}`), bn=document.getElementById(`bn-${n[0]}`);
    if(tab)tab.style.display='none';
    if(bn)bn.classList.remove('active');
  });
  const tab=document.getElementById(`tab-${id}`), bn=document.getElementById(`bn-${id}`);
  if(tab)tab.style.display='block';
  if(bn)bn.classList.add('active');
  if(id==='mybookings')renderMyBookings();
  if(id==='home'){renderRecentList();mlPredict();}
}
