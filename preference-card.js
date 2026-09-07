(function(){
  if(window.__lingPreferenceCardInstalled) return;
  window.__lingPreferenceCardInstalled=true;
  const $=s=>document.querySelector(s);
  const options={temp:['Cold','Hot'],ice:['No ice','Less ice','Regular ice'],hot:['Warm','Hot'],strength:['Light','Normal','Extra'],milkType:['Dairy milk','Oat milk'],milk:['Less','Normal','More'],sweet:['No sugar','Less sugar','Regular sugar']};
  const read=()=>{try{return JSON.parse(localStorage.getItem('ling-glass-preference-draft')||'{}')}catch(_){return {}}};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const normalized=()=>Object.assign({temp:0,ice:1,hot:1,strength:1,milkType:0,milk:1,sweet:1},read());
  const second=p=>Number(p.temp)===1?options.hot[clamp(p.hot,0,1)]:options.ice[clamp(p.ice,0,2)];
  const summary=p=>[options.temp[clamp(p.temp,0,1)],second(p),`${options.strength[clamp(p.strength,0,2)]} coffee`,options.milkType[clamp(p.milkType,0,1)],`${options.milk[clamp(p.milk,0,2)]} milk`,options.sweet[clamp(p.sweet,0,2)]].join(' · ');

  function install(){
    const prefPage=$('#preference');
    const prefStack=$('.preference-stack');
    if(!prefPage||!prefStack){setTimeout(install,80);return}
    if($('#downloadPreferenceCard')) return;

    const hero=prefPage.querySelector('.preference-hero');
    if(hero){
      const title=hero.querySelector('h1');
      const copy=hero.querySelector('p');
      const back=hero.querySelector('[data-pref-page="menu"]');
      if(title) title.innerHTML='<em>Personal</em> <em>Preference</em>';
      if(copy) copy.textContent='Choose your drink preferences and save them as a structured preference card for easier communication with your barista.';
      if(back) back.textContent='← Back to menu';
    }

    const oldSummary=prefPage.querySelector('.preference-summary');
    if(oldSummary) oldSummary.remove();

    const style=document.createElement('style');
    style.id='ling-preference-card-styles';
    style.textContent=`
      .download-card-panel{border-radius:var(--radius-lg);padding:30px;margin-bottom:22px}
      .download-card-panel h2{font:400 36px/1 var(--serif);margin:8px 0 0;color:var(--text-strong);letter-spacing:-.03em}
      .download-card-layout{display:grid;grid-template-columns:minmax(0,520px) minmax(280px,1fr);gap:26px;align-items:center;margin-top:22px}
      .download-card-copy p{color:var(--muted);line-height:1.6;margin:12px 0 20px;max-width:520px}
      .download-card-btn{width:100%;min-height:60px}
      .preference-export-card{aspect-ratio:4/5;width:100%;max-width:520px;border-radius:38px;padding:24px;position:relative;overflow:hidden;color:#3e2417;background:radial-gradient(160px 160px at 18% 10%,rgba(255,255,255,.66),transparent 65%),radial-gradient(200px 180px at 88% 22%,rgba(10,186,181,.16),transparent 65%),linear-gradient(160deg,rgba(255,255,255,.42),rgba(255,255,255,.18));border:1px solid rgba(255,255,255,.58);box-shadow:0 24px 70px rgba(65,36,20,.18),inset 0 1px 0 rgba(255,255,255,.7);backdrop-filter:blur(28px) saturate(125%);-webkit-backdrop-filter:blur(28px) saturate(125%)}
      .preference-export-card:before{content:"";position:absolute;inset:0;background:linear-gradient(140deg,rgba(255,255,255,.24),transparent 30%,transparent 72%,rgba(255,255,255,.12)),linear-gradient(180deg,rgba(255,255,255,.10),transparent 30%);pointer-events:none}
      .preference-export-card:after{content:"";position:absolute;width:170px;height:170px;border-radius:50%;right:-36px;bottom:-26px;background:radial-gradient(circle at 35% 35%,rgba(18,198,191,.30),rgba(18,198,191,.10) 45%,transparent 70%);filter:blur(10px);pointer-events:none}
      .export-top,.export-main,.export-footer{position:relative;z-index:1}.export-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
      .export-brand h3{margin:0;font:400 28px/.95 var(--serif);letter-spacing:-.03em;color:#3e2417}.export-brand small{display:block;margin-top:8px;font-size:10px;letter-spacing:.22em;font-weight:700;color:rgba(62,36,23,.72)}
      .export-tag{min-height:38px;padding:0 14px;border-radius:999px;display:inline-flex;align-items:center;background:rgba(255,255,255,.34);border:1px solid rgba(255,255,255,.56);font-size:12px;font-weight:700;color:rgba(62,36,23,.86)}
      .export-main{margin-top:28px}.export-kicker{font-size:11px;letter-spacing:.18em;font-weight:700;text-transform:uppercase;color:rgba(7,143,139,.88)}.export-title{margin:10px 0 16px;font:400 54px/.92 var(--serif);letter-spacing:-.05em;color:#3e2417}
      .export-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.export-item{padding:14px 14px 15px;border-radius:20px;background:rgba(255,255,255,.24);border:1px solid rgba(255,255,255,.44)}.export-item small{display:block;font-size:10px;letter-spacing:.16em;font-weight:700;text-transform:uppercase;color:rgba(120,95,83,.92);margin-bottom:8px}.export-item strong{font-size:16px;color:#3e2417}
      .export-summary{margin-top:16px;padding:16px 18px;border-radius:22px;background:rgba(255,255,255,.28);border:1px solid rgba(255,255,255,.44)}.export-summary small{display:block;font-size:10px;letter-spacing:.16em;font-weight:700;text-transform:uppercase;color:rgba(120,95,83,.92);margin-bottom:8px}.export-summary p{margin:0;color:#3e2417;line-height:1.55;font-size:14px}
      .export-footer{position:absolute;left:24px;right:24px;bottom:22px;display:flex;justify-content:space-between;align-items:center;gap:14px}.export-enjoy{font-size:16px;font-weight:800;color:#3e2417}.export-dot{width:54px;height:54px;border-radius:50%;background:linear-gradient(180deg,rgba(18,198,191,.98),rgba(10,186,181,.86));box-shadow:0 12px 26px rgba(10,186,181,.20),inset 0 1px 0 rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.52)}
      #preferenceExportCanvas{display:none}
      @media(max-width:960px){.download-card-layout{grid-template-columns:1fr}.preference-export-card{justify-self:center}}
      @media(max-width:760px),(orientation:portrait){.download-card-panel{padding:20px 18px;border-radius:24px}.download-card-panel h2{font-size:31px}.download-card-layout{gap:18px}.export-title{font-size:44px}.export-grid{gap:9px}.export-item{padding:12px;border-radius:17px}.export-item strong{font-size:14px}.export-summary p{font-size:12px}.export-enjoy{font-size:15px}}
    `;
    document.head.appendChild(style);

    const panel=document.createElement('section');
    panel.className='glass download-card-panel';
    panel.innerHTML=`
      <div class="eyebrow">PREFERENCE CARD</div><h2>Your card</h2>
      <div class="download-card-layout">
        <div class="preference-export-card">
          <div class="export-top"><div class="export-brand"><h3>Ling Cafe</h3><small>YOUR DEFAULT CUP</small></div><div class="export-tag">Personal Preference</div></div>
          <div class="export-main"><div class="export-kicker">Saved style</div><div class="export-title">My usual</div>
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
        <div class="download-card-copy"><div class="eyebrow">DOWNLOAD</div><h2>Keep your usual.</h2><p>The card updates with your current selections. Download it as a PNG and keep it locally or share it.</p><button class="primary download-card-btn" id="downloadPreferenceCard">Download card as image <span>→</span></button></div>
      </div><canvas id="preferenceExportCanvas" width="1200" height="1500"></canvas>`;
    prefStack.after(panel);

    const refresh=()=>requestAnimationFrame(render);
    prefPage.addEventListener('input',refresh);
    prefPage.addEventListener('click',e=>{if(e.target.closest('.binary-choice'))setTimeout(render,0)});
    $('#downloadPreferenceCard').addEventListener('click',download);
    render();
  }

  function render(){
    const p=normalized(),hot=Number(p.temp)===1;
    $('#exportTemp').textContent=options.temp[p.temp];
    $('#exportSecondLabel').textContent=hot?'Heat':'Ice';
    $('#exportSecond').textContent=second(p);
    $('#exportStrength').textContent=options.strength[p.strength];
    $('#exportMilkType').textContent=options.milkType[p.milkType];
    $('#exportMilk').textContent=options.milk[p.milk];
    $('#exportSweet').textContent=options.sweet[p.sweet];
    $('#exportSummary').textContent=summary(p);
  }

  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  function wrap(c,text,x,y,max,lineH,maxLines){const words=String(text).split(' '),lines=[];let line='';for(const word of words){const t=line?line+' '+word:word;if(c.measureText(t).width>max&&line){lines.push(line);line=word}else line=t}if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>c.fillText(l,x,y+i*lineH))}
  function canvasCard(){
    const p=normalized(),c=$('#preferenceExportCanvas'),x=c.getContext('2d'),w=c.width,h=c.height; x.clearRect(0,0,w,h);
    let g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#f7efe4');g.addColorStop(.55,'#eadccd');g.addColorStop(1,'#dcc5b5');x.fillStyle=g;x.fillRect(0,0,w,h);
    let r=x.createRadialGradient(180,140,10,180,140,320);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=r;x.fillRect(0,0,w,h);r=x.createRadialGradient(w-100,220,20,w-100,220,280);r.addColorStop(0,'rgba(10,186,181,.22)');r.addColorStop(1,'rgba(10,186,181,0)');x.fillStyle=r;x.fillRect(0,0,w,h);
    const bx=70,by=70,bw=w-140,bh=h-140;rr(x,bx,by,bw,bh,64);x.fillStyle='rgba(255,255,255,.34)';x.fill();x.strokeStyle='rgba(255,255,255,.62)';x.lineWidth=2;x.stroke();
    x.fillStyle='#3e2417';x.font='400 54px Georgia';x.fillText('Ling Cafe',bx+44,by+74);x.fillStyle='rgba(62,36,23,.72)';x.font='700 18px sans-serif';x.fillText('YOUR DEFAULT CUP',bx+46,by+106);
    rr(x,bx+bw-280,by+34,220,56,28);x.fillStyle='rgba(255,255,255,.38)';x.fill();x.strokeStyle='rgba(255,255,255,.62)';x.stroke();x.fillStyle='rgba(62,36,23,.88)';x.font='700 22px sans-serif';x.fillText('Personal Preference',bx+bw-255,by+69);
    x.fillStyle='#078F8B';x.font='700 18px sans-serif';x.fillText('SAVED STYLE',bx+46,by+182);x.fillStyle='#3e2417';x.font='400 108px Georgia';x.fillText('My usual',bx+42,by+286);
    const items=[['Temperature',options.temp[p.temp]],[Number(p.temp)===1?'Heat':'Ice',second(p)],['Coffee',options.strength[p.strength]],['Milk type',options.milkType[p.milkType]],['Milk level',options.milk[p.milk]],['Sweetness',options.sweet[p.sweet]]],cw=(bw-102)/2,sy=by+340;
    items.forEach((it,i)=>{const col=i%2,row=Math.floor(i/2),ix=bx+44+col*(cw+14),iy=sy+row*118;rr(x,ix,iy,cw,100,30);x.fillStyle='rgba(255,255,255,.26)';x.fill();x.strokeStyle='rgba(255,255,255,.52)';x.stroke();x.fillStyle='rgba(120,95,83,.96)';x.font='700 16px sans-serif';x.fillText(it[0].toUpperCase(),ix+18,iy+28);x.fillStyle='#3e2417';x.font='700 30px sans-serif';wrap(x,it[1],ix+18,iy+66,cw-36,32,2)});
    const iy=by+718;rr(x,bx+44,iy,bw-88,132,34);x.fillStyle='rgba(255,255,255,.28)';x.fill();x.strokeStyle='rgba(255,255,255,.54)';x.stroke();x.fillStyle='rgba(120,95,83,.96)';x.font='700 16px sans-serif';x.fillText('SUMMARY',bx+64,iy+28);x.fillStyle='#3e2417';x.font='500 26px sans-serif';wrap(x,summary(p),bx+64,iy+66,bw-128,36,3);
    x.fillStyle='#3e2417';x.font='800 28px sans-serif';x.fillText('Enjoy Your Cup!✨',bx+44,by+bh-28);g=x.createLinearGradient(bx+bw-112,by+bh-92,bx+bw-72,by+bh-32);g.addColorStop(0,'rgba(18,198,191,.98)');g.addColorStop(1,'rgba(10,186,181,.86)');x.beginPath();x.arc(bx+bw-70,by+bh-48,30,0,Math.PI*2);x.fillStyle=g;x.fill();x.strokeStyle='rgba(255,255,255,.62)';x.lineWidth=2;x.stroke();return c;
  }
  function download(){const c=canvasCard(),a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='ling-cafe-preference-card.png';document.body.appendChild(a);a.click();a.remove();if(window.toast)window.toast('Preference card downloaded')}
  install();
})();
