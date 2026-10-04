// node test/sweep1.js <level> <up> <flow[:speedMul[:giantMul]]...>  單一關卡：掃流量／行軍速度，看三種自動玩家的勝率／用時／城牆
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'parts');
const src = ['10-core.js', '50-sim.js', '60-levels.js', '65-bot.js'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  + '\nreturn {S, simInit, simStep, simUlt, makeBot, LEVELS, L};';
const G = new Function(src)();
const { S, simInit, simStep, makeBot, LEVELS } = G;
const arg = process.argv.slice(2);
const li = +arg[0] - 1, upL = +(arg[1] || 0), specs = arg.slice(2);
const up = { rate: upL, armor: upL, hero: upL, ult: upL, wall: upL };
let s2 = 99; const rnd2 = () => { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff; };
const lv = LEVELS[li], base = { flow: lv.flow, fort: lv.fort, script: lv.script, vC: lv.vC, vP: lv.vP, giantHp: lv.giantHp };
const N = +(process.env.N || 6);
for (const spec of specs.length ? specs : [String(lv.flow)]) {
  const [Fs, vm, gm] = spec.split(':'); const F = +Fs, vmul = +(vm || 1), gmul = +(gm || 1);
  const sc = F / base.flow;
  lv.flow = F; lv.fort = Math.round(base.fort * sc); lv.vC = base.vC * vmul; lv.vP = base.vP * vmul; if (base.giantHp) lv.giantHp = base.giantHp * gmul;
  const row = [];
  for (const botName of ['good', 'casual', 'weak']) {
    let wins = 0, tsum = 0, wsum = 0, ks = 0, s3 = 0;
    for (let sd = 0; sd < N; sd++) {
      simInit(li, up, 700 + sd * 31 + li * 7, +(process.env.DIFF || 1));
      const bot = makeBot(botName, rnd2);
      while (S.state === 'play' && S.time < 260) { bot(1 / 60); simStep(1 / 60); }
      if (S.state === 'won') { wins++; tsum += S.time; wsum += S.wallHp / S.wallMax; ks += S.kills; if (S.wallHp / S.wallMax >= 0.8) s3++; }
    }
    row.push(`${botName} ${wins}/${N}` + (wins ? ` ${(tsum / wins).toFixed(0)}s w${(wsum / wins * 100).toFixed(0)}% 3★${s3}` : ''));
  }
  console.log(`L${li + 1} flow=${F} v×${vmul} g×${gmul} fort=${lv.fort} up${upL}:  ` + row.join(' | '));
}
