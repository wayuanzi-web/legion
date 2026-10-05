/* ===== 30-atlas: 所有圖像都在啟動時用程式畫進一張圖集 ===== */
const PAL = {
  blue: '#2f7bff', blueLt: '#7fb8ff', blueDk: '#1b4fd0', blueInk: '#0f2a78',
  red: '#ee3b30', redLt: '#ff8466', redDk: '#b51d1d', redInk: '#6a0b10',
  gold: '#ffc93c', goldLt: '#fff2b0', goldDk: '#cf8a14', goldInk: '#7a4a08',
  bone: '#f6efe0', iron: '#5b6372', ironLt: '#98a2b3', ironDk: '#2b303b',
  wood: '#a06d3b', woodLt: '#c8935a', woodDk: '#5c3a1c', ink: '#1a1420'
};
const AW = 2048, AH = 2048;
const AT = { cv: null, c: null, sp: {}, px: 8, py: 8, rowH: 0 };

function rrect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
function poly(c, p) { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); }
function lg(c, x0, y0, x1, y1, st) { const g = c.createLinearGradient(x0, y0, x1, y1); for (let i = 0; i < st.length; i += 2) g.addColorStop(st[i], st[i + 1]); return g; }
function rg(c, x, y, r0, r1, st) { const g = c.createRadialGradient(x, y, r0, x, y, r1); for (let i = 0; i < st.length; i += 2) g.addColorStop(st[i], st[i + 1]); return g; }
function fs(c, fill, stroke, lw) { if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); } }

// 在圖集裡配一塊 w×h，畫的時候座標系是 dw×dh（設計尺寸）
function art(name, w, h, dw, dh, fn) {
  const A = AT, gap = 10;
  if (A.px + w + gap > AW) { A.px = 8; A.py += A.rowH + gap; A.rowH = 0; }
  const x = A.px, y = A.py; A.px += w + gap; if (h > A.rowH) A.rowH = h;
  const c = A.c; c.save(); c.translate(x, y); c.beginPath(); c.rect(0, 0, w, h); c.clip(); c.scale(w / dw, h / dh);
  c.lineJoin = 'round'; c.lineCap = 'round';
  fn(c, dw, dh); c.restore();
  const s = { x, y, w, h, u0: x / AW, v0: y / AH, u1: (x + w) / AW, v1: (y + h) / AH, ax: 0.5, ay: 1 };
  A.sp[name] = s; return s;
}
function newRow() { AT.px = 8; AT.py += AT.rowH + 10; AT.rowH = 0; }

/* ---------- 小兵（64 格，腳底在 y=57） ---------- */
function shadow(c, x, y, rx, ry) { c.fillStyle = 'rgba(6,10,30,.30)'; ell(c, x, y, rx, ry); c.fill(); }
function artBlue(c, f) {
  const bob = (f & 1) ? -1.6 : 0, sw = f === 0 ? 2 : f === 2 ? -2 : 0;
  const ll = f === 0 ? 8 : f === 2 ? 12 : 10, rl = f === 0 ? 12 : f === 2 ? 8 : 10;
  shadow(c, 32, 57.5, 13, 4.5);
  c.fillStyle = PAL.blueInk; rrect(c, 24.5, 45, 6.5, ll, 3); c.fill(); rrect(c, 33, 45, 6.5, rl, 3); c.fill();
  c.save(); c.translate(0, bob);
  c.strokeStyle = '#7b5226'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(47, 45); c.lineTo(50.5, 11); c.stroke();
  poly(c, [50.6, 2.5, 53.4, 11.5, 47.8, 11.5]); fs(c, '#dfe8f6', PAL.blueInk, 1.2);
  rrect(c, 21, 26, 22, 24, 9); fs(c, lg(c, 0, 26, 0, 50, [0, '#62a2ff', 1, '#1b4dcd']), PAL.blueInk, 2);
  ell(c, 19.5, 37 + sw, 4.5, 5); fs(c, '#3d80f7', PAL.blueInk, 1.8);
  ell(c, 44.8, 37 - sw, 4.5, 5); fs(c, '#3d80f7', PAL.blueInk, 1.8);
  ell(c, 32, 39.5, 7.2, 7.2); fs(c, '#2458dc', PAL.blueInk, 1.8);
  c.strokeStyle = '#9cc8ff'; c.lineWidth = 1.5; c.beginPath(); c.arc(32, 39.5, 4.9, 0, TAU); c.stroke();
  ell(c, 32, 39.5, 2.6, 2.6); fs(c, PAL.gold);
  ell(c, 32, 19, 11, 10.5); fs(c, rg(c, 28, 14, 1, 15, [0, '#a3ccff', 1, '#2763e3']), PAL.blueInk, 2);
  c.strokeStyle = '#123596'; c.lineWidth = 2.4; c.beginPath(); c.arc(32, 18.5, 9.6, 0.16 * Math.PI, 0.84 * Math.PI); c.stroke();
  c.beginPath(); c.ellipse(32 + sw * 0.5, 7.6, 3.2, 5.6, sw * 0.07, 0, TAU); fs(c, '#ffffff', '#9db3d9', 1);
  c.restore();
}
function redHead(c, x, y, r, skin, ink, s) {
  // 角
  c.lineWidth = 1.2 * s;
  poly(c, [x - r * 0.82, y - r * 0.45, x - r * 1.35, y - r * 1.55, x - r * 0.3, y - r * 0.9]); fs(c, '#f3e6c4', '#7a5a2a', 1.2 * s);
  poly(c, [x + r * 0.82, y - r * 0.45, x + r * 1.35, y - r * 1.55, x + r * 0.3, y - r * 0.9]); fs(c, '#f3e6c4', '#7a5a2a', 1.2 * s);
  ell(c, x, y, r, r * 0.95); fs(c, skin, ink, 2 * s);
  // 怒眼
  c.fillStyle = '#fff';
  poly(c, [x - r * 0.66, y - r * 0.28, x - r * 0.08, y + r * 0.06, x - r * 0.16, y + r * 0.36, x - r * 0.62, y + r * 0.2]); c.fill();
  poly(c, [x + r * 0.66, y - r * 0.28, x + r * 0.08, y + r * 0.06, x + r * 0.16, y + r * 0.36, x + r * 0.62, y + r * 0.2]); c.fill();
  c.fillStyle = '#1a0608'; ell(c, x - r * 0.3, y + r * 0.14, r * 0.13, r * 0.15); c.fill(); ell(c, x + r * 0.3, y + r * 0.14, r * 0.13, r * 0.15); c.fill();
  c.strokeStyle = ink; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(x - r * 0.32, y + r * 0.62); c.lineTo(x + r * 0.32, y + r * 0.62); c.stroke();
}
function artRed(c, f) {
  const bob = (f & 1) ? -1.6 : 0, sw = f === 0 ? 2 : f === 2 ? -2 : 0;
  const ll = f === 0 ? 8 : f === 2 ? 12 : 10, rl = f === 0 ? 12 : f === 2 ? 8 : 10;
  shadow(c, 32, 57.5, 13, 4.5);
  c.fillStyle = PAL.redInk; rrect(c, 24.5, 45, 6.5, ll, 3); c.fill(); rrect(c, 33, 45, 6.5, rl, 3); c.fill();
  c.save(); c.translate(0, bob);
  // 彎刀
  c.save(); c.translate(46, 36 - sw); c.rotate(0.28);
  poly(c, [-2.2, 2, -2.6, -18, 1.5, -24, 4.4, -17, 2.4, 2]); fs(c, '#e4e9f1', '#3a2228', 1.3); c.restore();
  rrect(c, 21, 26, 22, 24, 9); fs(c, lg(c, 0, 26, 0, 50, [0, '#ff6a50', 1, '#c2201d']), PAL.redInk, 2);
  c.fillStyle = '#4a0c10'; c.fillRect(22, 42, 20, 3.2); c.fillStyle = PAL.gold; c.fillRect(30, 41.6, 4, 4);
  ell(c, 19.5, 37 + sw, 4.5, 5); fs(c, '#f04a3a', PAL.redInk, 1.8);
  ell(c, 44.8, 37 - sw, 4.5, 5); fs(c, '#f04a3a', PAL.redInk, 1.8);
  redHead(c, 32, 19, 11, rg(c, 28, 14, 1, 15, [0, '#ff8f72', 1, '#dd2e26']), PAL.redInk, 1);
  c.restore();
}
function artShield(c, f) {
  const bob = (f & 1) ? -1.4 : 0;
  const ll = f === 0 ? 8 : f === 2 ? 12 : 10, rl = f === 0 ? 12 : f === 2 ? 8 : 10;
  shadow(c, 32, 57.5, 14.5, 5);
  c.fillStyle = PAL.redInk; rrect(c, 23.5, 45, 7, ll, 3); c.fill(); rrect(c, 33.5, 45, 7, rl, 3); c.fill();
  c.save(); c.translate(0, bob);
  rrect(c, 20, 25, 24, 25, 9); fs(c, '#c2201d', PAL.redInk, 2);
  // 鐵盔
  redHead(c, 32, 18, 10.5, '#e2382c', PAL.redInk, 1);
  c.beginPath(); c.arc(32, 17, 10.6, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(42.5, 14.5); c.lineTo(21.5, 14.5); c.closePath(); fs(c, lg(c, 0, 6, 0, 16, [0, '#aab3c2', 1, '#5b6372']), PAL.ironDk, 1.6);
  // 大盾
  c.beginPath(); c.moveTo(17, 28); c.lineTo(47, 28); c.lineTo(47, 43); c.quadraticCurveTo(46, 53, 32, 56); c.quadraticCurveTo(18, 53, 17, 43); c.closePath();
  fs(c, lg(c, 17, 0, 47, 0, [0, '#6c7584', 0.5, '#8d97a8', 1, '#4d5563']), PAL.ironDk, 2.2);
  poly(c, [32, 33, 39, 41, 32, 50, 25, 41]); fs(c, PAL.red, PAL.redInk, 1.4);
  c.restore();
}
function artWolf(c, f) {
  const bob = (f & 1) ? -2 : 0;
  const ll = f === 0 ? 7 : f === 2 ? 12 : 10, rl = f === 0 ? 12 : f === 2 ? 7 : 10;
  shadow(c, 32, 57.5, 15.5, 5);
  c.fillStyle = '#2b2430'; rrect(c, 21.5, 45, 7, ll, 3); c.fill(); rrect(c, 35.5, 45, 7, rl, 3); c.fill();
  c.save(); c.translate(0, bob);
  // 騎手
  rrect(c, 24.5, 15, 15, 16, 6); fs(c, '#d42c24', PAL.redInk, 1.8);
  redHead(c, 32, 12.5, 7.6, '#f0483a', PAL.redInk, 0.75);
  // 狼身、狼頭
  ell(c, 32, 38, 15, 11); fs(c, lg(c, 0, 27, 0, 49, [0, '#6b6072', 1, '#3b3342']), '#1e1824', 2);
  poly(c, [22, 33, 19.5, 22.5, 28.5, 30]); fs(c, '#574c5e', '#1e1824', 1.6);
  poly(c, [42, 33, 44.5, 22.5, 35.5, 30]); fs(c, '#574c5e', '#1e1824', 1.6);
  ell(c, 32, 40.5, 10.5, 9.5); fs(c, '#7b7083', '#1e1824', 1.8);
  ell(c, 32, 45.5, 5.2, 4.6); fs(c, '#c9c0cf', '#1e1824', 1.2);
  ell(c, 32, 43.4, 2, 1.5); fs(c, '#160f1a');
  c.fillStyle = '#ffd43b'; poly(c, [24.5, 36.5, 30, 38.6, 25.5, 40.2]); c.fill(); poly(c, [39.5, 36.5, 34, 38.6, 38.5, 40.2]); c.fill();
  c.fillStyle = '#fff'; poly(c, [29.4, 48.4, 30.6, 51.6, 31.6, 48.6]); c.fill(); poly(c, [34.6, 48.4, 33.4, 51.6, 32.4, 48.6]); c.fill();
  c.restore();
}

/* ---------- 蠻兵（128 格，腳底 y=116） ---------- */
function artBrute(c, f) {
  const bob = f ? -3 : 0, ll = f ? 16 : 24, rl = f ? 24 : 16;
  shadow(c, 64, 116, 34, 10);
  c.fillStyle = PAL.redInk; rrect(c, 42, 92, 17, ll, 7); c.fill(); rrect(c, 69, 92, 17, rl, 7); c.fill();
  c.save(); c.translate(0, bob);
  // 狼牙棒
  c.save(); c.translate(104, 70); c.rotate(0.22 + (f ? 0.08 : 0));
  rrect(c, -5, -52, 10, 60, 4); fs(c, PAL.wood, PAL.woodDk, 2.4);
  rrect(c, -11, -78, 22, 34, 9); fs(c, '#7d858f', PAL.ironDk, 2.6);
  c.fillStyle = '#e9edf3'; for (let i = 0; i < 3; i++) { poly(c, [-11, -72 + i * 10, -19, -68 + i * 10, -11, -64 + i * 10]); c.fill(); poly(c, [11, -72 + i * 10, 19, -68 + i * 10, 11, -64 + i * 10]); c.fill(); }
  c.restore();
  rrect(c, 28, 40, 72, 62, 28); fs(c, lg(c, 0, 40, 0, 102, [0, '#f45a44', 1, '#a81a1a']), PAL.redInk, 3.4);
  ell(c, 64, 78, 21, 17); fs(c, 'rgba(255,190,150,.35)');
  c.fillStyle = '#3d0a0e'; c.fillRect(30, 88, 68, 6); c.fillStyle = PAL.gold; rrect(c, 58, 86, 12, 10, 2); c.fill();
  ell(c, 25, 66 + (f ? 3 : -3), 13, 15); fs(c, '#e2382c', PAL.redInk, 3);
  ell(c, 103, 66 - (f ? 3 : -3), 13, 15); fs(c, '#e2382c', PAL.redInk, 3);
  redHead(c, 64, 32, 19, rg(c, 58, 24, 2, 26, [0, '#ff8f72', 1, '#d22a24']), PAL.redInk, 1.7);
  c.fillStyle = '#fff8e6'; poly(c, [54, 42, 56.5, 51, 59.5, 42.5]); c.fill(); poly(c, [74, 42, 71.5, 51, 68.5, 42.5]); c.fill();
  c.restore();
}

/* ---------- 巨魔（224 格，腳底 y=206） ---------- */
function artGiant(c, pose) {
  const up = pose === 2, st = pose === 1;
  shadow(c, 112, 206, 62, 16);
  const ink = '#3a060b';
  c.fillStyle = ink; rrect(c, 74, 160, 30, st ? 34 : 46, 12); c.fill(); rrect(c, 120, 160, 30, st ? 46 : 34, 12); c.fill();
  c.save(); c.translate(0, st ? -4 : 0);
  // 手臂
  const armY = up ? 44 : 118, armL = up ? -0.9 : 0.25;
  for (const sd of [-1, 1]) {
    c.save(); c.translate(112 + sd * 64, 88); c.rotate(sd * (up ? -2.5 : 0.18));
    rrect(c, -17, -6, 34, 70, 16); fs(c, lg(c, 0, 0, 0, 64, [0, '#c22a2a', 1, '#8a1218']), ink, 4);
    ell(c, 0, 70, 22, 21); fs(c, '#a81c20', ink, 4);
    c.fillStyle = '#f0e2c0'; for (let k = -1; k <= 1; k++) { poly(c, [k * 11 - 4, 86, k * 11, 97, k * 11 + 4, 86]); c.fill(); }
    c.restore();
  }
  // 身體
  c.beginPath(); c.moveTo(56, 86); c.quadraticCurveTo(60, 62, 112, 62); c.quadraticCurveTo(164, 62, 168, 86); c.lineTo(156, 168); c.quadraticCurveTo(112, 182, 68, 168); c.closePath();
  fs(c, lg(c, 0, 62, 0, 176, [0, '#d43333', 0.6, '#9b161c', 1, '#6e0c14']), ink, 4.5);
  c.strokeStyle = 'rgba(40,0,6,.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(112, 92); c.lineTo(112, 150); c.moveTo(84, 112); c.quadraticCurveTo(112, 124, 140, 112); c.stroke();
  // 腰甲
  rrect(c, 64, 150, 96, 24, 8); fs(c, '#3a3f4b', '#14161c', 3.5);
  ell(c, 112, 162, 11, 11); fs(c, PAL.gold, PAL.goldInk, 2.5);
  // 肩甲
  for (const sd of [-1, 1]) {
    c.save(); c.translate(112 + sd * 56, 78);
    ell(c, 0, 0, 27, 20, sd * 0.25); fs(c, lg(c, 0, -20, 0, 20, [0, '#8b94a5', 1, '#3d4350']), '#14161c', 3.5);
    c.fillStyle = '#e9edf3'; poly(c, [-7, -16, 0, -38, 7, -16]); c.fill(); c.strokeStyle = '#14161c'; c.lineWidth = 2; c.stroke();
    c.restore();
  }
  // 頭
  const hx = 112, hy = up ? 46 : 50;
  poly(c, [hx - 20, hy - 12, hx - 54, hy - 44, hx - 6, hy - 26]); fs(c, '#efe1bd', '#6b4a1e', 2.5);
  poly(c, [hx + 20, hy - 12, hx + 54, hy - 44, hx + 6, hy - 26]); fs(c, '#efe1bd', '#6b4a1e', 2.5);
  ell(c, hx, hy, 27, 25); fs(c, rg(c, hx - 8, hy - 10, 3, 34, [0, '#e04a40', 1, '#8f141b']), ink, 4);
  c.fillStyle = '#ffe14d'; poly(c, [hx - 19, hy - 8, hx - 4, hy + 1, hx - 7, hy + 8, hx - 18, hy + 4]); c.fill(); poly(c, [hx + 19, hy - 8, hx + 4, hy + 1, hx + 7, hy + 8, hx + 18, hy + 4]); c.fill();
  c.fillStyle = '#2a0508'; rrect(c, hx - 13, hy + 11, 26, up ? 12 : 7, 3); c.fill();
  c.fillStyle = '#fff8e6'; poly(c, [hx - 12, hy + 11, hx - 8, hy + 20, hx - 4, hy + 11]); c.fill(); poly(c, [hx + 12, hy + 11, hx + 8, hy + 20, hx + 4, hy + 11]); c.fill();
  c.restore();
}

/* ---------- 赤潮魔王（384 格，腳底 y=356） ---------- */
function artBoss(c, pose) {
  const up = pose === 2, st = pose === 1;
  shadow(c, 192, 356, 112, 26);
  const ink = '#1b0410';
  // 披風
  c.beginPath(); c.moveTo(108, 120); c.quadraticCurveTo(40, 230, 62 + (st ? 10 : 0), 338); c.lineTo(322 - (st ? 10 : 0), 338); c.quadraticCurveTo(344, 230, 276, 120); c.closePath();
  fs(c, lg(c, 0, 120, 0, 338, [0, '#4a1458', 1, '#1c0626']), ink, 6);
  c.fillStyle = ink; rrect(c, 134, 270, 48, st ? 66 : 82, 18); c.fill(); rrect(c, 202, 270, 48, st ? 82 : 66, 18); c.fill();
  c.save(); c.translate(0, st ? -6 : 0);
  for (const sd of [-1, 1]) {
    c.save(); c.translate(192 + sd * 104, 150); c.rotate(sd * (up ? -2.45 : 0.2));
    rrect(c, -27, -10, 54, 112, 24); fs(c, lg(c, 0, 0, 0, 104, [0, '#7c1622', 1, '#460a16']), ink, 6);
    rrect(c, -31, 30, 62, 30, 8); fs(c, '#2c2f3a', ink, 5);
    ell(c, 0, 112, 35, 33); fs(c, '#6b1220', ink, 6);
    c.fillStyle = '#eadcb8'; for (let k = -1; k <= 1; k++) { poly(c, [k * 18 - 7, 136, k * 18, 156, k * 18 + 7, 136]); c.fill(); }
    c.restore();
  }
  // 鎧甲身軀
  c.beginPath(); c.moveTo(96, 146); c.quadraticCurveTo(104, 104, 192, 104); c.quadraticCurveTo(280, 104, 288, 146); c.lineTo(268, 286); c.quadraticCurveTo(192, 308, 116, 286); c.closePath();
  fs(c, lg(c, 0, 104, 0, 300, [0, '#3b3f4d', 0.55, '#22242e', 1, '#101116']), ink, 7);
  c.strokeStyle = '#6d0f1c'; c.lineWidth = 5; c.beginPath(); c.moveTo(124, 150); c.lineTo(192, 210); c.lineTo(260, 150); c.stroke();
  // 胸口魔核
  ell(c, 192, 196, 36, 36); fs(c, rg(c, 192, 196, 2, 38, [0, '#fff6c0', 0.35, '#ffb02e', 0.8, '#e23a12', 1, '#7a0e0a']), ink, 5);
  rrect(c, 108, 262, 168, 32, 10); fs(c, '#4b1020', ink, 5);
  for (let k = -2; k <= 2; k++) { poly(c, [192 + k * 30 - 9, 294, 192 + k * 30, 316, 192 + k * 30 + 9, 294]); fs(c, '#8d939f', ink, 3); }
  // 肩甲
  for (const sd of [-1, 1]) {
    c.save(); c.translate(192 + sd * 94, 132);
    ell(c, 0, 0, 46, 32, sd * 0.3); fs(c, lg(c, 0, -32, 0, 32, [0, '#5a6070', 1, '#22242e']), ink, 6);
    for (let k = -1; k <= 1; k++) { poly(c, [k * 22 - 9, -24, k * 22 + sd * 4, -62 + Math.abs(k) * 10, k * 22 + 9, -24]); fs(c, '#d6dae2', ink, 3); }
    c.restore();
  }
  // 頭與角冠
  const hx = 192, hy = up ? 76 : 84;
  for (const sd of [-1, 1]) {
    c.beginPath(); c.moveTo(hx + sd * 26, hy - 22); c.quadraticCurveTo(hx + sd * 92, hy - 34, hx + sd * 84, hy - 96); c.quadraticCurveTo(hx + sd * 58, hy - 52, hx + sd * 10, hy - 36); c.closePath(); fs(c, lg(c, 0, hy - 96, 0, hy - 22, [0, '#fff0c8', 1, '#b98a44']), '#4c2d0c', 4);
    poly(c, [hx + sd * 12, hy - 36, hx + sd * 22, hy - 78, hx + sd * 32, hy - 30]); fs(c, '#e7d6aa', '#4c2d0c', 3);
  }
  ell(c, hx, hy, 42, 39); fs(c, rg(c, hx - 12, hy - 14, 4, 52, [0, '#a2202c', 1, '#4f0a16']), ink, 6);
  c.fillStyle = '#ffec6e'; poly(c, [hx - 30, hy - 14, hx - 6, hy + 2, hx - 11, hy + 12, hx - 29, hy + 5]); c.fill(); poly(c, [hx + 30, hy - 14, hx + 6, hy + 2, hx + 11, hy + 12, hx + 29, hy + 5]); c.fill();
  c.fillStyle = '#fff'; ell(c, hx - 18, hy + 1, 3, 3); c.fill(); ell(c, hx + 18, hy + 1, 3, 3); c.fill();
  c.fillStyle = up ? '#ff7a1a' : '#1a0408'; rrect(c, hx - 20, hy + 17, 40, up ? 18 : 10, 4); c.fill();
  c.fillStyle = '#fff8e6'; for (const k of [-16, -6, 6, 16]) { poly(c, [hx + k - 4, hy + 17, hx + k, hy + 28, hx + k + 4, hy + 17]); c.fill(); }
  c.restore();
}

/* ---------- 先鋒大將（192 格，背影，腳底 y=176） ---------- */
function artHero(c, f) {
  const bob = f ? -4 : 0, ll = f ? 20 : 30, rl = f ? 30 : 20;
  shadow(c, 96, 176, 46, 13);
  const ink = '#0c1f5c';
  c.fillStyle = ink; rrect(c, 70, 138, 22, ll, 9); c.fill(); rrect(c, 100, 138, 22, rl, 9); c.fill();
  c.save(); c.translate(0, bob);
  // 關刀
  c.save(); c.translate(150, 108); c.rotate(0.2 - (f ? 0.1 : 0));
  rrect(c, -4.5, -96, 9, 142, 4); fs(c, '#8a5a2b', '#3f2610', 2.5);
  c.beginPath(); c.moveTo(-6, -92); c.quadraticCurveTo(-34, -128, -8, -168); c.quadraticCurveTo(26, -132, 8, -92); c.closePath(); fs(c, lg(c, -30, 0, 20, 0, [0, '#ffffff', 1, '#b9c6da']), '#2b3a55', 3);
  rrect(c, -11, -98, 22, 10, 3); fs(c, PAL.gold, PAL.goldInk, 2.5);
  c.restore();
  // 披風
  c.beginPath(); c.moveTo(58, 66); c.quadraticCurveTo(38, 120, 50 + (f ? 8 : 0), 160); c.lineTo(142 - (f ? 0 : 8), 160); c.quadraticCurveTo(154, 120, 134, 66); c.closePath();
  fs(c, lg(c, 0, 66, 0, 160, [0, '#ffffff', 1, '#c8d8f4']), ink, 4);
  c.strokeStyle = 'rgba(40,70,150,.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(80, 84); c.lineTo(74, 152); c.moveTo(112, 84); c.lineTo(118, 152); c.stroke();
  // 肩甲與手
  for (const sd of [-1, 1]) {
    ell(c, 96 + sd * 50, 100 + sd * (f ? 5 : -5), 14, 16); fs(c, '#2f6ff0', ink, 3.5);
    ell(c, 96 + sd * 42, 72, 23, 17, sd * 0.3); fs(c, lg(c, 0, 55, 0, 89, [0, '#fff0a8', 1, '#e0a020']), PAL.goldInk, 3.5);
  }
  // 頭盔
  ell(c, 96, 46, 29, 27); fs(c, rg(c, 86, 34, 3, 38, [0, '#9cc6ff', 1, '#2059df']), ink, 4.5);
  c.strokeStyle = PAL.gold; c.lineWidth = 6; c.beginPath(); c.arc(96, 45, 25, 0.14 * Math.PI, 0.86 * Math.PI); c.stroke();
  c.strokeStyle = PAL.goldInk; c.lineWidth = 1.6; c.beginPath(); c.arc(96, 45, 28.4, 0.14 * Math.PI, 0.86 * Math.PI); c.stroke();
  c.beginPath(); c.moveTo(90, 22); c.quadraticCurveTo(84, -6, 104 + (f ? 6 : 0), 2); c.quadraticCurveTo(116, 12, 102, 22); c.closePath(); fs(c, lg(c, 0, 0, 0, 22, [0, '#ff5a4a', 1, '#c41e1e']), '#6a0b10', 3);
  c.restore();
}

/* ---------- 兵砲 ---------- */
function artCannonBase(c) {
  // 192×150，砲架從後上方看
  shadow(c, 96, 128, 84, 18);
  for (const sd of [-1, 1]) {
    const x = 96 + sd * 68;
    rrect(c, x - 13, 44, 26, 96, 11); fs(c, lg(c, x - 13, 0, x + 13, 0, [0, '#4a2c12', 0.5, '#8a5a2b', 1, '#3a220e']), '#24130a', 4);
    c.strokeStyle = '#c9a15f'; c.lineWidth = 3; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(x - 9, 56 + k * 18); c.lineTo(x + 9, 56 + k * 18); c.stroke(); }
    rrect(c, x - 15, 82, 30, 18, 5); fs(c, PAL.gold, PAL.goldInk, 3);
  }
  rrect(c, 40, 64, 112, 62, 12); fs(c, lg(c, 0, 64, 0, 126, [0, '#b67c42', 1, '#6f4520']), '#2c180a', 4.5);
  c.strokeStyle = 'rgba(40,20,6,.45)'; c.lineWidth = 3; c.beginPath(); c.moveTo(48, 86); c.lineTo(144, 86); c.moveTo(48, 106); c.lineTo(144, 106); c.stroke();
  rrect(c, 56, 70, 80, 12, 4); fs(c, '#3a3f4b', '#14161c', 3);
}
function artCannonBarrel(c) {
  // 96×168，砲口朝上
  c.beginPath(); c.moveTo(22, 150); c.lineTo(26, 34); c.quadraticCurveTo(48, 22, 70, 34); c.lineTo(74, 150); c.quadraticCurveTo(48, 166, 22, 150); c.closePath();
  fs(c, lg(c, 20, 0, 76, 0, [0, '#16295f', 0.35, '#3d6fe0', 0.6, '#2a55c4', 1, '#10204f']), '#0a1436', 4.5);
  ell(c, 48, 152, 15, 9); fs(c, '#1b3482', '#0a1436', 3.5);
  for (const y of [58, 112]) { c.beginPath(); c.moveTo(24, y); c.quadraticCurveTo(48, y + 10, 72, y); c.lineTo(72, y + 11); c.quadraticCurveTo(48, y + 21, 24, y + 11); c.closePath(); fs(c, lg(c, 24, 0, 72, 0, [0, '#b9790f', 0.4, '#ffe28a', 1, '#a56a0a']), PAL.goldInk, 2.5); }
  // 砲口
  c.beginPath(); c.ellipse(48, 30, 30, 17, 0, 0, TAU); fs(c, lg(c, 18, 0, 78, 0, [0, '#b9790f', 0.4, '#ffe9a0', 1, '#a56a0a']), PAL.goldInk, 4);
  c.beginPath(); c.ellipse(48, 30, 20, 10.5, 0, 0, TAU); fs(c, '#060a18', '#0a1436', 2);
}

/* ---------- 門、石座、砲塔、桶 ---------- */
function artPost(c, col, dk, gem) {
  // 48×176：門柱
  shadow(c, 24, 166, 17, 6);
  rrect(c, 14, 22, 20, 144, 5); fs(c, lg(c, 14, 0, 34, 0, [0, dk, 0.45, col, 1, dk]), PAL.ink, 3);
  rrect(c, 9, 150, 30, 18, 5); fs(c, '#6f7480', PAL.ink, 3);
  rrect(c, 9, 20, 30, 12, 4); fs(c, '#6f7480', PAL.ink, 3);
  poly(c, [24, 2, 36, 14, 24, 24, 12, 14]); fs(c, gem, PAL.ink, 2.5);
  c.fillStyle = 'rgba(255,255,255,.6)'; poly(c, [24, 5, 30, 13, 24, 13]); c.fill();
}
function artBeam(c, col, lt, dk) {
  // 256×72：門楣牌匾，左右可拉伸
  rrect(c, 3, 6, 250, 60, 12); fs(c, lg(c, 0, 6, 0, 66, [0, lt, 0.5, col, 1, dk]), PAL.ink, 4);
  rrect(c, 10, 12, 236, 14, 7); fs(c, 'rgba(255,255,255,.28)');
  c.fillStyle = 'rgba(0,0,0,.18)'; for (const x of [16, 240]) { ell(c, x, 36, 4.5, 4.5); c.fill(); }
}
function artPed(c) {
  // 176×120：石座
  shadow(c, 88, 86, 80, 26);
  ell(c, 88, 76, 74, 30); fs(c, '#5b606c', PAL.ink, 4);
  ell(c, 88, 64, 74, 30); fs(c, lg(c, 0, 34, 0, 94, [0, '#b4bac6', 1, '#868c99']), PAL.ink, 4);
  c.setLineDash([9, 8]); ell(c, 88, 64, 56, 21); fs(c, null, 'rgba(255,255,255,.75)', 3.5); c.setLineDash([]);
}
function artBallista(c) {
  // 176×176：連弩車，朝上
  shadow(c, 88, 150, 62, 18);
  rrect(c, 54, 62, 68, 92, 10); fs(c, lg(c, 0, 62, 0, 154, [0, '#b67c42', 1, '#6f4520']), '#2c180a', 4.5);
  for (const sd of [-1, 1]) { rrect(c, 88 + sd * 44 - 9, 98, 18, 56, 8); fs(c, '#4a2c12', '#24130a', 3.5); }
  c.beginPath(); c.moveTo(10, 78); c.quadraticCurveTo(88, 12, 166, 78); c.quadraticCurveTo(88, 40, 10, 78); c.closePath(); fs(c, lg(c, 0, 20, 0, 80, [0, '#e7c58d', 1, '#8a5a2b']), '#2c180a', 4);
  c.strokeStyle = '#f2ead8'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(13, 78); c.lineTo(88, 112); c.lineTo(163, 78); c.stroke();
  for (const dx of [-16, 0, 16]) { rrect(c, 88 + dx - 3.5, 20, 7, 92, 3); fs(c, '#d9dfe9', '#2b3a55', 2); poly(c, [88 + dx - 8, 24, 88 + dx, 4, 88 + dx + 8, 24]); fs(c, '#ffffff', '#2b3a55', 2); }
  rrect(c, 66, 104, 44, 16, 5); fs(c, PAL.blue, PAL.blueInk, 3);
}
function artMortar(c) {
  // 176×176：轟天砲
  shadow(c, 88, 150, 62, 18);
  rrect(c, 34, 104, 108, 50, 12); fs(c, lg(c, 0, 104, 0, 154, [0, '#b67c42', 1, '#6f4520']), '#2c180a', 4.5);
  c.beginPath(); c.moveTo(44, 124); c.quadraticCurveTo(34, 60, 54, 40); c.lineTo(122, 40); c.quadraticCurveTo(142, 60, 132, 124); c.quadraticCurveTo(88, 142, 44, 124); c.closePath();
  fs(c, lg(c, 40, 0, 136, 0, [0, '#3a2408', 0.35, '#e0a030', 0.6, '#b8791a', 1, '#33200a']), '#1e1204', 5);
  c.beginPath(); c.ellipse(88, 42, 40, 20, 0, 0, TAU); fs(c, lg(c, 48, 0, 128, 0, [0, '#b9790f', 0.4, '#fff0b0', 1, '#a56a0a']), '#1e1204', 4.5);
  c.beginPath(); c.ellipse(88, 42, 28, 13, 0, 0, TAU); fs(c, '#0a0603', '#1e1204', 2);
  rrect(c, 40, 92, 96, 13, 5); fs(c, PAL.blue, PAL.blueInk, 3);
}
function artBarrel(c) {
  // 80×96
  shadow(c, 40, 86, 30, 9);
  rrect(c, 12, 16, 56, 70, 14); fs(c, lg(c, 12, 0, 68, 0, [0, '#5c3a1c', 0.4, '#b98148', 1, '#4a2c12']), '#24130a', 4);
  for (const y of [28, 66]) { rrect(c, 10, y, 60, 9, 3); fs(c, '#d83a2c', '#5a0d10', 2.5); }
  c.beginPath(); c.ellipse(40, 18, 27, 9, 0, 0, TAU); fs(c, '#8a5a2b', '#24130a', 3.5);
  // 火焰記號
  c.beginPath(); c.moveTo(40, 38); c.quadraticCurveTo(52, 50, 46, 60); c.quadraticCurveTo(40, 66, 34, 60); c.quadraticCurveTo(28, 50, 40, 38); c.closePath(); fs(c, '#ffd43b', '#b3540a', 2.5);
}
/* ---------- 赤龍（從上往下看：頭朝下，身體是一節一節的） ---------- */
function artDragonHead(c) {
  // 200×224
  const ink = '#3a060b';
  for (const k of [-2, -1, 0, 1, 2]) { poly(c, [100 + k * 20 - 15, 74, 100 + k * 27, 10 + Math.abs(k) * 13, 100 + k * 20 + 15, 74]); fs(c, lg(c, 0, 10, 0, 74, [0, '#ffe07a', 1, '#f08a2a']), '#8a3a08', 3); }
  for (const sd of [-1, 1]) {
    c.beginPath(); c.moveTo(100 + sd * 28, 82); c.quadraticCurveTo(100 + sd * 80, 66, 100 + sd * 90, 12); c.quadraticCurveTo(100 + sd * 60, 46, 100 + sd * 44, 60); c.closePath();
    fs(c, lg(c, 0, 12, 0, 82, [0, '#fff6cf', 1, '#d9a441']), '#6b4a1e', 3);
    poly(c, [100 + sd * 64, 46, 100 + sd * 98, 46, 100 + sd * 70, 60]); fs(c, '#f3dc9a', '#6b4a1e', 2.5);
  }
  c.beginPath(); c.moveTo(50, 88); c.quadraticCurveTo(56, 54, 100, 52); c.quadraticCurveTo(144, 54, 150, 88); c.quadraticCurveTo(154, 130, 134, 162); c.quadraticCurveTo(126, 200, 100, 206); c.quadraticCurveTo(74, 200, 66, 162); c.quadraticCurveTo(46, 130, 50, 88); c.closePath();
  fs(c, rg(c, 92, 92, 6, 112, [0, '#ff6a50', 0.6, '#d22a24', 1, '#8f141b']), ink, 5);
  c.strokeStyle = 'rgba(60,0,6,.4)'; c.lineWidth = 3;
  for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(100, 96 + k * 20, 13 - k * 2, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  for (const sd of [-1, 1]) {
    poly(c, [100 + sd * 14, 108, 100 + sd * 46, 90, 100 + sd * 48, 112, 100 + sd * 20, 124]); fs(c, '#ffe14d', ink, 3);
    ell(c, 100 + sd * 33, 108, 4, 7); fs(c, '#1a0608');
    poly(c, [100 + sd * 8, 100, 100 + sd * 52, 78, 100 + sd * 56, 90, 100 + sd * 12, 110]); fs(c, '#8f141b', ink, 2.5);
  }
  ell(c, 100, 182, 25, 19); fs(c, lg(c, 0, 164, 0, 200, [0, '#f0483a', 1, '#b51d1d']), ink, 4);
  c.fillStyle = '#1a0608'; ell(c, 91, 188, 4, 3); c.fill(); ell(c, 109, 188, 4, 3); c.fill();
  c.fillStyle = '#fff8e6'; for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { poly(c, [100 + sd * (30 + k * 3), 150 + k * 12, 100 + sd * (40 + k * 2), 158 + k * 12, 100 + sd * (28 + k * 3), 162 + k * 12]); c.fill(); }
  for (const sd of [-1, 1]) {
    c.beginPath(); c.moveTo(100 + sd * 22, 178); c.bezierCurveTo(100 + sd * 62, 184, 100 + sd * 84, 150, 100 + sd * 94, 204);
    c.strokeStyle = '#8a3a08'; c.lineWidth = 8; c.stroke(); c.strokeStyle = '#ffd35a'; c.lineWidth = 4.5; c.stroke();
  }
}
function artDragonBody(c) {
  // 128×128：一節身體
  const ink = '#3a060b';
  ell(c, 64, 64, 55, 55); fs(c, rg(c, 54, 52, 6, 62, [0, '#ff6a50', 0.65, '#cf2a24', 1, '#8f141b']), ink, 5);
  c.strokeStyle = 'rgba(60,0,6,.4)'; c.lineWidth = 3;
  for (const p of [[40, 44], [88, 44], [30, 70], [98, 70], [44, 94], [84, 94]]) { c.beginPath(); c.arc(p[0], p[1], 11, Math.PI * 0.1, Math.PI * 0.9); c.stroke(); }
  for (const sd of [-1, 1]) { c.beginPath(); c.arc(64 + sd * 6, 64, 46, sd > 0 ? -0.5 : Math.PI - 0.5, sd > 0 ? 0.5 : Math.PI + 0.5); c.strokeStyle = 'rgba(255,220,170,.4)'; c.lineWidth = 5; c.stroke(); }
  poly(c, [64, 14, 84, 64, 64, 114, 44, 64]); fs(c, lg(c, 0, 14, 0, 114, [0, '#ffe07a', 1, '#f08a2a']), '#8a3a08', 3.5);
  c.fillStyle = 'rgba(255,255,255,.5)'; poly(c, [64, 22, 74, 62, 64, 62]); c.fill();
}
/* ---------- 行軍關的道具 ---------- */
function artCask(c) {
  // 80×96：裝著援兵或武器的木桶
  shadow(c, 40, 86, 30, 9);
  rrect(c, 12, 16, 56, 70, 14); fs(c, lg(c, 12, 0, 68, 0, [0, '#5c3a1c', 0.4, '#c8935a', 1, '#4a2c12']), '#24130a', 4);
  c.strokeStyle = 'rgba(40,20,6,.38)'; c.lineWidth = 2; for (const x of [26, 40, 54]) { c.beginPath(); c.moveTo(x, 22); c.lineTo(x, 84); c.stroke(); }
  for (const y of [27, 67]) { rrect(c, 10, y, 60, 8, 3); fs(c, lg(c, 10, 0, 70, 0, [0, '#4d5563', 0.4, '#b4bac6', 1, '#3d4350']), '#14161c', 2.5); }
  c.beginPath(); c.ellipse(40, 18, 27, 9, 0, 0, TAU); fs(c, '#9a6a36', '#24130a', 3.5);
}
function artBowIcon(c) {
  // 96×96：連弩（武器升級）
  c.save(); c.translate(48, 50); c.rotate(-0.62);
  rrect(c, -5, -30, 10, 66, 4); fs(c, lg(c, -5, 0, 5, 0, [0, '#1b46b8', 0.5, '#6fb0ff', 1, '#1b46b8']), PAL.blueInk, 3);
  c.beginPath(); c.moveTo(-36, -8); c.quadraticCurveTo(0, -44, 36, -8); c.quadraticCurveTo(0, -26, -36, -8); c.closePath(); fs(c, lg(c, 0, -40, 0, -8, [0, '#bfe0ff', 1, '#2f7bff']), PAL.blueInk, 3);
  c.strokeStyle = '#eaf4ff'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-34, -8); c.lineTo(0, 12); c.lineTo(34, -8); c.stroke();
  rrect(c, -2.4, -44, 4.8, 50, 2); fs(c, '#ffffff', '#2b3a55', 1.6); poly(c, [-7, -40, 0, -56, 7, -40]); fs(c, '#ffffff', '#2b3a55', 2);
  rrect(c, -9, 24, 18, 9, 3); fs(c, PAL.gold, PAL.goldInk, 2.5);
  c.restore();
}
function artCage(c) {
  // 144×144：關著機關車的木籠，木條之間是透空的
  c.strokeStyle = '#24130a'; c.lineWidth = 3.5;
  for (let k = 0; k < 6; k++) { const x = 16 + k * 22.4; rrect(c, x - 4.5, 22, 9, 104, 3); fs(c, lg(c, x - 4.5, 0, x + 4.5, 0, [0, '#5c3a1c', 0.5, '#c8935a', 1, '#4a2c12']), '#24130a', 2.5); }
  for (const y of [14, 122]) { rrect(c, 6, y, 132, 14, 5); fs(c, lg(c, 0, y, 0, y + 14, [0, '#d2a56c', 1, '#7a4e26']), '#24130a', 3.5); }
  c.fillStyle = PAL.gold; for (const x of [14, 130]) for (const y of [21, 129]) { ell(c, x, y, 3.4, 3.4); c.fill(); }
}
function artSaw(c) {
  // 112×112：滾刀
  c.translate(56, 56);
  c.beginPath(); for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, r = (i & 1) ? 38 : 52; c.lineTo(Math.cos(a + (i & 1 ? 0.1 : 0)) * r, Math.sin(a + (i & 1 ? 0.1 : 0)) * r); } c.closePath();
  fs(c, rg(c, -10, -12, 4, 56, [0, '#f2f5fa', 0.6, '#9aa3b3', 1, '#4d5563']), '#14161c', 3.5);
  ell(c, 0, 0, 26, 26); fs(c, null, 'rgba(20,22,28,.45)', 3);
  ell(c, 0, 0, 14, 14); fs(c, rg(c, -3, -4, 1, 14, [0, '#ff8466', 1, '#b51d1d']), '#3a060b', 3.5);
  c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, -16, -20, 9, 5, -0.7); c.fill();
}
function artSluice(c) {
  // 176×176：水閘。兩根木柱夾著閘板，上面是絞盤，底下蓄著水
  shadow(c, 88, 152, 66, 18);
  ell(c, 88, 136, 60, 20); fs(c, rg(c, 88, 132, 6, 60, [0, '#bfe8ff', 0.6, '#3d9bff', 1, '#1b4fd0']), '#0f2a78', 4);
  for (const sd of [-1, 1]) { const x = 88 + sd * 50; rrect(c, x - 11, 34, 22, 112, 6); fs(c, lg(c, x - 11, 0, x + 11, 0, [0, '#4a2c12', 0.5, '#b98148', 1, '#3a220e']), '#24130a', 4); }
  rrect(c, 46, 62, 84, 70, 6); fs(c, lg(c, 0, 62, 0, 132, [0, '#c8935a', 1, '#6f4520']), '#24130a', 4);
  c.strokeStyle = 'rgba(40,20,6,.45)'; c.lineWidth = 3; for (const x of [67, 88, 109]) { c.beginPath(); c.moveTo(x, 66); c.lineTo(x, 128); c.stroke(); }
  rrect(c, 44, 84, 88, 10, 3); fs(c, '#5b6372', '#14161c', 2.5); rrect(c, 44, 110, 88, 10, 3); fs(c, '#5b6372', '#14161c', 2.5);
  rrect(c, 28, 26, 120, 16, 6); fs(c, lg(c, 0, 26, 0, 42, [0, '#d2a56c', 1, '#7a4e26']), '#24130a', 4);
  ell(c, 88, 34, 17, 17); fs(c, rg(c, 84, 30, 2, 18, [0, '#ffe9a0', 1, '#cf8a14']), PAL.goldInk, 3.5);
  c.strokeStyle = PAL.goldInk; c.lineWidth = 3; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; c.beginPath(); c.moveTo(88 - Math.cos(a) * 15, 34 - Math.sin(a) * 15); c.lineTo(88 + Math.cos(a) * 15, 34 + Math.sin(a) * 15); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; for (const k of [-1, 0, 1]) { c.beginPath(); c.moveTo(70 + k * 18, 138); c.quadraticCurveTo(79 + k * 18, 132, 88 + k * 18, 138); c.stroke(); }
}
function artRailPost(c, dk, lt, cap, capDk) {
  // 32×96：橋欄的望柱
  shadow(c, 16, 90, 11, 4);
  rrect(c, 9, 20, 14, 70, 3); fs(c, lg(c, 9, 0, 23, 0, [0, dk, 0.45, lt, 1, dk]), PAL.ink, 2.5);
  rrect(c, 6, 14, 20, 9, 3); fs(c, '#e9dfc8', PAL.ink, 2.5);
  ell(c, 16, 9, 6.5, 7); fs(c, rg(c, 14, 6, 1, 8, [0, cap, 1, capDk]), PAL.ink, 2.2);
}
function artRock(c) { shadow(c, 32, 56, 22, 6); poly(c, [12, 40, 16, 18, 34, 8, 52, 20, 54, 42, 38, 54, 20, 52]); fs(c, lg(c, 0, 8, 0, 54, [0, '#b3b9c4', 1, '#5f6570']), PAL.ink, 3.5); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(26, 20); c.lineTo(34, 34); c.lineTo(46, 32); c.stroke(); }
function artShell(c) { ell(c, 24, 24, 15, 15); fs(c, rg(c, 19, 18, 2, 18, [0, '#7b8494', 1, '#1c2029']), '#0a0c10', 3); ell(c, 18, 17, 4, 3); fs(c, 'rgba(255,255,255,.55)'); }
function artFireball(c) { ell(c, 48, 48, 44, 44); fs(c, rg(c, 48, 48, 4, 44, [0, 'rgba(255,255,220,1)', 0.3, 'rgba(255,190,60,.95)', 0.65, 'rgba(240,70,20,.7)', 1, 'rgba(180,20,10,0)'])); }

/* ---------- 特效用的小圖 ---------- */
function artSoft(c) { ell(c, 32, 32, 30, 30); fs(c, rg(c, 32, 32, 0, 30, [0, 'rgba(255,255,255,1)', 0.5, 'rgba(255,255,255,.55)', 1, 'rgba(255,255,255,0)'])); }
function artDot(c) { ell(c, 16, 16, 12.5, 12.5); fs(c, '#fff'); }
function artPuff(c) {
  c.fillStyle = 'rgba(255,255,255,.95)';
  for (const p of [[22, 36, 15], [40, 38, 16], [31, 24, 15], [46, 26, 10], [16, 24, 9]]) { ell(c, p[0], p[1], p[2], p[2]); c.fill(); }
}
function artStar(c) {
  c.fillStyle = '#fff'; c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = (i & 1) ? 6 : 29; c.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
  c.closePath(); c.fill();
}
function artRing(c) { c.strokeStyle = '#fff'; c.lineWidth = 12; ell(c, 64, 64, 54, 54); c.stroke(); }
function artRingThin(c) { c.strokeStyle = '#fff'; c.lineWidth = 5; ell(c, 64, 64, 58, 58); c.stroke(); }
function artDisc(c) { ell(c, 64, 64, 60, 60); fs(c, rg(c, 64, 64, 20, 60, [0, 'rgba(255,255,255,.18)', 0.8, 'rgba(255,255,255,.5)', 1, 'rgba(255,255,255,.95)'])); }
function artStreak(c) { rrect(c, 4, 2, 8, 60, 4); fs(c, lg(c, 0, 0, 0, 64, [0, 'rgba(255,255,255,1)', 1, 'rgba(255,255,255,0)'])); }
function artArrow(c) {
  // 16×80，箭頭朝下
  c.fillStyle = '#e9d6a8'; c.fillRect(7, 2, 2.4, 62);
  c.fillStyle = '#ffffff'; poly(c, [3, 2, 8, 12, 13, 2]); c.fill();
  c.fillStyle = '#dfe6f0'; poly(c, [2.5, 62, 8, 79, 13.5, 62]); c.fill();
}
function artBolt(c) {
  // 16×96，箭頭朝上
  c.fillStyle = '#c9a56b'; c.fillRect(6.2, 16, 3.6, 74);
  c.fillStyle = '#ffffff'; poly(c, [1.5, 20, 8, 1, 14.5, 20]); c.fill();
  c.fillStyle = '#9fd0ff'; poly(c, [2, 92, 8, 78, 14, 92]); c.fill();
}
function artSlash(c) {
  // 256×256 的弧形刀光
  c.translate(128, 128);
  const g = c.createConicGradient ? c.createConicGradient(-Math.PI * 0.5, 0, 0) : null;
  if (g) { g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,240,170,.15)'); g.addColorStop(0.8, 'rgba(255,255,255,.95)'); g.addColorStop(0.82, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)'); }
  c.fillStyle = g || 'rgba(255,255,255,.5)';
  c.beginPath(); c.arc(0, 0, 122, 0, TAU); c.arc(0, 0, 70, 0, TAU, true); c.fill('evenodd');
}
function artHelm(c, blue) {
  if (blue) { ell(c, 16, 18, 10.5, 10); fs(c, '#3d80f7', PAL.blueInk, 2); ell(c, 16, 7, 3.4, 5); fs(c, '#fff'); }
  else { poly(c, [8, 14, 3, 3, 13, 10]); fs(c, '#f3e6c4'); poly(c, [24, 14, 29, 3, 19, 10]); fs(c, '#f3e6c4'); ell(c, 16, 18, 10.5, 10); fs(c, '#e2382c', PAL.redInk, 2); }
}
function artCurtain(c) { c.fillStyle = lg(c, 0, 0, 0, 64, [0, 'rgba(255,255,255,.62)', 0.55, 'rgba(255,255,255,.26)', 1, 'rgba(255,255,255,.04)']); c.fillRect(0, 0, 16, 64); }
function artSoldierIcon(c) { c.fillStyle = '#fff'; ell(c, 16, 9, 6.5, 6.5); c.fill(); rrect(c, 8, 15, 16, 15, 6); c.fill(); }

/* ---------- 數字字形 ---------- */
const GLYPHS = '0123456789×÷+-%,/!K';
const GL = {};        // 字 → sprite
let glyphFont = '900 84px "Arial Black","Helvetica Neue","Arial",sans-serif';
function artGlyphs() {
  const c = AT.c, H = 112;
  // fonts.check() 在字型根本沒註冊時也會回 true，所以要確認真的載入了
  try { if (document.fonts && [...document.fonts].some((f) => /Lilita One/.test(f.family) && f.status === 'loaded')) glyphFont = '400 84px "Lilita One"'; } catch (e) { /* 用後備字型 */ }
  for (const ch of GLYPHS) {
    c.font = glyphFont;
    const m = c.measureText(ch), w = Math.ceil(Math.max(m.width, 18)) + 26;
    GL[ch] = art('g' + ch, w, H, w, H, (c) => {
      c.font = glyphFont; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.lineJoin = 'round'; c.strokeStyle = '#10152b'; c.lineWidth = 17; c.strokeText(ch, w / 2, 80);
      c.strokeStyle = '#10152b'; c.lineWidth = 13; c.strokeText(ch, w / 2, 85);
      c.fillStyle = '#fff'; c.fillText(ch, w / 2, 80);
    });
    GL[ch].adv = (w - 20) / H;
  }
}

function buildAtlas() {
  const cv = document.createElement('canvas'); cv.width = AW; cv.height = AH;
  AT.cv = cv; AT.c = cv.getContext('2d'); AT.px = 8; AT.py = 8; AT.rowH = 0; AT.sp = {};
  for (let f = 0; f < 4; f++) art('b' + f, 64, 64, 64, 64, (c) => artBlue(c, f));
  for (let f = 0; f < 4; f++) art('r' + f, 64, 64, 64, 64, (c) => artRed(c, f));
  for (let f = 0; f < 4; f++) art('w' + f, 64, 64, 64, 64, (c) => artWolf(c, f));
  for (let f = 0; f < 4; f++) art('s' + f, 64, 64, 64, 64, (c) => artShield(c, f));
  art('soft', 64, 64, 64, 64, artSoft); art('puff', 64, 64, 64, 64, artPuff); art('star', 64, 64, 64, 64, artStar);
  art('streak', 16, 64, 16, 64, artStreak); art('dot', 32, 32, 32, 32, artDot);
  art('hb', 32, 32, 32, 32, (c) => artHelm(c, true)); art('hr', 32, 32, 32, 32, (c) => artHelm(c, false));
  art('arrow', 16, 80, 16, 80, artArrow); art('bolt', 16, 96, 16, 96, artBolt);
  art('white', 16, 16, 16, 16, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 16, 16); });
  art('curtain', 16, 64, 16, 64, artCurtain); art('icon', 32, 32, 32, 32, artSoldierIcon);
  newRow();
  for (let f = 0; f < 2; f++) { const q = art('br' + f, 156, 128, 156, 128, (c) => { c.translate(8, 0); artBrute(c, f); }); q.ax = 72 / 156; q.ay = 116 / 128; }
  art('ring', 128, 128, 128, 128, artRing); art('ring2', 128, 128, 128, 128, artRingThin); art('disc', 128, 128, 128, 128, artDisc);
  art('postB', 48, 176, 48, 176, (c) => artPost(c, '#3d86ff', '#1b46a8', '#8fe3ff'));
  art('postG', 48, 176, 48, 176, (c) => artPost(c, '#ffd04a', '#b9790f', '#fff6c0'));
  art('postR', 48, 176, 48, 176, (c) => artPost(c, '#f0483a', '#8f1418', '#ffb0a0'));
  art('beamB', 256, 72, 256, 72, (c) => artBeam(c, '#2f7bff', '#7fc0ff', '#1b46b8'));
  art('beamG', 256, 72, 256, 72, (c) => artBeam(c, '#ffc02e', '#fff0a0', '#d48a10'));
  art('beamR', 256, 72, 256, 72, (c) => artBeam(c, '#e8392f', '#ff8a70', '#a01818'));
  art('barrel', 80, 96, 80, 96, artBarrel); art('rock', 64, 64, 64, 64, artRock); art('shell', 48, 48, 48, 48, artShell); art('fire', 96, 96, 96, 96, artFireball);
  art('cask', 80, 96, 80, 96, artCask); art('bowI', 96, 96, 96, 96, artBowIcon); art('cage', 144, 144, 144, 144, artCage); art('saw', 112, 112, 112, 112, artSaw); art('rpost', 32, 96, 32, 96, (c) => artRailPost(c, '#8f1418', '#f0483a', '#fff2b0', '#cf8a14'));
  art('rpostI', 32, 96, 32, 96, (c) => artRailPost(c, '#2b303b', '#98a2b3', '#f4fbff', '#8fa3bd')); art('rpostG', 32, 96, 32, 96, (c) => artRailPost(c, '#17100f', '#5a4644', '#ffd35a', '#e85a10'));
  newRow();
  for (let p = 0; p < 3; p++) { const q = art('gi' + p, 288, 232, 288, 232, (c) => { c.translate(32, 8); artGiant(c, p); }); q.ay = 214 / 232; }
  for (let f = 0; f < 2; f++) { const q = art('he' + f, 216, 256, 216, 256, (c) => { c.translate(8, 66); artHero(c, f); }); q.ax = 104 / 216; q.ay = 242 / 256; }
  art('slash', 256, 256, 256, 256, artSlash);
  art('canBase', 192, 150, 192, 150, artCannonBase); art('canBarrel', 96, 168, 96, 168, artCannonBarrel);
  newRow();
  for (let p = 0; p < 3; p++) { const q = art('bo' + p, 496, 400, 496, 400, (c) => { c.translate(56, 16); artBoss(c, p); }); q.ay = 372 / 400; }
  art('dgH', 200, 224, 200, 224, artDragonHead).ay = 0.6; art('dgB', 128, 128, 128, 128, artDragonBody).ay = 0.5;
  art('ped', 176, 120, 176, 120, artPed); art('ballista', 176, 176, 176, 176, artBallista); art('mortar', 176, 176, 176, 176, artMortar); art('sluice', 176, 176, 176, 176, artSluice);
  newRow();
  artGlyphs();
  return cv;
}
