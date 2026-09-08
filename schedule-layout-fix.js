(function(){
  if(window.__lingScheduleLayoutFixInstalled) return;
  window.__lingScheduleLayoutFixInstalled=true;

  const style=document.createElement('style');
  style.id='ling-schedule-layout-fix';
  style.textContent=`
    #adminScheduleEditor,
    #adminScheduleEditor *{box-sizing:border-box}
    #adminScheduleEditor{width:100%;max-width:100%;overflow:hidden}
    #adminScheduleEditor .schedule-admin-grid,
    #adminScheduleEditor .schedule-block,
    #adminScheduleEditor .weekly-list,
    #adminScheduleEditor .weekly-row{min-width:0;max-width:100%}

    #adminScheduleEditor .weekly-row input[type="time"]{
      min-width:0!important;
      max-width:100%!important;
      width:100%!important;
    }

    #adminScheduleEditor .schedule-checkbox{
      width:auto!important;
      max-width:max-content!important;
      min-height:0!important;
      margin:0!important;
      padding:0!important;
      display:inline-flex!important;
      align-items:center!important;
      justify-content:flex-start!important;
      gap:7px!important;
      white-space:nowrap!important;
    }
    #adminScheduleEditor .schedule-checkbox input[type="checkbox"]{
      -webkit-appearance:checkbox!important;
      appearance:auto!important;
      width:18px!important;
      height:18px!important;
      min-width:18px!important;
      min-height:18px!important;
      max-width:18px!important;
      max-height:18px!important;
      padding:0!important;
      margin:0!important;
      border-radius:4px!important;
      flex:0 0 18px!important;
      accent-color:var(--accent)!important;
    }

    @media(max-width:820px),(orientation:portrait){
      #panel-access{overflow:hidden}
      #adminScheduleEditor{margin-top:28px;padding-top:26px;padding-bottom:110px}
      #adminScheduleEditor .schedule-admin-head{margin-bottom:16px}
      #adminScheduleEditor .schedule-admin-head h3{font-size:31px;line-height:1.05}
      #adminScheduleEditor .schedule-admin-head p{font-size:11px;line-height:1.55;max-width:none}
      #adminScheduleEditor .schedule-admin-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:14px!important}
      #adminScheduleEditor .schedule-block{width:100%;padding:15px!important;border-radius:20px}
      #adminScheduleEditor .schedule-block h4{font-size:25px;line-height:1.05;margin-bottom:14px}

      /* Weekly defaults: one compact card per weekday. */
      #adminScheduleEditor .weekly-list{gap:9px}
      #adminScheduleEditor .weekly-row{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) auto!important;
        grid-template-areas:
          "weekday closed"
          "open close"!important;
        gap:9px 8px!important;
        align-items:center!important;
        width:100%!important;
        padding:11px!important;
        border:1px solid var(--line-soft);
        border-radius:15px;
        background:rgba(255,255,255,.05);
      }
      #adminScheduleEditor .weekly-row>strong{grid-area:weekday;font-size:12px}
      #adminScheduleEditor .weekly-row>[data-open]{grid-area:open}
      #adminScheduleEditor .weekly-row>[data-close]{grid-area:close}
      #adminScheduleEditor .weekly-row>.schedule-checkbox{
        grid-area:closed!important;
        justify-self:end!important;
        align-self:center!important;
        font-size:10px!important;
      }
      #adminScheduleEditor .weekly-row input[type="time"]{
        font-size:16px!important;
        min-height:46px!important;
        height:46px!important;
        padding:0 10px!important;
      }
      #adminScheduleEditor .schedule-save{margin-top:11px;min-height:48px}

      /* Calendar stays readable without overflowing the More panel. */
      #adminScheduleEditor .calendar-head{align-items:flex-start}
      #adminScheduleEditor .calendar-head strong{font-size:21px}
      #adminScheduleEditor .calendar-weekdays,
      #adminScheduleEditor .calendar-grid{grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:4px!important}
      #adminScheduleEditor .calendar-day{
        width:100%;min-width:0!important;min-height:62px!important;
        padding:5px!important;border-radius:11px!important;overflow:hidden
      }
      #adminScheduleEditor .calendar-day strong{font-size:12px}
      #adminScheduleEditor .calendar-day small{font-size:8px;line-height:1.15;overflow-wrap:anywhere}
      #adminScheduleEditor .calendar-day .shift-count{font-size:7.5px}

      /* Day editor: inputs first, actions below. */
      #adminScheduleEditor .day-detail-head{align-items:flex-start;flex-wrap:wrap}
      #adminScheduleEditor .frozen-badge{max-width:100%;white-space:normal;text-align:center}
      #adminScheduleEditor .day-hours{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:9px!important;padding:11px!important
      }
      #adminScheduleEditor .day-hours label{min-width:0!important;width:100%!important}
      #adminScheduleEditor .day-hours input{width:100%!important;min-width:0!important;font-size:16px!important}
      #adminScheduleEditor .day-hours button{grid-column:1/-1!important;width:100%!important}

      #adminScheduleEditor .shift-row{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:8px!important;padding:11px!important
      }
      #adminScheduleEditor .shift-row strong{grid-column:1/-1!important}
      #adminScheduleEditor .shift-row input{width:100%!important;min-width:0!important;font-size:16px!important}
      #adminScheduleEditor .shift-row button{width:100%!important}
      #adminScheduleEditor .shift-add{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:8px!important;padding:11px!important
      }
      #adminScheduleEditor .shift-add label{min-width:0!important;width:100%!important}
      #adminScheduleEditor .shift-add label:first-child{grid-column:1/-1!important}
      #adminScheduleEditor .shift-add select,
      #adminScheduleEditor .shift-add input{width:100%!important;min-width:0!important;font-size:16px!important}
      #adminScheduleEditor .shift-add button{grid-column:1/-1!important;width:100%!important}

      #adminScheduleEditor .barista-row{padding:11px;min-width:0}
      #adminScheduleEditor .barista-row strong{min-width:0;overflow-wrap:anywhere}
      #adminScheduleEditor .barista-add{grid-template-columns:minmax(0,1fr)!important;gap:8px!important}
      #adminScheduleEditor .barista-add input{width:100%!important;min-width:0!important;font-size:16px!important}
      #adminScheduleEditor .barista-add button{width:100%;min-height:46px}
    }
  `;
  document.head.appendChild(style);
})();
