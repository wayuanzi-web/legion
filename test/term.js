// 全面檢查：每一關 × 四種自動玩家 × 三種難度 × 兩種強化，確認 300 秒內分出勝負、沒有 NaN、人數不爆表
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'parts');
const src = ['10-core.js', '50-sim.js', '60-levels.js', '65-bot.js'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  + '\nreturn {S, simInit, simStep, simUlt, makeBot, LEVELS, L};';
const { S, simInit, simStep, makeBot, LEVELS } = new Function(src)();
let s2 = 5; const rnd2 = () => { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff; };
let runs = 0, bad = 0, won = 0, maxR = 0, maxB = 0, longest = 0; const evs = {};
for (let li = 0; li < 5; li++) for (const bot of ['good', 'casual', 'weak', 'afk']) for (const diff of [0, 1, 2]) for (const upL of [0, 5]) for (let sd = 0; sd < 2; sd++) {
  const up = { rate: upL, armor: upL, hero: upL, ult: upL, wall: upL };
  simInit(li, up, 31 + sd * 7 + li, diff); const b = makeBot(bot, rnd2); runs++;
  let dryEv = 0, fortDie = 0, bossEv = 0, lateBig = 0;
  S.on = (t, a) => { if (t === 'dry') dryEv++; if (t === 'fortdie') fortDie++; if (t === 'boss') bossEv++; if (t === 'big' && (S.fort.dry || !S.fort.alive)) lateBig++; };
  while (S.state === 'play' && S.time < 300) {
    b(1 / 60); simStep(1 / 60);
    if (S.R.n > maxR) maxR = S.R.n; if (S.B.n > maxB) maxB = S.B.n;
    if (S.frame % 30 === 0) {
      for (const sw of [S.B, S.R]) for (let i = 0; i < sw.n; i++) if (!(sw.x[i] === sw.x[i]) || !(sw.z[i] === sw.z[i]) || !isFinite(sw.x[i]) || !isFinite(sw.z[i])) { bad++; console.log('NaN', li, bot, diff, S.time); i = sw.n; }
      for (const o of S.bigs) if (!isFinite(o.x) || !isFinite(o.z) || o.z > 110) { bad++; console.log('big out of range', o.kind, o.x, o.z); }
    }
  }
  if (S.state === 'play') { bad++; console.log('NOT FINISHED', li + 1, bot, diff, upL); }
  if (S.state === 'won') { won++; if (!dryEv && fortDie) { /* 兵力被我軍直接打穿也要算 dry */ } }
  if (fortDie > 1 || bossEv > 1 || lateBig > 0) { bad++; console.log('event anomaly', li + 1, bot, diff, { fortDie, bossEv, lateBig }); }
  for (let k = 0; k < 240; k++) simStep(1 / 60);       // 結束後再跑 4 秒不該出事
  if (S.time > longest && S.state !== 'play') longest = S.time - 4;
}
console.log(`runs ${runs}, won ${won}, problems ${bad}, max reds ${maxR}, max blues ${maxB}, longest ${longest.toFixed(0)}s`);
