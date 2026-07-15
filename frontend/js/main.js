// ═══ MAIN (bootstrap) ═══
window.onload=()=>{
  setTime();
  setInterval(setTime,30000);
  setInterval(()=>{const el=document.getElementById('live-avail');if(el)el.textContent=800+Math.floor(Math.random()*100)},8000);
  buildStaticUI();
  setTimeout(()=>userData?enterApp():show('s-login'),2200);
};

function setTime(){
  const n=new Date(),h=String(n.getHours()).padStart(2,'0'),m=String(n.getMinutes()).padStart(2,'0');
  document.querySelectorAll('.status-time').forEach(el=>el.textContent=`${h}:${m}`);
  const h12=n.getHours()%12||12, ampm=n.getHours()>=12?'PM':'AM';
  const el=document.getElementById('pred-hr'); if(el)el.textContent=`${h12}:${m} ${ampm}`;
  const eld=document.getElementById('pred-dy'); if(eld)eld.textContent=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][n.getDay()];
}
