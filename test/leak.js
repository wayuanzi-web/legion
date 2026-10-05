// 關卡之間有沒有殘留狀態：同一份程式裡先打完（或打到一半丟下）A 關再開 B 關，戰局摘要要跟「一開始就打 B 關」完全一樣。
// node test/leak.js        全部組合（十關 × 六種前一關 × 打完／中途放棄 × 三種設定）
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'parts');
const src = fs.readdirSync(dir).filter((f) => /^(10|50|52|53|60|65)-.*\.js$/.test(f)).sort().map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  + '\nreturn {S, simInit, simStep, simUlt, botFor, LEVELS, L};';
const fresh = () => new Function(src)();
const lcg = (seed) => { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; };
const CFG = [{ diff: 1, up: 0, bot: 'casual' }, { diff: 2, up: 5, bot: 'good' }, { diff: 0, up: 3, bot: 'weak' }];
function play(G, li, cfg, tMax) {
  const { S, simInit, simStep, botFor } = G, up = { rate: cfg.up, armor: cfg.up, hero: cfg.up, ult: cfg.up, wall: cfg.up };
  simInit(li, up, 4242 + li * 17, cfg.diff); const bot = botFor(cfg.bot, lcg(77 + li)); const ev = {};
  S.on = (t) => { ev[t] = (ev[t] || 0) + 1; };
  let h = 0; const mix = (v) => { h = (Math.imul(h ^ (Math.round(v * 1000) | 0), 16777619)) >>> 0; };
  while (S.state === 'play' && S.time < (tMax || 300)) {
    bot(1 / 60); simStep(1 / 60);
    if (S.frame % 20 === 0) {
      mix(S.B.n); mix(S.R.n); mix(S.kills); mix(S.lost); mix(S.front); mix(S.cannonX); mix(S.wallHp); mix(S.fort.hp);
      for (let i = 0; i < S.B.n; i += 7) { mix(S.B.x[i]); mix(S.B.z[i]); }
      for (let i = 0; i < S.R.n; i += 11) { mix(S.R.x[i]); mix(S.R.z[i]); }
      for (const o of S.bigs) { mix(o.x); mix(o.z); mix(o.hp); }
    }
  }
  S.on = null;
  return `${S.state} t=${S.time.toFixed(3)} k=${S.kills} lost=${S.lost} B=${S.B.n} R=${S.R.n} wall=${S.wallHp} fort=${S.fort.hp} surv=${S.survive} h=${h} ev=${Object.keys(ev).sort().map((k) => k + ev[k]).join(',')}`;
}
const NL = fresh().LEVELS.length; let runs = 0, bad = 0;
for (const cfg of CFG) {
  const base = []; for (let b = 0; b < NL; b++) base.push(play(fresh(), b, cfg));
  for (const a of [9, 7, 5, 8, 6, 0]) for (const cut of [0, 31]) {      // cut：前一關打到第 31 秒就丟下（火線、放水、攻城可能正在進行）
    for (let b = 0; b < NL; b++) {
      const G = fresh(); play(G, a, cfg, cut || 0); const got = play(G, b, cfg); runs++;
      if (got !== base[b]) { bad++; if (bad <= 8) console.log(`DIFF 先打第 ${a + 1} 關${cut ? '（中途放棄）' : ''}再打第 ${b + 1} 關 [${cfg.bot} 難度${cfg.diff} 強化${cfg.up}]\n   全新：${base[b]}\n   之後：${got}`); }
    }
  }
}
console.log(`combos ${runs}, mismatches ${bad}`);
