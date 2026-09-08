(function(){
  if(window.__lingAdminStabilityInstalled) return;
  window.__lingAdminStabilityInstalled=true;

  // admin.js used to attach a long-lived MutationObserver to the rendered menu
  // roots. On iOS Safari that observer can keep the main thread busy enough to
  // make the page appear loaded while taps and timers stop responding.
  // Replace those observed roots once, then render them again. The old observer
  // stays attached only to detached DOM nodes and can no longer react to live UI.
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

  function applyRequestedUIFixes(){
    // Existing menu items already have their installed product image. Keep the
    // admin editor focused on editable metadata; GPT image generation remains
    // only in the New menu item workflow.
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

  // No document-wide MutationObserver here. Poll for a short, bounded period
  // only to handle the async admin-session response that creates the switch.
  let attempts=0;
  function settleAdminUI(){
    attempts+=1;
    const switcher=document.querySelector('.admin-view-switch');
    if(switcher){
      let preferred='admin';
      try{preferred=sessionStorage.getItem('ling-admin-preview')||'admin'}catch(_){}
      applyPreview(preferred);
      if(document.body.classList.contains('admin-authenticated')){
        window.setPage?.('home');
      }
      return;
    }
    if(attempts<30) setTimeout(settleAdminUI,100);
  }

  // Let admin.js finish its synchronous initialization first, then sever the
  // observer from the active menu DOM.
  setTimeout(()=>{
    detachObservedMenuRoots();
    applyRequestedUIFixes();
    settleAdminUI();
  },0);
})();
