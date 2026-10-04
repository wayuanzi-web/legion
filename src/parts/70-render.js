/* ===== 70-render: 把戰局畫出來。所有東西照縱深由遠到近排序後一次送出 ===== */
const NBK = 260, BK = 2, ZTOP = L + 14;           // 縱深分桶（每世界單位 2 桶）
const ordCnt = new Int32Array(NBK + 1), ordCur = new Int32Array(NBK + 1);
const ord = new Int32Array(BLUE_CAP + RED_CAP), bkB = new Uint16Array(BLUE_CAP), bkR = new Uint16Array(RED_CAP);
// 小兵四格動畫的貼圖座標：[我軍, 赤卒, 狼騎, 盾卒]
const SUV = new Float32Array(4 * 4 * 4);
const SOLDIER_W = [1.7, 1.7, 1.95, 1.85];
function renderInit() {
  SPT = SPN.map((n) => AT.sp[n]);
  AT.sp.barrel.ay = 86 / 96; AT.sp.canBase.ay = 0.9; AT.sp.canBarrel.ay = 0.94;
  ['b', 'r', 'w', 's'].forEach((p, k) => { for (let f = 0; f < 4; f++) { const s = AT.sp[p + f], o = (k * 4 + f) * 4; SUV[o] = s.u0; SUV[o + 1] = s.v0; SUV[o + 2] = s.u1; SUV[o + 3] = s.v1; } });
}
const objs = [];
function pushObj(z, kind, ref) { let b = ((ZTOP - z) * BK) | 0; if (b < 0) b = 0; else if (b >= NBK) b = NBK - 1; objs.push({ b, kind, ref }); }
function groundQ(z) { return V.q0 / (1 + z * V.g); }   // 地面圓在該縱深被壓扁的比例

function drawGate(g) {
  const A = AT.sp, ky = V.ky;
  P(g.x - g.w / 2, g.z); const xL = PX, y = PY, s = PS; P(g.x + g.w / 2, g.z); const xR = PX;
  const k = g.kind, gone = g.alive ? 0 : Math.min(1, (g.gone || 0) / 0.5), al = 1 - gone;
  const fl = Math.max(0, g.flash), appear = Math.min(1, (S.time - g.born) / 0.35);
  const post = k === 2 ? A.postG : k === 1 ? A.postR : A.postB, beam = k === 2 ? A.beamG : k === 1 ? A.beamR : A.beamB;
  const tint = k === 2 ? rgba(255, 214, 90, 255) : k === 1 ? rgba(255, 70, 50, 255) : rgba(80, 175, 255, 255);
  const hTop = 4.25 * s * ky * (0.3 + 0.7 * appear), hBeam = 2.05 * s * ky;
  // 光幕
  const ca = (0.5 + 0.22 * fl + 0.1 * Math.sin(S.time * 5 + g.id)) * al * appear;
  sprWH(A.curtain, xL, y - hTop + hBeam * 0.4, xR - xL, hTop - hBeam * 0.4, colA(tint, ca), 0);
  sprWH(A.curtain, xL, y - hTop + hBeam * 0.4, xR - xL, hTop - hBeam * 0.4, colA(tint, ca * 0.5), EX_ADD);
  const pw = 1.18 * s;
  spr(post, xL, y + 0.16 * s, pw, colA(WHITE, al), 0); spr(post, xR, y + 0.16 * s, pw, colA(WHITE, al), 0);
  // 門楣與倍數
  const pop = 1 + fl * 0.07, bw = (xR - xL) + 0.9 * s, bx = (xL + xR) / 2, by = y - hTop - 0.1 * s;
  const bh = hBeam * pop;
  sprWH(beam, bx - bw * pop / 2, by - (bh - hBeam) / 2, bw * pop, bh, colA(WHITE, al), ((fl * 46) | 0) << 8);
  const label = g.m < 1 ? '÷' + Math.round(1 / g.m) : '×' + g.m;
  const th = hBeam * 0.86 * pop;
  text(label, bx, by + (hBeam - th) * 0.42, th, colA(WHITE, al), 0);
  if (g.cap0) {     // 黃金門剩餘次數
    const w = bw * 0.8, f = clamp(g.cap / g.cap0, 0, 1);
    rect(bx - w / 2, by + hBeam + 0.12 * s, w, 0.3 * s, rgba(20, 16, 30, 200 * al));
    rect(bx - w / 2 + 0.05 * s, by + hBeam + 0.17 * s, (w - 0.1 * s) * f, 0.2 * s, rgba(255, 230, 120, 255 * al));
  }
}
function drawPed(p) {
  const A = AT.sp; P(p.x, p.z); const s = PS, x = PX, y = PY;
  spr(A.ped, x, y + 1.25 * s, 4.3 * s, WHITE, p.flash > 0 ? ((p.flash * 150) << 8) : 0);
  const ts = p.kind === 'ballista' ? A.ballista : A.mortar;
  if (!p.built) {
    const bob = Math.sin(S.time * 3) * 0.12 * s, f = p.got / p.need;
    spr(ts, x, y + 0.5 * s + bob, 3.5 * s, colA(WHITE, 0.3 + 0.25 * f), 0);
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
function drawBig(o) {
  const A = AT.sp, ky = V.ky; P(o.x, o.z); const s = PS, x = PX, y = PY;
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
  useTex(FX.fortRuined && GLR.bg2 ? 2 : 1); quad(-40, -40, W + 40, H + 40, -40 / W, -40 / H, 1 + 40 / W, 1 + 40 / H, WHITE, 0);
  useTex(0);

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
  pushObj(CANZ, 4, null);
  objs.sort((a, b) => a.b - b.b);
  const tAnim = S.time * 11;
  let oi = 0;
  for (let b = 0; b < NBK; b++) {
    while (oi < objs.length && objs[oi].b <= b) {
      const o = objs[oi++];
      if (o.kind === 0) drawGate(o.ref); else if (o.kind === 1) drawPed(o.ref); else if (o.kind === 2) drawBarrel(o.ref); else if (o.kind === 3) drawBig(o.ref); else drawCannon();
    }
    if (ordCnt[b + 1] > ordCnt[b]) drawSoldiers(ordCnt[b], ordCnt[b + 1], tAnim);
  }

  /* 空中的東西：投射物、粒子 */
  for (const p of S.proj) {
    if (p.kind === 'bolt') {
      P(p.x, p.z); const x0 = PX, y0 = PY - 1.1 * PS * ky, s = PS; P(p.x + p.vx * 0.02, p.z + p.vz * 0.02);
      sprRot(A.bolt, x0, y0, 0.55 * s, 3.3 * s, Math.atan2(PX - x0, -(PY - 1.1 * PS * ky - y0)), WHITE, 0);
    } else {
      P(p.x, p.z); const s = PS, sh = 1 / (1 + p.y * 0.1);
      spr(A.soft, PX, PY + 0.7 * s * sh, 2.6 * s * sh, rgba(0, 0, 20, 120), 0);
      const sp = p.kind === 'shell' ? A.shell : p.kind === 'rock' ? A.rock : A.fire, w = (p.kind === 'shell' ? 1.5 : p.kind === 'rock' ? 3 : 4.4) * s;
      sprRot(sp, PX, PY - p.y * s * ky - w * 0.3, w, w, p.kind === 'fire' ? 0 : p.t * 7, WHITE, p.kind === 'fire' ? EX_ADD : 0);
    }
  }
  drawParticles(false);

  /* 浮字 */
  for (const f of FX.floats) {
    if (!f.str) continue;
    P(f.x, f.z); const t = 1 - f.life / f.max, pop = t < 0.15 ? 0.6 + t / 0.15 * 0.55 : 1.15 - Math.min(0.15, (t - 0.15) * 0.6);
    const h = f.h * PS * pop;
    text(f.str, clamp(PX, h, W - h), PY - f.y * PS * ky - h, h, colA(f.col, t > 0.7 ? (1 - t) / 0.3 : 1), 0);
  }
  // 敵城血量直接寫在城門上
  if (S.fort.alive && S.state !== 'idle') {
    P(rcx(L), L); const dry = S.fort.dry, sh = FX.fortShake > 0 ? (Math.random() - 0.5) * 3 * V.u : 0;
    const h = 3.7 * PS * (1 + Math.max(0, S.fort.flash) * 0.1 + (dry ? 0.12 + 0.1 * Math.sin(FX.time * 9) : 0));
    text(String(Math.ceil(S.fort.hp)), PX + sh, PY - 6.6 * PS * ky - h * 0.5, h, dry ? rgba(255, 215, 90, 255) : WHITE, 0);
  }
  if (S.boss) {
    const o = S.boss; P(o.x, o.z);
    text(String(Math.ceil(o.hp)), PX, PY - 16.5 * PS, 2.6 * PS, rgba(255, 220, 120, 255), 0);
  }

  /* 全畫面效果 */
  if (FX.dark > 0.01) rect(-40, -40, W + 80, H + 80, rgba(8, 4, 20, Math.min(1, FX.dark) * 90), 0);
  if (FX.surge > 0.01) { const s = A.soft, a = FX.surge * (0.34 + 0.1 * Math.sin(FX.time * 8)); quad(-W * 0.6, -H * 0.42, W * 1.6, H * 0.5, s.u0, s.v0, s.u1, s.v1, rgba(255, 40, 20, 255 * a), 0); }
  if (FX.redVig > 0.01 || (S.state === 'play' && S.wallHp < S.wallMax * 0.34)) {
    const a = Math.max(FX.redVig * 0.5, S.wallHp < S.wallMax * 0.34 ? 0.16 + 0.1 * Math.sin(FX.time * 6) : 0);
    const s = A.soft;
    quad(-W * 0.5, H * 0.72, W * 1.5, H * 1.5, s.u0, s.v0, s.u1, s.v1, rgba(255, 30, 20, 255 * a), 0);
  }
  if (FX.flash > 0.01) { const c = FX.flashCol; rect(-40, -40, W + 80, H + 80, rgba((c >> 16) & 255, (c >> 8) & 255, c & 255, Math.min(1, FX.flash) * 255), 0); }
  frameEnd();
}
