import assert from 'node:assert/strict';
import fs from 'node:fs';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const records=load('src/data/goc_config_event.json').data;
const texts=Object.assign({},...['a','b','c'].map(s=>load('src/original/vi-'+s+'.json')));
assert.deepEqual(Object.keys(texts).sort(),Object.keys(records).sort());
for(const [id,row] of Object.entries(records)){
 const [name,body,actions]=texts[id];
 assert.ok(name&&(!row.explain||body),'Thiếu nội dung '+id);
 assert.equal(actions.length,row.action?.length||0,'Sai số lựa chọn '+id);
 assert.ok(actions.every(a=>typeof a==='string'&&a.trim()),'Lựa chọn rỗng '+id);
 // Câu đố 11210 cần hiển thị ba chữ Hán để người chơi so sánh nét.
 const visible=[name,body,...actions].join(' ');
 const translated=id==='11210'?visible.replace(/[木移术]/g,''):visible;
 assert.ok(!/[\u3400-\u9fff]/.test(translated),'Chưa dịch '+id);

}
console.log('Khớp ID, lời kể và số lựa chọn cho',Object.keys(texts).length,'mục.');
