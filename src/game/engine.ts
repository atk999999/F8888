import { ENCOUNTERS, STORY_EVENTS } from './events';
import { REALMS, TALENTS } from './talents';
import type { Cultivator, GameChoice, GameLog, GameSave, ItemKey, NumericKey, StoryEvent } from './types';
export const SAVE_KEY = 'tutien789_react_save_v1';
export const ACTIONS = [
 {id:'gather',name:'Thổ nạp linh khí',icon:'🧘',desc:'Vận chuyển chu thiên, hấp thụ thiên địa linh khí.',cost:1},
 {id:'retreat',name:'Bế quan tham ngộ',icon:'☯️',desc:'Đóng cửa tĩnh tu, gia tăng tu vi, có cơ duyên ngộ đạo.',cost:2},
 {id:'herbs',name:'Tìm kiếm linh thảo',icon:'🌱',desc:'Thâm nhập rừng sâu, thu thập dược liệu quý.',cost:1},
 {id:'work',name:'Hành nghề kiếm sống',icon:'⚒️',desc:'Tích lũy linh thạch và củng cố gia nghiệp.',cost:1},
 {id:'body',name:'Tôi luyện nhục thân',icon:'💪',desc:'Rèn gân cốt, cường hóa thể phách.',cost:1},
 {id:'travel',name:'Du lịch nhân gian',icon:'🗺️',desc:'Hành tẩu bốn phương, tìm kỳ ngộ tu chân.',cost:1},
 {id:'alchemy',name:'Luyện chế đan dược',icon:'⚗️',desc:'Tiêu hao linh thảo để chế tạo Hồi Nguyên Đan.',cost:1},
 {id:'comprehend',name:'Tham ngộ bí pháp',icon:'📚',desc:'Bồi dưỡng ngộ tính và đạo tâm.',cost:1},
] as const;
export type ActionId = (typeof ACTIONS)[number]['id'];
const clamp = (n:number,lo:number,hi:number) => Math.min(hi,Math.max(lo,n));
const coin = (n:number) => Math.round(n);
export const ageLife = (c:Cultivator) => 70 + c.realm*60 + c.theChat*3;
export function realmProgress(c:Cultivator) {
 const next = REALMS[Math.min(c.realm+1, REALMS.length-1)];
 const current = REALMS[Math.min(c.realm, REALMS.length-1)].need;
 return {current,next,ratio:clamp((c.tuVi-current)/Math.max(1,next.need-current),0,1)};
}
export function createCharacter(name:string, gender:'Nam'|'Nữ', origin:string, talents:number[]):Cultivator {
 const base = origin==='Quý tộc' ? {giaCanh:8,ngoTinh:4,theChat:4,khiVan:5,miLuc:6} : origin==='Tán tu' ? {giaCanh:3,ngoTinh:6,theChat:5,khiVan:6,miLuc:4} : {giaCanh:4,ngoTinh:5,theChat:5,khiVan:5,miLuc:5};
 const c:Cultivator = {
  name:(name.trim()||'Tần Vô Danh').slice(0,28),gender,origin,talents,theChat:base.theChat,ngoTinh:base.ngoTinh,khiVan:base.khiVan,miLuc:base.miLuc,giaCanh:base.giaCanh,
  tuVi:0,linhThach:30+base.giaCanh*4,danhVong:0,daoTam:5,sinhLuc:100,theLuc:5,age:1,realm:0,sect:'Chưa nhập môn',vocation:'Phàm nhân',
  items:{linhThao:2,trucCoDan:1,hoiNguyenDan:1,coBao:0,tinhThach:0,tinhThanQuyet:0},flags:[],seen:[],
  history:[],alive:true,completed:false
 };
 for(const id of talents) {
  const t=TALENTS.find(x=>x.id===id);if(!t?.bonus)continue;
  for(const [k,val] of Object.entries(t.bonus)) (c as unknown as Record<string,number>)[k] += val as number;
 }
 c.history=[{age:1,title:'Nhân sinh khai mở',content:`${c.name} giáng sinh trong một gia tộc họ Tần. Bánh xe mệnh số bắt đầu chuyển động.`,type:'story'}];
 return c;
}
export function clone(c:Cultivator):Cultivator {
 return {...c,items:{...c.items},flags:[...c.flags],seen:[...c.seen],history:[...c.history]};
}
export function record(c:Cultivator,title:string,content:string,type:GameLog['type']='action') {
 c.history.unshift({age:c.age,title,content,type});
 c.history=c.history.slice(0,120);
}
export function change(c:Cultivator,effect?:Partial<Record<NumericKey,number>>) {
 if(!effect)return;
 for(const [k,v] of Object.entries(effect)) {
  const key = k as NumericKey;
  if(typeof v!=='number'||!Number.isFinite(v))continue;
  (c as unknown as Record<string,number>)[key] += v;
 }
 c.theChat=clamp(c.theChat,1,999); c.ngoTinh=clamp(c.ngoTinh,1,999); c.khiVan=clamp(c.khiVan,0,999);
 c.miLuc=clamp(c.miLuc,0,999); c.giaCanh=clamp(c.giaCanh,0,999); c.tuVi=Math.max(0,coin(c.tuVi));
 c.linhThach=Math.max(0,coin(c.linhThach)); c.danhVong=Math.max(0,coin(c.danhVong));
 c.daoTam=clamp(c.daoTam,-999,999);c.sinhLuc=clamp(c.sinhLuc,0,100);c.theLuc=clamp(c.theLuc,0,5);
 if(c.sinhLuc<=0) {c.alive=false;record(c,'Đạo đồ đoạn tuyệt','Thân thể không chống nổi thiên địa kiếp nạn. Một đời tu hành khép lại.','danger');}
}
export function pickYearEvent(c:Cultivator):StoryEvent|null {
 const matches = STORY_EVENTS.filter(ev=>ev.age===c.age && !c.seen.includes(ev.id) && (ev.id!=='inherit-pill'||c.talents.includes(21)) && (
  !ev.cond || (ev.cond==='highFamily'&&c.giaCanh>=7) ||
  (ev.cond==='lowFamily'&&c.giaCanh<=3) ||
  (ev.cond==='normalFamily'&&c.giaCanh>3&&c.giaCanh<7) ||
  (ev.cond==='starPath'&&c.flags.includes('hoa-hoa')) ||
  (ev.cond==='sect'&&c.sect!=='Chưa nhập môn') ||
  (ev.cond==='noSect'&&c.sect==='Chưa nhập môn')));
 if(matches.length)return matches[0];
 return null;
}
export function randomEncounter():StoryEvent {return ENCOUNTERS[Math.floor(Math.random()*ENCOUNTERS.length)];}
export function canChoose(c:Cultivator, choice:GameChoice):boolean {
 return !Object.entries(choice.need||{}).some(([k,v])=>(c as unknown as Record<string,number>)[k]<v) &&
 !Object.entries(choice.itemEffect||{}).some(([k,v])=>(v as number)<0&&c.items[k as ItemKey]<-(v as number));
}
export function choiceResolution(c0:Cultivator,ev:StoryEvent,chosen:GameChoice):{c:Cultivator;message:string} {
 const c=clone(c0);
 if(!canChoose(c,chosen)) return {c,message:'Điều kiện không đủ. Hãy tìm lựa chọn khác.'};
 const probability = chosen.probability===undefined ? 1 : clamp(chosen.probability+(c.khiVan-5)*0.012+(c.ngoTinh-5)*0.006+(c.realm*.018),0.08,0.95);
 const success=Math.random()<probability;
 if(success){change(c,chosen.effect);if(chosen.itemEffect)for(const [k,n] of Object.entries(chosen.itemEffect)) c.items[k as ItemKey]=Math.max(0,c.items[k as ItemKey]+n);
  if(chosen.sect)c.sect=chosen.sect;if(chosen.flag&&!c.flags.includes(chosen.flag))c.flags.push(chosen.flag);
 }else change(c,chosen.failEffect);
 if(!c.seen.includes(ev.id) && ev.kind!=='encounter')c.seen.push(ev.id);
 const extra=success ? (chosen.success||'Ngươi đã chọn con đường của mình. Mệnh số âm thầm đổi thay.') : (chosen.failure||'Thiên cơ khó dò. Lần này cơ duyên chưa đến.');
 record(c,ev.title,`${chosen.label}. ${extra}`,success?'story':'danger');
 return {c,message:extra};
}
export function spendYear(c0:Cultivator):{c:Cultivator;event:StoryEvent|null;message:string} {
 const c=clone(c0);
 if(!c.alive||c.completed)return {c,event:null,message:'Mệnh đồ đã kết thúc.'};
 c.age+=1;c.theLuc=5;c.sinhLuc=clamp(c.sinhLuc+(c.realm>=1?9:5),0,100);
 if(c.talents.includes(14))c.tuVi+=3;
 if(c.talents.includes(16))c.linhThach+=3;
 if(c.talents.includes(26)&&c.age===30)c.giaCanh+=3;
 if(c.talents.includes(15)&&c.age===25)c.linhThach+=100;
 if(c.age>ageLife(c)) {
  c.alive=false;record(c,'Thọ nguyên đã tận',`Tuổi thọ ${ageLife(c)} năm đã chạm giới hạn, linh thức trở về với cát bụi.`,'danger');
  return {c,event:null,message:'Thọ nguyên đã tận. Xin đạo hữu mở một kiếp nhân sinh mới.'};
 }
 const ev=(c.age===50 && c.talents.includes(21)) ? STORY_EVENTS.find(x=>x.id==='inherit-pill')||null : pickYearEvent(c);
 // No game events may bypass the player choice, and no network is needed.
 record(c,`Năm thứ ${c.age}`,ev?'Bánh xe vận mệnh chuyển đến một bước ngoặt mới.':'Một năm lại trôi qua trên con đường cầu đạo.','story');
 return {c,event:ev,message:ev?'Một thiên mệnh mới đang chờ đạo hữu.':`Bước sang tuổi ${c.age}, linh lực đã hồi phục.`};
}
export function performAction(c0:Cultivator,id:ActionId):{c:Cultivator;event:StoryEvent|null;message:string} {
 const c=clone(c0),act=ACTIONS.find(x=>x.id===id)!;
 if(!c.alive||c.completed)return {c,event:null,message:'Mệnh đồ đã kết thúc.'};
 if(c.theLuc<act.cost)return {c,event:null,message:'Tinh lực đã cạn. Hãy sang năm tiếp theo.'};
 if(c.age<5 && id!=='comprehend'&&id!=='body')return {c,event:null,message:'Tuổi thơ còn non nớt, hãy tham ngộ hoặc rèn thể trước.'};
 if(id==='alchemy'&&c.items.linhThao<2)return {c,event:null,message:'Cần ít nhất 2 linh thảo để khai lò luyện đan.'};
 c.theLuc-=act.cost;
 const grow=1+Math.floor(c.ngoTinh/8)+Math.floor(c.realm/2);
 let message='';let event:StoryEvent|null=null;
 switch(id){
  case 'gather':{const n=4+grow*2+Math.floor(Math.random()*5);change(c,{tuVi:n});message=`Đạo hữu vận chuyển chu thiên, hấp thu ${n} điểm tu vi.`;break;}
  case 'retreat':{const n=14+grow*4+Math.floor(Math.random()*10);change(c,{tuVi:n,daoTam:1});message=`Bế quan lĩnh hội đạo pháp, tu vi tăng ${n}.`;break;}
  case 'herbs':{const n=1+Math.floor(Math.random()*3);c.items.linhThao+=n;message=`Tìm được ${n} cây linh thảo tại sơn lâm.`;if(Math.random()<0.16)c.items.tinhThach+=1;break;}
  case 'work':{const n=12+Math.floor(c.giaCanh*2)+Math.floor(Math.random()*12);change(c,{linhThach:n,giaCanh:0});message=`Chuyên tâm hành nghề, tích lũy thêm ${n} linh thạch.`;break;}
  case 'body':{change(c,{theChat:1,sinhLuc:12,tuVi:2});message='Tôi luyện khí huyết, thể chất tăng 1 và sinh lực được bồi dưỡng.';break;}
  case 'travel':{event=randomEncounter();message='Thiên địa mênh mông. Trước mắt xuất hiện một cơ duyên bất ngờ.';break;}
  case 'alchemy':{c.items.linhThao-=2;const success=Math.random()<clamp(.62+c.ngoTinh*.015,.55,.95);if(success){c.items.hoiNguyenDan+=1;message='Đan hỏa hòa hợp, luyện thành một viên Hồi Nguyên Đan!';}else{message='Đan hỏa mất kiểm soát, một lò linh thảo hóa thành tro bụi.';change(c,{ngoTinh:1});}break;}
  case 'comprehend':{change(c,{ngoTinh:1,daoTam:2,tuVi:2});message='Tĩnh tâm đọc kinh, ngộ tính cùng đạo tâm đều tiến triển.';break;}
 }
 record(c,act.name,message,'action');
 return {c,event,message};
}
export function breakthrough(c0:Cultivator,preferPill:boolean):{c:Cultivator;event:null;message:string} {
 const c=clone(c0);const next=REALMS[c.realm+1];
 if(!next || c.completed)return {c,event:null,message:'Đã đạt đến tận cùng cảnh giới hiện có.'};
 if(c.tuVi<next.need)return {c,event:null,message:`Chưa đủ tu vi! Cần đạt ${next.need} tu vi để phá cảnh.`};
 if(c.theLuc<1)return {c,event:null,message:'Cần 1 tinh lực để nếm thử phá quan.'};
 if(preferPill&&c.items.trucCoDan<=0)return {c,event:null,message:'Trong túi không còn Trúc Cơ Đan.'};
 c.theLuc-=1;if(preferPill)c.items.trucCoDan-=1;
 const chance=clamp(.53+c.ngoTinh*.015+c.khiVan*.01+(preferPill?.24:0),.55,.97),success=Math.random()<chance;
 if(success){c.realm+=1;change(c,{tuVi:4,ngoTinh:1,theChat:1,sinhLuc:35,daoTam:2});
  const msg=`Thiên địa rung chuyển! Ngươi đã đột phá ${next.name}, thọ nguyên được kéo dài.`;
  record(c,`ĐỘT PHÁ · ${next.name}`,msg,'realm');
  if(c.realm===REALMS.length-1){c.completed=true;record(c,'Phi thăng tiên giới','Tiên môn mở rộng. Đạo hữu chứng đắc trường sinh, đại đạo đã thành!','realm');}
  return {c,event:null,message:msg};
 }
 const lost=Math.min(c.tuVi,5+Math.ceil(next.need*.07));change(c,{tuVi:-lost,sinhLuc:-(preferPill?7:17)});
 const msg=`Đột phá ${next.name} thất bại, kinh mạch phản phệ. Mất ${lost} tu vi.`;
 record(c,'Phá cảnh thất bại',msg,'danger');return {c,event:null,message:msg};
}
export function useItem(c0:Cultivator,item:ItemKey):{c:Cultivator;message:string} {
 const c=clone(c0);if(!c.alive)return {c,message:'Nguyên thần đã tịch diệt.'};
 if(c.items[item]<=0)return {c,message:'Không có vật phẩm này trong túi.'};
 const effects:{[K in ItemKey]?:Partial<Record<NumericKey,number>>}={hoiNguyenDan:{sinhLuc:38},linhThao:{sinhLuc:8},coBao:{tuVi:16},tinhThach:{tuVi:12},tinhThanQuyet:{tuVi:30,ngoTinh:1}};
 if(item==='trucCoDan')return {c,message:'Trúc Cơ Đan được sử dụng ở mục Đột phá cảnh giới.'};
 const eff=effects[item];if(!eff)return {c,message:'Vật phẩm chưa thể sử dụng.'};
 c.items[item]--;change(c,eff);const msg='Đã sử dụng vật phẩm, linh lực biến chuyển trong kinh mạch.';
 record(c,'Dùng vật phẩm',msg,'reward');return {c,message:msg};
}
export function exportSave(s:GameSave):string{return JSON.stringify(s,null,2);}
export function parseSave(raw:string):GameSave|null {
 try {const s=JSON.parse(raw) as GameSave;
  if(s?.version!==1 || !s.cultivator || !Array.isArray(s.cultivator.history)||!s.cultivator.items || !Array.isArray(s.cultivator.seen))return null;
  if(typeof s.cultivator.name!=='string'||typeof s.cultivator.age!=='number'||typeof s.cultivator.realm!=='number')return null;
  return s;
 }catch{return null;}
}
