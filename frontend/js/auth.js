// ═══ AUTH ═══
function doLogin(){
  const email=document.getElementById('login-email')?.value||'arjun@email.com';
  const name=email.split('@')[0];
  userData={name:name.charAt(0).toUpperCase()+name.slice(1)+' Kumar',email,vehicle:'KA 01 AB 1234',initials:'AK'};
  localStorage.setItem('ps_user',JSON.stringify(userData));
  enterApp();
}
function doSignup(){
  const g=id=>document.getElementById(id).value;
  const fn=g('su-fname')||'Arjun', ln=g('su-lname')||'Kumar';
  userData={name:`${fn} ${ln}`,email:g('su-email')||'arjun@email.com',vehicle:g('su-vehicle')||'KA 01 AB 1234',initials:(fn[0]+ln[0]).toUpperCase()};
  localStorage.setItem('ps_user',JSON.stringify(userData));
  showToast('Account Created!','Welcome to ParkSmart Bangalore 🎉');
  setTimeout(enterApp,800);
}
function doLogout(){localStorage.removeItem('ps_user');userData=null;show('s-login');showToast('Signed out','See you next time!')}
function enterApp(){show('s-app');initApp()}
function otpNext(el,idx){const ins=document.querySelectorAll('#otp-row input');if(el.value&&idx<5)ins[idx+1].focus();if(idx===5&&el.value)doLogin()}
function togglePass(id,el){const inp=document.getElementById(id);inp.type=inp.type==='password'?'text':'password';el.textContent=inp.type==='password'?'👁':'🙈'}

