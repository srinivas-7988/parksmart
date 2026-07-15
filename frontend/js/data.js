// ═══ DATA ═══
const LOCS=[
  {name:'Brigade Road',avail:72,slots:40},{name:'Commercial Street',avail:45,slots:32},
  {name:'MG Road',avail:61,slots:48},{name:'Indiranagar',avail:83,slots:36},
  {name:'Koramangala',avail:38,slots:44},{name:'Jayanagar',avail:91,slots:30},
  {name:'Orion Mall',avail:56,slots:80},{name:'Garuda Mall',avail:29,slots:60},
];
const DURATIONS=[1,2,3,4]; // hrs, ₹30/hr
const TIMES=[8,9,10,11,12,13,14,15,16,17,18,19,20]; // 24h, default 18
const NAV=[['home','🏠','Home'],['book','🅿','Book'],['mybookings','📋','Bookings'],['profile','👤','Profile']];
const statusMeta={active:['bg-teal','#00c896','Active','🟢','bg-green'],penalty:['bg-amber','#f59e0b','Penalty','⚠','bg-amber'],completed:['bg-green','#22c55e','Done','✅','bg-blue']};

let myBookings=JSON.parse(localStorage.getItem('ps_bk')||'[]');
let userData=JSON.parse(localStorage.getItem('ps_user')||'null');
let selectedSlotId=null, currentBookingData={};
let tInts={};

