(function(){
  if(window.__lingPreferenceInstalled) return;
  window.__lingPreferenceInstalled=true;

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];

  const defaults={temp:0,ice:1,hot:1,strength:1,milkType:0,milk:1,sweet:1,cream:0};
  const options={
    temp:['Cold','Hot'],
    ice:['No ice','Less ice','Regular ice'],
    hot:['Warm','Hot'],
    strength:['Light','Normal','Extra'],
    milkType:['Dairy milk','Oat milk'],
    milk:['Less','Normal','More'],
    sweet:['No sugar','Less sugar','Regular sugar'],
    cream:['No','Yes']
  };

  function readJSON(key,fallback){
    try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}
  }

  const pref={...defaults,...readJSON('ling-glass-preference-draft',{})};
  let saved=readJSON('ling-glass-preference-card',null);

  function installStyles(){
    if(document.getElementById('ling-preference-styles')) return;
    const style=document.createElement('style');
    style.id='ling-preference-styles';
    style.textContent=`
      .preference-hero h1 em{font-style:italic;font-weight:400}
      .preference-stack{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-bottom:22px}
      .preference-card{border-radius:var(--radius-lg);padding:28px;min-width:0}
      .preference-card.wide{grid-column:1/-1}
      .preference-card .section-head{margin-bottom:20px}
      .preference-card .section-head h2,.preference-summary h2{font:400 36px/1 var(--serif);margin:8px 0 0;color:var(--text-strong);letter-spacing:-.03em}
      .value-chip{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border:1px solid rgba(10,186,181,.42);border-radius:999px;background:rgba(10,186,181,.16);font-size:15px;font-weight:800;color:var(--accent-deep);white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,.28)}
      html[data-theme="dark"] .value-chip{color:#76e4df;background:rgba(10,186,181,.15);border-color:rgba(118,228,223,.34)}
      .binary-select{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:5px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.09);box-shadow:inset 0 1px 0 rgba(255,255,255,.14)}
      .binary-choice{border:0;border-radius:999px;min-height:50px;padding:0 18px;background:transparent;color:var(--muted);cursor:pointer;font:700 14px/1 var(--sans);transition:background .18s ease,color .18s ease,transform .18s ease}
      .binary-choice.active{background:var(--accent);color:#073a38;box-shadow:0 9px 24px rgba(10,186,181,.18),inset 0 1px 0 rgba(255,255,255,.38)}
      .binary-choice:active{transform:scale(.985)}
      .slider-wrap{position:relative;padding:10px 2px 2px}
      .pref-slider{position:relative;z-index:2;width:100%;height:36px;margin:0;appearance:none;-webkit-appearance:none;background:transparent;cursor:pointer}
      .pref-slider::-webkit-slider-runnable-track{height:10px;border-radius:999px;background:var(--track);border:1px solid var(--line-soft)}
      .pref-slider::-moz-range-track{height:10px;border-radius:999px;background:var(--track);border:1px solid var(--line-soft)}
      .pref-slider::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:28px;height:28px;border-radius:50%;margin-top:-10px;background:var(--accent);border:5px solid rgba(255,255,255,.82);box-shadow:0 5px 16px rgba(7,143,139,.24)}
      .pref-slider::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:var(--accent);border:5px solid rgba(255,255,255,.82);box-shadow:0 5px 16px rgba(7,143,139,.24)}
      .detents{position:absolute;left:15px;right:15px;top:25px;z-index:1;display:flex;justify-content:space-between;pointer-events:none}
      .detents span{width:6px;height:6px;border-radius:50%;background:rgba(71,39,28,.32);box-shadow:0 0 0 3px rgba(255,255,255,.10)}
      html[data-theme="dark"] .detents span{background:rgba(255,255,255,.38)}
      .secondary-binary{display:none}
      .secondary-binary.active{display:grid}
      .secondary-slider.hidden-control{display:none}
      .milk-controls{display:grid;grid-template-columns:1fr 1fr;gap:18px}
      .sub-control{padding-top:4px}.sub-control+.sub-control{border-left:1px solid var(--line-soft);padding-left:18px}
      .sub-control-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;font-weight:700}
      .preference-summary{border-radius:var(--radius-lg);padding:30px;margin-bottom:22px}
      .preference-summary-line{font:400 30px/1.2 var(--serif);color:var(--text-strong);margin:16px 0 22px;max-width:1000px}
      .save-preference-btn{width:100%;min-height:62px}
      .saved-preference-card{margin-top:18px;padding:22px;border-radius:22px;border:1px solid var(--line);background:var(--glass-soft);box-shadow:inset 0 1px 0 rgba(255,255,255,.16)}
      .saved-preference-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
      .saved-preference-card h3{font:400 30px/1 var(--serif);margin:7px 0 10px;color:var(--text-strong)}
      .saved-preference-card p{margin:0;color:var(--muted);line-height:1.55}
      .saved-badge{font-size:10px;letter-spacing:.15em;font-weight:700;color:var(--accent-deep);text-transform:uppercase}
      .saved-preference-top .value-chip{min-height:36px;padding:0 12px;font-size:12px}
      @media(max-width:760px),(orientation:portrait){
        .preference-stack{grid-template-columns:1fr;gap:14px;margin-bottom:14px}
        .preference-card,.preference-summary{padding:20px 18px;border-radius:24px}
        .preference-card.wide{grid-column:auto}
        .preference-card .section-head h2,.preference-summary h2{font-size:31px}
        .preference-card .section-head{align-items:center}
        .value-chip{min-height:40px;padding:0 13px;font-size:14px}
        .binary-choice{min-height:48px;font-size:13px}
        .milk-controls{grid-template-columns:1fr;gap:16px}
        .sub-control+.sub-control{border-left:0;border-top:1px solid var(--line-soft);padding-left:0;padding-top:16px}
        .preference-summary-line{font-size:25px;margin:14px 0 18px}
        .save-preference-btn{min-height:58px}
      }
    `;
    document.head.appendChild(style);
  }

  function installPage(){
    if(document.getElementById('preference')) return;
    const schedule=document.getElementById('schedule');
    if(!schedule) return;
    const page=document.createElement('section');
    page.className='page';
    page.id='preference';
    page.innerHTML=`
      <div class="page-hero glass preference-hero">
        <div>
          <div class="eyebrow">YOUR DEFAULT CUP</div>
          <h1>Personal <em>Preference</em></h1>
          <p>Set the way you usually like your drinks. Sliders snap to a small set of preset levels.</p>
        </div>
        <button class="text-link" data-pref-page="menu">Back to menu →</button>
      </div>
      <div class="preference-stack">
        <section class="glass preference-card">
          <div class="section-head"><div><div class="eyebrow">TEMPERATURE</div><h2>Drink temperature</h2></div></div>
          <div class="binary-select" id="prefTempChoices">
            <button class="binary-choice" type="button" data-pref-temp="0">Cold</button>
            <button class="binary-choice" type="button" data-pref-temp="1">Hot</button>
          </div>
        </section>
        <section class="glass preference-card">
          <div class="section-head">
            <div><div class="eyebrow" id="prefSecondaryEyebrow">ICE</div><h2 id="prefSecondaryTitle">Ice level</h2></div>
            <div class="value-chip" id="prefSecondaryValue">Less ice</div>
          </div>
          <div class="slider-wrap secondary-slider" id="prefSecondarySliderWrap">
            <input class="pref-slider" id="prefSecondary" type="range" min="0" max="2" step="1" value="1">
            <div class="detents" id="prefSecondaryDetents"><span></span><span></span><span></span></div>
          </div>
          <div class="binary-select secondary-binary" id="prefHotChoices">
            <button class="binary-choice" type="button" data-pref-hot="0">Warm</button>
            <button class="binary-choice" type="button" data-pref-hot="1">Hot</button>
          </div>
        </section>
        <section class="glass preference-card">
          <div class="section-head"><div><div class="eyebrow">COFFEE STRENGTH</div><h2>How bold?</h2></div><div class="value-chip" id="prefStrengthValue">Normal</div></div>
          <div class="slider-wrap"><input class="pref-slider" id="prefStrength" type="range" min="0" max="2" step="1" value="1"><div class="detents"><span></span><span></span><span></span></div></div>
        </section>
        <section class="glass preference-card">
          <div class="section-head"><div><div class="eyebrow">SWEETNESS</div><h2>Sweetness</h2></div><div class="value-chip" id="prefSweetValue">Less sugar</div></div>
          <div class="slider-wrap"><input class="pref-slider" id="prefSweet" type="range" min="0" max="2" step="1" value="1"><div class="detents"><span></span><span></span><span></span></div></div>
        </section>
        <section class="glass preference-card wide">
          <div class="section-head"><div><div class="eyebrow">MILK</div><h2>Milk preference</h2></div></div>
          <div class="milk-controls">
            <div class="sub-control">
              <div class="sub-control-head"><span>Milk type</span></div>
              <div class="binary-select" id="prefMilkTypeChoices">
                <button class="binary-choice" type="button" data-pref-milk-type="0">Dairy milk</button>
                <button class="binary-choice" type="button" data-pref-milk-type="1">Oat milk</button>
              </div>
            </div>
            <div class="sub-control">
              <div class="sub-control-head"><span>Milk level</span><div class="value-chip" id="prefMilkValue">Normal</div></div>
              <div class="slider-wrap"><input class="pref-slider" id="prefMilk" type="range" min="0" max="2" step="1" value="1"><div class="detents"><span></span><span></span><span></span></div></div>
            </div>
          </div>
        </section>
        <section class="glass preference-card wide">
          <div class="section-head"><div><div class="eyebrow">TOPPING</div><h2>Whipped cream</h2></div></div>
          <div class="binary-select" id="prefCreamChoices">
            <button class="binary-choice" type="button" data-pref-cream="0">No</button>
            <button class="binary-choice" type="button" data-pref-cream="1">Yes</button>
          </div>
        </section>
      </div>
      <section class="glass preference-summary">
        <div class="eyebrow">CURRENT DEFAULT</div><h2>Your usual</h2>
        <div class="preference-summary-line" id="preferenceSummaryLine"></div>
        <button class="primary save-preference-btn" id="savePreferenceCard">Save as preference card <span>→</span></button>
        <div class="saved-preference-card hidden" id="savedPreferenceCard">
          <div class="saved-preference-top"><div><div class="saved-badge">SAVED PREFERENCE</div><h3>My usual</h3></div><span class="value-chip">Default</span></div>
          <p id="savedPreferenceText"></p>
        </div>
      </section>`;
    schedule.before(page);
  }

  function gotoPage(id){
    if(typeof window.setPage==='function') window.setPage(id);
    else{
      $$('.page').forEach(p=>p.classList.toggle('active',p.id===id));
      window.scrollTo({top:0,behavior:'smooth'});
    }
    const navPage=id==='preference'?'menu':id;
    $$('.nav-item,.mobile-nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===navPage));
  }

  function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  function summary(p=pref){
    const second=Number(p.temp)===1?options.hot[clamp(Number(p.hot),0,1)]:options.ice[clamp(Number(p.ice),0,2)];
    const cream=Number(p.cream)===1?'Whipped cream':'No whipped cream';
    return [options.temp[clamp(Number(p.temp),0,1)],second,`${options.strength[clamp(Number(p.strength),0,2)]} coffee`,options.milkType[clamp(Number(p.milkType),0,1)],`${options.milk[clamp(Number(p.milk),0,2)]} milk`,options.sweet[clamp(Number(p.sweet),0,2)],cream].join(' · ');
  }
  function persistDraft(){localStorage.setItem('ling-glass-preference-draft',JSON.stringify(pref))}
  function renderBinary(selector,activeValue){
    $$(selector).forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.prefTemp ?? btn.dataset.prefHot ?? btn.dataset.prefMilkType ?? btn.dataset.prefCream)===Number(activeValue)));
  }

  function render(){
    const hot=Number(pref.temp)===1;
    renderBinary('[data-pref-temp]',pref.temp);
    renderBinary('[data-pref-milk-type]',pref.milkType);
    renderBinary('[data-pref-hot]',pref.hot);
    renderBinary('[data-pref-cream]',pref.cream);
    $('#prefStrength').value=pref.strength;$('#prefStrengthValue').textContent=options.strength[pref.strength];
    $('#prefMilk').value=pref.milk;$('#prefMilkValue').textContent=options.milk[pref.milk];
    $('#prefSweet').value=pref.sweet;$('#prefSweetValue').textContent=options.sweet[pref.sweet];
    const secondary=$('#prefSecondary'),dots=$('#prefSecondaryDetents'),sliderWrap=$('#prefSecondarySliderWrap'),hotChoices=$('#prefHotChoices'),secondaryValue=$('#prefSecondaryValue');
    if(hot){
      $('#prefSecondaryEyebrow').textContent='HEAT';$('#prefSecondaryTitle').textContent='How hot?';
      sliderWrap.classList.add('hidden-control');hotChoices.classList.add('active');secondaryValue.style.display='none';
    }else{
      $('#prefSecondaryEyebrow').textContent='ICE';$('#prefSecondaryTitle').textContent='Ice level';
      sliderWrap.classList.remove('hidden-control');hotChoices.classList.remove('active');secondary.max='2';secondary.value=pref.ice;dots.innerHTML='<span></span><span></span><span></span>';secondaryValue.style.display='inline-flex';secondaryValue.textContent=options.ice[pref.ice];
    }
    $('#preferenceSummaryLine').textContent=summary();
    const card=$('#savedPreferenceCard');
    if(saved){card.classList.remove('hidden');$('#savedPreferenceText').textContent=saved.summary||summary(saved);$('#savePreferenceCard').innerHTML='Update preference card <span>→</span>'}
    else{card.classList.add('hidden');$('#savePreferenceCard').innerHTML='Save as preference card <span>→</span>'}
  }

  function bind(){
    const cta=document.querySelector('.preference-cta');
    if(cta){cta.dataset.page='preference';cta.addEventListener('click',()=>requestAnimationFrame(()=>{$$('.nav-item,.mobile-nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page==='menu'))}))}
    document.querySelectorAll('[data-pref-page]').forEach(btn=>btn.addEventListener('click',()=>gotoPage(btn.dataset.prefPage)));
    $$('[data-pref-temp]').forEach(btn=>btn.addEventListener('click',()=>{pref.temp=Number(btn.dataset.prefTemp);persistDraft();render()}));
    $$('[data-pref-hot]').forEach(btn=>btn.addEventListener('click',()=>{pref.hot=Number(btn.dataset.prefHot);persistDraft();render()}));
    $$('[data-pref-milk-type]').forEach(btn=>btn.addEventListener('click',()=>{pref.milkType=Number(btn.dataset.prefMilkType);persistDraft();render()}));
    $$('[data-pref-cream]').forEach(btn=>btn.addEventListener('click',()=>{pref.cream=Number(btn.dataset.prefCream);persistDraft();render()}));
    $('#prefSecondary').addEventListener('input',e=>{pref.ice=Number(e.target.value);persistDraft();render()});
    $('#prefStrength').addEventListener('input',e=>{pref.strength=Number(e.target.value);persistDraft();render()});
    $('#prefMilk').addEventListener('input',e=>{pref.milk=Number(e.target.value);persistDraft();render()});
    $('#prefSweet').addEventListener('input',e=>{pref.sweet=Number(e.target.value);persistDraft();render()});
    $('#savePreferenceCard').addEventListener('click',()=>{saved={...pref,summary:summary(),savedAt:new Date().toISOString()};localStorage.setItem('ling-glass-preference-card',JSON.stringify(saved));render();if(typeof window.toast==='function')window.toast('Preference card saved')});
  }

  installStyles();installPage();render();bind();
})();