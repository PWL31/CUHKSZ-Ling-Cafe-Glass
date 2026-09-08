import existingWorker, { MenuStore } from './worker.js';
import { DurableObject } from 'cloudflare:workers';

export { MenuStore };

const STORE_NAME='ling-cafe-schedule';
const DEFAULT_WEEKLY={
  mon:{open:'09:00',close:'22:00',closed:false},
  tue:{open:'09:00',close:'22:00',closed:false},
  wed:{open:'09:00',close:'22:00',closed:false},
  thu:{open:'09:00',close:'22:00',closed:false},
  fri:{open:'09:00',close:'22:00',closed:false},
  sat:{open:'09:00',close:'22:00',closed:false},
  sun:{open:'09:00',close:'22:00',closed:false},
};
const SEED={
  weekly:DEFAULT_WEEKLY,
  overrides:{},
  baristas:[
    {id:1,name:'Ling',active:true,createdAt:'2026-09-01T00:00:00+08:00',removedAt:null},
    {id:2,name:'Trent',active:true,createdAt:'2026-09-01T00:00:00+08:00',removedAt:null},
    {id:3,name:'Mori',active:true,createdAt:'2026-09-01T00:00:00+08:00',removedAt:null},
  ],
  shifts:[
    {id:1,date:'2026-09-07',baristaId:1,start:'10:00',end:'16:00'},
    {id:2,date:'2026-09-07',baristaId:2,start:'14:00',end:'21:00'},
    {id:3,date:'2026-09-08',baristaId:1,start:'12:00',end:'18:00'},
    {id:4,date:'2026-09-08',baristaId:3,start:'15:00',end:'22:00'},
    {id:5,date:'2026-09-09',baristaId:2,start:'14:00',end:'21:30'},
    {id:6,date:'2026-09-09',baristaId:3,start:'10:00',end:'15:00'},
    {id:7,date:'2026-09-10',baristaId:1,start:'10:00',end:'16:00'},
    {id:8,date:'2026-09-11',baristaId:1,start:'11:00',end:'17:00'},
    {id:9,date:'2026-09-11',baristaId:2,start:'16:00',end:'22:00'},
    {id:10,date:'2026-09-12',baristaId:2,start:'15:30',end:'22:00'},
    {id:11,date:'2026-09-12',baristaId:3,start:'10:00',end:'17:30'},
    {id:12,date:'2026-09-13',baristaId:1,start:'12:00',end:'18:00'},
  ]
};

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function clone(value){return JSON.parse(JSON.stringify(value))}
function clean(value,max){return String(value??'').trim().slice(0,max)}
function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))}
function validTime(value){return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value||''))}
function mins(value){const [h,m]=String(value).split(':').map(Number);return h*60+m}
function todayShanghai(){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const map=Object.fromEntries(parts.map(p=>[p.type,p.value]));return `${map.year}-${map.month}-${map.day}`;
}
function weekdayKey(date){return ['sun','mon','tue','wed','thu','fri','sat'][new Date(`${date}T12:00:00Z`).getUTCDay()]}
function nextDate(date,offset){const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)}
function mondayOf(date){const d=new Date(`${date}T12:00:00Z`),dow=d.getUTCDay();return nextDate(date,-(dow===0?6:dow-1))}
function resolvedHours(s,date){const o=s.overrides?.[date];if(o)return o.closed?{closed:true,open:'',close:'',source:'override'}:{closed:false,open:o.open,close:o.close,source:'override'};return {...(s.weekly?.[weekdayKey(date)]||{open:'09:00',close:'22:00',closed:false}),source:'default'}}
function normalizeWeekly(body){
  const weekly={};
  for(const key of ['mon','tue','wed','thu','fri','sat','sun']){
    const row=body?.weekly?.[key];if(!row)throw new Error(`Missing ${key} hours.`);
    const closed=Boolean(row.closed),open=clean(row.open,5),close=clean(row.close,5);
    if(!closed&&(!validTime(open)||!validTime(close)||mins(open)>=mins(close)))throw new Error(`Invalid ${key} hours.`);
    weekly[key]={open:open||'09:00',close:close||'22:00',closed};
  }
  return weekly;
}
function validateShift(s,input,excludeId=null,requireActive=true){
  const {date,baristaId,start,end}=input;
  if(!validDate(date))throw new Error('Valid date is required.');
  if(date<todayShanghai())throw new Error('Past schedules are frozen and cannot be changed.');
  if(!validTime(start)||!validTime(end)||mins(start)>=mins(end))throw new Error('Shift start must be before shift end.');
  const barista=s.baristas.find(b=>Number(b.id)===Number(baristaId));
  if(!barista)throw new Error('Barista not found.');
  if(requireActive&&!barista.active)throw new Error('This barista has been removed from the active roster.');
  const hours=resolvedHours(s,date);if(hours.closed)throw new Error('The cafe is closed on this date.');
  if(mins(start)<mins(hours.open)||mins(end)>mins(hours.close))throw new Error(`Shift must stay within cafe hours (${hours.open}–${hours.close}).`);
  if(s.shifts.some(x=>Number(x.id)!==Number(excludeId)&&x.date===date&&Number(x.baristaId)===Number(baristaId)&&mins(start)<mins(x.end)&&mins(end)>mins(x.start)))throw new Error('This barista already has an overlapping shift.');
}

export class ScheduleStore extends DurableObject{
  constructor(ctx,env){super(ctx,env);ctx.blockConcurrencyWhile(async()=>{const existing=await ctx.storage.get('schedule_v1');if(!existing||!existing.weekly||!Array.isArray(existing.baristas)||!Array.isArray(existing.shifts))await ctx.storage.put('schedule_v1',clone(SEED))})}
  async read(){return clone((await this.ctx.storage.get('schedule_v1'))||SEED)}
  async write(value){await this.ctx.storage.put('schedule_v1',value)}
  publicView(s,url){
    const today=todayShanghai();const start=validDate(url.searchParams.get('start'))?url.searchParams.get('start'):mondayOf(today);const count=Math.max(1,Math.min(31,Number(url.searchParams.get('days'))||7));
    const names=Object.fromEntries(s.baristas.map(b=>[String(b.id),b.name]));const days=[];
    for(let i=0;i<count;i++){const date=nextDate(start,i),hours=resolvedHours(s,date);const shifts=s.shifts.filter(x=>x.date===date).sort((a,b)=>a.start.localeCompare(b.start)).map(x=>({...x,name:names[String(x.baristaId)]||'Former barista'}));days.push({date,...hours,shifts})}
    return {today,start,days,baristas:s.baristas.filter(b=>b.active).map(({id,name})=>({id,name}))};
  }
  async fetch(request){
    const url=new URL(request.url),path=url.pathname,method=request.method.toUpperCase();
    if(path==='/schedule'&&method==='GET')return json(this.publicView(await this.read(),url));
    if(path==='/schedule/admin'&&method==='GET'){const s=await this.read();return json({today:todayShanghai(),...s})}
    if(path==='/schedule/weekly'&&method==='PUT'){
      let body;try{body=await request.json()}catch{return json({error:'Invalid request body.'},400)}const s=await this.read();try{s.weekly=normalizeWeekly(body)}catch(e){return json({error:e.message},400)}await this.write(s);return json({ok:true,weekly:s.weekly});
    }
    const dayMatch=path.match(/^\/schedule\/day\/(\d{4}-\d{2}-\d{2})$/);
    if(dayMatch&&method==='PUT'){
      const date=dayMatch[1];if(date<todayShanghai())return json({error:'Past schedules are frozen and cannot be changed.'},409);
      let body;try{body=await request.json()}catch{return json({error:'Invalid request body.'},400)}const s=await this.read(),mode=clean(body.mode,12);
      if(mode==='default')delete s.overrides[date];
      else if(mode==='closed'){if(s.shifts.some(x=>x.date===date))return json({error:'Delete the shifts on this date before closing the cafe.'},409);s.overrides[date]={closed:true,open:'',close:''}}
      else if(mode==='custom'){
        const open=clean(body.open,5),close=clean(body.close,5);if(!validTime(open)||!validTime(close)||mins(open)>=mins(close))return json({error:'Invalid opening hours.'},400);
        if(s.shifts.some(x=>x.date===date&&(mins(x.start)<mins(open)||mins(x.end)>mins(close))))return json({error:'Existing shifts fall outside the requested cafe hours. Adjust shifts first.'},409);
        s.overrides[date]={closed:false,open,close};
      }else return json({error:'Mode must be default, custom, or closed.'},400);
      await this.write(s);return json({ok:true,override:s.overrides[date]||null});
    }
    if(path==='/schedule/baristas'&&method==='POST'){
      let body;try{body=await request.json()}catch{return json({error:'Invalid request body.'},400)}const name=clean(body.name,60);if(!name)return json({error:'Barista name is required.'},400);const s=await this.read();if(s.baristas.some(b=>b.active&&b.name.toLowerCase()===name.toLowerCase()))return json({error:'This barista is already active.'},409);const id=s.baristas.reduce((m,b)=>Math.max(m,Number(b.id)||0),0)+1;const barista={id,name,active:true,createdAt:new Date().toISOString(),removedAt:null};s.baristas.push(barista);await this.write(s);return json({barista},201);
    }
    const baristaMatch=path.match(/^\/schedule\/baristas\/(\d+)$/);
    if(baristaMatch&&method==='DELETE'){const s=await this.read(),barista=s.baristas.find(b=>Number(b.id)===Number(baristaMatch[1]));if(!barista)return json({error:'Barista not found.'},404);barista.active=false;barista.removedAt=new Date().toISOString();await this.write(s);return json({ok:true,barista})}
    if(path==='/schedule/shifts'&&method==='POST'){
      let body;try{body=await request.json()}catch{return json({error:'Invalid request body.'},400)}const s=await this.read(),input={date:clean(body.date,10),baristaId:Number(body.baristaId),start:clean(body.start,5),end:clean(body.end,5)};try{validateShift(s,input)}catch(e){return json({error:e.message},409)}const id=s.shifts.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1,shift={id,...input};s.shifts.push(shift);await this.write(s);return json({shift},201);
    }
    const shiftMatch=path.match(/^\/schedule\/shifts\/(\d+)$/);
    if(shiftMatch&&method==='PUT'){
      let body;try{body=await request.json()}catch{return json({error:'Invalid request body.'},400)}const s=await this.read(),index=s.shifts.findIndex(x=>Number(x.id)===Number(shiftMatch[1]));if(index<0)return json({error:'Shift not found.'},404);const current=s.shifts[index];if(current.date<todayShanghai())return json({error:'Past schedules are frozen and cannot be changed.'},409);const input={date:current.date,baristaId:current.baristaId,start:clean(body.start??current.start,5),end:clean(body.end??current.end,5)};try{validateShift(s,input,current.id,false)}catch(e){return json({error:e.message},409)}s.shifts[index]={...current,...input};await this.write(s);return json({shift:s.shifts[index]});
    }
    if(shiftMatch&&method==='DELETE'){const s=await this.read(),shift=s.shifts.find(x=>Number(x.id)===Number(shiftMatch[1]));if(!shift)return json({error:'Shift not found.'},404);if(shift.date<todayShanghai())return json({error:'Past schedules are frozen and cannot be changed.'},409);s.shifts=s.shifts.filter(x=>Number(x.id)!==shift.id);await this.write(s);return json({ok:true})}
    return json({error:'Not found.'},404);
  }
}

function store(env){return env.SCHEDULE_STORE.getByName(STORE_NAME)}
async function forward(request,env,path){
  const init={method:request.method,headers:new Headers(request.headers)};if(request.method!=='GET'&&request.method!=='HEAD')init.body=await request.arrayBuffer();return store(env).fetch(new Request(`https://schedule.internal${path}`,init));
}
async function isAdmin(request,env){
  const url=new URL('/api/admin/session',request.url);const response=await existingWorker.fetch(new Request(url,{method:'GET',headers:request.headers}),env);if(!response.ok)return false;try{return Boolean((await response.json()).authenticated)}catch{return false}
}

export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/api/schedule'&&request.method==='GET')return forward(request,env,`/schedule${url.search}`);
    if(url.pathname.startsWith('/api/admin/schedule')){
      if(!(await isAdmin(request,env)))return json({error:'Authentication required.'},401);
      const path=url.pathname==='/api/admin/schedule'&&request.method==='GET'?'/schedule/admin':url.pathname.replace('/api/admin','');
      return forward(request,env,path);
    }
    return existingWorker.fetch(request,env);
  }
};
