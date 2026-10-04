/* ===== 40-terrain: 每關開場把地形（山脊道路、懸崖、敵城、我方城牆）預先畫成一張底圖 ===== */
const THEMES = [
  { // 青草關：海上的草原山脊
    abyss: ['#a9def7', '#4f9fe0', '#1d62b3'], road: '#dcbb80', roadFar: '#e6d2a6', band: 'rgba(120,80,30,.07)',
    plaza: '#cfc3a2', rim: '#7ccb49', rimDk: '#4f9c2e', cliffT: '#a89a84', cliffB: '#5c5347', fade: '31,98,170',
    fort: ['#9aa0ae', '#666b79', '#3f424d'], deco: 0, sky: 'sea'
  },
  { // 黃沙谷：峽谷上的砂岩台地
    abyss: ['#f6d59b', '#d58f4c', '#8b4a23'], road: '#ecd096', roadFar: '#f3e0b4', band: 'rgba(150,90,30,.08)',
    plaza: '#dcc79a', rim: '#d99a55', rimDk: '#a9682f', cliffT: '#cf8244', cliffB: '#6f3519', fade: '120,58,24',
    fort: ['#b08a62', '#7b5a3c', '#4a3322'], deco: 1, sky: 'dune'
  },
  { // 霜雪嶺：冰海上的雪稜
    abyss: ['#e3f4fb', '#8cc3de', '#3b789f'], road: '#edf3f8', roadFar: '#f7fbff', band: 'rgba(90,130,170,.09)',
    plaza: '#dbe4ec', rim: '#ffffff', rimDk: '#a9c7dc', cliffT: '#9bb2c8', cliffB: '#465c74', fade: '48,104,146',
    fort: ['#9fb0c2', '#667789', '#3c4856'], deco: 2, sky: 'ice'
  },
  { // 熔岩道：岩漿湖上的玄武岩
    abyss: ['#8a2408', '#e85a10', '#ffb030'], road: '#62514e', roadFar: '#7a625c', band: 'rgba(0,0,0,.10)',
    plaza: '#6d5f5c', rim: '#3a2c2a', rimDk: '#1e1514', cliffT: '#4a3532', cliffB: '#170c0b', fade: '255,120,20',
    fort: ['#5a4644', '#3a2a29', '#1f1514'], deco: 3, sky: 'lava'
  },
  { // 魔王城：紫色虛空
    abyss: ['#3a1a5e', '#22104a', '#0c0520'], road: '#73668a', roadFar: '#8a7ba6', band: 'rgba(20,0,40,.12)',
    plaza: '#7d7092', rim: '#43345a', rimDk: '#261a38', cliffT: '#57466e', cliffB: '#170d24', fade: '30,12,60',
    fort: ['#4d4162', '#2e2540', '#17111f'], deco: 4, sky: 'void'
  }
];
function mkRng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t));
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

function paintAbyss(c, T, rs) {
  const W = V.W, H = V.H, u = V.u;
  c.fillStyle = lg(c, 0, 0, 0, H, [0, T.abyss[0], 0.45, T.abyss[1], 1, T.abyss[2]]); c.fillRect(0, 0, W, H);
  const N = 220;
  if (T.sky === 'sea') {
    for (let i = 0; i < N; i++) {
      const y = rs() * H, s = (0.35 + 0.9 * y / H) * u, x = rs() * W, w = (10 + rs() * 26) * s;
      c.strokeStyle = 'rgba(255,255,255,' + (0.10 + rs() * 0.2) + ')'; c.lineWidth = 1.6 * s;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 3 * s, x + w, y); c.stroke();
    }
    for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(255,255,255,.10)'; ell(c, rs() * W, rs() * H, (40 + rs() * 60) * u, (10 + rs() * 12) * u); c.fill(); }
  } else if (T.sky === 'dune') {
    for (let i = 0; i < 90; i++) {
      const y = rs() * H, s = (0.4 + 0.9 * y / H) * u, x = rs() * W - 60 * u, w = (60 + rs() * 120) * s;
      c.strokeStyle = (rs() < 0.5 ? 'rgba(255,230,170,' : 'rgba(90,40,10,') + (0.10 + rs() * 0.14) + ')'; c.lineWidth = (2 + rs() * 3) * s;
      c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + w * 0.3, y - 10 * s, x + w * 0.6, y + 10 * s, x + w, y - 2 * s); c.stroke();
    }
  } else if (T.sky === 'ice') {
    for (let i = 0; i < 70; i++) {
      const y = rs() * H, s = (0.4 + 0.9 * y / H) * u, x = rs() * W, r = (8 + rs() * 26) * s;
      c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + rs() * 0.5, rr2 = r * (0.7 + rs() * 0.5); c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2 * 0.5); } c.closePath();
      c.fillStyle = 'rgba(255,255,255,' + (0.25 + rs() * 0.3) + ')'; c.fill(); c.strokeStyle = 'rgba(40,90,130,.18)'; c.lineWidth = 1.2 * s; c.stroke();
    }
  } else if (T.sky === 'lava') {
    for (let i = 0; i < 110; i++) {
      const y = rs() * H, s = (0.4 + 0.9 * y / H) * u, x = rs() * W, r = (12 + rs() * 34) * s;
      c.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + rs() * 0.4, rr2 = r * (0.65 + rs() * 0.5); c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2 * 0.55); } c.closePath();
      c.fillStyle = 'rgba(38,14,8,' + (0.55 + rs() * 0.35) + ')'; c.fill();
    }
    for (let i = 0; i < 26; i++) { c.fillStyle = 'rgba(255,230,120,.16)'; ell(c, rs() * W, rs() * H, (20 + rs() * 50) * u, (8 + rs() * 16) * u); c.fill(); }
  } else {
    for (let i = 0; i < 16; i++) { const x = rs() * W, y = rs() * H, r = (60 + rs() * 120) * u; c.fillStyle = rg(c, x, y, 0, r, [0, (rs() < 0.5 ? 'rgba(170,70,220,' : 'rgba(230,60,140,') + '.20)', 1, 'rgba(120,40,200,0)']); c.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 120; i++) { c.fillStyle = 'rgba(255,220,255,' + (0.2 + rs() * 0.5) + ')'; const s = (0.6 + rs() * 1.4) * u; c.fillRect(rs() * W, rs() * H, s, s); }
    for (let i = 0; i < 7; i++) {
      let x = rs() * W, y = rs() * H * 0.9; c.strokeStyle = 'rgba(255,120,255,.35)'; c.lineWidth = 1.4 * u; c.beginPath(); c.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (rs() - 0.5) * 50 * u; y += (10 + rs() * 22) * u; c.lineTo(x, y); } c.stroke();
    }
  }
}

function paintDeco(c, kind, x, y, s, rs) {
  // 岩柱頂上的小擺設，s = 該處每世界單位的像素
  if (kind === 0) {           // 樹
    c.fillStyle = '#6b4a2a'; c.fillRect(x - 0.18 * s, y - 1.5 * s, 0.36 * s, 1.5 * s);
    for (const p of [[0, -2.3, 1.15], [-0.7, -1.7, 0.85], [0.7, -1.75, 0.85]]) { ell(c, x + p[0] * s, y + p[1] * s, p[2] * s, p[2] * s * 0.92); fs(c, '#3f9a36', '#1f5c22', 0.12 * s); }
    ell(c, x - 0.3 * s, y - 2.6 * s, 0.45 * s, 0.35 * s); fs(c, 'rgba(190,240,140,.6)');
  } else if (kind === 1) {    // 砂岩
    poly(c, [x - 1.1 * s, y, x - 0.8 * s, y - 1.5 * s, x + 0.1 * s, y - 2.1 * s, x + 0.9 * s, y - 1.2 * s, x + 1.1 * s, y]); fs(c, '#d08a4a', '#6f3519', 0.12 * s);
    c.strokeStyle = 'rgba(90,40,10,.4)'; c.lineWidth = 0.1 * s; c.beginPath(); c.moveTo(x - 0.9 * s, y - 0.8 * s); c.lineTo(x + 1 * s, y - 0.7 * s); c.stroke();
  } else if (kind === 2) {    // 雪松
    c.fillStyle = '#5a4030'; c.fillRect(x - 0.15 * s, y - 0.8 * s, 0.3 * s, 0.8 * s);
    for (let k = 0; k < 3; k++) { const w = (1.2 - k * 0.3) * s, yy = y - (0.7 + k * 0.85) * s; poly(c, [x - w, yy, x, yy - 1.3 * s, x + w, yy]); fs(c, '#2f6f5e', '#173d34', 0.1 * s); poly(c, [x - w * 0.55, yy - 0.55 * s, x, yy - 1.3 * s, x + w * 0.55, yy - 0.55 * s]); fs(c, '#f4fbff'); }
  } else if (kind === 3) {    // 火晶
    c.fillStyle = rg(c, x, y - 1 * s, 0, 2.6 * s, [0, 'rgba(255,170,50,.55)', 1, 'rgba(255,120,20,0)']); c.fillRect(x - 3 * s, y - 4 * s, 6 * s, 6 * s);
    poly(c, [x - 0.7 * s, y, x - 0.3 * s, y - 2.2 * s, x + 0.3 * s, y - 1.4 * s, x + 0.8 * s, y]); fs(c, '#ffb23c', '#7a2a08', 0.12 * s);
    poly(c, [x + 0.2 * s, y, x + 0.7 * s, y - 1.5 * s, x + 1.2 * s, y]); fs(c, '#ff7a1a', '#7a2a08', 0.12 * s);
  } else {                    // 符文碑
    c.fillStyle = rg(c, x, y - 1.4 * s, 0, 2.6 * s, [0, 'rgba(255,90,230,.45)', 1, 'rgba(200,60,255,0)']); c.fillRect(x - 3 * s, y - 4.4 * s, 6 * s, 6 * s);
    poly(c, [x - 0.6 * s, y, x - 0.45 * s, y - 2.4 * s, x, y - 3 * s, x + 0.45 * s, y - 2.4 * s, x + 0.6 * s, y]); fs(c, '#2c2040', '#0e0818', 0.12 * s);
    c.strokeStyle = '#ff7af0'; c.lineWidth = 0.14 * s; c.beginPath(); c.moveTo(x, y - 2.3 * s); c.lineTo(x, y - 0.8 * s); c.moveTo(x - 0.25 * s, y - 1.7 * s); c.lineTo(x + 0.25 * s, y - 1.7 * s); c.stroke();
  }
}

function paintFort(c, T, ruined) {
  P(rcx(L), L); const X = PX, Y = PY, U = PS, ky = V.ky, half = rhw(L) + 1.5;
  const A = T.fort[0], B = T.fort[1], D = T.fort[2];
  const ink = 'rgba(10,6,14,.85)', lw = Math.max(1, 0.16 * U);
  // 主堡
  if (!ruined) {
    const kw = 7.5 * U, kh = 12.5 * U * ky;
    c.beginPath(); c.rect(X - kw, Y - kh, kw * 2, kh); fs(c, lg(c, 0, Y - kh, 0, Y, [0, B, 1, D]), ink, lw);
    for (let k = -3; k <= 3; k++) { const mx = X + k * 2.1 * U; c.beginPath(); c.rect(mx - 0.75 * U, Y - kh - 1.1 * U, 1.5 * U, 1.2 * U); fs(c, B, ink, lw); }
    poly(c, [X - 3.2 * U, Y - kh - 1 * U, X, Y - kh - 5.2 * U, X + 3.2 * U, Y - kh - 1 * U]); fs(c, '#b3221f', ink, lw);
    c.strokeStyle = '#5a3a20'; c.lineWidth = lw; c.beginPath(); c.moveTo(X, Y - kh - 5.2 * U); c.lineTo(X, Y - kh - 8 * U); c.stroke();
    poly(c, [X, Y - kh - 8 * U, X + 2.6 * U, Y - kh - 7.2 * U, X, Y - kh - 6.3 * U]); fs(c, '#ee3b30', ink, lw * 0.7);
    for (const k of [-1, 1]) { c.fillStyle = 'rgba(255,170,60,.9)'; rrect(c, X + k * 3.4 * U - 0.6 * U, Y - kh * 0.72, 1.2 * U, 1.9 * U, 0.6 * U); c.fill(); }
  }
  // 城牆
  const wh = 6.4 * U * ky, x0 = X - half * U, x1 = X + half * U;
  if (ruined) {
    c.beginPath(); c.moveTo(x0, Y + 2); c.lineTo(x0, Y - wh);
    const step = (x1 - x0) / 26;
    for (let k = 1; k < 26; k++) { const xx = x0 + k * step, d = Math.abs(k - 13) / 13; const hh = wh * (0.25 + 0.75 * Math.min(1, d * 1.5)) * (0.75 + 0.5 * ((k * 7919) % 13) / 13); c.lineTo(xx, Y - Math.min(wh, hh)); }
    c.lineTo(x1, Y - wh); c.lineTo(x1, Y + 2); c.closePath(); fs(c, lg(c, 0, Y - wh, 0, Y, [0, B, 1, D]), ink, lw);
    c.fillStyle = 'rgba(0,0,0,.55)'; ell(c, X, Y - 0.6 * U, 6 * U, 2.2 * U); c.fill();
    for (let k = 0; k < 14; k++) { const xx = X + (((k * 37) % 17) - 8) * 0.9 * U, yy = Y - ((k * 53) % 7) * 0.25 * U; poly(c, [xx - 0.8 * U, yy, xx - 0.3 * U, yy - 0.9 * U, xx + 0.6 * U, yy - 0.7 * U, xx + 0.9 * U, yy]); fs(c, A, ink, lw * 0.7); }
    c.fillStyle = rg(c, X, Y - 2 * U, 0, 9 * U, [0, 'rgba(255,150,40,.55)', 1, 'rgba(255,90,20,0)']); c.fillRect(X - 9 * U, Y - 11 * U, 18 * U, 12 * U);
    return;
  }
  c.beginPath(); c.rect(x0, Y - wh, x1 - x0, wh + 2); fs(c, lg(c, 0, Y - wh, 0, Y, [0, A, 0.6, B, 1, D]), ink, lw);
  c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = lw * 0.6;
  for (let r = 1; r < 5; r++) { c.beginPath(); c.moveTo(x0, Y - wh * r / 5); c.lineTo(x1, Y - wh * r / 5); c.stroke(); }
  const nm = Math.floor((x1 - x0) / (1.9 * U));
  for (let k = 0; k <= nm; k++) { const mx = x0 + (x1 - x0) * k / nm; c.beginPath(); c.rect(mx - 0.55 * U, Y - wh - 1 * U, 1.1 * U, 1.1 * U); fs(c, A, ink, lw * 0.8); }
  // 塔樓
  for (const sd of [-1, 1]) {
    const tx = X + sd * 8.6 * U, tw = 2.9 * U, th = 10.6 * U * ky;
    c.beginPath(); c.rect(tx - tw, Y - th, tw * 2, th + 2); fs(c, lg(c, tx - tw, 0, tx + tw, 0, [0, D, 0.4, A, 1, B]), ink, lw);
    for (let k = -1; k <= 1; k++) { c.beginPath(); c.rect(tx + k * 2 * U - 0.7 * U, Y - th - 1.1 * U, 1.4 * U, 1.2 * U); fs(c, A, ink, lw * 0.8); }
    poly(c, [tx - tw * 1.05, Y - th - 1 * U, tx, Y - th - 5 * U, tx + tw * 1.05, Y - th - 1 * U]); fs(c, '#b3221f', ink, lw);
    c.fillStyle = 'rgba(255,170,60,.9)'; rrect(c, tx - 0.55 * U, Y - th * 0.7, 1.1 * U, 1.9 * U, 0.55 * U); c.fill();
    c.strokeStyle = '#5a3a20'; c.lineWidth = lw; c.beginPath(); c.moveTo(tx, Y - th - 5 * U); c.lineTo(tx, Y - th - 7.4 * U); c.stroke();
    poly(c, [tx, Y - th - 7.4 * U, tx + sd * 2.3 * U, Y - th - 6.7 * U, tx, Y - th - 5.9 * U]); fs(c, '#ee3b30', ink, lw * 0.7);
  }
  // 掛在城牆上的赤潮軍旗
  for (const sd of [-1, 1]) {
    for (const off of [4.9, 12.6, 16.4]) {
      const bx = X + sd * off * U, bw = 0.85 * U, top = Y - wh * 0.93, bot = Y - wh * 0.2;
      poly(c, [bx - bw, top, bx + bw, top, bx + bw, bot, bx, bot - 0.9 * U, bx - bw, bot]); fs(c, '#d8281f', ink, lw * 0.7);
      c.strokeStyle = '#ffd9a0'; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(bx - 0.5 * U, top + 1.1 * U); c.lineTo(bx, top + 2.1 * U); c.lineTo(bx + 0.5 * U, top + 1.1 * U); c.stroke();
    }
  }
  // 城門
  const gw = 3.4 * U, gh = 5.2 * U * ky;
  c.fillStyle = rg(c, X, Y - gh * 0.4, 0, 8 * U, [0, 'rgba(255,90,50,.55)', 1, 'rgba(255,60,30,0)']); c.fillRect(X - 8 * U, Y - 9 * U, 16 * U, 10 * U);
  c.beginPath(); c.moveTo(X - gw, Y + 2); c.lineTo(X - gw, Y - gh * 0.55); c.quadraticCurveTo(X - gw, Y - gh, X, Y - gh); c.quadraticCurveTo(X + gw, Y - gh, X + gw, Y - gh * 0.55); c.lineTo(X + gw, Y + 2); c.closePath();
  fs(c, lg(c, 0, Y - gh, 0, Y, [0, '#2a0808', 1, '#b3221f']), ink, lw * 1.3);
  c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = lw * 0.8; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(X + k * 1.1 * U, Y - gh * 0.9); c.lineTo(X + k * 1.1 * U, Y); c.stroke(); }
  // 主堡上的角盔徽記
  const ey = Y - 10.2 * U * ky, er = 1.5 * U;
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(X + sd * er * 0.7, ey - er * 0.5); c.quadraticCurveTo(X + sd * er * 2.5, ey - er * 0.7, X + sd * er * 2.2, ey - er * 2.3); c.quadraticCurveTo(X + sd * er * 1.5, ey - er * 1.2, X + sd * er * 0.2, ey - er * 0.95); c.closePath(); fs(c, '#f3e6c4', ink, lw * 0.8); }
  ell(c, X, ey, er, er * 0.95); fs(c, '#d8281f', ink, lw);
  c.fillStyle = '#ffe14d'; poly(c, [X - er * 0.7, ey - er * 0.25, X - er * 0.12, ey + er * 0.08, X - er * 0.6, ey + er * 0.3]); c.fill(); poly(c, [X + er * 0.7, ey - er * 0.25, X + er * 0.12, ey + er * 0.08, X + er * 0.6, ey + er * 0.3]); c.fill();
}

function renderTerrain(lv, ruined) {
  const W = V.W, H = V.H, T = THEMES[lv.theme], u = V.u, ky = V.ky;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'); c.lineJoin = 'round'; c.lineCap = 'round';
  const rs = mkRng(4242 + lv.theme * 99);
  paintAbyss(c, T, rs);

  // 道路邊緣取樣
  const n = RN, xl = new Float32Array(n), xr = new Float32Array(n), yy = new Float32Array(n), sc = new Float32Array(n);
  let iF = 0;
  for (let i = 0; i < n; i++) {
    const z = ZMIN + i * RDZ; P(roadCx[i], z); const hwp = roadHw[i] * PS;
    xl[i] = PX - hwp; xr[i] = PX + hwp; yy[i] = PY; sc[i] = PS;
    if (z <= L + 3.5) iF = i;
  }
  // 岩柱：先決定位置，之後跟懸崖一起由遠到近畫
  const pillars = [];
  for (let tries = 0; tries < 260 && pillars.length < 16; tries++) {
    const z = 4 + rs() * 92, r = 1.6 + rs() * 2.6, side = rs() < 0.5 ? -1 : 1;
    const edge = rcx(z) + side * (rhw(z) + 2.5 + r + rs() * 9);
    P(edge, z); if (PX < -r * PS * 0.3 || PX > W + r * PS * 0.3) continue;
    let ok = true;
    for (let dz = -r - 2; dz <= r + 2; dz += 1) { if (Math.abs(edge - rcx(z + dz)) < rhw(z + dz) + r + 1.5) { ok = false; break; } }
    for (const p of pillars) if (Math.abs(p.z - z) < 7 && Math.abs(p.x - edge) < p.r + r + 2) ok = false;
    if (ok) pillars.push({ x: edge, z, r, drop: rs() * 5, deco: rs() < 0.75 });
  }
  pillars.sort((a, b) => b.z - a.z);
  let pi = 0;
  const CH = 26;                       // 懸崖高度（世界單位）
  const drawPillar = (p) => {
    P(p.x, p.z); const s = PS, cy = PY + p.drop * s * ky, rx = p.r * s, ry = p.r * s * V.q0 * (PS / V.s0), h = CH * 0.8 * s;
    c.beginPath(); c.moveTo(p.x * 0 + PX - rx, cy); c.lineTo(PX - rx * 0.7, cy + h); c.lineTo(PX + rx * 0.7, cy + h); c.lineTo(PX + rx, cy); c.closePath();
    c.fillStyle = lg(c, 0, cy, 0, cy + h, [0, T.cliffT, 0.5, T.cliffB, 1, 'rgba(' + T.fade + ',0)']); c.fill();
    c.fillStyle = lg(c, PX - rx, 0, PX + rx, 0, [0, 'rgba(255,255,255,.14)', 0.5, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,.28)']); c.fill();
    ell(c, PX, cy, rx, ry); fs(c, T.rim, T.rimDk, Math.max(1, 0.12 * s));
    if (p.deco) paintDeco(c, T.deco, PX, cy, s, rs);
  };
  // 懸崖：由遠到近，一片一片往下掛
  for (let i = iF - 1; i >= 0; i--) {
    const z = ZMIN + i * RDZ;
    while (pi < pillars.length && pillars[pi].z >= z) drawPillar(pillars[pi++]);
    const fogT = clamp(z / L, 0, 1) * 0.35;
    const top = mixHex(T.cliffT, T.abyss[0], fogT), bot = mixHex(T.cliffB, T.abyss[0], fogT * 0.6);
    for (let sd = 0; sd < 2; sd++) {
      const xa = sd ? xr[i] : xl[i], xb = sd ? xr[i + 1] : xl[i + 1];
      const out = sd ? xa - xb : xb - xa;           // >0 表示這一段崖面朝向鏡頭
      if (out < 0.02 && i > 4) continue;
      const da = CH * sc[i] * ky, db = CH * sc[i + 1] * ky;
      c.beginPath(); c.moveTo(xb, yy[i + 1]); c.lineTo(xa, yy[i]); c.lineTo(xa, yy[i] + da); c.lineTo(xb, yy[i + 1] + db); c.closePath();
      c.fillStyle = lg(c, 0, yy[i], 0, yy[i] + da, [0, top, 0.55, bot, 1, 'rgba(' + T.fade + ',0)']); c.fill();
      c.fillStyle = sd ? 'rgba(0,0,0,.20)' : 'rgba(255,255,255,.07)'; c.fill();
      c.strokeStyle = 'rgba(0,0,0,.10)'; c.lineWidth = Math.max(0.6, 0.08 * sc[i]);
      for (const f of [0.12, 0.3, 0.52]) { c.beginPath(); c.moveTo(xb, yy[i + 1] + db * f); c.lineTo(xa, yy[i] + da * f); c.stroke(); }
    }
  }
  while (pi < pillars.length) drawPillar(pillars[pi++]);

  // 路面
  const pathRoad = (i0, i1, inset) => {
    c.beginPath();
    for (let i = i0; i <= i1; i++) { const x = xl[i] + inset * sc[i]; if (i === i0) c.moveTo(x, yy[i]); else c.lineTo(x, yy[i]); }
    for (let i = i1; i >= i0; i--) c.lineTo(xr[i] - inset * sc[i], yy[i]);
    c.closePath();
  };
  pathRoad(0, iF, 0); c.fillStyle = T.rim; c.fill();
  c.strokeStyle = T.rimDk; c.lineWidth = Math.max(1, 1.2 * u); c.stroke();
  pathRoad(0, iF, 0.85); c.fillStyle = lg(c, 0, V.y0, 0, V.yT, [0, T.road, 1, T.roadFar]); c.fill();
  c.save(); c.clip();
  // 橫向色帶，給一點縱深感
  for (let z = -14; z < L + 4; z += 3) {
    P(0, z); const ya = PY; P(0, z + 1.5); c.fillStyle = T.band; c.fillRect(0, PY, W, ya - PY);
  }
  // 前庭鋪石
  const iP = Math.round((24 - ZMIN) / RDZ), iP2 = Math.round((31 - ZMIN) / RDZ);
  P(0, 24); const yP = PY; P(0, 31); const yP2 = PY;
  c.fillStyle = lg(c, 0, yP, 0, yP2, [0, T.plaza, 1, 'rgba(0,0,0,0)']); c.globalAlpha = 0.9;
  c.fillRect(0, yP2, W, H - yP2); c.globalAlpha = 1;
  c.strokeStyle = 'rgba(0,0,0,.09)'; c.lineWidth = Math.max(1, 1.1 * u);
  for (let z = 3; z <= 24; z += 3) { P(0, z); c.beginPath(); c.moveTo(0, PY); c.lineTo(W, PY); c.stroke(); }
  for (let x = -12; x <= 12; x += 3) { P(x, 0); const ax = PX, ay = PY; P(x, 24); c.beginPath(); c.moveTo(ax, ay); c.lineTo(PX, PY); c.stroke(); }
  // 碎石斑點
  for (let k = 0; k < 520; k++) {
    const z = -6 + rs() * (L + 8), t = rs() * 2 - 1; P(rcx(z) + t * (rhw(z) - 1), z);
    const r = (0.12 + rs() * 0.3) * PS;
    c.fillStyle = rs() < 0.5 ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.16)'; ell(c, PX, PY, r, r * 0.6); c.fill();
  }
  c.restore();
  // 路緣內側的陰影線
  c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = Math.max(1, 1 * u); pathRoad(0, iF, 0.85); c.stroke();

  // 路緣裝飾（貼著邊，矮矮的不擋兵）
  for (let k = 0; k < 90; k++) {
    const z = 2 + rs() * (L - 6), sd = rs() < 0.5 ? -1 : 1; P(rcx(z) + sd * (rhw(z) - 0.42), z);
    const s = PS;
    if (T.deco === 0) { c.fillStyle = rs() < 0.5 ? '#5fb53a' : '#8fdc5a'; for (let j = -1; j <= 1; j++) { poly(c, [PX + j * 0.16 * s - 0.09 * s, PY, PX + j * 0.2 * s, PY - 0.45 * s, PX + j * 0.16 * s + 0.09 * s, PY]); c.fill(); } }
    else if (T.deco === 2) { ell(c, PX, PY - 0.1 * s, 0.38 * s, 0.2 * s); fs(c, '#ffffff'); }
    else { poly(c, [PX - 0.3 * s, PY, PX - 0.12 * s, PY - 0.34 * s, PX + 0.22 * s, PY - 0.26 * s, PX + 0.32 * s, PY]); fs(c, T.deco === 3 ? '#2a1c1a' : T.deco === 4 ? '#3a2c50' : '#c98a4a', 'rgba(0,0,0,.35)', Math.max(0.6, 0.05 * s)); }
  }
  if (T.deco === 3 || T.deco === 4) {   // 發光裂紋
    for (let k = 0; k < 46; k++) {
      const z = 26 + rs() * (L - 30), t = rs() * 1.8 - 0.9; P(rcx(z) + t * (rhw(z) - 1), z); const s = PS;
      c.strokeStyle = T.deco === 3 ? 'rgba(255,150,40,.7)' : 'rgba(255,110,240,.55)'; c.lineWidth = Math.max(0.8, 0.09 * s);
      let x = PX, y = PY; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (rs() - 0.5) * 1.2 * s; y += (rs() - 0.3) * 0.5 * s; c.lineTo(x, y); } c.stroke();
    }
  }

  paintFort(c, T, ruined);

  // 我方本陣（城牆後面）與兵砲軌道
  {
    P(0, -1.2); const yb = PY;
    c.save(); pathRoad(0, Math.round((-1.2 - ZMIN) / RDZ), 0.85); c.clip();
    c.fillStyle = 'rgba(24,34,70,.34)'; c.fillRect(0, yb, W, H - yb);
    for (const dz of [-0.75, 0.75]) { P(-CAN_LIM - 1.6, CANZ + dz); const ax = PX, ay = PY; P(CAN_LIM + 1.6, CANZ + dz); c.strokeStyle = '#2a3046'; c.lineWidth = 0.34 * PS; c.beginPath(); c.moveTo(ax, ay); c.lineTo(PX, PY); c.stroke(); c.strokeStyle = '#8d97b0'; c.lineWidth = 0.1 * PS; c.stroke(); }
    c.strokeStyle = '#4a3320'; for (let x = -CAN_LIM - 1.2; x <= CAN_LIM + 1.2; x += 1.3) { P(x, CANZ - 1.05); const ax = PX, ay = PY; P(x, CANZ + 1.05); c.lineWidth = 0.3 * PS; c.beginPath(); c.moveTo(ax, ay); c.lineTo(PX, PY); c.stroke(); }
    for (const dz of [-0.75, 0.75]) { P(-CAN_LIM - 1.6, CANZ + dz); const ax = PX, ay = PY; P(CAN_LIM + 1.6, CANZ + dz); c.strokeStyle = '#2a3046'; c.lineWidth = 0.3 * PS; c.beginPath(); c.moveTo(ax, ay); c.lineTo(PX, PY); c.stroke(); c.strokeStyle = '#a9b4cc'; c.lineWidth = 0.09 * PS; c.stroke(); }
    c.restore();
  }
  // 我方城牆（z=0）：頂面、朝我方的牆面、城垛
  {
    const hw = PLAZA_HW + 0.35, wallH = 1.5;
    P(-hw, 0); const fx0 = PX, fy = PY, fs0 = PS; P(hw, 0); const fx1 = PX;
    P(-hw, -1.15); const nx0 = PX, ny = PY, ns = PS; P(hw, -1.15); const nx1 = PX;
    const fTop = fy - wallH * fs0 * ky, nTop = ny - wallH * ns * ky;
    poly(c, [nx0, nTop, nx1, nTop, nx1, ny, nx0, ny]); fs(c, lg(c, 0, nTop, 0, ny, [0, '#7b88a8', 1, '#4a5676']), '#1b2238', Math.max(1, 1.6 * u));
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = Math.max(1, 1 * u);
    for (let x = -11; x <= 11; x += 2) { P(x, -1.15); c.beginPath(); c.moveTo(PX, nTop + (ny - nTop) * 0.1); c.lineTo(PX, ny); c.stroke(); }
    for (let x = -9; x <= 9; x += 4.5) {
      P(x, -1.15); const bw = 0.95 * PS;
      poly(c, [PX - bw, nTop + 0.05 * PS, PX + bw, nTop + 0.05 * PS, PX + bw, ny - 0.28 * PS, PX, ny - 0.02 * PS, PX - bw, ny - 0.28 * PS]); fs(c, PAL.blue, PAL.blueInk, Math.max(1, 1.2 * u));
      ell(c, PX, nTop + (ny - nTop) * 0.42, 0.34 * PS, 0.34 * PS); fs(c, PAL.gold, PAL.goldInk, Math.max(0.8, 0.9 * u));
    }
    poly(c, [fx0, fTop, fx1, fTop, nx1, nTop, nx0, nTop]); fs(c, '#b3bdd4', '#1b2238', Math.max(1, 1.6 * u));
    for (let x = -hw + 0.6; x < hw - 0.3; x += 1.9) {
      P(x, 0); const ax = PX, s = PS; P(x + 1.05, 0); const bx = PX;
      const t0 = fy - (wallH + 0.75) * s * ky, t1 = fy - wallH * s * ky;
      poly(c, [ax, t0, bx, t0, bx, t1 + 0.5 * s, ax, t1 + 0.5 * s]); fs(c, lg(c, 0, t0, 0, t1 + 0.5 * s, [0, '#c5cee2', 1, '#8b97b3']), '#1b2238', Math.max(1, 1.3 * u));
    }
  }
  return cv;
}
