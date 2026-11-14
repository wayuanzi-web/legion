/* ===== 54-wild: 無雙篇（第十七～二十四關）的新機關 =====
   破陣關：千斤閘（定時開關的鐵閘，敵我都擋）、絞盤（奪下來閘門就卡死在上面）、落雷與避雷塔、傳送陣、盾車
   行軍關：毒霧、弓樓、追兵與回馬箭、九頭蛇
   這些東西只在用到的關卡才會有，沒有的時候一律不碰亂數，前十六關的戰局不受影響。 */

/* ---------- 千斤閘（第十七關）----------
   lv.portc = [{ z, open, shut, ph, warn }]：每個循環先開 open 秒、再關 shut 秒（ph = 起始在循環的第幾秒）；
   關上前 warn 秒閘門會先抖。關著的時候我軍、赤潮、大傢伙都過不去，兩邊各自堆在閘門前；落下的那一下，閘門底下的人敵我都被砸死。
   peds 的 kind: 'winch' 是絞盤（gate = 第幾道閘）：送進 need 個兵就奪下，那道閘從此卡在上面不再落下。 */
function portcInit(lv) {
  S.portc = (lv.portc || []).map((p, k) => ({ id: k, z: p.z, open: p.open || 7, shut: p.shut || 5, ph: p.ph || 0, warn: p.warn || 1.2, closed: false, h: 1, jam: false, shaking: false, n: 0 }));
}
function stepPortc(dt) {
  for (const p of S.portc) {
    const C = p.open + p.shut, u = ((S.time + p.ph) % C + C) % C;
    const want = !p.jam && S.state === 'play' && u >= p.open;
    p.shaking = !p.jam && S.state === 'play' && u >= p.open - p.warn && u < p.open;
    if (p.shaking && !p.warned) { p.warned = true; ev('pwarn', p); }
    if (want) {
      if (p.h > 0) {
        p.h = Math.max(0, p.h - dt / 0.3);
        if (p.h <= 0) { p.closed = true; p.n++; p.warned = false; portcCrush(p); ev('pshut', p); }
      }
    } else {
      if (p.closed) { p.closed = false; ev('popen', p); }
      p.h = Math.min(1, p.h + dt / 0.8);
    }
  }
}
// 閘門砸下：正在底下的人敵我都死
function portcCrush(p) {
  const b = S.B, r = S.R; let k = 0;
  for (let i = 0; i < b.n && k < 90; i++) if (b.hp[i] > 0 && b.z[i] > p.z - 0.7 && b.z[i] < p.z + 0.7) { killBlue(i, 5, b.x[i], p.z, 6); k++; }
  for (let j = 0; j < r.n && k < 180; j++) if (r.hp[j] > 0 && r.z[j] > p.z - 0.7 && r.z[j] < p.z + 0.7) { killRed(j, 1, r.x[j], p.z, 6); k++; }
  for (const o of S.bigs) if (!o.dead && o.team === 1 && Math.abs(o.z - p.z) < o.r + 0.5) hurtBig(o, o.maxHp * 0.25);
}
// 走到關著的閘門前就停住（zp = 這一步之前的位置）
function portcStopBlue(zp, z) {
  for (const p of S.portc) if (p.closed && zp < p.z && z > p.z - 0.45) z = Math.max(zp, p.z - 0.45);
  return z;
}
function portcStopRed(zp, z) {
  for (const p of S.portc) if (p.closed && zp > p.z && z < p.z + 0.45) z = Math.min(zp, p.z + 0.45);
  return z;
}
function portcStopBig(o, zp) {
  for (const p of S.portc) {
    if (!p.closed) continue;
    if (o.team === 1 && zp > p.z && o.z < p.z + o.r) o.z = Math.max(Math.min(zp, p.z + o.r), o.z);
    else if (o.team === 0 && zp < p.z && o.z > p.z - 1.6) o.z = Math.min(Math.max(zp, p.z - 1.6), o.z);
  }
}

/* ---------- 落雷與避雷塔（第十九關）----------
   lv.storm = { iv, r, warn, ivRod }：每 iv 秒一道雷，落點先亮 warn 秒，劈死半徑 r 內的人。
   沒有避雷塔時，雷一次劈我軍最密的地方、一次劈赤潮最密的地方；peds 的 kind: 'rod' 是避雷塔，奪下來之後雷只劈赤潮，而且更勤（ivRod）。 */
function stormInit(lv) {
  const s = lv.storm;
  S.storm = s ? { iv: s.iv, ivRod: s.ivRod || s.iv * 0.75, r: s.r || 2.8, warn: s.warn || 1.3, t: s.iv * 0.8, rod: false, k: 0 } : null;
}
function stepStorm(dt) {
  const s = S.storm; if (S.state !== 'play') return;
  s.t -= dt; if (s.t > 0) return;
  s.t = (s.rod ? s.ivRod : s.iv) * (0.85 + 0.3 * rnd());
  const blue = !s.rod && (s.k++ & 1) === 0;
  let d = blue ? densest(S.B, 12, 6, 70) : densest(S.R, 14, 8, 90);
  if (!d) d = { x: rcx(40) + rr(-1, 1) * (rhw(40) - 1), z: rr(30, 60) };
  const wk = 1 / Math.sqrt(S.diff.spd), dur = s.warn * wk;
  S.marks.push({ x: d.x, z: d.z, r: s.r, t: 0, dur, kind: 'zap' });
  S.proj.push({ kind: 'zap', x: d.x, z: d.z, x0: d.x, z0: d.z, x1: d.x, z1: d.z, t: 0, dur, y: 0, y0: 0, h: 0, rad: s.r, both: !s.rod });
  ev('zapwarn', d.x, d.z);
}
function zapLand(p) {
  const k = blast(1, p.x, p.z, p.rad, 120, 1, 12); blastBigs(1, p.x, p.z, p.rad, 40);
  let kb = 0;
  if (p.both) { kb = blast(0, p.x, p.z, p.rad, 120, 1, 12); blastBigs(0, p.x, p.z, p.rad, 1); }
  ev('zap', p.x, p.z, p.rad, k, kb);
}

/* ---------- 傳送陣（第二十一關）----------
   lv.portals = [{ team, z, x, r, tz, amp, per, lanes, every, need, cap }]
   team 0 = 我軍的陣：踩進去的兵直接出現在 tz（敵城前的高台），從赤潮背後殺進城門；陣會左右來回（amp／per）。
   team 1 = 赤潮的陣：踩進去的敵兵直接出現在 tz（我方前庭），每秒最多傳 cap 個；位置每 every 秒換一條線道（lanes = 線道 t 值）。
     我軍的兵踩進赤潮的陣會把它堵住：送進 need 個，陣就破了。 */
function portalsInit(lv) {
  S.portals = (lv.portals || []).map((p, k) => ({ id: k, team: p.team, z: p.z, x: p.x || 0, x0: p.x || 0, r: p.r || 2.2, tz: p.tz, amp: p.amp || 0, per: p.per || 8, lanes: p.lanes || null, every: p.every || 12,
    need: p.need || 0, got: 0, alive: true, cap: p.cap || 12, acc: 0, flash: 0, n: 0, gone: 0, start: p.start || 0, open: !p.start }));
}
function stepPortals(dt) {
  for (const p of S.portals) {
    if (p.flash > 0) p.flash -= dt * 4;
    if (!p.alive) { p.gone += dt; continue; }
    if (p.amp) p.x = rcx(p.z) + p.x0 + p.amp * tri(S.time / p.per);
    else if (p.lanes) { const k = Math.floor(S.time / p.every) % p.lanes.length, x = laneX(p.lanes[k], p.z); if (x !== p.x && p.lane !== k) { p.lane = k; p.x = x; ev('pmove', p); } }
    else p.x = rcx(p.z) + p.x0;
    if (!p.open) { if (S.time < p.start) continue; p.open = true; ev('popen2', p); }
    if (p.team === 1) p.acc = Math.min(p.cap, p.acc + p.cap * dt);
  }
}
// 我軍踩進陣：回傳 true 表示這個兵已經被處理掉（傳走或拿去堵陣）
function portalBlue(i, x, z) {
  const b = S.B;
  for (const p of S.portals) {
    if (!p.alive || !p.open) continue;
    const dx = x - p.x, dz = z - p.z; if (dx * dx + dz * dz >= p.r * p.r) continue;
    if (p.team === 0) {
      const nz = p.tz + rnd() * 1.6; b.z[i] = nz; b.t[i] = clamp(b.t[i], -0.85, 0.85); b.x[i] = laneX(b.t[i], nz); b.sk[i] = NaN;
      p.n++; p.flash = 1; if ((p.n & 7) === 1) ev('warp', p, b.x[i], nz);
      return true;
    }
    b.hp[i] = 0; p.got++; p.flash = 1; ev('seal', p, x, z);
    if (p.got >= p.need) { p.alive = false; const k = blast(1, p.x, p.z, 4, 200, 1, 12); ev('sealed', p, k); }
    return true;
  }
  return false;
}
function portalRed(i, z) {
  const r = S.R;
  for (const p of S.portals) {
    if (!p.alive || !p.open || p.team !== 1 || p.acc < 1) continue;
    const dx = r.x[i] - p.x, dz = z - p.z; if (dx * dx + dz * dz >= p.r * p.r) continue;
    p.acc--; p.n++; p.flash = 1;
    const nz = p.tz + rnd() * 1.6; r.t[i] = clamp(r.t[i] + (rnd() - 0.5) * 0.4, -0.9, 0.9); r.sk[i] = NaN;
    if ((p.n & 15) === 1) ev('rwarp', p, laneX(r.t[i], nz), nz);
    return nz;
  }
  return z;
}

/* ---------- 盾車（第二十三關）----------
   script 的 cart：從敵城推出一輛大盾車，又寬又硬，正面撞上去的兵全部倒下、每個只扣它 1 點；連弩、轟天砲、大將打它才有效。
   推到城牆就撞一下（扣 6 點）然後散架。 */
function spawnCart(lane) {
  const z = S.fz - 3.2;
  ev('big', addBig({ team: 1, kind: 'cart', t: lane, z, x: laneX(lane, z), r: 2.3, hp: Math.round((S.lv.cartHp || 120) * S.diff.hp), spd: 1.05 * S.diff.spd, st: 'walk' }));
}

/* ---------- 行軍：毒霧（第十八、二十四關）----------
   track 的 fog：從 d 起一片 len 長、w 寬的毒霧，會左右飄（amp／per）；待在裡面的人（敵我都算）每秒有 dps 的機率倒下。 */
function addFog(e, z) {
  S.fogs.push({ x0: e.x || 0, x: e.x || 0, w: e.w || 6, z, len: e.len || 12, amp: e.amp || 0, per: e.per || 6, ph: e.ph || 0, dps: e.dps || 0.9, born: S.time, hurt: 0 });
}
function fogX(f, t) { return f.amp ? f.x0 + f.amp * tri((t - f.born) / f.per + f.ph) : f.x0; }
function stepFogs(dt) {
  const fs = S.fogs, b = S.B, r = S.R;
  for (let i = fs.length - 1; i >= 0; i--) {
    const f = fs[i]; f.x = clamp(fogX(f, S.time), -S.sq.hw + f.w / 2, S.sq.hw - f.w / 2);
    if (f.z + f.len < MZ_OUT) { fs.splice(i, 1); continue; }
    const x0 = f.x - f.w / 2, x1 = f.x + f.w / 2, z0 = f.z, z1 = f.z + f.len, p = f.dps * dt;
    if (S.state === 'play') for (let j = 0; j < b.n; j++) if (b.hp[j] > 0 && b.z[j] >= z0 && b.z[j] <= z1 && b.x[j] > x0 && b.x[j] < x1 && rnd() < p) { killBlue(j, 7, b.x[j], b.z[j], 0); f.hurt++; }
    for (let j = 0; j < r.n; j++) if (r.hp[j] > 0 && r.z[j] >= z0 && r.z[j] <= z1 && r.x[j] > x0 && r.x[j] < x1 && rnd() < p) killRed(j, 7, r.x[j], r.z[j], 0);
  }
}

/* ---------- 行軍：弓樓（第二十、二十四關）----------
   track 的 tower：蓋在橋邊（side = -1 左、1 右）的敵軍弓樓，hp 要射幾箭；在射程內每 iv 秒朝隊伍放一陣箭雨（n 個紅圈、半徑 rad）。
   弓樓佔著橋邊那一條，兵撞上去跟撞木桶一樣。 */
function addTower(e, z) {
  const hp = Math.max(1, Math.round(e.hp * S.diff.hp)), hw = S.sq.hw;
  S.barrels.push({ t: 0, z, x: e.side * (hw - 1.4), hp, max: hp, alive: true, fuse: -1, flash: 0, rw: 'tower', n: 0, hw: 1.3, ice: false, side: e.side, iv: e.iv || 4.5, cd: (e.iv || 4.5) * (e.ph === undefined ? 0.4 : e.ph), nv: e.n || 3, rad: e.rad || 2.1, cap: e.cap || 9, kick: 0 });
}
function stepTowers(dt) {
  const q = S.sq;
  for (const o of S.barrels) {
    if (o.rw !== 'tower' || !o.alive) continue;
    if (o.kick > 0) o.kick -= dt * 3;
    if (S.state !== 'play' || o.z > 104 || o.z < q.front + 8) continue;
    o.cd -= dt; if (o.cd > 0) continue;
    o.cd = o.iv * (0.9 + 0.2 * rnd()) / S.diff.spd; o.kick = 1;
    const dur = 1.35 / Math.sqrt(S.diff.spd), lead = q.v * dur, lim = q.hw - 1;
    for (let k = 0; k < o.nv; k++) {
      const off = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 4.2;
      throwAt('volleyA', o.x, o.z, 7, clamp(q.x + off + (rnd() - 0.5) * 1.4, -lim, lim), q.cz + lead + (rnd() - 0.5) * 3, o.rad, dur + k * 0.1);
      S.proj[S.proj.length - 1].cap = o.cap;
    }
    ev('tfire', o);
  }
}

/* ---------- 行軍：追兵與回馬箭（第二十二、二十四關）----------
   track 的 chase：走到 d 時，n 名狼騎從隊伍背後追上來（比隊伍快 rel 格／秒），一路咬掉隊尾的兵。
   木桶 rw: 'rear' 是回馬箭：撿到以後，後面有追兵時一部分的箭改往後射。 */
function chaseEvent(e) {
  const q = S.sq, n = Math.round(e.n * S.diff.flow), lim = q.hw - 0.6, cols = Math.max(4, Math.round(Math.sqrt(n) * 1.6)), rel = e.rel || 3.4;
  for (let k = 0; k < n; k++) {
    const c = k % cols, row = (k / cols) | 0, x = clamp((c + 0.5 + (rnd() - 0.5) * 0.6) / cols * 2 * lim - lim, -lim, lim);
    const i = addRedM(x, -16 - row * 0.9 - rnd() * 0.5, e.kind === undefined ? 1 : e.kind, 3, 1);
    if (i >= 0) { S.R.spd[i] = (q.vMax + rel) * (0.92 + 0.16 * rnd()); S.R.t[i] = rnd() * 2 - 1; }
  }
  ev('chase', n);
}
function hasChasers() {
  const r = S.R;
  for (let j = 0; j < r.n; j++) if (r.hp[j] > 0 && r.gate[j] === 3) return true;
  return false;
}

/* ---------- 九頭蛇（第二十四關的魔王）----------
   身體停在橋頭，三顆頭各守一條路線（x = -5、0、5）。箭要從那條線上射過去才打得到那顆頭，所以要站到牠面前——牠也專朝那一條噴毒。
   一顆頭被砍掉後 regrow 秒會再長回來（剩一半血）；三顆在同一段時間裡都砍掉，九頭蛇才倒下。
   lv.headHp = 每顆頭的血量。 */
const HYDRA_X = [-5, 0, 5], HYDRA_LANE = 2.5, HYDRA_REGROW = 16;
function hydraLand(e, z) {
  const hp = Math.round((S.lv.headHp || 2400) * S.diff.hp);
  const heads = HYDRA_X.map((x, k) => ({ k, x, hp, max: hp, alive: true, cd: 3.2 + k * 1.1, regrow: 0, flash: 0, grow: 1, bite: 0 }));
  S.boss = addBig({ team: 1, kind: 'hydra', t: 0, x: 0, z, r: 6, hp: hp * 3, spd: 0, st: 'come', fixed: false, zHold: MZ_BOSS, heads, rage: false, sum: 6.5, n: 0 });
  S.boss.maxHp = hp * 3;
}
function hydraSync(o) { let s = 0; for (const h of o.heads) if (h.alive) s += h.hp; o.hp = s; }
// 傷害給那條線上的頭；x 沒給（箭雨）就平均分給還活著的頭
function hydraHurt(o, dmg, x) {
  if (o.dead || !o.fixed) return;
  const hs = o.heads.filter((h) => h.alive); if (!hs.length) return;
  if (x === undefined) { for (const h of hs) hydraHit(o, h, dmg / hs.length); }
  else { let best = null, bd = 1e9; for (const h of hs) { const d = Math.abs(h.x - x); if (d < bd) { bd = d; best = h; } } hydraHit(o, best, dmg); }
  hydraSync(o); o.flash = 0.12;
  if (!o.rage && o.hp < o.maxHp * 0.5 && o.heads.every((h) => h.alive || h.regrow > 0)) { o.rage = true; ev('rage', o); }
  if (o.heads.every((h) => !h.alive)) {
    o.dead = true; o.hp = 0; S.kills++; S.coinsBig += 500;
    ev('bigdie', o); S.marks.length = 0; S.strafes.length = 0;
    S.boss = null; S.bossDone = true; winNow();
  }
}
function hydraHit(o, h, dmg) {
  h.hp -= dmg; h.flash = 0.12;
  if (h.hp <= 0) { h.hp = 0; h.alive = false; h.regrow = S.lv.regrow || HYDRA_REGROW; h.grow = 0; ev('headdie', o, h); }
}
// 這支箭（x 位置）會打到哪顆頭；打到身體沒有頭的地方就被鱗片彈開
function hydraHeadAt(o, x) { for (const h of o.heads) if (h.alive && Math.abs(h.x - x) < HYDRA_LANE) return h; return null; }
function stepHydra(o, dt) {
  const q = S.sq;
  if (o.st === 'come') {
    if (o.z <= o.zHold) { o.z = o.zHold; o.fixed = true; o.st = 'fight'; o.t0 = S.time; q.hold = true; ev('hydra', o); }
    return;
  }
  for (const h of o.heads) { if (h.flash > 0) h.flash -= dt; if (h.bite > 0) h.bite -= dt * 2; if (h.alive && h.grow < 1) h.grow = Math.min(1, h.grow + dt * 1.5); }
  if (S.state !== 'play') return;
  const k = 1 / S.diff.spd, wk = 1 / Math.sqrt(S.diff.spd);
  for (const h of o.heads) {
    if (!h.alive) {
      h.regrow -= dt;
      if (h.regrow <= 0) { h.alive = true; h.hp = h.max * 0.5; h.grow = 0; h.cd = 2.5; hydraSync(o); ev('regrow', o, h); }
      continue;
    }
    h.cd -= dt;
    if (h.cd <= 0) {
      // 朝自己那一條噴毒；暴怒後噴得更勤、毒霧更寬
      h.cd = (o.rage ? 4.2 : 5.6) * k * (0.9 + 0.2 * rnd()); h.bite = 1;
      const f = addStrafe(h.x, o.z - 4, 1.55 * wk, false, o.rage ? 5.8 : 4.8); f.gas = true;
    }
  }
  o.sum -= dt;
  if (o.sum <= 0) {
    o.sum = o.rage ? 6 : 8.5;
    spawnPack({ x: (rnd() - 0.5) * 8, w: 8, n: o.rage ? 70 : 45, run: 1, kind: 1, den: 2 }, o.z + 2);
    ev('roar', o);
  }
}
