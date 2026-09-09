(function(){
  if(window.__lingSupportStationInstalled) return;
  window.__lingSupportStationInstalled=true;

  const DONATE_URL='https://alumni-sys.cuhk.edu.cn/donate-h5/#/subject-detail?id=37';
  const LANGUAGE_KEY='ling-glass-language';

  const styles=document.createElement('style');
  styles.id='ling-support-station-styles';
  styles.textContent=`
    /* Home hero uses a Deep Teal palette in light mode so it harmonizes with Tiffany-blue accents. Dark mode stays unchanged. */
    html[data-theme="light"] #home .hero-copy h1{
      color:#164E4B;
      text-shadow:none;
    }
    html[data-theme="light"] #home .hero-copy .lead{
      color:#4F6966;
      font-weight:500;
      text-shadow:none;
    }

    .support-station{
      position:relative;
      display:grid;
      grid-template-columns:74px minmax(0,1fr);
      gap:34px;
      padding:38px 42px 42px;
      margin-bottom:22px;
      border-radius:var(--radius-lg);
      overflow:hidden;
    }
    .support-rail{
      display:flex;
      align-items:flex-start;
      justify-content:center;
      padding-top:4px;
    }
    .support-rail span{
      writing-mode:vertical-rl;
      transform:rotate(180deg);
      color:var(--accent-deep);
      font:700 12px/1 var(--sans);
      letter-spacing:.28em;
      text-transform:uppercase;
      white-space:nowrap;
    }
    .support-main{min-width:0;max-width:980px}
    .support-topline{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:18px;
      margin-bottom:18px;
    }
    .support-kicker{
      color:var(--muted);
      font-size:12px;
      font-weight:700;
      letter-spacing:.24em;
      text-transform:uppercase;
    }
    .support-title{
      margin:0 0 28px;
      color:var(--text-strong);
      font:400 clamp(62px,7vw,104px)/.80 var(--serif);
      letter-spacing:-.055em;
    }
    .support-title span{display:block}
    .support-copy{
      max-width:820px;
      color:var(--muted);
      font-size:17px;
      line-height:1.72;
    }
    .support-copy p{margin:0 0 24px}
    .support-copy p:last-child{margin-bottom:0}
    .support-copy a{
      color:var(--accent-deep);
      font-weight:700;
      text-decoration:none;
      border-bottom:1px solid currentColor;
      padding-bottom:1px;
    }
    .support-copy a:hover{color:var(--accent)}
    .support-pane[hidden]{display:none!important}

    @media(max-width:760px),(orientation:portrait){
      .support-station{
        grid-template-columns:1fr;
        gap:16px;
        padding:24px 20px 28px;
        border-radius:24px;
      }
      .support-rail{justify-content:flex-start;padding:0}
      .support-rail span{
        writing-mode:horizontal-tb;
        transform:none;
        font-size:10px;
        letter-spacing:.26em;
      }
      .support-topline{align-items:flex-start;margin-bottom:16px}
      .support-kicker{font-size:10px;letter-spacing:.18em;padding-top:0}
      .support-title{
        font-size:clamp(50px,14vw,72px);
        line-height:.84;
        margin-bottom:24px;
      }
      .support-copy{font-size:14px;line-height:1.72}
      .support-copy p{margin-bottom:20px}
    }
  `;
  document.head.appendChild(styles);

  function normalizeLanguage(value){
    const raw=String(value||'').trim().toLowerCase();
    return /中文|chi|chinese|zh/.test(raw)?'zh':'en';
  }

  function getSettingsLanguageSelect(){
    return document.querySelector('#panel-settings .small-select');
  }

  function getCurrentLanguage(){
    const saved=localStorage.getItem(LANGUAGE_KEY);
    if(saved==='zh'||saved==='en') return saved;
    const select=getSettingsLanguageSelect();
    return normalizeLanguage(select?.value||'English');
  }

  function syncSettingsSelect(lang){
    const select=getSettingsLanguageSelect();
    if(!select) return;
    const matching=[...select.options].find(opt=>normalizeLanguage(opt.value||opt.textContent)===lang);
    if(matching && select.value!==matching.value) select.value=matching.value;
  }

  function applySupportLanguage(section,lang){
    const next=lang==='zh'?'zh':'en';
    section.querySelectorAll('[data-support-pane]').forEach(pane=>{
      pane.hidden=pane.dataset.supportPane!==next;
    });
    const kicker=section.querySelector('[data-support-kicker]');
    if(kicker) kicker.textContent=next==='zh'?'爱心补给站':'LOVE & SUPPORT STATION';
    section.lang=next==='zh'?'zh-CN':'en';
  }

  function bindLanguageSetting(section){
    const select=getSettingsLanguageSelect();
    const initial=getCurrentLanguage();
    syncSettingsSelect(initial);
    applySupportLanguage(section,initial);

    if(!select||select.dataset.supportLanguageBound==='true') return;
    select.dataset.supportLanguageBound='true';
    select.addEventListener('change',()=>{
      const lang=normalizeLanguage(select.value);
      localStorage.setItem(LANGUAGE_KEY,lang);
      const current=document.querySelector('#home .support-station');
      if(current) applySupportLanguage(current,lang);
      window.dispatchEvent(new CustomEvent('ling:languagechange',{detail:{language:lang}}));
    });
  }

  function render(){
    const old=document.querySelector('#home .community-card');
    if(!old) return false;

    const section=document.createElement('section');
    section.className='support-station glass';
    section.innerHTML=`
      <div class="support-rail"><span>IN OUR MIND</span></div>
      <div class="support-main">
        <div class="support-topline">
          <div class="support-kicker" data-support-kicker>LOVE &amp; SUPPORT STATION</div>
        </div>

        <h2 class="support-title"><span>LOVE❤️</span><span>&amp;COFFEE☕</span></h2>

        <div class="support-pane" data-support-pane="en">
          <div class="support-copy">
            <p>Welcome to Ling Café! This is a warm and welcoming space created by Daoyang College for everyone to relax, connect, and spend time together. To keep this sense of companionship and warmth going, we sincerely invite you to join us in supporting our college community.</p>
            <p>The café is independently operated by the college on a non-profit basis. Every donation will go to the Ling College Whole-Person Education Development Fund and will help support the café’s supplies, long-term operation, and the continued development of the college. Thank you for growing with us!</p>
            <p>If you enjoy our coffee or would like to contribute to the Daoyang College Whole-Person Education Development Fund, please click <a href="${DONATE_URL}" target="_blank" rel="noopener noreferrer">here</a> to make a donation! ❤️❤️❤️</p>
            <p>Thank you for supporting the continued operation of Ling Café. We hope you enjoy your time here!</p>
          </div>
        </div>

        <div class="support-pane zh" data-support-pane="zh" hidden>
          <div class="support-copy">
            <p>欢迎来到道扬咖啡馆！这里是道扬书院为大家打造的温馨休息与交流空间。为了让这份陪伴与温暖能够长期陪伴大家，我们诚邀您成为书院的共筑者。</p>
            <p>咖啡馆由书院自主运营，坚持非营利原则。您的每一笔爱心捐赠，都将汇入道扬书院全人教育发展基金，继续用于支持书院咖啡馆的物料补充、长期运转与书院建设。感谢您与我们共同成长！</p>
            <p>如果你觉得我们的咖啡好喝，或者想为书院全人教育发展基金出一份力，欢迎点击<a href="${DONATE_URL}" target="_blank" rel="noopener noreferrer">这里</a>进行捐款！ ❤️❤️❤️</p>
            <p>感谢您对书院咖啡馆持续运营的一份助力！祝您在这里度过愉快的时光！</p>
          </div>
        </div>
      </div>`;

    old.replaceWith(section);
    bindLanguageSetting(section);
    return true;
  }

  function install(){
    if(render()) return;
    const observer=new MutationObserver(()=>{
      if(render()) observer.disconnect();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
