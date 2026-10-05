// 全面檢查：每一關 × 四種自動玩家 × 三種難度 × 兩種強化 × 兩個亂數種子，
// 確認 300 秒內分出勝負、座標沒有 NaN、人數不爆表、該只發生一次的事件沒有重複
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'parts');
const src = fs.readdirSync(dir).filter((f) => /^(10|50|52|53|60|65)-.*\.js$/.test(f)).sort().map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  + '\nreturn {S, simInit, simStep, simUlt, botFor, LEVELS, L};';
const { S, simInit, simStep, botFor, LEVELS } = new Function(src)();
let s2 = 5; const rnd2 = () => { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff; };
const only = process.argv[2] ? +process.argv[2] - 1 : -1;
let runs = 0, bad = 0, won = 0, maxR = 0, maxB = 0, longest = 0, worst = 0; const perLv = [];
for (let li = 0; li < LEVELS.length; li++) {
  if (only >= 0 && li !== only) continue;
  let lw = 0, ln = 0, lt = 0;
  for (const bot of ['good', 'casual', 'weak', 'afk']) for (const diff of [0, 1, 2]) for (const upL of [0, 5]) for (let sd = 0; sd < 2; sd++) {
    const up = { rate: upL, armor: upL, hero: upL, ult: upL, wall: upL };
    simInit(li, up, 31 + sd * 7 + li, diff); const b = botFor(bot, rnd2); runs++; ln++;
    const once = { dry: 0, fortdie: 0, boss: 0, dragon: 0, win: 0, lose: 0, siege: 0, rescue: 0 }; let lateBig = 0;
    S.on = (t) => { if (t in once) once[t]++; if (t === 'big' && !S.mode && (S.fort.dry || !S.fort.alive)) lateBig++; };
    const chk = () => {
      for (const sw of [S.B, S.R]) for (let i = 0; i < sw.n; i++) if (!isFinite(sw.x[i]) || !isFinite(sw.z[i]) || !isFinite(sw.y[i])) { bad++; console.log('NaN', li + 1, bot, diff, S.time.toFixed(1)); return; }
      for (const o of S.bigs) if (!isFinite(o.x) || !isFinite(o.z) || o.z > 200 || !isFinite(o.hp)) { bad++; console.log('big out of range', li + 1, o.kind, o.x, o.z, o.hp); }
      if (S.mode && (!isFinite(S.sq.x) || !isFinite(S.sq.dist) || !isFinite(S.sq.a) || !isFinite(S.sq.b))) { bad++; console.log('squad NaN', li + 1, bot); }
      for (const g of S.gates) if (!isFinite(g.x) || !isFinite(g.z) || (g.add !== undefined && !isFinite(g.add))) { bad++; console.log('gate NaN', li + 1); }
    };
    while (S.state === 'play' && S.time < 300) {
      b(1 / 60); const t0 = process.hrtime.bigint(); simStep(1 / 60); const ms = Number(process.hrtime.bigint() - t0) / 1e6; if (ms > worst && S.frame > 120) worst = ms;
      if (S.R.n > maxR) maxR = S.R.n; if (S.B.n > maxB) maxB = S.B.n;
      if (S.frame % 30 === 0) chk();
    }
    if (S.state === 'play') { bad++; console.log('NOT FINISHED', li + 1, bot, diff, upL, S.mode ? 'dist ' + S.sq.dist.toFixed(0) : 'front ' + S.front); }
    if (S.state === 'won') { won++; lw++; }
    lt += S.time;
    for (const k of ['dry', 'fortdie', 'boss', 'dragon', 'siege', 'rescue', 'win', 'lose']) if (once[k] > 1) { bad++; console.log('event repeated', li + 1, bot, diff, k, once[k]); }
    if (once.win + once.lose !== (S.state === 'play' ? 0 : 1) || lateBig > 0) { bad++; console.log('event anomaly', li + 1, bot, diff, JSON.stringify(once), lateBig); }
    for (let k = 0; k < 240; k++) simStep(1 / 60);       // 結束後再跑 4 秒不該出事
    chk();
    if (S.time - 4 > longest) longest = S.time - 4;
  }
  perLv.push(`L${li + 1} ${lw}/${ln} 平均${(lt / ln).toFixed(0)}s`);
}
console.log(perLv.join(' | '));
console.log(`runs ${runs}, won ${won}, problems ${bad}, max reds ${maxR}, max blues ${maxB}, longest ${longest.toFixed(0)}s, worst step ${worst.toFixed(1)}ms`);
