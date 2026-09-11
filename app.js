const menu = [
  {id:1, cat:'Espresso', name:'Americano', desc:'Classic espresso + water', amount:28, available:true, popular:true, image:'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=88'},
  {id:2, cat:'Milk', name:'Latte', desc:'Espresso · steamed milk', amount:32, available:true, popular:true, image:'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=900&q=88'},
  {id:3, cat:'Milk', name:'Dirty', desc:'Cold milk · espresso', amount:34, available:true, popular:true, image:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=88'},
  {id:4, cat:'Filter', name:'Today’s Pour-over', desc:'Bean list updates daily', amount:38, available:true, popular:true, image:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=88'},
  {id:5, cat:'Non-coffee', name:'Matcha Milk', desc:'Matcha · milk', amount:29, available:true, popular:false, image:'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=900&q=88'},
  {id:6, cat:'Food', name:'Croissant', desc:'Daily limited', amount:18, available:false, popular:false, image:'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=88'}
];

const roster = [];
const weekData = [];

const state = {
  theme: localStorage.getItem('ling-glass-theme') || 'light',
  page:'home',
  filter:'All',
  cart:{},
  selectedDay:0,
  weekOffset:0
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = value => String(value).replace(/[&<>'\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt',"'":'&#39;','\"':'&quot;'}[ch]));

function toast(text){
  const el=$('#toast');
  if(!el) return;
  el.textContent=text;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.classList.remove('show'),1500);
}

function applyTheme(theme){
  state.theme=theme;
  document.documentElement.dataset.theme=theme;
  localStorage.setItem('ling-glass-theme',theme);
  $$('[data-theme-choice]').forEach(btn=>btn.classList.toggle('active',btn.dataset.themeChoice===theme));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='light'?'#eee7db':'#17110e');
}

function setPage(id){
  state.page=id;
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===id));
  $$('.nav-item,.mobile-nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
window.setPage=setPage;
window.toast=toast;

function cardHTML(m,showAdd=true){
  return `<article class="drink-card" data-menu-id="${m.id}">
    <div class="drink-image" style="background-image:url('${m.image}')"></div>
    <div class="drink-copy">
      <div class="drink-category">${esc(m.cat)}</div>
      <h3>${esc(m.name)}</h3>
      <p>${esc(m.desc)}</p>
      <div class="drink-foot">
        <div class="amount">Suggested <strong>¥${m.amount}</strong></div>
        ${showAdd?`<button class="add-btn" data-add="${m.id}" ${m.available?'':'disabled'}>${m.available?'+ Add':'Not today'}</button>`:''}
      </div>
    </div>
  </article>`;
}

function bindAddButtons(root=document){
  root.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>{
    const id=Number(btn.dataset.add);
    state.cart[id]=(state.cart[id]||0)+1;
    renderCart();
    const item=menu.find(x=>x.id===id);
    if(item) toast(`${item.name} added`);
  }));
}

function renderHome(){
  const root=$('#homeDrinks');
  if(!root) return;
  root.innerHTML=menu.filter(m=>m.popular).slice(0,4).map(m=>cardHTML(m,false)).join('');
}

function renderFilters(){
  const root=$('#filters');
  if(!root) return;
  const cats=['All',...new Set(menu.map(m=>m.cat))];
  root.innerHTML=cats.map(cat=>`<button class="filter-btn ${cat===state.filter?'active':''}" data-filter="${esc(cat)}">${esc(cat)}</button>`).join('');
  root.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    state.filter=btn.dataset.filter;
    renderFilters();
    renderMenu();
  }));
}

function renderMenu(){
  const root=$('#menuGrid');
  if(!root) return;
  const list=state.filter==='All'?menu:menu.filter(m=>m.cat===state.filter);
  root.innerHTML=list.map(m=>cardHTML(m,true)).join('');
  bindAddButtons(root);
}

function renderCart(){
  const root=$('#cartList');
  if(!root) return;
  const entries=Object.entries(state.cart)
    .filter(([,q])=>q>0)
    .map(([id,q])=>({item:menu.find(m=>m.id===Number(id)),q}))
    .filter(x=>x.item);
  if(!entries.length){root.innerHTML='<div class="cart-empty">No items yet.</div>';return}
  const total=entries.reduce((s,{item,q})=>s+item.amount*q,0);
  root.innerHTML=entries.map(({item,q})=>`<div class="cart-row"><div><strong>${esc(item.name)}</strong><div class="muted" style="font-size:11px">¥${item.amount} × ${q}</div></div><div class="qty"><button data-qty="${item.id}" data-delta="-1">−</button><span>${q}</span><button data-qty="${item.id}" data-delta="1">+</button></div></div>`).join('')+`<div class="cart-total"><span>Total suggested</span><span>¥${total}</span></div>`;
  root.querySelectorAll('[data-qty]').forEach(btn=>btn.addEventListener('click',()=>{
    const id=Number(btn.dataset.qty);
    state.cart[id]=(state.cart[id]||0)+Number(btn.dataset.delta);
    if(state.cart[id]<=0) delete state.cart[id];
    renderCart();
  }));
}

function minutes(v){const [h,m]=String(v||'00:00').split(':').map(Number);return h*60+m}
function pct(){return 0}

function renderDayStrip(){
  const root=$('#dayStrip');
  if(!root) return;
  if(!weekData.length){root.innerHTML='<div class="schedule-empty">Loading schedule…</div>';return}
  root.innerHTML=weekData.map((d,i)=>`<button class="day-btn ${i===state.selectedDay?'active':''}" data-day="${i}"><small>${d.label}</small><strong>${d.day}</strong></button>`).join('');
  root.querySelectorAll('[data-day]').forEach(btn=>btn.addEventListener('click',()=>{
    state.selectedDay=Number(btn.dataset.day);
    renderDayStrip();
    renderScheduleRows();
  }));
}

function renderScheduleRows(){
  const day=weekData[state.selectedDay];
  const title=$('#selectedDayTitle');
  const root=$('#scheduleRows');
  if(!day){
    if(title) title.textContent='Loading schedule…';
    if(root) root.innerHTML='<div class="schedule-empty">Loading schedule…</div>';
    return;
  }
}

function renderRoster(){
  const root=$('#rosterList');
  if(!root) return;
  if(!roster.length){root.innerHTML='<div class="schedule-empty">Loading roster…</div>';return}
  root.innerHTML=roster.map(r=>`<div class="roster-person"><div class="avatar-dot" style="background:${r.color}">${r.name[0]}</div><div><strong>${r.name}</strong><div class="muted" style="font-size:11px;margin-top:3px">${r.bio}</div></div></div>`).join('');
}

function fillTimes(){
  const sel=$('#reserveTime');
  if(sel){sel.innerHTML='<option>Loading schedule…</option>';sel.disabled=true}
}

function shanghaiMonthDay(){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',month:'short',day:'numeric'}).formatToParts(new Date());
  const map=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return `${map.month}/${Number(map.day)}`;
}

function updateHeaderDate(){
  const actions=$('.header-actions');
  if(!actions) return;
  let pill=$('#headerDatePill');
  if(!pill){
    actions.innerHTML='<div id="headerDatePill" class="header-date-pill" aria-label="Today"></div>';
    pill=$('#headerDatePill');
  }
  pill.textContent=shanghaiMonthDay();
}

function bindGlobal(){
  $$('[data-page]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();setPage(el.dataset.page)}));
  $$('[data-theme-choice]').forEach(btn=>btn.addEventListener('click',()=>applyTheme(btn.dataset.themeChoice)));
  $$('.more-nav-btn').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.more-nav-btn').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    $$('.more-panel').forEach(x=>x.classList.remove('active'));
    $('#panel-'+btn.dataset.panel)?.classList.add('active');
  }));
}

applyTheme(state.theme);
renderHome();
renderFilters();
renderMenu();
renderCart();
renderDayStrip();
renderScheduleRows();
renderRoster();
fillTimes();
bindGlobal();
updateHeaderDate();
setInterval(updateHeaderDate,60000);

const navPolish=document.createElement('style');
navPolish.id='ling-nav-polish';
navPolish.textContent=`
  body .header-actions{display:flex!important;margin-left:auto!important;align-items:center!important}
  .header-date-pill{min-width:94px;height:46px;padding:0 18px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid var(--line-soft);background:rgba(255,255,255,.10);color:var(--text-strong);font:400 25px/1 var(--serif);letter-spacing:.01em;box-shadow:inset 0 1px 0 rgba(255,255,255,.28);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
  @media(max-width:760px),(orientation:portrait){.header-date-pill{min-width:92px;height:42px;padding:0 14px;font:400 23px/1 var(--serif)}}
  .mobile-nav-item[data-page="menu"] > span,
  .mobile-nav-item[data-page="schedule"] > span{width:24px;height:24px;display:block;position:relative;font-size:0;line-height:0}
  .mobile-nav-item[data-page="menu"] > span::before,
  .mobile-nav-item[data-page="schedule"] > span::before{content:"";display:block;width:24px;height:24px;background:currentColor;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;-webkit-mask-size:24px 24px;mask-size:24px 24px}
  .mobile-nav-item[data-page="menu"] > span::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 7h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7Z'/%3E%3Cpath d='M16 9h1.5a2.5 2.5 0 0 1 0 5H16'/%3E%3Cpath d='M3 20h15'/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 7h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7Z'/%3E%3Cpath d='M16 9h1.5a2.5 2.5 0 0 1 0 5H16'/%3E%3Cpath d='M3 20h15'/%3E%3C/svg%3E")}
  .mobile-nav-item[data-page="schedule"] > span::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='3'/%3E%3Cpath d='M8 3v4M16 3v4M3 10h18'/%3E%3Cpath d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01'/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='3'/%3E%3Cpath d='M8 3v4M16 3v4M3 10h18'/%3E%3Cpath d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01'/%3E%3C/svg%3E")}
`;
document.head.appendChild(navPolish);

function loadScript(src,onload,id){
  if(id&&document.getElementById(id)) return document.getElementById(id);
  const script=document.createElement('script');
  if(id) script.id=id;
  script.src=src;
  script.async=false;
  if(onload) script.onload=onload;
  document.body.appendChild(script);
  return script;
}

requestAnimationFrame(()=>{
  loadScript('schedule-public.js',null,'ling-schedule-public-script');
  loadScript('preference.js',()=>loadScript('preference-card.js'));
  loadScript('support.js');

  const NativeMutationObserver=window.MutationObserver;
  window.MutationObserver=class SafeMutationObserver extends NativeMutationObserver{
    observe(target,options={}){
      if((target?.id==='menuGrid'||target?.id==='homeDrinks')&&options.childList){
        return super.observe(target,{...options,subtree:false});
      }
      return super.observe(target,options);
    }
  };

  const adminScript=loadScript('admin.js?v=20260911-6',()=>{
    window.MutationObserver=NativeMutationObserver;
    loadScript('admin-stability.js?v=20260911-8');
    [0,250,750,1500,3000].forEach(delay=>setTimeout(updateHeaderDate,delay));
  });
  adminScript.onerror=()=>{window.MutationObserver=NativeMutationObserver};
});

document.addEventListener('click',event=>{
  if(event.target.closest?.('#adminLogin,#adminLogout')) [100,500,1500].forEach(delay=>setTimeout(updateHeaderDate,delay));
},true);