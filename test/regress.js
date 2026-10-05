// 回歸檢查：前五關（破陣玩法）在固定亂數種子下的戰局結果必須一字不差。
//   node test/regress.js > 檔案   改動前後各跑一次，再 diff
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'parts');
const files = fs.readdirSync(dir).filter((f) => /^(10|50|52|53|60|65)-.*\.js$/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  + '\nreturn {S, simInit, simStep, simUlt, makeBot, LEVELS, L};';
const { S, simInit, simStep, makeBot, LEVELS } = new Function(src)();
let s2 = 77; const rnd2 = () => { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff; };
for (let li = 0; li < 5; li++) for (const bot of ['good', 'casual', 'weak', 'afk']) for (const diff of [0, 1, 2]) for (const upL of [0, 3]) {
  const up = { rate: upL, armor: upL, hero: upL, ult: upL, wall: upL };
  simInit(li, up, 1234 + li * 17 + diff * 5 + upL, diff); const b = makeBot(bot, rnd2);
  let ev = 0; S.on = () => { ev++; };
  while (S.state === 'play' && S.time < 300) { b(1 / 60); simStep(1 / 60); }
  for (let k = 0; k < 120; k++) simStep(1 / 60);
  let hx = 0; for (let i = 0; i < S.R.n; i++) hx = (hx * 31 + Math.round(S.R.x[i] * 1000) + Math.round(S.R.z[i] * 1000)) | 0;
  console.log([li + 1, bot, diff, upL, S.state, S.time.toFixed(3), S.kills, S.lost, S.wallHp, S.fort.hp, S.shots, S.maxArmy, S.coinsBig, S.B.n, S.R.n, ev, hx].join(' '));
}
