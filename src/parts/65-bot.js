/* ===== 65-bot: 自動玩家。主畫面背景的示範戰局用它，Node 裡估難度也用它 ===== */
function botOvl(a0, a1, b0, b1) { return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)); }
function botGateX(g, t) { return g.amp ? g.x0 + g.amp * tri((t - g.born) / g.per + g.ph) : g.x; }
// 從 x 位置開砲，一個兵平均會變成幾個
function botMult(x) {
  const gs = S.gates.filter((g) => g.alive).sort((a, b) => a.z - b.z);
  let M = 1, s = 0.15; const c = x;
  for (const g of gs) {
    const tA = S.time + (g.z - CANZ) / BSPD, gx = botGateX(g, tA), gm = g.alt ? altM(g, tA) : g.m;
    const f = botOvl(c - s, c + s, gx - g.w / 2, gx + g.w / 2) / (2 * s);
    if (f <= 0) continue;
    M = M * (1 - f) + M * f * gm;
    if (gm > 1 && f > 0.3) s = Math.max(s, (0.7 + 0.65 * Math.sqrt(gm)) * 0.8);
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
          if (p.kind === 'sluice') continue;
          if (!p.built && S.front > (skill === 'good' ? 32 : 36) && (skill === 'good' || S.time % 9 < 4.5)) { bx = clamp(p.x, -CAN_LIM, CAN_LIM); break; }
        }
      }
      // 水閘：隘道裡擠滿敵人的時候才去開
      for (const p of S.peds) {
        if (p.kind !== 'sluice' || (S.flood && !S.flood.done)) continue;
        const f = S.lv.flood, rows = S.R.rows; let inCh = 0;
        for (let g = Math.max(0, (f.z1 | 0) - GZ0); g <= (f.z0 | 0) - GZ0 && g < GH; g++) inCh += rows[g];
        if (inCh > (skill === 'good' ? 220 : skill === 'casual' ? 300 : 420) && (skill !== 'weak' || S.time % 10 < 6)) bx = clamp(p.x, -CAN_LIM, CAN_LIM);
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

/* ---------- 行軍玩法的自動玩家 ---------- */
const botCols = new Float32Array(40);
// 隊伍中心站在 x、往前看 look 遠：這段路走完大概會多（少）幾個兵。
// 眼前的東西算全額，遠處的打折（之後還來得及換位置）；眼前的危險加重，寧可少拿也不要踩進去
function marchScore(x, n, look) {
  const q = S.sq, a = Math.max(squadHalf(x), 0.6), x0 = x - a, x1 = x + a, zf = q.front, v = Math.max(2, q.v);
  const rate = arrowRate(n, q.wpn), near = 16;
  const wt = (z) => (z - zf < near ? 1 : 0.3), wd = (z) => (z - zf < near ? 3 : 0.4);
  let sc = 0;
  for (const g of S.gates) {
    if (!g.alive || g.z < MZ_REAR || g.z > zf + look) continue;
    const gx = botGateX(g, S.time + Math.max(0, g.z - q.cz) / v), ov = botOvl(x0, x1, gx - g.w / 2, gx + g.w / 2);
    if (g.add !== undefined) { if (ov > 0.3) sc += g.add >= 0 ? (g.add + 2) * wt(g.z) : Math.max(g.add, -n) * 1.5 * wd(g.z); }
    else if (g.m >= 1) sc += n * (ov / (2 * a)) * (g.m - 1) * wt(g.z);
    else sc += n * (ov / (2 * a)) * (g.m - 1) * wd(g.z);
  }
  for (const o of S.barrels) {
    if (!o.alive || o.fuse >= 0 || o.z < MZ_REAR || o.z > zf + look) continue;
    const ov = botOvl(x0, x1, o.x - o.hw, o.x + o.hw); if (ov <= 0) continue;
    const dmg = rate * (ov / (2 * a)) * Math.max(0, o.z - zf) / v * WPN_DMG[q.wpn], left = Math.max(0, o.hp - dmg);
    const val = o.rw === 'troop' ? o.n : o.rw === 'bow' ? 12 + n * 0.25 : o.rw === 'elite' ? 40 + n * 0.2 : 4;
    sc += val * wt(o.z) - Math.min(n, left) * 1.2 * wd(o.z) / 3;
  }
  for (const h of S.holes) { if (h.z > zf + look || h.z + h.len < MZ_REAR) continue; sc -= n * botOvl(x0, x1, h.x - h.w / 2 - 0.3, h.x + h.w / 2 + 0.3) / (2 * a) * wd(h.z); }
  for (const s of S.saws) {
    if (s.z > zf + look || s.z < MZ_REAR) continue;
    const sx = s.amp ? s.x0 + s.amp * tri((S.time + Math.max(0, s.z - q.cz) / v - s.born) / s.per + s.ph) : s.x;
    sc -= n * botOvl(x0, x1, sx - s.r - 0.7, sx + s.r + 0.7) / (2 * a) * wd(s.z);
  }
  for (const o of S.bigs) {
    if (o.team !== 1 || o.dead || o.fixed || o.z > zf + look || o.z < MZ_REAR) continue;
    if (botOvl(x0, x1, o.x - o.r - 0.5, o.x + o.r + 0.5) > 0) sc -= Math.min(n, Math.max(0, o.hp - rate * 0.3 * Math.max(0, o.z - zf) / v)) * 0.8 * wt(o.z);
  }
  for (const f of S.strafes) if (f.t < f.warn + f.dur) {
    sc -= n * botOvl(x0, x1, f.x - f.w / 2 - 0.4, f.x + f.w / 2 + 0.4) / (2 * a) * 3;
    if (f.t > f.warn - 0.8 && (x - f.x) * (q.x - f.x) < 0) sc -= n * 2;      // 火快燒過來了，別橫越火線
  }
  // 對著赤龍站，箭才射得到
  const bo = S.boss; if (bo && bo.fixed) sc += n * 0.25 * botOvl(x0, x1, bo.x - bo.r, bo.x + bo.r) / (2 * a);
  // 擋在路上的敵陣：這幾欄裡有多少人，扣掉來得及射倒的
  let red = 0; const c0 = Math.max(0, Math.floor(x0 + 20)), c1 = Math.min(39, Math.floor(x1 + 20));
  for (let c = c0; c <= c1; c++) red += botCols[c];
  if (red > 0) sc -= Math.min(n, Math.max(0, red - rate * 2.5)) * 0.9;
  return sc;
}
function makeMarchBot(skill, rand) {
  const st = { tx: 0, next: 0, ultWait: -1 }, rf = rand || Math.random;
  const Pm = skill === 'good' ? { iv: 0.12, noise: 0.3, spd: 30, look: 44, ultDelay: 0.3 }
    : skill === 'casual' ? { iv: 0.5, noise: 1.5, spd: 15, look: 32, ultDelay: 2 }
      : skill === 'weak' ? { iv: 1.1, noise: 2.8, spd: 9, look: 22, ultDelay: 5 } : null;
  return function (dt) {
    if (!Pm) return;
    const q = S.sq;
    if (S.time >= st.next && !q.siege) {
      st.next = S.time + Pm.iv;
      const lim = q.lim, n = S.B.n, r = S.R;
      botCols.fill(0);
      for (let j = 0; j < r.n; j++) if (r.hp[j] > 0 && r.gate[j] === 0 && r.z[j] > q.front && r.z[j] < q.front + Pm.look) { const c = Math.floor(r.x[j] + 20); if (c >= 0 && c < 40) botCols[c]++; }
      let best = -1e9, bx = q.x;
      for (let x = -lim; x <= lim + 0.01; x += 0.5) {
        const v = marchScore(x, n, Pm.look) - Math.abs(x - q.x) * 0.05;
        if (v > best) { best = v; bx = x; }
      }
      st.tx = clamp(bx + (rf() * 2 - 1) * Pm.noise, -lim, lim);
    }
    const d = st.tx - S.cannonX, m = Pm.spd * dt;
    S.cannonX += clamp(d, -m, m);
    const u = S.ult;
    if (u.charge >= u.need && !u.active) {
      if (st.ultWait < 0) st.ultWait = Pm.ultDelay;
      st.ultWait -= dt;
      if (st.ultWait <= 0 && (S.front < q.front + 26 || (S.boss && S.boss.fixed))) { simUlt(); st.ultWait = -1; }
    }
  };
}
// 依關卡玩法挑對應的自動玩家
function botFor(skill, rand) { return S.mode ? makeMarchBot(skill, rand) : makeBot(skill, rand); }
