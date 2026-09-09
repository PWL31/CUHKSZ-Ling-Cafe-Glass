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

    const scheduleScope=[...document.querySelectorAll('.admin-scope-card')].find(card=>card.querySelector('strong')?.textContent.trim()==='Schedule');
    if(scheduleScope){
      scheduleScope.classList.remove('pending');
      const copy=scheduleScope.querySelector('span');
      if(copy) copy.textContent='Calendar-based backend scheduling: weekly opening hours, date overrides, frozen history, barista roster, and daily shifts.';
    }
  }

  function loadOnce(src,id,onload){
    const existing=document.getElementById(id);
    if(existing){
      if(onload){
        if(existing.dataset.loaded==='1') onload();
        else existing.addEventListener('load',onload,{once:true});
      }
      return existing;
    }
    const script=document.createElement('script');
    script.id=id;
    script.src=src;
    script.async=false;
    script.addEventListener('load',()=>{
      script.dataset.loaded='1';
      onload?.();
    },{once:true});
    document.body.appendChild(script);
    return script;
  }

  let attempts=0;
  function settleAdminUI(){
    attempts+=1;
    applyRequestedUIFixes();
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
    loadOnce('schedule-admin.js','ling-schedule-admin-script',()=>{
      loadOnce('schedule-layout-fix.js','ling-schedule-layout-fix-script',()=>{
        loadOnce('schedule-ui-polish.js','ling-schedule-ui-polish-script');
      });
    });
  },0);
})();
