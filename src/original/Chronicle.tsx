import React, {useEffect, useRef, useState} from 'react';
import source from '../data/goc_config_event.json';
import removeConfig from './event-conditions.json';
import buff from '../data/goc_config_pd_buff.json';
import {TALENTS,TIERS,REALMS} from '../game/talents';
import {createEngine, type Life} from './rules.mjs';
import './chronicle.css';

const engine=createEngine(source,removeConfig);
const saveKey='woyaoxiuzhen_apk18_chronicle_v1';
type LocalText=[string,string,string[]];
const library:Record<string,LocalText>={};
for(const chunk of Object.values(import.meta.glob('./vi-*.json',{eager:true,import:'default'}))){
 Object.assign(library,chunk);
}
const records:Record<string,{id:string|number;name:string;explain?:string;action?:string[]}>=source.data;
const textFor=(id:string|number):LocalText=>library[id]??[records[id]?.name||String(id),records[id]?.explain||'',records[id]?.action||[]];
const talents:Record<string,{id:number;name:string;huchi?:string[];add_name?:string;add_v?:string|number;lv:number}>=buff.data;
const statLabels:Record<string,string>={'魅力':'Mị lực','悟性':'Ngộ tính','体质':'Thể chất','家境':'Gia cảnh','修为':'Tu vi','声望':'Danh vọng','身法':'Thân pháp','气运':'Khí vận'};
const seedKeys=Object.keys(statLabels).slice(0,4);
function readLife():Life|null{
 try{const data=JSON.parse(localStorage.getItem(saveKey)||'null');if(validLife(data))return data;}catch{}
 return null;
}
function validLife(data:Life|null):data is Life{
 return !!data&&typeof data.name==='string'&&Number.isInteger(data.year)&&data.year>=1&&!!data.stats&&
 Array.isArray(data.history)&&Array.isArray(data.talents)&&typeof data.ended==='boolean'&&
 (data.pending==null||!!records[data.pending])&&data.history.every(e=>!!records[e.id])&&
 Object.values(data.stats).every(Number.isFinite)&&!!data.seen && !!data.last && Array.isArray(data.queue) && data.queue.every(id=>!!records[id]) && Array.isArray(data.removed) && ['year','month'].includes(data.unit) && Number.isInteger(data.day) && Number.isInteger(data.month);
}
function fileSave(life:Life){
 const url=URL.createObjectURL(new Blob([JSON.stringify(life)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='Menh-do-WoYaoXiuZhen.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function Book(){
 const [search,setSearch]=useState(''),[page,setPage]=useState(0),[open,setOpen]=useState('');
 const list=Object.keys(records).filter(id=>(id+' '+textFor(id)[0]+' '+textFor(id)[1]).toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
 return <section className="folio"><div className="eyebrow">THƯ KHỐ</div><h2>Vạn sự tiên lục</h2><label>Tìm trong {Object.keys(records).length} mục <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);setOpen('')}} placeholder="Nhập tên, nội dung hoặc mã sự kiện"/></label>
 <p>{list.length} mục tìm thấy</p>{list.slice(page*12,page*12+12).map(id=><div className="bookrow" key={id}><button onClick={()=>setOpen(open===id?'':id)} aria-expanded={open===id}><small>#{id}</small> {textFor(id)[0]} <span>{open===id?'−':'+'}</span></button>{open===id&&<div><p>{textFor(id)[1]||'Nút điều kiện chuyển sang nhánh kế tiếp.'}</p>{textFor(id)[2].map((a,i)=><small key={i}>{i+1}. {a}　</small>)}</div>}</div>)}
 <div className="turnbar"><button disabled={!page} onClick={()=>setPage(page-1)}>← Trước</button><span>{page+1} / {Math.max(1,Math.ceil(list.length/12))}</span><button disabled={(page+1)*12>=list.length} onClick={()=>setPage(page+1)}>Sau →</button></div></section>
}
function drawTalents(){
 const pool=[...TALENTS], result:typeof TALENTS=[];
 while(pool.length&&result.length<10){
  const [next]=pool.splice(Math.floor(Math.random()*pool.length),1);
  const blocked=result.some(t=>talents[t.id].huchi?.includes(String(next.id))||talents[next.id].huchi?.includes(String(t.id)));
  if(!blocked)result.push(next);
 }
 return result;
}
function Birth({start}:{start:(s:Life)=>void}){
 const [name,setName]=useState('Tần Vô Danh'),[deck,setDeck]=useState(drawTalents),[ids,setIds]=useState<number[]>([]),[points,setPoints]=useState([5,5,5,5]);
 const picked=ids.map(id=>talents[id]);const pool=20+picked.reduce((n,t)=>n+(t.add_name==='可用点'?Number(t.add_v):0),0);
 const rest=pool-points.reduce((a,b)=>a+b,0);
 function begin(){const stats:Record<string,number>=Object.fromEntries(seedKeys.map((k,i)=>[k,points[i]]));
 for(const t of picked)if(t.add_name&&t.add_name!=='可用点')stats[t.add_name]=(stats[t.add_name]||0)+Number(t.add_v);
 start(engine.start({name:name.trim()||'Tần Vô Danh',stats,talents:picked.map(t=>t.name)}));}
 return <section className="folio"><div className="eyebrow">KHAI MỞ NHÂN SINH</div><h2>Định căn cốt</h2><label>Đạo hiệu<input maxLength={28} value={name} onChange={e=>setName(e.target.value)}/></label>
 <h3>Chọn tối đa ba thiên phú <small>{ids.length}/3</small></h3><button className="roll" onClick={()=>{setDeck(drawTalents());setIds([])}}>Rút lại thiên phú</button><div className="talentdeck">{deck.map(t=>{const active=ids.includes(t.id),x=talents[t.id];const conflict=picked.some(y=>y.id!==t.id&&(x.huchi?.includes(String(y.id))||y.huchi?.includes(String(t.id))));
 return <button type="button" key={t.id} aria-pressed={active} disabled={!active&&(conflict||ids.length===3)} onClick={()=>setIds(active?ids.filter(i=>i!==t.id):[...ids,t.id])}><small>{active?'Đã chọn · ':''}{TIERS[x.lv]}</small><b>{t.name}</b><span>{t.detail}</span></button>})}</div>
 <h3>Phân bổ căn cốt <small>Còn {rest} điểm</small></h3><button className="roll" onClick={()=>{const a=[0,0,0,0];for(let i=0;i<pool;i++){const choices=a.map((v,j)=>v<10?j:-1).filter(j=>j>=0);a[choices[Math.floor(Math.random()*choices.length)]]++;}setPoints(a)}}>Phân bổ ngẫu nhiên</button><div className="seedgrid">{seedKeys.map((k,i)=><div key={k}><span>{statLabels[k]}</span><button aria-label={'Giảm '+statLabels[k]} disabled={points[i]<=0} onClick={()=>setPoints(points.map((x,j)=>x-(j===i?1:0)))}>−</button><b>{points[i]}</b><button aria-label={'Tăng '+statLabels[k]} disabled={rest<=0||points[i]>=10} onClick={()=>setPoints(points.map((x,j)=>x+(j===i?1:0)))}>+</button></div>)}</div>
 <button className="goldbtn" disabled={rest!==0} onClick={begin}>Nhập thế →</button></section>
}
export default function Chronicle({back}:{back:()=>void}){
 const [life,setLife]=useState<Life|null>(readLife),[tab,setTab]=useState('play'),[creating,setCreating]=useState(false);
 const [music,setMusic]=useState(false),[note,setNote]=useState('');
 const audio=useRef<HTMLAudioElement>(null), upload=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(!life)return;try{localStorage.setItem(saveKey,JSON.stringify(life));}catch{setNote('Không thể tự lưu. Hãy xuất mệnh đồ để giữ tiến trình.')}},[life]);
 function commit(next:Life){setLife(next);setCreating(false);setTab('play');}
 function cue(name:string){if(music)void new Audio(import.meta.env.BASE_URL+'assets/sound/'+name+'.ogg').play().catch(()=>{});}
 function playMusic(){if(music){audio.current?.pause();setMusic(false);}else{audio.current?.play().then(()=>setMusic(true)).catch(()=>setNote('Thiết bị chưa cho phép phát nhạc.'));}}
 const ev=life?engine.current(life):null;const shown=ev?textFor(ev.id):null;
 return <div className="chronicle"><audio ref={audio} loop preload="none" src={import.meta.env.BASE_URL+'assets/sound/music.ogg'}/><div className="chronwrap">
 <header className="chronhead"><button onClick={()=>{cue('close');back()}}>← Trang đầu</button><span>NGÃ DỤC TU CHÂN</span><button aria-pressed={music} onClick={playMusic}>{music?'♫ Tắt nhạc':'♩ Bật nhạc'}</button></header>
 <div className="chrontitle"><span>QUYỂN I　/　MỆNH THƯ</span><h1>Một kiếp cầu tiên</h1><p>Nhất niệm nhập hồng trần, nhất tâm cầu đại đạo.</p></div>
 <nav className="chrontabs">{[['play','Mệnh đồ'],['journal','Ký sự'],['book','Tiên lục']].map(([k,v])=><button key={k} aria-pressed={tab===k} onClick={()=>setTab(k)}>{v}</button>)}</nav>
 {tab==='book'?<Book/>:tab==='journal'?<section className="folio"><div className="eyebrow">DẤU CHÂN TRÊN TIÊN LỘ</div><h2>Ký sự cuộc đời</h2>{!life?.history.length&&<p>Những việc đã trải qua sẽ được ghi lại tại đây.</p>}{life?.history.slice().reverse().map((e,i)=><details key={i}><summary>Năm {e.year}　·　{textFor(e.id)[0]}</summary><p>{textFor(e.id)[1]}</p>{e.choice!=null&&<i>{textFor(e.id)[2][e.choice]}</i>}</details>)}</section>:
 !life||creating?<Birth start={commit}/>:<section className="folio">
 <div className="eyebrow">{life.name}　·　{REALMS[Math.min(7,Math.max(0,life.stats['境界']||0))]?.name}</div>
 <h2>{life.ended?'Mệnh đồ khép lại':shown?shown[0]:'Năm tháng tu hành'}</h2><span className="datechip">Năm {life.year}{life.unit==='month'?' · Tháng '+life.month:''}</span>
 <p className="storytext">{life.ended?life.ending:shown?shown[1]:'Một trang mệnh thư đã khép. Đạo hữu có thể bước sang kỳ tiếp theo.'}</p>
 {!life.ended&&(ev?(shown?.[2].length?shown[2]:['Tiếp tục']).map((a,i)=><button className="decision" key={i} onClick={()=>{cue('menu');commit(engine.choose(life,i))}}><span>{String(i+1).padStart(2,'0')}</span>{a}<b>→</b></button>):<button className="goldbtn" onClick={()=>{cue('menu');commit(engine.advance(life))}}>{life.unit==='month'?'Sang tháng kế tiếp':'Sang năm kế tiếp'} →</button>)}
 <div className="chronstats">{Object.entries(statLabels).map(([k,v])=><div key={k}><small>{v}</small><b>{life.stats[k]||0}</b></div>)}</div></section>}
 {note&&<p role="status" className="chronnote">{note}</p>}
 <footer className="chronfoot">{life&&<button onClick={()=>fileSave(life)}>Xuất mệnh đồ</button>}<button onClick={()=>upload.current?.click()}>Nhập bản lưu</button>{life&&<button onClick={()=>{if(creating){setCreating(false);return;}if(confirm('Lập mệnh đồ mới? Bản lưu cũ sẽ được thay khi nhấn Nhập thế.')){setCreating(true);setTab('play');}}}>{creating?'Quay lại kiếp cũ':'Chuyển sinh'}</button>}
 <input type="file" accept=".json,application/json" hidden ref={upload} onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{const s=JSON.parse(await f.text());if(!validLife(s))throw Error();commit(s);setNote('Đã khôi phục mệnh đồ.')}catch{setNote('Bản lưu không hợp lệ.')}}}/></footer>
 </div></div>
}
