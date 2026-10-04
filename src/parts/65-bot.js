/* ===== 65-bot: 自動玩家。主畫面背景的示範戰局用它，Node 裡估難度也用它 ===== */
function botOvl(a0, a1, b0, b1) { return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)); }
function botGateX(g, t) { return g.amp ? g.x0 + g.amp * tri((t - g.born) / g.per + g.ph) : g.x; }
// 從 x 位置開砲，一個兵平均會變成幾個
function botMult(x) {
  const gs = S.gates.filter((g) => g.alive).sort((a, b) => a.z - b.z);
  let M = 1, s = 0.15; const c = x;
  for (const g of gs) {
    const gx = botGateX(g, S.time + (g.z - CANZ) / BSPD);
    const f = botOvl(c - s, c + s, gx - g.w / 2, gx + g.w / 2) / (2 * s);
    if (f <= 0) continue;
    M = M * (1 - f) + M * f * g.m;
    if (g.m > 1 && f > 0.3) s = Math.max(s, (0.7 + 0.65 * Math.sqrt(g.m)) * 0.8);
  }
  return M;
}
function makeBot(skill, rand) {
  const st = { tx: 0, next: 0, ultWait: -1 }, rf = rand || Math.random;
  const Pm = skill === 'good' ? { iv: 0.15, noise: 0.25, spd: 34, ultDelay: 0.3 }
    : skill === 'casual' ? { iv: 0.7, noise: 1.3, spd: 16, ultDelay: 2.5 }
      : skill === 'weak' ? { iv: 1.4, noise: 2.4, spd: 11, ultDelay: 5 } : null;
  return function (dt) {
    if (!Pm) return;
    if (S.time >= st.next) {
      st.next = S.time + Pm.iv;
      let best = -1, bx = 0;
      for (let x = -CAN_LIM; x <= CAN_LIM; x += 0.5) {
        const v = botMult(x) - Math.abs(x - S.cannonX) * 0.01;
        if (v > best) { best = v; bx = x; }
      }
      // 戰線夠遠、沒有總攻的時候才分兵去蓋砲塔
      if (S.time > 4 && S.surge.on <= 0) {
        for (const p of S.peds) {
          if (!p.built && S.front > (skill === 'good' ? 32 : 36) && (skill === 'good' || S.time % 9 < 4.5)) { bx = clamp(p.x, -CAN_LIM, CAN_LIM); break; }
        }
      }
      // 很會玩的才會回頭補掉零星漏網的
      if (skill === 'good' && S.redMinZ < 7) {
        const r = S.R; let lx = 0, lz = 1e9, cnt = 0;
        for (let j = 0; j < r.n; j++) if (r.hp[j] > 0 && r.z[j] < 9) { cnt++; if (r.z[j] < lz) { lz = r.z[j]; lx = r.x[j]; } }
        if (cnt > 0 && cnt <= 8) bx = clamp(lx, -CAN_LIM, CAN_LIM);
      }
      st.tx = clamp(bx + (rf() * 2 - 1) * Pm.noise, -CAN_LIM, CAN_LIM);
    }
    const d = st.tx - S.cannonX, m = Pm.spd * dt;
    S.cannonX += clamp(d, -m, m);
    const u = S.ult;
    if (u.charge >= u.need && !u.active) {
      if (st.ultWait < 0) st.ultWait = Pm.ultDelay;
      st.ultWait -= dt;
      if (st.ultWait <= 0 && (S.front < 70 || S.boss)) { simUlt(); st.ultWait = -1; }
    }
  };
}
