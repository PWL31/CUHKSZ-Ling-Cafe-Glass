(function(){
  if(window.__lingAdminStabilityInstalled) return;
  window.__lingAdminStabilityInstalled=true;

  const MENU_COLUMNS=4;
  const MENU_ROWS=5;
  const MENU_MAX_ID=19;

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

  function polishMenuCards(){
    document.querySelectorAll('.drink-card[data-menu-id]').forEach(card=>{
      const id=Number(card.dataset.menuId);
      const image=card.querySelector('.drink-image');
      if(image && id>=1 && id<=MENU_MAX_ID){
        const index=id-1;
        const col=index%MENU_COLUMNS;
        const row=Math.floor(index/MENU_COLUMNS);
        const x=col*(100/(MENU_COLUMNS-1));
        const y=row*(100/(MENU_ROWS-1));
        image.style.setProperty('background-image',"url('/menu-sprite.jpg')",'important');
        image.style.setProperty('background-size','400% 500%','important');
        image.style.setProperty('background-position',`${x}% ${y}%`,'important');
        image.style.setProperty('background-repeat','no-repeat','important');
      }

      const amount=card.querySelector('.amount');
      if(amount){
        const numeric=(amount.textContent.match(/¥\s*(\d+(?:\.\d+)?)/)||[])[1];
        amount.style.display=Number(numeric)>0?'':'none';
      }
    });
  }

  function installMenuObserver(){
    if(window.__lingMenuCardObserverInstalled) return;
    window.__lingMenuCardObserverInstalled=true;
    const observer=new MutationObserver(()=>polishMenuCards());
    ['menuGrid','homeDrinks'].forEach(id=>{
      const root=document.getElementById(id);
      if(root) observer.observe(root,{childList:true});
    });
    polishMenuCards();
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

        /* Ordering is not enabled yet. Keep only the availability indicator. */
        #menuGrid .add-btn:not(:disabled){display:none!important}
        #menuGrid .add-btn:disabled{display:inline-flex!important;pointer-events:none}

        /* New catalog donations start unset. Do not show a fake ¥0 value. */
        .drink-card .amount[style*="display: none"]{margin:0!important}

        /* Feedback is contact-only for now. */
        #panel-feedback>label,
        #panel-feedback>button.primary{display:none!important}
        #panel-feedback .compact-block{margin-top:22px}
        #panel-feedback .feedback-note{margin:6px 0 0;color:var(--muted);font-size:13px;line-height:1.5}
      `;
      document.head.appendChild(style);
    }

    const menuCopy=document.querySelector('#menu .page-hero p');
    if(menuCopy){
      menuCopy.textContent='Prices below are suggested. They help cover ingredients and daily operations. Feel free to pay more to support Ling Cafe, or less if needed.';
    }

    const feedbackPanel=document.querySelector('#panel-feedback');
    if(feedbackPanel){
      feedbackPanel.querySelector(':scope>label')?.remove();
      feedbackPanel.querySelector(':scope>button.primary')?.remove();
      if(!feedbackPanel.querySelector('.feedback-note')){
        const title=feedbackPanel.querySelector('h2');
        if(title){
          const note=document.createElement('p');
          note.className='feedback-note';
          note.textContent='Feel free to share any thoughts or suggestions.';
          title.insertAdjacentElement('afterend',note);
        }
      }
    }

    const sessionHint=document.querySelector('.admin-session small');
    if(sessionHint) sessionHint.textContent='Admin tools are active for this signed-in session.';

    const scheduleScope=[...document.querySelectorAll('.admin-scope-card')].find(card=>card.querySelector('strong')?.textContent.trim()==='Schedule');
    if(scheduleScope){
      scheduleScope.classList.remove('pending');
      const copy=scheduleScope.querySelector('span');
      if(copy) copy.textContent='Calendar-based backend scheduling: weekly opening hours, date overrides, frozen history, barista roster, and daily shifts.';
    }

    polishMenuCards();
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
    installMenuObserver();
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