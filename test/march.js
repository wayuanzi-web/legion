// node test/march.js <level> [up] [-v]   行軍關：三種自動玩家的勝率、用時、過關時剩多少兵。
// 環境變數 N = 每種跑幾場、DIFF = 難度、BOTS = 要跑哪些自動玩家（good,casual,weak,afk,fix:<x>）
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'parts');
const files = fs.readdirSync(dir).filter((f) => /^(10|50|52|53|60|65)-.*\.js$/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  + '\nreturn {S, simInit, simStep, simUlt, botFor, LEVELS, L};';
const { S, simInit, simStep, simUlt, botFor, LEVELS } = new Function(src)();
const arg = process.argv.slice(2), li = +arg[0] - 1, upL = +(arg[1] || 0), verbose = arg.includes('-v');
const up = { rate: upL, armor: upL, hero: upL, ult: upL, wall: upL };
let s2 = 99; const rnd2 = () => { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff; };
const N = +(process.env.N || 6), lv = LEVELS[li];
for (const botName of (process.env.BOTS || 'good,casual,weak,afk').split(',')) {
  let wins = 0, tsum = 0, ssum = 0, s3 = 0, s2n = 0, peak = 0, resc = 0, worst = 0, smin = 1e9, smax = 0; const ends = [];
  for (let sd = 0; sd < N; sd++) {
    simInit(li, up, 700 + sd * 31 + li * 7, +(process.env.DIFF || 1));
    // BOTS=fix:4.4 = 整場把隊伍釘在 x=4.4 不動（箭雨照放），用來檢查「站著不動也能過」的路線
    const fixX = botName.startsWith('fix:') ? +botName.slice(4) : null;
    const bot = fixX === null ? botFor(botName, rnd2) : (dt) => { S.cannonX = fixX; const u = S.ult; if (u.charge >= u.need && !u.active && (S.front < S.sq.front + 26 || (S.boss && S.boss.fixed))) simUlt(); };
    let lastD = -1; const cz = [0, 0, 0, 0, 0, 0, 0, 0]; const CN = ['對撞', '炸／燒', '', '', '扣兵門', '撞東西', '掉洞', ''];
    if (verbose && sd === 0) S.on = (t, team, kind, x, z, y, cause) => { if (t === 'k' && team === 0) cz[cause]++; };
    // WHY=1：輸掉的場次印出兩次全滅各是怎麼死的（最後 5 秒的陣亡原因）
    const why = [], recent = [];
    if (process.env.WHY) S.on = (t, team, kind, x, z, y, cause) => {
      if (t === 'k' && team === 0) recent.push([S.time, cause]);
      if (t === 'rescue' || t === 'lose') { const c = [0, 0, 0, 0, 0, 0, 0, 0]; for (const r of recent) if (r[0] > S.time - 5) c[r[1]]++; why.push(`${t === 'rescue' ? '第一次' : '第二次'}全滅 d=${S.sq.dist.toFixed(0)} wpn${S.sq.wpn} 最多${S.maxArmy}：` + c.map((v, k) => v ? CN[k] + v : '').filter(Boolean).join(' ')); recent.length = 0; }
    };
    while (S.state === 'play' && S.time < 300) {
      bot(1 / 60); const t0 = process.hrtime.bigint(); simStep(1 / 60); const ms = Number(process.hrtime.bigint() - t0) / 1e6; if (ms > worst) worst = ms;
      if (verbose && sd === 0 && S.mode && Math.floor(S.sq.dist / 30) !== lastD) { lastD = Math.floor(S.sq.dist / 30); console.log(`   ${botName} d=${S.sq.dist.toFixed(0)} t=${S.time.toFixed(1)} army=${S.B.n} red=${S.R.n} kills=${S.kills} lost=${S.lost} wpn=${S.sq.wpn} fort=${S.fort.alive ? S.fort.hp : '-'} ult=${S.ult.uses} 陣亡原因 ${cz.map((v, k) => v ? CN[k] + v : '').filter(Boolean).join(' ')}`); cz.fill(0); }
    }
    if (S.sq && S.sq.rescue) resc++;
    if (S.state === 'won') { wins++; tsum += S.time; ssum += S.survive; if (S.survive < smin) smin = S.survive; if (S.survive > smax) smax = S.survive; if (S.survive >= lv.s3) s3++; else if (S.survive >= lv.s2) s2n++; }
    else { ends.push(S.sq ? Math.round(S.sq.dist) : '?'); if (why.length) console.log(`   ${botName} #${sd}  ` + why.join(' ｜ ')); }
    if (S.maxArmy > peak) peak = S.maxArmy;
  }
  console.log(`L${li + 1} ${lv.name} up${upL} ${botName.padEnd(6)} ${wins}/${N}` + (wins ? ` ${(tsum / wins).toFixed(0)}s 剩${(ssum / wins).toFixed(0)}兵（${smin}–${smax}） 3★${s3} 2★${s2n}` : '') + ` 最多${peak} 後軍${resc}` + (ends.length ? ` 倒在 d=${ends.join(',')}` : '') + ` ${worst.toFixed(1)}ms`);
}
