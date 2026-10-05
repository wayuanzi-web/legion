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
  },
  { // 5 長虹橋：朝霞下的跨海石橋（行軍關的主題多了 deck／rail／arch 這幾組顏色）
    abyss: ['#ffe2b8', '#62bcd6', '#1c68a8'], fade: '28,104,168', fort: ['#a9a69c', '#77746c', '#46443f'], deco: 0, sky: 'sea',
    deck: ['#ddd5c0', '#c2b9a2'], curb: '#8b8270', lane: 'rgba(255,255,255,.16)', seam: [70, 58, 36, 46], rail: '#d23a2e', railDk: '#7a1712',
    arch: ['#c8372c', '#2f8a7a', '#56606e', '#ffd35a'], islet: ['#8fd45a', '#57a332', '#a89a84', '#5c5347'], foam: [255, 255, 255, 60], seamGap: 4, post: 'rpost'
  },
  { // 6 連環寨：雲海上的楓紅山脊
    abyss: ['#fff3da', '#f3c88f', '#c9773f'], road: '#e3cfa6', roadFar: '#efe0c2', band: 'rgba(140,80,30,.07)',
    plaza: '#d8c6a2', rim: '#e58a3c', rimDk: '#a8521c', cliffT: '#b08a66', cliffB: '#5a3f2c', fade: '176,96,44',
    fort: ['#a39a8c', '#6f675c', '#433d36'], deco: 5, sky: 'mist'
  },
  { // 7 寒江鐵索橋：夜裡的木板吊橋
    abyss: ['#33507e', '#1c3560', '#0a1730'], fade: '14,30,60', fort: ['#8794a8', '#566174', '#333b49'], deco: 2, sky: 'sea',
    deck: ['#9c7c58', '#7b5f44'], curb: '#463524', lane: 'rgba(255,255,255,.06)', seam: [30, 18, 8, 105], rail: '#aab3c2', railDk: '#2b303b',
    arch: ['#5a4634', '#4a5568', '#2f3a48', '#d9e4f2'], islet: ['#f4fbff', '#a9c7dc', '#9bb2c8', '#465c74'], foam: [200, 225, 255, 46], seamGap: 2, post: 'rpostI', snow: true
  },
  { // 8 水淹七軍：雨中的河谷
    abyss: ['#86a2ad', '#3e6478', '#16303f'], road: '#9aa39c', roadFar: '#b6beb6', band: 'rgba(20,40,50,.09)',
    plaza: '#909b97', rim: '#6f9a62', rimDk: '#3f6a3c', cliffT: '#6f7f84', cliffB: '#2c3a40', fade: '30,60,80',
    fort: ['#7d8894', '#525c66', '#2f363d'], deco: 6, sky: 'river'
  },
  { // 9 赤龍橋：岩漿湖上的黑曜石橋
    abyss: ['#8a2408', '#e85a10', '#ffb030'], fade: '255,120,20', fort: ['#5a4644', '#3a2a29', '#1f1514'], deco: 3, sky: 'lava',
    deck: ['#5c4f55', '#463b41'], curb: '#231a1c', lane: 'rgba(255,170,70,.10)', seam: [0, 0, 0, 96], rail: '#ffb23c', railDk: '#7a2a08',
    arch: ['#2a2024', '#8a1a14', '#1c1416', '#ffb23c'], islet: ['#4a3836', '#1e1514', '#4a3532', '#170c0b'], foam: [255, 205, 100, 80], seamGap: 4, post: 'rpostG'
  }
];
function mkRng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t));
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

function paintAbyss(c, T, rs, plain) {
  const W = V.W, H = V.H, u = V.u;
  c.fillStyle = lg(c, 0, 0, 0, H, [0, T.abyss[0], 0.45, T.abyss[1], 1, T.abyss[2]]); c.fillRect(0, 0, W, H);
  if (plain) {
    for (let i = 0; i < 14; i++) { const x = rs() * W, y = rs() * H, r = (70 + rs() * 130) * u; c.fillStyle = rg(c, x, y, 0, r, [0, 'rgba(255,255,255,.07)', 1, 'rgba(255,255,255,0)']); c.fillRect(x - r, y - r, r * 2, r * 2); }
    return;
  }
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
  } else if (T.sky === 'mist') {
    // 雲海：一團一團的雲
    for (let i = 0; i < 60; i++) {
      const y = rs() * H, s = (0.45 + 0.9 * y / H) * u, x = rs() * W, w = (40 + rs() * 90) * s, h = w * (0.2 + rs() * 0.12);
      c.fillStyle = 'rgba(255,255,255,' + (0.10 + rs() * 0.16) + ')';
      for (let k = 0; k < 4; k++) { ell(c, x + (k - 1.5) * w * 0.34, y + (k & 1 ? -h * 0.3 : 0), w * (0.3 + rs() * 0.14), h * (0.7 + rs() * 0.4)); c.fill(); }
    }
  } else if (T.sky === 'river') {
    // 河水：順流的白線
    for (let i = 0; i < 150; i++) {
      const y = rs() * H, s = (0.4 + 0.9 * y / H) * u, x = rs() * W - 40 * u, w = (30 + rs() * 90) * s;
      c.strokeStyle = 'rgba(220,240,250,' + (0.06 + rs() * 0.14) + ')'; c.lineWidth = (1 + rs() * 1.6) * s;
      c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + w * 0.3, y - 5 * s, x + w * 0.6, y + 5 * s, x + w, y - 1 * s); c.stroke();
    }
    for (let i = 0; i < 12; i++) { const x = rs() * W, y = rs() * H, r = (50 + rs() * 90) * u; c.fillStyle = rg(c, x, y, 0, r, [0, 'rgba(10,25,35,.22)', 1, 'rgba(10,25,35,0)']); c.fillRect(x - r, y - r, r * 2, r * 2); }
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
  } else if (kind === 5) {    // 楓樹
    c.fillStyle = '#5a3a22'; c.fillRect(x - 0.17 * s, y - 1.5 * s, 0.34 * s, 1.5 * s);
    const cols = ['#e8452c', '#f08a2a', '#f4b63a'];
    for (const p of [[0, -2.3, 1.15, 0], [-0.75, -1.75, 0.85, 1], [0.7, -1.8, 0.9, 2], [0.1, -1.5, 0.7, 0]]) { ell(c, x + p[0] * s, y + p[1] * s, p[2] * s, p[2] * s * 0.9); fs(c, cols[p[3]], '#8a2a12', 0.11 * s); }
    ell(c, x - 0.3 * s, y - 2.6 * s, 0.42 * s, 0.32 * s); fs(c, 'rgba(255,235,170,.55)');
  } else if (kind === 6) {    // 垂柳
    c.fillStyle = '#3d3226'; c.fillRect(x - 0.16 * s, y - 1.7 * s, 0.32 * s, 1.7 * s);
    ell(c, x, y - 2.2 * s, 1.25 * s, 0.95 * s); fs(c, '#4f8a55', '#23452c', 0.11 * s);
    c.strokeStyle = '#3f7a48'; c.lineWidth = 0.13 * s;
    for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(x + k * 0.36 * s, y - 2.0 * s); c.quadraticCurveTo(x + k * 0.44 * s, y - 1.2 * s, x + k * 0.4 * s, y - (0.5 + (k & 1) * 0.25) * s); c.stroke(); }
    ell(c, x - 0.3 * s, y - 2.5 * s, 0.4 * s, 0.26 * s); fs(c, 'rgba(190,230,190,.4)');
  } else {                    // 符文碑
    c.fillStyle = rg(c, x, y - 1.4 * s, 0, 2.6 * s, [0, 'rgba(255,90,230,.45)', 1, 'rgba(200,60,255,0)']); c.fillRect(x - 3 * s, y - 4.4 * s, 6 * s, 6 * s);
    poly(c, [x - 0.6 * s, y, x - 0.45 * s, y - 2.4 * s, x, y - 3 * s, x + 0.45 * s, y - 2.4 * s, x + 0.6 * s, y]); fs(c, '#2c2040', '#0e0818', 0.12 * s);
    c.strokeStyle = '#ff7af0'; c.lineWidth = 0.14 * s; c.beginPath(); c.moveTo(x, y - 2.3 * s); c.lineTo(x, y - 0.8 * s); c.moveTo(x - 0.25 * s, y - 1.7 * s); c.lineTo(x + 0.25 * s, y - 1.7 * s); c.stroke();
  }
}

function paintFort(c, T, ruined) { P(rcx(L), L); paintFortAt(c, T, ruined, PX, PY, PS, rhw(L) + 1.5, [4.9, 12.6, 16.4]); }
// X, Y = 城門腳下的中心點；U = 每世界單位幾個像素；half = 城牆半寬；flags = 軍旗掛在離中心多遠
function paintFortAt(c, T, ruined, X, Y, U, half, flags) {
  const ky = V.ky;
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
    for (const off of flags) {
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
  if (lv.mode === 'march') return ruined ? renderSheet(lv) : renderBridge(lv);
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
    else if (T.deco === 5) { for (let j = 0; j < 3; j++) { ell(c, PX + (rs() - 0.5) * 0.7 * s, PY - rs() * 0.16 * s, 0.17 * s, 0.1 * s, rs() * 3); fs(c, rs() < 0.5 ? '#e8452c' : '#f4b63a'); } }
    else if (T.deco === 6) { c.fillStyle = rs() < 0.5 ? '#4f8a55' : '#7fae6a'; for (let j = -1; j <= 1; j++) { poly(c, [PX + j * 0.16 * s - 0.08 * s, PY, PX + j * 0.2 * s, PY - 0.4 * s, PX + j * 0.16 * s + 0.08 * s, PY]); c.fill(); } }
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

/* ---------- 行軍關：一座筆直的橋 ----------
   橋面是直的，所以橋身、欄杆這些「沿著 z 方向不變」的東西可以畫死在底圖上；
   會跟著行軍往下捲的（石板接縫、望柱、牌樓、小島、浪花）由 70-render 每幀畫。 */
function renderBridge(lv) {
  const W = V.W, H = V.H, T = THEMES[lv.theme], u = V.u, ky = V.ky;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'); c.lineJoin = 'round'; c.lineCap = 'round';
  paintAbyss(c, T, mkRng(4242 + lv.theme * 99), true);
  const hw = rhw(0), zA = ZMIN - 6, zB = 330;
  const strip = (x0, x1) => { P(x0, zA); const ax = PX, ay = PY; P(x0, zB); const bx = PX, by = PY; P(x1, zB); const dx = PX, dy = PY; P(x1, zA); poly(c, [ax, ay, bx, by, dx, dy, PX, PY]); };
  // 水面上的橋影、橋身側面、橋面
  strip(-hw - 2.2, hw + 2.2); fs(c, 'rgba(6,24,60,.22)');
  strip(-hw - 0.7, hw + 0.7); fs(c, T.curb, 'rgba(0,0,0,.35)', Math.max(1, 1.2 * u));
  strip(-hw, hw); c.fillStyle = lg(c, 0, V.y0, 0, V.yT * 0.4, [0, T.deck[0], 1, T.deck[1]]); c.fill();
  // 中央御道與兩側的邊線
  strip(-1.7, 1.7); fs(c, T.lane);
  c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = Math.max(1, 1.1 * u);
  for (const x of [-hw + 0.7, -1.7, 1.7, hw - 0.7]) { P(x, zA); const ax = PX, ay = PY; P(x, zB); c.beginPath(); c.moveTo(ax, ay); c.lineTo(PX, PY); c.stroke(); }
  // 橋欄：兩道橫杆（望柱每幀畫）
  for (const sd of [-1, 1]) for (const hgt of [0.62, 1.22]) {
    P(sd * (hw + 0.28), zA); const ax = PX, ay = PY - hgt * PS * ky, wa = PS; P(sd * (hw + 0.28), zB); const bx = PX, by = PY - hgt * PS * ky;
    c.strokeStyle = T.railDk; c.lineWidth = Math.max(1.4, 0.2 * V.s0 * 0.6); c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
    c.strokeStyle = T.rail; c.lineWidth = Math.max(1, 0.11 * V.s0 * 0.6); c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
  }
  // 遠處罩一層霧
  c.fillStyle = lg(c, 0, 0, 0, V.yT * 1.5, [0, T.abyss[0], 0.55, 'rgba(' + T.fade + ',0)']); c.globalAlpha = 0.75; c.fillRect(0, 0, W, V.yT * 1.5); c.globalAlpha = 1;
  return cv;
}

// 行軍關的大型佈景（橋頭堡、牌樓、小島、橋面浮雕）畫在另一張 1024×1024 的圖上，當第二張貼圖用
const SHEET = {}, ARCH_U = 28, FORT_U = 20;      // 這兩樣佈景在圖上每世界單位佔幾個像素
function sheetCell(name, x, y, w, h, ax, ay) { SHEET[name] = { x, y, w, h, u0: x / 1024, v0: y / 1024, u1: (x + w) / 1024, v1: (y + h) / 1024, ax, ay }; }
sheetCell('fort', 0, 0, 512, 448, 0.5, 430 / 448); sheetCell('fortR', 512, 0, 512, 448, 0.5, 430 / 448);
sheetCell('arch', 0, 452, 640, 320, 0.5, 312 / 320);
sheetCell('isle0', 644, 452, 180, 220, 0.5, 0.42); sheetCell('isle1', 828, 452, 180, 220, 0.5, 0.42);
sheetCell('medal', 0, 776, 160, 160, 0.5, 0.5); sheetCell('isle2', 164, 776, 180, 220, 0.5, 0.42);
function renderSheet(lv) {
  const T = THEMES[lv.theme], cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024;
  const c = cv.getContext('2d'); c.lineJoin = 'round'; c.lineCap = 'round';
  const cell = (name, fn) => { const q = SHEET[name]; c.save(); c.beginPath(); c.rect(q.x, q.y, q.w, q.h); c.clip(); c.translate(q.x, q.y); fn(q.w, q.h); c.restore(); };
  const half = rhw(0) + 1.5;
  cell('fort', () => paintFortAt(c, T, false, 256, 430, FORT_U, half, [4.9]));
  cell('fortR', () => paintFortAt(c, T, true, 256, 430, FORT_U, half, [4.9]));
  cell('arch', (w, h) => {
    // 牌樓：兩根柱子、橫梁、屋頂。柱心在 ±(橋半寬 + 0.9)
    const U = ARCH_U, cx = w / 2, gy = h - 8, px = (rhw(0) + 0.9) * U, A = T.arch, ink = 'rgba(14,8,10,.9)';
    const shade = (x0, x1) => lg(c, x0, 0, x1, 0, [0, 'rgba(0,0,0,.35)', 0.4, 'rgba(255,255,255,.2)', 1, 'rgba(0,0,0,.4)']);
    for (const sd of [-1, 1]) {
      const x = cx + sd * px;
      c.fillStyle = 'rgba(6,10,30,.3)'; ell(c, x, gy, 30, 8); c.fill();
      rrect(c, x - 13, gy - 236, 26, 236, 5); fs(c, A[0]); fs(c, shade(x - 13, x + 13), ink, 3);
      rrect(c, x - 19, gy - 22, 38, 22, 5); fs(c, '#b9b4a6', ink, 3);
    }
    rrect(c, cx - px - 14, gy - 252, (px + 14) * 2, 22, 6); fs(c, A[0], ink, 3);
    rrect(c, cx - px - 26, gy - 206, (px + 26) * 2, 26, 6); fs(c, A[1]); fs(c, lg(c, 0, gy - 206, 0, gy - 180, [0, 'rgba(255,255,255,.18)', 1, 'rgba(0,0,0,.3)']), ink, 3);
    for (let k = -4; k <= 4; k++) { ell(c, cx + k * px / 4.6, gy - 193, 5.5, 5.5); fs(c, A[3], 'rgba(60,30,0,.7)', 1.6); }
    // 屋頂：兩端上翹
    c.beginPath(); c.moveTo(cx - px - 64, gy - 262); c.quadraticCurveTo(cx - px - 20, gy - 258, cx - px + 6, gy - 290); c.lineTo(cx + px - 6, gy - 290); c.quadraticCurveTo(cx + px + 20, gy - 258, cx + px + 64, gy - 262);
    c.quadraticCurveTo(cx + px + 30, gy - 244, cx + px + 4, gy - 248); c.lineTo(cx - px - 4, gy - 248); c.quadraticCurveTo(cx - px - 30, gy - 244, cx - px - 64, gy - 262); c.closePath();
    fs(c, A[2]); fs(c, lg(c, 0, gy - 290, 0, gy - 246, [0, 'rgba(255,255,255,.16)', 1, 'rgba(0,0,0,.35)']), ink, 3);
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 2; for (let x = cx - px; x <= cx + px; x += 16) { c.beginPath(); c.moveTo(x, gy - 288); c.lineTo(x - (x - cx) * 0.03, gy - 250); c.stroke(); }
    rrect(c, cx - px + 2, gy - 298, (px - 2) * 2, 10, 4); fs(c, A[3], 'rgba(60,30,0,.8)', 2.2);
    // 匾額
    rrect(c, cx - 46, gy - 246, 92, 36, 5); fs(c, '#1d2a4a', A[3], 4);
    c.fillStyle = A[3]; for (const k of [-1, 0, 1]) { poly(c, [cx + k * 24, gy - 238, cx + k * 24 + 8, gy - 228, cx + k * 24, gy - 218, cx + k * 24 - 8, gy - 228]); c.fill(); }
  });
  const rs = mkRng(99 + lv.theme * 7);
  for (let k = 0; k < 3; k++) cell('isle' + k, (w, h) => {
    // 小島：頂面是草地，崖面往下淡進海裡
    const I = T.islet, cx = w / 2, cy = h * 0.42, rx = 62 + k * 10, ry = 24 + k * 4;
    c.beginPath(); c.moveTo(cx - rx, cy); c.lineTo(cx - rx * 0.72, h - 4); c.lineTo(cx + rx * 0.72, h - 4); c.lineTo(cx + rx, cy); c.closePath();
    c.fillStyle = lg(c, 0, cy, 0, h - 4, [0, I[2], 0.5, I[3], 1, 'rgba(' + T.fade + ',0)']); c.fill();
    c.fillStyle = lg(c, cx - rx, 0, cx + rx, 0, [0, 'rgba(255,255,255,.14)', 0.5, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,.28)']); c.fill();
    ell(c, cx, cy, rx, ry); fs(c, I[0], I[1], 3);
    paintDeco(c, T.deco, cx - 14 + k * 12, cy + 2, 17 + k * 2, rs);
    if (k) paintDeco(c, T.deco, cx + 26 - k * 30, cy - 4, 13, rs);
  });
  cell('medal', (w) => {
    // 橋面浮雕（貼地畫，所以這裡是正圓）
    const m = w / 2;
    ell(c, m, m, 72, 72); fs(c, 'rgba(255,255,255,.22)', 'rgba(60,45,20,.5)', 5);
    ell(c, m, m, 52, 52); fs(c, null, 'rgba(60,45,20,.4)', 4);
    c.strokeStyle = 'rgba(60,45,20,.45)'; c.lineWidth = 5;
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.beginPath(); c.moveTo(m + Math.cos(a) * 20, m + Math.sin(a) * 20); c.quadraticCurveTo(m + Math.cos(a + 0.5) * 38, m + Math.sin(a + 0.5) * 38, m + Math.cos(a + 0.2) * 50, m + Math.sin(a + 0.2) * 50); c.stroke(); }
    ell(c, m, m, 14, 14); fs(c, 'rgba(60,45,20,.4)');
  });
  return cv;
}
