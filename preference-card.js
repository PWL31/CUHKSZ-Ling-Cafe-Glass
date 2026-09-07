(function(){
  if(window.__lingPreferenceCardInstalled) return;
  window.__lingPreferenceCardInstalled=true;

  const $=s=>document.querySelector(s);
  const options={
    temp:['Cold','Hot'],
    ice:['No ice','Less ice','Regular ice'],
    hot:['Warm','Hot'],
    strength:['Light','Normal','Extra'],
    milkType:['Dairy milk','Oat milk'],
    milk:['Less','Normal','More'],
    sweet:['No sugar','Less sugar','Regular sugar']
  };
  const read=()=>{try{return JSON.parse(localStorage.getItem('ling-glass-preference-draft')||'{}')}catch(_){return {}}};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const pref=()=>Object.assign({temp:0,ice:1,hot:1,strength:1,milkType:0,milk:1,sweet:1},read());
  const second=p=>Number(p.temp)===1?options.hot[clamp(p.hot,0,1)]:options.ice[clamp(p.ice,0,2)];
  const summary=p=>[
    options.temp[clamp(p.temp,0,1)],
    second(p),
    `${options.strength[clamp(p.strength,0,2)]} coffee`,
    options.milkType[clamp(p.milkType,0,1)],
    `${options.milk[clamp(p.milk,0,2)]} milk`,
    options.sweet[clamp(p.sweet,0,2)]
  ].join(' · ');

  function loadHtml2Canvas(){
    if(window.html2canvas) return Promise.resolve(window.html2canvas);
    if(window.__lingH2C) return window.__lingH2C;
    window.__lingH2C=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.async=true;
      s.onload=()=>window.html2canvas?resolve(window.html2canvas):reject(new Error('html2canvas unavailable'));
      s.onerror=()=>reject(new Error('Could not load html2canvas'));
      document.head.appendChild(s);
    });
    return window.__lingH2C;
  }

  function install(){
    const page=$('#preference'),stack=$('.preference-stack');
    if(!page||!stack){setTimeout(install,80);return}
    if($('#downloadPreferenceCard')) return;

    const hero=page.querySelector('.preference-hero');
    if(hero){
      const h=hero.querySelector('h1');
      const p=hero.querySelector('p');
      const back=hero.querySelector('[data-pref-page="menu"]');
      if(h) h.innerHTML='<em>Personal</em> <em>Preference</em>';
      if(p) p.textContent='Choose your drink preferences and save them as a structured preference card for easier communication with your barista.';
      if(back) back.textContent='← Back to menu';
    }
    page.querySelector('.preference-summary')?.remove();

    const style=document.createElement('style');
    style.id='ling-preference-card-styles';
    style.textContent=`
      .download-card-panel{border-radius:var(--radius-lg);padding:30px;margin-bottom:22px}
      .download-card-panel h2{font:400 36px/1 var(--serif);margin:8px 0 0;color:var(--text-strong);letter-spacing:-.03em}
      .download-card-layout{display:grid;grid-template-columns:minmax(0,520px) minmax(280px,1fr);gap:26px;align-items:center;margin-top:22px}
      .download-card-copy p{color:var(--muted);line-height:1.6;margin:12px 0 20px;max-width:520px}
      .download-card-btn{width:100%;min-height:60px}

      .preference-export-card{
        width:100%;max-width:520px;border-radius:38px;padding:24px;position:relative;overflow:hidden;color:#3e2417;
        display:flex;flex-direction:column;
        background:
          radial-gradient(160px 160px at 18% 10%,rgba(255,255,255,.66),transparent 65%),
          radial-gradient(200px 180px at 88% 22%,rgba(10,186,181,.16),transparent 65%),
          linear-gradient(160deg,rgba(255,255,255,.42),rgba(255,255,255,.18));
        border:1px solid rgba(255,255,255,.58);
        box-shadow:0 24px 70px rgba(65,36,20,.18),inset 0 1px 0 rgba(255,255,255,.7);
        backdrop-filter:blur(28px) saturate(125%);
        -webkit-backdrop-filter:blur(28px) saturate(125%);
      }
      .preference-export-card:before{
        content:"";position:absolute;inset:0;
        background:linear-gradient(140deg,rgba(255,255,255,.24),transparent 30%,transparent 72%,rgba(255,255,255,.12)),linear-gradient(180deg,rgba(255,255,255,.10),transparent 30%);
        pointer-events:none
      }
      .preference-export-card:after{
        content:"";position:absolute;width:170px;height:170px;border-radius:50%;right:-36px;bottom:-26px;
        background:radial-gradient(circle at 35% 35%,rgba(18,198,191,.30),rgba(18,198,191,.10) 45%,transparent 70%);
        filter:blur(10px);pointer-events:none
      }
      .export-top,.export-main,.export-footer{position:relative;z-index:1}
      .export-top{display:flex;align-items:center;justify-content:space-between;gap:18px}
      .export-brand h3{margin:0;font:400 30px/.95 var(--serif);letter-spacing:-.03em;color:#3e2417}
      .export-tag{min-height:38px;padding:0 14px;border-radius:999px;display:inline-flex;align-items:center;background:rgba(255,255,255,.34);border:1px solid rgba(255,255,255,.56);font-size:12px;font-weight:700;color:rgba(62,36,23,.86)}
      .export-main{margin-top:34px}
      .export-kicker{font-size:11px;letter-spacing:.18em;font-weight:700;text-transform:uppercase;color:rgba(7,143,139,.88)}
      .export-title{margin:10px 0 18px;font:400 54px/.92 var(--serif);letter-spacing:-.05em;color:#3e2417}
      .export-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .export-item{padding:14px 14px 15px;border-radius:20px;background:rgba(255,255,255,.24);border:1px solid rgba(255,255,255,.44)}
      .export-item small{display:block;font-size:10px;letter-spacing:.16em;font-weight:700;text-transform:uppercase;color:rgba(120,95,83,.92);margin-bottom:8px}
      .export-item strong{font-size:16px;color:#3e2417}
      .export-summary{margin-top:16px;padding:16px 18px;border-radius:22px;background:rgba(255,255,255,.28);border:1px solid rgba(255,255,255,.44)}
      .export-summary small{display:block;font-size:10px;letter-spacing:.16em;font-weight:700;text-transform:uppercase;color:rgba(120,95,83,.92);margin-bottom:8px}
      .export-summary p{margin:0;color:#3e2417;line-height:1.55;font-size:14px}
      .export-footer{margin-top:18px;padding-top:18px;border-top:1px solid rgba(120,95,83,.14);display:flex;justify-content:space-between;align-items:center;gap:14px}
      .export-enjoy{font-size:16px;font-weight:800;color:#3e2417}
      .export-dot{width:48px;height:48px;flex:0 0 48px;border-radius:50%;background:linear-gradient(180deg,rgba(18,198,191,.98),rgba(10,186,181,.86));box-shadow:0 12px 26px rgba(10,186,181,.20),inset 0 1px 0 rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.52)}

      /* Export-only flattening: this class is added only inside html2canvas' cloned DOM.
         The live webpage keeps the original liquid-glass styling above. */
      .preference-export-card.export-capture-mode,
      .preference-export-card.export-capture-mode *{
        backdrop-filter:none!important;
        -webkit-backdrop-filter:none!important;
        filter:none!important;
        text-shadow:none!important;
      }
      .preference-export-card.export-capture-mode{
        background:linear-gradient(155deg,#faf6f1 0%,#f3ece5 58%,#dcefeb 100%)!important;
        border-color:#fffaf6!important;
        box-shadow:none!important;
      }
      .preference-export-card.export-capture-mode:before,
      .preference-export-card.export-capture-mode:after{
        display:none!important;
        content:none!important;
      }
      .preference-export-card.export-capture-mode .export-tag{
        background:#f6f3ef!important;
        border-color:#ffffff!important;
        box-shadow:none!important;
      }
      .preference-export-card.export-capture-mode .export-item,
      .preference-export-card.export-capture-mode .export-summary{
        background:#f8f4ef!important;
        border-color:#ffffff!important;
        box-shadow:none!important;
      }
      .preference-export-card.export-capture-mode .export-dot{
        background:#0abab5!important;
        border-color:#bcebe8!important;
        box-shadow:none!important;
      }
      .preference-export-card.export-capture-mode .export-footer{
        border-top-color:#ded4cc!important;
      }

      @media(max-width:960px){
        .download-card-layout{grid-template-columns:1fr}
        .preference-export-card{justify-self:center}
      }
      @media(max-width:760px),(orientation:portrait){
        .download-card-panel{padding:20px 18px;border-radius:24px;margin-bottom:calc(130px + env(safe-area-inset-bottom))}
        .download-card-panel h2{font-size:31px}
        .download-card-layout{gap:20px}
        .preference-export-card{padding:20px;border-radius:30px}
        .export-top{gap:12px}
        .export-brand h3{font-size:27px}
        .export-tag{min-height:34px;padding:0 12px;font-size:11px}
        .export-main{margin-top:28px}
        .export-title{font-size:44px;margin-bottom:16px}
        .export-grid{gap:10px}
        .export-item{padding:13px 12px;border-radius:17px;min-height:88px}
        .export-item small{font-size:9px;margin-bottom:7px}
        .export-item strong{font-size:14px;line-height:1.2}
        .export-summary{margin-top:12px;padding:14px 15px}
        .export-summary p{font-size:12px;line-height:1.45}
        .export-footer{margin-top:16px;padding-top:15px}
        .export-enjoy{font-size:15px}
        .export-dot{width:42px;height:42px;flex-basis:42px}
        .download-card-copy{padding-bottom:8px}
      }
    `;
    document.head.appendChild(style);

    const panel=document.createElement('section');
    panel.className='glass download-card-panel';
    panel.innerHTML=`
      <div class="eyebrow">PREFERENCE CARD</div>
      <h2>Your card</h2>
      <div class="download-card-layout">
        <div class="preference-export-card" id="preferenceExportCard">
          <div class="export-top">
            <div class="export-brand"><h3>Ling Cafe</h3></div>
            <div class="export-tag">Personal Preference</div>
          </div>
          <div class="export-main">
            <div class="export-kicker">Saved style</div>
            <div class="export-title">My usual</div>
            <div class="export-grid">
              <div class="export-item"><small>Temperature</small><strong id="exportTemp"></strong></div>
              <div class="export-item"><small id="exportSecondLabel"></small><strong id="exportSecond"></strong></div>
              <div class="export-item"><small>Coffee</small><strong id="exportStrength"></strong></div>
              <div class="export-item"><small>Milk type</small><strong id="exportMilkType"></strong></div>
              <div class="export-item"><small>Milk level</small><strong id="exportMilk"></strong></div>
              <div class="export-item"><small>Sweetness</small><strong id="exportSweet"></strong></div>
            </div>
            <div class="export-summary"><small>Summary</small><p id="exportSummary"></p></div>
          </div>
          <div class="export-footer"><div class="export-enjoy">Enjoy Your Cup!✨</div><div class="export-dot"></div></div>
        </div>
        <div class="download-card-copy">
          <div class="eyebrow">DOWNLOAD</div>
          <h2>Keep your usual.</h2>
          <p>The saved image keeps the same layout while using a flattened export surface to avoid browser glass-rendering artifacts.</p>
          <button class="primary download-card-btn" id="downloadPreferenceCard">Save card to phone <span>→</span></button>
        </div>
      </div>`;
    stack.after(panel);

    const refresh=()=>requestAnimationFrame(render);
    page.addEventListener('input',refresh);
    page.addEventListener('click',e=>{if(e.target.closest('.binary-choice'))setTimeout(render,0)});
    $('#downloadPreferenceCard').addEventListener('click',download);
    render();
  }

  function render(){
    const p=pref(),hot=Number(p.temp)===1;
    $('#exportTemp').textContent=options.temp[p.temp];
    $('#exportSecondLabel').textContent=hot?'Heat':'Ice';
    $('#exportSecond').textContent=second(p);
    $('#exportStrength').textContent=options.strength[p.strength];
    $('#exportMilkType').textContent=options.milkType[p.milkType];
    $('#exportMilk').textContent=options.milk[p.milk];
    $('#exportSweet').textContent=options.sweet[p.sweet];
    $('#exportSummary').textContent=summary(p);
  }

  async function exportBlob(){
    const card=$('#preferenceExportCard');
    if(!card) throw new Error('Preference card not found');
    if(document.fonts?.ready){try{await document.fonts.ready}catch(_){}}

    const html2canvas=await loadHtml2Canvas();
    const rect=card.getBoundingClientRect();
    const canvas=await html2canvas(card,{
      backgroundColor:'#efe7df',
      scale:2,
      useCORS:true,
      allowTaint:false,
      logging:false,
      width:Math.ceil(rect.width),
      height:Math.ceil(rect.height),
      windowWidth:document.documentElement.clientWidth,
      windowHeight:document.documentElement.clientHeight,
      scrollX:-window.scrollX,
      scrollY:-window.scrollY,
      onclone:clonedDocument=>{
        const clonedCard=clonedDocument.querySelector('#preferenceExportCard');
        if(!clonedCard) return;
        clonedCard.classList.add('export-capture-mode');
        clonedCard.querySelectorAll('*').forEach(node=>{
          node.style.webkitBackdropFilter='none';
          node.style.backdropFilter='none';
          node.style.filter='none';
        });
      }
    });

    return new Promise((resolve,reject)=>{
      canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG conversion failed')),'image/png',1);
    });
  }

  function fallback(blob){
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='ling-cafe-preference-card.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  async function download(){
    const b=$('#downloadPreferenceCard');
    const old=b.innerHTML;
    b.disabled=true;
    b.textContent='Preparing image…';
    try{
      const blob=await exportBlob();
      const file=new File([blob],'ling-cafe-preference-card.png',{type:'image/png'});
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
        try{
          await navigator.share({files:[file],title:'Ling Cafe Preference Card'});
          if(window.toast) window.toast('Preference card ready to save');
          return;
        }catch(e){
          if(e?.name==='AbortError') return;
        }
      }
      fallback(blob);
      if(window.toast) window.toast('Preference card downloaded');
    }catch(e){
      console.error(e);
      if(window.toast) window.toast('Could not export card');
    }finally{
      b.disabled=false;
      b.innerHTML=old;
    }
  }

  install();
})();
