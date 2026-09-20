// Run with jsdom installed externally; see README.md. No browser or production API calls.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'i18n.js'),'utf8');
function setup(html=''){
  const dom=new JSDOM(`<body><button data-language-choice="en" translate="no">English</button><button data-language-choice="zh" translate="no">中文</button>${html}</body>`,{url:'https://example.test',runScripts:'outside-only'});
  dom.window.eval(source);return dom;
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));
test('all 19 catalog names, categories and descriptions have Chinese presentation',()=>{
  const dom=setup(),t=dom.window.lingI18n.t;
  const worker=fs.readFileSync(path.join(root,'worker.js'),'utf8');
  const rows=worker.slice(worker.indexOf('const SEED_MENU = ['),worker.indexOf('\n];',worker.indexOf('const SEED_MENU = [')));
  const fields=[...rows.matchAll(/(?:name|cat|desc):'([^']+)'/g)].map(m=>m[1]);
  assert.equal(fields.length,57);
  for(const value of fields){assert.notEqual(t(value,'zh'),value,value);assert.equal(t(value,'en'),value);}
  dom.window.close();
});
test('language round trip preserves form drafts, raw option values, selection and handlers',async()=>{
  const dom=setup('<p id="copy">Today’s Menu</p><button id="action" data-filter="Milk Coffee">Milk Coffee</button><input id="draft" placeholder="Product name" value="Original"><select id="barista"><option value="42">Trent</option></select>');
  const {document:d,lingI18n:i18n}=dom.window;
  const draft=d.querySelector('#draft');draft.value='未保存 / Custom';
  let clicks=0;d.querySelector('#action').addEventListener('click',()=>clicks++);
  for(let k=0;k<8;k++){i18n.setLanguage('zh');assert.equal(d.querySelector('#copy').textContent,'今日菜单');i18n.setLanguage('en');assert.equal(d.querySelector('#copy').textContent,'Today’s Menu');}
  assert.equal(draft.value,'未保存 / Custom');assert.equal(draft.placeholder,'Product name');assert.equal(d.querySelector('#barista').value,'42');
  assert.equal(d.querySelector('#action').dataset.filter,'Milk Coffee');d.querySelector('#action').click();assert.equal(clicks,1);
  await settle();dom.window.close();
});
test('new and updated async UI is translated without mutation loops or replacing controls',async()=>{
  const dom=setup('<div id="status">Loading schedule…</div>');const d=dom.window.document,i18n=dom.window.lingI18n;
  i18n.setLanguage('zh');
  const status=d.querySelector('#status');status.textContent='Open now';
  const row=d.createElement('p');row.textContent='2 shifts';d.body.append(row);
  await settle();assert.equal(status.textContent,'营业中');assert.equal(row.textContent,'2 个班次');
  row.firstChild.nodeValue='3 shifts';await settle();assert.equal(row.textContent,'3 个班次');
  i18n.setLanguage('en');assert.equal(status.textContent,'Open now');assert.equal(row.textContent,'3 shifts');
  dom.window.close();
});
test('proper names, explicit opt-outs, styles and support panes remain untouched',()=>{
  const dom=setup('<div class="timeline-row"><span class="person">More</span></div><div class="cafe-row"><span class="person">Cafe</span></div><p translate="no">Menu</p><style>.Menu{color:red}</style><div data-support-pane="en">Home</div>');
  dom.window.lingI18n.setLanguage('zh');const d=dom.window.document;
  assert.equal(d.querySelector('.timeline-row .person').textContent,'More');assert.equal(d.querySelector('.cafe-row .person').textContent,'咖啡馆');assert.equal(d.querySelector('p').textContent,'Menu');assert.equal(d.querySelector('style').textContent,'.Menu{color:red}');assert.equal(d.querySelector('[data-support-pane]').textContent,'Home');dom.window.close();
});
test('saved language, language buttons and preference summaries stay consistent',()=>{
  const dom=setup('<section id="preference"><span id="strength">Light</span><span id="milk">More</span><p>Cold · Less ice · Normal coffee · Oat milk · More milk · No sugar · No whipped cream</p></section><span id="theme">Light</span>');
  const d=dom.window.document;dom.window.lingI18n.setLanguage('zh');
  assert.equal(d.documentElement.lang,'zh-CN');assert.equal(dom.window.localStorage.getItem('ling-glass-language'),'zh');assert.equal(d.querySelector('[data-language-choice="zh"]').getAttribute('aria-pressed'),'true');
  assert.equal(d.querySelector('#strength').textContent,'清淡');assert.equal(d.querySelector('#milk').textContent,'多量');assert.equal(d.querySelector('#theme').textContent,'浅色');
  assert.equal(d.querySelector('p').textContent,'冷饮 · 少冰 · 标准浓度 · 燕麦奶 · 多奶 · 无糖 · 不加奶油');dom.window.close();
});
