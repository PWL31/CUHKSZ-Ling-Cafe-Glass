(function(){
  if(window.__lingSchedulePublicInstalled) return;
  window.__lingSchedulePublicInstalled=true;

  const palette=['#8fb969','#c98562','#789ec9','#a989c7','#d0a85c','#68a8a3','#bc7488','#7f9f72'];
  const escLocal=value=>String(value??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const minutesLocal=value=>{const [h,m]=String(value||'00:00').split(':').map(Number);return h*60+m};
  const timeLocal=value=>String(value||'').slice(0,5);
  let activeStart='';
  let todayDay=null;
  let lastRefresh=0;
  let loading=null;

  function addDays(date,delta){
    const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10);
  }

  function dayLabel(date){
    return new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'Asia/Shanghai'}).format(new Date(`${date}T12:00:00+08:00`));
  }

  function prettyDate(date){
    return new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(`${date}T12:00:00+08:00`));
  }

  function weekLabel(days){
    if(!days?.length) return 'Schedule unavailable';
    const first=new Date(`${days[0].date}T12:00:00+08:00`);
    const last=new Date(`${days[days.length-1].date}T12:00:00+08:00`);
    const fmt=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'Asia/Shanghai'});
    const year=new Intl.DateTimeFormat('en-US',{year:'numeric',timeZone:'Asia/Shanghai'}).format(last);
    return `${fmt.format(first)} – ${fmt.format(last)}, ${year}`;
  }

  function shanghaiMinutesNow(){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
    const map=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return Number(map.hour)*60+Number(map.minute);
  }

  function statusFor(day){
    if(!day) return {label:'Schedule unavailable',open:false};
    if(day.closed) return {label:'Closed today',open:false};
    const now=shanghaiMinutesNow(),open=minutesLocal(day.open),close=minutesLocal(day.close);
    if(now<open) return {label:`Opens at ${timeLocal(day.open)}`,open:false};
    if(now>=close) return {label:'Closed now',open:false};
    return {label:'Open now',open:true};
  }

  function ticks(open,close,count){
    const start=minutesLocal(open),end=minutesLocal(close);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start) return [];
    return Array.from({length:count},(_,i)=>{
      const raw=start+(end-start)*(i/(count-1));
      const rounded=Math.round(raw/30)*30;
      const h=Math.floor(rounded/60)%24,m=rounded%60;
      return m===0?String(h):`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    });
  }

  function pctInDay(value,day){
    const start=minutesLocal(day.open),end=minutesLocal(day.close),v=minutesLocal(value);
    if(end<=start) return 0;
    return Math.max(0,Math.min(100,((v-start)/(end-start))*100));
  }

  function colorFor(name){
    let hash=0;for(const ch of String(name||''))hash=(hash*31+ch.charCodeAt(0))>>>0;
    return palette[hash%palette.length];
  }

  function renderAxis(root,day,count=5){
    if(!root) return;
    if(!day||day.closed){root.innerHTML='';return}
    root.innerHTML=ticks(day.open,day.close,count).map(v=>`<span>${escLocal(v)}</span>`).join('');
  }

  function rowHtml(name,start,end,day,isCafe=false,color=''){
    const left=pctInDay(start,day),right=pctInDay(end,day);
    const fill=color||colorFor(name);
    const style=isCafe?'':`background:${escLocal(fill)}`;
    return `<div class="timeline-row ${isCafe?'cafe-row':''}"><span class="person">${escLocal(name)}</span><div class="timeline-track"><span class="shift ${isCafe?'cafe':'barista'}" style="left:${left}%;width:${Math.max(0,right-left)}%;${style}"></span></div><span class="time">${timeLocal(start)}–${timeLocal(end)}</span></div>`;
  }

  function overlapMessage(shifts){
    const list=[...(shifts||[])].sort((a,b)=>a.start.localeCompare(b.start));
    for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
      const start=Math.max(minutesLocal(list[i].start),minutesLocal(list[j].start));
      const end=Math.min(minutesLocal(list[i].end),minutesLocal(list[j].end));
      if(end>start){
        const fmt=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
        return `Two baristas overlap from ${fmt(start)}–${fmt(end)}.`;
      }
    }
    return '';
  }

  function renderHome(day){
    const heading=document.querySelector('#homeScheduleStatus');
    const hours=document.querySelector('#homeOpenHours');
    const dot=document.querySelector('#homeStatusDot');
    const axis=document.querySelector('#homeTimelineAxis');
    const rows=document.querySelector('#homeScheduleRows');
    const note=document.querySelector('#homeOverlapNote');
    const status=statusFor(day);
    if(heading) heading.textContent=status.label;
    if(dot){dot.style.opacity=status.open?'1':'.35';dot.style.filter=status.open?'none':'grayscale(1)'}
    if(hours) hours.textContent=!day?'—':day.closed?'Closed':`${timeLocal(day.open)} – ${timeLocal(day.close)}`;
    renderAxis(axis,day,4);
    if(rows){
      if(!day) rows.innerHTML='<div class="schedule-empty">Schedule unavailable.</div>';
      else if(day.closed) rows.innerHTML='<div class="schedule-empty">Ling Cafe is closed today.</div>';
      else rows.innerHTML=rowHtml('Cafe',day.open,day.close,day,true)+(day.shifts||[]).map(s=>rowHtml(s.name,s.start,s.end,day,false,s.color)).join('');
    }
    const overlap=day&&!day.closed?overlapMessage(day.shifts):'';
    if(note){note.textContent=overlap;note.style.display=overlap?'block':'none'}
  }

  function renderOpenPills(day){
    const menuPill=document.querySelector('#menuOpenPill');
    const schedulePill=document.querySelector('#scheduleOpenPill');
    if(!day){
      if(menuPill) menuPill.textContent='Schedule unavailable';
      if(schedulePill) schedulePill.textContent='Schedule unavailable';
      return;
    }
    const status=statusFor(day);
    const hours=day.closed?'Closed':`${timeLocal(day.open)}–${timeLocal(day.close)}`;
    if(menuPill) menuPill.innerHTML=`<span class="live-dot small" style="opacity:${status.open?1:.35}"></span> ${escLocal(status.label)}${!day.closed?` · ${hours}`:''}`;
    if(schedulePill) schedulePill.innerHTML=`<span class="live-dot small" style="opacity:${status.open?1:.35}"></span> Today · ${escLocal(hours)}`;
  }

  function fillReserveTimes(day){
    const sel=document.querySelector('#reserveTime');
    const date=document.querySelector('#reserveDate');
    if(date&&day?.date) date.value=day.date;
    if(!sel) return;
    if(!day){sel.innerHTML='<option>Schedule unavailable</option>';sel.disabled=true;return}
    if(day.closed){sel.innerHTML='<option>Closed</option>';sel.disabled=true;return}
    sel.disabled=false;
    const start=minutesLocal(day.open),end=minutesLocal(day.close);
    let html='';
    for(let m=start;m<end;m+=30){
      const value=`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
      html+=`<option>${value}</option>`;
    }
    sel.innerHTML=html;
  }

  function installRenderers(){
    try{
      renderScheduleRows=function(){
        const day=weekData[state.selectedDay];
        const title=document.querySelector('#selectedDayTitle');
        const root=document.querySelector('#scheduleRows');
        const axis=document.querySelector('#scheduleAxis');
        if(!day){
          if(title) title.textContent='Schedule unavailable';
          if(root) root.innerHTML='<div class="schedule-empty">Schedule unavailable.</div>';
          if(axis) axis.innerHTML='';
          return;
        }
        if(title) title.textContent=prettyDate(day.date);
        renderAxis(axis,day,7);
        if(!root) return;
        if(day.closed){root.innerHTML='<div class="schedule-empty">Ling Cafe is closed on this date.</div>';return}
        root.innerHTML=rowHtml('Cafe',day.open,day.close,day,true)+(day.shifts||[]).map(shift=>rowHtml(shift.name,shift.start,shift.end,day,false,shift.color)).join('');
      };
    }catch(_){}
  }

  function replaceWeek(data){
    weekData.splice(0,weekData.length,...data.days.map(day=>({
      date:day.date,
      label:dayLabel(day.date),
      day:Number(day.date.slice(-2)),
      open:day.open,
      close:day.close,
      closed:Boolean(day.closed),
      shifts:(day.shifts||[]).map(shift=>({name:shift.name,start:shift.start,end:shift.end,color:shift.color,bio:shift.bio}))
    })));
    if(Array.isArray(data.baristas)){
      roster.splice(0,roster.length,...data.baristas.map((barista,index)=>({name:barista.name,color:barista.color||palette[index%palette.length],bio:barista.bio||'Ling Cafe barista'})));
    }
    const label=document.querySelector('#weekLabel');if(label) label.textContent=weekLabel(data.days);
    state.selectedDay=Math.max(0,Math.min(state.selectedDay,weekData.length-1));
    installRenderers();
    renderDayStrip();renderScheduleRows();renderRoster();
  }

  async function requestSchedule(start=''){
    const suffix=start?`?start=${encodeURIComponent(start)}&days=7`:'';
    const response=await fetch(`/api/schedule${suffix}`,{credentials:'same-origin',cache:'no-store'});
    if(!response.ok) throw new Error(`Schedule request failed (${response.status})`);
    return response.json();
  }

  async function loadSchedule(start=activeStart,force=false){
    if(loading) return loading;
    if(!force&&Date.now()-lastRefresh<2500&&start===activeStart) return;
    loading=(async()=>{
      try{
        const data=await requestSchedule(start);
        activeStart=data.start;
        replaceWeek(data);
        let today=data.days.find(day=>day.date===data.today)||null;
        if(!today){
          const current=await fetch(`/api/schedule?start=${encodeURIComponent(data.today)}&days=1`,{credentials:'same-origin',cache:'no-store'});
          if(current.ok){const currentData=await current.json();today=currentData.days?.[0]||null}
        }
        todayDay=today;
        renderHome(todayDay);renderOpenPills(todayDay);fillReserveTimes(todayDay);
        window.lingScheduleData={...data,todayDay};
        lastRefresh=Date.now();
      }catch(error){
        console.warn('Schedule backend unavailable.',error);
        todayDay=null;
        renderHome(null);renderOpenPills(null);fillReserveTimes(null);
        const label=document.querySelector('#weekLabel');if(label) label.textContent='Schedule unavailable';
      }finally{loading=null}
    })();
    return loading;
  }

  function bindWeekNavigation(){
    ['prevWeek','nextWeek'].forEach(id=>{
      const old=document.getElementById(id);if(!old||old.dataset.backendBound) return;
      const fresh=old.cloneNode(true);fresh.dataset.backendBound='1';old.replaceWith(fresh);
    });
    document.getElementById('prevWeek')?.addEventListener('click',()=>loadSchedule(addDays(activeStart,-7),true));
    document.getElementById('nextWeek')?.addEventListener('click',()=>loadSchedule(addDays(activeStart,7),true));
  }

  function blankStaticSchedule(){
    const heading=document.querySelector('#homeScheduleStatus');if(heading) heading.textContent='Loading schedule…';
    const hours=document.querySelector('#homeOpenHours');if(hours) hours.textContent='—';
    const homeAxis=document.querySelector('#homeTimelineAxis');if(homeAxis) homeAxis.innerHTML='';
    const homeRows=document.querySelector('#homeScheduleRows');if(homeRows) homeRows.innerHTML='<div class="schedule-empty">Loading schedule…</div>';
    const note=document.querySelector('#homeOverlapNote');if(note) note.style.display='none';
    const menuPill=document.querySelector('#menuOpenPill');if(menuPill) menuPill.textContent='Schedule loading…';
    const schedulePill=document.querySelector('#scheduleOpenPill');if(schedulePill) schedulePill.textContent='Schedule loading…';
  }

  blankStaticSchedule();
  installRenderers();
  bindWeekNavigation();
  loadSchedule('',true);

  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-admin-view="user"]')) setTimeout(()=>loadSchedule('',true),0);
    const page=event.target.closest?.('[data-page]')?.dataset.page;
    if(page==='home'||page==='menu'||page==='schedule') setTimeout(()=>loadSchedule(activeStart,true),0);
  },true);
  window.addEventListener('focus',()=>loadSchedule(activeStart,true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadSchedule(activeStart,true)});
  setInterval(()=>{if(todayDay){renderHome(todayDay);renderOpenPills(todayDay)}},60000);
  window.refreshLingSchedule=()=>loadSchedule(activeStart,true);
})();
