// 回歸檢查：固定亂數種子下，每一關的戰局結果必須一字不差。
//   node test/regress.js [起] [迄] | md5sum     預設跑全部關卡；改動共用程式前後各跑一次比對
//   前五關：node test/regress.js 1 5 | md5sum   → 99b388f42f2b81e664a2b2f49e710d82
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'parts');
const files = fs.readdirSync(dir).filter((f) => /^(10|5[0-4]|60|65)-.*\.js$/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  + '\nreturn {S, simInit, simStep, simUlt, botFor, LEVELS, L};';
const { S, simInit, simStep, botFor, LEVELS } = new Function(src)();
const a0 = +(process.argv[2] || 1) - 1, a1 = +(process.argv[3] || LEVELS.length) - 1;
let s2 = 77; const rnd2 = () => { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff; };
for (let li = a0; li <= a1; li++) for (const bot of ['good', 'casual', 'weak', 'afk']) for (const diff of [0, 1, 2]) for (const upL of [0, 3]) {
  const up = { rate: upL, armor: upL, hero: upL, ult: upL, wall: upL };
  simInit(li, up, 1234 + li * 17 + diff * 5 + upL, diff); const b = botFor(bot, rnd2);
  let ev = 0; S.on = () => { ev++; };
  while (S.state === 'play' && S.time < 300) { b(1 / 60); simStep(1 / 60); }
  for (let k = 0; k < 120; k++) simStep(1 / 60);
  let hx = 0; for (let i = 0; i < S.R.n; i++) hx = (hx * 31 + Math.round(S.R.x[i] * 1000) + Math.round(S.R.z[i] * 1000)) | 0;
  let hb = 0; for (let i = 0; i < S.B.n; i++) hb = (hb * 31 + Math.round(S.B.x[i] * 1000) + Math.round(S.B.z[i] * 1000)) | 0;
  const row = [li + 1, bot, diff, upL, S.state, S.time.toFixed(3), S.kills, S.lost, S.wallHp, S.fort.hp, S.shots, S.maxArmy, S.coinsBig, S.B.n, S.R.n, ev, hx];
  if (S.mode) row.push(S.survive, S.sq.dist.toFixed(2), hb);      // 行軍關多記過關兵力、走多遠、我軍位置
  console.log(row.join(' '));
}
