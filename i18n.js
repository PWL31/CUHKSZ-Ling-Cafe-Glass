/* Copyright (c) 2026 Trent (PWL31). See COPYRIGHT.md. */
(function () {
  'use strict';
  const KEY = 'ling-glass-language';
  let language = 'en';
  try { if (localStorage.getItem(KEY) === 'zh') language = 'zh'; } catch (_) {}

  // Translate presentation only. Never change form values, IDs, data attributes or API records.
  const zh = {
    'Saved':'已保存','Coffee strength':'咖啡浓度','A stronger tomorrow, together.':'一起，让明天更美好。','Support us ♡':'支持我们 ♡',
    'Image processing is unavailable in this browser.':'此浏览器不支持图片处理。','Menu storage is not configured.':'菜单暂不可用，请联系管理员。','Worker runtime error.':'服务暂时出错，请稍后重试。','Not found.':'未找到相关内容。','Mode must be default, custom, or closed.':'请选择默认、自定义或休息模式。',
    'Home':'首页','Menu':'菜单','Schedule':'排班','More':'更多','AT LING COLLEGE':'道扬书院',
    'Made for your moment':'留一点时间，给自己','Enjoy your cup':'慢享一杯好时光',
    'Good coffee, shared kindly. Ling Cafe is a student-run, non-profit space for rest, conversation, and community.':'用一杯咖啡，分享善意。道扬咖啡馆由学生运营，坚持非营利，为休息、交流与相聚留一处空间。',
    'TODAY':'今日','Today':'今天','Schedule detail →':'查看排班 →','Order':'浏览菜单',
    'TODAY’S EASY PICKS':'今日推荐','Popular drinks':'人气饮品','See full menu →':'完整菜单 →',
    'IN OUR MIND':'心之所向','LOVE & SUPPORT STATION':'爱心补给站','LOVE❤️':'热爱❤️','&COFFEE☕':'与咖啡☕',
    'MENU':'菜单','Today’s Menu':'今日菜单',
    'Prices below are at cost and help keep Ling Cafe running.':'以下为成本价，用于维护 Cafe 的正常运营。',
    'All':'全部','Other':'其他','Milk Coffee':'奶咖','Black Coffee':'黑咖啡','Pour-over':'手冲咖啡','Specials':'特调','Non-coffee':'非咖啡','Food':'轻食','Milk':'牛奶','Filter':'手冲',
    'Caffè Latte':'拿铁','Latte':'拿铁','Cappuccino':'卡布奇诺','Latte Macchiato':'拿铁玛奇朵','Espresso Macchiato':'浓缩玛奇朵','Flat White':'馥芮白','Espresso':'意式浓缩','Americano':'美式咖啡','Lungo':'长萃浓缩',
    'Single-Origin Pour-over':'单一产地手冲','Custom Tea-Coffee':'定制茶咖','House Coffee Special':'道扬特调咖啡','Hot Milk':'热牛奶','Pure Tea':'纯茶','Monk Fruit Tea':'罗汉果茶','Hand-Shaken Lemon Black Tea':'手打柠檬红茶','Jasmine Iced Lemon Tea':'茉莉冰柠茶','Matcha Latte':'抹茶拿铁','Matcha Milk Tea':'抹茶奶茶','Bottled Cold Brew Tea':'瓶装冷萃茶',
    'Espresso · steamed milk · hot / iced':'浓缩咖啡 · 蒸汽牛奶 · 冷 / 热','Espresso · steamed milk · milk foam':'浓缩咖啡 · 蒸汽牛奶 · 奶泡','Layered milk · espresso':'分层牛奶 · 浓缩咖啡','Espresso · touch of milk foam':'浓缩咖啡 · 少许奶泡','Espresso · silky microfoam':'浓缩咖啡 · 绵密奶泡','Straight espresso':'纯粹的意式浓缩','Espresso · water · hot / iced':'浓缩咖啡 · 水 · 冷 / 热','Long-pulled espresso':'延长萃取的浓缩咖啡','SOE beans · hand brewed':'单一产地咖啡豆 · 手工冲煮','Tea · coffee · made to order':'茶 · 咖啡 · 按喜好调配','Ling Cafe house-style coffee creation':'道扬咖啡馆独家创意特调','Steamed milk':'温热的蒸汽牛奶','Freshly brewed tea':'现泡茶香','Monk fruit infusion':'罗汉果浸泡茶','Lemon · black tea · hand shaken':'柠檬 · 红茶 · 手打','Jasmine tea · lemon · iced':'茉莉茶 · 柠檬 · 冰饮','Matcha · milk':'抹茶 · 牛奶','Matcha · milk tea':'抹茶 · 奶茶','Slow-steeped chilled tea':'低温慢萃茶',
    'Dirty':'脏咖啡','Today’s Pour-over':'今日手冲','Matcha Milk':'抹茶牛奶','Croissant':'可颂','Classic espresso + water':'经典浓缩咖啡加水','Espresso · steamed milk':'浓缩咖啡 · 蒸汽牛奶','Cold milk · espresso':'冰牛奶 · 浓缩咖啡','Bean list updates daily':'每日更新咖啡豆单','Daily limited':'每日限量',
    'Cost price':'成本价','+ Add':'+ 添加','Not today':'今日暂缺','No items yet.':'尚未添加饮品。','Total cost':'成本合计',
    'Personal Preference':'饮品偏好','Personal':'饮品','Preference':'偏好','YOUR DEFAULT CUP':'你的专属一杯','Back to menu →':'返回菜单 →','← Back to menu':'← 返回菜单',
    'Set the way you usually like your drinks. Sliders snap to a small set of preset levels.':'选择你喜欢的口味，滑动即可切换不同档位。',
    'Choose your drink preferences and save them as a structured preference card for easier communication with your barista.':'选好温度与口味，保存为偏好卡，让咖啡师更懂你的那一杯。',
    'TEMPERATURE':'温度','Temperature':'温度','Drink temperature':'饮品温度','Cold':'冷饮','Hot':'热','Warm':'温热','ICE':'冰量','Ice':'冰量','Ice level':'冰量','HEAT':'热度','Heat':'热度','How hot?':'想要多热？','No ice':'去冰','Less ice':'少冰','Regular ice':'正常冰',
    'COFFEE STRENGTH':'咖啡浓度','How bold?':'咖啡浓度','Normal':'标准','Extra':'加浓','SWEETNESS':'甜度','Sweetness':'甜度','No sugar':'无糖','Less sugar':'少糖','Regular sugar':'正常糖',
    'MILK':'牛奶','Milk preference':'牛奶偏好','Milk type':'奶类','Dairy milk':'牛奶','Oat milk':'燕麦奶','Milk level':'奶量','Less':'少量','More milk':'多奶','Normal milk':'标准奶量','Less milk':'少奶','Light coffee':'淡咖啡','Normal coffee':'标准浓度','Extra coffee':'加浓咖啡',
    'TOPPING':'加料','Whipped cream':'奶油','No whipped cream':'不加奶油','No':'不加','Yes':'添加','CURRENT DEFAULT':'当前偏好','Your usual':'你的日常口味','My usual':'我的专属口味','Default':'默认','SAVED PREFERENCE':'已保存偏好',
    'Save as preference card':'保存偏好卡','Update preference card':'更新偏好卡','Preference card saved':'偏好卡已保存','PREFERENCE CARD':'偏好卡','Your card':'你的偏好卡','Saved style':'专属口味','Coffee':'咖啡','Summary':'口味一览','Enjoy Your Cup!✨':'慢享你的这一杯！✨','DOWNLOAD':'保存','Keep your usual.':'记住喜欢的味道。','Save card to phone':'保存到手机',
    'Save this card to your phone and show it to your barista next time.':'把偏好卡保存到手机，下次点单时出示给咖啡师即可。','Preparing image…':'正在生成图片…','Preference card ready to save':'偏好卡已准备好','Preference card downloaded':'偏好卡已下载','Could not export card':'暂时无法导出，请重试',
    'PEOPLE / COFFEE / COMMUNITY':'相遇 / 咖啡 / 陪伴','Who’s on bar?':'今天谁当班？','Opening hours and today’s barista shifts.':'查看营业时间与咖啡师排班。','SELECTED DAY':'所选日期','BARISTA ROSTER':'咖啡师名册','People behind the bar':'吧台后的伙伴',
    'Loading schedule…':'正在加载排班…','Schedule loading…':'正在加载排班…','Loading roster…':'正在加载名册…','Schedule unavailable':'排班暂不可用','Schedule unavailable.':'排班暂不可用。','Closed today':'今日休息','Closed now':'已打烊','Open now':'营业中','Closed':'休息','Cafe':'咖啡馆','Ling Cafe is closed today.':'咖啡馆今日休息。','Ling Cafe is closed on this date.':'咖啡馆当日休息。','Ling Cafe barista':'道扬咖啡师','Former barista':'往期咖啡师',
    'Mon':'周一','Tue':'周二','Wed':'周三','Thu':'周四','Fri':'周五','Sat':'周六','Sun':'周日',
    'SETTINGS / FEEDBACK / ADMIN':'设置 / 反馈 / 管理','SETTINGS':'设置','Settings':'设置','Appearance & language':'外观与语言','Appearance':'外观','Light':'浅色','Dark':'深色','Persistent on this device.':'选择会保存在此设备上。','Language':'语言','Remembered on this device.':'选择会保存在此设备上。','Appearance, feedback, and barista admin tools live here.':'调整外观与语言，留下建议，或进入管理工具。',
    'FEEDBACK':'意见反馈','Feedback':'反馈','Tell us something':'和我们聊聊','Feel free to share any thoughts or suggestions.':'欢迎通过以下方式分享想法和建议。','Email':'邮箱','WeChat':'微信','Message':'留言','Send feedback':'发送反馈','What should Ling Coffee improve?':'你希望咖啡馆有哪些改进？',
    'BARISTA ONLY':'咖啡师专用','Admin Tools':'管理工具','This area is for Ling Cafe baristas.':'此区域供道扬咖啡师使用。','Regular users can ignore it. Menu edits here are stored on the Cloudflare backend and are shared across devices.':'普通访客无需操作。在此修改菜单后，所有设备都会同步更新。','Username':'用户名','Password':'密码','Sign in':'登录','Authentication is handled by the Cloudflare Worker.':'请使用咖啡馆管理员账号登录。','Signed in':'已登录','Log out':'退出登录','Admin tools are active for this signed-in session.':'已登录，可使用管理工具。','Use the header switch to preview the public User view.':'可使用顶部切换按钮预览访客界面。',
    'MENU BACKEND':'菜单管理','Menu items':'饮品管理','Changes are persistent and public immediately. Popular drinks are capped at four on both the UI and server.':'修改保存后立即公开生效。首页人气饮品最多可选 4 款。','ADD ITEM':'添加饮品','New menu item':'新增饮品','Category':'分类','Name':'名称','Short note':'简短介绍','Cost price ¥':'成本价 ¥','Available today':'今日供应','Popular':'人气推荐','Add item':'添加饮品','Copy GPT image prompt':'复制生图提示词','Save changes':'保存修改','Delete':'删除',
    'Espresso / Milk / Food':'例如：奶咖 / 黑咖啡 / 轻食','Product name':'饮品名称','Short product description':'简短的饮品介绍','GPT image prompt copied':'生图提示词已复制','Category and name are required':'请填写分类和名称','Popular drinks are limited to four':'人气饮品最多可选 4 款','Menu item added':'饮品已添加','Menu item saved':'饮品已保存','Menu item deleted':'饮品已删除','Adding…':'正在添加…','Saving…':'正在保存…','Deleting…':'正在删除…','Removing…':'正在移除…','Signing in…':'正在登录…','Checking credentials…':'正在验证账号…','Enter both username and password.':'请输入用户名和密码。','Signed in.':'登录成功。','Signed out':'已退出登录','Admin':'管理员','User':'访客','User preview':'访客预览','Admin view':'管理视图',
    'The User / Admin switch in the top-right header lets a signed-in barista inspect the public-facing result without logging out.':'已登录的咖啡师可使用访客预览查看公开效果，无需退出登录。',
    'Menu image · 4:3':'饮品图片 · 4:3','Choose 4:3 image':'选择 4:3 图片','JPG / PNG / WebP · exact 4:3 · originals up to 30 MB · automatically compressed for upload':'JPG / PNG / WebP · 4:3 比例 · 最大 30 MB · 自动压缩上传','Image:':'图片：','Add the item first, then use':'先添加饮品，再点击','. You can select a 1536×1152 generated image directly; the browser will compress it automatically.':'。可直接选择 1536×1152 图片，系统会自动压缩。','Full backend CRUD for menu items, including 4:3 image upload. Images update publicly after upload.':'支持增删改饮品及上传 4:3 图片。上传后立即公开更新。','Optimizing image…':'正在优化图片…','Menu image updated':'饮品图片已更新','Upload failed.':'上传失败，请重试。',
    'SCHEDULE':'排班管理','Schedule Admin':'排班管理','Future dates are editable. Past dates are frozen automatically using Asia/Shanghai time. Removing a barista never changes schedule history.':'可编辑当天及未来排班；历史记录按北京时间自动锁定。移除咖啡师不会影响历史记录。','DEFAULT':'默认设置','Weekly opening hours':'每周营业时间','Update weekly hours':'保存每周时间','CALENDAR':'日历','ROSTER':'咖啡师名册','Baristas':'咖啡师','Barista name':'咖啡师姓名','Add barista':'添加咖啡师','ADD BARISTA':'添加咖啡师','Remove only takes the name out of future Add Shift choices. Existing and historical shifts remain unchanged.':'移除后将无法安排新班次；已有班次与历史记录保持不变。',
    'No shifts':'无班次','DAY DETAIL':'当日安排','Past schedule · Locked':'历史排班 · 已锁定','Using weekly default':'每周默认时间','Date override':'当日自定义','Open':'开始营业','Close':'结束营业','Save custom':'保存当天时间','Use default':'恢复默认','Barista shifts':'咖啡师班次','Update':'更新','No shifts on this date.':'当日暂无班次。','Barista':'咖啡师','Start':'开始','End':'结束','Add shift':'添加班次','Remove':'移除','No active baristas.':'暂无在职咖啡师。','Updated':'已更新','Cancel':'取消','OK':'确认','SHIFT':'班次','Delete this shift?':'删除此班次？','This shift will be removed from the selected date. This action cannot be undone.':'此班次将从所选日期中删除，删除后无法恢复。','Remove barista?':'移除此咖啡师？','This removes the barista from future Add Shift choices. Existing shifts and schedule history remain unchanged.':'移除后无法为此咖啡师安排新班次，已有班次与历史记录保持不变。','Remove this barista from future Add Shift choices? Existing shifts and history will remain.':'移除此咖啡师？已有班次与历史记录将保留。','Shift deleted':'班次已删除','Barista removed':'咖啡师已移除','Could not delete shift':'无法删除班次','Could not remove barista':'无法移除咖啡师','Could not update barista':'无法更新咖啡师资料','Could not add barista':'无法添加咖啡师','Subtitle / signature':'简介 / 签名','Display color':'显示颜色',
    'Invalid username or password.':'用户名或密码不正确。','Authentication required.':'请先登录。','Invalid request body.':'提交内容无效。','Category is required.':'请填写分类。','Name is required.':'请填写名称。','Popular drinks are limited to four.':'人气饮品最多可选 4 款。','Menu item not found.':'找不到此饮品。','Use a JPG, PNG, or WebP image.':'请选择 JPG、PNG 或 WebP 图片。','Menu images must use a 4:3 aspect ratio.':'饮品图片需为 4:3 比例。','The selected image is empty.':'所选图片为空。','Optimized image is too large. Keep it below 1.9 MB.':'图片过大，请压缩至 1.9 MB 以下。','Choose a JPG, PNG, or WebP image.':'请选择 JPG、PNG 或 WebP 图片。','Choose an image smaller than 30 MB.':'请选择小于 30 MB 的图片。','Could not read this image.':'无法读取此图片。','Could not optimize this image on this device.':'此设备无法优化图片，请尝试较小的图片。',
    'Past schedules are frozen and cannot be changed.':'历史排班已锁定，无法修改。','Valid date is required.':'请选择有效日期。','Shift start must be before shift end.':'班次开始时间必须早于结束时间。','Barista not found.':'找不到此咖啡师。','This barista has been removed from the active roster.':'此咖啡师已从名册移除。','The cafe is closed on this date.':'咖啡馆当日休息。','This barista already has an overlapping shift.':'此咖啡师已有时间重叠的班次。','Invalid opening hours.':'营业时间无效。','Delete the shifts on this date before closing the cafe.':'请先删除当天班次，再设为休息日。','Existing shifts fall outside the requested cafe hours. Adjust shifts first.':'已有班次超出新的营业时间，请先调整班次。','Barista name is required.':'请填写咖啡师姓名。','Display color must be a 6-digit hex color.':'请选择有效的显示颜色。','This barista is already active.':'此咖啡师已在名册中。','Another active barista already uses this name.':'已有咖啡师使用此名称。','Shift not found.':'找不到此班次。',
    'Source code':'源代码','Designed & developed by':'设计与开发：','All rights reserved.':'保留所有权利。','Website credits':'网站署名','Primary navigation':'主导航','Mobile navigation':'移动导航','Ling Coffee home':'道扬咖啡馆首页','Previous month':'上个月','Next month':'下个月','Previous week':'上一周','Next week':'下一周','Admin tool':'管理工具','Preview mode':'预览模式'
  };
  const patterns = [
    [/^Upload failed \((\d+)\)$/, (_,code)=>`上传失败（${code}），请重试。`],
    [/^(Missing|Invalid) (mon|tue|wed|thu|fri|sat|sun) hours\.$/, (_,kind,day)=>`${{mon:'周一',tue:'周二',wed:'周三',thu:'周四',fri:'周五',sat:'周六',sun:'周日'}[day]}营业时间${kind==='Missing'?'未填写':'无效'}。`],
    [/^Opens at (.+)$/, (_,time)=>`${time} 开始营业`],
    [/^Today · (.+)$/, (_,hours)=>`今天 · ${translate(hours,'zh')}`],
    [/^Two baristas overlap from (.+)\.$/, (_,time)=>`${time} 有两位咖啡师同时当班。`],
    [/^(\d+) shifts?$/, (_,n)=>`${n} 个班次`],
    [/^Signed in as (.+)$/, (_,name)=>`当前账号：${name}`],
    [/^Delete (.+) from the menu\?$/, (_,name)=>`从菜单中删除「${translate(name,'zh')}」？`],
    [/^(.+) added$/, (_,name)=>`已添加${translate(name,'zh')}`],
    [/^Uploading (.+)$/, (_,size)=>`正在上传 ${size}`],
    [/^Uploaded · (.+)$/, (_,size)=>`已上传 · ${size}`],
    [/^Image must be 4:3\. Selected image is (.+)\.$/, (_,size)=>`图片需为 4:3 比例，当前为 ${size}。`],
    [/^Shift must stay within cafe hours \((.+)\)\.$/, (_,hours)=>`班次须在营业时间（${hours}）内。`],
    [/^Request failed \((\d+)\)$/, (_,code)=>`请求失败（${code}），请重试。`]
  ];
  function translate(value, lang = language) {
    const text = String(value ?? '');
    if (lang !== 'zh') return text;
    const core = text.trim();
    let result = zh[core];
    if (result === undefined && core.includes(' · ')) {
      result = core.split(' · ').map((part,index)=>index===0 && part==='Hot' && / coffee · /.test(core)?'热饮':translate(part,lang)).join(' · ');
    }
    if (result === undefined || result === core) {
      for (const [pattern, replace] of patterns) {
        if (pattern.test(core)) { result = core.replace(pattern,replace); break; }
      }
    }
    return result === undefined ? text : text.replace(core,result);
  }

  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const excluded = 'script,style,textarea,code,pre,[translate="no"],[data-support-pane],.person:not(.cafe-row .person),.roster-person strong,.barista-profile-avatar,.avatar-dot,#shiftBarista option,.shift-row strong';
  function skipped(node) { return node.parentElement?.closest(excluded); }
  function updateText(node) {
    if (skipped(node) || !node.nodeValue?.trim()) return;
    let record = textSources.get(node);
    if (!record || (node.nodeValue !== record.rendered && node.nodeValue !== record.source)) {
      record = {source:node.nodeValue};
    }
    // These labels have different meanings in settings and drink preferences.
    const parent = node.parentElement;
    let next = translate(record.source);
    if (language === 'zh' && record.source.trim() === 'Light' && parent.closest('#preference')) next='清淡';
    if (language === 'zh' && record.source.trim() === 'More' && parent.closest('#preference')) next='多量';
    if (language === 'zh' && record.source.trim() === 'Hot' && parent.matches('[data-pref-temp],#exportTemp')) next='热饮';
    if (language === 'zh' && record.source.trim() === 'Yes' && parent.closest('#preference')) next='添加';
    if (node.nodeValue !== next) node.nodeValue=next;
    record.rendered=next; textSources.set(node,record);
  }
  function updateAttributes(element) {
    if (element.closest('script,style,[translate="no"]')) return;
    let records=attributeSources.get(element);
    if (!records) {records={};attributeSources.set(element,records);}
    for (const attr of ['placeholder','aria-label','title']) {
      const value=element.getAttribute(attr); if(value===null)continue;
      let record=records[attr];
      if(!record || (value!==record.rendered && value!==record.source)) record={source:value};
      const next=translate(record.source);
      if(value!==next)element.setAttribute(attr,next);
      record.rendered=next;records[attr]=record;
    }
  }
  function translateTree(root) {
    if (root.nodeType===Node.TEXT_NODE) {updateText(root);return;}
    if (root.nodeType!==Node.ELEMENT_NODE || root.closest('script,style,textarea,[translate="no"],[data-support-pane]')) return;
    updateAttributes(root);
    root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(updateAttributes);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;while((node=walker.nextNode()))updateText(node);
  }
  const observer=new MutationObserver(records=>{
    observer.disconnect();
    const roots=new Set();
    for(const record of records){
      if(record.type==='childList')record.addedNodes.forEach(node=>roots.add(node));
      else roots.add(record.target);
    }
    roots.forEach(root=>{if(root.isConnected)translateTree(root);});
    observe();
  });
  function observe(){if(!document?.body)return;observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});}
  function refresh(root=document.body){observer.disconnect();translateTree(root);observe();}
  function setLanguage(next, persist=true) {
    language=next==='zh'?'zh':'en';
    if(persist)try{localStorage.setItem(KEY,language);}catch(_){}
    document.documentElement.lang=language==='zh'?'zh-CN':'en';
    document.querySelectorAll('[data-language-choice]').forEach(button=>{
      const active=button.dataset.languageChoice===language;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
    window.dispatchEvent(new CustomEvent('ling:languagechange',{detail:{language}}));
    refresh();
  }
  window.lingI18n={t:translate,setLanguage,refresh,get language(){return language;},get locale(){return language==='zh'?'zh-CN':'en-US';}};
  document.querySelectorAll('[data-language-choice]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.languageChoice)));
  setLanguage(language,false);
})();
