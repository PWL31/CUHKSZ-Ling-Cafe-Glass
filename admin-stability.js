(function(){
  if(window.__lingAdminStabilityInstalled) return;
  window.__lingAdminStabilityInstalled=true;

  let explicitLogin=false;

  function applyPreview(mode){
    const normalized=mode==='user'?'user':'admin';
    document.body.dataset.adminPreview=normalized;
    try{sessionStorage.setItem('ling-admin-preview',normalized)}catch(_){}
    document.querySelectorAll('[data-admin-view]').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.adminView===normalized);
      btn.setAttribute('aria-pressed',btn.dataset.adminView===normalized?'true':'false');
    });
  }

  document.addEventListener('pointerdown',event=>{
    if(event.target.closest?.('#adminLogin')) explicitLogin=true;
  },true);

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
