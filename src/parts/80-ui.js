/* ===== 80-ui: 存檔、主畫面、強化、設定、結算 ===== */
const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'wanjun-pozhen-1';
const SV = { coins: 0, stars: LEVELS.map(() => 0), open: 1, up: { rate: 0, armor: 0, hero: 0, ult: 0, wall: 0 }, sfx: true, mus: true, vib: true, seen: false, seenM: false, ultSeen: false, kills: 0, diff: 1 };
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && typeof s === 'object') {
      SV.coins = +s.coins || 0; SV.open = clamp(+s.open || 1, 1, LEVELS.length); SV.kills = +s.kills || 0;
      if (Array.isArray(s.stars)) for (let i = 0; i < LEVELS.length; i++) SV.stars[i] = clamp(+s.stars[i] || 0, 0, 3);
      if (s.up) for (const k in SV.up) SV.up[k] = clamp(+s.up[k] || 0, 0, 5);
      SV.sfx = s.sfx !== false; SV.mus = s.mus !== false; SV.vib = s.vib !== false; SV.seen = !!s.seen; SV.seenM = !!s.seenM; SV.ultSeen = !!s.ultSeen;
      SV.diff = s.diff === 0 || s.diff === 2 ? s.diff : 1;
      // 舊版只有五關，破完第五關的存檔 open 停在 5；有拿到星的關卡，下一關一定要開
      let top = 0; for (let i = 0; i < LEVELS.length; i++) if (SV.stars[i] > 0) top = i + 1;
      SV.open = clamp(Math.max(SV.open, top + 1), 1, LEVELS.length);
    }
  } catch (e) { /* 讀不到存檔就當新玩家 */ }
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SV)); } catch (e) { /* 存不了就只留在這次遊玩 */ } }

const UPS = [
  { k: 'rate', name: '砲速', desc: '兵砲每秒多發射一成士兵；行軍時箭也多射一成' },
  { k: 'armor', name: '精兵', desc: '對撞時多 6% 機會不倒，繼續往前衝' },
  { k: 'hero', name: '大將', desc: '先鋒大將更快登場，衝殺得更久' },
  { k: 'ult', name: '箭雨', desc: '更快集滿，每次多射倒一成四' },
  { k: 'wall', name: '城牆', desc: '城牆多撐八下；行軍時開局多帶三個兵' }
];
const UP_COST = [120, 220, 360, 540, 760];
const NUM_ZH = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const CHAPTERS = [[0, '破陣篇'], [5, '遠征篇']];
const UI = { sel: 0, mode: 'home', wipeArm: 0 };

function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function banner(txt, kind) {
  const el = $('banner'); el.className = kind || 'gold';
  el.innerHTML = '';
  if (kind === 'boss') { const s = document.createElement('small'); s.textContent = 'WARNING'; el.appendChild(s); }
  el.appendChild(document.createTextNode(txt)); replay(el, 'show');
}
function say(txt, tone) { const el = $('say'); el.textContent = txt; el.classList.toggle('alert', !!tone); replay(el, 'show'); }
function mile(txt) { const el = $('mile'); el.textContent = txt; replay(el, 'show'); sfx('milestone'); }

function starsHtml(n) { return '<em>' + '★'.repeat(n) + '</em>' + '★'.repeat(3 - n); }
function homeRender() {
  const box = $('lvls'); box.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const ch = CHAPTERS.find((c) => c[0] === i);
    if (ch) { const cap = document.createElement('div'); cap.className = 'chap'; cap.textContent = ch[1]; box.appendChild(cap); }
    const b = document.createElement('button'); const locked = i >= SV.open;
    b.className = 'lv chamfer' + (locked ? ' locked' : ''); b.setAttribute('role', 'option'); b.setAttribute('aria-selected', String(i === UI.sel));
    b.setAttribute('aria-label', '第' + NUM_ZH[i] + '關 ' + lv.name + (locked ? '（未解鎖）' : ''));
    b.innerHTML = '<b>' + (i + 1) + '</b><span class="stars">' + starsHtml(SV.stars[i]) + '</span>';
    b.addEventListener('click', () => { auInit(); sfx('click'); UI.sel = i; homeRender(); if (typeof demoStart === 'function') demoStart(i); });
    box.appendChild(b);
  });
  const lv = LEVELS[UI.sel], locked = UI.sel >= SV.open;
  $('liName').innerHTML = ''; $('liName').appendChild(document.createTextNode(lv.name));
  const tag = document.createElement('small'); tag.className = 'chamfer'; tag.style.setProperty('--cut', '4px'); tag.textContent = lv.tag; $('liName').appendChild(tag);
  $('liTip').textContent = locked ? '先打下第' + NUM_ZH[UI.sel - 1] + '關「' + LEVELS[UI.sel - 1].name + '」才能出征。' : lv.tip + '。';
  $('btnGo').disabled = locked;
  $('homeCoins').textContent = fmt(SV.coins);
}
function shopRender() {
  $('shopCoins').textContent = fmt(SV.coins);
  const ul = $('upList'); ul.innerHTML = '';
  UPS.forEach((u) => {
    const lvl = SV.up[u.k], li = document.createElement('li');
    let pips = ''; for (let i = 0; i < 5; i++) pips += '<i class="' + (i < lvl ? 'on' : '') + '"></i>';
    const h = document.createElement('h3'); h.textContent = u.name; const sp = document.createElement('span'); sp.className = 'pips'; sp.innerHTML = pips; h.appendChild(sp);
    const p = document.createElement('p'); p.textContent = u.desc;
    const b = document.createElement('button'); b.className = 'btn' + (lvl < 5 && SV.coins >= UP_COST[lvl] ? ' btn-gold' : '');
    if (lvl >= 5) { b.innerHTML = '<span>已滿</span>'; b.disabled = true; }
    else {
      b.innerHTML = '<em class="coin">' + UP_COST[lvl] + '</em>'; b.setAttribute('aria-label', '升級' + u.name + '，花費 ' + UP_COST[lvl]);
      b.addEventListener('click', () => {
        if (SV.coins < UP_COST[lvl]) { sfx('deny'); return; }
        SV.coins -= UP_COST[lvl]; SV.up[u.k]++; save(); sfx('buy'); shopRender(); homeRender();
      });
    }
    li.appendChild(h); li.appendChild(b); li.appendChild(p); ul.appendChild(li);
  });
}
function toggleSync() {
  $('tSfx').setAttribute('aria-pressed', String(SV.sfx)); $('tMus').setAttribute('aria-pressed', String(SV.mus)); $('tVib').setAttribute('aria-pressed', String(SV.vib));
  AU.sfxOn = SV.sfx; AU.musOn = SV.mus; AU.vibOn = SV.vib; auSet();
  document.querySelectorAll('#diffSeg button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.d === SV.diff)));
}
function openOpt(paused) {
  $('optTitle').textContent = paused ? '暫停' : '設定';
  $('pauseBtns').hidden = !paused; $('homeOpts').hidden = paused; $('diffSeg').hidden = paused; $('opt').hidden = false;
  UI.wipeArm = 0; $('btnWipe').textContent = '清除進度';
}
const LOSE_TIPS = [
  '先瞄倍數高的門；隊伍穿門後會散開，站對位置才能再吃到下一道門。',
  '箭雨集滿就放，放在赤潮最密的時候最划算。',
  '城牆前有漏網的敵人時，把兵砲移過去補一下。',
  '戰利品可以在「強化」換成砲速，兵多就是贏。'
];
const LOSE_TIPS_M = [
  '同一排的門只能選一道；人多的時候選乘法，人少的時候選加法。',
  '加號門會被箭射大：早一點對準它，數字漲夠了再穿過去。',
  '木桶上的數字是要射幾箭。來不及射破就別硬撞，撞一下賠一個兵。',
  '敵陣窄的時候直接繞開；繞不開就對準它，讓箭先射掉一批。'
];
// 行軍關再依這一關有什麼，多放一兩句對題的
function loseTips(idx, march) {
  if (!march) return LOSE_TIPS;
  const lv = LEVELS[idx], t = LOSE_TIPS_M.slice();
  if (lv.fortN) t.push('到橋頭堡時兵力要比它多才攻得下來，途中的援兵和乘法門別放過。');
  if (lv.track.some((e) => e.t === 'hole' || e.t === 'saw')) t.push('缺口和滾刀只佔半邊橋面：往另一邊靠，隊伍會擠成長龍鑽過去。');
  if (lv.boss === 'dragon') t.push('橋面一亮起紅色火線就往另一邊閃；等火燒過去，再回來對準赤龍放箭。', '兵越多箭越密，赤龍的血掉得越快：路上的乘法門和援兵能拿就拿。');
  return t;
}
function showResult(won, st) {
  $('resTitle').textContent = won ? (st.idx === 4 ? '天下太平' : st.idx === LEVELS.length - 1 ? '屠龍凱旋' : '大獲全勝') : st.march ? '全軍覆沒' : '城牆失守';
  $('resTitle').className = won ? '' : 'lose';
  $('resSub').textContent = '第' + NUM_ZH[st.idx] + '關 ' + LEVELS[st.idx].name;
  const stars = $('resStars'); stars.hidden = !won;
  const run = UI.resRun = (UI.resRun || 0) + 1;
  [...stars.children].forEach((s, i) => { s.className = ''; if (won && i < st.stars) { setTimeout(() => { if (UI.resRun === run && !$('result').hidden) { s.className = 'on'; sfx('star', i); } }, 350 + i * 320); } });
  $('rsKills').textContent = fmt(st.kills); $('rsArmy').textContent = fmt(st.army); $('rsLost').textContent = fmt(st.lost);
  $('rsLostL').textContent = st.march && won ? '過關兵力' : '我軍陣亡'; if (st.march && won) $('rsLost').textContent = fmt(st.left);
  $('rsTime').textContent = Math.floor(st.time / 60) + ':' + String(Math.floor(st.time % 60)).padStart(2, '0');
  $('rsCoins').textContent = '+' + fmt(st.coins);
  const tip = $('resTip'), tips = loseTips(st.idx, st.march); tip.hidden = won; if (!won) tip.textContent = tips[(Math.random() * tips.length) | 0];
  const next = $('btnNext'); next.hidden = !(won && st.idx < LEVELS.length - 1);
  $('btnAgain').firstChild.textContent = won ? '再玩一次' : '再戰';
  $('btnAgain').className = 'btn' + (won ? '' : ' btn-gold');
  $('result').hidden = false;
}
