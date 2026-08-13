// ═══ APP INIT ═══
function initApp(){
  if(userData){
    const first=userData.name.split(' ')[0], rest=userData.name.split(' ').slice(1).join(' ');
    document.getElementById('user-displayname').textContent=rest;
    document.querySelectorAll('.greeting-name').forEach(e=>e.innerHTML=`${first} <span>${rest}</span> 👋`);
    document.getElementById('profile-av').textContent=userData.initials||'AK';
    document.getElementById('profile-name-disp').textContent=userData.name;
    document.getElementById('profile-email-disp').textContent=userData.email;
    document.getElementById('profile-vehicle').textContent=userData.vehicle;
  }
  renderLocScroll();
  populateSelects();
  renderRecentList();
  renderMyBookings();
  updateHomePred();
  mlPredict();
  document.getElementById('book-date-main').value=new Date().toISOString().split('T')[0];
}

function renderLocScroll(){
  document.getElementById('loc-scroll-home').innerHTML=LOCS.map(l=>{
    const color=l.avail>65?'#22c55e':l.avail>40?'#f59e0b':'#ef4444';
    return `<div class="loc-chip" onclick="selectLocChip(this)">
      <div class="n">${l.name}</div><div class="s">${Math.round(l.slots*l.avail/100)}/${l.slots} available</div>
      <div class="bar"><i style="width:${l.avail}%;background:${color}"></i></div></div>`;
  }).join('');
}
function selectLocChip(el){document.querySelectorAll('.loc-chip').forEach(c=>c.classList.remove('active'));el.classList.add('active')}

function populateSelects(){
  const locOpts=LOCS.map(l=>`<option value="${l.name}">${l.name}</option>`).join('');
  document.getElementById('qb-loc').innerHTML=locOpts;
  document.getElementById('book-loc-main').innerHTML=locOpts;

  const durOpts=DURATIONS.map(d=>`<option value="${d}"${d===2?' selected':''}>${d} hr · ₹${d*30}</option>`).join('');
  document.getElementById('qb-dur').innerHTML=durOpts;
  document.getElementById('book-dur-main').innerHTML=DURATIONS.concat(5).map(d=>`<option value="${d}"${d===2?' selected':''}>${d} hr · ₹${d*30}</option>`).join('');

  document.getElementById('book-time-main').innerHTML=TIMES.map(t=>{
    const label=t<=12?`${t}:00 ${t===12?'PM':'AM'}`:`${t-12}:00 PM`;
    return `<option value="${t}"${t===18?' selected':''}>${label}</option>`;
  }).join('');
}

// ═══ PREDICTIONS ═══
function predictScore(traffic,withDay){
  const h=new Date().getHours(),d=new Date().getDay();
  let score=0.55;
  if(h>=11&&h<=14)score-=0.25;
  if(h>=17&&h<=20)score-=0.3;
  if(withDay&&(d===0||d===6))score-=0.15;
  if(traffic==='high')score-=0.25;
  if(traffic==='low')score+=0.2;
  if(withDay)score+=(Math.random()-0.5)*0.08;
  return Math.max(0.05,Math.min(0.95,score));
}
function applyPrediction(score,statusEl,fillEl,pctEl){
  const avail=score>0.5, conf=Math.round(avail?50+score*44:50+(1-score)*44);
  statusEl.textContent=avail?'Available':'Full';
  statusEl.className=statusEl.className.replace(/green|red/,'')+ (avail?' green':' red');
  if(fillEl)fillEl.style.width=conf+'%';
  if(pctEl)pctEl.textContent=conf+'%';
}
function updateHomePred(){
  const traffic=document.getElementById('pred-traffic-home')?.value||'medium';
  applyPrediction(predictScore(traffic,true),document.getElementById('home-pred'),document.getElementById('home-conf-fill'),document.getElementById('home-conf-pct'));
}
function mlPredict(){
  const traffic=document.getElementById('ml-traffic')?.value||'medium';
  applyPrediction(predictScore(traffic,false),document.getElementById('ml-pred-val'),null,document.getElementById('ml-conf-val'));
}

// ═══ RECENT LIST ═══
function renderRecentList(){
  const sample=[
    {loc:'Brigade Road',slot:'A3',date:'Today, 2:00 PM',status:'active',total:60},
    {loc:'MG Road',slot:'B7',date:'Yesterday, 4:00 PM',status:'completed',total:90},
    {loc:'Koramangala',slot:'C2',date:'Apr 8, 11:00 AM',status:'penalty',total:60},
  ];
  const disp=myBookings.length?myBookings.slice(0,3).map(b=>({loc:b.loc,slot:`Slot ${b.slot}`,date:b.date,status:b.status,total:b.total})):sample.map(s=>({...s,slot:`Slot ${s.slot}`}));
  document.getElementById('recent-list').innerHTML=disp.map(r=>{
    const [bgPill,,lbl,icon,bgIcon]=statusMeta[r.status];
    return `<div class="recent-item">
      <div class="recent-icon ${bgIcon}">${icon}</div>
      <div style="flex:1"><div class="recent-loc">${r.loc}</div><div class="recent-meta">${r.slot} · ${r.date} · ₹${r.total}</div></div>
      <span class="status-pill ${bgPill}">${lbl}</span>
    </div>`;
  }).join('');
}

