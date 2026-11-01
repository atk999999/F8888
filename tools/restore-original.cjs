// Khôi phục tài nguyên Unity/ảnh Android từ bản sao dữ liệu APK, không phụ thuộc thư viện.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const root = path.resolve(__dirname,'..');
const archive = path.join(root,'archive','WoYaoXiuZhen_1.8.apk');
const target = path.join(root,'public','original');
const marker = path.join(target,'.restored80mb');
// Các đoạn FSB5 là những lát dữ liệu nguyên vẹn trong sharedassets*.resource.
function restoreAudio(){
 const out=path.join(root,'public','assets','audio');
 const clips=[
  ['menu.fsb','sharedassets0.resource',0,1248],
  ['close.fsb','sharedassets0.resource',1248,3104],
  ['bg.fsb','sharedassets1.resource',0,3748544],
 ];
 for(const [name,source,offset,length] of clips){
  const dest=path.join(out,name);
  if(fs.existsSync(dest)&&fs.statSync(dest).size===length)continue;
  const origin=path.join(target,'assets','bin','Data',source);
  if(!fs.existsSync(origin))throw Error('Chưa khôi phục tài nguyên âm thanh: '+origin);
  const data=fs.readFileSync(origin).subarray(offset,offset+length);
  if(data.length!==length||data.toString('ascii',0,4)!=='FSB5')throw Error('Lỗi âm thanh gốc: '+name);
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(dest,data);
 }
}

const buffer = fs.readFileSync(archive);
const digest = crypto.createHash('sha256').update(buffer).digest('hex');
if (fs.existsSync(marker) && fs.readFileSync(marker,'utf8').trim()===digest) {
 restoreAudio(); console.log('Tài nguyên và âm thanh APK đã được phục hồi từ trước.'); process.exit(0);
}
let eocd=-1;
for(let p=buffer.length-22;p>=Math.max(0,buffer.length-65557);p--) {
 if(buffer.readUInt32LE(p)===0x06054b50){eocd=p;break;}
}
if(eocd<0)throw Error('Không tìm thấy ZIP End Of Central Directory');
const count=buffer.readUInt16LE(eocd+10);
let pos=buffer.readUInt32LE(eocd+16), extracted=0;
for(let i=0;i<count;i++){
 if(buffer.readUInt32LE(pos)!==0x02014b50)throw Error('Invalid ZIP central directory at '+pos);
 const method=buffer.readUInt16LE(pos+10), compSize=buffer.readUInt32LE(pos+20);
 const size=buffer.readUInt32LE(pos+24),nl=buffer.readUInt16LE(pos+28),ex=buffer.readUInt16LE(pos+30),cm=buffer.readUInt16LE(pos+32);
 const offset=buffer.readUInt32LE(pos+42), name=buffer.subarray(pos+46,pos+46+nl).toString('utf8');
 pos+=46+nl+ex+cm;
 // Only Unity/Android resources needed for the web asset catalogue are extracted.
 if(!(name.startsWith('assets/')||(/\.(png|webp|gif)$/i.test(name)&&name.startsWith('res/'))))continue;
 if(name.includes('..')||name.startsWith('/')||name.includes('\\'))throw Error('Invalid entry path '+name);
 if(buffer.readUInt32LE(offset)!==0x04034b50)throw Error('Corrupt local file header: '+name);
 const localNameLen=buffer.readUInt16LE(offset+26),localExtraLen=buffer.readUInt16LE(offset+28);
 const start=offset+30+localNameLen+localExtraLen;
 const compressed=buffer.subarray(start,start+compSize);
 const data=method===0?compressed:method===8?zlib.inflateRawSync(compressed):null;
 if(!data||data.length!==size)throw Error('Invalid entry data: '+name);
 const dest=path.join(target,name);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,data); extracted++;
}
fs.mkdirSync(target,{recursive:true});restoreAudio();fs.writeFileSync(marker,digest+'\n');
console.log('Đã phục hồi '+extracted+' tài nguyên gốc vào public/original (không chứa font).');
