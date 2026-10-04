/* ===== 15-view: 固定鏡頭的透視投影 =====
   地面上的點 (x, z)：inv = 1/(1+z·g)，螢幕 x = cx + x·s0·inv，螢幕 y = yH + C·inv，
   該處的比例尺 = s0·inv（每世界單位幾個像素）。越遠 inv 越小，東西越小、越靠近上方。 */
const V = { W: 0, H: 0, cx: 0, u: 1, s0: 0, k: 0.336, g: 0, y0: 0, yT: 0, yH: 0, C: 0, ky: 0.92, q0: 1 };
let PX = 0, PY = 0, PS = 0;
// k = 每個 CSS 像素對應幾個畫布像素。矮螢幕上要把戰場夾在上下兩條資訊列之間，敵城和兵砲才不會被蓋住
function setView(W, H, k) {
  k = k || W / 390;
  V.W = W; V.H = H; V.cx = W / 2; V.u = W / 540;
  V.s0 = W / 24.4;
  V.yT = Math.max(H * 0.172, 136 * k); V.y0 = Math.min(H * 0.815, H - 152 * k);
  if (V.y0 < V.yT + 200 * k) V.y0 = V.yT + 200 * k;
  V.g = (1 / V.k - 1) / L;
  V.yH = (V.yT - V.k * V.y0) / (1 - V.k); V.C = V.y0 - V.yH;
  V.q0 = V.C * V.g / V.s0;      // 地面縱向壓扁的比例（z=0 處）
}
function P(x, z) { const inv = 1 / (1 + z * V.g); PX = V.cx + x * V.s0 * inv; PY = V.yH + V.C * inv; PS = V.s0 * inv; }
function worldXAt(sx, z) { return (sx - V.cx) * (1 + z * V.g) / V.s0; }
