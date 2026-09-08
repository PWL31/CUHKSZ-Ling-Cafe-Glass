(function(){
  if(window.__lingSchedulePublicInstalled) return;
  window.__lingSchedulePublicInstalled=true;

  const palette=['#8fb969','#c98562','#789ec9','#a989c7','#d0a85c','#68a8a3','#bc7488','#7f9f72'];
  const escLocal=value=>String(value??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const minutesLocal=value=>{const [h,m]=String(value||'00:00').split(':').map(Number);return h*60+m};
  const pctLocal=value=>((minutesLocal(value)-540)/780)*100; // 09:00–22:00 visual frame

  function dayLabel(date){
    return new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'Asia/Shanghai'}).format(new Date(`${date}T12:00:00+08:00`));
  }

  function prettyDate(date){
    return new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(`${date}T12:00:00+08:00`));
  }

  function installRenderers(){
    try{
      pct=pctLocal;
      renderScheduleRows=function(){
        const day=weekData[state.selectedDay];
        if(!day) return;
        const title=document.querySelector('#selectedDayTitle');
        if(title) title.textContent=prettyDate(day.date);
        const root=document.querySelector('#scheduleRows');
        if(!root) return;
        if(day.closed){
          root.innerHTML='<div class="timeline-row cafe-row"><span class="person">Cafe</span><div class="timeline-track"></div><span class="time">Closed</span></div>';
          return;
        }
        const rows=[['Cafe',day.open||'09:00',day.close||'22:00','cafe'],...(day.shifts||[]).map(([n,s,e])=>[n,s,e,'barista'])];
        root.innerHTML=rows.map(([name,start,end,klass],idx)=>{
          const left=Math.max(0,Math.min(100,pctLocal(start)));
          const right=Math.max(left,Math.min(100,pctLocal(end)));
          return `<div class="timeline-row ${idx===0?'cafe-row':''}"><span class="person">${escLocal(name)}</span><div class="timeline-track"><span class="shift ${klass}" style="left:${left}%;width:${Math.max(0,right-left)}%"></span></div><span class="time">${start}–${end}</span></div>`;
        }).join('');
      };
    }catch(_){}
  }

  async function loadSchedule(){
    try{
      const response=await fetch('/api/schedule',{credentials:'same-origin',cache:'no-store'});
      if(!response.ok) return;
      const data=await response.json();
      if(!Array.isArray(data.days)||!data.days.length) return;

      weekData.splice(0,weekData.length,...data.days.map(day=>({
        date:day.date,
        label:dayLabel(day.date),
        day:Number(day.date.slice(-2)),
        open:day.open,
        close:day.close,
        closed:Boolean(day.closed),
        shifts:(day.shifts||[]).map(shift=>[shift.name,shift.start,shift.end])
      })));

      if(Array.isArray(data.baristas)){
        roster.splice(0,roster.length,...data.baristas.map((barista,index)=>({
          name:barista.name,
          color:palette[index%palette.length],
          bio:'Ling Cafe barista'
        })));
      }

      const todayIndex=data.days.findIndex(day=>day.date===data.today);
      state.selectedDay=todayIndex>=0?todayIndex:0;
      installRenderers();
      renderDayStrip();
      renderScheduleRows();
      renderRoster();
    }catch(error){
      console.warn('Schedule backend unavailable; using bundled schedule.',error);
    }
  }

  installRenderers();
  loadSchedule();
})();
