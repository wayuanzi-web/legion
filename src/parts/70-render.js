/* ===== 70-render: 把戰局畫出來。所有東西照縱深由遠到近排序後一次送出 ===== */
const NBK = 364, BK = 2, ZTOP = L + 66;           // 縱深分桶（每世界單位 2 桶；行軍關的東西從很遠的地方進場）
const ordCnt = new Int32Array(NBK + 1), ordCur = new Int32Array(NBK + 1);
const ord = new Int32Array(BLUE_CAP + RED_CAP), bkB = new Uint16Array(BLUE_CAP), bkR = new Uint16Array(RED_CAP);
// 小兵四格動畫的貼圖座標：[我軍, 赤卒, 狼騎, 盾卒]
const SUV = new Float32Array(4 * 4 * 4);
const SOLDIER_W = [1.7, 1.7, 1.95, 1.85];
function renderInit() {
  SPT = SPN.map((n) => AT.sp[n]);
  AT.sp.barrel.ay = 86 / 96; AT.sp.cask.ay = 86 / 96; AT.sp.rpost.ay = AT.sp.rpostI.ay = AT.sp.rpostG.ay = 90 / 96; AT.sp.canBase.ay = 0.9; AT.sp.canBarrel.ay = 0.94;
  ['b', 'r', 'w', 's'].forEach((p, k) => { for (let f = 0; f < 4; f++) { const s = AT.sp[p + f], o = (k * 4 + f) * 4; SUV[o] = s.u0; SUV[o + 1] = s.v0; SUV[o + 2] = s.u1; SUV[o + 3] = s.v1; } });
}
const objs = [];
function pushObj(z, kind, ref) { let b = ((ZTOP - z) * BK) | 0; if (b < 0) b = 0; else if (b >= NBK) b = NBK - 1; objs.push({ b, kind, ref }); }
function groundQ(z) { return V.q0 / (1 + z * V.g); }   // 地面圓在該縱深被壓扁的比例

function drawGate(g) {
  const A = AT.sp, ky = V.ky;
  P(g.x - g.w / 2, g.z); const xL = PX, y = PY, s = PS; P(g.x + g.w / 2, g.z); const xR = PX;
  const add = g.add !== undefined, k = add ? (g.add < 0 ? 1 : 0) : g.kind, gone = g.alive ? 0 : Math.min(1, (g.gone || 0) / 0.5), al = 1 - gone;
  const fl = Math.max(0, g.flash), appear = Math.min(1, (S.time - g.born) / 0.35);
  const post = k === 2 ? A.postG : k === 1 ? A.postR : A.postB, beam = k === 2 ? A.beamG : k === 1 ? A.beamR : A.beamB;
  const tint = k === 2 ? rgba(255, 214, 90, 255) : k === 1 ? rgba(255, 70, 50, 255) : rgba(80, 175, 255, 255);
  const hTop = 4.25 * s * ky * (0.3 + 0.7 * appear), hBeam = 2.05 * s * ky;
  // 光幕
  const ca = ((add ? 0.78 : 0.5) + 0.22 * fl + 0.1 * Math.sin(S.time * 5 + g.id)) * al * appear;
  sprWH(A.curtain, xL, y - hTop + hBeam * 0.4, xR - xL, hTop - hBeam * 0.4, colA(tint, ca), 0);
  sprWH(A.curtain, xL, y - hTop + hBeam * 0.4, xR - xL, hTop - hBeam * 0.4, colA(tint, ca * 0.5), EX_ADD);
  const pw = 1.18 * s;
  spr(post, xL, y + 0.16 * s, pw, colA(WHITE, al), 0); spr(post, xR, y + 0.16 * s, pw, colA(WHITE, al), 0);
  // 門楣與倍數
  const pop = 1 + fl * 0.07, bw = (xR - xL) + 0.9 * s, bx = (xL + xR) / 2, by = y - hTop - 0.1 * s;
  const bh = hBeam * pop;
  sprWH(beam, bx - bw * pop / 2, by - (bh - hBeam) / 2, bw * pop, bh, colA(WHITE, al), ((fl * 46) | 0) << 8);
  const label = add ? (g.add < 0 ? '-' : '+') + Math.abs(g.add) : g.m < 1 ? '÷' + Math.round(1 / g.m) : '×' + g.m;
  const th = hBeam * 0.86 * pop;
  text(label, bx, by + (hBeam - th) * 0.42, th, colA(WHITE, al), 0);
  if (g.alt && g.alive) {     // 陰陽門：還有多久換邊
    const w = bw * 0.8, f = clamp(g.left / g.span, 0, 1), warn = g.left < 0.8 && ((S.time * 8) & 1);
    rect(bx - w / 2, by + hBeam + 0.12 * s, w, 0.3 * s, rgba(20, 16, 30, 200 * al));
    rect(bx - w / 2 + 0.05 * s, by + hBeam + 0.17 * s, (w - 0.1 * s) * f, 0.2 * s, warn ? WHITE : k === 1 ? rgba(255, 120, 100, 255) : rgba(140, 205, 255, 255));
  }
  if (g.cap0) {     // 黃金門剩餘次數
    const w = bw * 0.8, f = clamp(g.cap / g.cap0, 0, 1);
    rect(bx - w / 2, by + hBeam + 0.12 * s, w, 0.3 * s, rgba(20, 16, 30, 200 * al));
    rect(bx - w / 2 + 0.05 * s, by + hBeam + 0.17 * s, (w - 0.1 * s) * f, 0.2 * s, rgba(255, 230, 120, 255 * al));
  }
}
// 赤門：橫在隘道上的敵方倍增門，數字是還要撞幾下
function drawRGate(g) {
  const A = AT.sp, ky = V.ky, al = g.alive ? 1 : Math.max(0, 1 - g.gone / 0.45);
  if (al <= 0) return;
  P(g.x - g.w / 2, g.z); const xL = PX, y = PY, s = PS; P(g.x + g.w / 2, g.z); const xR = PX;
  const fl = Math.max(0, g.flash), drop = g.alive ? 0 : g.gone * 3 * s;
  const hTop = 5.6 * s * ky, hBeam = 2.3 * s * ky, tint = rgba(255, 60, 40, 255);
  sprWH(A.curtain, xL, y - hTop + hBeam * 0.4 + drop, xR - xL, hTop - hBeam * 0.4, colA(tint, (0.5 + 0.2 * fl + 0.1 * Math.sin(S.time * 6 + g.id)) * al), 0);
  sprWH(A.curtain, xL, y - hTop + hBeam * 0.4 + drop, xR - xL, hTop - hBeam * 0.4, colA(tint, 0.3 * al), EX_ADD);
  const pw = 1.6 * s;
  spr(A.postR, xL, y + 0.2 * s + drop, pw, colA(WHITE, al), 0); spr(A.postR, xR, y + 0.2 * s + drop, pw, colA(WHITE, al), 0);
  const bw = (xR - xL) + 1.3 * s, bx = (xL + xR) / 2, by = y - hTop - 0.1 * s + drop, pop = 1 + fl * 0.05;
  sprWH(A.beamR, bx - bw * pop / 2, by, bw * pop, hBeam * pop, colA(WHITE, al), ((fl * 60) | 0) << 8);
  const th = hBeam * 0.84;
  text('×' + g.m, bx, by + (hBeam - th) * 0.42, th, colA(rgba(255, 225, 120, 255), al), 0);
  if (g.alive) {
    const w = bw * 0.72, f = clamp(g.hp / g.max, 0, 1);
    rect(bx - w / 2, by + hBeam + 0.14 * s, w, 0.42 * s, rgba(20, 16, 30, 220));
    rect(bx - w / 2 + 0.06 * s, by + hBeam + 0.2 * s, (w - 0.12 * s) * f, 0.3 * s, rgba(255, 90, 70, 255));
    const nh = Math.max(1.5 * s, 12 * V.u); text(String(Math.ceil(g.hp)), bx, by + hBeam + 0.7 * s, nh, WHITE, 0);
  }
}
function drawPed(p) {
  const A = AT.sp; P(p.x, p.z); const s = PS, x = PX, y = PY;
  const ts = p.kind === 'ballista' ? A.ballista : p.kind === 'sluice' ? A.sluice : A.mortar;
  if (p.escort) {      // 行軍關跟著部隊走的機關車
    const k = Math.max(0, p.kick), w = 3.5 * s;
    spr(A.soft, x, y + 0.5 * s, 3.6 * s, rgba(0, 0, 20, 90), 0);
    sprRot(ts, x, y - 1.0 * s + k * 0.25 * s, w, w, clamp(p.aim, -0.8, 0.8) * 0.8, WHITE, 0);
    if (k > 0.5) spr(A.soft, x, y - 1.4 * s, 2.8 * s, rgba(255, 220, 150, 200), EX_ADD);
    return;
  }
  spr(A.ped, x, y + 1.25 * s, 4.3 * s, WHITE, p.flash > 0 ? ((p.flash * 150) << 8) : 0);
  if (!p.built) {
    const bob = Math.sin(S.time * 3) * 0.12 * s, f = p.got / p.need;
    spr(ts, x, y + 0.5 * s + bob, 3.5 * s, colA(WHITE, p.kind === 'sluice' ? 1 : 0.3 + 0.25 * f), 0);
    const th = 1.5 * s, str = String(p.need - p.got), tw = textW(str, th);
    sprWH(A.icon, x - tw / 2 - th * 0.75, y - 4.9 * s + bob + th * 0.14, th * 0.72, th * 0.72, WHITE, 0);
    text(str, x + th * 0.3, y - 4.9 * s + bob, th, rgba(255, 240, 170, 255), 0);
  } else {
    const k = Math.max(0, p.kick), w = 4.1 * s, h = w;
    sprRot(ts, x, y - 1.25 * s + k * 0.3 * s, w, h, clamp(p.aim, -0.8, 0.8) * 0.8, WHITE, 0);
    if (k > 0.5) spr(A.soft, x, y - 1.6 * s, 3.2 * s, rgba(255, 220, 150, 200), EX_ADD);
  }
}
function drawBarrel(q) {
  if (!q.alive) return;
  const A = AT.sp; P(q.x, q.z); const s = PS;
  if (q.rw && q.rw !== 'tnt') {
    const fl = q.flash > 0 ? (150 << 8) : 0, bob = Math.sin(S.time * 3 + q.x) * 0.1 * s, x = PX, y = PY;
    if (q.rw === 'elite') {
      const ts = q.elite === 'mortar' ? A.mortar : A.ballista;
      spr(A.soft, x, y + 0.6 * s, 5.4 * s, rgba(0, 0, 20, 100), 0);
      spr(A.soft, x, y - 1.2 * s, 7 * s, rgba(255, 215, 100, 70 + 40 * Math.sin(S.time * 4)), EX_ADD);
      spr(ts, x, y + 0.3 * s, 3.6 * s, WHITE, 0);
      spr(A.cage, x, y + 0.5 * s, 4.4 * s, WHITE, fl);
      const th = Math.max(1.5 * s, 13 * V.u); text(String(q.hp), x, y - 4.6 * s - th, th, rgba(255, 225, 120, 255), 0);
      return;
    }
    spr(A.cask, x, y + 0.25 * s, 2.5 * s, WHITE, fl);
    if (q.rw === 'troop') {
      const k = q.n >= 16 ? 3 : q.n >= 9 ? 2 : 1;
      for (let i = 0; i < k; i++) spr(A.b0, x + (i - (k - 1) / 2) * 0.8 * s, y - 2.25 * s + bob + (i === 1 ? 0.2 * s : 0), 1.7 * s, WHITE, 0);
      const th = Math.max(0.95 * s, 9 * V.u); text('+' + q.n, x, y - 4.1 * s + bob - th, th, rgba(150, 215, 255, 255), 0);
    } else {
      spr(A.soft, x, y - 2.6 * s, 4.6 * s, rgba(90, 170, 255, 110 + 50 * Math.sin(S.time * 5)), EX_ADD);
      spr(A.bowI, x, y - 2.1 * s + bob, 2.5 * s, WHITE, 0);
    }
    const th = Math.max(1.2 * s, 11 * V.u); text(String(q.hp), x, y - 0.5 * s - th, th, WHITE, 0);
    return;
  }
  const lit = q.fuse >= 0, w = 2.3 * s * (lit ? 1 + 0.25 * Math.sin(S.time * 60) : 1);
  spr(A.soft, PX, PY - 0.6 * s, 6 * s, rgba(255, 150, 30, 120 + 60 * Math.sin(S.time * 5 + q.z)), EX_ADD);
  spr(A.barrel, PX, PY + 0.25 * s, w, WHITE, lit || q.flash > 0 ? (170 << 8) : 0);
  const th = Math.max(1.5 * s, 15 * V.u);
  text(String(q.hp), PX, PY - 2.6 * s - th, th, rgba(255, 225, 120, 255), 0);
}
function hpBar(x, y, w, h, f, col) {
  rect(x - w / 2 - h * 0.25, y - h * 0.25, w + h * 0.5, h * 1.5, rgba(16, 12, 24, 215));
  rect(x - w / 2, y, w * clamp(f, 0, 1), h, col);
}
// 赤龍：頭在 (hx, hz)、離地 hy，身體往遠處一節一節蜿蜒；n = 幾節
function drawDragonAt(hx, hz, hy, n, al, flash, rage) {
  const A = AT.sp, ky = V.ky, t = FX.time, col = colA(WHITE, al);
  for (let i = n; i >= 1; i--) {
    const k = i / n, sx = hx + Math.sin(t * 1.7 - i * 0.55) * (0.6 + i * 0.26), sz = hz + 1.6 + i * 1.55, sy = hy + Math.sin(t * 2.1 - i * 0.6) * 0.7 + i * 0.12;
    P(sx, sz); const w = (4.6 - 3.0 * k) * PS;
    spr(A.soft, PX, PY + 0.3 * PS, w * 1.25, rgba(0, 0, 20, 70 * al), 0);
    spr(A.dgB, PX, PY - sy * PS * ky, w, col, flash);
    if (i === n) spr(A.fire, PX, PY - sy * PS * ky - 0.2 * PS, w * 1.8, colA(WHITE, al * 0.9), EX_ADD);
  }
  P(hx, hz); const s = PS, bob = Math.sin(t * 2.1) * 0.5;
  spr(A.soft, PX, PY + 0.4 * s, 7.6 * s, rgba(0, 0, 20, 90 * al), 0);
  if (rage) spr(A.soft, PX, PY - (hy + bob) * s * ky, 13 * s, rgba(255, 60, 20, (90 + 50 * Math.sin(t * 9)) * al), EX_ADD);
  sprRot(A.dgH, PX, PY - (hy + bob) * s * ky - 0.3 * s, 7.4 * s, 7.4 * s * A.dgH.h / A.dgH.w, Math.sin(t * 1.7) * 0.12, col, flash);
}
function drawBig(o) {
  const A = AT.sp, ky = V.ky; P(o.x, o.z); const s = PS, x = PX, y = PY;
  if (o.kind === 'dragon') { drawDragonAt(o.x, o.z, 4.6, 15, 1, o.flash > 0 ? ((Math.min(1, o.flash / 0.12) * 50) | 0) << 8 : 0, o.rage); return; }
  const fl = o.flash > 0 ? ((Math.min(1, o.flash / 0.12) * (o.kind === 'boss' ? 45 : 80)) | 0) << 8 : 0;
  if (o.kind === 'hero') {
    const sp = A['he' + (((o.anim * 7) | 0) & 1)], w = 5.6 * s;
    if (o.st === 'fly') {
      const sh = 1 / (1 + o.y * 0.12);
      spr(A.soft, x, y + 0.5 * s * sh, 3.4 * s * sh, rgba(0, 0, 20, 110), 0);
      sprRot(sp, x, y - o.y * s * ky - 1.8 * s, w, w * sp.h / sp.w, o.tm * 9, WHITE, 0);
      spr(A.soft, x, y - o.y * s * ky + 0.6 * s, 6 * s, rgba(255, 220, 120, 150), EX_ADD);
      return;
    }
    spr(A.soft, x, y + 1.6 * s, 8.5 * s, rgba(255, 215, 100, 90), EX_ADD);
    spr(sp, x, y + 0.3 * s, w, WHITE, fl);
    // 旋風刀光
    const r = 6.4 * s;
    sprRot(A.slash, x, y - 1.3 * s, r, r * 0.62, -o.anim * 13, rgba(255, 245, 200, 235), EX_ADD);
    sprRot(A.slash, x, y - 1.3 * s, r * 0.8, r * 0.5, -o.anim * 13 + 3.1, rgba(160, 210, 255, 200), EX_ADD);
    hpBar(x, y - 7.3 * s, 3.4 * s, 0.28 * s, o.life / S.hero.life, rgba(255, 210, 70, 255));
    return;
  }
  if (o.kind === 'brute') {
    spr(A['br' + (((o.anim * 5) | 0) & 1)], x, y + 0.25 * s, 4.3 * s, WHITE, fl);
    if (o.hp < o.maxHp) hpBar(x, y - 3.9 * s, 2.2 * s, 0.24 * s, o.hp / o.maxHp, rgba(255, 80, 60, 255));
    return;
  }
  if (o.kind === 'giant') {
    const pose = o.st === 'smash' ? 2 : (((o.anim * 2.6) | 0) & 1);
    const sq = o.st === 'smash' ? 1 + 0.08 * Math.sin(o.tm * 40) : 1;
    spr(A['gi' + pose], x, y + 0.4 * s, 9.4 * s * sq, WHITE, fl);
    hpBar(x, y - 8 * s, 4.2 * s, 0.34 * s, o.hp / o.maxHp, rgba(255, 80, 60, 255));
    return;
  }
  // 魔王
  const rise = o.st === 'rise' ? clamp(o.tm / 2.2, 0, 1) : 1;
  const pose = o.st === 'smash' ? 2 : (((o.anim * 2) | 0) & 1);
  const w = 16.5 * s * (0.4 + 0.6 * rise);
  spr(A.soft, x, y + 2 * s, 20 * s, rgba(255, 60, 30, 70 + 40 * Math.sin(S.time * 4)), EX_ADD);
  spr(A['bo' + pose], x, y + 0.6 * s, w, colA(WHITE, rise), fl);
  if (o.rage) spr(A.soft, x, y - 4 * s, 15 * s, rgba(255, 40, 10, 90 + 50 * Math.sin(S.time * 9)), EX_ADD);
}
function drawCannon() {
  const A = AT.sp; P(S.cannonX, CANZ); const s = PS, x = PX, y = PY;
  const rc = Math.max(0, S.recoil), hg = Math.max(0, FX.heroGlow), ready = S.hero.ready > 0;
  spr(A.canBase, x, y + 1.3 * s, 5.1 * s, WHITE, 0);
  const jx = ready ? (Math.random() - 0.5) * 0.18 * s : 0;
  if (ready) spr(A.soft, x, y - 1.2 * s, 9 * s, rgba(255, 215, 90, 170), EX_ADD);
  spr(A.canBarrel, x + jx, y + (0.55 + rc * 0.42) * s, 2.75 * s * (1 + (ready ? 0.12 : 0)), WHITE, ready ? (90 << 8) : 0);
  if (FX.muzzle > 0) { const m = Math.min(1.6, FX.muzzle); spr(A.soft, x, y - 2.6 * s, 3.4 * s * m, rgba(255, 240, 190, 210), EX_ADD); }
}

// 大水：浪頭後面拖著一片水，順著隘道的形狀一段一段鋪
function drawFlood(f) {
  const A = AT.sp, fade = f.t > f.dur ? Math.max(0, 1 - (f.t - f.dur) / 0.5) : 1, zb = f.z0;
  for (let z = f.zf; z < zb; z += 2) {
    const z2 = Math.min(zb, z + 2), a = Math.max(0.3, 1 - (z - f.zf) / 34) * fade;
    P(rcx(z) - rhw(z), z); const ax = PX, ay = PY; P(rcx(z) + rhw(z), z); const bx = PX;
    P(rcx(z2) + rhw(z2), z2); const cx = PX, cy = PY; P(rcx(z2) - rhw(z2), z2);
    quad4(PX, cy, cx, cy, bx, ay, ax, ay, rgba(50, 140, 250, 200 * a), 0);
    quad4(PX, cy, cx, cy, bx, ay, ax, ay, rgba(120, 200, 255, 70 * a), EX_ADD);
  }
  if (f.t <= f.dur) {
    const z = f.zf, hw = rhw(z), so = A.soft;
    for (let k = 0; k <= 8; k++) {
      P(rcx(z) + (k / 4 - 1) * hw, z + Math.sin(S.time * 9 + k * 1.7) * 0.5); const r = (2.1 + 0.5 * Math.sin(S.time * 13 + k)) * PS;
      quad(PX - r, PY - r * 0.75, PX + r, PY + r * 0.35, so.u0, so.v0, so.u1, so.v1, rgba(235, 248, 255, 235), 0);
    }
  }
}

/* ---------- 行軍關：跟著隊伍往下捲的橋面與佈景 ---------- */
const RAIL_GAP = 5, ARCH_GAP = 190, ARCH_OFF = 84;
// 牌樓大約每 ARCH_GAP 一座。橫梁會擋到緊跟在後面的門和木桶上的數字，所以往後挪到後面 16 格內沒有門、沒有桶的位置；
// 終點前那一段不擺，免得攻城或打龍時橫在隊伍頭上
function archList() {
  const lv = S.lv; if (lv.arches) return lv.arches;
  const out = [], lim = S.sq.len - 95;
  for (let p0 = ARCH_OFF; p0 < lim; p0 += ARCH_GAP) {
    let p = p0, ok = false;
    for (let k = 0; k < 6 && !ok; k++) { ok = !lv.track.some((e) => (e.t === 'gate' || e.t === 'barrel') && e.d > p - 3 && e.d < p + 16); if (!ok) p += 7; }
    if (ok && p < lim) out.push(p);
  }
  return (lv.arches = out);
}
function hash01(k) { let x = Math.imul(k | 0, 0x9E3779B1) ^ 0x5bd1e995; x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d); x ^= x >>> 12; return (x >>> 0) / 4294967296; }
function drawBridgeGround() {
  const q = S.sq, d = q.dist, hw = q.hw, T = THEMES[S.lv.theme], A = AT.sp, H = V.H;
  // 小島與橋面浮雕在第二張貼圖上
  useTex(2);
  for (let k = Math.floor((d + 330) / 34); k >= Math.floor((d + ZMIN - 30) / 34); k--) {
    const h = hash01(k * 7 + S.idx * 131), h2 = hash01(k * 13 + 5);
    if (h < 0.22) continue;
    P(((k & 1) ? 1 : -1) * (hw + 6.5 + h * 17), k * 34 + h2 * 20 - d);
    if (PY < -80 || PY > H + 260) continue;
    spr(SHEET['isle' + ((k % 3) + 3) % 3], PX, PY, (7.5 + h2 * 5) * PS, WHITE, 0);
  }
  for (let k = Math.floor((d + ZMIN) / 22); k <= Math.floor((d + 190) / 22); k++) {
    const z = k * 22 + 11 - d; P(0, z); const r = 1.45 * PS, ry = r * groundQ(z), m = SHEET.medal;
    quad(PX - r, PY - ry, PX + r, PY + ry, m.u0, m.v0, m.u1, m.v1, WHITE, 0);
  }
  useTex(0);
  // 海面的浪花
  const fo = T.foam, so = A.soft;
  for (let k = Math.floor((d + ZMIN - 10) / 4); k <= Math.floor((d + 260) / 4); k++) {
    const h = hash01(k * 3 + 1), h2 = hash01(k * 5 + 2), z = k * 4 + h2 * 3 - d;
    P(((k & 1) ? 1 : -1) * (hw + 2.6 + h * 34), z); const w = (1.6 + h2 * 2.6) * PS, hh = 0.16 * PS;
    quad(PX - w, PY - hh, PX + w, PY + hh, so.u0, so.v0, so.u1, so.v1, rgba(fo[0], fo[1], fo[2], fo[3] * (0.5 + 0.5 * Math.sin(S.time * 1.7 + k))), 0);
  }
  // 石板接縫
  const sc = T.seam, col = rgba(sc[0], sc[1], sc[2], sc[3]);
  const sg = T.seamGap;
  for (let k = Math.floor((d + ZMIN) / sg); k <= Math.floor((d + 190) / sg); k++) {
    P(-hw, k * sg - d); const x0 = PX, y = PY, h = Math.max(1, 0.075 * PS); P(hw, k * sg - d);
    rect(x0, y - h / 2, PX - x0, h, col, 0);
  }
  for (const h of S.holes) {
    // 缺口：看得到底下的海，遠側露出橋板的切面
    const xa = h.x - h.w / 2, xb = h.x + h.w / 2;
    P(xa, h.z); const ax = PX, ay = PY, sa = PS; P(xb, h.z); const bx = PX; P(xb, h.z + h.len); const cx = PX, cy = PY, sb = PS; P(xa, h.z + h.len); const dx = PX;
    const e = Math.max(1, 0.12 * sa);
    quad4(dx - e, cy - e, cx + e, cy - e, bx + e, ay + e, ax - e, ay + e, rgba(40, 30, 20, 255), 0);
    quad4(dx, cy, cx, cy, bx, ay, ax, ay, rgba(16, 52, 100, 255), 0);
    const th = Math.min(0.6 * sb * V.ky, (ay - cy) * 0.5);
    quad4(dx, cy, cx, cy, cx, cy + th, dx, cy + th, rgba(112, 100, 80, 255), 0);
    quad(ax, ay - 0.3 * sa, bx, ay + 0.3 * sa, so.u0, so.v0, so.u1, so.v1, rgba(255, 255, 255, 46), 0);
  }
}
function drawRailPosts(z) {
  const hw = S.sq.hw + 0.28, p = AT.sp[THEMES[S.lv.theme].post];
  P(-hw, z); const w = 0.62 * PS; spr(p, PX, PY + 0.1 * PS, w, WHITE, 0); P(hw, z); spr(p, PX, PY + 0.1 * PS, w, WHITE, 0);
}
function drawArch(z) {
  // 牌樓走到隊伍頭上之前就淡掉，免得橫梁擋住自己人
  const al = clamp((z - 9) / 16, 0, 1); if (al <= 0) return;
  P(0, z); const a = SHEET.arch;
  useTex(2); spr(a, PX, PY, a.w / ARCH_U * PS, colA(WHITE, al), 0); useTex(0);
}
function drawSaw(w) {
  const A = AT.sp; P(w.x, w.z); const s = PS, d = w.r * 2.3 * s;
  spr(A.soft, PX, PY + 0.2 * s, w.r * 2.6 * s, rgba(0, 0, 20, 120), 0);
  sprRot(A.saw, PX, PY - w.r * 0.95 * s, d, d, S.time * 15, WHITE, 0);
}
function drawMarchFort() {
  P(0, S.fz); const f = SHEET[FX.fortRuined ? 'fortR' : 'fort'];
  useTex(2); spr(f, PX, PY, f.w / FORT_U * PS, WHITE, FX.fortShake > 0.5 ? (40 << 8) : 0); useTex(0);
}

function drawSoldiers(k0, k1, tAnim) {
  // ord[k0..k1) 已照縱深排好；正數是我軍索引，負數（~j）是赤潮
  const B = S.B, R = S.R, g = V.g, s0 = V.s0, cx = V.cx, yH = V.yH, C = V.C, ky = V.ky, H = V.H;
  const bx = B.x, bz = B.z, by = B.y, bph = B.ph, bfl = B.fl, rx = R.x, rz = R.z, rph = R.ph, rfl = R.fl, rk = R.kind;
  for (let k = k0; k < k1; k++) {
    const e = ord[k];
    if (e >= 0) {
      const inv = 1 / (1 + bz[e] * g), s = s0 * inv, sx = cx + bx[e] * s, sy = yH + C * inv - by[e] * s * ky;
      if (sy < -20 || sy > H + 60) continue;
      const hw = 0.85 * s, o = (((tAnim + bph[e]) | 0) & 3) * 4;
      quad(sx - hw, sy - 1.514 * s, sx + hw, sy + 0.186 * s, SUV[o], SUV[o + 1], SUV[o + 2], SUV[o + 3], WHITE, bfl[e] ? (190 << 8) : 0);
    } else {
      const j = ~e, kd = rk[j] + 1, inv = 1 / (1 + rz[j] * g), s = s0 * inv, sx = cx + rx[j] * s, sy = yH + C * inv;
      if (sy < -20) continue;
      const w = SOLDIER_W[kd] * s, hw = w * 0.5, o = (kd * 4 + (((tAnim * (kd === 2 ? 1.5 : 0.6) + rph[j]) | 0) & 3)) * 4;
      quad(sx - hw, sy - w * 0.8906, sx + hw, sy + w * 0.1094, SUV[o], SUV[o + 1], SUV[o + 2], SUV[o + 3], WHITE, rfl[j] ? (190 << 8) : 0);
    }
  }
}

function drawParticles(flat) {
  const ky = V.ky, g = V.g, s0 = V.s0;
  for (let i = 0; i < pn; i++) {
    const fl = pFl[i]; if (((fl & PF_FLAT) !== 0) !== flat) continue;
    const inv = 1 / (1 + pZ[i] * g), s = s0 * inv, x = V.cx + pX[i] * s, y = V.yH + V.C * inv - pY[i] * s * ky;
    const t = 1 - pLife[i] / pMax[i];
    let size = pSize[i] * s; if (fl & PF_GROW) size *= 0.5 + 1.9 * t; else if (fl & PF_SHRINK) size *= 1 - t * 0.85;
    const a = t < 0.55 ? 1 : (1 - t) / 0.45, col = pCol[i], ca = ((col >>> 24) * a) | 0;
    const c2 = ((col & 0xffffff) | (ca << 24)) >>> 0, ex = (fl & PF_ADD) ? EX_ADD : 0, sp = SPT[pSp[i]];
    if (flat) { const q = V.q0 * inv; quad(x - size, y - size * q, x + size, y + size * q, sp.u0, sp.v0, sp.u1, sp.v1, c2, ex); }
    else if (pSp[i] === SP_ARROW) sprRot(sp, x, y - size * 0.42, size * 0.24, size, pRot[i], c2, ex);
    else if (pRot[i] !== 0 || pVR[i] !== 0) sprRot(sp, x, y, size * sp.w / sp.h, size, pRot[i], c2, ex);
    else quad(x - size * 0.5, y - size * 0.5, x + size * 0.5, y + size * 0.5, sp.u0, sp.v0, sp.u1, sp.v1, c2, ex);
  }
}

function renderFrame() {
  const A = AT.sp, W = V.W, H = V.H, ky = V.ky, B = S.B, R = S.R;
  if (W < 2 || H < 2 || !GLR.bg) return;
  frameBegin(FX.shx, FX.shy);
  const march = S.mode === 1;
  useTex(!march && FX.fortRuined && GLR.bg2 ? 2 : 1); quad(-40, -40, W + 40, H + 40, -40 / W, -40 / H, 1 + 40 / W, 1 + 40 / H, WHITE, 0);
  if (march) drawBridgeGround(); else useTex(0);

  /* 地面層：落點預告、大將落地影、貼地的圈 */
  for (const m of S.marks) {
    P(m.x, m.z); const f = m.t / m.dur, r = m.r * PS, q = groundQ(m.z);
    quad(PX - r, PY - r * q, PX + r, PY + r * q, A.disc.u0, A.disc.v0, A.disc.u1, A.disc.v1, rgba(255, 50, 30, 90 + 120 * f), 0);
    const r2 = r * (1.6 - 0.6 * f);
    quad(PX - r2, PY - r2 * q, PX + r2, PY + r2 * q, A.ring2.u0, A.ring2.v0, A.ring2.u1, A.ring2.v1, rgba(255, 240, 200, 230), 0);
  }
  for (const p of S.peds) if (!p.built) {
    P(p.x, p.z); const r = 2.6 * PS * (1 + 0.08 * Math.sin(S.time * 4)), q = groundQ(p.z);
    quad(PX - r, PY - r * q, PX + r, PY + r * q, A.ring2.u0, A.ring2.v0, A.ring2.u1, A.ring2.v1, rgba(255, 220, 110, 200), EX_ADD);
  }
  if (S.flood && S.flood.t < S.flood.dur + 0.5) drawFlood(S.flood);
  for (const f of S.strafes) {
    // 火線：預告時是一條閃爍的紅帶，噴火時火頭後面拖著一段烈焰
    const x0 = f.x - f.w / 2, x1 = f.x + f.w / 2, zA = MZ_OUT - 6, zB = f.z0;
    const strip = (za, zb, col, ex) => { P(x0, za); const ax = PX, ay = PY; P(x1, za); const bx = PX; P(x1, zb); const cx = PX, cy = PY; P(x0, zb); quad4(PX, cy, cx, cy, bx, ay, ax, ay, col, ex); };
    if (f.t < f.warn) {
      const p = f.t / f.warn, a = (0.34 + 0.26 * p) * (0.62 + 0.38 * Math.sin(f.t * (10 + 16 * p)));
      strip(zA, zB, rgba(255, 50, 24, 255 * a), 0);
      strip(zA, zB, rgba(255, 120, 40, 90 * a), EX_ADD);
      for (const xx of [x0, x1]) { P(xx, zA); const ax = PX, ay = PY; P(xx, zB); const e = Math.max(1.5, 0.12 * V.s0); quad4(PX - e * 0.4, PY, PX + e * 0.4, PY, ax + e, ay, ax - e, ay, rgba(255, 220, 120, 200), 0); }
    } else {
      const zt = Math.min(zB, f.zf + FIRE_TRAIL);
      if (f.zf > zA) { const a = 0.5 + 0.3 * Math.sin(f.t * 30); strip(zA, Math.min(zB, f.zf), rgba(255, 50, 24, 255 * a), 0); }
      if (zt > zA) { strip(Math.max(zA, f.zf), zt, rgba(255, 120, 30, 170), 0); strip(Math.max(zA, f.zf), zt, rgba(255, 200, 80, 120), EX_ADD); }
      strip(Math.max(zA, zt), zB, rgba(30, 14, 10, 80), 0);
    }
  }
  drawParticles(true);

  /* 排序：小兵用計數排序分桶，其它物件插進對應的桶 */
  ordCnt.fill(0);
  const nb = B.n, nr = R.n;
  for (let i = 0; i < nb; i++) { let b = ((ZTOP - B.z[i]) * BK) | 0; if (b < 0) b = 0; else if (b >= NBK) b = NBK - 1; bkB[i] = b; ordCnt[b + 1]++; }
  for (let j = 0; j < nr; j++) { let b = ((ZTOP - R.z[j]) * BK) | 0; if (b < 0) b = 0; else if (b >= NBK) b = NBK - 1; bkR[j] = b; ordCnt[b + 1]++; }
  for (let b = 0; b < NBK; b++) ordCnt[b + 1] += ordCnt[b];
  ordCur.set(ordCnt);
  for (let j = 0; j < nr; j++) ord[ordCur[bkR[j]]++] = ~j;
  for (let i = 0; i < nb; i++) ord[ordCur[bkB[i]]++] = i;
  objs.length = 0;
  for (const g of S.gates) pushObj(g.z, 0, g);
  for (const p of S.peds) pushObj(p.z, 1, p);
  for (const q of S.barrels) if (q.alive) pushObj(q.z, 2, q);
  for (const o of S.bigs) pushObj(o.z - 0.01, 3, o);
  for (const g of S.rgates) pushObj(g.z, 9, g);
  if (march) {
    const d = S.sq.dist;
    for (let k = Math.floor((d + ZMIN) / RAIL_GAP); k <= Math.floor((d + 150) / RAIL_GAP); k++) pushObj(k * RAIL_GAP - d, 5, k * RAIL_GAP - d);
    for (const pa of archList()) if (pa - d > 8 && pa - d <= 170) pushObj(pa - d, 6, pa - d);
    for (const w of S.saws) pushObj(w.z, 7, w);
    if (S.mf) pushObj(S.fz + 0.5, 8, null);
  } else pushObj(CANZ, 4, null);
  objs.sort((a, b) => a.b - b.b);
  const tAnim = S.time * 11;
  let oi = 0;
  for (let b = 0; b < NBK; b++) {
    while (oi < objs.length && objs[oi].b <= b) {
      const o = objs[oi++];
      switch (o.kind) {
        case 0: drawGate(o.ref); break; case 1: drawPed(o.ref); break; case 2: drawBarrel(o.ref); break; case 3: drawBig(o.ref); break; case 4: drawCannon(); break;
        case 5: drawRailPosts(o.ref); break; case 6: drawArch(o.ref); break; case 7: drawSaw(o.ref); break; case 8: drawMarchFort(); break; case 9: drawRGate(o.ref); break;
      }
    }
    if (ordCnt[b + 1] > ordCnt[b]) drawSoldiers(ordCnt[b], ordCnt[b + 1], tAnim);
  }

  /* 空中的東西：投射物、粒子 */
  for (const p of S.proj) {
    if (p.kind === 'arrow') {
      const inv = 1 / (1 + p.z * V.g), s = V.s0 * inv, x = V.cx + p.x * s, y = V.yH + V.C * inv - 0.9 * s * ky, b = A.bolt;
      quad(x - 0.15 * s, y - 1.5 * s, x + 0.15 * s, y, b.u0, b.v0, b.u1, b.v1, p.dmg > 1 ? rgba(255, 225, 130, 255) : WHITE, 0);
    } else if (p.kind === 'bolt') {
      P(p.x, p.z); const x0 = PX, y0 = PY - 1.1 * PS * ky, s = PS; P(p.x + p.vx * 0.02, p.z + p.vz * 0.02);
      sprRot(A.bolt, x0, y0, 0.55 * s, 3.3 * s, Math.atan2(PX - x0, -(PY - 1.1 * PS * ky - y0)), WHITE, 0);
    } else {
      P(p.x, p.z); const s = PS, sh = 1 / (1 + p.y * 0.1);
      spr(A.soft, PX, PY + 0.7 * s * sh, 2.6 * s * sh, rgba(0, 0, 20, 120), 0);
      const sp = p.kind === 'shell' ? A.shell : p.kind === 'rock' ? A.rock : A.fire, w = (p.kind === 'shell' ? 1.5 : p.kind === 'rock' ? 3 : 4.4) * s;
      sprRot(sp, PX, PY - p.y * s * ky - w * 0.3, w, w, p.kind === 'fire' ? 0 : p.t * 7, WHITE, p.kind === 'fire' ? EX_ADD : 0);
    }
  }
  for (const f of S.strafes) if (f.fly && f.t >= f.warn - 0.25) drawDragonAt(f.x, f.zf + 7, 7.5, 13, 1, 0, false);
  drawParticles(false);

  /* 浮字 */
  for (const f of FX.floats) {
    if (!f.str) continue;
    P(f.x, f.z); const t = 1 - f.life / f.max, pop = t < 0.15 ? 0.6 + t / 0.15 * 0.55 : 1.15 - Math.min(0.15, (t - 0.15) * 0.6);
    const h = f.h * PS * pop;
    text(f.str, clamp(PX, h, W - h), PY - f.y * PS * ky - h, h, colA(f.col, t > 0.7 ? (1 - t) / 0.3 : 1), 0);
  }
  if (march && S.B.n > 0 && S.state !== 'lost' && !S.sq.siege && !G.demo) {
    // 部隊人數寫在隊伍後面
    const q = S.sq; P(q.x, MZ_REAR - 3.4); const h = 2.5 * PS, str = String(S.B.n), tw = textW(str, h);
    const pop = FX.armyPop > 0 ? 1 + 0.25 * FX.armyPop : 1, hh = h * pop;
    sprWH(A.icon, PX - tw * pop / 2 - hh * 0.72, PY - hh * 0.36, hh * 0.72, hh * 0.72, rgba(150, 205, 255, 255), 0);
    text(str, PX + hh * 0.2, PY - hh * 0.5, hh, rgba(190, 225, 255, 255), 0);
  }
  // 敵城血量直接寫在城門上
  if (S.fort.alive && S.state !== 'idle') {
    P(rcx(S.fz), S.fz); const dry = S.fort.dry, sh = FX.fortShake > 0 ? (Math.random() - 0.5) * 3 * V.u : 0;
    const h = 3.7 * PS * (1 + Math.max(0, S.fort.flash) * 0.1 + (dry ? 0.12 + 0.1 * Math.sin(FX.time * 9) : 0));
    text(String(Math.ceil(S.fort.hp)), PX + sh, PY - 6.6 * PS * ky - h * 0.5, h, dry ? rgba(255, 215, 90, 255) : WHITE, 0);
  }
  if (S.boss) {
    const o = S.boss; P(o.x, o.z);
    text(String(Math.ceil(o.hp)), PX, PY - (o.kind === 'dragon' ? 12 : 16.5) * PS, 2.6 * PS, rgba(255, 220, 120, 255), 0);
  }

  /* 天氣：雨絲、飄雪（畫面座標，不跟戰場走） */
  if (S.lv.rain || THEMES[S.lv.theme].snow) {
    const rain = !!S.lv.rain, n = FX.low ? 26 : 54, t = FX.time, st = A.streak, so = A.dot;
    for (let k = 0; k < n; k++) {
      const h1 = hash01(k * 17 + 3), h2 = hash01(k * 29 + 11);
      if (rain) {
        const yy = ((h2 + t * (1.5 + h1 * 0.7)) % 1) * (H + 80) - 40, xx = ((h1 * 1.3 + yy / H * 0.22) % 1) * (W + 60) - 30, len = (26 + h2 * 30) * V.u;
        sprRot(st, xx, yy, 2.2 * V.u, len, 0.2, rgba(210, 232, 255, 70 + 60 * h1), 0);
      } else {
        const yy = ((h2 + t * (0.1 + h1 * 0.1)) % 1) * (H + 40) - 20, xx = ((h1 + Math.sin(t * 0.7 + k) * 0.03 + yy / H * 0.08) % 1) * W, r = (1.6 + h2 * 2.4) * V.u;
        quad(xx - r, yy - r, xx + r, yy + r, so.u0, so.v0, so.u1, so.v1, rgba(255, 255, 255, 110 + 90 * h1), 0);
      }
    }
  }

  /* 全畫面效果 */
  if (FX.dark > 0.01) rect(-40, -40, W + 80, H + 80, rgba(8, 4, 20, Math.min(1, FX.dark) * 90), 0);
  if (FX.surge > 0.01) { const s = A.soft, a = FX.surge * (0.34 + 0.1 * Math.sin(FX.time * 8)); quad(-W * 0.6, -H * 0.42, W * 1.6, H * 0.5, s.u0, s.v0, s.u1, s.v1, rgba(255, 40, 20, 255 * a), 0); }
  const wallLow = !march && S.state === 'play' && S.wallHp < S.wallMax * 0.34;
  if (FX.redVig > 0.01 || wallLow) {
    const a = Math.max(FX.redVig * 0.5, wallLow ? 0.16 + 0.1 * Math.sin(FX.time * 6) : 0);
    const s = A.soft;
    quad(-W * 0.5, H * 0.72, W * 1.5, H * 1.5, s.u0, s.v0, s.u1, s.v1, rgba(255, 30, 20, 255 * a), 0);
  }
  if (FX.flash > 0.01) { const c = FX.flashCol; rect(-40, -40, W + 80, H + 80, rgba((c >> 16) & 255, (c >> 8) & 255, c & 255, Math.min(1, FX.flash) * 255), 0); }
  frameEnd();
}
