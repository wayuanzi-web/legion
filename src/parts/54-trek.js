/* ===== 54-trek: 天下篇行軍關（第十二、十四、十六關）的新機關 =====
   track 裡除了會佔位置的東西，還有「走到這裡就發生」的事件（volley 投石、strafe 赤龍俯衝……），一律排進 S.evq。 */
const MARCH_EVT = { strafe: 1, volley: 1, aval: 1, boulder: 1 };
// 事件提早多遠觸發：滾石從視野最遠處（跟其他東西一樣在 MZ_SPAWN 附近）出現、滾一段路，才會在 d 附近碰到隊伍
const ROLL_Z = 166, EVT_LEAD = { boulder: 82 };
function marchEvent(e) {
  if (e.t === 'strafe') dragonStrafe(e);
  else if (e.t === 'volley') rockVolley(e);
  else if (e.t === 'aval') avalanche(e);
  else if (e.t === 'boulder') addRoll(e, ROLL_Z);
}

/* ---------- 落石峽（第十二關）----------
   投石（volley）：崖頂的投石機朝隊伍砸 n 顆大石，地上先亮紅圈；落點算好提前量，不閃就會砸進隊伍裡。
   滾石（boulder）：從橋的另一頭滾下來的巨石，箭射得碎（hp），沒射碎就一路輾過去（敵我都輾）。 */
function rockVolley(e) {
  const q = S.sq, n = e.n || 3, rad = e.rad || 2.4, dur = e.dur || 1.7, sp = e.spread || 4.4, lim = q.hw - 1;
  const lead = q.v * dur, side = rnd() < 0.5 ? -1 : 1;
  for (let k = 0; k < n; k++) {
    // 第一顆對準隊伍，其餘往兩旁散開，留一條縫給人鑽
    const off = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * sp;
    const tx = clamp(q.x + off + (rnd() - 0.5) * 1.2, -lim, lim), tz = q.cz + lead + (rnd() - 0.5) * 3;
    throwAt('rock', side * (q.hw + 16), tz + 26, 12, tx, tz, rad, dur + k * 0.12);
  }
  ev('volley', side);
}
function addRoll(e, z) {
  const o = { x: e.x, z, r: e.r || 1.5, hp: Math.max(1, Math.round((e.hp || 30) * S.diff.hp)), spd: (e.spd || 7) * S.diff.spd, rot: 0, flash: 0, killed: 0 };
  o.max = o.hp; S.rolls.push(o); ev('roll', o);
}
function hitRoll(o, dmg) {
  o.hp -= dmg; o.flash = 1;
  if (o.hp > 0) return;
  o.hp = 0; o.dead = true;
  blast(1, o.x, o.z, o.r + 1.2, 30, 1, 9);
  ev('rollbreak', o);
}
function stepRolls(dt) {
  const rs = S.rolls, v = S.sq.v;
  for (let i = rs.length - 1; i >= 0; i--) {
    const o = rs[i];
    if (o.flash > 0) o.flash -= dt * 5;
    if (o.dead || o.z < MZ_OUT) { rs.splice(i, 1); continue; }
    o.z -= o.spd * dt; o.rot += (o.spd + v) * dt / o.r;
    // 輾過去：碰到的兵一律倒下（我軍、赤潮都算）
    o.killed += blast(0, o.x, o.z, o.r + 0.3, 12, 5, 9);
    blast(1, o.x, o.z, o.r + 0.3, 12, 1, 9);
  }
}
// 箭射中滾石（stepArrow 叫）；回傳 true 表示射中了
function arrowRoll(p, zp) {
  for (const o of S.rolls) {
    if (o.dead) continue;
    const da = p.x - o.x; if (da > o.r + 0.2 || da < -o.r - 0.2) continue;
    if (p.z >= o.z - o.r && zp <= o.z + o.r) { hitRoll(o, p.dmg); ev('spark', p.x, o.z - o.r); return true; }
  }
  return false;
}

/* ---------- 冰河（第十四關）----------
   冰面（ice）：從 d 起 len 長的一段是光溜溜的冰，隊伍左右移動會滑（有慣性、會滑過頭）。
   薄冰（crack）：看得出來的一塊薄冰，有人（敵我都算）踩上去 CRACK_T 秒後就碎成冰窟窿，上面的人全掉下去。
   雪崩（aval）：山上滾下一道雪，沿著一條路線一路掃到橋尾，跟赤龍的火線一樣先亮預告。
   冰封的援兵是 rw: 'troop' 的木桶換成冰塊（ice: true）；冰牆是沒有獎勵的大木桶（rw: 'wall'，hw = 半寬）。 */
const CRACK_T = 0.9;
function onIce() {
  const q = S.sq, d = q.dist + q.cz;
  for (const s of S.ices) if (d >= s.d && d <= s.d + s.len) return true;
  return false;
}
function stepCracks(dt) {
  const cs = S.cracks; if (!cs.length) return;
  const b = S.B, r = S.R;
  for (let i = cs.length - 1; i >= 0; i--) {
    const c = cs[i], x0 = c.x - c.w / 2, x1 = c.x + c.w / 2, z0 = c.z, z1 = c.z + c.len;
    if (z1 < MZ_OUT) { cs.splice(i, 1); continue; }
    if (c.t < 0) {
      // 還是完整的薄冰：有人踩上去就開始裂
      let on = false;
      for (let j = 0; j < b.n && !on; j++) if (b.hp[j] > 0 && b.y[j] < 0.4 && b.z[j] >= z0 && b.z[j] <= z1 && b.x[j] > x0 && b.x[j] < x1) on = true;
      for (let j = 0; j < r.n && !on; j++) if (r.hp[j] > 0 && r.z[j] >= z0 && r.z[j] <= z1 && r.x[j] > x0 && r.x[j] < x1) on = true;
      if (on) { c.t = 0; ev('crack', c); }
      continue;
    }
    c.t += dt;
    if (c.t >= CRACK_T) {
      // 碎了：變成冰窟窿（之後就跟橋面缺口一樣），站在上面的敵我全掉下去
      cs.splice(i, 1);
      S.holes.push({ x: c.x, w: c.w, z: c.z, len: c.len, ice: true });
      for (let j = 0; j < b.n; j++) if (b.hp[j] > 0 && b.y[j] < 0.4 && b.z[j] >= z0 && b.z[j] <= z1 && b.x[j] > x0 && b.x[j] < x1) killBlue(j, 6, b.x[j], b.z[j], 0);
      for (let j = 0; j < r.n; j++) if (r.hp[j] > 0 && r.z[j] >= z0 && r.z[j] <= z1 && r.x[j] > x0 && r.x[j] < x1) killRed(j, 6, r.x[j], r.z[j], 0);
      ev('icebreak', c);
    }
  }
}
function avalanche(e) {
  const q = S.sq, w = e.w || 7;
  addStrafe(e.x !== undefined ? e.x : q.x + (e.off || 0), 150, (e.warn || 1.7) / Math.sqrt(S.diff.spd), false, w, true);
}

/* ---------- 帝都決戰（第十六關）----------
   崩塌（lv.collapse）：橋在身後一路崩塌，崩塌線每秒推進 v 格，最多落後隊伍 lag 格；掉到崩塌線後面的人（敵我都算）都掉下去。
     崩塌線追到隊尾時，整團人會往前擠；擠到前面也沒路了（被拒馬擋住）就只能等死。走到決戰的地方（end）就不會再塌。
   拒馬（block）：橫跨整座橋，hp 要射幾箭；隊伍走到它面前會停下來，射破才能繼續走——這時崩塌會追上來。
   疾行門（gate 加 rush: 速度倍率, dur: 幾秒）：第一個兵穿過去，全隊加速一陣子。
   帝王機關巨像（colossus）：橋頭的決戰魔王。巨拳砸地（地上先亮紅圈）、胸口砲連發、放出盾兵；血剩一半暴怒，每隔一拳雙拳齊砸橋中央。 */
function collapseInit(lv) {
  const c = lv.collapse;
  S.col = c ? { w: c.z0 || -30, v: c.v, lag: c.lag || 36, end: S.sq.len - (c.stop || 12), warned: 0 } : null;
}
function collapseZ() { return S.col ? S.col.w - S.sq.dist : -1e9; }
function stepCollapse(dt) {
  const c = S.col, q = S.sq;
  if (S.state === 'play') c.w = Math.min(c.end, Math.max(c.w + c.v * dt, q.dist - c.lag));
  const zc = c.w - q.dist;
  if (zc > MZ_OUT - 3) {
    const b = S.B, r = S.R;
    for (let j = 0; j < b.n; j++) if (b.hp[j] > 0 && b.z[j] < zc) killBlue(j, 6, b.x[j], b.z[j], 0);
    for (let j = 0; j < r.n; j++) if (r.hp[j] > 0 && r.z[j] < zc) killRed(j, 6, r.x[j], r.z[j], 0);
  }
  // 崩塌線追近就喊（1 = 快塌到了、2 = 已經塌到隊尾）；喊過的要等它退開 4 格才重新上膛，下次被拒馬擋住時會再喊
  const lvl = zc > MZ_REAR - 1 ? 2 : zc > -12 ? 1 : 0, keep = zc > MZ_REAR - 5 ? 2 : zc > -16 ? 1 : 0;
  if (lvl > c.warned) { c.warned = lvl; ev('collapse', lvl); } else if (keep < c.warned) c.warned = keep;
}
function passRush(g) {
  const q = S.sq; pickGate(g); g.alive = false; g.flash = 1;
  q.rushT = g.rdur; q.rushK = g.rush; ev('rush', g);
}
function colossusLand(e, z) {
  const hp = Math.round((S.lv.bossHp || 4000) * S.diff.hp);
  S.boss = addBig({ team: 1, kind: 'colossus', t: 0, x: 0, z, r: 4.4, hp, spd: 0, st: 'come', fixed: false, zHold: MZ_BOSS, fist: 2.6, gun: 6, sum: 4.5, rage: false, arms: [], n: 0 });
}
function colossusFist(o, x, z, r, dur, sd) {
  o.arms.push({ x, z, r, t: 0, dur, sd, hit: false });
  S.marks.push({ x, z, r, t: 0, dur, kind: 'fist' });
  ev('fist', o, x, z);
}
function stepColossus(o, dt) {
  const q = S.sq;
  if (o.st === 'come') {
    if (o.z <= o.zHold) { o.z = o.zHold; o.fixed = true; o.st = 'fight'; o.t0 = S.time; q.hold = true; ev('colossus', o); }
    return;
  }
  for (let i = o.arms.length - 1; i >= 0; i--) {
    const f = o.arms[i]; f.t += dt;
    if (!f.hit && f.t >= f.dur) { f.hit = true; const k = blast(0, f.x, f.z, f.r, 260, 5, 13); blastBigs(0, f.x, f.z, f.r, 2); ev('slam', f, k); }
    if (f.t > f.dur + 0.7) o.arms.splice(i, 1);
  }
  if (S.state !== 'play') return;
  if (!o.rage && o.hp < o.maxHp * 0.5) { o.rage = true; ev('rage', o); }
  o.x = Math.sin((S.time - o.t0) * 0.45) * 2.4;
  o.fist -= dt; o.gun -= dt; o.sum -= dt;
  const k = 1 / S.diff.spd, wk = 1 / Math.sqrt(S.diff.spd), lim = q.hw - 1;
  if (o.fist <= 0) {
    o.fist = (o.rage ? 3.4 : 4.4) * k; o.n++;
    // 暴怒後每隔一拳改成雙拳齊砸橋中央：隊伍在中央時排得最寬、躲不掉，要往欄杆靠、擠成長龍才躲得開
    if (o.rage && o.n % 2 === 0) for (const sd of [-1, 1]) colossusFist(o, sd * 1.5, q.cz + 1, 2.7, 1.55 * wk, sd);
    else colossusFist(o, clamp(q.x, -lim + 2, lim - 2), q.cz + 1, o.rage ? 4.2 : 3.8, 1.45 * wk, q.x >= o.x ? 1 : -1);
  }
  if (o.gun <= 0) {
    o.gun = (o.rage ? 5.6 : 7.5) * k; const n = o.rage ? 6 : 4;
    for (let i = 0; i < n; i++) { throwAt('bomb', o.x, o.z - 2, 9, clamp(q.x + rr(-6, 6), -lim, lim), q.cz + rr(-3, 5), 2.2, 1.5 + i * 0.12); S.proj[S.proj.length - 1].cb = 1; }
    ev('cgun', o);
  }
  if (o.sum <= 0) {
    o.sum = o.rage ? 6.5 : 9;
    spawnPack({ x: o.x, w: 9, n: o.rage ? 64 : 40, run: 1, kind: 2, den: 2 }, o.z + 2);
    ev('roar', o);
  }
}
