/* ===== 55-fx: 粒子、飛起來的陣亡小兵、震動、浮字。只管好不好看，不影響戰局 ===== */
const PMAX = 7000;
const pX = new Float32Array(PMAX), pZ = new Float32Array(PMAX), pY = new Float32Array(PMAX);
const pVX = new Float32Array(PMAX), pVZ = new Float32Array(PMAX), pVY = new Float32Array(PMAX);
const pLife = new Float32Array(PMAX), pMax = new Float32Array(PMAX), pSize = new Float32Array(PMAX);
const pRot = new Float32Array(PMAX), pVR = new Float32Array(PMAX), pGrav = new Float32Array(PMAX);
const pSp = new Uint8Array(PMAX), pFl = new Uint8Array(PMAX), pCol = new Uint32Array(PMAX);
let pn = 0;
const PF_ADD = 1, PF_FLAT = 2, PF_GROW = 4, PF_SHRINK = 8, PF_BOUNCE = 16, PF_ARROW = 32, PF_SOLID = 64;
// 粒子可用的 sprite 代號
const SP_SOFT = 0, SP_PUFF = 1, SP_STAR = 2, SP_STREAK = 3, SP_DOT = 4, SP_HB = 5, SP_HR = 6, SP_B = 7, SP_R = 8, SP_W = 9, SP_S = 10,
  SP_RING = 11, SP_RING2 = 12, SP_DISC = 13, SP_ARROW = 14, SP_WHITE = 15, SP_BR = 16, SP_GI = 17, SP_ROCK = 18, SP_BO = 19;
const SPN = ['soft', 'puff', 'star', 'streak', 'dot', 'hb', 'hr', 'b0', 'r0', 'w0', 's0', 'ring', 'ring2', 'disc', 'arrow', 'white', 'br0', 'gi0', 'rock', 'bo0'];
let SPT = [];

const FX = {
  shake: 0, shx: 0, shy: 0, flash: 0, flashCol: 0xffffff, dark: 0, slow: 1, slowT: 0, stop: 0,
  floats: [], bodies: 0, puffs: 0, killsF: 0, killRate: 0, lostRate: 0, time: 0, low: false,
  gateAcc: new Map(), fortRuined: false, banner: null, muzzle: 0, heroGlow: 0, wallFlash: 0, fortShake: 0, redVig: 0, surge: 0
};
function fxReset() {
  pn = 0; FX.shake = 0; FX.flash = 0; FX.dark = 0; FX.slow = 1; FX.slowT = 0; FX.stop = 0; FX.floats.length = 0;
  FX.killRate = 0; FX.lostRate = 0; FX.gateAcc.clear(); FX.fortRuined = false; FX.muzzle = 0; FX.heroGlow = 0; FX.wallFlash = 0; FX.fortShake = 0; FX.surge = 0; FX.redVig = 0;
}
function pt(sp, x, z, y, vx, vz, vy, life, size, col, fl, grav, rot, vr) {
  if (pn >= PMAX) return;
  const i = pn++;
  pSp[i] = sp; pX[i] = x; pZ[i] = z; pY[i] = y; pVX[i] = vx; pVZ[i] = vz; pVY[i] = vy; pLife[i] = life; pMax[i] = life;
  pSize[i] = size; pCol[i] = col; pFl[i] = fl; pGrav[i] = grav; pRot[i] = rot || 0; pVR[i] = vr || 0;
}
const R01 = Math.random;
const rnf = (a, b) => a + (b - a) * Math.random();
function addShake(a) { if (a > FX.shake) FX.shake = Math.min(26, a); }
function addFlash(col, a) { if (a > FX.flash) { FX.flash = a; FX.flashCol = col; } }
function floatText(str, x, z, y, h, col, life) { if (FX.floats.length < 40) FX.floats.push({ str, x, z, y, h, col, life, max: life }); }

const C_BLUE = rgba(70, 140, 255, 255), C_RED = rgba(240, 70, 55, 255), C_GOLD = rgba(255, 205, 70, 255), C_DUST = rgba(225, 205, 170, 255),
  C_FIRE = rgba(255, 150, 40, 255), C_SMOKE = rgba(70, 62, 62, 255), C_WHITE = 0xffffffff, C_PURP = rgba(210, 90, 255, 255);

function burst(x, z, y, n, col, spd, size, life, fl) {
  for (let i = 0; i < n; i++) {
    const a = R01() * TAU, v = spd * (0.4 + R01() * 0.8);
    pt(SP_DOT, x, z, y, Math.cos(a) * v, Math.sin(a) * v * 0.7, spd * (0.5 + R01()), life * (0.6 + R01() * 0.7), size * (0.6 + R01() * 0.8), col, fl | PF_SHRINK, 22);
  }
}
function ringFx(x, z, r, col, life, add) {
  // 貼地擴散的圈：size 是最終半徑的一半，配合 PF_GROW 放大
  pt(SP_RING, x, z, 0.05, 0, 0, 0, life, r * 0.42, col, PF_FLAT | PF_GROW | (add ? PF_ADD : 0), 0);
}
function explode(x, z, r, kind) {
  // kind: 0 我方砲彈、1 落石、2 魔王火球、3 火藥桶
  const big = r / 3.4, fire = kind !== 1;
  const quiet = FX.low ? 0.5 : 1;
  if (fire) pt(SP_SOFT, x, z, 1, 0, 0, 0, 0.32, r * 1.5, kind === 2 ? C_PURP : C_FIRE, PF_ADD | PF_GROW, 0);
  ringFx(x, z, r * 1.15, fire ? rgba(255, 220, 150, 255) : rgba(240, 230, 210, 220), 0.4, fire);
  for (let i = 0; i < 12 * big * quiet; i++) {
    const a = R01() * TAU, d = R01() * r * 0.5;
    pt(SP_PUFF, x + Math.cos(a) * d, z + Math.sin(a) * d, 0.4 + R01(), Math.cos(a) * rnf(1, 4), Math.sin(a) * rnf(1, 4), rnf(2, 6), rnf(0.5, 1), rnf(1, 2.2) * big, fire ? (R01() < 0.5 ? C_SMOKE : rgba(255, 170, 60, 255)) : C_DUST, PF_GROW, -3);
  }
  burst(x, z, 0.6, 16 * big * quiet, fire ? rgba(255, 220, 110, 255) : C_DUST, 11, 0.42, 0.7, fire ? PF_ADD : 0);
  if (kind === 1) for (let i = 0; i < 5; i++) { const a = R01() * TAU; pt(SP_ROCK, x, z, 0.6, Math.cos(a) * rnf(3, 8), Math.sin(a) * rnf(3, 8), rnf(6, 11), 0.8, 0.9, C_WHITE, PF_BOUNCE, 28, R01() * 6, rnf(-9, 9)); }
  addShake(5 + r * 2.2); if (fire) addFlash(0xffe0a0, 0.16 * big);
}

/* 陣亡的小兵：整個人飛起來翻滾 */
function deathFx(team, kind, x, z, y, cause, ox, oz, pow) {
  FX.killsF++;
  const budget = FX.low ? 22 : 46;
  if (FX.bodies < budget) {
    FX.bodies++;
    let vx, vz, vy;
    if (cause === 1 || cause === 5) {
      let dx = x - ox, dz = z - oz; const d = Math.hypot(dx, dz) + 0.3; dx /= d; dz /= d;
      const p = pow * (0.55 + R01() * 0.6);
      vx = dx * p + rnf(-2, 2); vz = dz * p * 0.8 + rnf(-2, 2); vy = p * (0.75 + R01() * 0.6) + 3;
    } else if (cause === 2) { vx = rnf(-2.5, 2.5); vz = rnf(-1, 3); vy = rnf(5, 10); }
    else {
      const dir = team ? 1 : -1;      // 被撞的那一邊往自己後方飛
      vx = rnf(-3.6, 3.6); vz = dir * rnf(1.5, 5.5); vy = rnf(7, 13);
    }
    pt(team ? (kind === 1 ? SP_W : kind === 2 ? SP_S : SP_R) : SP_B, x, z, y + 0.6, vx, vz, vy, rnf(0.7, 1.05), 1.9, C_WHITE, PF_SOLID, 27, rnf(-0.6, 0.6), rnf(-15, 15));
    if (R01() < 0.1) pt(team ? SP_HR : SP_HB, x, z, y + 1.2, vx * 0.6 + rnf(-2, 2), vz * 0.5, vy + rnf(3, 6), 1.0, 0.75, C_WHITE, PF_BOUNCE, 27, 0, rnf(-18, 18));
  }
  if (FX.puffs < (FX.low ? 18 : 40)) {
    FX.puffs++;
    pt(SP_PUFF, x, z, 0.5, rnf(-1, 1), rnf(-1, 1), rnf(0.5, 2), rnf(0.24, 0.38), 0.95, team ? rgba(255, 200, 180, 240) : rgba(200, 222, 255, 240), PF_GROW, 0);
    pt(SP_DOT, x, z, 0.7, rnf(-6, 6), rnf(-5, 5), rnf(5, 11), rnf(0.35, 0.6), 0.36, team ? C_RED : C_BLUE, PF_SHRINK, 24);
    pt(SP_DOT, x, z, 0.7, rnf(-6, 6), rnf(-5, 5), rnf(5, 11), rnf(0.35, 0.6), 0.3, team ? rgba(255, 200, 120, 255) : C_WHITE, PF_SHRINK, 24);
    if (cause === 0 && R01() < 0.5) pt(SP_STAR, x, z, 0.9, 0, 0, 0, 0.14, 1.7, C_WHITE, PF_ADD | PF_SHRINK, 0, R01() * 3);
  }
}

/* 模擬事件 → 特效與音效 */
function fxOn(type, a, b, c, d, e, f, g, h, i) {
  switch (type) {
    case 'k': deathFx(a, b, c, d, e, f, g, h, i); break;
    case 'shot':
      FX.muzzle = 1;
      if (R01() < 0.5) pt(SP_PUFF, a, CANZ + 2.2, 1.5, rnf(-0.6, 0.6), rnf(1, 3), rnf(0.5, 2), 0.28, 0.6, rgba(255, 255, 255, 190), PF_GROW, 0);
      sfx('shot'); break;
    case 'g': {
      const gt = a, col = gt.kind === 2 ? C_GOLD : rgba(120, 200, 255, 255);
      if (d > 0) FX.gateAcc.set(gt, (FX.gateAcc.get(gt) || 0) + d);
      if (R01() < (gt.kind === 2 ? 1 : 0.6)) pt(SP_STAR, b, c, 1.2, rnf(-2, 2), 0, rnf(2, 5), 0.3, gt.kind === 2 ? 1.6 : 1.1, col, PF_ADD | PF_SHRINK, 0, R01() * 3, rnf(-6, 6));
      if (gt.kind === 2) { burst(b, c, 0.8, 4, C_GOLD, 8, 0.36, 0.5, PF_ADD); addShake(2.5); }
      sfx(gt.kind === 2 ? 'gold' : 'gate', gt.m); break;
    }
    case 'gbad': pt(SP_PUFF, a.x, a.z, 1, 0, 0, 2, 0.3, 1.2, rgba(255, 80, 60, 220), PF_GROW, 0); sfx('bad'); break;
    case 'gold': banner('黃金門出現', 'gold'); sfx('goldin'); break;
    case 'gend': burst(a.x, a.z, 2.6, 26, a.kind === 2 ? C_GOLD : C_WHITE, 12, 0.5, 0.8, PF_ADD); sfx('gbreak'); break;
    case 'wall': FX.wallFlash = 1; addShake(4 + b * 0.6); addFlash(0xff3020, 0.12); FX.redVig = 1;
      burst(a, WALLZ + 0.8, 0.8, 5, C_DUST, 6, 0.4, 0.5, 0); sfx('wall'); vibrate(18); break;
    case 'fh': FX.fortShake = 1; if (R01() < 0.5) pt(SP_STAR, a, L - 1, 2 + R01() * 3, 0, 0, 0, 0.16, 2.6, rgba(255, 230, 150, 255), PF_ADD | PF_SHRINK, 0, R01() * 3); sfx('fh'); break;
    case 'rally': say('敵城動搖，狼騎反撲', 1); sfx('horn'); break;
    case 'surge': banner('敵軍總攻', 'red'); sfx('horn'); addShake(6); vibrate(40); break;
    case 'dry': banner('敵軍兵力已盡', 'gold'); say('殺進城門！', 0); sfx('built'); break;
    case 'beacon': banner('烽火反擊', 'gold'); addFlash(0xffb040, 0.4); addShake(14); sfx('boom2'); vibrate(80); break;
    case 'fortdie':
      FX.fortRuined = true; addShake(26); addFlash(0xffffff, 0.75); FX.slowT = 1.1; FX.slow = 0.3;
      for (let k = 0; k < 9; k++) { const xx = rcx(L) + rnf(-14, 14); explode(xx, L - rnf(0, 3), 4.5, 3); }
      for (let k = 0; k < 26; k++) { const a2 = R01() * TAU; pt(SP_ROCK, rcx(L) + rnf(-10, 10), L - 1, rnf(2, 7), Math.cos(a2) * rnf(4, 14), -rnf(4, 16), rnf(8, 20), 1.6, rnf(1.2, 2.6), C_WHITE, PF_BOUNCE, 26, R01() * 6, rnf(-8, 8)); }
      sfx('fortdie'); vibrate(120); break;
    case 'big': if (a.kind === 'giant') { sfx('giant'); say('巨魔來襲'); } break;
    case 'bigdie': {
      const sz = a.kind === 'boss' ? 3 : a.kind === 'giant' ? 1.8 : 1;
      ringFx(a.x, a.z, 3 * sz, rgba(255, 220, 200, 255), 0.45, true);
      for (let k = 0; k < 14 * sz; k++) { const an = R01() * TAU; pt(SP_PUFF, a.x + Math.cos(an) * sz, a.z + Math.sin(an) * sz, rnf(0.5, 3 * sz), Math.cos(an) * rnf(2, 6), Math.sin(an) * rnf(2, 6), rnf(2, 7), rnf(0.5, 1), rnf(1, 2.4) * sz, rgba(255, 150, 130, 240), PF_GROW, -2); }
      burst(a.x, a.z, 1.5 * sz, 24 * sz, C_RED, 13, 0.5, 0.9, 0);
      pt(a.kind === 'boss' ? SP_BO : a.kind === 'giant' ? SP_GI : SP_BR, a.x, a.z, 1.2 * sz, rnf(-3, 3), rnf(3, 8), 13, a.kind === 'boss' ? 1.5 : 1.1, a.kind === 'boss' ? 13 : a.kind === 'giant' ? 9 : 4.1, C_WHITE, PF_SOLID, 26, 0, rnf(-7, 7) * (a.kind === 'boss' ? 0.4 : 1));
      addShake(8 * sz); if (a.kind !== 'brute') { FX.slowT = 0.5; FX.slow = 0.35; addFlash(0xffffff, 0.3); }
      if (a.kind === 'boss') { for (let k = 0; k < 12; k++) explode(a.x + rnf(-6, 6), a.z + rnf(-5, 5), 4.5, 2); FX.slowT = 1.6; FX.slow = 0.25; addFlash(0xffffff, 0.9); vibrate(200); }
      sfx(a.kind === 'brute' ? 'bigdie' : 'boom2'); break;
    }
    case 'bigwall': addShake(16); explode(a.x, WALLZ + 1, 3.5, 1); break;
    case 'windup': sfx('windup'); break;
    case 'smash':
      ringFx(a, b, c * 1.2, rgba(255, 90, 60, 255), 0.42, false);
      for (let k = 0; k < 12; k++) { const an = R01() * TAU; pt(SP_PUFF, a + Math.cos(an) * c * 0.7, b + Math.sin(an) * c * 0.7, 0.4, Math.cos(an) * 4, Math.sin(an) * 4, rnf(1, 4), 0.6, 1.6, C_DUST, PF_GROW, -2); }
      addShake(11 + d * 4); sfx('smash'); vibrate(30); break;
    case 'heroready': FX.heroGlow = 1; sfx('charge'); break;
    case 'hero':
      FX.heroGlow = 0; FX.muzzle = 2.2; addShake(10); addFlash(0xfff0b0, 0.22);
      for (let k = 0; k < 14; k++) pt(SP_PUFF, a.x + rnf(-1, 1), CANZ + 2, 1.5, rnf(-4, 4), rnf(0, 6), rnf(1, 5), 0.7, 1.8, rgba(255, 245, 220, 230), PF_GROW, -2);
      banner('先鋒大將出陣', 'gold'); sfx('hero'); vibrate(40); break;
    case 'heroland':
      ringFx(a, b, c * 1.25, C_GOLD, 0.5, true); pt(SP_SOFT, a, b, 1, 0, 0, 0, 0.3, c * 1.3, rgba(255, 235, 150, 255), PF_ADD | PF_GROW, 0);
      for (let k = 0; k < 18; k++) { const an = k / 18 * TAU; pt(SP_PUFF, a + Math.cos(an) * 2, b + Math.sin(an) * 2, 0.4, Math.cos(an) * 9, Math.sin(an) * 9, rnf(1, 4), 0.6, 1.9, C_DUST, PF_GROW, -3); }
      burst(a, b, 0.8, 30, C_GOLD, 14, 0.5, 0.8, PF_ADD);
      addShake(18); FX.stop = 0.07; addFlash(0xffffff, 0.25); sfx('land'); vibrate(60);
      if (d > 20) floatText(String(d), a, b, 4, 2.6, C_GOLD, 1.1); break;
    case 'herohit': pt(SP_STAR, a, b, 2.5, 0, 0, 0, 0.14, 4, C_WHITE, PF_ADD | PF_SHRINK, 0, R01() * 3); burst(a, b, 2, 5, C_GOLD, 10, 0.4, 0.5, PF_ADD); addShake(5); sfx('clang'); break;
    case 'heroend':
      ringFx(a, b, c * 1.25, C_GOLD, 0.55, true); pt(SP_SOFT, a, b, 1.5, 0, 0, 0, 0.36, c * 1.5, rgba(255, 240, 170, 255), PF_ADD | PF_GROW, 0);
      burst(a, b, 1.5, 44, C_GOLD, 16, 0.55, 1, PF_ADD); addShake(16); addFlash(0xfff0b0, 0.2); sfx('land');
      if (d > 20) floatText(String(d), a, b, 4, 2.6, C_GOLD, 1.1); break;
    case 'boss': banner('赤潮魔王', 'boss'); FX.dark = 1; addShake(20); sfx('warning'); speak('警告，魔王來襲'); vibrate(200); break;
    case 'rage': banner('魔王暴怒', 'red'); addShake(16); addFlash(0xff2010, 0.3); sfx('roar'); break;
    case 'roar': ringFx(a.x, a.z, 9, C_PURP, 0.6, true); addShake(9); sfx('roar'); break;
    case 'ult': FX.dark = Math.max(FX.dark, 0.75); banner('萬箭齊發', 'gold'); sfx('ult'); vibrate(50); break;
    case 'ultend': if (a > 30) { floatText(String(a), rcx(S.ult.z0 + 8), S.ult.z0 + 8, 5, 3.4, C_GOLD, 1.3); } break;
    case 'bolt': sfx('bolt'); break;
    case 'mortar': for (let k = 0; k < 6; k++) pt(SP_PUFF, a.x, a.z + 1, 2.5, rnf(-2, 2), rnf(0, 2), rnf(2, 6), 0.6, 1.4, rgba(240, 240, 240, 220), PF_GROW, -2); sfx('mortar'); break;
    case 'boom': explode(a, b, c, e); if (d > 12) floatText(String(d), a, b, 3, e === 3 ? 3 : 2.2, e === 0 || e === 3 ? C_GOLD : C_RED, 1); sfx(e === 3 ? 'boom2' : 'boom'); if (e === 3) { FX.stop = 0.05; vibrate(50); } break;
    case 'throw': sfx('throw'); break;
    case 'feed': if (R01() < 0.5) pt(SP_STAR, b, c, 1.2, 0, 0, 5, 0.3, 1, C_GOLD, PF_ADD | PF_SHRINK, 0, R01() * 3); sfx('feed'); break;
    case 'built': burst(a.x, a.z, 1.5, 36, C_GOLD, 12, 0.5, 0.9, PF_ADD); ringFx(a.x, a.z, 5, C_GOLD, 0.5, true); say(a.kind === 'ballista' ? '連弩車完成，開始放箭' : '轟天砲完成，開始轟炸', 0); sfx('built'); break;
    case 'bhit': pt(SP_STAR, a.x, a.z, 1.4, 0, 0, 0, 0.12, 1.6, C_WHITE, PF_ADD | PF_SHRINK, 0, R01() * 3); sfx('feed'); break;
    case 'clank': if (R01() < 0.5) pt(SP_STAR, a, b, 1, 0, 0, 0, 0.12, 1.2, rgba(220, 230, 255, 255), PF_ADD | PF_SHRINK, 0, R01() * 3); sfx('clank'); break;
    case 'spark': burst(a, b, 2, 4, C_GOLD, 8, 0.35, 0.4, PF_ADD); break;
    case 'say': say(a, b); break;
    case 'win': FX.slowT = Math.max(FX.slowT, 0.9); FX.slow = 0.35; break;
    case 'lose': addShake(22); addFlash(0xff2010, 0.5); FX.slowT = 1.2; FX.slow = 0.3; sfx('lose0'); vibrate(200); break;
  }
}

function fxStep(dt, rdt) {
  FX.time += rdt; FX.bodies = 0; FX.puffs = 0;
  // 殺敵速率（每秒）— 給音效與戰況條用
  FX.killRate += (FX.killsF / Math.max(rdt, 0.001) - FX.killRate) * Math.min(1, rdt * 6); FX.killsF = 0;
  if (FX.shake > 0.1) { const a = FX.shake * V.u; FX.shx = (R01() * 2 - 1) * a; FX.shy = (R01() * 2 - 1) * a; FX.shake *= Math.pow(0.0025, rdt); } else { FX.shake = 0; FX.shx = FX.shy = 0; }
  if (FX.flash > 0) FX.flash -= rdt * 2.6;
  if (FX.dark > 0) FX.dark -= rdt * (S.ult.active ? 0 : 0.9);
  if (FX.muzzle > 0) FX.muzzle -= rdt * 9;
  if (FX.wallFlash > 0) FX.wallFlash -= rdt * 3.5;
  if (FX.fortShake > 0) FX.fortShake -= rdt * 8;
  if (FX.redVig > 0) FX.redVig -= rdt * 1.5;
  FX.surge += ((S.surge.on > 0 && S.state === 'play' ? 1 : 0) - FX.surge) * Math.min(1, rdt * 4);
  // 烽火：一道火牆從城牆往前掃
  const bn = S.burn;
  if (bn.active && bn.zf < bn.z1) {
    for (let k = 0; k < (FX.low ? 7 : 13); k++) {
      const x = rnf(-PLAZA_HW, PLAZA_HW);
      pt(R01() < 0.5 ? SP_SOFT : SP_PUFF, x, bn.zf + rnf(-0.8, 0.8), rnf(0.2, 1.4), rnf(-1, 1), rnf(2, 6), rnf(3, 9), rnf(0.3, 0.55), rnf(1.4, 2.6), R01() < 0.6 ? rgba(255, 150, 30, 150) : rgba(255, 80, 20, 170), PF_ADD | PF_GROW, -4);
    }
    addShake(5);
  }
  if (FX.slowT > 0) { FX.slowT -= rdt; if (FX.slowT <= 0) FX.slow = 1; }
  // 粒子
  for (let i = pn - 1; i >= 0; i--) {
    const life = pLife[i] - dt;
    if (life <= 0) { const j = --pn; if (i !== j) { pSp[i] = pSp[j]; pX[i] = pX[j]; pZ[i] = pZ[j]; pY[i] = pY[j]; pVX[i] = pVX[j]; pVZ[i] = pVZ[j]; pVY[i] = pVY[j]; pLife[i] = pLife[j]; pMax[i] = pMax[j]; pSize[i] = pSize[j]; pCol[i] = pCol[j]; pFl[i] = pFl[j]; pGrav[i] = pGrav[j]; pRot[i] = pRot[j]; pVR[i] = pVR[j]; } continue; }
    pLife[i] = life;
    pVY[i] -= pGrav[i] * dt;
    pX[i] += pVX[i] * dt; pZ[i] += pVZ[i] * dt; pY[i] += pVY[i] * dt; pRot[i] += pVR[i] * dt;
    if (pY[i] < 0 && pGrav[i] > 0) {
      if (pFl[i] & PF_BOUNCE) { pY[i] = 0; pVY[i] *= -0.4; pVX[i] *= 0.6; pVZ[i] *= 0.6; pVR[i] *= 0.5; }
      else if (pFl[i] & PF_ARROW) {
        // 箭落地：插在地上停一下、揚一點塵
        pY[i] = 0; pVX[i] = pVZ[i] = pVY[i] = 0; pGrav[i] = 0; pFl[i] &= ~PF_ARROW; pLife[i] = pMax[i] = 0.4;
        if (R01() < 0.5) pt(SP_PUFF, pX[i], pZ[i], 0.3, 0, 0, 1.5, 0.25, 0.7, C_DUST, PF_GROW, 0);
      } else if (pFl[i] & PF_SOLID) { pY[i] = 0; pVY[i] *= -0.3; pVX[i] *= 0.5; pVZ[i] *= 0.5; pVR[i] *= 0.4; if (pLife[i] > 0.22) pLife[i] = 0.22; }
      else if (pLife[i] > 0.04) pLife[i] = 0.04;
    }
  }
  // 萬箭齊發的箭
  const u = S.ult;
  if (u.active) {
    const zw = lerp(u.z0, u.z1, Math.min(1, u.t / u.dur)), n = FX.low ? 7 : 16;
    for (let k = 0; k < n; k++) {
      const z = zw + rnf(-1, 7), x = rcx(z) + rnf(-1, 1) * rhw(z), T = 0.3;
      pt(SP_ARROW, x + 2.2, z - 6, 17, -2.2 / T, 6 / T, -17 / T, T + 0.02, 3.3, C_WHITE, PF_ARROW, 0.01, 0.18);
    }
    if ((S.frame & 3) === 0) addShake(4);
  }
  // 倍增門的累計浮字
  if ((S.frame % 30) === 0 && FX.gateAcc.size) {
    for (const [g, nAcc] of FX.gateAcc) { if (nAcc > 0) floatText('+' + nAcc, g.x + g.w * 0.5 + 0.6, g.z, 3.2, g.kind === 2 ? 2.4 : 1.6, g.kind === 2 ? C_GOLD : rgba(150, 215, 255, 255), 0.55); }
    FX.gateAcc.clear();
  }
  const fl = FX.floats;
  for (let i = fl.length - 1; i >= 0; i--) { const f = fl[i]; f.life -= rdt; f.y += rdt * 4.5; if (f.life <= 0) fl.splice(i, 1); }
}
