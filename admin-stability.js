(function(){
  if(window.__lingAdminStabilityInstalled) return;
  window.__lingAdminStabilityInstalled=true;

  function detachObservedMenuRoots(){
    const menuRoot=document.getElementById('menuGrid');
    const homeRoot=document.getElementById('homeDrinks');

    if(menuRoot && !menuRoot.dataset.touchFixDetached){
      const fresh=menuRoot.cloneNode(false);
      fresh.dataset.touchFixDetached='1';
      menuRoot.replaceWith(fresh);
    }
    if(homeRoot && !homeRoot.dataset.touchFixDetached){
      const fresh=homeRoot.cloneNode(false);
      fresh.dataset.touchFixDetached='1';
      homeRoot.replaceWith(fresh);
    }

    try{window.renderMenu?.()}catch(_){}
    try{window.renderHome?.()}catch(_){}
  }

  function applyPreview(mode){
    const normalized=mode==='user'?'user':'admin';
    document.body.dataset.adminPreview=normalized;
    try{sessionStorage.setItem('ling-admin-preview',normalized)}catch(_){}
    document.querySelectorAll('[data-admin-view]').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.adminView===normalized);
      btn.setAttribute('aria-pressed',btn.dataset.adminView===normalized?'true':'false');
    });
  }

  // Preview mode changes only visibility. Stay on the current page and retain scroll.
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-admin-view]');
    if(!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    applyPreview(button.dataset.adminView);
  },true);

  function applyRequestedUIFixes(){
    if(!document.getElementById('ling-admin-editor-cleanup')){
      const style=document.createElement('style');
      style.id='ling-admin-editor-cleanup';
      style.textContent=`
        #adminMenuEditor .admin-menu-item{display:block!important;grid-template-columns:none!important}
        #adminMenuEditor .admin-menu-item>div:first-child{display:none!important}
        #adminMenuEditor .admin-copy-prompt{display:none!important}
      `;
      document.head.appendChild(style);
    }

    const menuCopy=document.querySelector('#menu .page-hero p');
    if(menuCopy){
      menuCopy.textContent='Prices below are suggested. They help cover ingredients and daily operations. Feel free to pay more to support Ling Cafe, or less if needed.';
    }
  }

  function loadOnce(src,id){
    if(document.getElementById(id)) return;
    const script=document.createElement('script');
    script.id=id;
    script.src=src;
    script.async=false;
    document.body.appendChild(script);
  }

  let attempts=0;
  function settleAdminUI(){
    attempts+=1;
    const switcher=document.querySelector('.admin-view-switch');
    if(switcher){
      let preferred='admin';
      try{preferred=sessionStorage.getItem('ling-admin-preview')||'admin'}catch(_){}
      applyPreview(preferred);
      return;
    }
    if(attempts<30) setTimeout(settleAdminUI,100);
  }

  setTimeout(()=>{
    detachObservedMenuRoots();
    applyRequestedUIFixes();
    settleAdminUI();
    loadOnce('schedule-public.js','ling-schedule-public-script');
    loadOnce('schedule-admin.js','ling-schedule-admin-script');
  },0);
})();
