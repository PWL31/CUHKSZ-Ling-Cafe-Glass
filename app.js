const menu = [
  {id:1, cat:'Espresso', name:'Americano', desc:'Classic espresso + water', amount:28, available:true, popular:true, image:'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=88'},
  {id:2, cat:'Milk', name:'Latte', desc:'Espresso · steamed milk', amount:32, available:true, popular:true, image:'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=900&q=88'},
  {id:3, cat:'Milk', name:'Dirty', desc:'Cold milk · espresso', amount:34, available:true, popular:true, image:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=88'},
  {id:4, cat:'Filter', name:'Today’s Pour-over', desc:'Bean list updates daily', amount:38, available:true, popular:true, image:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=88'},
  {id:5, cat:'Non-coffee', name:'Matcha Milk', desc:'Matcha · milk', amount:29, available:true, popular:false, image:'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=900&q=88'},
  {id:6, cat:'Food', name:'Croissant', desc:'Daily limited', amount:18, available:false, popular:false, image:'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=88'}
];

const roster = [
  {name:'Ling', color:'#8fb969', bio:'Morning espresso, calm service.'},
  {name:'Trent', color:'#c98562', bio:'Afternoon coffee and pour-over.'},
  {name:'Mori', color:'#789ec9', bio:'Filter coffee and late shifts.'}
];

const weekData = [
  {date:'2026-09-07', label:'Mon', day:7, shifts:[['Ling','10:00','16:00'],['Trent','14:00','21:00']]},
  {date:'2026-09-08', label:'Tue', day:8, shifts:[['Ling','12:00','18:00'],['Mori','15:00','22:00']]},
  {date:'2026-09-09', label:'Wed', day:9, shifts:[['Trent','14:00','21:30'],['Mori','10:00','15:00']]},
  {date:'2026-09-10', label:'Thu', day:10, shifts:[['Ling','10:00','16:00']]},
  {date:'2026-09-11', label:'Fri', day:11, shifts:[['Ling','11:00','17:00'],['Trent','16:00','22:00']]},
  {date:'2026-09-12', label:'Sat', day:12, shifts:[['Trent','15:30','22:00'],['Mori','10:00','17:30']]},
  {date:'2026-09-13', label:'Sun', day:13, shifts:[['Ling','12:00','18:00']]}
];

const state = {
  theme: localStorage.getItem("ling-glass-theme") || "light",
  page: "home",
  filter:"All",
  cart: {},
  selectedDay:0,
  weekOffset:0
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = value => String(value).replace(/[&<>'\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));

function toast(text){
  const el = $("#toast"); el.textContent = text; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(()=>el.classList.remove("show"),1500);
}

function applyTheme(theme){
  state.theme = theme; document.documentElement.dataset.theme = theme;
  localStorage.setItem("ling-glass-theme",theme);
  $$('[data-theme-choice]').forEach(btn=>btn.classList.toggle("active",btn.dataset.themeChoice===theme));
  document.querySelector('meta[name="theme-color"]').setAttribute("content", theme==="light" ? "#eee7db" : "#17110e");
}

function setPage(id){
  state.page = id;
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  $$(".nav-item,.mobile-nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
window.setPage=setPage;
window.toast=toast;

function cardHTML(m, compact=false){
  return `<article class="drink-card">
    <div class="drink-image" style="background-image:url('${m.image}')"></div>
    <div class="drink-copy">
      <h3>${esc(m.name)}</h3>
      <p>${esc(m.desc)}</p>
      <div class="drink-foot">
        <div class="amount">Suggested <strong>¥${m.amount}</strong></div>
        <button class="add-btn" data-add="${m.id}" ${m.available?"":"disabled"}>${m.available?"+ Add":"Not today"}</button>
      </div>
    </div>
  </article>`;
}

function bindAddButtons(root=document){
  root.querySelectorAll("[data-add]").forEach(btn=>btn.addEventListener("click",()=>{
    const id=Number(btn.dataset.add); state.cart[id]=(state.cart[id]||0)+1; renderCart(); toast(`${menu.find(x=>x.id===id).name} added`);
  }));
}

function renderHome(){
  const root = $("#homeDrinks");
  const popular = menu.filter(m=>m.popular).slice(0,4);
  root.innerHTML=popular.map(m=>cardHTML(m,true)).join("");
  bindAddButtons(root);
}

function renderFilters(){
  const cats=["All",...new Set(menu.map(m=>m.cat))];
  const root=$("#filters"); root.innerHTML=cats.map(cat=>`<button class="filter-btn ${cat===state.filter?"active":""}" data-filter="${cat}">${cat}</button>`).join("");
  root.querySelectorAll("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>{state.filter=btn.dataset.filter;renderFilters();renderMenu();}));
}

function renderMenu(){
  const list=state.filter==="All"?menu:menu.filter(m=>m.cat===state.filter);
  const root=$("#menuGrid"); root.innerHTML=list.map(m=>cardHTML(m)).join(""); bindAddButtons(root);
}

function renderCart(){
  const root=$("#cartList");
  if(!root) return;
  const entries=Object.entries(state.cart).filter(([,q])=>q>0).map(([id,q])=>({item:menu.find(m=>m.id===Number(id)),q}));
  if(!entries.length){root.innerHTML="<div class=\"cart-empty\">No items yet.</div>";return;}
  const total=entries.reduce((s,{item,q})=>s+item.amount*q,0);
  root.innerHTML=entries.map(({item,q})=>`<div class="cart-row"><div><strong>${esc(item.name)}</strong><div class="muted" style="font-size:11px">¥${item.amount} × ${q}</div></div><div class="qty"><button data-qty="${item.id}" data-delta="-1">−</button><span>${q}</span><button data-qty="${item.id}" data-delta="1">+</button></div></div>`).join("")+`<div class="cart-total"><span>Total suggested</span><span>¥${total}</span></div>`;
  root.querySelectorAll("[data-qty]").forEach(btn=>btn.addEventListener("click",()=>{const id=Number(btn.dataset.qty);state.cart[id]=(state.cart[id]||0)+Number(btn.dataset.delta);if(state.cart[id]<=0)delete state.cart[id];renderCart();}));
}

function minutes(v){const [h,m]=v.split(":").map(Number);return h*60+m}
function pct(v){return ((minutes(v)-600)/(720))*100}
function renderDayStrip(){
  const root=$("#dayStrip"); root.innerHTML=weekData.map((d,i)=>`<button class="day-btn ${i===state.selectedDay?"active":""}" data-day="${i}"><small>${d.label}</small><strong>${d.day}</strong></button>`).join("");
  root.querySelectorAll("[data-day]").forEach(btn=>btn.addEventListener("click",()=>{state.selectedDay=Number(btn.dataset.day);renderDayStrip();renderScheduleRows();}));
}
function renderScheduleRows(){
  const day=weekData[state.selectedDay];
  $("#selectedDayTitle").textContent=`${day.label}, Sep ${day.day}`;
  const rows=[["Cafe","10:00","22:00","cafe"],...day.shifts.map(([n,s,e])=>[n,s,e,n.toLowerCase()])];
  $("#scheduleRows").innerHTML=rows.map(([name,start,end,klass],idx)=>`<div class="timeline-row ${idx===0?"cafe-row":""}"><span class="person">${esc(name)}</span><div class="timeline-track"><span class="shift ${klass}" style="left:${Math.max(0,pct(start))}%;width:${Math.max(0,pct(end)-pct(start))}%"></span></div><span class="time">${start}–${end}</span></div>`).join("");
}
function renderRoster(){
  $("#rosterList").innerHTML=roster.map(r=>`<div class="roster-person"><div class="avatar-dot" style="background:${r.color}">${r.name[0]}</div><div><strong>${r.name}</strong><div class="muted" style="font-size:11px;margin-top:3px">${r.bio}</div></div><button class="summon-btn" data-summon="${r.name}">Summon</button></div>`).join("");
  $$("[data-summon]").forEach(b=>b.addEventListener("click",()=>toast(`Request sent for ${b.dataset.summon}`)));
}

function fillTimes(){
  const sel=$("#reserveTime");
  if(!sel) return;
  let html="";
  for(let h=10;h<22;h+=.5){const hour=Math.floor(h);const min=h%1?"30":"00";html+=`<option>${String(hour).padStart(2,"0")}:${min}</option>`} sel.innerHTML=html;
  const d=new Date(); const date=$("#reserveDate"); if(date) date.value=d.toISOString().slice(0,10);
}

function bindGlobal(){
  $$('[data-page]').forEach(el=>el.addEventListener("click",e=>{e.preventDefault();setPage(el.dataset.page)}));
  $$('[data-theme-choice]').forEach(btn=>btn.addEventListener("click",()=>applyTheme(btn.dataset.themeChoice)));
  $$(".more-nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
    $$(".more-nav-btn").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
    $$(".more-panel").forEach(x=>x.classList.remove("active"));const panel=$("#panel-"+btn.dataset.panel);if(panel)panel.classList.add("active");
  }));
  const reserveBtn=$("#reserveBtn");
  if(reserveBtn) reserveBtn.addEventListener("click",()=>{
    if(!Object.keys(state.cart).length)return toast("Choose something first");
    if(!$("#reserveName").value.trim())return toast("Leave a name");
    state.cart={};renderCart();$("#reserveName").value="";$("#reserveNote").value="";toast("Reservation saved in demo");
  });
  const clearCart=$("#clearCartBtn");if(clearCart)clearCart.addEventListener("click",()=>{state.cart={};renderCart()});
  const loginDemo=$("#loginDemo");if(loginDemo)loginDemo.addEventListener("click",()=>{$("#adminPreview")?.classList.remove("hidden");toast("Staff tools unlocked in demo")});
  $("#prevWeek").addEventListener("click",()=>toast("Previous week · static demo"));
  $("#nextWeek").addEventListener("click",()=>toast("Next week · static demo"));
}

applyTheme(state.theme);
renderHome();renderFilters();renderMenu();renderCart();renderDayStrip();renderScheduleRows();renderRoster();fillTimes();bindGlobal();

const preferenceScript=document.createElement('script');
preferenceScript.src='preference.js';
preferenceScript.defer=true;
preferenceScript.onload=()=>{
  const cardScript=document.createElement('script');
  cardScript.src='preference-card.js';
  cardScript.defer=true;
  document.body.appendChild(cardScript);
};
document.body.appendChild(preferenceScript);

const navPolish=document.createElement('style');
navPolish.id='ling-nav-polish';
navPolish.textContent=`
  .mobile-nav-item[data-page="menu"] > span,
  .mobile-nav-item[data-page="schedule"] > span{
    width:24px;height:24px;display:block;position:relative;font-size:0;line-height:0;
  }
  .mobile-nav-item[data-page="menu"] > span::before,
  .mobile-nav-item[data-page="schedule"] > span::before{
    content:"";display:block;width:24px;height:24px;background:currentColor;
    -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
    -webkit-mask-position:center;mask-position:center;
    -webkit-mask-size:24px 24px;mask-size:24px 24px;
  }
  .mobile-nav-item[data-page="menu"] > span::before{
    -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 7h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7Z'/%3E%3Cpath d='M16 9h1.5a2.5 2.5 0 0 1 0 5H16'/%3E%3Cpath d='M3 20h15'/%3E%3C/svg%3E");
    mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 7h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7Z'/%3E%3Cpath d='M16 9h1.5a2.5 2.5 0 0 1 0 5H16'/%3E%3Cpath d='M3 20h15'/%3E%3C/svg%3E");
  }
  .mobile-nav-item[data-page="schedule"] > span::before{
    -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='3'/%3E%3Cpath d='M8 3v4M16 3v4M3 10h18'/%3E%3Cpath d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01'/%3E%3C/svg%3E");
    mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='3'/%3E%3Cpath d='M8 3v4M16 3v4M3 10h18'/%3E%3Cpath d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01'/%3E%3C/svg%3E");
  }
  @media (orientation:landscape){
    .header-actions{display:none!important}
  }
`;
document.head.appendChild(navPolish);

const supportScript=document.createElement('script');
supportScript.src='support.js';
supportScript.defer=true;
document.body.appendChild(supportScript);

const adminScript=document.createElement('script');
adminScript.src='admin.js';
adminScript.defer=true;
document.body.appendChild(adminScript);
