'use strict';
/* ===== 10-core: 常數、工具、亂數、道路模型 ===== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

// 模擬用的可重現亂數（特效另外用 Math.random，不影響戰局）
let _seed = 20261004;
function srand(s) { _seed = s >>> 0; }
function rnd() {
  _seed = (_seed + 0x6D2B79F5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rr = (a, b) => a + (b - a) * rnd();

// 戰場座標：x 橫向、z 縱深（0 = 我方城牆，L = 敵城城門）、y 高度
const L = 110;          // 戰場縱深
const WALLZ = 0;        // 我方城牆
const CANZ = -3.2;      // 兵砲所在
const BSPD = 11;        // 我軍行軍速度
const RAD = 0.36;       // 小兵半徑
const HIT2 = (RAD * 2) * (RAD * 2);
const PLAZA_HW = 11.5;  // 前庭半寬
const CAN_LIM = PLAZA_HW - 2.4;

// 道路：中心線 cx(z) 與半寬 hw(z)，每 0.5 取樣
const ZMIN = -16, RDZ = 0.5;
const RN = Math.ceil((L + 14 - ZMIN) / RDZ) + 2;
const roadCx = new Float32Array(RN), roadHw = new Float32Array(RN);

function interpPts(pts, z) {
  if (z <= pts[0][0]) return pts[0][1];
  const n = pts.length;
  if (z >= pts[n - 1][0]) return pts[n - 1][1];
  for (let i = 1; i < n; i++) {
    if (z <= pts[i][0]) {
      const a = pts[i - 1], b = pts[i];
      return lerp(a[1], b[1], smooth((z - a[0]) / (b[0] - a[0])));
    }
  }
  return pts[n - 1][1];
}
function buildRoad(def) {
  for (let i = 0; i < RN; i++) {
    const z = ZMIN + i * RDZ;
    roadCx[i] = interpPts(def.c, z);
    roadHw[i] = interpPts(def.w, z);
  }
}
function rcx(z) {
  let f = (z - ZMIN) / RDZ;
  if (f < 0) f = 0; else if (f > RN - 1.001) f = RN - 1.001;
  const i = f | 0;
  return roadCx[i] + (roadCx[i + 1] - roadCx[i]) * (f - i);
}
function rhw(z) {
  let f = (z - ZMIN) / RDZ;
  if (f < 0) f = 0; else if (f > RN - 1.001) f = RN - 1.001;
  const i = f | 0;
  return roadHw[i] + (roadHw[i + 1] - roadHw[i]) * (f - i);
}
// 線道參數 t∈[-1,1] ↔ 世界 x
const LANE_PAD = 0.5;
function laneX(t, z) { return rcx(z) + t * (rhw(z) - LANE_PAD); }
function laneT(x, z) { return clamp((x - rcx(z)) / (rhw(z) - LANE_PAD), -1, 1); }

// 三角波（-1..1），移動門用：等速來回比較好預判
function tri(p) { p = p - Math.floor(p); return p < 0.5 ? p * 4 - 1 : 3 - p * 4; }

function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
