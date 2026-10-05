/* ===== 53-mech: 破陣玩法在第七、九關多出來的機關 =====
   赤門：橫在隘道上的敵方倍增門。赤潮穿過去會變多；我軍過不去，要一個一個撞到它垮。
   陰陽門：藍色倍增與紅色折兵輪流切換。
   水閘：把兵送進去就開閘，一道大水把隘道裡的赤潮整片沖走。 */
function addRGate(g, k) {
  const hp = Math.round(g.hp * S.diff.hp);
  return { id: k, bit: 1 << k, z: g.z, x: rcx(g.z), w: 2 * rhw(g.z), m: g.m, hp, max: hp, alive: true, flash: 0, gone: 0 };
}
// 這個位置的赤潮已經被幾道赤門加倍過了
function rgMul(z) { let m = 1; for (const g of S.rgates) if (g.alive && g.z > z) m *= g.m; return m; }
function redGatePass(i, g, t, z) {
  const r = S.R; g.flash = 1;
  for (let c = 1; c < g.m; c++) {
    const j = addRed(clamp(t + (rnd() - 0.5) * 0.3, -1, 1), z - rnd() * 0.9, r.kind[i], NaN);
    if (j >= 0) r.gate[j] = r.gate[i];
  }
}
function hitRGate(g, dmg, x) {
  if (!g.alive) return;
  g.hp -= dmg; g.flash = 1; ev('rgh', g, x);
  if (g.hp <= 0) {
    g.hp = 0; g.alive = false;
    const k = blast(1, g.x, g.z, 8, 500, 1, 13); blastBigs(1, g.x, g.z, 8, 60);
    ev('rgbreak', g, k);
  }
}
// 陰陽門現在（或 t 時刻）是幾倍
function altM(g, t) {
  const a = g.alt, ph = (((t - g.born) / a.per + (a.ph || 0)) % 1 + 1) % 1;
  return ph < (a.duty || 0.5) ? g.m0 : a.m;
}
function stepAltGate(g) {
  const a = g.alt, ph = (((S.time - g.born) / a.per + (a.ph || 0)) % 1 + 1) % 1, duty = a.duty || 0.5, good = ph < duty;
  const m = good ? g.m0 : a.m;
  if (m !== g.m) { g.m = m; g.kind = m < 1 ? 1 : 0; g.flash = 1; ev('galt', g); }
  g.left = (good ? duty - ph : 1 - ph) * a.per;      // 再過幾秒切換
  g.span = (good ? duty : 1 - duty) * a.per;
}
function startFlood(p) {
  const lv = S.lv, f = lv.flood || {};
  S.flood = { t: 0, dur: f.dur || 2.4, z0: f.z0 || 63, z1: f.z1 || 21, zf: f.z0 || 63, killed: 0, n: (S.flood ? S.flood.n : 0) + 1 };
  for (const b of S.bigs) b.flooded = false;
  ev('flood', S.flood);
}
function stepFlood(dt) {
  const f = S.flood; if (!f || f.t >= f.dur + 0.5) return;
  f.t += dt; f.zf = lerp(f.z0, f.z1, Math.min(1, f.t / f.dur));
  if (f.done) return;
  // 浪頭掃到哪裡，那一段的赤潮就被沖下山崖
  const r = S.R, n = r.n; let k = 0;
  for (let j = 0; j < n && k < 90; j++) {
    if (r.hp[j] <= 0) continue;
    const z = r.z[j];
    if (z >= f.zf && z <= f.z0) { killRed(j, 1, rcx(z) + (r.x[j] > rcx(z) ? -3 : 3), z + 2.5, 13); k++; f.killed++; }
  }
  for (const b of S.bigs) if (b.team === 1 && !b.dead && !b.flooded && b.z >= f.zf && b.z <= f.z0) { b.flooded = true; hurtBig(b, b.maxHp * (b.kind === 'boss' ? 0.05 : 0.6)); }
  if (f.t >= f.dur) { f.done = true; ev('floodend', f.killed); }
}
