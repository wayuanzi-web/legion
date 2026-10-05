/* ===== 52-march: 「行軍」玩法 =====
   部隊留在畫面下方，整個世界往下捲；所有座標都是視野座標（z = 離隊尾那條線多遠）。
   關卡是一條路線：track 裡每個項目的 d 是它離起點的距離，捲到視野上緣（MZ_SPAWN）時進場。
   部隊會自動放箭；兵一碰到敵人就同歸於盡，跟破陣玩法一樣。 */
const MZ_DRAGON = 112, MZ_BOSS = 48;      // 赤龍進場的距離（比一般物件近，最後一次俯衝結束後才現身）、停下來決戰的位置
const MZ_REAR = 1.6, MZ_SPAWN = 168, MZ_OUT = -7, MZ_STOP = 56, ARROW_SPD = 46, ARROW_LIFE = 0.87, ARROW_LIFE_BOSS = 1.06, ARROW_CAP = 44, ARROW_CAP_BOSS = 72;
// 每秒幾箭。行軍途中有上限，不然人一多什麼都不用躲；打赤龍時放寬，兵越多、龍掉血越快
const arrowRate = (n, wpn) => Math.min(S.boss && S.boss.fixed ? ARROW_CAP_BOSS : ARROW_CAP, (1.5 + Math.sqrt(n)) * WPN_RATE[wpn]);
const WPN_RATE = [1, 1.55, 2.2, 3], WPN_DMG = [1, 1, 2, 2];
// 隊形用向日葵排列：第 i 個位置在半徑 √(i+0.5)、角度 i×黃金角。人數變動時只是整團放大縮小，不會重排
const SUNX = new Float32Array(BLUE_CAP), SUNZ = new Float32Array(BLUE_CAP);
for (let i = 0; i < BLUE_CAP; i++) { const r = Math.sqrt(i + 0.5), a = i * 2.399963229728653; SUNX[i] = r * Math.cos(a); SUNZ[i] = r * Math.sin(a); }

const SAY_ALERT = { pack: 1, brute: 1, giant: 1, hole: 1, saw: 1 };      // 這幾種東西附帶的提示用紅色警告樣式，其餘是一般說明
function marchInit(lv, up) {
  const hw = rhw(0);
  S.mode = 1; S.blueMaxZ = MZ_REAR; S.flow.rate = 0;
  S.sq = { x: 0, v: 0, vMax: lv.speed || 7.5, dist: 0, hw, a: 1, b: 1, cz: MZ_REAR + 1, kx: 0.34, kz: 0.34, front: MZ_REAR + 2, fireAcc: 0, wpn: 0, siege: false, hold: false, rescue: false, len: lv.len - (lv.boss === 'dragon' ? MZ_BOSS : MZ_STOP), n0: 0, fortN: Math.round((lv.fortN || 0) * S.diff.flow), bossN: lv.boss === 'dragon' ? Math.round((lv.dragonHp || 2400) * S.diff.hp) : 0 };
  // track 分兩份：會佔位置的東西（進場時擺上去），以及走到定點才觸發的事（提示、赤龍俯衝）
  S.track = lv.track.filter((e) => e.t !== 'say' && e.t !== 'strafe'); S.ti = 0;
  S.evq = [];
  for (const e of lv.track) {
    if (e.t === 'strafe') S.evq.push({ d: e.d, e });
    else if (e.say) S.evq.push({ d: e.d - (e.lead || 62), say: e.say, tone: e.tone !== undefined ? e.tone : SAY_ALERT[e.t] ? 1 : 0 });
    if (e.gold) S.evq.push({ d: e.d - 80, gold: true });
  }
  S.evq.sort((a, b) => a.d - b.d); S.evi = 0;
  S.xLim = hw - 0.6; S.ctlZ = 6;
  S.fort = { hp: 0, max: 1, floor: 0, alive: false, flash: 0, stage: 3, dry: false };
  S.burn.used = true; S.wallMax = S.wallHp = 1;
  const n0 = Math.round((lv.start || 14) * (S.diff.wall > 1 ? 1.25 : S.diff.wall < 1 ? 0.85 : 1) + 3 * up.wall);
  S.sq.n0 = n0; squadLayout(n0);
  for (let i = 0; i < n0; i++) addBlue(SUNX[i] * S.sq.kx, S.sq.cz + SUNZ[i] * S.sq.kz, 0, 0, 0, 0);
  marchSpawn();
}

// 人數 → 隊形大小。三百人以內每人佔的地一樣大；再多就越站越密，不然上千人會排到畫面外。
// 隊伍在橋中央時排成一團；往邊上靠，整團人就被欄杆擠成一條長龍（半寬最窄到 aMin），
// 鑽得過半邊的缺口、躲得開火線。兩千人以內都擠得進 2.8 的半寬。
const SQ_EDGE = 0.55, SQ_LEN = 38;
function squadLayout(n) {
  const q = S.sq;
  const area = n <= 300 ? 0.36 * Math.max(n, 1) : 108 * Math.pow(n / 300, 0.6);
  const R = Math.sqrt(area / Math.PI), aMin = Math.min(R, Math.max(2.2, R * R / SQ_LEN));
  // 隊伍最長排到 SQ_LEN。前面有橋頭堡或赤龍的時候隊頭不能超過它：長龍照樣那麼窄，只是站得更密
  const ahead = S.mf ? S.mf.z - 2 : S.boss && S.boss.kind === 'dragon' ? S.boss.z - 6 : 1e9;
  const bMax = Math.min(SQ_LEN, Math.max(4, (ahead - MZ_REAR) / 2));
  q.R = R; q.aMin = aMin; q.lim = Math.max(0, q.hw - SQ_EDGE - aMin);
  const a = clamp(q.hw - SQ_EDGE - Math.abs(q.x), aMin, R), bl = Math.min(R * R / a, bMax), c = 1 / Math.sqrt(Math.max(n, 1));
  q.a = a; q.b = bl; q.kx = c * a; q.kz = c * bl; q.cz = MZ_REAR + bl;
}
// 隊伍中心放在 x 的話，半寬會是多少（自動玩家估算用）
function squadHalf(x) { const q = S.sq; return clamp(q.hw - SQ_EDGE - Math.abs(x), q.aMin, q.R); }

/* ---------- 路線上的東西進場 ---------- */
function marchSpawn() {
  const q = S.sq, tr = S.track, eq = S.evq;
  while (S.ti < tr.length && tr[S.ti].d - q.dist <= (tr[S.ti].t === 'dragon' ? MZ_DRAGON : MZ_SPAWN)) { const e = tr[S.ti++]; marchAdd(e, e.d - q.dist); }
  while (S.evi < eq.length && eq[S.evi].d <= q.dist) { const o = eq[S.evi++]; if (o.e) dragonStrafe(o.e); else if (o.gold) ev('gold'); else ev('say', o.say, o.tone); }
}
function addRedM(x, z, kind, mode, spd) {
  const s = S.R; if (s.n >= s.cap) return -1;
  const i = s.n++;
  s.z[i] = z; s.x[i] = x; s.t[i] = rnd() * 2 - 1; s.y[i] = 0; s.vy[i] = 0; s.vl[i] = 0;
  s.spd[i] = (spd || (kind === 1 ? 9 : 4.4)) * (0.85 + 0.3 * rnd()) * S.diff.spd; s.hp[i] = RED_HP[kind]; s.kind[i] = kind; s.gate[i] = mode;
  s.ph[i] = rnd() * 4; s.sk[i] = NaN; s.fl[i] = 0;
  return i;
}
// 一隊敵軍：排成 w 寬的方陣。run = 看到我軍就衝過來，否則原地列陣擋路
function spawnPack(e, z) {
  const n = Math.round(e.n * S.diff.flow), w = e.w || 6, den = e.den || 2.3, lim = S.sq.hw - 0.5;
  const cols = Math.max(1, Math.round(w * Math.sqrt(den))), rows = Math.ceil(n / cols), dzr = 1 / Math.sqrt(den);
  const mode = e.run ? 2 : 0; let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols && k < n; c++, k++) {
    const x = e.x + ((c + 0.5 + (rnd() - 0.5) * 0.6) / cols - 0.5) * w, zz = z + (r + (rnd() - 0.5) * 0.6) * dzr;
    const kind = e.kind !== undefined ? e.kind : (rnd() < (e.shield || 0) ? 2 : 0);
    addRedM(clamp(x, -lim, lim), zz, kind, mode, e.spd);
  }
}
function marchAdd(e, z) {
  const D = S.diff, hwE = S.sq.hw - LANE_PAD;
  switch (e.t) {
    case 'gate': {
      const g = addGate({ z, x: e.x, w: e.w, m: e.m === undefined ? 1 : e.m, add: e.add, max: e.max, amp: e.amp, per: e.per, ph: e.ph, gold: e.gold, cap: e.cap });
      g.row = e.d;
      break;
    }
    case 'barrel': {
      const hp = Math.max(1, Math.round(e.hp * (e.rw && e.rw !== 'tnt' ? D.hp : 1)));
      S.barrels.push({ t: 0, z, x: e.x, hp, max: hp, alive: true, fuse: -1, flash: 0, rw: e.rw || 'tnt', n: e.n || 0, elite: e.elite, hw: e.rw === 'elite' ? 2.1 : 1.05 });
      break;
    }
    case 'pack': spawnPack(e, z); break;
    case 'brute':
      for (let k = 0; k < (e.n || 1); k++) {
        const x = clamp(e.x + (k - ((e.n || 1) - 1) / 2) * 2.4, -hwE, hwE);
        ev('big', addBig({ team: 1, kind: 'brute', t: x / hwE, z: z + (k & 1) * 1.5, x, r: 0.95, hp: Math.round((S.lv.bruteHp || 30) * D.hp), spd: 2.3 * D.spd, st: 'walk' }));
      }
      break;
    case 'giant': {
      const x = clamp(e.x || 0, -hwE, hwE);
      addBig({ team: 1, kind: 'giant', t: x / hwE, z, x, r: 1.9, hp: Math.round((S.lv.giantHp || 300) * D.hp), spd: 1.3 * D.spd, st: 'walk', cd: 1.5 }).hush = true;      // 進場時還在天邊，走近了再喊
      break;
    }
    case 'hole': S.holes.push({ x: e.x, w: e.w, z, len: e.len || 5 }); break;
    case 'saw': S.saws.push({ x0: e.x, x: e.x, z, amp: e.amp || 0, per: e.per || 4, ph: e.ph || 0, r: e.r || 1.25, born: S.time }); break;
    case 'fort': {
      const hp = S.sq.fortN || Math.round(e.n * D.flow);
      S.mf = { z, rate: e.rate || 55, acc: 0, shield: e.shield || 0 };
      S.fort = { hp, max: hp, floor: Math.round(hp * 0.15), alive: true, flash: 0, stage: 3, dry: false };
      S.fz = z; ev('mfort');
      break;
    }
    case 'dragon': dragonLand(e, z); break;
  }
}

/* ---------- 世界往下捲 ---------- */
function marchScroll(dz) {
  const q = S.sq; q.dist += dz; S.scrollAcc += dz;
  const gs = S.gates;
  for (let i = gs.length - 1; i >= 0; i--) { const g = gs[i]; g.zp = g.z; g.z -= dz; if (g.z < MZ_OUT) gs.splice(i, 1); }
  const bs = S.barrels;
  for (let i = bs.length - 1; i >= 0; i--) { const o = bs[i]; o.z -= dz; if (o.z < MZ_OUT || (!o.alive && o.fuse < 0)) bs.splice(i, 1); }
  const hs = S.holes;
  for (let i = hs.length - 1; i >= 0; i--) { hs[i].z -= dz; if (hs[i].z + hs[i].len < MZ_OUT) hs.splice(i, 1); }
  const ss = S.saws;
  for (let i = ss.length - 1; i >= 0; i--) { ss[i].z -= dz; if (ss[i].z < MZ_OUT) ss.splice(i, 1); }
  for (const m of S.marks) m.z -= dz;
  for (const p of S.proj) if (p.kind !== 'arrow' && p.kind !== 'bolt') { p.z0 -= dz; p.z1 -= dz; }
  for (const o of S.bigs) if (o.team === 1 && !o.fixed) o.z -= dz;
  if (S.mf) { S.mf.z -= dz; S.fz = S.mf.z; }
  const u = S.ult; if (u.active) { u.z0 -= dz; u.z1 -= dz; }
}

/* ---------- 部隊 ---------- */
function killNearest(x, z, k, cause) {
  const b = S.B, n = b.n, keys = [];
  for (let i = 0; i < n; i++) if (b.hp[i] > 0) { const dx = b.x[i] - x, dz = b.z[i] - z; keys.push(Math.floor((dx * dx + dz * dz) * 64) * 8192 + i); }
  keys.sort((p, r) => p - r);
  for (let j = 0; j < k && j < keys.length; j++) killBlue(keys[j] % 8192, cause, x, z, 6);
}
// 同一排的門只能選一道：第一個兵碰到哪一道，同排其他的就失效
function pickGate(g) {
  if (g.picked) return; g.picked = true;
  for (const o of S.gates) if (o !== g && o.row === g.row && o.alive) { o.alive = false; ev('gend', o); }
}
// 加法門：整道門只算一次。正數當場補兵，負數扣兵；箭射中會讓數字往上加
function passAdd(i, g) {
  const b = S.B, z = b.z[i], n = g.add, mask = b.gate[i] | g.bit;
  pickGate(g); g.alive = false; g.flash = 1;
  if (n > 0) {
    let made = 0;
    for (let c = 0; c < n && b.n < BLUE_SOFT; c++) { addBlue(g.x + (rnd() - 0.5) * g.w * 0.8, z + rnd() * 1.4, 0.01, 3 + rnd() * 3.6, (rnd() * 2 - 1) * 4, mask); made++; }
    ev('gadd', g, made);
  } else { if (n < 0) killNearest(g.x, z, -n, 4); ev('gadd', g, n); }
}
function hitBarrel(o, dmg) {
  o.hp -= dmg; o.flash = 1; ev('bhit', o);
  if (o.hp > 0) return;
  o.hp = 0;
  if (o.rw === 'tnt') { o.fuse = 0.22; return; }
  o.alive = false;
  const q = S.sq;
  if (o.rw === 'troop') {
    for (let c = 0; c < o.n && S.B.n < BLUE_SOFT; c++) addBlue(o.x + (rnd() - 0.5) * 1.2, o.z + (rnd() - 0.5) * 1.2, 0.5, 5 + rnd() * 4, (rnd() * 2 - 1) * 5, 0);
  } else if (o.rw === 'bow') { if (q.wpn < 3) q.wpn++; }
  else if (o.rw === 'elite') {
    const side = S.peds.some((p) => p.escort && p.side === -1) ? 1 : -1;
    S.peds.push({ x: o.x, z: o.z, r: 1.7, need: 0, got: 0, built: true, kind: o.elite || 'ballista', cool: 0.8, aim: 0, kick: 0, flash: 0, escort: true, side });
  }
  ev('rw', o);
}
// 危險區：士兵不會自己走進去——站在裡面來不及離開的才會陣亡，站在外面的人不會因為補位而一個接一個走進去。
// 缺口和點著的火線各佔橫向一段 [hzA, hzB]；還沒被它掃過（z <= hzHi）、又在視線內（z >= hzLo）的兵不准橫向走進那一條，
// 已經通過缺口的兵也不准倒退走回洞裡（hzBack）。滾刀會左右來回，另外用「它到我這一排時會在哪裡」來算（見 stepSquad）
const HZ_MAX = 12, HZ_EPS = 0.03, HOLE_SEE = 20, SAW_SEE = 20;
const hzA = new Float64Array(HZ_MAX), hzB = new Float64Array(HZ_MAX), hzLo = new Float64Array(HZ_MAX), hzHi = new Float64Array(HZ_MAX), hzBack = new Uint8Array(HZ_MAX);
function hazards() {
  let k = 0; const see = Math.max(HOLE_SEE, 2 * S.sq.b + 6);      // 隊伍排多長就往前看多遠：隊頭快到缺口了，隊尾也不該晃進那一條
  for (const h of S.holes) if (k < HZ_MAX) { hzA[k] = h.x - h.w / 2; hzB[k] = h.x + h.w / 2; hzLo[k] = h.z - see; hzHi[k] = h.z + h.len; hzBack[k] = 1; k++; }
  for (const f of S.strafes) if (f.lit && k < HZ_MAX) { hzA[k] = f.x - f.w / 2; hzB[k] = f.x + f.w / 2; hzLo[k] = -1e9; hzHi[k] = Math.min(f.z0, f.zf + FIRE_TRAIL); hzBack[k] = 0; k++; }
  return k;
}
function stepSquad(dt) {
  const b = S.B, r = S.R, n = b.n, q = S.sq, armor = S.armor;
  // 手指的位置（S.cannonX）是目標，整團人用有限速度追過去
  squadLayout(n);
  S.cannonX = clamp(S.cannonX, -q.lim, q.lim);
  { const m = 34 * dt; q.x = clamp(q.x + clamp(S.cannonX - q.x, -m, m), -q.lim, q.lim); }
  squadLayout(n);
  const rst = r.start, ritems = r.items, rhp = r.hp, rxx = r.x, rzz = r.z, minZ = S.redMinZ;
  const gates = S.gates, bars = S.barrels, holes = S.holes, saws = S.saws;
  const mx = 22 * dt, mz = 10 * dt, kx = q.kx, kz = q.kz, cx = q.x, cz = q.cz, edge = q.hw - 0.4, nh = hazards();
  const ns = saws.length, vv = Math.max(2, q.v), now = S.time, sawSee = Math.max(SAW_SEE, 2 * q.b + 6);
  let zTop = MZ_REAR;
  for (let i = 0; i < n; i++) {
    if (b.hp[i] <= 0) continue;
    let y = b.y[i];
    if (y > 0 || b.vy[i] > 0) { b.vy[i] -= 26 * dt; y += b.vy[i] * dt; if (y <= 0) { y = 0; b.vy[i] = 0; } b.y[i] = y; }
    const zp = b.z[i];
    let x = b.x[i], z = zp, vl = b.vl[i];
    if (vl !== 0) { x += vl * dt; vl *= POPDAMP; if (vl > -0.15 && vl < 0.15) vl = 0; b.vl[i] = vl; }
    let dx = cx + SUNX[i] * kx - x, dz = cz + SUNZ[i] * kz - z;
    if (dx > mx) dx = mx; else if (dx < -mx) dx = -mx;
    if (dz > mz) dz = mz; else if (dz < -mz) dz = -mz;
    for (let k = 0; k < nh; k++) {
      const xa = hzA[k], xb = hzB[k], hi = hzHi[k];
      if (z > hi) {
        // 已經過了：缺口不准倒退走回去（人在那一條裡、或這一步正要橫著跨進去）
        if (hzBack[k] && dz < 0 && z + dz < hi + HZ_EPS) { const nx = x + dx; if (nx > xa && nx < xb) dz = hi + HZ_EPS - z; }
        continue;
      }
      if (z < hzLo[k]) continue;
      if (x <= xa) { if (x + dx > xa - HZ_EPS) dx = xa - HZ_EPS - x; }        // 在左邊外面：最多走到邊上
      else if (x >= xb) { if (x + dx < xb + HZ_EPS) dx = xb + HZ_EPS - x; }   // 在右邊外面
    }
    for (let k = 0; k < ns; k++) {
      const s = saws[k], rr = s.r + 0.3, ds = s.z - z;
      if (ds < -rr || ds > sawSee) continue;
      // 滾刀一邊靠近一邊左右來回：算它到這一排時的位置，兩側再留它橫移的餘裕
      const sx = s.amp ? s.x0 + s.amp * tri((now + (ds > 0 ? ds / vv : 0) - s.born) / s.per + s.ph) : s.x;
      const pad = rr + 0.3 + (s.amp ? 4 * s.amp / s.per * rr / vv : 0), xa = sx - pad, xb = sx + pad;
      if (x <= xa) { if (x + dx > xa - HZ_EPS) dx = xa - HZ_EPS - x; }
      else if (x >= xb) { if (x + dx < xb + HZ_EPS) dx = xb + HZ_EPS - x; }
      else if ((x - sx) * dx < 0 && (x - sx > rr || sx - x > rr)) dx = 0;      // 站在刀鋒外圍的餘裕裡：不准再往刀那邊靠
    }
    x += dx; z += dz;
    if (x > edge) x = edge; else if (x < -edge) x = -edge;
    b.x[i] = x; b.z[i] = z;
    if (z > zTop) zTop = z;

    for (let k = 0; k < gates.length; k++) {
      const g = gates[k];
      if (!g.alive || (b.gate[i] & g.bit) || !(zp < g.zp && z >= g.z)) continue;   // 門的平面掃過這個兵
      const dg = x - g.x;
      if (dg < g.w * 0.5 && dg > -g.w * 0.5) { if (g.add !== undefined) passAdd(i, g); else { pickGate(g); passGate(i, g); } if (b.hp[i] <= 0) break; }
    }
    if (b.hp[i] <= 0) continue;
    for (let k = 0; k < bars.length; k++) {
      const o = bars[k]; if (!o.alive || o.fuse >= 0) continue;
      const db = z - o.z, da = x - o.x;
      if (db > -1.1 && db < 1.1 && da > -o.hw - 0.1 && da < o.hw + 0.1) { killBlue(i, 5, o.x, o.z + 0.6, 5); hitBarrel(o, 1); break; }
    }
    if (b.hp[i] <= 0) continue;
    if (y < 0.4) {
      for (let k = 0; k < holes.length; k++) {
        const h = holes[k], da = x - h.x;
        if (z >= h.z && z <= h.z + h.len && da < h.w * 0.5 && da > -h.w * 0.5) { killBlue(i, 6, x, z, 0); break; }
      }
      if (b.hp[i] <= 0) continue;
    }
    for (let k = 0; k < saws.length; k++) {
      const s = saws[k], da = x - s.x, db = z - s.z, rr2 = s.r + 0.3;
      if (da * da + db * db < rr2 * rr2) { killBlue(i, 5, s.x, s.z, 9); break; }
    }
    if (b.hp[i] <= 0) continue;

    if (z > minZ - 1.3 && y < 1.3) {
      let gx = (x - GX0) | 0, gz = (z - GZ0) | 0;
      outer:
      for (let czz = gz - 1; czz <= gz + 1; czz++) {
        if (czz < 0 || czz >= GH) continue;
        const row = czz * GW;
        for (let cxx = gx - 1; cxx <= gx + 1; cxx++) {
          if (cxx < 0 || cxx >= GW) continue;
          const c = row + cxx;
          for (let p = rst[c], e = rst[c + 1]; p < e; p++) {
            const j = ritems[p]; if (rhp[j] <= 0) continue;
            const ddx = rxx[j] - x, ddz = rzz[j] - z;
            if (ddx * ddx + ddz * ddz < HIT2) {
              if (--rhp[j] <= 0) killRed(j, 0, x, z, 0);
              else { rzz[j] += 0.4; r.fl[j] = 7; ev('clank', rxx[j], rzz[j]); }
              if (rnd() >= armor) killBlue(i, 0, rxx[j], rzz[j], 0);
              else b.fl[i] = 6;
              break outer;
            }
          }
        }
      }
      if (b.hp[i] <= 0) continue;
    }
    if (b.fl[i] > 0) b.fl[i]--;
  }
  q.front = zTop;
}
// 自動放箭：人越多箭越密（開根號成長），武器等級再往上乘
function squadFire(dt) {
  const q = S.sq, b = S.B, n = b.n; if (!n) return;
  const life = S.boss && S.boss.fixed ? ARROW_LIFE_BOSS : ARROW_LIFE, reach = q.front + ARROW_SPD * life;
  let tgt = S.redMinZ < reach;
  if (!tgt) for (const o of S.barrels) if (o.alive && o.z > MZ_REAR && o.z < reach) { tgt = true; break; }
  if (!tgt) for (const g of S.gates) if (g.alive && g.add !== undefined && g.add < g.max && g.z > q.front && g.z < reach) { tgt = true; break; }
  if (!tgt) for (const o of S.bigs) if (o.team === 1 && !o.dead && o.z < reach + 4) { tgt = true; break; }
  if (!tgt) { q.fireAcc = Math.min(q.fireAcc, 0.9); return; }
  q.fireAcc += arrowRate(n, q.wpn) * (1 + 0.1 * S.up.rate) * dt;
  let fired = 0;
  while (q.fireAcc >= 1) {
    q.fireAcc--; const j = (rnd() * n) | 0; if (b.hp[j] <= 0) continue;
    S.proj.push({ kind: 'arrow', x: b.x[j], z: b.z[j] + 0.5, vz: ARROW_SPD, life, dmg: WPN_DMG[q.wpn] });
    S.shots++; fired++;
  }
  if (fired) ev('arw', q.x, q.front, fired);
}
// 回傳 true 表示這支箭用掉了
function stepArrow(p, dt) {
  for (let sub = 0; sub < 2; sub++) {
    const zp = p.z; p.z += p.vz * dt * 0.5;
    const k = blast(1, p.x, p.z, 0.62, p.dmg, 1, 6);
    if (k > 0) { p.dmg -= k; if (p.dmg <= 0) return true; }
    for (const o of S.barrels) {
      if (!o.alive || o.fuse >= 0) continue;
      const da = p.x - o.x; if (da < o.hw && da > -o.hw && p.z >= o.z - 0.9 && zp <= o.z + 0.9) { hitBarrel(o, p.dmg); return true; }
    }
    for (const g of S.gates) {
      if (!g.alive || g.add === undefined || !(zp < (sub ? g.z : g.zp) + 0.01 && p.z >= g.z)) continue;
      const da = p.x - g.x; if (da < g.w * 0.5 && da > -g.w * 0.5) { if (g.add < g.max) g.add++; g.flash = 1; ev('ghit', g, p.x); return true; }
    }
    for (const o of S.bigs) {
      if (o.team !== 1 || o.dead || o.st === 'rise') continue;
      const da = o.x - p.x, db = o.z - p.z, rr2 = o.r + 0.25;
      if (da * da + db * db < rr2 * rr2) { hurtBig(o, p.dmg); ev('spark', p.x, p.z); return true; }
    }
    if (S.fort.alive && p.z >= S.fz - 1.2) { ev('spark', p.x, p.z); return true; }     // 箭射不動城牆
  }
  p.life -= dt;
  return p.life <= 0 || p.z > L + 14;
}

/* ---------- 敵軍 ---------- */
function stepRedMarch(dt) {
  const r = S.R, n = r.n, q = S.sq, dzs = q.v * dt, lim = q.hw - 0.45, holes = S.holes, saws = S.saws;
  const spread = q.siege ? q.hw - 1 : q.a + 0.6, tx0 = q.siege ? 0 : q.x;
  let minZ = 1e9;
  for (let i = 0; i < n; i++) {
    if (r.hp[i] <= 0) continue;
    let z = r.z[i], md = r.gate[i];
    if (md === 2 && z < 80) { md = 1; r.gate[i] = 1; }
    if (md === 1) {
      z -= r.spd[i] * dt;
      let x = r.x[i]; const d = tx0 + r.t[i] * spread - x, m = 1.7 * dt;
      x += d > m ? m : d < -m ? -m : d;
      if (x > lim) x = lim; else if (x < -lim) x = -lim;
      r.x[i] = x;
      for (let k = 0; k < holes.length; k++) {
        const h = holes[k], da = x - h.x;
        if (z >= h.z && z <= h.z + h.len && da < h.w * 0.5 && da > -h.w * 0.5) { killRed(i, 6, x, z, 0); break; }
      }
      if (r.hp[i] <= 0) continue;
      for (let k = 0; k < saws.length; k++) {
        const s = saws[k], da = x - s.x, db = z - s.z, rr2 = s.r + 0.3;
        if (da * da + db * db < rr2 * rr2) { killRed(i, 1, s.x, s.z, 9); break; }
      }
      if (r.hp[i] <= 0) continue;
    }
    z -= dzs; r.z[i] = z;
    if (z < MZ_OUT) { r.hp[i] = 0; continue; }       // 擦身而過，走出畫面
    if (z < minZ) minZ = z;
    if (r.fl[i] > 0) r.fl[i]--;
  }
  S.redMinZ = minZ;
}

/* ---------- 橋頭堡：到了就全軍衝鋒，規則跟破陣玩法的攻城一樣 ---------- */
function startSiege() {
  const q = S.sq, b = S.B;
  q.siege = true; q.v = 0;
  for (let i = 0; i < b.n; i++) { b.t[i] = laneT(b.x[i], b.z[i]); b.sk[i] = NaN; }
  for (const o of S.barrels) if (o.rw !== 'tnt') o.alive = false;
  ev('siege');
}
function siegeFlow(dt) {
  const f = S.fort, m = S.mf; if (!f.alive) return;
  m.acc += m.rate * (1 + 0.6 * (1 - f.hp / f.max)) * dt;
  while (m.acc >= 1) {
    m.acc--;
    if (f.hp > f.floor) { f.hp--; addRedM((rnd() - 0.5) * 5, S.fz - 0.6 - rnd() * 1.2, rnd() < m.shield ? 2 : 0, 1, 5.2); }
  }
  if (f.hp <= f.floor && !f.dry) { f.dry = true; ev('dry'); }
}
function marchRescue() {
  const q = S.sq, n = 20 + 6 * S.up.wall;
  S.strafes.length = 0;
  // 剛剛害死全隊的缺口或滾刀多半還在腳邊：後軍從沒有危險的那一側進場
  let x = q.x, danger = 0;
  for (const h of S.holes) if (h.z < 26 && h.z + h.len > MZ_OUT) danger += h.x >= 0 ? 1 : -1;
  for (const s of S.saws) if (s.z < 26 && s.z > MZ_OUT) danger += s.x >= 0 ? 1 : -1;
  squadLayout(n);
  if (danger) x = (danger > 0 ? -1 : 1) * q.lim;
  x = clamp(x, -q.lim, q.lim); q.x = x; S.cannonX = clamp(danger ? x : S.cannonX, -q.lim, q.lim); squadLayout(n);
  blast(1, x, q.cz + 2, 8, 400, 1, 12); blastBigs(1, x, q.cz + 2, 8, 30);
  // 還擋在腳邊的木桶、木籠一併撞開，免得後軍一進場又整隊撞上去
  for (const o of S.barrels) if (o.alive && o.fuse < 0 && o.z < q.cz + 12) { o.alive = false; ev('bhit', o); }
  for (let i = 0; i < n; i++) addBlue(x + SUNX[i] * q.kx, MZ_OUT + 2 + rnd() * 3, 0, 0, 0, 0);
  ev('rescue', x, q.cz);
}

function stepCheer(dt) {
  const b = S.B;
  for (let i = 0; i < b.n; i++) {
    if (b.hp[i] <= 0) continue;
    if (b.y[i] <= 0 && b.vy[i] <= 0) { if (rnd() < dt * 2.2) b.vy[i] = 5 + rnd() * 3.5; continue; }
    b.vy[i] -= 26 * dt; b.y[i] += b.vy[i] * dt; if (b.y[i] <= 0) { b.y[i] = 0; b.vy[i] = 0; }
  }
}
/* ---------- 每幀 ---------- */
function stepHazards(dt) {
  for (const s of S.saws) if (s.amp) s.x = s.x0 + s.amp * tri((S.time - s.born) / s.per + s.ph);
  stepDragon(dt);
}
// 大將集滿了也要等前面真的有一批敵人才出陣：攻城時對城門、赤龍落地後對赤龍、其餘看隊頭前面 42 格內有沒有敵陣
function heroFoe() {
  const q = S.sq;
  return q.siege ? S.fort.alive : (S.boss && S.boss.fixed) || (S.front < L - 1 && S.front - q.front < 42);
}
function marchStep(dt) {
  const q = S.sq, playing = S.state === 'play', mf = S.mf, b = S.B;
  // 出發時慢慢加速；接近橋頭堡時減速，到定點停下來攻城
  let vT = playing && !q.siege && !q.hold ? q.vMax : 0;
  if (mf && !q.siege) vT = Math.min(vT, Math.max(0, (mf.z - MZ_STOP) * 1.3 + 0.5));
  q.v += clamp(vT - q.v, -14 * dt, 5 * dt);
  marchScroll(q.v * dt);
  if (playing) {
    marchSpawn();
    if (S.mf && !q.siege && S.mf.z <= MZ_STOP + 0.05) startSiege();
    if (!q.siege) squadFire(dt);
    const h = S.hero;
    if (h.on) {
      if (h.ready > 0) {
        h.ready -= dt;
        if (h.ready <= 0) {
          if (!heroFoe()) h.ready = 0;      // 蓄力的這一下敵人沒了：先不出陣，等下一批
          else {
            const bo = S.boss && S.boss.fixed ? S.boss : null;
            const far = (S.fort.alive ? S.fz : L) - 6, near = S.front < q.front ? MZ_REAR + 2 : q.front + 3;      // 敵人已經咬進隊身，就直接落在他們頭上
            const tz0 = bo ? bo.z - bo.r - 1.2 : clamp(S.front + 2, Math.min(near, far), far);
            const dur = 0.8 + Math.max(0, tz0 - q.cz) / 70;
            let tz = tz0, tx = bo ? bo.x : q.x;
            if (!bo && !q.siege) {
              // 落點對準最前面那一批敵人：橫向取他們的中心；縱向扣掉大將在空中時世界往下捲、敵人衝過來的距離
              const r = S.R; let vs = 0, vn = 0, xs = 0;
              for (let j = 0; j < r.n; j++) if (r.hp[j] > 0 && r.z[j] >= S.front - 1 && r.z[j] < S.front + 5) { vn++; xs += r.x[j]; if (r.gate[j] === 1) vs += r.spd[j]; }
              let vF = vn ? vs / vn : 0; if (vn) tx = xs / vn;
              if (!vn) for (const g of S.bigs) if (g.team === 1 && !g.dead && g.z - g.r < S.front + 1.5 && g.z + g.r >= q.front - 2.5) { tx = g.x; if (g.spd > vF) vF = g.spd; break; }
              tz = Math.max(Math.min(near, far), tz0 - (q.v + vF) * dur);
            }
            const o = addBig({ team: 0, kind: 'hero', x: q.x, x0: q.x, z: q.cz, z0: q.cz, z1: tz, t: laneT(tx, 12), y: 1, r: 1.5, hp: 1, st: 'fly', dur, life: h.life });
            ev('hero', o); h.t = 0;
          }
        }
      } else {
        if (h.t < h.cd) h.t += dt;
        if (h.t >= h.cd && heroFoe()) { h.ready = 0.9; ev('heroready'); }
      }
    }
  } else S.endT += dt;

  stepGates(dt);
  if (S.state === 'won') stepCheer(dt);
  else if (q.siege) { if (playing) siegeFlow(dt); stepBlue(dt); q.front = Math.max(MZ_REAR, S.blueMaxZ); } else stepSquad(dt);
  stepRedMarch(dt);
  stepBigs(dt);
  for (const p of S.peds) if (p.escort) {
    // 機關車跟在隊伍旁邊；隊伍貼著欄杆、那一側沒位置的時候就換到另一側
    const lim = q.hw - 1.3, off = q.a + 1.9, t0 = q.x + p.side * off;
    let tx = clamp(t0 > lim || t0 < -lim ? q.x - p.side * off : t0, -lim, lim); const tz = q.cz + Math.min(q.b * 0.4, 3);
    // 前面是橋面缺口：先縮進隊伍裡，跟著大家從旁邊繞過去
    for (const h of S.holes) if (h.z < tz + 7 && h.z + h.len > tz - 2 && tx > h.x - h.w / 2 - 1.5 && tx < h.x + h.w / 2 + 1.5) { tx = clamp(q.x, -lim, lim); break; }
    p.x += clamp(tx - p.x, -16 * dt, 16 * dt); p.z += clamp(tz - p.z, -9 * dt, 9 * dt);
  }
  stepPeds(dt);
  stepBarrels(dt);
  stepProj(dt);
  stepUlt(dt);
  stepHazards(dt);
  if (S.fort.flash > 0) S.fort.flash -= dt * 6;

  if (S.state === 'won') {
    // 橋頭堡一倒，殘兵從城門往外一波波潰散
    const zc = S.fz - S.endT * 55, r = S.R; let k = 0;
    for (let j = 0; j < r.n && k < 70; j++) if (r.hp[j] > 0 && r.z[j] >= zc) { killRed(j, 1, r.x[j], r.z[j] + 2, 9); k++; }
    for (const o of S.bigs) if (o.team === 1 && !o.dead && o.z >= zc) { o.dead = true; ev('bigdie', o); }
  }
  compact(b); compact(S.R);
  const army = b.n; if (army > S.maxArmy) S.maxArmy = army;
  if (playing && S.state === 'won') S.survive = army;      // 過關那一幀裡後面還有人陣亡的話，以這一幀結束時為準
  if (playing && army === 0 && S.state === 'play') {
    // 全軍覆沒：後軍趕到救一次；再倒就輸了
    if (!q.rescue && !q.siege) { q.rescue = true; marchRescue(); }
    else { S.state = 'lost'; S.endT = 0; ev('lose'); }
  }
}

/* ---------- 赤龍（第十關） ----------
   火線（S.strafes）：先在橋面上亮 warn 秒預告，接著一道火從 z0 掃到橋尾，掃到的兵（敵我都算）當場陣亡。
   行軍途中赤龍會俯衝噴火；走到橋頭後牠停在前面當魔王，要靠箭、大將、箭雨把牠的血打光。 */
const FIRE_W = 5.4, FIRE_W2 = 9.2, FIRE_SPD = 150, FIRE_TRAIL = 26;      // 火頭後面拖著 FIRE_TRAIL 長的烈焰，這一段都會燒到人
function addStrafe(x, z0, warn, fly, w0) {
  const w = w0 || FIRE_W, lim = S.sq.hw - w / 2;
  const f = { x: clamp(x, -lim, lim), w, t: 0, warn, z0, zf: z0, dur: (z0 - MZ_OUT + FIRE_TRAIL + 2) / FIRE_SPD, fly: !!fly, lit: false, burnt: 0 };
  S.strafes.push(f); ev('strafe', f); return f;
}
function dragonStrafe(e) { addStrafe(S.sq.x + (e.off || 0), 150, e.warn || 1.5, true); }
function dragonLand(e, z) {
  const hp = Math.round((S.lv.dragonHp || 2400) * S.diff.hp);
  S.boss = addBig({ team: 1, kind: 'dragon', t: 0, x: 0, z, r: 4.2, hp, spd: 0, st: 'come', cd: 2.2, sum: 6, rage: false, fixed: false, zHold: MZ_BOSS });
}
function stepStrafes(dt) {
  const fs2 = S.strafes; if (!fs2.length) return;
  const b = S.B, r = S.R;
  for (let i = fs2.length - 1; i >= 0; i--) {
    const f = fs2[i]; f.t += dt;
    if (f.t < f.warn) continue;
    if (!f.lit) { f.lit = true; ev('breath', f); }
    f.zf = f.z0 - (f.t - f.warn) * FIRE_SPD;
    const x0 = f.x - f.w / 2, x1 = f.x + f.w / 2, zt = Math.min(f.z0, f.zf + FIRE_TRAIL);
    for (let j = 0; j < b.n; j++) if (b.hp[j] > 0 && b.z[j] >= f.zf && b.z[j] <= zt && b.x[j] > x0 && b.x[j] < x1) { killBlue(j, 1, f.x, b.z[j] + 2, 9); f.burnt++; }
    for (let j = 0; j < r.n; j++) if (r.hp[j] > 0 && r.z[j] >= f.zf && r.z[j] <= zt && r.x[j] > x0 && r.x[j] < x1) killRed(j, 1, f.x, r.z[j] + 2, 9);
    if (f.t > f.warn + f.dur) fs2.splice(i, 1);
  }
}
function stepDragonBoss(o, dt) {
  const q = S.sq;
  if (o.st === 'come') {
    // 跟著世界捲進來，到定點就停住，隊伍也停下來決戰
    if (o.z <= o.zHold) { o.z = o.zHold; o.fixed = true; o.st = 'fight'; o.t0 = S.time; q.hold = true; ev('dragon', o); }
    return;
  }
  if (S.state !== 'play') return;
  if (!o.rage && o.hp < o.maxHp * 0.5) { o.rage = true; ev('rage', o); }
  o.x = Math.sin((S.time - o.t0) * 0.55) * 3.4;
  o.cd -= dt; o.sum -= dt;
  if (o.cd <= 0) {
    // 朝隊伍噴火。暴怒後改噴一大片：隊伍所在的那一側（貼著欄杆、佔橋面將近六成）整片燒掉，只剩另一側可以躲
    const wk = 1 / Math.sqrt(S.diff.spd);
    o.cd = (o.rage ? 3.6 : 4.4) / S.diff.spd;
    if (!o.rage) addStrafe(q.x, o.z - 3, 1.6 * wk, false);
    else addStrafe((q.x >= 0 ? 1 : -1) * (q.hw - FIRE_W2 / 2), o.z - 3, 1.5 * wk, false, FIRE_W2);
  }
  if (o.sum <= 0) {
    o.sum = o.rage ? 6 : 8.5;
    spawnPack({ x: o.x, w: 9, n: o.rage ? 90 : 60, run: 1, kind: 1, den: 2 }, o.z + 3);
    ev('roar', o);
  }
}
function stepDragon(dt) { stepStrafes(dt); }
