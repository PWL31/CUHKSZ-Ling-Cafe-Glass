(function(){
  if(window.__lingScheduleUIPolishInstalled) return;
  window.__lingScheduleUIPolishInstalled=true;

  const style=document.createElement('style');
  style.id='ling-schedule-ui-polish';
  style.textContent=`
    /* Keep iOS Safari time values optically centered inside the liquid-glass field. */
    #adminScheduleEditor input[type="time"]{
      padding-top:0!important;
      padding-bottom:0!important;
      line-height:1!important;
      vertical-align:middle!important;
    }
    #adminScheduleEditor input[type="time"]::-webkit-date-and-time-value{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:100%!important;
      height:100%!important;
      min-height:100%!important;
      line-height:1!important;
      text-align:center!important;
    }
    #adminScheduleEditor input[type="time"]::-webkit-datetime-edit{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:100%!important;
      height:100%!important;
      min-height:100%!important;
      padding:0!important;
      line-height:1!important;
    }
    #adminScheduleEditor input[type="time"]::-webkit-datetime-edit-fields-wrapper{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      height:100%!important;
      line-height:1!important;
    }
    #adminScheduleEditor input[type="time"]::-webkit-datetime-edit-hour-field,
    #adminScheduleEditor input[type="time"]::-webkit-datetime-edit-minute-field,
    #adminScheduleEditor input[type="time"]::-webkit-datetime-edit-text{
      line-height:1!important;
      padding-top:0!important;
      padding-bottom:0!important;
    }

    .ling-confirm-layer{
      position:fixed;
      inset:0;
      z-index:99999;
      display:grid;
      place-items:center;
      padding:22px;
      background:rgba(20,14,11,.34);
      -webkit-backdrop-filter:blur(14px) saturate(1.08);
      backdrop-filter:blur(14px) saturate(1.08);
    }
    .ling-confirm-card{
      width:min(430px,100%);
      padding:22px;
      border:1px solid var(--line);
      border-radius:26px;
      background:var(--glass-strong,rgba(44,35,30,.88));
      box-shadow:0 24px 70px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.16);
      color:var(--text-strong);
      -webkit-backdrop-filter:blur(28px) saturate(1.12);
      backdrop-filter:blur(28px) saturate(1.12);
    }
    .ling-confirm-card .eyebrow{margin-bottom:10px}
    .ling-confirm-card h3{
      margin:0;
      font:400 30px/1.05 var(--serif);
      color:var(--text-strong);
    }
    .ling-confirm-card p{
      margin:13px 0 20px;
      color:var(--muted);
      font-size:13px;
      line-height:1.6;
    }
    .ling-confirm-actions{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:9px;
    }
    .ling-confirm-actions button{
      min-height:48px;
      border-radius:999px;
      font:800 13px/1 var(--sans);
      cursor:pointer;
    }
    .ling-confirm-cancel{
      border:1px solid var(--line);
      background:rgba(255,255,255,.08);
      color:var(--text-strong);
    }
    .ling-confirm-ok{
      border:1px solid rgba(182,80,71,.34);
      background:rgba(182,80,71,.13);
      color:#c65d54;
    }
    .ling-confirm-actions button:disabled{opacity:.5;cursor:wait}

    @media(max-width:820px),(orientation:portrait){
      #adminScheduleEditor .weekly-row input[type="time"]{height:54px!important;min-height:54px!important}
      #adminScheduleEditor .day-hours input[type="time"],
      #adminScheduleEditor .shift-row input[type="time"],
      #adminScheduleEditor .shift-add input[type="time"]{height:58px!important;min-height:58px!important}
      .ling-confirm-layer{padding:18px}
      .ling-confirm-card{padding:20px;border-radius:24px}
      .ling-confirm-card h3{font-size:28px}
    }
  `;
  document.head.appendChild(style);

  function showConfirm(){
    return new Promise(resolve=>{
      const layer=document.createElement('div');
      layer.className='ling-confirm-layer';
      layer.setAttribute('role','presentation');
      layer.innerHTML=`
        <div class="ling-confirm-card" role="dialog" aria-modal="true" aria-labelledby="lingConfirmTitle">
          <div class="eyebrow">ROSTER</div>
          <h3 id="lingConfirmTitle">Remove barista?</h3>
          <p>This removes the barista from future Add Shift choices. Existing shifts and schedule history remain unchanged.</p>
          <div class="ling-confirm-actions">
            <button type="button" class="ling-confirm-cancel">Cancel</button>
            <button type="button" class="ling-confirm-ok">OK</button>
          </div>
        </div>`;
      const finish=value=>{layer.remove();resolve(value)};
      layer.querySelector('.ling-confirm-cancel').addEventListener('click',()=>finish(false));
      layer.querySelector('.ling-confirm-ok').addEventListener('click',()=>finish(true));
      layer.addEventListener('click',event=>{if(event.target===layer)finish(false)});
      const onKey=event=>{
        if(event.key==='Escape'){document.removeEventListener('keydown',onKey);finish(false)}
      };
      document.addEventListener('keydown',onKey);
      document.body.appendChild(layer);
      layer.querySelector('.ling-confirm-cancel').focus();
    });
  }

  async function removeBarista(button){
    const ok=await showConfirm();
    if(!ok) return;

    const id=button.dataset.removeBarista;
    const row=button.closest('.barista-row');
    button.disabled=true;
    button.textContent='Removing…';
    try{
      const response=await fetch(`/api/admin/schedule/baristas/${encodeURIComponent(id)}`,{
        method:'DELETE',
        credentials:'same-origin',
        cache:'no-store'
      });
      let body={};
      try{body=await response.json()}catch(_){}
      if(!response.ok) throw new Error(body.error||`Request failed (${response.status})`);

      try{
        sessionStorage.setItem('ling-schedule-scroll-after-remove',String(window.scrollY));
        sessionStorage.setItem('ling-admin-tool','schedule');
      }catch(_){}
      row?.remove();
      window.toast?.('Barista removed');
      setTimeout(()=>window.location.reload(),120);
    }catch(error){
      button.disabled=false;
      button.textContent='Remove';
      window.toast?.(error.message||'Could not remove barista');
    }
  }

  /* Capture before schedule-admin.js's native confirm() click handler. */
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-remove-barista]');
    if(!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    removeBarista(button);
  },true);

  let savedScroll=null;
  try{
    const value=sessionStorage.getItem('ling-schedule-scroll-after-remove');
    if(value!==null){savedScroll=Number(value);sessionStorage.removeItem('ling-schedule-scroll-after-remove')}
  }catch(_){}
  if(Number.isFinite(savedScroll)){
    let tries=0;
    const restore=()=>{
      tries+=1;
      if(document.getElementById('adminScheduleEditor')||tries>20){
        window.scrollTo({top:savedScroll,behavior:'auto'});
      }else setTimeout(restore,100);
    };
    setTimeout(restore,100);
  }
})();
