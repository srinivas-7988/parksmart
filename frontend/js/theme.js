// ═══ THEME ═══
const sysMedia=window.matchMedia?window.matchMedia('(prefers-color-scheme: light)'):null;
function resolveTheme(pref){return pref==='system'?(sysMedia&&sysMedia.matches?'light':'dark'):pref}
function applyTheme(pref){
  document.documentElement.setAttribute('data-theme',resolveTheme(pref));
  document.querySelectorAll('.theme-opt').forEach(o=>o.classList.toggle('active',o.dataset.val===pref));
}
function setTheme(pref){
  localStorage.setItem('ps_theme',pref);
  applyTheme(pref);
  document.getElementById('theme-menu').classList.remove('open');
}
function toggleThemeMenu(e){
  e.stopPropagation();
  document.getElementById('theme-menu').classList.toggle('open');
}
document.addEventListener('click',(e)=>{
  const menu=document.getElementById('theme-menu');
  if(menu&&menu.classList.contains('open')&&!menu.contains(e.target)&&e.target.id!=='theme-btn')menu.classList.remove('open');
});
if(sysMedia)sysMedia.addEventListener('change',()=>{
  if((localStorage.getItem('ps_theme')||'system')==='system')applyTheme('system');
});
applyTheme(localStorage.getItem('ps_theme')||'system');

