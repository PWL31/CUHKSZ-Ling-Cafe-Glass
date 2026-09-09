(function(){
  if(window.__lingScheduleAdminInstalled) return;
  window.__lingScheduleAdminInstalled=true;

  const $=s=>document.querySelector(s);
  const esc=value=>String(value??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt',"'":'&#39;','\"':'&quot;'}[ch]));
  const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const weekdayKeys=['mon','tue','wed','thu','fri','sat','sun'];
  let data=null;
  let selectedDate='';
  let viewMonth='';
  let mounted=false;
  let loaded=false;

  function installStyles(){
    if($('#ling-schedule-admin-styles')) return;
    const style=document.createElement('style');
    style.id='ling-schedule-admin-styles';
    style.textContent=`
      .schedule-admin{margin-top:34px;padding-top:30px;border-top:1px solid var(--line-soft)}
      .schedule-admin-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:18px}
      .schedule-admin-head h3{font:400 34px/1 var(--serif);margin:7px 0 0;color:var(--text-strong)}
      .schedule-admin-head p{max-width:520px;margin:0;color:var(--muted);font-size:12px;line-height:1.55;text-align:right}
      .schedule-admin-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}
      .schedule-block{padding:18px;border:1px solid var(--line);border-radius:22px;background:var(--glass-soft)}
      .schedule-block h4{margin:6px 0 15px;font:400 27px/1 var(--serif);color:var(--text-strong)}
      .weekly-list{display:grid;gap:8px}
      .weekly-row{display:grid;grid-template-columns:54px 1fr 1fr auto;gap:8px;align-items:center}
      .weekly-row strong{font-size:12px;color:var(--text-strong)}
      .weekly-row input[type="time"]{width:100%;min-width:0}
      .schedule-checkbox{display:inline-flex;align-items:center;gap:7px;font-size:11px;color:var(--muted);white-space:nowrap}
      .schedule-checkbox input{accent-color:var(--accent)}
      .schedule-save{margin-top:12px;width:100%;min-height:46px;border:0;border-radius:999px;background:var(--accent);color:#063b39;font-weight:800;cursor:pointer}
      .calendar-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
      .calendar-head strong{font:400 23px/1 var(--serif);color:var(--text-strong)}
      .calendar-nav{display:flex;gap:6px}.calendar-nav button{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:rgba(255,255,255,.08);color:var(--text-strong);cursor:pointer}
      .calendar-weekdays,.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
      .calendar-weekdays span{text-align:center;font-size:9px;letter-spacing:.08em;color:var(--muted);font-weight:800;padding:4px 0}
      .calendar-day{min-height:76px;padding:8px;border:1px solid var(--line-soft);border-radius:14px;background:rgba(255,255,255,.08);color:var(--text-strong);text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:4px}
      .calendar-day.blank{visibility:hidden;pointer-events:none}.calendar-day.past{opacity:.42}.calendar-day.today{border-color:rgba(10,186,181,.65);box-shadow:inset 0 0 0 1px rgba(10,186,181,.22)}.calendar-day.selected{background:rgba(10,186,181,.13);border-color:rgba(10,186,181,.48)}
      .calendar-day strong{font-size:13px}.calendar-day small{font-size:9px;color:var(--muted);line-height:1.25}.calendar-day .shift-count{margin-top:auto;font-weight:800;color:var(--accent-deep)}
      .day-detail{grid-column:1/-1}.day-detail-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.day-detail-head h4{margin:0}.frozen-badge{padding:7px 10px;border-radius:999px;background:rgba(120,95,83,.10);border:1px solid var(--line-soft);font-size:10px;font-weight:800;color:var(--muted)}
      .day-hours{display:grid;grid-template-columns:1fr 1fr auto auto auto;gap:8px;align-items:end;padding:13px;border:1px solid var(--line-soft);border-radius:16px;background:rgba(255,255,255,.06)}
      .day-hours label,.shift-add label{margin:0}.day-hours button,.shift-add button,.shift-row button,.barista-row button{min-height:42px;border-radius:999px;padding:0 13px;font-weight:800;cursor:pointer}
      .day-action{border:1px solid var(--line);background:rgba(255,255,255,.08);color:var(--text-strong)}.day-primary{border:0;background:var(--accent);color:#063b39}.day-danger{border:1px solid rgba(182,80,71,.28);background:rgba(182,80,71,.08);color:#a34a43}
      .schedule-subtitle{margin:18px 0 9px;font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:800;color:var(--accent-deep)}
      .shift-list{display:grid;gap:8px}.shift-row{display:grid;grid-template-columns:minmax(110px,1fr) 120px 120px auto auto;gap:8px;align-items:center;padding:10px 12px;border:1px solid var(--line-soft);border-radius:15px;background:rgba(255,255,255,.05)}
      .shift-row strong{font-size:12px;color:var(--text-strong)}.shift-row input{min-width:0}
      .shift-add{display:grid;grid-template-columns:minmax(140px,1fr) 120px 120px auto;gap:8px;align-items:end;margin-top:8px;padding:12px;border:1px dashed rgba(10,186,181,.32);border-radius:16px;background:rgba(10,186,181,.04)}
      .schedule-empty{padding:12px;border:1px dashed var(--line-soft);border-radius:14px;color:var(--muted);font-size:11px;text-align:center}
      .barista-list{display:grid;gap:8px}.barista-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--line-soft);border-radius:14px;background:rgba(255,255,255,.05)}.barista-row strong{font-size:12px;color:var(--text-strong)}
      .barista-add{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.barista-add button{border:0;border-radius:999px;background:var(--accent);color:#063b39;padding:0 16px;font-weight:800;cursor:pointer}
      .schedule-note{margin-top:10px;font-size:10px;color:var(--muted);line-height:1.45}
      .schedule-status{min-height:18px;margin-top:8px;font-size:11px;color:var(--muted)}.schedule-status.error{color:#b65047}
      @media(max-width:820px),(orientation:portrait){
        .schedule-admin-head{display:block}.schedule-admin-head p{text-align:left;margin-top:8px}.schedule-admin-grid{grid-template-columns:1fr}.weekly-row{grid-template-columns:42px 1fr 1fr}.weekly-row .schedule-checkbox{grid-column:2/4}.calendar-day{min-height:68px;padding:6px}.day-hours{grid-template-columns:1fr 1fr}.day-hours button{width:100%}.shift-row{grid-template-columns:1fr 1fr}.shift-row strong{grid-column:1/-1}.shift-row button{width:100%}.shift-add{grid-template-columns:1fr 1fr}.shift-add label:first-child{grid-column:1/-1}.shift-add button{grid-column:1/-1}.day-detail{grid-column:auto}
      }
    `;
    document.head.appendChild(style);
  }

  async function requestJson(path,options={}){
    const headers={...(options.headers||{})};
    if(options.body&&!headers['Content-Type']) headers['Content-Type']='application/json';
    const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers});
    let body={};try{body=await response.json()}catch(_){}
    if(!response.ok) throw new Error(body.error||`Request failed (${response.status})`);
    return body;
  }

  function setStatus(message,error=false){
    const el=$('#scheduleAdminStatus');if(!el)return;el.textContent=message||'';el.classList.toggle('error',Boolean(error));
  }

  function mount(){
    if(mounted) return true;
    const host=$('#adminLoggedIn');
    if(!host) return false;
    installStyles();
    const section=document.createElement('section');
    section.id='adminScheduleEditor';
    section.className='schedule-admin admin-only';
    section.innerHTML=`
      <div class="schedule-admin-head"><div><div class="eyebrow">SCHEDULE</div><h3>Schedule Admin</h3></div><p>Future dates are editable. Past dates are frozen automatically using Asia/Shanghai time. Removing a barista never changes schedule history.</p></div>
      <div class="schedule-admin-grid">
        <section class="schedule-block"><div class="eyebrow">DEFAULT</div><h4>Weekly opening hours</h4><div id="weeklyHours" class="weekly-list"></div><button id="saveWeeklyHours" class="schedule-save">Update weekly hours</button></section>
        <section class="schedule-block"><div class="calendar-head"><div><div class="eyebrow">CALENDAR</div><strong id="calendarMonthTitle"></strong></div><div class="calendar-nav"><button id="calendarPrev" aria-label="Previous month">←</button><button id="calendarNext" aria-label="Next month">→</button></div></div><div class="calendar-weekdays">${weekdays.map(d=>`<span>${d}</span>`).join('')}</div><div id="scheduleCalendar" class="calendar-grid"></div></section>
        <section id="scheduleDayDetail" class="schedule-block day-detail"></section>
        <section class="schedule-block"><div class="eyebrow">ROSTER</div><h4>Baristas</h4><div id="baristaAdminList" class="barista-list"></div><div class="barista-add"><input id="newBaristaName" placeholder="Barista name" maxlength="60"><button id="addBarista">Add barista</button></div><div class="schedule-note">Remove only takes the name out of future Add Shift choices. Existing and historical shifts remain unchanged.</div></section>
      </div><div id="scheduleAdminStatus" class="schedule-status"></div>`;
    host.appendChild(section);
    mounted=true;
    bindStatic();
    return true;
  }

  function formatMonth(month){
    const [y,m]=month.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(Date.UTC(y,m-1,15)));
  }

  function addMonths(month,delta){
    const [y,m]=month.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+delta,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
  }

  function weekdayKey(date){
    const d=new Date(`${date}T12:00:00Z`);return ['sun','mon','tue','wed','thu','fri','sat'][d.getUTCDay()];
  }

  function resolvedHours(date){
    const override=data?.overrides?.[date];
    if(override){
      if(override.closed) return {closed:true,open:'',close:'',source:'override'};
      return {closed:false,open:override.open,close:override.close,source:'override'};
    }
    const base=data?.weekly?.[weekdayKey(date)]||{open:'09:00',close:'22:00',closed:false};
    return {...base,source:'default'};
  }

  function shiftsFor(date){return (data?.shifts||[]).filter(s=>s.date===date).sort((a,b)=>a.start.localeCompare(b.start))}
  function baristaById(id){return (data?.baristas||[]).find(b=>Number(b.id)===Number(id))}
  function activeBaristas(){return (data?.baristas||[]).filter(b=>b.active)}
  function isPast(date){return Boolean(data?.today&&date<data.today)}

  function renderWeekly(){
    const root=$('#weeklyHours');if(!root||!data)return;
    root.innerHTML=weekdayKeys.map((key,i)=>{const h=data.weekly[key]||{open:'09:00',close:'22:00',closed:false};return `<div class="weekly-row" data-weekday="${key}"><strong>${weekdays[i]}</strong><input data-open type="time" value="${esc(h.open||'09:00')}" ${h.closed?'disabled':''}><input data-close type="time" value="${esc(h.close||'22:00')}" ${h.closed?'disabled':''}><label class="schedule-checkbox"><input data-closed type="checkbox" ${h.closed?'checked':''}> Closed</label></div>`}).join('');
    root.querySelectorAll('[data-closed]').forEach(box=>box.addEventListener('change',()=>{const row=box.closest('.weekly-row');row.querySelector('[data-open]').disabled=box.checked;row.querySelector('[data-close]').disabled=box.checked}));
  }

  function renderCalendar(){
    if(!data) return;
    const root=$('#scheduleCalendar');if(!root)return;
    $('#calendarMonthTitle').textContent=formatMonth(viewMonth);
    const [year,month]=viewMonth.split('-').map(Number);
    const first=new Date(Date.UTC(year,month-1,1));
    const daysInMonth=new Date(Date.UTC(year,month,0)).getUTCDate();
    const jsDay=first.getUTCDay();
    const leading=(jsDay+6)%7;
    let html=Array.from({length:leading},()=>'<button class="calendar-day blank" tabindex="-1"></button>').join('');
    for(let day=1;day<=daysInMonth;day++){
      const date=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const hours=resolvedHours(date),count=shiftsFor(date).length;
      const classes=['calendar-day',date<data.today?'past':'',date===data.today?'today':'',date===selectedDate?'selected':''].filter(Boolean).join(' ');
      const hoursText=hours.closed?'Closed':`${hours.open}–${hours.close}`;
      html+=`<button class="${classes}" data-calendar-date="${date}"><strong>${day}</strong><small>${hoursText}</small><small class="shift-count">${count?`${count} shift${count===1?'':'s'}`:'No shifts'}</small></button>`;
    }
    root.innerHTML=html;
    root.querySelectorAll('[data-calendar-date]').forEach(btn=>btn.addEventListener('click',()=>{selectedDate=btn.dataset.calendarDate;renderCalendar();renderDayDetail()}));
  }

  function renderDayDetail(){
    const root=$('#scheduleDayDetail');if(!root||!data)return;
    if(!selectedDate) selectedDate=data.today;
    const past=isPast(selectedDate),hours=resolvedHours(selectedDate),shiftList=shiftsFor(selectedDate);
    const active=activeBaristas();
    root.innerHTML=`
      <div class="day-detail-head"><div><div class="eyebrow">DAY DETAIL</div><h4>${esc(selectedDate)}</h4></div>${past?'<span class="frozen-badge">Past schedule · Locked</span>':`<span class="frozen-badge">${hours.source==='default'?'Using weekly default':'Date override'}</span>`}</div>
      <div class="day-hours">
        <label><span>Open</span><input id="dayOpen" type="time" value="${esc(hours.open||'09:00')}" ${past||hours.closed?'disabled':''}></label>
        <label><span>Close</span><input id="dayClose" type="time" value="${esc(hours.close||'22:00')}" ${past||hours.closed?'disabled':''}></label>
        ${past?'':`<button id="saveDayHours" class="day-primary">Save custom</button><button id="useDefaultHours" class="day-action">Use default</button><button id="closeDay" class="day-danger">Closed</button>`}
      </div>
      <div class="schedule-subtitle">Barista shifts</div>
      <div class="shift-list">${shiftList.length?shiftList.map(shift=>{
        const b=baristaById(shift.baristaId);return `<div class="shift-row" data-shift-id="${shift.id}"><strong>${esc(b?.name||shift.baristaName||'Former barista')}</strong><input data-shift-start type="time" value="${esc(shift.start)}" ${past?'disabled':''}><input data-shift-end type="time" value="${esc(shift.end)}" ${past?'disabled':''}>${past?'':`<button data-save-shift class="day-action">Update</button><button data-delete-shift class="day-danger">Delete</button>`}</div>`}).join(''):'<div class="schedule-empty">No shifts on this date.</div>'}</div>
      ${past?'':`<div class="shift-add"><label><span>Barista</span><select id="shiftBarista">${active.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></label><label><span>Start</span><input id="shiftStart" type="time" value="09:00"></label><label><span>End</span><input id="shiftEnd" type="time" value="16:00"></label><button id="addShift" class="day-primary" ${hours.closed||!active.length?'disabled':''}>Add shift</button></div>`}
    `;
    bindDayActions();
  }

  function renderBaristas(){
    const root=$('#baristaAdminList');if(!root||!data)return;
    const active=activeBaristas();
    root.innerHTML=active.length?active.map(b=>`<div class="barista-row"><strong>${esc(b.name)}</strong><button class="day-danger" data-remove-barista="${b.id}">Remove</button></div>`).join(''):'<div class="schedule-empty">No active baristas.</div>';
    root.querySelectorAll('[data-remove-barista]').forEach(btn=>btn.addEventListener('click',async()=>{
      if(!confirm('Remove this barista from future Add Shift choices? Existing shifts and history will remain.')) return;
      const id=Number(btn.dataset.removeBarista);
      await mutate(`/api/admin/schedule/baristas/${id}`,{method:'DELETE'},result=>{
        const index=data.baristas.findIndex(b=>Number(b.id)===id);
        if(index>=0) data.baristas[index]={...data.baristas[index],...(result.barista||{}),active:false};
        renderBaristas();
        renderDayDetail();
      });
    }));
  }

  function renderAll(){renderWeekly();renderCalendar();renderDayDetail();renderBaristas()}

  async function load(){
    if(!mount()) return;
    try{
      data=await requestJson('/api/admin/schedule',{method:'GET'});
      if(!viewMonth) viewMonth=data.today.slice(0,7);
      if(!selectedDate) selectedDate=data.today;
      loaded=true;renderAll();setStatus('');
    }catch(error){setStatus(error.message,true)}
  }

  function refreshPublicSchedule(){
    if(typeof window.refreshLingSchedule==='function') window.refreshLingSchedule();
    window.dispatchEvent(new CustomEvent('ling:schedule-updated'));
  }

  async function mutate(path,options,onSuccess){
    try{
      setStatus('Saving…');
      const result=await requestJson(path,options);
      if(typeof onSuccess==='function') onSuccess(result);
      setStatus('Updated');
      refreshPublicSchedule();
      return result;
    }catch(error){
      setStatus(error.message,true);
      if(window.toast) toast(error.message);
      return null;
    }
  }

  function bindDayActions(){
    if(isPast(selectedDate)) return;

    $('#saveDayHours')?.addEventListener('click',()=>{
      const date=selectedDate;
      const open=$('#dayOpen').value;
      const close=$('#dayClose').value;
      mutate(`/api/admin/schedule/day/${date}`,{method:'PUT',body:JSON.stringify({mode:'custom',open,close})},result=>{
        data.overrides[date]=result.override||{closed:false,open,close};
        renderCalendar();
        renderDayDetail();
      });
    });

    $('#useDefaultHours')?.addEventListener('click',()=>{
      const date=selectedDate;
      mutate(`/api/admin/schedule/day/${date}`,{method:'PUT',body:JSON.stringify({mode:'default'})},()=>{
        delete data.overrides[date];
        renderCalendar();
        renderDayDetail();
      });
    });

    $('#closeDay')?.addEventListener('click',()=>{
      const date=selectedDate;
      mutate(`/api/admin/schedule/day/${date}`,{method:'PUT',body:JSON.stringify({mode:'closed'})},result=>{
        data.overrides[date]=result.override||{closed:true,open:'',close:''};
        renderCalendar();
        renderDayDetail();
      });
    });

    document.querySelectorAll('[data-save-shift]').forEach(btn=>btn.addEventListener('click',()=>{
      const row=btn.closest('[data-shift-id]');
      const id=Number(row.dataset.shiftId);
      const start=row.querySelector('[data-shift-start]').value;
      const end=row.querySelector('[data-shift-end]').value;
      mutate(`/api/admin/schedule/shifts/${id}`,{method:'PUT',body:JSON.stringify({start,end})},result=>{
        const index=data.shifts.findIndex(shift=>Number(shift.id)===id);
        if(index>=0) data.shifts[index]={...data.shifts[index],...(result.shift||{start,end})};
      });
    }));

    document.querySelectorAll('[data-delete-shift]').forEach(btn=>btn.addEventListener('click',()=>{
      const row=btn.closest('[data-shift-id]');
      const id=Number(row.dataset.shiftId);
      if(!confirm('Delete this shift?')) return;
      mutate(`/api/admin/schedule/shifts/${id}`,{method:'DELETE'},()=>{
        data.shifts=data.shifts.filter(shift=>Number(shift.id)!==id);
        renderCalendar();
        renderDayDetail();
      });
    }));

    $('#addShift')?.addEventListener('click',()=>{
      const payload={date:selectedDate,baristaId:Number($('#shiftBarista').value),start:$('#shiftStart').value,end:$('#shiftEnd').value};
      mutate('/api/admin/schedule/shifts',{method:'POST',body:JSON.stringify(payload)},result=>{
        if(result.shift) data.shifts.push(result.shift);
        renderCalendar();
        renderDayDetail();
      });
    });
  }

  function bindStatic(){
    $('#calendarPrev').addEventListener('click',()=>{viewMonth=addMonths(viewMonth,-1);renderCalendar()});
    $('#calendarNext').addEventListener('click',()=>{viewMonth=addMonths(viewMonth,1);renderCalendar()});

    $('#saveWeeklyHours').addEventListener('click',()=>{
      const weekly={};
      document.querySelectorAll('.weekly-row').forEach(row=>{
        weekly[row.dataset.weekday]={open:row.querySelector('[data-open]').value,close:row.querySelector('[data-close]').value,closed:row.querySelector('[data-closed]').checked};
      });
      mutate('/api/admin/schedule/weekly',{method:'PUT',body:JSON.stringify({weekly})},result=>{
        data.weekly=result.weekly||weekly;
        renderCalendar();
        renderDayDetail();
      });
    });

    $('#addBarista').addEventListener('click',()=>{
      const input=$('#newBaristaName');
      const name=input.value.trim();
      if(!name) return;
      mutate('/api/admin/schedule/baristas',{method:'POST',body:JSON.stringify({name})},result=>{
        if(result.barista) data.baristas.push(result.barista);
        input.value='';
        renderBaristas();
        renderDayDetail();
      });
    });
  }

  let tries=0;
  function bootstrap(){
    tries++;
    mount();
    if(document.body.classList.contains('admin-authenticated')) load();
    if(!loaded&&tries<40) setTimeout(bootstrap,200);
  }

  document.addEventListener('click',event=>{
    if(event.target.closest?.('#adminLogin')) setTimeout(()=>{if(document.body.classList.contains('admin-authenticated'))load()},500);
  });

  bootstrap();
})();
