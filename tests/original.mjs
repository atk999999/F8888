import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngine} from '../src/original/rules.mjs';

const config = JSON.parse(fs.readFileSync(new URL('../src/data/goc_config_event.json', import.meta.url)));
const rows = Object.values(config.data);
const engine = createEngine(config);
const rng = () => 0.15;
const birth = engine.start({name:'Tần Vân',stats:{'修为':0}}, rng);

assert.equal(engine.current(birth).id, 10000);
assert.equal(engine.advance(birth), birth);
assert.equal(engine.choose(birth, -1), birth);
const born = engine.choose(birth, 0, rng);
assert.equal(born.history[0].id, 10000);
assert.equal(birth.history.length, 0);
assert.equal(born.pending, null);
assert.ok([10001, 10002, 10003, 10004].includes(engine.advance(born, rng).pending));

// Original chain: age 16, battle, success, prologue ends, monthly date starts.
const battle = {...born, year:16, day:15*360,pending:11036,stats:{...born.stats,'修为':2}};
let state = engine.choose(battle, 0, rng);
assert.equal(state.pending, 11038);
assert.equal(state.stats['修为'], 3);
state = engine.choose(state, 0, rng);
assert.equal(state.pending, 11041);
state = engine.choose(state, 0, rng);
assert.equal(state.unit, 'month');
state = engine.advance(state, rng);
assert.equal(state.year, 16);
assert.equal(state.month, 2);
assert.ok([11031,11077].includes(state.pending)); // Simulated injection skipped the original trigger.
const failed = engine.choose({...battle,stats:{...battle.stats,'修为':1}}, 0,rng);
assert.equal(failed.pending, 11039);
const dead = engine.choose(failed,0,rng);
assert.equal(dead.ended, true);
assert.equal(engine.advance(dead,rng), dead);
assert.equal(engine.choose({...battle,pending:15055},0,rng).ending,'Đại kết cục');

// ID suffixes, multiple gate keys and RNG extremes.
const fork = {...born,pending:'10092-2',talents:['我是谁？']};
assert.equal(engine.current(fork).id, '10092-2');
assert.equal(engine.current(engine.choose(fork,0,()=>0)).name, '上仙血脉');
assert.equal(engine.current(engine.choose(fork,0,()=>0.999)).name, '神龙血脉');
assert.equal(engine.current(engine.choose({...fork,talents:[]},0,()=>0)).name, '神龙血脉');

// Exercise every source option and both RNG extremes; verify all effect tokens resolve.
const names = new Set(rows.map(row=>row.name));
const known = new Set([...Object.keys(born.stats),'大结局','游戏完结']);
let branches = 0;
for (const row of rows) {
  for (const keys of row.fix_k ?? []) {
    for (const key of keys.split('~')) assert.ok(names.has(key) || known.has(key), row.id+': '+key);
  }
  for (let i=0;i<(row.action?.length??1);i++) {
    branches++;
    for (const random of [0,0.999]) {
      const resolved = engine.choose({...born,pending:row.id},i,()=>random);
      assert.equal(resolved.history.at(born.history.length).id,row.id);
      assert.ok(resolved.pending == null || engine.current(resolved));
      assert.ok(Object.values(resolved.stats).every(Number.isFinite));
    }
  }
}
assert.equal(rows.length,824);
assert.equal(branches,936);
console.log('OK: 824 mục, 936 lựa chọn/lượt xác nhận, 1.872 lượt kiểm tra kết quả; lịch, điều kiện và kết cục đã kiểm tra bằng tình huống riêng.');
