// Bộ diễn giải dữ liệu của APK. Giữ nguyên id hỗn hợp (10090 và "10090-1").
// ARM64 EventOneD.Init đặt rate=100, weight=5 và max_time=1 nếu bằng 0.
// Các quy ước chờ đối chiếu động: tháng -1 là bất kỳ và một lần rút mỗi lượt.
const baseNames = ['魅力', '悟性', '体质', '家境'];
const statNames = [...baseNames, '修为', '声望', '身法', '气运', '寿命', '境界', '炼丹次数', '炼器次数', '时间单位', '遗忘事件'];

function readValue(state, name) {
  if (name === '年') return state.year;
  if (name === '月') return state.month;
  if (name.startsWith('天赋_')) return Number(state.talents.includes(name.slice(3)));
  if (name.startsWith('事件_')) return Number((state.seen[name.slice(3)] ?? 0) > 0);
  return state.stats[name] ?? 0;
}

function compileCondition(expression) {
  return expression.split('&').map(term => {
    const part = /^(.+?)(>=|<=|=|>|<)(-?\d+)$/.exec(term);
    if (!part) throw new Error('Điều kiện chưa hỗ trợ: ' + term);
    return [part[1], part[2], Number(part[3])];
  });
}

function satisfies(state, [key, op, value]) {
  if (key === '月' && op === '=' && value === -1) return true;
  const actual = readValue(state, key);
  switch (op) {
    case '>=': return actual >= value;
    case '<=': return actual <= value;
    case '>': return actual > value;
    case '<': return actual < value;
    default: return actual === value;
  }
}

function branchPasses(event, index, state, rng) {
  if (!event.rand_k) return true;
  const thresholds = event.rand_v[index].split('~').map(Number);
  return event.rand_k[index].split('~').every((key, i) => {
    if (key === '无') return true;
    if (key === '随机') return rng() * 100 < thresholds[i];
    return readValue(state, key) >= thresholds[i];
  });
}

function copy(state) {
  return {...state, stats: {...state.stats}, seen: {...state.seen},
    last: {...state.last}, history: [...state.history], queue: [...state.queue]};
}

export function createEngine(config, removeConfig = {data:{}}) {
  const events = Object.values(config.data);
  const byId = new Map(events.map(event => [String(event.id), event]));
  const byName = new Map(events.map(event => [event.name, event]));
  const spontaneous = events.filter(event => event.appear_condi_s)
    .map(event => ({event, tests: compileCondition(event.appear_condi_s)}));

  function draw(state, rng) {
    const candidates = spontaneous.filter(({event, tests}) => {
      const limit = event.max_time || 1;
      if ((state.seen[event.name] ?? 0) >= limit) return false;
      if (state.removed.includes(event.name)) return false;
      if (state.day - (state.last[event.name] ?? -Infinity) < (event.cd ?? 0)) return false;
      if (!tests.every(test => satisfies(state, test))) return false;
      return !event.rate || 1 + Math.floor(rng() * 100) <= event.rate;
    });
    if (!candidates.length) return null;
    const priority = Math.max(...candidates.map(({event}) => event.priority ?? 0));
    const pool = candidates.filter(({event}) => (event.priority ?? 0) === priority);
    let roll = rng() * pool.reduce((total, {event}) => total + (event.weight || 5), 0);
    for (const {event} of pool) {
      roll -= event.weight || 5;
      if (roll < 0) return event.id;
    }
    return pool[pool.length - 1].event.id;
  }

  function start(options = {}, rng = Math.random) {
    const stats = Object.fromEntries(statNames.map(key => [key,
      options.stats?.[key] ?? (baseNames.includes(key) ? 1 + Math.floor(rng() * 10) : 0)]));
    const state = {name: options.name ?? 'Vô Danh', talents: [...(options.talents ?? [])],
      year: 1, month: 1, day: 0, unit: 'year', stats, seen: {}, last: {},
      removed: [], pending: null, queue: [], history: [], ended: false, ending: ''};
    state.pending = draw(state, rng);
    return settle(state, rng);
  }

  function advance(previous, rng = Math.random) {
    if (previous.ended || previous.pending != null) return previous;
    const state = copy(previous);
    state.day += state.unit === 'month' ? 30 : 360;
    state.year = 1 + Math.floor(state.day / 360);
    state.month = 1 + Math.floor(state.day / 30) % 12;
    if (state.stats['寿命'] > 0 && state.year > state.stats['寿命']) {
      state.ended = true;
      state.ending = 'Thọ nguyên đã tận';
    } else state.pending = draw(state, rng);
    return settle(state, rng);
  }

  function apply(state, key, delta) {
    const target = byName.get(key);
    if (target) {
      if (delta > 0) state.queue.push(target.id);
      return;
    }
    if (key === '大结局' || key === '游戏完结') {
      state.ended = true;
      state.ending = key === '大结局' ? 'Đại kết cục' : 'Mệnh đồ khép lại';
      return;
    }
    if (key === '时间单位') {
      state.unit = delta === 1 ? 'month' : 'year';
      state.stats[key] = delta;
    } else if (key === '遗忘事件') {
      const name = removeConfig.data?.[delta]?.r_event;
      if (name) state.removed = [...new Set([...state.removed, name])];
      state.stats[key] = delta;
    } else if (statNames.includes(key)) {
      state.stats[key] += delta;
    }
  }

  function resolve(state, event, index, rng) {
    state.seen[event.name] = (state.seen[event.name] ?? 0) + 1;
    state.last[event.name] = state.day;
    state.history.push({year: state.year, month: state.month, id: event.id, choice: index});
    if (event.fix_k) {
      const keys = event.fix_k[index].split('~');
      const amounts = event.fix_v[index].split('~').map(Number);
      const outcomes = event.f_r_type?.[index].split('~');
      const pass = branchPasses(event, index, state, rng);
      keys.forEach((key, i) => {
        if (!outcomes || outcomes[i] === (pass ? '0' : '1')) apply(state, key, amounts[i]);
      });
    }
    state.pending = state.ended ? null : (state.queue.shift() ?? null);
  }

  function choose(previous, index, rng = Math.random) {
    const event = current(previous);
    if (!event || previous.ended || !Number.isInteger(index) || index < 0 ||
        index >= (event.action?.length ?? 1)) return previous;
    const state = copy(previous);
    resolve(state, event, index, rng);
    return settle(state, rng);
  }

  function settle(state, rng) {
    // Các nút Pre chỉ định tuyến, không có lời truyện hay lựa chọn.
    const visited = new Set();
    while (state.pending != null) {
      const next = current(state);
      if (!next || next.explain || next.action?.length || visited.has(next.id)) break;
      visited.add(next.id);
      resolve(state, next, 0, rng);
    }
    return state;
  }

  function current(state) {
    return state.pending == null ? null : (byId.get(String(state.pending)) ?? null);
  }
  return {start, advance, choose, current};
}
