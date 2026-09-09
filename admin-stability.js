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

  function applyRequestedUIFixes(){
    if(!document.getElementById('ling-admin-editor-cleanup')){
      const style=document.createElement('style');
      style.id='ling-admin-editor-cleanup';
      style.textContent=`
        #adminMenuEditor .admin-menu-item{display:block!important;grid-template-columns:none!important}
        #adminMenuEditor .admin-menu-item>div:first-child{display:none!important}
        #adminMenuEditor .admin-copy-prompt{display:none!important}
        .admin-view-switch{display:none!important}
        .admin-preview-hint{display:none!important}
      `;
      document.head.appendChild(style);
    }

    const menuCopy=document.querySelector('#menu .page-hero p');
    if(menuCopy){
      menuCopy.textContent='Prices below are suggested. They help cover ingredients and daily operations. Feel free to pay more to support Ling Cafe, or less if needed.';
    }

    const sessionHint=document.querySelector('.admin-session small');
    if(sessionHint) sessionHint.textContent='Admin tools are active for this signed-in session.';

    const scheduleScope=[...document.querySelectorAll('.admin-scope-card')].find(card=>card.querySelector('strong')?.textContent.trim()==='Schedule');
    if(scheduleScope){
      scheduleScope.classList.remove('pending');
      const copy=scheduleScope.querySelector('span');
      if(copy) copy.textContent='Calendar-based backend scheduling: weekly opening hours, date overrides, frozen history, barista roster, and daily shifts.';
    }

    try{window.updateHeaderDate?.()}catch(_){}
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
    if(document.querySelector('#adminLoggedIn')||attempts>=30) return;
    setTimeout(settleAdminUI,100);
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
