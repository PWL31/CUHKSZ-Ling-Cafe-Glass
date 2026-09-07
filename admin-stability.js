(function(){
  if(window.__lingAdminStabilityInstalled) return;
  window.__lingAdminStabilityInstalled=true;

  let explicitLogin=false;

  // iOS Safari can make several nested backdrop-filter surfaces look much more
  // transparent than the same cards elsewhere. Keep the liquid-glass effect,
  // but give mobile light mode a stable material fill so text remains legible.
  const style=document.createElement('style');
  style.id='ling-admin-stability-styles';
  style.textContent=`
    @media(max-width:760px),(orientation:portrait){
      html[data-theme="light"]{
        --glass:rgba(255,250,241,.64);
        --glass-strong:rgba(255,249,238,.78);
        --glass-soft:rgba(255,250,243,.52);
        --field:rgba(255,255,255,.50);
        --line:rgba(255,255,255,.72);
      }
      .glass,.glass-soft{
        -webkit-backdrop-filter:blur(30px) saturate(118%);
        backdrop-filter:blur(30px) saturate(118%);
      }
      .admin-warning{background:rgba(10,186,181,.13)!important}
    }
  `;
  document.head.appendChild(style);

  function applyPreview(mode){
    const normalized=mode==='user'?'user':'admin';
    document.body.dataset.adminPreview=normalized;
    try{sessionStorage.setItem('ling-admin-preview',normalized)}catch(_){}
    document.querySelectorAll('[data-admin-view]').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.adminView===normalized);
      btn.setAttribute('aria-pressed',btn.dataset.adminView===normalized?'true':'false');
    });
  }

  // Mark an explicit login so restoring an existing session can be treated
  // differently from the moment the barista deliberately signs in.
  document.addEventListener('pointerdown',event=>{
    if(event.target.closest?.('#adminLogin')) explicitLogin=true;
  },true);

  // admin.js originally navigated to Home/More every time the preview switch
  // changed. Intercept the switch in capture phase: preview mode should only
  // change what is visible, never trap navigation on one page.
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-admin-view]');
    if(!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    applyPreview(button.dataset.adminView);
  },true);

  function stabilizeSwitch(){
    const switcher=document.querySelector('.admin-view-switch');
    if(!switcher||switcher.dataset.stabilityReady==='1') return;
    switcher.dataset.stabilityReady='1';

    let preferred='admin';
    try{preferred=sessionStorage.getItem('ling-admin-preview')||'admin'}catch(_){}

    // The original session-restoration code forces More → Admin Tools on every
    // reload. Undo only that automatic jump; an explicit login remains on the
    // Admin Tools page where the login occurred.
    queueMicrotask(()=>{
      applyPreview(preferred);
      if(!explicitLogin && document.body.classList.contains('admin-authenticated')){
        window.setPage?.('home');
      }
    });
  }

  const observer=new MutationObserver(stabilizeSwitch);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  stabilizeSwitch();
})();
