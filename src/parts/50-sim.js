/* ===== 50-sim: 戰局模擬（不碰畫面，可在 Node 裡單獨跑來調難度） ===== */
const GX0 = -38, GW = 76, GZ0 = -9, GH = L + 22, NCELL = GW * GH;
const BLUE_CAP = 5200, RED_CAP = 12000, BLUE_SOFT = 4600;
const POPDAMP = 0.88;          // 穿門後橫向噴散的每幀阻尼
const POP_T = 1 / 60 / (1 - POPDAMP);

function Swarm(cap) {
  return {
    cap, n: 0,
    x: new Float32Array(cap), z: new Float32Array(cap), t: new Float32Array(cap),
    y: new Float32Array(cap), vy: new Float32Array(cap), vl: new Float32Array(cap),
    spd: new Float32Array(cap), sk: new Float32Array(cap), ph: new Float32Array(cap),
    hp: new Int16Array(cap), kind: new Uint8Array(cap), fl: new Uint8Array(cap), gate: new Uint16Array(cap),
    cell: new Int32Array(cap), start: new Int32Array(NCELL + 1), cur: new Int32Array(NCELL + 1),
    items: new Int32Array(cap), rows: new Int32Array(GH)
  };
}
function copyUnit(s, i, j) {
  s.x[i] = s.x[j]; s.z[i] = s.z[j]; s.t[i] = s.t[j]; s.y[i] = s.y[j]; s.vy[i] = s.vy[j]; s.vl[i] = s.vl[j];
  s.spd[i] = s.spd[j]; s.sk[i] = s.sk[j]; s.ph[i] = s.ph[j]; s.hp[i] = s.hp[j]; s.kind[i] = s.kind[j];
  s.fl[i] = s.fl[j]; s.gate[i] = s.gate[j];
}
function compact(s) {
  let n = s.n, i = 0; const hp = s.hp;
  while (i < n) { if (hp[i] <= 0) { n--; if (i < n) copyUnit(s, i, n); } else i++; }
  s.n = n;
}
function buildGrid(s) {
  const st = s.start, n = s.n, cell = s.cell, hp = s.hp, sx = s.x, sz = s.z, rows = s.rows;
  st.fill(0); rows.fill(0);
  for (let i = 0; i < n; i++) {
    if (hp[i] <= 0) { cell[i] = -1; continue; }
    let gx = (sx[i] - GX0) | 0, gz = (sz[i] - GZ0) | 0;
    if (gx < 0) gx = 0; else if (gx >= GW) gx = GW - 1;
    if (gz < 0) gz = 0; else if (gz >= GH) gz = GH - 1;
    const c = gz * GW + gx; cell[i] = c; st[c + 1]++; rows[gz]++;
  }
  for (let c = 0; c < NCELL; c++) st[c + 1] += st[c];
  const cur = s.cur; cur.set(st);
  const items = s.items;
  for (let i = 0; i < n; i++) { const c = cell[i]; if (c >= 0) items[cur[c]++] = i; }
}

const S = {
  on: null,                      // 事件回呼（畫面與音效掛這裡）
  B: Swarm(BLUE_CAP), R: Swarm(RED_CAP),
  bigs: [], gates: [], peds: [], barrels: [], proj: [], marks: [], waves: [],
  state: 'idle', idx: 0, lv: null, time: 0, frame: 0,
  cannonX: 0, fireAcc: 0, fireRate: 8, recoil: 0, armor: 0,
  wallHp: 30, wallMax: 30, fort: { hp: 1, max: 1, alive: true, flash: 0 },
  hero: { on: true, t: 0, cd: 16, ready: 0, life: 5 },
  ult: { charge: 0, need: 600, cap: 500, active: false, t: 0, dur: 1.5, z0: 0, z1: 0, killed: 0 },
  flow: { rate: 0, acc: 0, shield: 0 },
  cata: { iv: 0, t: 0 },
  kills: 0, lost: 0, shots: 0, maxArmy: 0, coinsBig: 0,
  redMinZ: L, front: L, evi: 0, endT: 0, boss: null, bossDone: false, gateSeq: 0,
  up: { rate: 0, armor: 0, hero: 0, ult: 0, wall: 0 }, diff: null
};

function ev(a, b, c, d, e, f, g, h, i, j) { if (S.on) S.on(a, b, c, d, e, f, g, h, i, j); }

/* 赤潮的行軍速度只看位置：寬闊的高台上慢慢集結（vP），進了隘道加快（vC），衝進前庭後再加速撲向城牆。
   流量固定時，密度 = 流量 ÷（速度 × 路寬），所以出兵越多、整片赤潮就越擠。 */
const vTab = new Float32Array(RN);
function seaSpd(z, lv) {
  const k = S.diff.spd, vC = lv.vC * k, vP = lv.vP * k;
  if (z >= 68) return vP;
  if (z >= 57) return lerp(vC, vP, smooth((z - 57) / 11));
  if (z >= 27) return vC;
  return lerp(vC, vC * 1.6, clamp((27 - z) / 9, 0, 1));
}
function seaDen(z, lv) { return lv.flow * S.diff.flow / (seaSpd(z, lv) * 2 * (rhw(z) - LANE_PAD)); }
function buildSpeeds(lv) { for (let i = 0; i < RN; i++) vTab[i] = seaSpd(ZMIN + i * RDZ, lv); }

/* ---------- 生成 ---------- */
function addBlue(x, z, y, vy, vl, mask) {
  const s = S.B; if (s.n >= s.cap) return -1;
  const i = s.n++;
  s.z[i] = z; s.t[i] = laneT(x, z); s.x[i] = x; s.y[i] = y; s.vy[i] = vy; s.vl[i] = vl;
  s.spd[i] = BSPD * (0.93 + 0.14 * rnd()); s.hp[i] = 1; s.kind[i] = 0; s.gate[i] = mask;
  s.ph[i] = rnd() * 4; s.sk[i] = NaN; s.fl[i] = 0;
  return i;
}
const RED_HP = [1, 1, 3];       // 赤卒、狼騎、盾卒
const WOLF_SPD = 5.2;
// spd：赤卒與盾卒是「相對於該處行軍速度」的倍率；狼騎是絕對速度
function addRed(t, z, kind, tt) {
  const s = S.R; if (s.n >= s.cap) return -1;
  const i = s.n++;
  s.z[i] = z; s.t[i] = t; s.x[i] = laneX(t, z); s.y[i] = 0; s.vy[i] = 0; s.vl[i] = 0;
  s.spd[i] = (kind === 1 ? WOLF_SPD : 1) * (0.9 + 0.2 * rnd()); s.hp[i] = RED_HP[kind]; s.kind[i] = kind; s.gate[i] = 0;
  s.ph[i] = rnd() * 4; s.sk[i] = tt; s.fl[i] = 0;
  return i;
}
function spawnFromFort(kind, la, lb) {
  // 從敵城門口湧出，再橫向散開到各自的線道（線道用黃金比例數列排，才不會東一堆西一堆）
  S.spawnSeq = (S.spawnSeq + 0.6180339887) % 1;
  const tt = la + (lb - la) * S.spawnSeq;
  addRed(clamp(tt * 0.35 + (rnd() - 0.5) * 0.25, -1, 1), L - 0.6 - rnd() * 1.2, kind, tt);
}
function addBig(o) {
  o.flash = 0; o.anim = rnd() * 9; o.dead = false; o.cd = o.cd || 0; o.tm = 0; o.y = o.y || 0;
  o.maxHp = o.hp; S.bigs.push(o); return o;
}
function spawnBrute(lane) {
  const z = L - 2.5;
  ev('big', addBig({ team: 1, kind: 'brute', t: lane, z, x: laneX(lane, z), r: 0.95, hp: Math.round((S.lv.bruteHp || 30) * S.diff.hp), spd: 2.3, st: 'walk' }));
}
function spawnGiant(lane) {
  const z = L - 3;
  ev('big', addBig({ team: 1, kind: 'giant', t: lane, z, x: laneX(lane, z), r: 1.9, hp: Math.round((S.lv.giantHp || 400) * S.diff.hp), spd: 1.45, st: 'walk', cd: 1.5 }));
}
function spawnBoss() {
  const z = L - 3;
  S.boss = addBig({ team: 1, kind: 'boss', t: 0, z, x: laneX(0, z), r: 3.2, hp: Math.round((S.lv.bossHp || 2400) * S.diff.hp), spd: 1.5 * S.diff.spd, st: 'rise', cd: 3, sum: 5, rage: false });
  ev('boss', S.boss);
}

/* ---------- 擊殺 ---------- */
function killRed(j, cause, ox, oz, pow) {
  const r = S.R; r.hp[j] = 0; S.kills++;
  if (cause !== 2) S.ult.charge++;
  if (S.on) S.on('k', 1, r.kind[j], r.x[j], r.z[j], r.y[j], cause, ox, oz, pow);
}
function killBlue(i, cause, ox, oz, pow) {
  const b = S.B; b.hp[i] = 0; S.lost++;
  if (S.on) S.on('k', 0, 0, b.x[i], b.z[i], b.y[i], cause, ox, oz, pow);
}
// 範圍殺傷：team=1 殺赤潮、team=0 殺我軍
function blast(team, x, z, rad, cap, cause, pow) {
  const s = team ? S.R : S.B;
  const st = s.start, items = s.items, hp = s.hp, sx = s.x, sz = s.z, r2 = rad * rad;
  let gx0 = (x - rad - GX0) | 0, gx1 = (x + rad - GX0) | 0, gz0 = (z - rad - GZ0) | 0, gz1 = (z + rad - GZ0) | 0;
  if (gx0 < 0) gx0 = 0; if (gx1 >= GW) gx1 = GW - 1; if (gz0 < 0) gz0 = 0; if (gz1 >= GH) gz1 = GH - 1;
  let k = 0;
  for (let gz = gz0; gz <= gz1; gz++) {
    for (let gx = gx0; gx <= gx1; gx++) {
      const c = gz * GW + gx;
      for (let q = st[c], e = st[c + 1]; q < e; q++) {
        const j = items[q]; if (hp[j] <= 0) continue;
        const dx = sx[j] - x, dz = sz[j] - z;
        if (dx * dx + dz * dz < r2) {
          if (team) killRed(j, cause, x, z, pow); else killBlue(j, cause, x, z, pow);
          if (++k >= cap) return k;
        }
      }
    }
  }
  return k;
}
function countIn(s, x, z, rad) {
  const st = s.start, items = s.items, hp = s.hp, sx = s.x, sz = s.z, r2 = rad * rad;
  let gx0 = (x - rad - GX0) | 0, gx1 = (x + rad - GX0) | 0, gz0 = (z - rad - GZ0) | 0, gz1 = (z + rad - GZ0) | 0;
  if (gx0 < 0) gx0 = 0; if (gx1 >= GW) gx1 = GW - 1; if (gz0 < 0) gz0 = 0; if (gz1 >= GH) gz1 = GH - 1;
  let k = 0;
  for (let gz = gz0; gz <= gz1; gz++) for (let gx = gx0; gx <= gx1; gx++) {
    const c = gz * GW + gx;
    for (let q = st[c], e = st[c + 1]; q < e; q++) {
      const j = items[q]; if (hp[j] <= 0) continue;
      const dx = sx[j] - x, dz = sz[j] - z;
      if (dx * dx + dz * dz < r2) k++;
    }
  }
  return k;
}
function hurtBig(b, dmg) {
  if (b.dead || b.st === 'rise') return;
  if (b.kind === 'hero') { b.life -= dmg; b.flash = 0.12; return; }   // 大將挨打是扣出陣時間
  b.hp -= dmg; b.flash = 0.12;
  if (b.hp <= 0) {
    b.dead = true; b.hp = 0;
    if (b.team === 1) {
      S.kills++; S.coinsBig += b.kind === 'boss' ? 200 : b.kind === 'giant' ? 20 : 3;
      ev('bigdie', b);
      if (b.kind === 'boss') { S.boss = null; S.bossDone = true; winNow(); }
    }
  }
}
function blastBigs(team, x, z, rad, dmg) {
  const bs = S.bigs;
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i]; if (b.dead || b.team !== team || b.st === 'fly') continue;
    const dx = b.x - x, dz = b.z - z, rr2 = rad + b.r;
    if (dx * dx + dz * dz < rr2 * rr2) hurtBig(b, dmg);
  }
}
function wallHit(dmg, x) {
  if (S.state !== 'play') return;
  S.wallHp -= dmg; ev('wall', x, dmg);
  if (S.wallHp <= 0) { S.wallHp = 0; S.state = 'lost'; S.endT = 0; ev('lose'); return; }
  // 城牆剩一半時，守軍點燃烽火反擊一次：把前庭的赤潮整片燒退
  const bn = S.burn;
  if (!bn.used && S.wallHp <= S.wallMax * 0.5) { bn.used = true; bn.active = true; bn.t = 0; ev('beacon'); }
}
function stepBurn(dt) {
  const bn = S.burn; if (!bn.active) return;
  bn.t += dt; const zf = bn.z1 * Math.min(1, bn.t / bn.dur);
  const r = S.R, n = r.n; let k = 0;
  for (let j = 0; j < n && k < 60; j++) if (r.hp[j] > 0 && r.z[j] <= zf) { killRed(j, 1, r.x[j], r.z[j] - 2, 8); k++; }
  for (const b of S.bigs) if (b.team === 1 && !b.dead && !b.burned && b.z <= zf) { b.burned = true; hurtBig(b, b.maxHp * (b.kind === 'boss' ? 0.05 : 0.4)); }
  bn.zf = zf;
  if (bn.t >= bn.dur + 0.3) bn.active = false;
}
function winNow() {
  if (S.state !== 'play') return;
  S.state = 'won'; S.endT = 0; ev('win');
}
// 敵城的數字是「兵力」：每湧出一個兵就少一點，我軍衝進城門也會扣。
// 光靠出兵只會降到 floor（守門的最後一批），剩下的一定要我軍殺進去才算攻破。
function fortStage() {
  const f = S.fort, q = f.hp / f.max;
  while (f.stage < 3 && q <= 0.75 - f.stage * 0.25) {
    f.stage++;
    S.waves.push({ left: S.lv.rally || 60, rate: 60, kind: 1, a: -0.9, b: 0.9 });
    ev('rally', f.stage);
  }
}
function fortSpend(n) {
  const f = S.fort; if (f.hp <= f.floor) return false;
  f.hp = Math.max(f.floor, f.hp - n); fortStage();
  if (f.hp <= f.floor && !f.dry) { f.dry = true; ev('dry'); }
  return true;
}
function fortHit(dmg, x) {
  const f = S.fort; if (!f.alive || S.state !== 'play') return;
  f.hp -= dmg; f.flash = 1; ev('fh', x, dmg);
  fortStage();
  if (f.hp > 0 && f.hp <= f.floor && !f.dry) { f.dry = true; ev('dry'); }
  if (f.hp <= 0) {
    f.hp = 0; f.alive = false; ev('fortdie');
    if (S.lv.boss && !S.bossDone) spawnBoss(); else winNow();
  }
}

/* ---------- 開局 ---------- */
// 難度只動敵方：出兵量、行軍速度、大傢伙的血量，以及我方城牆厚度
const DIFFS = [{ flow: 0.78, spd: 0.82, hp: 0.8, wall: 1.35 }, { flow: 1, spd: 1, hp: 1, wall: 1 }, { flow: 1.22, spd: 1.2, hp: 1.25, wall: 0.85 }];
function simInit(idx, up, seed, diff) {
  const lv = LEVELS[idx], D = DIFFS[diff === undefined ? 1 : diff];
  S.diff = D;
  srand(seed || (9000 + idx * 131));
  buildRoad(lv.road);
  S.idx = idx; S.lv = lv; S.time = 0; S.frame = 0; S.state = 'play'; S.endT = 0;
  S.B.n = 0; S.R.n = 0; S.bigs.length = 0; S.proj.length = 0; S.marks.length = 0; S.waves.length = 0;
  S.up = up = up || { rate: 0, armor: 0, hero: 0, ult: 0, wall: 0 };
  S.fireRate = 8 * (1 + 0.1 * up.rate); S.fireAcc = 0; S.recoil = 0; S.cannonX = 0;
  S.armor = 0.06 * up.armor;
  S.wallMax = S.wallHp = Math.round((30 + 8 * up.wall) * D.wall);
  const garrison = Math.round(lv.fort * D.flow);
  S.fort = { hp: garrison, max: garrison, floor: Math.round(garrison * 0.08), alive: true, flash: 0, stage: 0, dry: false };
  S.hero = { on: lv.heroCd > 0, t: lv.heroCd * 0.5, cd: lv.heroCd * (1 - 0.06 * up.hero), ready: 0, life: 4 + 0.6 * up.hero };
  S.ult = { charge: 0, need: Math.round(lv.ultNeed * (1 - 0.07 * up.ult)), cap: Math.round(lv.ultCap * (1 + 0.14 * up.ult)), active: false, t: 0, dur: 1.5, z0: 0, z1: 0, killed: 0, uses: 0 };
  S.surge = { t: lv.surge ? lv.surge.at : 1e9, on: 0, n: 0 }; S.redMul = 1;
  S.burn = { used: false, active: false, t: 0, dur: 0.9, z1: 30, zf: 0 };
  S.flow = { rate: lv.flow * D.flow, acc: 0, shield: lv.shield || 0 };
  buildSpeeds(lv); S.spawnSeq = rnd();
  S.cata = { iv: lv.cata || 0, t: (lv.cata || 0) * 0.6 };
  S.kills = 0; S.lost = 0; S.shots = 0; S.maxArmy = 0; S.coinsBig = 0; S.evi = 0;
  S.redMinZ = L; S.front = L; S.boss = null; S.bossDone = false; S.gateSeq = 0;
  S.gates = []; for (const g of lv.gates) addGate(g);
  S.peds = (lv.peds || []).map((p) => ({ x: p.x, z: p.z, r: 1.7, need: p.need, got: 0, built: false, kind: p.kind, cool: 1, aim: 0, kick: 0, flash: 0 }));
  S.barrels = (lv.barrels || []).map((b) => ({ t: b.t, z: b.z, x: laneX(b.t, b.z), hp: b.hp || 8, max: b.hp || 8, alive: true, fuse: -1, flash: 0 }));
  // 開局的赤潮：從敵城一路鋪到戰線起點，用抖動過的格點排，才不會有空洞
  for (let z = lv.front0; z < L - 0.8;) {
    const d = seaDen(z, lv), dz = 1.25 / Math.sqrt(d), w = 2 * (rhw(z) - LANE_PAD);
    let c = d * w * dz; c = (c | 0) + (rnd() < c - (c | 0) ? 1 : 0);
    const off = rnd();
    for (let k = 0; k < c; k++) {
      const t = ((k + off + (rnd() - 0.5) * 0.7) / c) * 2 - 1;
      addRed(clamp(t, -1, 1), z + (rnd() - 0.5) * dz * 0.8, rnd() < (lv.shield || 0) ? 2 : 0, NaN);
    }
    z += dz;
  }
  buildGrid(S.R); buildGrid(S.B);
}
function addGate(g) {
  const id = S.gateSeq++ & 15;
  const o = {
    id, bit: 1 << id, z: g.z, x: g.x, x0: g.x, w: g.w, m: g.m, kind: g.m < 1 ? 1 : g.gold ? 2 : 0,
    amp: g.amp || 0, per: g.per || 6, ph: g.ph || 0, cap: g.cap || 1e9, cap0: g.cap || 0, life: g.life || 1e9, alive: true,
    flash: 0, cnt: 0, born: S.time, sp: (0.7 + 0.65 * Math.sqrt(Math.max(1, g.m))) / POP_T
  };
  S.gates.push(o); return o;
}

/* ---------- 我軍索敵 ---------- */
function seek(x, z) {
  // 赤潮的大傢伙優先
  const bs = S.bigs; let bx = NaN, best = 1e9;
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i]; if (b.team !== 1 || b.dead) continue;
    const dz = b.z - z; if (dz < -2 || dz > 13) continue;
    const dx = b.x - x, ad = dx < 0 ? -dx : dx; if (ad > 13) continue;
    const sc = ad + dz * 0.3; if (sc < best) { best = sc; bx = b.x; }
  }
  if (bx === bx) return bx;
  const r = S.R, st = r.start, items = r.items, hp = r.hp, rx = r.x;
  let gz = (z - GZ0) | 0, gx = (x - GX0) | 0;
  for (let dz = -1; dz <= 4; dz++) {
    const cz = gz + dz; if (cz < 0 || cz >= GH) continue;
    if (r.rows[cz] === 0) continue;
    const row = cz * GW; const pen = dz < 0 ? 0.8 : dz * 0.75;
    let lo = gx - 4, hi = gx + 4; if (lo < 0) lo = 0; if (hi >= GW) hi = GW - 1;
    for (let c = row + lo, ce = row + hi; c <= ce; c++) {
      for (let q = st[c], e = st[c + 1]; q < e; q++) {
        const j = items[q]; if (hp[j] <= 0) continue;
        let d = rx[j] - x; if (d < 0) d = -d; d += pen;
        if (d < best) { best = d; bx = rx[j]; }
      }
    }
    if (best < 1.3) break;
  }
  return bx;
}

function passGate(i, g) {
  const b = S.B; b.gate[i] |= g.bit;
  if (g.m < 1) {                       // 紅色折兵門
    g.flash = 1; g.cnt++;
    if (rnd() < 1 - g.m) killBlue(i, 4, b.x[i], b.z[i], 0);
    ev('gbad', g);
    return;
  }
  const x = b.x[i], z = b.z[i], m = g.m, sp = g.sp, mask = b.gate[i];
  let made = 0;
  for (let c = 1; c < m; c++) {
    if (b.n >= BLUE_SOFT) break;
    addBlue(x + (rnd() - 0.5) * 0.3, z + (rnd() - 0.75) * 0.9, 0.01, 3 + rnd() * 3.6, (rnd() * 2 - 1) * sp, mask);
    made++;
  }
  b.vl[i] = (rnd() * 2 - 1) * sp * 0.6; b.vy[i] = 2.6; b.y[i] = 0.01;
  g.cnt += made; g.flash = 1;
  ev('g', g, x, z, made);
  if (g.cap < 1e9 && --g.cap <= 0) { g.alive = false; ev('gend', g); }
}

/* ---------- 每幀：我軍 ---------- */
function stepBlue(dt) {
  const b = S.B, r = S.R, n = b.n, fr = S.frame, minZ = S.redMinZ;
  const rst = r.start, ritems = r.items, rhp = r.hp, rxx = r.x, rzz = r.z;
  const gates = S.gates, peds = S.peds, bars = S.barrels, armor = S.armor;
  let gz0 = 1e9, gz1 = -1e9;
  for (let k = 0; k < gates.length; k++) { const g = gates[k]; if (g.alive) { if (g.z < gz0) gz0 = g.z; if (g.z > gz1) gz1 = g.z; } }
  let maxZ = -1e9;
  for (let i = 0; i < n; i++) {
    if (b.hp[i] <= 0) continue;
    let z = b.z[i], y = b.y[i];
    if (y > 0 || b.vy[i] > 0) {
      b.vy[i] -= 26 * dt; y += b.vy[i] * dt;
      if (y <= 0) { y = 0; b.vy[i] = 0; }
      b.y[i] = y;
    }
    const zp = z; z += b.spd[i] * dt;
    const hwE = rhw(z) - LANE_PAD;
    let t = b.t[i], vl = b.vl[i];
    if (vl !== 0) { t += vl * dt / hwE; vl *= POPDAMP; if (vl > -0.15 && vl < 0.15) vl = 0; b.vl[i] = vl; }
    if (z > minZ - 7) {
      if (((i + fr) & 7) === 0) b.sk[i] = seek(b.x[i], z);
      const sk = b.sk[i];
      if (sk === sk) { let dx = sk - b.x[i]; const m = 7 * dt; if (dx > m) dx = m; else if (dx < -m) dx = -m; t += dx / hwE; }
    }
    if (t > 1) t = 1; else if (t < -1) t = -1;
    const x = rcx(z) + t * hwE;
    b.t[i] = t; b.x[i] = x; b.z[i] = z;
    if (z > maxZ) maxZ = z;

    if (z >= gz0 && zp < gz1 + 0.01) {
      for (let k = 0; k < gates.length; k++) {
        const g = gates[k];
        if (g.alive && zp < g.z && z >= g.z && !(b.gate[i] & g.bit)) {
          const dx = x - g.x; if (dx < g.w * 0.5 && dx > -g.w * 0.5) { passGate(i, g); if (b.hp[i] <= 0) break; }
        }
      }
      if (b.hp[i] <= 0) continue;
    }
    for (let k = 0; k < peds.length; k++) {
      const p = peds[k]; if (p.built) continue;
      const dz = z - p.z, dx = x - p.x;
      if (dz > -p.r && dz < p.r && dx > -p.r && dx < p.r) {
        b.hp[i] = 0; p.got++; p.flash = 1; ev('feed', p, x, z);
        if (p.got >= p.need) { p.built = true; p.cool = 0.6; ev('built', p); }
        break;
      }
    }
    if (b.hp[i] <= 0) continue;
    for (let k = 0; k < bars.length; k++) {
      const q = bars[k]; if (!q.alive || q.fuse >= 0) continue;
      const dz = z - q.z, dx = x - q.x;
      if (dz > -1.1 && dz < 1.1 && dx > -1.1 && dx < 1.1) {
        b.hp[i] = 0; q.hp--; q.flash = 1; ev('bhit', q);
        if (q.hp <= 0) q.fuse = 0.25;
        break;
      }
    }
    if (b.hp[i] <= 0) continue;

    if (z > minZ - 1.3 && y < 1.3) {
      let gx = (x - GX0) | 0, gz = (z - GZ0) | 0;
      outer:
      for (let cz = gz - 1; cz <= gz + 1; cz++) {
        if (cz < 0 || cz >= GH) continue;
        const row = cz * GW;
        for (let cx = gx - 1; cx <= gx + 1; cx++) {
          if (cx < 0 || cx >= GW) continue;
          const c = row + cx;
          for (let q = rst[c], e = rst[c + 1]; q < e; q++) {
            const j = ritems[q]; if (rhp[j] <= 0) continue;
            const dx = rxx[j] - x, dz = rzz[j] - z;
            if (dx * dx + dz * dz < HIT2) {
              if (--rhp[j] <= 0) killRed(j, 0, x, z, 0);
              else { rzz[j] += 0.4; r.fl[j] = 7; ev('clank', rxx[j], rzz[j]); }
              if (rnd() >= armor) killBlue(i, 0, rxx[j], rzz[j], 0);
              else { b.z[i] -= 0.25; b.fl[i] = 6; }
              break outer;
            }
          }
        }
      }
      if (b.hp[i] <= 0) continue;
    }
    if (z >= L - 1) {
      b.hp[i] = 0;
      if (S.fort.alive) fortHit(1, x);
    }
    if (b.fl[i] > 0) b.fl[i]--;
  }
  S.blueMaxZ = maxZ;
}

/* ---------- 每幀：赤潮 ---------- */
function stepRed(dt) {
  const r = S.R, n = r.n, mul = S.redMul; let minZ = 1e9;
  for (let i = 0; i < n; i++) {
    if (r.hp[i] <= 0) continue;
    let f = (r.z[i] - ZMIN) / RDZ; if (f < 0) f = 0; else if (f > RN - 1) f = RN - 1;
    const z = r.z[i] - (r.kind[i] === 1 ? r.spd[i] : r.spd[i] * vTab[f | 0] * mul) * dt;
    let t = r.t[i]; const tt = r.sk[i];
    if (tt === tt) { const d = tt - t, m = 0.3 * dt; if (d > m) t += m; else if (d < -m) t -= m; else { t = tt; r.sk[i] = NaN; } r.t[i] = t; }
    r.x[i] = rcx(z) + t * (rhw(z) - LANE_PAD); r.z[i] = z;
    if (z < minZ) minZ = z;
    if (r.fl[i] > 0) r.fl[i]--;
    if (z <= WALLZ + 1.1) { r.hp[i] = 0; wallHit(1, r.x[i]); }
  }
  S.redMinZ = minZ;
}

/* ---------- 大型單位 ---------- */
// 大傢伙碰到小兵：小兵陣亡、自己扣血；回傳碰到幾個
function bigVsSoldiers(o, capN, kb) {
  const s = o.team ? S.B : S.R;
  const st = s.start, items = s.items, hp = s.hp, sx = s.x, sz = s.z;
  const rad = o.r + RAD, r2 = rad * rad, x = o.x, z = o.z;
  let gx0 = (x - rad - GX0) | 0, gx1 = (x + rad - GX0) | 0, gz0 = (z - rad - GZ0) | 0, gz1 = (z + rad - GZ0) | 0;
  if (gx0 < 0) gx0 = 0; if (gx1 >= GW) gx1 = GW - 1; if (gz0 < 0) gz0 = 0; if (gz1 >= GH) gz1 = GH - 1;
  let k = 0;
  for (let gz = gz0; gz <= gz1; gz++) for (let gx = gx0; gx <= gx1; gx++) {
    const c = gz * GW + gx;
    for (let q = st[c], e = st[c + 1]; q < e; q++) {
      const j = items[q]; if (hp[j] <= 0) continue;
      const dx = sx[j] - x, dz = sz[j] - z;
      if (dx * dx + dz * dz < r2) {
        if (o.team) killBlue(j, 5, x, z, 5); else killRed(j, 1, x, z, 9);
        k++;
        if (o.team) { o.z = Math.min(o.z + kb, L - 3); hurtBig(o, 1); if (o.dead) return k; }
        if (k >= capN) return k;
      }
    }
  }
  return k;
}
function stepBigs(dt) {
  const bs = S.bigs;
  for (let i = 0; i < bs.length; i++) {
    const o = bs[i]; if (o.dead) continue;
    o.anim += dt; if (o.flash > 0) o.flash -= dt;
    if (o.kind === 'hero') { stepHero(o, dt); continue; }
    if (o.kind === 'boss') { stepBoss(o, dt); continue; }
    // 蠻兵、巨魔
    const giant = o.kind === 'giant';
    if (o.st === 'smash') {
      o.tm -= dt;
      if (o.tm <= 0) {
        blast(0, o.x, o.z - 1.2, 3.9, 45, 1, 8); blastBigs(0, o.x, o.z - 1.2, 3.9, 1.2);
        ev('smash', o.x, o.z - 1.2, 3.9, 1);
        o.st = 'walk'; o.cd = 2.3;
      }
      bigVsSoldiers(o, 6, 0.02);
      continue;
    }
    o.z -= o.spd * dt; o.x = laneX(o.t, o.z);
    bigVsSoldiers(o, giant ? 6 : 4, giant ? 0.03 : 0.13);
    if (o.dead) continue;
    if (giant) {
      o.cd -= dt;
      if (o.cd <= 0 && countIn(S.B, o.x, o.z - 1.2, 3.7) >= 6) { o.st = 'smash'; o.tm = 0.55; ev('windup', o); }
    }
    if (o.z <= WALLZ + 1.4 + o.r * 0.4) { o.dead = true; ev('bigwall', o); wallHit(giant ? 12 : 3, o.x); }
  }
  for (let i = bs.length - 1; i >= 0; i--) if (bs[i].dead) bs.splice(i, 1);
}
function nearestRedBig(o, range) {
  const bs = S.bigs; let best = null, bd = range * range;
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i]; if (b.team !== 1 || b.dead) continue;
    const dx = b.x - o.x, dz = b.z - o.z; if (dz < -3) continue;
    const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = b; }
  }
  return best;
}
function stepHero(o, dt) {
  if (o.st === 'fly') {
    o.tm += dt; const p = Math.min(1, o.tm / o.dur);
    o.z = lerp(o.z0, o.z1, p); o.x = lerp(o.x0, laneX(o.t, o.z1), p); o.y = 1 + 9 * 4 * p * (1 - p);
    if (p >= 1) {
      o.y = 0; o.st = 'ramp';
      const k = blast(1, o.x, o.z, 3.8, 400, 1, 13); blastBigs(1, o.x, o.z, 3.8, 40);
      ev('heroland', o.x, o.z, 3.8, k);
    }
    return;
  }
  o.life -= dt;
  const tgt = nearestRedBig(o, 10);
  let fighting = false;
  if (tgt) {
    const dx = tgt.x - o.x, dz = tgt.z - o.z, reach = o.r + tgt.r + 0.2;
    if (dx * dx + dz * dz < reach * reach) {
      fighting = true; hurtBig(tgt, 110 * dt); o.hitT = (o.hitT || 0) - dt;
      if (o.hitT <= 0) { o.hitT = 0.22; ev('herohit', (o.x + tgt.x) / 2, (o.z + tgt.z) / 2); }
    } else {
      const hwE = rhw(o.z) - LANE_PAD; const m = 5 * dt;
      o.t = clamp(o.t + clamp(dx, -m, m) / hwE, -1, 1);
    }
  }
  if (!fighting) o.z += 5 * dt;
  if (o.z > L - 2.2) { o.z = L - 2.2; if (S.fort.alive) { o.fa = (o.fa || 0) + 30 * dt; while (o.fa >= 1) { o.fa--; fortHit(1, o.x); } } }
  o.x = laneX(o.t, o.z);
  bigVsSoldiers(o, 60, 0);
  if (o.life <= 0 || S.state !== 'play') {
    const k = blast(1, o.x, o.z, 4.2, 400, 1, 14); blastBigs(1, o.x, o.z, 4.2, 40);
    o.dead = true; ev('heroend', o.x, o.z, 4.2, k);
  }
}
function stepBoss(o, dt) {
  if (o.st === 'rise') { o.tm += dt; if (o.tm > 2.2) { o.st = 'walk'; o.tm = 0; } return; }
  if (!o.rage && o.hp < o.maxHp * 0.5) { o.rage = true; o.spd *= 1.35; ev('rage', o); }
  if (o.st === 'smash') {
    o.tm -= dt;
    if (o.tm <= 0) {
      blast(0, o.x, o.z - 2, 5.8, 90, 1, 10); blastBigs(0, o.x, o.z - 2, 5.8, 2);
      ev('smash', o.x, o.z - 2, 5.8, 2);
      o.st = 'walk'; o.cd = o.rage ? 1.7 : 2.4;
    }
    bigVsSoldiers(o, 10, 0);
    return;
  }
  o.z -= o.spd * dt; o.x = laneX(o.t, o.z);
  bigVsSoldiers(o, 10, 0.012);
  if (o.dead) return;
  o.cd -= dt; o.sum -= dt; o.fb = (o.fb === undefined ? 3 : o.fb) - dt;
  if (o.cd <= 0 && countIn(S.B, o.x, o.z - 2, 5.6) >= 8) { o.st = 'smash'; o.tm = 0.6; ev('windup', o); }
  if (o.fb <= 0) {
    // 魔王朝我軍最密的地方丟火球
    o.fb = o.rage ? 3 : 4.5;
    const d = densest(S.B, 12, 6, Math.max(8, o.z - 7));
    if (d) throwAt('fire', o.x, o.z - 2, 8, d.x, d.z, 3.1, 1.25);
  }
  if (o.sum <= 0) {
    o.sum = o.rage ? 6 : 8; const nSum = o.rage ? 110 : 70;
    for (let k = 0; k < nSum; k++) {
      const a = rnd() * TAU, d = 2 + rnd() * 5;
      const z = o.z + Math.sin(a) * d * 0.7 - 2, x = o.x + Math.cos(a) * d;
      addRed(laneT(x, z), z, 1, NaN);
    }
    ev('roar', o);
  }
  if (o.z <= WALLZ + 4) { o.z = WALLZ + 4; if (S.state === 'play') { ev('bigwall', o); wallHit(999, o.x); } }
}

/* ---------- 砲塔、投射物、火藥桶 ---------- */
function pickRedNearFront(tries) {
  const r = S.R; let best = -1, bz = 1e9;
  if (r.n === 0) return -1;
  for (let k = 0; k < tries; k++) { const j = (rnd() * r.n) | 0; if (r.hp[j] > 0 && r.z[j] < bz && r.z[j] > 3) { bz = r.z[j]; best = j; } }
  return best;
}
function densest(s, tries, zLo, zHi) {
  let bx = NaN, bz = NaN, bc = 0;
  if (s.n === 0) return null;
  for (let k = 0; k < tries; k++) {
    const j = (rnd() * s.n) | 0; if (s.hp[j] <= 0) continue;
    const z = s.z[j]; if (z < zLo || z > zHi) continue;
    const c = countIn(s, s.x[j], z, 2.2); if (c > bc) { bc = c; bx = s.x[j]; bz = z; }
  }
  return bc > 0 ? { x: bx, z: bz, c: bc } : null;
}
function stepPeds(dt) {
  const ps = S.peds;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    if (p.flash > 0) p.flash -= dt * 4; if (p.kick > 0) p.kick -= dt * 5;
    if (!p.built) continue;
    p.cool -= dt; if (p.cool > 0) continue;
    if (p.kind === 'ballista') {
      let tx = NaN, tz = NaN;
      const bg = nearestRedBig({ x: p.x, z: p.z }, 70);
      if (bg) { tx = bg.x; tz = bg.z; } else { const j = pickRedNearFront(10); if (j >= 0) { tx = S.R.x[j]; tz = S.R.z[j]; } }
      if (tx !== tx) { p.cool = 0.3; continue; }
      const a0 = Math.atan2(tx - p.x, tz - p.z); p.aim = a0; p.kick = 1;
      for (let k = -1; k <= 1; k++) {
        const a = a0 + k * 0.07;
        S.proj.push({ kind: 'bolt', x: p.x, z: p.z + 0.8, vx: Math.sin(a) * 58, vz: Math.cos(a) * 58, pierce: 9, life: 1.6 });
      }
      p.cool = 0.75; ev('bolt', p);
    } else {
      const d = densest(S.R, 14, 6, 84);
      if (!d) { p.cool = 0.4; continue; }
      p.kick = 1; p.aim = Math.atan2(d.x - p.x, d.z - p.z);
      S.proj.push({ kind: 'shell', x: p.x, z: p.z, x0: p.x, z0: p.z, x1: d.x, z1: d.z, t: 0, dur: 1.15, y: 0 });
      p.cool = 3.2; ev('mortar', p);
    }
  }
}
function stepProj(dt) {
  const ps = S.proj;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    if (p.kind === 'bolt') {
      // 一幀飛將近 1 格，分兩段掃才不會穿過去沒打到
      for (let sub = 0; sub < 2 && p.pierce > 0; sub++) {
        p.x += p.vx * dt * 0.5; p.z += p.vz * dt * 0.5;
        p.pierce -= blast(1, p.x, p.z, 0.75, p.pierce, 1, 5);
        const bs = S.bigs;
        for (let k = 0; k < bs.length; k++) {
          const b = bs[k]; if (b.team !== 1 || b.dead) continue;
          const dx = b.x - p.x, dz = b.z - p.z;
          if (dx * dx + dz * dz < b.r * b.r) { hurtBig(b, 6); p.pierce -= 3; ev('spark', p.x, p.z); break; }
        }
      }
      p.life -= dt;
      if (p.pierce <= 0 || p.life <= 0 || p.z > L || p.z < 0) ps.splice(i, 1);
    } else {
      p.t += dt; const q = Math.min(1, p.t / p.dur);
      p.x = lerp(p.x0, p.x1, q); p.z = lerp(p.z0, p.z1, q); p.y = (p.h || 14) * 4 * q * (1 - q) + (p.y0 || 0) * (1 - q);
      if (q >= 1) {
        ps.splice(i, 1);
        if (p.kind === 'shell') {
          const k = blast(1, p.x, p.z, 3.4, 90, 1, 11); blastBigs(1, p.x, p.z, 3.4, 25);
          ev('boom', p.x, p.z, 3.4, k, 0);
        } else {
          // 敵方落石／魔王火球
          const k = blast(0, p.x, p.z, p.rad, 70, 1, 10); blastBigs(0, p.x, p.z, p.rad, 1);
          ev('boom', p.x, p.z, p.rad, k, p.kind === 'fire' ? 2 : 1);
        }
      }
    }
  }
  const ms = S.marks;
  for (let i = ms.length - 1; i >= 0; i--) { ms[i].t += dt; if (ms[i].t >= ms[i].dur) ms.splice(i, 1); }
}
function stepBarrels(dt) {
  const bs = S.barrels;
  for (let i = 0; i < bs.length; i++) {
    const q = bs[i]; if (!q.alive) continue;
    if (q.flash > 0) q.flash -= dt * 4;
    if (q.fuse >= 0) {
      q.fuse -= dt;
      if (q.fuse <= 0) {
        q.alive = false;
        const k = blast(1, q.x, q.z, 5.6, 400, 1, 15); blast(0, q.x, q.z, 3.2, 60, 1, 12);
        blastBigs(1, q.x, q.z, 5.6, 60);
        ev('boom', q.x, q.z, 5.6, k, 3);
        for (let j = 0; j < bs.length; j++) {
          const o = bs[j]; if (!o.alive || o.fuse >= 0) continue;
          const dx = o.x - q.x, dz = o.z - q.z;
          if (dx * dx + dz * dz < 81) o.fuse = 0.18 + rnd() * 0.12;
        }
      }
    }
  }
}
function throwAt(kind, sx, sz, sy, tx, tz, rad, dur) {
  S.marks.push({ x: tx, z: tz, r: rad, t: 0, dur, kind });
  S.proj.push({ kind, x: sx, z: sz, x0: sx, z0: sz, x1: tx, z1: tz, t: 0, dur, y: sy, y0: sy, h: 16, rad });
  ev('throw', kind, tx, tz);
}

/* ---------- 萬箭齊發 ---------- */
function simUlt() {
  const u = S.ult;
  if (S.state !== 'play' || u.active || u.charge < u.need) return false;
  u.active = true; u.t = 0; u.killed = 0; u.charge = 0; u.uses++;
  u.z0 = Math.max(1.5, S.front - 3); u.z1 = Math.min(L - 1, u.z0 + 32);
  for (const b of S.bigs) b.ulted = false;
  ev('ult', u.z0, u.z1);
  return true;
}
function stepUlt(dt) {
  const u = S.ult; if (!u.active) return;
  u.t += dt; const p = Math.min(1, u.t / u.dur), zw = lerp(u.z0, u.z1, p);
  const r = S.R, n = r.n; let frameK = 0;
  for (let j = 0; j < n && u.killed < u.cap && frameK < 46; j++) {
    if (r.hp[j] <= 0) continue;
    const z = r.z[j];
    if (z <= zw && z >= u.z0 - 4) { killRed(j, 2, r.x[j], z, 0); u.killed++; frameK++; }
  }
  for (const b of S.bigs) {
    if (b.team === 1 && !b.dead && !b.ulted && b.z <= zw && b.z >= u.z0 - 4) { b.ulted = true; hurtBig(b, b.maxHp * (b.kind === 'boss' ? 0.06 : 0.3)); }
  }
  if (p >= 1 || u.killed >= u.cap) { u.active = false; ev('ultend', u.killed); }
}

/* ---------- 主迴圈 ---------- */
function runScript(dt) {
  const sc = S.lv.script;
  while (S.evi < sc.length && sc[S.evi].t <= S.time) {
    const e = sc[S.evi++];
    switch (e.f) {
      case 'wave': S.waves.push({ left: e.n, rate: e.n / (e.dur || 1), kind: e.kind === undefined ? 1 : e.kind, a: e.a === undefined ? -1 : e.a, b: e.b === undefined ? 1 : e.b }); if (e.say) ev('say', e.say, 1); break;
      case 'brute': if (S.fort.dry || !S.fort.alive) break; for (let k = 0; k < e.n; k++) { spawnBrute(e.lane === undefined ? rnd() * 1.6 - 0.8 : e.lane); fortSpend(4); } if (e.say) ev('say', e.say, 1); break;
      case 'giant': if (S.fort.dry || !S.fort.alive) break; spawnGiant(e.lane === undefined ? rnd() * 1.2 - 0.6 : e.lane); fortSpend(25); ev('say', e.say || '巨魔來襲', 1); break;
      case 'gold': ev('gold', addGate({ z: e.z, x: e.x, w: e.w || 4.4, m: e.m, gold: true, cap: e.cap, life: e.life || 14, amp: e.amp || 0, per: e.per || 5, ph: e.ph || 0 })); break;
      case 'flow': S.flow.rate = S.lv.flow * S.diff.flow * e.mul; if (e.shield !== undefined) S.flow.shield = e.shield; if (e.say) ev('say', e.say, 1); break;
      case 'cata': S.cata.iv = e.iv; S.cata.t = e.iv * 0.5; if (e.say) ev('say', e.say, 1); break;
      case 'say': ev('say', e.say, e.tone || 0); break;
    }
  }
  const f = S.flow, ft = S.fort, sg = S.surge, sdef = S.lv.surge;
  // 總攻：每隔一陣子敵軍加速衝鋒、出兵量暴增，戰線會被壓回來
  if (sg.on > 0) { sg.on -= dt; if (sg.on <= 0) S.redMul = 1; }
  else if (sdef && ft.alive && !ft.dry && (sg.t -= dt) <= 0) { sg.on = sdef.dur; sg.t = sdef.every; sg.n++; S.redMul = sdef.spd || 1.5; ev('surge', sg.n); }
  if (ft.alive && !ft.dry) {
    // 兵力越少越是傾巢而出
    f.acc += f.rate * (1 + 0.5 * (1 - ft.hp / ft.max)) * (sg.on > 0 ? sdef.mul : 1) * dt;
    while (f.acc >= 1) { f.acc--; if (fortSpend(1)) spawnFromFort(rnd() < f.shield ? 2 : 0, -1, 1); }
  }
  const ws = S.waves;
  for (let i = ws.length - 1; i >= 0; i--) {
    const w = ws[i]; w.acc = (w.acc || 0) + w.rate * dt;
    while (w.acc >= 1 && w.left > 0) { w.acc--; w.left--; if (ft.alive && fortSpend(1)) spawnFromFort(w.kind, w.a, w.b); else w.left = 0; }
    if (w.left <= 0) ws.splice(i, 1);
  }
  const c = S.cata;
  if (c.iv > 0 && S.fort.alive) {
    c.t -= dt;
    if (c.t <= 0) {
      c.t = c.iv * (0.8 + rnd() * 0.4);
      const d = densest(S.B, 12, 8, 86);
      if (d) throwAt('rock', rr(-6, 6), L + 2, 9, d.x, d.z, 2.7, 1.5);
    }
  }
}
function stepGates(dt) {
  const gs = S.gates;
  for (let i = gs.length - 1; i >= 0; i--) {
    const g = gs[i];
    if (g.flash > 0) g.flash -= dt * 5;
    if (!g.alive) { g.gone = (g.gone || 0) + dt; if (g.gone > 0.6) gs.splice(i, 1); continue; }
    if (g.amp) g.x = g.x0 + g.amp * tri((S.time - g.born) / g.per + g.ph);
    if (g.life < 1e9) { g.life -= dt; if (g.life <= 0) { g.alive = false; ev('gend', g); } }
  }
}
function simStep(dt) {
  if (S.state === 'idle') return;
  S.frame++; S.time += dt;
  buildGrid(S.R); buildGrid(S.B);
  // 戰線：從我方算起，赤潮累積到 12 人的那一排；人少的時候就看最前面的殘兵與大傢伙
  {
    const rows = S.R.rows; let acc = 0, f = L;
    for (let g = 0; g < GH; g++) { acc += rows[g]; if (acc >= 12) { f = g + GZ0; break; } }
    if (acc < 12 && S.redMinZ < f) f = Math.floor(S.redMinZ);
    for (const b of S.bigs) if (b.team === 1 && !b.dead && b.z - b.r < f) f = Math.floor(b.z - b.r);
    S.front = f;
  }
  const playing = S.state === 'play';
  if (playing) {
    runScript(dt);
    // 兵砲
    S.fireAcc += S.fireRate * dt; if (S.recoil > 0) S.recoil -= dt * 9;
    while (S.fireAcc >= 1) {
      S.fireAcc--; S.shots++;
      addBlue(S.cannonX + (rnd() - 0.5) * 0.3, CANZ + 0.9, 1.25, 3.2, 0, 0);
      S.recoil = 1; ev('shot', S.cannonX);
    }
    const h = S.hero;
    if (h.on) {
      if (h.ready > 0) {
        h.ready -= dt;
        if (h.ready <= 0) {
          const tz = clamp(S.front + 2, 14, L - 9);
          const o = addBig({ team: 0, kind: 'hero', x: S.cannonX, x0: S.cannonX, z: CANZ + 1, z0: CANZ + 1, z1: tz, t: laneT(S.cannonX, 12), y: 1, r: 1.5, hp: 1, st: 'fly', dur: 0.8 + tz / 70, life: h.life });
          ev('hero', o); h.t = 0;
        }
      } else { h.t += dt; if (h.t >= h.cd) { h.ready = 0.9; ev('heroready'); } }
    }
  } else S.endT += dt;

  stepGates(dt);
  stepBlue(dt);
  stepRed(dt);
  stepBigs(dt);
  stepPeds(dt);
  stepBarrels(dt);
  stepProj(dt);
  stepUlt(dt);
  stepBurn(dt);
  if (S.fort.flash > 0) S.fort.flash -= dt * 6;

  if (S.state === 'won') {
    // 敵城一倒，殘兵從城門往外一波波潰散
    const zc = L - S.endT * 55; const r = S.R; let k = 0;
    for (let j = 0; j < r.n && k < 70; j++) if (r.hp[j] > 0 && r.z[j] >= zc) { killRed(j, 1, r.x[j], r.z[j] + 2, 9); k++; }
    for (const b of S.bigs) if (b.team === 1 && !b.dead && b.z >= zc) { b.dead = true; ev('bigdie', b); }
  }
  compact(S.B); compact(S.R);
  const army = S.B.n; if (army > S.maxArmy) S.maxArmy = army;
}
