(function(){
  if(window.__lingScheduleUIPolishInstalled) return;
  window.__lingScheduleUIPolishInstalled=true;

  const esc=value=>String(value??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));

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

    /* Danger actions should have the same material strength as Update. */
    #adminScheduleEditor .day-action,
    #adminScheduleEditor .day-danger{opacity:1!important}
    #adminScheduleEditor .day-danger{
      border-color:rgba(198,93,84,.42)!important;
      background:rgba(198,93,84,.14)!important;
      color:#c65d54!important;
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
    .ling-confirm-card h3{margin:0;font:400 30px/1.05 var(--serif);color:var(--text-strong)}
    .ling-confirm-card p{margin:13px 0 20px;color:var(--muted);font-size:13px;line-height:1.6}
    .ling-confirm-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .ling-confirm-actions button{min-height:48px;border-radius:999px;font:800 13px/1 var(--sans);cursor:pointer}
    .ling-confirm-cancel{border:1px solid var(--line);background:rgba(255,255,255,.08);color:var(--text-strong)}
    .ling-confirm-ok{border:1px solid rgba(198,93,84,.42);background:rgba(198,93,84,.14);color:#c65d54}
    .ling-confirm-actions button:disabled{opacity:.5;cursor:wait}

    /* The roster editor owns add/edit/remove. Hide the old name-only add row. */
    #adminScheduleEditor .barista-add{display:none!important}
    #adminScheduleEditor .barista-list{display:grid!important;gap:10px!important}
    #adminScheduleEditor .barista-profile-card,
    #adminScheduleEditor .barista-profile-add{
      display:grid;
      grid-template-columns:auto minmax(0,1fr);
      gap:12px;
      padding:13px;
      border:1px solid var(--line-soft);
      border-radius:17px;
      background:rgba(255,255,255,.05);
      min-width:0;
    }
    #adminScheduleEditor .barista-profile-avatar{
      width:44px;height:44px;border-radius:50%;
      display:grid;place-items:center;
      color:#fff;font:800 16px/1 var(--sans);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.26);
    }
    #adminScheduleEditor .barista-profile-fields{display:grid;grid-template-columns:1fr 1fr;gap:9px;min-width:0}
    #adminScheduleEditor .barista-profile-fields label{margin:0;min-width:0}
    #adminScheduleEditor .barista-profile-fields label:first-child{grid-column:1/-1}
    #adminScheduleEditor .barista-profile-fields input[type="text"]{width:100%;min-width:0}
    #adminScheduleEditor .barista-color-control{display:flex;align-items:center;gap:9px;min-height:46px}
    #adminScheduleEditor .barista-color-control input[type="color"]{
      width:48px!important;height:40px!important;min-width:48px!important;padding:3px!important;
      border-radius:12px!important;cursor:pointer!important;
    }
    #adminScheduleEditor .barista-color-code{font:700 11px/1 var(--sans);color:var(--muted);text-transform:uppercase}
    #adminScheduleEditor .barista-profile-actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:2px}
    #adminScheduleEditor .barista-profile-actions button,
    #adminScheduleEditor .barista-profile-add button{
      min-height:44px;border-radius:999px;padding:0 14px;font-weight:800;cursor:pointer;
    }
    #adminScheduleEditor .barista-profile-save,
    #adminScheduleEditor .barista-profile-add button{border:1px solid var(--line);background:rgba(255,255,255,.08);color:var(--text-strong)}
    #adminScheduleEditor .barista-profile-remove{border:1px solid rgba(198,93,84,.42);background:rgba(198,93,84,.14);color:#c65d54}
    #adminScheduleEditor .barista-profile-add{grid-template-columns:1fr;margin-top:2px;border-style:dashed;border-color:rgba(10,186,181,.32);background:rgba(10,186,181,.04)}
    #adminScheduleEditor .barista-profile-add .barista-profile-fields{grid-template-columns:1fr 1fr}
    #adminScheduleEditor .barista-profile-add button{width:100%;background:var(--accent);border:0;color:#063b39}

    @media(max-width:820px),(orientation:portrait){
      #adminScheduleEditor .weekly-row input[type="time"]{height:54px!important;min-height:54px!important}
      #adminScheduleEditor .day-hours input[type="time"],
      #adminScheduleEditor .shift-row input[type="time"],
      #adminScheduleEditor .shift-add input[type="time"]{height:58px!important;min-height:58px!important}
      .ling-confirm-layer{padding:18px}
      .ling-confirm-card{padding:20px;border-radius:24px}
      .ling-confirm-card h3{font-size:28px}
      #adminScheduleEditor .barista-profile-card{grid-template-columns:1fr}
      #adminScheduleEditor .barista-profile-avatar{width:48px;height:48px}
      #adminScheduleEditor .barista-profile-fields,
      #adminScheduleEditor .barista-profile-add .barista-profile-fields{grid-template-columns:1fr}
      #adminScheduleEditor .barista-profile-fields label:first-child{grid-column:auto}
      #adminScheduleEditor .barista-profile-actions{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  function showConfirm({eyebrow='SCHEDULE',title,message,okLabel='OK'}){
    return new Promise(resolve=>{
      const layer=document.createElement('div');
      layer.className='ling-confirm-layer';
      layer.setAttribute('role','presentation');
      layer.innerHTML=`
        <div class="ling-confirm-card" role="dialog" aria-modal="true" aria-labelledby="lingConfirmTitle">
          <div class="eyebrow">${esc(eyebrow)}</div>
          <h3 id="lingConfirmTitle">${esc(title)}</h3>
          <p>${esc(message)}</p>
          <div class="ling-confirm-actions">
            <button type="button" class="ling-confirm-cancel">Cancel</button>
            <button type="button" class="ling-confirm-ok">${esc(okLabel)}</button>
          </div>
        </div>`;
      let finished=false;
      const finish=value=>{if(finished)return;finished=true;document.removeEventListener('keydown',onKey);layer.remove();resolve(value)};
      const onKey=event=>{if(event.key==='Escape')finish(false)};
      layer.querySelector('.ling-confirm-cancel').addEventListener('click',()=>finish(false));
      layer.querySelector('.ling-confirm-ok').addEventListener('click',()=>finish(true));
      layer.addEventListener('click',event=>{if(event.target===layer)finish(false)});
      document.addEventListener('keydown',onKey);
      document.body.appendChild(layer);
      layer.querySelector('.ling-confirm-cancel').focus();
    });
  }

  async function api(path,options={}){
    const headers={...(options.headers||{})};
    if(options.body&&!headers['Content-Type'])headers['Content-Type']='application/json';
    const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers});
    let body={};try{body=await response.json()}catch(_){}
    if(!response.ok)throw new Error(body.error||`Request failed (${response.status})`);
    return body;
  }

  function rememberScroll(){
    try{
      sessionStorage.setItem('ling-schedule-scroll-after-action',String(window.scrollY));
      sessionStorage.setItem('ling-admin-tool','schedule');
    }catch(_){}
  }

  function reloadSoon(){rememberScroll();setTimeout(()=>window.location.reload(),120)}

  async function deleteShift(button){
    const row=button.closest('[data-shift-id]');
    const id=row?.dataset.shiftId;
    if(!id)return;
    const ok=await showConfirm({eyebrow:'SHIFT',title:'Delete this shift?',message:'This shift will be removed from the selected date. This action cannot be undone.',okLabel:'Delete'});
    if(!ok)return;
    button.disabled=true;button.textContent='Deleting…';
    try{await api(`/api/admin/schedule/shifts/${encodeURIComponent(id)}`,{method:'DELETE'});window.toast?.('Shift deleted');reloadSoon()}
    catch(error){button.disabled=false;button.textContent='Delete';window.toast?.(error.message||'Could not delete shift')}
  }

  async function removeBarista(id,button){
    const ok=await showConfirm({eyebrow:'ROSTER',title:'Remove barista?',message:'This removes the barista from future Add Shift choices. Existing shifts and schedule history remain unchanged.',okLabel:'Remove'});
    if(!ok)return;
    if(button){button.disabled=true;button.textContent='Removing…'}
    try{await api(`/api/admin/schedule/baristas/${encodeURIComponent(id)}`,{method:'DELETE'});window.toast?.('Barista removed');reloadSoon()}
    catch(error){if(button){button.disabled=false;button.textContent='Remove'}window.toast?.(error.message||'Could not remove barista')}
  }

  function profileCard(barista){
    const color=barista.color||'#8fb969';
    const bio=barista.bio??'Ling Cafe barista';
    return `<div class="barista-profile-card" data-barista-profile="${barista.id}">
      <div class="barista-profile-avatar" data-profile-avatar style="background:${esc(color)}">${esc((barista.name||'?').slice(0,1).toUpperCase())}</div>
      <div class="barista-profile-fields">
        <label><span>Name</span><input type="text" data-profile-name maxlength="60" value="${esc(barista.name)}"></label>
        <label><span>Subtitle / signature</span><input type="text" data-profile-bio maxlength="90" value="${esc(bio)}" placeholder="Ling Cafe barista"></label>
        <label><span>Display color</span><div class="barista-color-control"><input type="color" data-profile-color value="${esc(color)}"><span class="barista-color-code" data-color-code>${esc(color)}</span></div></label>
        <div class="barista-profile-actions"><button type="button" class="barista-profile-save" data-save-barista-profile>Save changes</button><button type="button" class="barista-profile-remove" data-remove-barista-profile>Remove</button></div>
      </div>
    </div>`;
  }

  function addCard(){
    return `<div class="barista-profile-add" data-barista-profile-add>
      <div class="eyebrow">ADD BARISTA</div>
      <div class="barista-profile-fields">
        <label><span>Name</span><input type="text" data-new-profile-name maxlength="60" placeholder="Barista name"></label>
        <label><span>Subtitle / signature</span><input type="text" data-new-profile-bio maxlength="90" value="Ling Cafe barista" placeholder="Ling Cafe barista"></label>
        <label><span>Display color</span><div class="barista-color-control"><input type="color" data-new-profile-color value="#0abab5"><span class="barista-color-code" data-new-color-code>#0ABAB5</span></div></label>
      </div>
      <button type="button" data-add-barista-profile>Add barista</button>
    </div>`;
  }

  let renderingProfiles=false;
  async function renderBaristaProfiles(force=false){
    const root=document.getElementById('baristaAdminList');
    if(!root||renderingProfiles)return false;
    if(!force&&root.querySelector('[data-barista-profile],[data-barista-profile-add]'))return true;
    renderingProfiles=true;
    try{
      const data=await api('/api/admin/schedule',{method:'GET'});
      const active=(data.baristas||[]).filter(b=>b.active);
      root.innerHTML=(active.length?active.map(profileCard).join(''):'<div class="schedule-empty">No active baristas.</div>')+addCard();
      root.querySelectorAll('[data-profile-color]').forEach(input=>input.addEventListener('input',()=>{
        const card=input.closest('[data-barista-profile]');card?.querySelector('[data-profile-avatar]')?.style.setProperty('background',input.value);
        const code=card?.querySelector('[data-color-code]');if(code)code.textContent=input.value.toUpperCase();
      }));
      const newColor=root.querySelector('[data-new-profile-color]');
      newColor?.addEventListener('input',()=>{const code=root.querySelector('[data-new-color-code]');if(code)code.textContent=newColor.value.toUpperCase()});
      return true;
    }catch(error){console.warn('Could not load barista editor.',error);return false}
    finally{renderingProfiles=false}
  }

  async function saveBaristaProfile(button){
    const card=button.closest('[data-barista-profile]');if(!card)return;
    const id=card.dataset.baristaProfile;
    const name=card.querySelector('[data-profile-name]')?.value.trim();
    const bio=card.querySelector('[data-profile-bio]')?.value.trim()||'';
    const color=card.querySelector('[data-profile-color]')?.value;
    if(!name){window.toast?.('Barista name is required');return}
    button.disabled=true;button.textContent='Saving…';
    try{await api(`/api/admin/schedule/baristas/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify({name,bio,color})});window.toast?.('Barista updated');reloadSoon()}
    catch(error){button.disabled=false;button.textContent='Save changes';window.toast?.(error.message||'Could not update barista')}
  }

  async function addBaristaProfile(button){
    const card=button.closest('[data-barista-profile-add]');if(!card)return;
    const name=card.querySelector('[data-new-profile-name]')?.value.trim();
    const bio=card.querySelector('[data-new-profile-bio]')?.value.trim()||'';
    const color=card.querySelector('[data-new-profile-color]')?.value;
    if(!name){window.toast?.('Barista name is required');return}
    button.disabled=true;button.textContent='Adding…';
    try{await api('/api/admin/schedule/baristas',{method:'POST',body:JSON.stringify({name,bio,color})});window.toast?.('Barista added');reloadSoon()}
    catch(error){button.disabled=false;button.textContent='Add barista';window.toast?.(error.message||'Could not add barista')}
  }

  /* Capture before schedule-admin.js native confirm() handlers. */
  document.addEventListener('click',event=>{
    const deleteButton=event.target.closest?.('[data-delete-shift]');
    if(deleteButton){event.preventDefault();event.stopImmediatePropagation();deleteShift(deleteButton);return}

    const oldRemove=event.target.closest?.('[data-remove-barista]');
    if(oldRemove){event.preventDefault();event.stopImmediatePropagation();removeBarista(oldRemove.dataset.removeBarista,oldRemove);return}

    const profileRemove=event.target.closest?.('[data-remove-barista-profile]');
    if(profileRemove){event.preventDefault();event.stopImmediatePropagation();const card=profileRemove.closest('[data-barista-profile]');removeBarista(card?.dataset.baristaProfile,profileRemove);return}

    const saveProfile=event.target.closest?.('[data-save-barista-profile]');
    if(saveProfile){event.preventDefault();event.stopImmediatePropagation();saveBaristaProfile(saveProfile);return}

    const addProfile=event.target.closest?.('[data-add-barista-profile]');
    if(addProfile){event.preventDefault();event.stopImmediatePropagation();addBaristaProfile(addProfile);return}

    if(event.target.closest?.('#saveWeeklyHours,#saveDayHours,#useDefaultHours,#closeDay,[data-save-shift],#addShift')){
      [350,900,1800].forEach(delay=>setTimeout(()=>renderBaristaProfiles(false),delay));
    }
  },true);

  let attempts=0;
  const mountProfiles=()=>{
    attempts+=1;
    if(document.getElementById('baristaAdminList'))renderBaristaProfiles(true);
    else if(attempts<35)setTimeout(mountProfiles,120);
  };
  setTimeout(mountProfiles,0);

  /* Lightweight guard: native schedule re-renders can restore the old roster rows. */
  setInterval(()=>{
    const root=document.getElementById('baristaAdminList');
    if(root&&!root.querySelector('[data-barista-profile],[data-barista-profile-add]'))renderBaristaProfiles(true);
  },1800);

  let savedScroll=null;
  try{
    const keys=['ling-schedule-scroll-after-action','ling-schedule-scroll-after-remove'];
    for(const key of keys){const value=sessionStorage.getItem(key);if(value!==null){savedScroll=Number(value);sessionStorage.removeItem(key);break}}
  }catch(_){}
  if(Number.isFinite(savedScroll)){
    let tries=0;
    const restore=()=>{
      tries+=1;
      if(document.getElementById('adminScheduleEditor')||tries>20)window.scrollTo({top:savedScroll,behavior:'auto'});
      else setTimeout(restore,100);
    };
    setTimeout(restore,100);
  }
})();
