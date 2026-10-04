/* ===== 85-main: 啟動、主迴圈、操作、關卡流程 ===== */
const STEP = 1 / 60;
const G = {
  mode: 'home', demo: true, bot: null, acc: 0, last: 0, endT: 0, drag: null, moved: 0, keys: {}, dprCap: 2, stageW: 1,
  ft: 16, slowFrames: 0, hudN: 0, lastKills: -1, lastWall: -1, mileIdx: 0, demoIdx: 0, demoWait: 0, started: false, bossBar: false
};
const MILES = [[100, '百人斬'], [500, '五百人斬'], [1000, '千人斬'], [2000, '兩千人斬'], [3500, '所向披靡'], [5000, '五千人斬'], [8000, '萬夫莫敵'], [12000, '橫掃千軍']];

function layout() {
  const app = $('app'), stage = $('stage'), w = app.clientWidth, h = app.clientHeight;
  if (!w || !h) return;
  let sw = w; if (h / w < 1.5) sw = Math.round(h / 1.74);
  stage.style.width = sw + 'px'; G.stageW = sw;
  const rot = h < 430 && w > h; $('rotate').hidden = !rot; if (rot && G.mode === 'play' && S.state === 'play') pauseGame();
  const dpr = Math.min(window.devicePixelRatio || 1, G.dprCap);
  let W = Math.round(sw * dpr), H = Math.round(h * dpr);
  if (W > 900) { H = Math.round(H * 900 / W); W = 900; }
  if (W !== V.W || H !== V.H) { setView(W, H, W / sw); glResize(W, H); if (S.lv) rebuildTerrain(); }
}
const terrCache = { key: '', a: null, b: null };
function rebuildTerrain() {
  if (V.W < 2 || V.H < 2) return;
  const key = S.idx + '|' + V.W + '|' + V.H;
  if (terrCache.key !== key) { terrCache.key = key; terrCache.a = renderTerrain(S.lv, false); terrCache.b = renderTerrain(S.lv, true); }
  glSetBg(terrCache.a, terrCache.b);
}

function demoStart(idx) {
  G.demo = true; G.demoIdx = idx; G.demoWait = 0;
  simInit(idx, { rate: 3, armor: 3, hero: 3, ult: 3, wall: 5 }, (Math.random() * 1e9) | 0, 1); fxReset(); rebuildTerrain();
  G.bot = makeBot('casual'); S.on = fxOn;
}
function startLevel(idx) {
  auInit();
  G.demo = false; G.mode = 'play'; G.endT = 0; G.acc = 0; G.moved = 0; G.mileIdx = 0; G.lastKills = -1; G.lastWall = -1; G.bossBar = false;
  $('tug').classList.remove('boss'); $('tugRl').textContent = '赤潮';
  const run = G.run = (G.run || 0) + 1;
  simInit(idx, SV.up, (Math.random() * 1e9) | 0, SV.diff); fxReset(); rebuildTerrain(); S.on = fxOn; G.ultHint = false;
  $('home').hidden = true; $('result').hidden = true; $('opt').hidden = true; $('shop').hidden = true; $('hud').hidden = false;
  $('hudNo').textContent = '第' + NUM_ZH[idx] + '關'; $('hudName').textContent = LEVELS[idx].name;
  $('hint').hidden = !(idx === 0 && !SV.seen);
  $('banner').className = ''; $('say').className = 'chamfer'; $('mile').className = '';
  setTimeout(() => { if (G.mode === 'play' && G.run === run) { const el = $('banner'); el.className = 'blue'; el.innerHTML = ''; const s = document.createElement('small'); s.textContent = '第' + NUM_ZH[idx] + '關'; el.appendChild(s); el.appendChild(document.createTextNode(LEVELS[idx].name)); replay(el, 'show'); } }, 60);
  setTimeout(() => { if (G.mode === 'play' && G.run === run && S.time < 6) say(LEVELS[idx].tip); }, 1900);
  musStart(LEVELS[idx].theme, false);
  hudUpdate(true);
}
function goHome() {
  G.run = (G.run || 0) + 1;
  G.mode = 'home'; $('hud').hidden = true; $('result').hidden = true; $('opt').hidden = true; $('shop').hidden = true; $('home').hidden = false;
  homeRender(); demoStart(UI.sel); musStart(0, true);
}
function pauseGame() { if (G.mode !== 'play' || S.state !== 'play') return; G.mode = 'pause'; G.drag = null; G.keys = {}; openOpt(true); }
function resumeGame() { if (G.mode !== 'pause') return; G.mode = 'play'; $('opt').hidden = true; G.last = performance.now(); }
function finishLevel() {
  const won = S.state === 'won', idx = S.idx;
  const ratio = S.wallHp / S.wallMax, stars = won ? (ratio >= 0.8 ? 3 : ratio >= 0.4 ? 2 : 1) : 0;
  let coins = Math.floor(S.kills / (won ? 30 : 50)) + S.coinsBig;
  if (SV.diff === 2) coins = Math.round(coins * 1.25);
  if (won) { coins += 60 + 30 * idx + Math.max(0, stars - SV.stars[idx]) * 25; SV.stars[idx] = Math.max(SV.stars[idx], stars); SV.open = Math.max(SV.open, Math.min(5, idx + 2)); }
  SV.coins += coins; SV.kills += S.kills; SV.seen = true; save();
  G.mode = 'result'; musStop(); sfx(won ? 'win' : 'lose');
  showResult(won, { idx, stars, kills: S.kills, army: S.maxArmy, lost: S.lost, time: S.time, coins });
}

function setTrack(el, f) { el.style.transform = 'scaleX(' + clamp(f, 0, 1).toFixed(3) + ')'; }
function hudUpdate(force) {
  G.hudN++;
  if (S.kills !== G.lastKills) {
    const el = $('hudKills'); el.textContent = fmt(S.kills);
    if (S.kills - G.lastKills > 24 || force) replay(el, 'pop');
    G.lastKills = S.kills;
    while (G.mileIdx < MILES.length && S.kills >= MILES[G.mileIdx][0]) { if (!force) mile(MILES[G.mileIdx][1]); G.mileIdx++; }
  }
  if (S.wallHp !== G.lastWall) {
    G.lastWall = S.wallHp; $('wallNum').textContent = Math.max(0, Math.ceil(S.wallHp));
    setTrack($('wallBar'), S.wallHp / S.wallMax); $('wallBar').classList.toggle('warn', S.wallHp < S.wallMax * 0.4);
  }
  if (force || G.hudN % 4 === 0) {
    $('tugB').textContent = fmt(S.B.n);
    const boss = S.boss;
    if (!!boss !== G.bossBar) { G.bossBar = !!boss; $('tug').classList.toggle('boss', G.bossBar); $('tugRl').textContent = boss ? '魔王' : '赤潮'; }
    if (boss) { $('tugR').textContent = fmt(Math.ceil(boss.hp)); setTrack($('tugBar'), boss.hp / boss.maxHp); }
    else { $('tugR').textContent = fmt(S.R.n); setTrack($('tugBar'), S.state === 'won' ? 1 : clamp(S.front / L, 0.02, 1)); }
    const h = S.hero, hm = $('heroMeter');
    hm.hidden = !h.on; if (h.on) { const f = h.ready > 0 ? 1 : h.t / h.cd; setTrack($('heroBar'), f); $('heroNum').textContent = h.ready > 0 ? '出陣' : Math.max(0, Math.ceil(h.cd - h.t)) + '秒'; hm.classList.toggle('ready', h.ready > 0); }
    const u = S.ult, p = clamp(u.charge / u.need, 0, 1), btn = $('btnUlt');
    btn.style.setProperty('--p', p.toFixed(3)); btn.classList.toggle('ready', p >= 1 && !u.active);
    if (p >= 1 && !u.active && !SV.ultSeen && !G.ultHint && S.state === 'play') { G.ultHint = true; say('箭雨集滿了！按右下角的金色按鈕', 0); }
    $('ultNum').textContent = p >= 1 ? '發射' : Math.floor(p * 100) + '%';
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  let rdt = (now - G.last) / 1000; G.last = now;
  if (!(rdt > 0)) rdt = STEP; if (rdt > 0.1) rdt = 0.1;
  // 太慢就降特效、再不行降解析度
  G.ft += (rdt * 1000 - G.ft) * 0.05;
  if (G.ft > 40 && G.started) { if (++G.slowFrames > 150) { G.slowFrames = 0; if (!FX.low) FX.low = true; else if (G.dprCap > 1) { G.dprCap = Math.max(1, G.dprCap - 0.5); layout(); } } } else G.slowFrames = 0;
  AU.quiet = G.demo;
  const run = (G.mode === 'play' || (G.demo && G.mode !== 'pause')) && !G.freeze;
  if (run) {
    let ts = FX.slow; if (FX.stop > 0) { FX.stop -= rdt; ts = 0; }
    if (G.mode === 'play' && S.state === 'play') {
      const k = G.keys; let dx = 0; if (k.ArrowLeft || k.KeyA) dx -= 1; if (k.ArrowRight || k.KeyD) dx += 1;
      if (dx) { S.cannonX = clamp(S.cannonX + dx * 19 * rdt, -CAN_LIM, CAN_LIM); G.moved += 3; if (G.moved > 70 && !$('hint').hidden) $('hint').hidden = true; }
    }
    G.acc += rdt * ts; let n = 0;
    while (G.acc >= STEP && n < 4) { if (G.demo && S.state === 'play') G.bot(STEP); simStep(STEP); G.acc -= STEP; n++; }
    if (n === 4) G.acc = 0;
    fxStep(rdt * ts, rdt);
    if (G.mode === 'play') {
      hudUpdate(false);
      if (S.state !== 'play') { G.endT += rdt; if (G.endT > (S.state === 'won' ? 3.2 : 2.4)) finishLevel(); }
    } else if (G.demo && S.state !== 'play') { G.demoWait += rdt; if (G.demoWait > 3.5) demoStart(G.demoIdx); }
  }
  renderFrame();
  const heat = S.state === 'play' && G.mode === 'play' ? clamp(1 - S.front / 60, 0, 1) * 0.6 + (S.boss ? 0.5 : 0) + Math.min(0.4, FX.killRate / 900) : 0;
  auStep(rdt, FX.killRate, run && !G.demo); musStep(Math.min(1, heat));
}

function bindInput() {
  const stage = $('stage');
  const absX = (clientX) => { const r = stage.getBoundingClientRect(); return clamp(worldXAt((clientX - r.left) * V.W / r.width, CANZ), -CAN_LIM, CAN_LIM); };
  stage.addEventListener('pointerdown', (e) => {
    auInit(); if (!G.started) { G.started = true; if (G.mode === 'home') musStart(0, true); }
    if (G.mode !== 'play' || e.target.closest('button')) return;
    // 拖曳中的第二根手指不搶控制權（除非原本那根已經超過兩秒沒動靜，多半是事件漏掉了）
    if (G.drag && G.drag.id !== e.pointerId && e.pointerType !== 'mouse' && performance.now() - G.drag.at < 2000) return;
    G.drag = { id: e.pointerId, x: e.clientX, at: performance.now() };
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* 沒有指標捕捉也能玩 */ }
    if (e.pointerType === 'mouse') S.cannonX = absX(e.clientX);
    e.preventDefault();
  });
  stage.addEventListener('pointermove', (e) => {
    if (G.mode !== 'play' || S.state !== 'play') return;
    if (e.pointerType === 'mouse') { if (e.target.closest && e.target.closest('button')) return; S.cannonX = absX(e.clientX); G.moved += 4; }
    else if (G.drag && G.drag.id === e.pointerId) {
      const dx = e.clientX - G.drag.x; G.drag.x = e.clientX; G.drag.at = performance.now(); G.moved += Math.abs(dx);
      S.cannonX = clamp(S.cannonX + dx * (V.W / G.stageW) * (1 + CANZ * V.g) / V.s0 * 1.25, -CAN_LIM, CAN_LIM);
    }
    if (G.moved > 70 && !$('hint').hidden) $('hint').hidden = true;
  });
  const up = (e) => { if (G.drag && G.drag.id === e.pointerId) G.drag = null; };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up); stage.addEventListener('lostpointercapture', up);
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    G.keys[e.code] = true;
    if (e.repeat) return;
    const pk = e.code === 'KeyP' || e.code === 'Escape';
    if (G.mode === 'play') { if (e.code === 'Space' || e.code === 'Enter') { if (e.target.closest && e.target.closest('button')) return; if (simUlt()) SV.ultSeen = true; e.preventDefault(); } else if (pk) pauseGame(); }
    else if (G.mode === 'pause' && pk) resumeGame();
  });
  window.addEventListener('keyup', (e) => { G.keys[e.code] = false; });
  window.addEventListener('blur', () => { G.keys = {}; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (G.mode === 'play' && S.state === 'play') pauseGame(); if (AU.ctx) AU.ctx.suspend(); } else if (AU.ctx) AU.ctx.resume(); });
  window.addEventListener('resize', layout);
  if (window.ResizeObserver) new ResizeObserver(layout).observe($('app'));

  const click = (id, fn) => $(id).addEventListener('click', (e) => { auInit(); fn(e); });
  click('btnUlt', () => { if (simUlt()) { if (!SV.ultSeen) { SV.ultSeen = true; save(); } } else sfx('deny'); });
  click('btnPause', () => { sfx('click'); pauseGame(); });
  click('btnGo', () => { sfx('click'); startLevel(UI.sel); });
  click('btnShop', () => { sfx('click'); shopRender(); $('shop').hidden = false; });
  click('btnOpt', () => { sfx('click'); openOpt(false); });
  click('btnResume', () => { sfx('click'); resumeGame(); });
  click('btnRetry', () => { sfx('click'); startLevel(S.idx); });
  click('btnQuit', () => { sfx('click'); goHome(); });
  click('btnNext', () => { sfx('click'); UI.sel = Math.min(4, S.idx + 1); startLevel(UI.sel); });
  click('btnAgain', () => { sfx('click'); startLevel(S.idx); });
  click('btnUp', () => { sfx('click'); shopRender(); $('shop').hidden = false; });
  click('btnHome', () => { sfx('click'); UI.sel = Math.min(S.state === 'won' ? S.idx + 1 : S.idx, SV.open - 1, 4); goHome(); });
  click('tSfx', () => { SV.sfx = !SV.sfx; toggleSync(); save(); sfx('click'); });
  click('tMus', () => { SV.mus = !SV.mus; toggleSync(); save(); sfx('click'); });
  click('tVib', () => { SV.vib = !SV.vib; toggleSync(); save(); vibrate(30); sfx('click'); });
  document.querySelectorAll('#diffSeg button').forEach((b) => b.addEventListener('click', () => { auInit(); SV.diff = +b.dataset.d; toggleSync(); save(); sfx('click'); }));
  click('btnUnlock', () => { SV.open = 5; save(); sfx('buy'); homeRender(); $('opt').hidden = true; });
  click('btnWipe', () => {
    if (!UI.wipeArm) { UI.wipeArm = 1; $('btnWipe').textContent = '再按一次，確定清除'; sfx('deny'); return; }
    SV.coins = 0; SV.open = 1; SV.kills = 0; SV.seen = false; SV.stars = [0, 0, 0, 0, 0]; for (const k in SV.up) SV.up[k] = 0;
    save(); UI.sel = 0; homeRender(); demoStart(0); $('opt').hidden = true; sfx('click');
  });
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { sfx('click'); b.closest('.modal').hidden = true; if (G.mode === 'home') homeRender(); }));
}

function boot() {
  loadSave(); toggleSync();
  UI.sel = clamp(SV.open - 1, 0, 4);
  const cv = $('cv');
  const force2d = /(^|[#&])2d\b/.test(location.hash);
  glInit(cv, force2d);
  if (GLR.mode === 'gl') {
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); });
    cv.addEventListener('webglcontextrestored', () => { GLR.texAtlas = GLR.texBg = GLR.texBg2 = null; glInit(GLR.cv, false); glSetAtlas(AT.cv); if (S.lv) rebuildTerrain(); });
  }
  buildAtlas(); glSetAtlas(AT.cv); renderInit();
  bindInput(); layout(); homeRender(); demoStart(UI.sel);
  G.last = performance.now(); requestAnimationFrame(frame);
  // 數字字型晚一點才載到的話，重畫一次圖集
  if (document.fonts && document.fonts.load) {
    document.fonts.load('84px "Lilita One"').then((f) => { if (f && f.length) { buildAtlas(); glSetAtlas(AT.cv); renderInit(); } }).catch(() => { });
  }
}
window.__wj = { S, FX, G, V, SV, AU, sfx, musStart, musStep, auStep, startLevel, goHome, simUlt, makeBot, GLR, layout, simStep, fxStep, renderFrame,
  // 測試用：凍結即時迴圈後，手動把戰局往前推 sec 秒
  advance(sec, bot) { const n = Math.round(sec / STEP); for (let i = 0; i < n; i++) { if (bot && S.state === 'play') bot(STEP); simStep(STEP); fxStep(STEP, STEP); if (G.mode === 'play' && S.state !== 'play') G.endT += STEP; } if (G.mode === 'play') hudUpdate(true); }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
