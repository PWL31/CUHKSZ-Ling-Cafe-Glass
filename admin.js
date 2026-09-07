(function(){
  if(window.__lingAdminInstalled) return;
  window.__lingAdminInstalled=true;

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const MENU_STORAGE='ling-admin-menu-draft';
  const baseMenu=menu.map(item=>({...item}));
  let authenticated=false;
  let currentAdmin='';

  function readDraft(){
    try{return JSON.parse(localStorage.getItem(MENU_STORAGE)||'null')}catch(_){return null}
  }

  function applyDraft(){
    const draft=readDraft();
    if(!Array.isArray(draft)) return;
    draft.forEach(saved=>{
      const target=menu.find(item=>Number(item.id)===Number(saved.id));
      if(!target) return;
      target.name=String(saved.name||target.name);
      target.desc=String(saved.desc||'');
      target.amount=Math.max(0,Number(saved.amount)||0);
      target.image=String(saved.image||target.image);
      target.popular=Boolean(saved.popular);
    });
    renderMenu();renderHome();
  }

  function installStyles(){
    if($('#ling-admin-styles')) return;
    const style=document.createElement('style');
    style.id='ling-admin-styles';
    style.textContent=`
      /* User-facing simplification */
      #menu .reserve{display:none!important}
      #menu .menu-layout{display:block!important}
      #menu .menu-main{width:100%!important}
      #more .more-nav{grid-template-columns:repeat(3,1fr)!important}

      /* Header has no user capsule. It becomes an admin preview switch only after authentication. */
      .header-actions{display:none!important}
      body.admin-authenticated .header-actions{display:flex!important;margin-left:0}
      .admin-view-switch{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border:1px solid var(--line-soft);border-radius:999px;background:rgba(255,255,255,.10);min-width:150px}
      .admin-view-choice{border:0;background:transparent;color:var(--muted);height:38px;padding:0 14px;border-radius:999px;font-weight:700;cursor:pointer}
      .admin-view-choice.active{background:rgba(255,255,255,.34);color:var(--text-strong);box-shadow:inset 0 1px 0 rgba(255,255,255,.4)}

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
      .admin-menu-note{font-size:11px;color:var(--muted);max-width:420px;text-align:right;line-height:1.5}
      .admin-menu-list{display:grid;gap:12px}
      .admin-menu-item{display:grid;grid-template-columns:120px minmax(0,1fr);gap:16px;padding:16px;border:1px solid var(--line);border-radius:22px;background:var(--glass-soft)}
      .admin-menu-image{width:120px;height:120px;border-radius:17px;background-size:cover;background-position:center;border:1px solid var(--line);overflow:hidden}
      .admin-menu-fields{display:grid;grid-template-columns:1.1fr 1.5fr .55fr;gap:10px;align-items:end}
      .admin-menu-fields label{margin:0}
      .admin-menu-photo{grid-column:1/3}
      .admin-popular-toggle{grid-column:3;display:flex;align-items:center;justify-content:center;gap:8px;min-height:45px;border:1px solid var(--line-soft);border-radius:14px;background:var(--field);font-size:11px;color:var(--muted);padding:0 10px}
      .admin-popular-toggle input{width:auto;margin:0;accent-color:var(--accent)}
      .admin-category{font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent-deep);font-weight:800;margin-bottom:8px}
      .admin-actions{display:flex;gap:10px;margin-top:16px}
      .admin-actions button{flex:1}
      .admin-reset{min-height:54px;border:1px solid var(--line);background:rgba(255,255,255,.08);color:var(--text-strong);border-radius:999px;font-weight:700;cursor:pointer}
      .admin-preview-hint{margin-top:12px;color:var(--muted);font-size:11px;line-height:1.5}
      body[data-admin-preview="user"] .admin-only{display:none!important}

      @media(max-width:760px),(orientation:portrait){
        #more .more-nav{grid-template-columns:repeat(3,1fr)!important}
        body.admin-authenticated .header-actions{display:flex!important;margin-left:auto}
        .admin-view-switch{min-width:132px}
        .admin-view-choice{height:34px;padding:0 10px;font-size:11px}
        .admin-scope{grid-template-columns:1fr}
        .admin-menu-header{display:block}
        .admin-menu-note{text-align:left;margin-top:8px}
        .admin-menu-item{grid-template-columns:82px minmax(0,1fr);gap:12px;padding:13px}
        .admin-menu-image{width:82px;height:82px;border-radius:14px}
        .admin-menu-fields{grid-template-columns:1fr 1fr;gap:9px}
        .admin-menu-fields label:nth-of-type(1),.admin-menu-fields label:nth-of-type(2){grid-column:1/-1}
        .admin-menu-fields label:nth-of-type(3){grid-column:1}
        .admin-menu-photo{grid-column:1/-1!important}
        .admin-popular-toggle{grid-column:2;grid-row:auto}
      }
    `;
    document.head.appendChild(style);
  }

  function simplifyUserUI(){
    const reserve=$('#menu .reserve');
    if(reserve) reserve.remove();
    const menuHero=$('#menu .page-hero');
    if(menuHero){
      const eyebrow=menuHero.querySelector('.eyebrow');
      const copy=menuHero.querySelector('p');
      if(eyebrow) eyebrow.textContent='MENU';
      if(copy) copy.textContent='Choose a drink from today’s menu. The amount shown is a suggested donation, not a price.';
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

    const profileBtn=more.querySelector('[data-panel="profile"]');
    const profilePanel=$('#panel-profile');
    if(profileBtn) profileBtn.remove();
    if(profilePanel) profilePanel.remove();

    const settingsBtn=more.querySelector('[data-panel="settings"]');
    const settingsPanel=$('#panel-settings');
    const accessBtn=more.querySelector('[data-panel="access"]');
    if(accessBtn) accessBtn.textContent='Admin Tools';
    more.querySelectorAll('.more-nav-btn').forEach(b=>b.classList.remove('active'));
    more.querySelectorAll('.more-panel').forEach(p=>p.classList.remove('active'));
    if(settingsBtn) settingsBtn.classList.add('active');
    if(settingsPanel) settingsPanel.classList.add('active');
  }

  function buildAdminPanel(){
    const panel=$('#panel-access');
    if(!panel) return;
    panel.innerHTML=`
      <div class="eyebrow">BARISTA ONLY</div>
      <h2>Admin Tools</h2>
      <div class="admin-warning"><strong>This area is for Ling Cafe baristas.</strong> Regular users can ignore this section. Staff can sign in to edit café-facing content and preview the normal user experience.</div>

      <div id="adminLoggedOut">
        <div class="auth-box glass-soft">
          <label><span>Username</span><input id="adminUsername" autocomplete="username" placeholder="Username"></label>
          <label><span>Password</span><input id="adminPassword" type="password" autocomplete="current-password" placeholder="Password"></label>
          <button id="adminLogin" class="primary full">Sign in <span>→</span></button>
          <div id="adminAuthStatus" class="admin-auth-status">Authentication is handled by the Cloudflare backend.</div>
        </div>
      </div>

      <div id="adminLoggedIn" class="hidden admin-only">
        <div class="admin-session"><div><strong id="adminSessionName">Signed in</strong><small>Admin preview is available from the header.</small></div><button id="adminLogout" class="admin-logout">Log out</button></div>
        <div class="admin-scope">
          <div class="admin-scope-card"><strong>Menu</strong><span>Edit item name, short note, suggested donation, photo, and whether it appears in Home → Popular drinks.</span></div>
          <div class="admin-scope-card pending"><strong>Schedule</strong><span>Schedule editing is reserved for the next iteration; we will define its shift logic separately.</span></div>
        </div>
        <div id="adminMenuEditor"></div>
      </div>
    `;

    $('#adminLogin')?.addEventListener('click',login);
    $('#adminPassword')?.addEventListener('keydown',e=>{if(e.key==='Enter')login()});
    $('#adminLogout')?.addEventListener('click',logout);
  }

  function renderMenuEditor(){
    const root=$('#adminMenuEditor');
    if(!root) return;
    root.innerHTML=`
      <div class="admin-menu-header">
        <div><div class="eyebrow">MENU EDITOR</div><h3>Menu items</h3></div>
        <div class="admin-menu-note">Select up to four items for Popular drinks. Changes are saved locally in this prototype and immediately appear in User preview.</div>
      </div>
      <div class="admin-menu-list">
        ${menu.map(item=>`
          <article class="admin-menu-item" data-admin-item="${item.id}">
            <div><div class="admin-category">${esc(item.cat)}</div><div class="admin-menu-image" data-admin-image-preview style="background-image:url('${item.image}')"></div></div>
            <div class="admin-menu-fields">
              <label><span>Name</span><input data-admin-field="name" value="${esc(item.name)}"></label>
              <label><span>Short note</span><input data-admin-field="desc" value="${esc(item.desc)}"></label>
              <label><span>Donation ¥</span><input data-admin-field="amount" type="number" min="0" step="1" value="${Number(item.amount)}"></label>
              <label class="admin-menu-photo"><span>Photo URL</span><input data-admin-field="image" type="url" value="${esc(item.image)}"></label>
              <label class="admin-popular-toggle"><input data-admin-field="popular" type="checkbox" ${item.popular?'checked':''}> Popular</label>
            </div>
          </article>`).join('')}
      </div>
      <div class="admin-actions"><button id="saveAdminMenu" class="primary">Save menu changes</button><button id="resetAdminMenu" class="admin-reset">Reset local edits</button></div>
      <div class="admin-preview-hint">Use the User / Admin switch in the top-right header after signing in. User mode hides admin controls so you can inspect the public-facing result.</div>
    `;
    $$('[data-admin-field="image"]').forEach(input=>input.addEventListener('input',()=>{
      const card=input.closest('[data-admin-item]');
      const preview=card?.querySelector('[data-admin-image-preview]');
      if(preview) preview.style.backgroundImage=`url('${input.value.trim()}')`;
    }));
    $('#saveAdminMenu')?.addEventListener('click',saveMenuEdits);
    $('#resetAdminMenu')?.addEventListener('click',resetMenuEdits);
  }

  function saveMenuEdits(){
    const rows=$$('[data-admin-item]');
    const next=rows.map(row=>{
      const id=Number(row.dataset.adminItem);
      return {
        id,
        name:row.querySelector('[data-admin-field="name"]').value.trim(),
        desc:row.querySelector('[data-admin-field="desc"]').value.trim(),
        amount:Number(row.querySelector('[data-admin-field="amount"]').value)||0,
        image:row.querySelector('[data-admin-field="image"]').value.trim(),
        popular:row.querySelector('[data-admin-field="popular"]').checked
      };
    });
    if(next.filter(item=>item.popular).length>4){
      toast('Choose at most four Popular drinks');
      return;
    }
    next.forEach(saved=>{
      const target=menu.find(item=>item.id===saved.id);
      if(target) Object.assign(target,saved);
    });
    localStorage.setItem(MENU_STORAGE,JSON.stringify(next));
    renderFilters();renderMenu();renderHome();
    toast('Menu preview updated');
  }

  function resetMenuEdits(){
    localStorage.removeItem(MENU_STORAGE);
    baseMenu.forEach(original=>{
      const target=menu.find(item=>item.id===original.id);
      if(target) Object.assign(target,original);
    });
    renderFilters();renderMenu();renderHome();renderMenuEditor();
    toast('Local menu edits reset');
  }

  function installHeaderSwitch(){
    const actions=$('.header-actions');
    if(!actions) return;
    actions.innerHTML=`<div class="admin-view-switch" aria-label="Preview mode"><button class="admin-view-choice active" data-admin-view="admin">Admin</button><button class="admin-view-choice" data-admin-view="user">User</button></div>`;
    $$('[data-admin-view]').forEach(btn=>btn.addEventListener('click',()=>setPreview(btn.dataset.adminView)));
  }

  function clearHeaderSwitch(){
    const actions=$('.header-actions');
    if(actions) actions.innerHTML='';
  }

  function setPreview(mode){
    document.body.dataset.adminPreview=mode;
    $$('[data-admin-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.adminView===mode));
    if(mode==='user'){
      setPage('home');
      toast('User preview');
    }else{
      setPage('more');
      const accessBtn=$('#more [data-panel="access"]');
      const accessPanel=$('#panel-access');
      $('#more').querySelectorAll('.more-nav-btn').forEach(b=>b.classList.remove('active'));
      $('#more').querySelectorAll('.more-panel').forEach(p=>p.classList.remove('active'));
      accessBtn?.classList.add('active');accessPanel?.classList.add('active');
      toast('Admin view');
    }
  }

  function setAuthenticated(ok,name=''){
    authenticated=ok;
    currentAdmin=name;
    document.body.classList.toggle('admin-authenticated',ok);
    const out=$('#adminLoggedOut'),inside=$('#adminLoggedIn');
    if(out) out.classList.toggle('hidden',ok);
    if(inside) inside.classList.toggle('hidden',!ok);
    if(ok){
      const label=$('#adminSessionName');if(label) label.textContent=`Signed in as ${name}`;
      installHeaderSwitch();
      renderMenuEditor();
      setPreview('admin');
    }else{
      clearHeaderSwitch();
      document.body.dataset.adminPreview='user';
    }
  }

  async function requestJson(path,options={}){
    const response=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
    let body={};
    try{body=await response.json()}catch(_){}
    if(!response.ok) throw new Error(body.error||`Request failed (${response.status})`);
    return body;
  }

  async function checkSession(){
    try{
      const data=await requestJson('/api/admin/session',{method:'GET',headers:{}});
      if(data.authenticated) setAuthenticated(true,data.username||'Admin');
    }catch(_){
      setAuthenticated(false);
    }
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
      if(status){status.textContent=err.message.includes('404')?'Admin backend is not active on this deployment yet.':err.message;status.classList.add('error')}
    }finally{
      if(btn){btn.disabled=false;btn.innerHTML='Sign in <span>→</span>'}
    }
  }

  async function logout(){
    try{await requestJson('/api/admin/logout',{method:'POST',body:'{}'})}catch(_){}
    setAuthenticated(false);
    const settingsBtn=$('#more [data-panel="settings"]');const settingsPanel=$('#panel-settings');
    $('#more').querySelectorAll('.more-nav-btn').forEach(b=>b.classList.remove('active'));
    $('#more').querySelectorAll('.more-panel').forEach(p=>p.classList.remove('active'));
    settingsBtn?.classList.add('active');settingsPanel?.classList.add('active');
    toast('Signed out');
  }

  installStyles();
  simplifyUserUI();
  buildAdminPanel();
  applyDraft();
  clearHeaderSwitch();
  checkSession();
})();
