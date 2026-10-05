// node test/sim.js [level|all] [bot] [seeds] [up] [-v]   例：node test/sim.js all casual 3 0
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'parts');
const src = fs.readdirSync(dir).filter((f) => /^(10|50|52|53|60|65)-.*\.js$/.test(f)).sort().map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  + '\nreturn {S, simInit, simStep, simUlt, makeBot, LEVELS, L, srand, rnd};';
const G = new Function(src)();
const { S, simInit, simStep, makeBot, LEVELS } = G;
const arg = process.argv.slice(2);
const which = arg[0] || 'all', botName = arg[1] || 'casual', seeds = +(arg[2] || 3), upL = +(arg[3] || 0);
const verbose = arg.includes('-v');
const up = { rate: upL, armor: upL, hero: upL, ult: upL, wall: upL };
const lvs = which === 'all' ? LEVELS.map((_, i) => i) : [+which - 1];
let s2 = 4242; const rnd2 = () => { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff; };
for (const li of lvs) {
  const out = []; let wins = 0;
  for (let sd = 0; sd < seeds; sd++) {
    simInit(li, up, 500 + sd * 97 + li * 13);
    const bot = makeBot(botName, rnd2);
    const dt = 1 / 60; let maxR = 0, maxB = 0, worst = 0, minFront = 999, tot = 0, steps = 0;
    const red0 = S.R.n; const log = [];
    while (S.state === 'play' && S.time < 300) {
      bot(dt);
      const t0 = process.hrtime.bigint();
      simStep(dt);
      const ms = Number(process.hrtime.bigint() - t0) / 1e6; if (ms > worst) worst = ms; tot += ms; steps++;
      if (S.R.n > maxR) maxR = S.R.n; if (S.B.n > maxB) maxB = S.B.n;
      if (S.front < minFront) minFront = S.front;
      if (verbose && S.frame % 300 === 0) log.push(`  t=${S.time.toFixed(0)} front=${S.front} B=${S.B.n} R=${S.R.n} fort=${S.fort.hp} wall=${S.wallHp} k=${S.kills} ult=${S.ult.uses} big=${S.bigs.length} boss=${S.boss ? Math.round(S.boss.hp) : '-'}`);
    }
    if (S.state === 'won') wins++;
    out.push(`${S.state.padEnd(4)} t=${S.time.toFixed(0).padStart(3)} kills=${String(S.kills).padStart(5)} lost=${String(S.lost).padStart(5)} wall=${S.wallHp}/${S.wallMax} fort=${S.fort.hp} red0=${red0} maxR=${maxR} maxB=${maxB} minFront=${minFront} ult=${S.ult.uses} ms=${(tot / steps).toFixed(2)}/${worst.toFixed(1)}`);
    if (verbose) console.log(log.join('\n'));
  }
  console.log(`L${li + 1} ${LEVELS[li].name} [${botName} up${upL}] wins ${wins}/${seeds}`);
  for (const o of out) console.log('   ' + o);
}
