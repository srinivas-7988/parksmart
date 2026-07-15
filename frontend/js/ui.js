// ═══ TOAST ═══
function showToast(t,m){
  const toast=document.getElementById('toast');
  document.getElementById('toast-t').textContent=t;
  document.getElementById('toast-m').textContent=m;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),3000);
}
