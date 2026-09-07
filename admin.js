(function(){
  if(window.__lingAdminInstalled) return;
  window.__lingAdminInstalled=true;

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  let authenticated=false;
  let currentAdmin='';

  function installStyles(){
    if($('#ling-admin-styles')) return;
    const style=document.createElement('style');
    style.id='ling-admin-styles';
    style.textContent=`
      #menu .reserve{display:none!important}
      #menu .menu-layout{display:block!important}
      #menu .menu-main{width:100%!important}
      #more .more-nav{grid-template-columns:repeat(3,1fr)!important}

      .drink-category{font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent-deep);font-weight:800;margin:0 0 7px}

      .header-actions{display:none!important}
      body.admin-authenticated .header-actions{display:flex!important;margin-left:0}
      .admin-view-switch{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border:1px solid var(--line-soft);border-radius:999px;background:rgba(255,255,255,.10);min-width:150px}
      .admin-view-choice{border:0;background:transparent;color:var(--muted);height:38px;padding:0 14px;border-radius:999px;font-weight:700;cursor:pointer}
      .admin-view-choice.active{background:rgba(255,255,255,.34);color:var(--text-strong);box-shadow:inset 0 1px 0 rgba(255,255,255,.4)}
      body[data-admin-preview="user"] .admin-only{display:none!important}

      .admin-warning{margin:18px 0;padding:16px 18px;border:1px solid rgba(10,186,181,.26);border-radius:18px;background:rgba(10,186,181,.09);line-height:1.55;color:var(--muted)}
      .admin-warning strong{color:var(--text-strong)}
      .admin-auth-status{min-height:20px;margin-top:12px;font-size:12px;color:var(--muted)}
      .admin-auth-status.error{color:#b65047}
      .admin-session{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border:1px solid var(--line);border-radius:18px;background:var(--glass-soft);margin:18px 0}
      .admin-session small{display:block;margin-top:4px;color:var(--muted)}
      .admin-logout{border:1px solid var(--line);background:rgba(255,255,255,.08);color:var(--text-strong);border-radius:999px;padding:10px 14px;cursor:pointer;font-weight:700}
      .admin-scope{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0 24px}
      .admin-scope-card{padding:18px;border:1px solid var(--line);border-radius:20px;background:var(--glass-soft)}
      .admin-scope-card strong{display:block;margin-bottom:7px;color:var(--text-strong)}
      .admin-scope-card span{display:block;color:var(--muted);font-size:12px;line-height:1.55}
      .admin-scope-card.pending{opacity:.64}

      .admin-menu-header{display:flex;align-items:end;justify-content:space-between;gap:18px;margin:28px 0 14px}
      .admin-menu-header h3{font:400 34px/1 var(--serif);margin:7px 0 0;color:var(--text-strong)}
      .admin-menu-note{font-size:11px;color:var(--muted);max-width:450px;text-align:right;line-height:1.5}
      .admin-menu-list{display:grid;gap:12px}
      .admin-menu-item{display:grid;grid-template-columns:120px minmax(0,1fr);gap:16px;padding:16px;border:1px solid var(--line);border-radius:22px;background:var(--glass-soft)}
      .admin-menu-image{width:120px;height:120px;border-radius:17px;background-size:cover;background-position:center;border:1px solid var(--line);overflow:hidden}
      .admin-image-label{margin-top:8px;color:var(--muted);font-size:10px;line-height:1.45}
      .admin-menu-fields{display:grid;grid-template-columns:1fr 1fr .62fr;gap:10px;align-items:end}
      .admin-menu-fields label{margin:0}
      .admin-field-wide{grid-column:1/3}
      .admin-check-row{grid-column:1/-1;display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:2px}
      .admin-check{display:inline-flex!important;align-items:center;gap:9px!important;margin:0!important;color:var(--muted);font-size:12px;font-weight:700;cursor:pointer;width:auto!important}
      .admin-check input{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;margin:0}
      .admin-check::before{content:"";width:28px;height:28px;min-width:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line-soft);background:rgba(255,255,255,.40);box-shadow:inset 0 1px 0 rgba(255,255,255,.5);color:white;font:800 18px/1 var(--sans)}
      .admin-check:has(input:checked)::before{content:"✓";background:var(--accent);border-color:rgba(10,186,181,.72)}
      .admin-check:has(input:disabled){opacity:.38;cursor:not-allowed}
      .admin-item-actions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
      .admin-item-actions button{min-height:44px;border-radius:999px;padding:0 15px;font-weight:700;cursor:pointer}
      .admin-save-item{border:0;background:var(--accent);color:#063b39;flex:1}
      .admin-copy-prompt{border:1px solid var(--line);background:rgba(255,255,255,.10);color:var(--text-strong)}
      .admin-delete-item{border:1px solid rgba(182,80,71,.25);background:rgba(182,80,71,.08);color:#a34a43}

      .admin-add-card{margin:0 0 16px;padding:18px;border:1px solid rgba(10,186,181,.28);border-radius:22px;background:rgba(10,186,181,.06)}
      .admin-add-card h4{margin:7px 0 14px;font:400 27px/1 var(--serif);color:var(--text-strong)}
      .admin-add-grid{display:grid;grid-template-columns:1fr 1fr .6fr;gap:10px;align-items:end}
      .admin-add-grid label{margin:0}
      .admin-add-desc{grid-column:1/3}
      .admin-add-actions{grid-column:1/-1;display:flex;gap:9px;flex-wrap:wrap;margin-top:4px}
      .admin-add-actions button{min-height:48px;border-radius:999px;padding:0 18px;font-weight:800;cursor:pointer}
      .admin-add-button{border:0;background:var(--accent);color:#063b39;flex:1}
      .admin-secondary{border:1px solid var(--line);background:rgba(255,255,255,.10);color:var(--text-strong)}
      .admin-image-workflow{margin-top:14px;padding:13px 15px;border:1px solid var(--line-soft);border-radius:16px;color:var(--muted);font-size:11px;line-height:1.55;background:rgba(255,255,255,.06)}
      .admin-image-workflow strong{color:var(--text-strong)}
      .admin-preview-hint{margin-top:14px;color:var(--muted);font-size:11px;line-height:1.5}

      @media(max-width:760px),(orientation:portrait){
        body.admin-authenticated .header-actions{display:flex!important;margin-left:auto}
        .admin-view-switch{min-width:132px}
        .admin-view-choice{height:34px;padding:0 10px;font-size:11px}
        .admin-scope{grid-template-columns:1fr}
        .admin-menu-header{display:block}
        .admin-menu-note{text-align:left;margin-top:8px}
        .admin-menu-item{grid-template-columns:82px minmax(0,1fr);gap:12px;padding:13px}
        .admin-menu-image{width:82px;height:82px;border-radius:14px}
        .admin-menu-fields,.admin-add-grid{grid-template-columns:1fr 1fr;gap:9px}
        .admin-menu-fields label[data-full],.admin-field-wide,.admin-add-grid label[data-full],.admin-add-desc{grid-column:1/-1!important}
        .admin-menu-fields label[data-amount],.admin-add-grid label[data-amount]{grid-column:1}
        .admin-item-actions button,.admin-add-actions button{flex:1 1 140px}
      }
    `;
    document.head.appendChild(style);
  }

  function simplifyUserUI(){
    $('#menu .reserve')?.remove();
    const menuHero=$('#menu .page-hero');
    if(menuHero){
      const eyebrow=menuHero.querySelector('.eyebrow');
      const copy=menuHero.querySelector('p');
      if(eyebrow) eyebrow.textContent='MENU';
      if(copy) copy.textContent='Choose from today’s menu by category. The amount shown is a suggested donation, not a price.';
    }

    const more=$('#more');
    if(!more) return;
    const hero=more.querySelector('.page-hero');
    if(hero){
      const eyebrow=hero.querySelector('.eyebrow');
      const copy=hero.querySelector('p');
      if(eyebrow) eyebrow.textContent='SETTINGS / FEEDBACK / ADMIN';
      if(copy) copy.textContent='Appearance, feedback, and barista admin tools live here.';
    }
    more.querySelector('[data-panel="profile"]')?.remove();
    $('#panel-profile')?.remove();
    const accessBtn=more.querySelector('[data-panel="access"]');
    if(accessBtn) accessBtn.textContent='Admin Tools';
    const settingsBtn=more.querySelector('[data-panel="settings"]');
    const settingsPanel=$('#panel-settings');
    more.querySelectorAll('.more-nav-btn').forEach(b=>b.classList.remove('active'));
    more.querySelectorAll('.more-panel').forEach(p=>p.classList.remove('active'));
    settingsBtn?.classList.add('active');
    settingsPanel?.classList.add('active');
  }

  async function requestJson(path,options={}){
    const headers={...(options.headers||{})};
    if(options.body && !headers['Content-Type']) headers['Content-Type']='application/json';
    const response=await fetch(path,{credentials:'same-origin',...options,headers});
    let body={};
    try{body=await response.json()}catch(_){}
    if(!response.ok) throw new Error(body.error||`Request failed (${response.status})`);
    return body;
  }

  function replaceMenu(items){
    if(!Array.isArray(items)) return;
    menu.splice(0,menu.length,...items.map(item=>({
      id:Number(item.id),
      cat:String(item.cat||'Other'),
      name:String(item.name||''),
      desc:String(item.desc||''),
      amount:Number(item.amount)||0,
      available:Boolean(item.available),
      popular:Boolean(item.popular),
      image:String(item.image||'/menu-placeholder.svg')
    })));
    if(state.filter!=='All' && !menu.some(item=>item.cat===state.filter)) state.filter='All';
    renderFilters();renderMenu();renderHome();
    annotateMenuCards();
  }

  async function refreshMenuFromServer(showError=false){
    try{
      const data=await requestJson('/api/menu',{method:'GET'});
      replaceMenu(data.items||[]);
      if(authenticated) renderMenuEditor();
      return true;
    }catch(err){
      if(showError) toast(err.message);
      return false;
    }
  }

  function annotateMenuCards(){
    $$('.drink-card').forEach(card=>{
      const id=Number(card.querySelector('[data-add]')?.dataset.add);
      const item=menu.find(entry=>Number(entry.id)===id);
      const copy=card.querySelector('.drink-copy');
      const title=copy?.querySelector('h3');
      if(!item||!copy||!title) return;
      let label=copy.querySelector('.drink-category');
      if(!label){label=document.createElement('div');label.className='drink-category';copy.insertBefore(label,title)}
      label.textContent=item.cat;
    });
  }

  function watchMenuRendering(){
    const observer=new MutationObserver(()=>annotateMenuCards());
    const menuRoot=$('#menuGrid'),homeRoot=$('#homeDrinks');
    if(menuRoot) observer.observe(menuRoot,{childList:true,subtree:true});
    if(homeRoot) observer.observe(homeRoot,{childList:true,subtree:true});
  }

  function imagePrompt(item){
    return `Create a realistic premium café product photo for the menu of Ling Cafe.\n\nSubject: ${item.name||'[PRODUCT_NAME]'}\nCategory: ${item.cat||'[CATEGORY]'}\nOptional details: ${item.desc||'[OPTIONAL_DETAIL]'}\n\nStyle requirements:\n- warm, soft, natural café lighting\n- clean, refined, cozy atmosphere\n- elegant editorial food photography\n- realistic product photo, not illustration\n- soft shadows and slightly diffused light\n- shallow depth of field\n- warm neutral tones matching Ling Cafe's glass / liquid-glass website\n- minimal composition with one clear hero item\n- no people, hands, text, logo, watermark, collage, or busy background\n\nComposition requirements:\n- square-friendly composition\n- product large and clearly visible\n- centered or slightly off-center balanced composition\n- suitable for direct use in a menu card\n\nCategory-specific guidance:\n- Coffee / Milk / Non-coffee: use an attractive cup or glass appropriate for the beverage\n- Food: use a clean plate, tray, or café table setting\n\nOutput: photorealistic, high quality, visually consistent with the existing Ling Cafe menu images.`;
  }

  async function copyText(text){
    try{
      await navigator.clipboard.writeText(text);
    }catch(_){
      const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
    }
    toast('GPT image prompt copied');
  }

  function buildAdminPanel(){
    const panel=$('#panel-access');
    if(!panel) return;
    panel.innerHTML=`
      <div class="eyebrow">BARISTA ONLY</div>
      <h2>Admin Tools</h2>
      <div class="admin-warning"><strong>This area is for Ling Cafe baristas.</strong> Regular users can ignore it. Menu edits here are stored on the Cloudflare backend and are shared across devices.</div>

      <div id="adminLoggedOut">
        <div class="auth-box glass-soft">
          <label><span>Username</span><input id="adminUsername" autocomplete="username" placeholder="Username"></label>
          <label><span>Password</span><input id="adminPassword" type="password" autocomplete="current-password" placeholder="Password"></label>
          <button id="adminLogin" class="primary full">Sign in <span>→</span></button>
          <div id="adminAuthStatus" class="admin-auth-status">Authentication is handled by the Cloudflare Worker.</div>
        </div>
      </div>

      <div id="adminLoggedIn" class="hidden admin-only">
        <div class="admin-session"><div><strong id="adminSessionName">Signed in</strong><small>Use the header switch to preview the public User view.</small></div><button id="adminLogout" class="admin-logout">Log out</button></div>
        <div class="admin-scope">
          <div class="admin-scope-card"><strong>Menu</strong><span>Full backend CRUD: add, edit and delete items. Category, name, note, donation, availability and Popular status are editable. Images are GPT-managed and locked here.</span></div>
          <div class="admin-scope-card pending"><strong>Schedule</strong><span>Schedule editing remains reserved for the next iteration; its shift logic will be defined separately.</span></div>
        </div>
        <div id="adminMenuEditor"></div>
      </div>`;

    $('#adminLogin')?.addEventListener('click',login);
    $('#adminPassword')?.addEventListener('keydown',e=>{if(e.key==='Enter')login()});
    $('#adminLogout')?.addEventListener('click',logout);
  }

  function itemFromRow(row){
    return {
      id:Number(row.dataset.adminItem),
      cat:row.querySelector('[data-admin-field="cat"]')?.value.trim()||'',
      name:row.querySelector('[data-admin-field="name"]')?.value.trim()||'',
      desc:row.querySelector('[data-admin-field="desc"]')?.value.trim()||'',
      amount:Number(row.querySelector('[data-admin-field="amount"]')?.value)||0,
      available:Boolean(row.querySelector('[data-admin-field="available"]')?.checked),
      popular:Boolean(row.querySelector('[data-admin-field="popular"]')?.checked)
    };
  }

  function newItemDraft(){
    return {
      cat:$('#newItemCategory')?.value.trim()||'',
      name:$('#newItemName')?.value.trim()||'',
      desc:$('#newItemDesc')?.value.trim()||'',
      amount:Number($('#newItemAmount')?.value)||0,
      available:Boolean($('#newItemAvailable')?.checked),
      popular:Boolean($('#newItemPopular')?.checked)
    };
  }

  function renderMenuEditor(){
    const root=$('#adminMenuEditor');
    if(!root||!authenticated) return;
    root.innerHTML=`
      <div class="admin-menu-header">
        <div><div class="eyebrow">MENU BACKEND</div><h3>Menu items</h3></div>
        <div class="admin-menu-note">Changes are persistent and public immediately. Popular drinks are capped at four on both the UI and server.</div>
      </div>

      <section class="admin-add-card">
        <div class="eyebrow">ADD ITEM</div><h4>New menu item</h4>
        <div class="admin-add-grid">
          <label data-full><span>Category</span><input id="newItemCategory" placeholder="Espresso / Milk / Food"></label>
          <label data-full><span>Name</span><input id="newItemName" placeholder="Product name"></label>
          <label class="admin-add-desc"><span>Short note</span><input id="newItemDesc" placeholder="Short product description"></label>
          <label data-amount><span>Donation ¥</span><input id="newItemAmount" type="number" min="0" step="1" value="0"></label>
          <div class="admin-check-row">
            <label class="admin-check"><input id="newItemAvailable" type="checkbox" checked> Available today</label>
            <label class="admin-check"><input id="newItemPopular" type="checkbox" data-popular-control> Popular</label>
          </div>
          <div class="admin-add-actions">
            <button id="addAdminItem" class="admin-add-button">Add item <span>→</span></button>
            <button id="copyNewItemPrompt" class="admin-secondary">Copy GPT image prompt</button>
          </div>
        </div>
        <div class="admin-image-workflow"><strong>Image workflow:</strong> Admin Tools do not edit images. A new item receives a temporary Ling Cafe placeholder. Copy the GPT prompt, generate the product image in the established style, then ask GPT to install the finished image for that menu item.</div>
      </section>

      <div class="admin-menu-list">
        ${menu.map(item=>`
          <article class="admin-menu-item" data-admin-item="${item.id}">
            <div>
              <div class="admin-menu-image" data-admin-image="${item.id}"></div>
              <div class="admin-image-label">Image locked · GPT-managed</div>
            </div>
            <div class="admin-menu-fields">
              <label data-full><span>Category</span><input data-admin-field="cat" value="${esc(item.cat)}"></label>
              <label data-full><span>Name</span><input data-admin-field="name" value="${esc(item.name)}"></label>
              <label class="admin-field-wide"><span>Short note</span><input data-admin-field="desc" value="${esc(item.desc)}"></label>
              <label data-amount><span>Donation ¥</span><input data-admin-field="amount" type="number" min="0" step="1" value="${Number(item.amount)}"></label>
              <div class="admin-check-row">
                <label class="admin-check"><input data-admin-field="available" type="checkbox" ${item.available?'checked':''}> Available today</label>
                <label class="admin-check"><input data-admin-field="popular" data-popular-control type="checkbox" ${item.popular?'checked':''}> Popular</label>
              </div>
              <div class="admin-item-actions">
                <button class="admin-save-item" data-save-item="${item.id}">Save changes</button>
                <button class="admin-copy-prompt" data-copy-item-prompt="${item.id}">Copy GPT image prompt</button>
                <button class="admin-delete-item" data-delete-item="${item.id}">Delete</button>
              </div>
            </div>
          </article>`).join('')}
      </div>
      <div class="admin-preview-hint">The User / Admin switch in the top-right header lets a signed-in barista inspect the public-facing result without logging out.</div>`;

    menu.forEach(item=>{
      const image=root.querySelector(`[data-admin-image="${item.id}"]`);
      if(image) image.style.backgroundImage=`url("${String(item.image||'/menu-placeholder.svg').replace(/"/g,'%22')}")`;
    });

    $('#addAdminItem')?.addEventListener('click',addItem);
    $('#copyNewItemPrompt')?.addEventListener('click',()=>copyText(imagePrompt(newItemDraft())));
    $$('[data-save-item]').forEach(btn=>btn.addEventListener('click',()=>saveItem(Number(btn.dataset.saveItem))));
    $$('[data-delete-item]').forEach(btn=>btn.addEventListener('click',()=>deleteItem(Number(btn.dataset.deleteItem))));
    $$('[data-copy-item-prompt]').forEach(btn=>btn.addEventListener('click',()=>{
      const item=menu.find(entry=>Number(entry.id)===Number(btn.dataset.copyItemPrompt));
      if(item) copyText(imagePrompt(item));
    }));
    $$('[data-popular-control]').forEach(box=>box.addEventListener('change',onPopularChange));
    syncPopularControls();
  }

  function syncPopularControls(){
    const controls=$$('[data-popular-control]');
    const checked=controls.filter(box=>box.checked);
    const atLimit=checked.length>=4;
    controls.forEach(box=>{box.disabled=atLimit&&!box.checked;});
  }

  function onPopularChange(event){
    const controls=$$('[data-popular-control]');
    if(controls.filter(box=>box.checked).length>4){
      event.target.checked=false;
      toast('Popular drinks are limited to four');
    }
    syncPopularControls();
  }

  async function addItem(){
    const draft=newItemDraft();
    if(!draft.cat||!draft.name){toast('Category and name are required');return}
    const btn=$('#addAdminItem');if(btn){btn.disabled=true;btn.textContent='Adding…'}
    try{
      const data=await requestJson('/api/admin/menu',{method:'POST',body:JSON.stringify(draft)});
      replaceMenu(data.items||[]);
      renderMenuEditor();
      toast('Menu item added');
    }catch(err){toast(err.message)}finally{if(btn){btn.disabled=false;btn.innerHTML='Add item <span>→</span>'}}
  }

  async function saveItem(id){
    const row=$(`[data-admin-item="${id}"]`);
    if(!row) return;
    const draft=itemFromRow(row);
    if(!draft.cat||!draft.name){toast('Category and name are required');return}
    const btn=row.querySelector('[data-save-item]');if(btn){btn.disabled=true;btn.textContent='Saving…'}
    try{
      const data=await requestJson(`/api/admin/menu/${id}`,{method:'PUT',body:JSON.stringify(draft)});
      replaceMenu(data.items||[]);
      renderMenuEditor();
      toast('Menu item saved');
    }catch(err){toast(err.message)}finally{if(btn){btn.disabled=false;btn.textContent='Save changes'}}
  }

  async function deleteItem(id){
    const item=menu.find(entry=>Number(entry.id)===id);
    if(!item) return;
    if(!window.confirm(`Delete ${item.name} from the menu?`)) return;
    try{
      const data=await requestJson(`/api/admin/menu/${id}`,{method:'DELETE'});
      replaceMenu(data.items||[]);
      renderMenuEditor();
      toast('Menu item deleted');
    }catch(err){toast(err.message)}
  }

  function installHeaderSwitch(){
    const actions=$('.header-actions');
    if(!actions) return;
    actions.innerHTML=`<div class="admin-view-switch" aria-label="Preview mode"><button class="admin-view-choice active" data-admin-view="admin">Admin</button><button class="admin-view-choice" data-admin-view="user">User</button></div>`;
    actions.querySelectorAll('[data-admin-view]').forEach(btn=>btn.addEventListener('click',()=>setPreview(btn.dataset.adminView)));
  }

  function clearHeaderSwitch(){
    const actions=$('.header-actions');
    if(actions) actions.innerHTML='';
  }

  function setPreview(mode){
    document.body.dataset.adminPreview=mode;
    $$('[data-admin-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.adminView===mode));
    if(mode==='user'){
      setPage('home');toast('User preview');
    }else{
      setPage('more');
      const accessBtn=$('#more [data-panel="access"]');
      const accessPanel=$('#panel-access');
      $('#more')?.querySelectorAll('.more-nav-btn').forEach(b=>b.classList.remove('active'));
      $('#more')?.querySelectorAll('.more-panel').forEach(p=>p.classList.remove('active'));
      accessBtn?.classList.add('active');accessPanel?.classList.add('active');toast('Admin view');
    }
  }

  function setAuthenticated(ok,name=''){
    authenticated=ok;currentAdmin=name;
    document.body.classList.toggle('admin-authenticated',ok);
    $('#adminLoggedOut')?.classList.toggle('hidden',ok);
    $('#adminLoggedIn')?.classList.toggle('hidden',!ok);
    if(ok){
      const label=$('#adminSessionName');if(label) label.textContent=`Signed in as ${name}`;
      installHeaderSwitch();renderMenuEditor();setPreview('admin');
    }else{
      clearHeaderSwitch();document.body.dataset.adminPreview='user';
    }
  }

  async function checkSession(){
    try{
      const data=await requestJson('/api/admin/session',{method:'GET'});
      if(data.authenticated) setAuthenticated(true,data.username||'Admin');
    }catch(_){setAuthenticated(false)}
  }

  async function login(){
    const username=$('#adminUsername')?.value.trim()||'';
    const password=$('#adminPassword')?.value||'';
    const status=$('#adminAuthStatus');
    if(!username||!password){if(status){status.textContent='Enter both username and password.';status.classList.add('error')}return}
    const btn=$('#adminLogin');if(btn){btn.disabled=true;btn.textContent='Signing in…'}
    if(status){status.classList.remove('error');status.textContent='Checking credentials…'}
    try{
      const data=await requestJson('/api/admin/login',{method:'POST',body:JSON.stringify({username,password})});
      if(status) status.textContent='Signed in.';
      if($('#adminPassword')) $('#adminPassword').value='';
      setAuthenticated(true,data.username||username);
    }catch(err){
      if(status){status.textContent=err.message;status.classList.add('error')}
    }finally{if(btn){btn.disabled=false;btn.innerHTML='Sign in <span>→</span>'}}
  }

  async function logout(){
    try{await requestJson('/api/admin/logout',{method:'POST',body:'{}'})}catch(_){}
    setAuthenticated(false);
    const settingsBtn=$('#more [data-panel="settings"]');const settingsPanel=$('#panel-settings');
    $('#more')?.querySelectorAll('.more-nav-btn').forEach(b=>b.classList.remove('active'));
    $('#more')?.querySelectorAll('.more-panel').forEach(p=>p.classList.remove('active'));
    settingsBtn?.classList.add('active');settingsPanel?.classList.add('active');toast('Signed out');
  }

  installStyles();
  simplifyUserUI();
  buildAdminPanel();
  annotateMenuCards();
  watchMenuRendering();
  clearHeaderSwitch();
  refreshMenuFromServer();
  checkSession();
})();
