/* ===== 54-siege: 天下篇破陣關（第十一、十三、十五關）的新機關 =====
   敵軍砲台：還在敵人手上時，每隔一陣子朝我軍最密的地方開一砲（落點先亮紅圈）；
     把兵送進去奪下來，砲口就調轉過來轟赤潮。紅衣大砲在敵人手上時轟我方城牆，奪下來就直接轟敵城。 */

// 敵方砲台開火
function stepFoePed(p, dt) {
  if (S.state !== 'play') return;
  p.fcd -= dt; if (p.fcd > 0) return;
  if (p.kind === 'bigcannon') {
    // 紅衣大砲：砲彈落在城牆前，炸前庭裡的兵，也震傷城牆
    p.fcd = p.iv * (0.9 + 0.2 * rnd());
    const tx = rr(-5.5, 5.5), tz = rr(2.5, 6.5);
    p.aim = Math.atan2(tx - p.x, tz - p.z); p.kick = 1;
    throwAt('ball', p.x, p.z + 0.5, 4, tx, tz, p.rad || 3.6, 2.2);
    S.proj[S.proj.length - 1].wall = p.wall;      // 一砲震掉幾點城牆
    ev('foefire', p);
    return;
  }
  const d = densest(S.B, 12, 1, p.z - 7);
  if (!d) { p.fcd = 0.6; return; }
  p.fcd = p.iv * (0.85 + 0.3 * rnd());
  p.aim = Math.atan2(d.x - p.x, d.z - p.z); p.kick = 1;
  throwAt('bomb', p.x, p.z + 0.5, 3, d.x, d.z, p.rad || 2.5, 1.6);
  ev('foefire', p);
}
// 奪下來的紅衣大砲：直接轟敵城城門
function fireBigCannon(p) {
  if (!S.fort.alive || S.state !== 'play') { p.cool = 1; return; }
  const tx = rcx(S.fz) + rr(-3, 3), tz = S.fz - 1.5;
  p.aim = Math.atan2(tx - p.x, tz - p.z); p.kick = 1;
  S.proj.push({ kind: 'bigshell', x: p.x, z: p.z, x0: p.x, z0: p.z, x1: tx, z1: tz, t: 0, dur: 1.4, y: 2, y0: 2, h: 18, dmg: p.dmg || 30 });
  p.cool = p.rate || 5.5; ev('mortar', p);
}
// 砲彈落地（stepProj 叫）：我方的大砲彈炸城門口
function bigShellLand(p) {
  const k = blast(1, p.x, p.z, 5, 160, 1, 13); blastBigs(1, p.x, p.z, 5, 60);
  ev('boom', p.x, p.z, 5, k, 3);
  if (S.fort.alive) fortHit(p.dmg, p.x);
}

/* 風沙（第十三關）：lv.wind.gusts = [[起風的秒數, 方向（1 往右、-1 往左）, 吹幾秒], ...]，風力 lv.wind.v = 每秒把兵吹偏幾格。
   起風前 warn 秒先預告。風只吹前庭：z < 20 全力，到 z = 30 減為 0。要穿門就得往上風那一側偏著瞄。 */
const WIND_RAMP = 1;
function windAt(T) {
  const w = S.wind; if (!w) return 0;
  for (const g of w.gusts) {
    const a = T - g[0]; if (a < 0 || a > g[2]) continue;
    return g[1] * w.max * Math.min(1, a / WIND_RAMP, (g[2] - a) / WIND_RAMP);
  }
  return 0;
}
function stepWind() {
  const w = S.wind; if (!w) return;
  if (S.state !== 'play') { w.v = 0; return; }      // 分出勝負就停風，結算前不再預告、不再吹兵
  w.v = windAt(S.time);
  const g = w.gusts[w.i]; if (!g) return;
  if (!w.warned && S.time >= g[0] - w.warn) { w.warned = true; ev('gustwarn', g[1]); }
  if (!w.on && S.time >= g[0]) { w.on = true; ev('gust', g[1]); }
  if (w.on && S.time >= g[0] + g[2]) { w.on = false; w.warned = false; w.i++; ev('gustend'); }
}
// 兵從兵砲走到 z 這一排，會被風吹偏多少（自動玩家用；看得到預告，所以照排定的風算）
function windDrift(z, ahead) {
  const T = (z - CANZ) / BSPD; let d = 0;
  for (let k = 0; k < 8; k++) { const tt = (k + 0.5) / 8 * T, zz = CANZ + tt * BSPD; d += (ahead ? windAt(S.time + tt) : S.wind.v) * (zz < 20 ? 1 : Math.max(0, (30 - zz) / 10)) * T / 8; }
  return d;
}

/* 旋風：從敵城那頭沿著路往我方捲過來，左右亂竄；碰到的人（敵我都算）都被捲上天 */
function addTwister(e) {
  S.twisters.push({ z: e.z || 74, x: 0, t: 0, ph: rnd() * TAU, spd: e.spd || 2, sw: e.sw || 0.75, r: e.r || 2.3, cap: e.cap || 2, killed: 0 });
  ev('twister');
}
function stepTwisters(dt) {
  const ts = S.twisters;
  for (let i = ts.length - 1; i >= 0; i--) {
    const o = ts[i]; o.t += dt;
    o.z -= o.spd * dt;
    o.x = rcx(o.z) + Math.sin(o.t * o.sw + o.ph) * Math.max(0, rhw(o.z) - 2.2);
    if (o.z < 3) { ts.splice(i, 1); ev('twend', o); continue; }
    if (S.state !== 'play') continue;      // 分出勝負後旋風照轉，不再捲人
    const kr = blast(1, o.x, o.z, o.r, o.cap, 1, 12), kb = blast(0, o.x, o.z, o.r, o.cap, 1, 12);
    o.killed += kr + kb;
    for (const b of S.bigs) if (b.team === 1 && !b.dead && b.kind !== 'boss') { const dx = b.x - o.x, dz = b.z - o.z; if (dx * dx + dz * dz < (o.r + b.r) * (o.r + b.r)) hurtBig(b, 30 * dt); }
  }
}

/* 巨輪城（第十五關）：敵城裝了輪子，一路往我方推進（越殘破走得越慢）；衝進城門的兵每個把它往後頂 push 格。
   推到撞城線（stop）就停下來，每隔 ramIv 秒朝城牆砸一顆巨石。lv.wheel = { v, push, stop, ramIv, ramDmg } */
function wheelInit(lv) {
  const w = lv.wheel;
  S.wheel = w ? { v: w.v, push: w.push, stop: w.stop, ramIv: w.ramIv || 2.6, ramDmg: w.ramDmg || 3, acc: 0, ram: 0.8, roll: 0, vel: 0, warn: 0 } : null;
}
function stepWheel(dt) {
  const w = S.wheel, f = S.fort;
  if (!f.alive || S.state !== 'play') { w.vel = 0; w.acc = 0; return; }
  const v = w.v * S.diff.spd * (0.55 + 0.45 * f.hp / f.max);
  let nz = Math.min(L, S.fz + w.acc - v * dt); w.acc = 0;
  if (nz <= w.stop) {
    nz = w.stop; w.ram -= dt;
    if (w.ram <= 0) {
      // 停在撞城線上：城頭的投石機改砸我方城牆
      w.ram = w.ramIv;
      const tx = rr(-6, 6);
      S.proj.push({ kind: 'ball', x: tx * 0.5, z: nz, x0: tx * 0.5, z0: nz, x1: tx, z1: 2.2, t: 0, dur: 1.2, y: 6, y0: 6, h: 10, rad: 3.4, wall: w.ramDmg });
      S.marks.push({ x: tx, z: 2.2, r: 3.4, t: 0, dur: 1.2, kind: 'ball' });
      ev('ram');
    }
  } else w.ram = Math.min(w.ram, 0.8);
  w.vel = (nz - S.fz) / dt; w.roll += nz - S.fz; S.fz = nz;
  // 城往前推的時候，城門口來不及走開的赤潮被推著走（不然會被城牆蓋住，我軍也打不到）
  if (w.vel < 0) { const r = S.R, zc = nz - 0.8; for (let j = 0; j < r.n; j++) if (r.z[j] > zc && r.hp[j] > 0) r.z[j] = zc; }
  // 逼近時喊一聲（每一段只喊一次）
  const lv = nz < w.stop + 4 ? 3 : nz < w.stop + 22 ? 2 : nz < w.stop + 46 ? 1 : 0;
  if (lv > w.warn) { w.warn = lv; ev('wheelnear', lv); }
}
