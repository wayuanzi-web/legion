// node test/trace.js <level> [bot] [up] [diff]   破陣關每 4 秒印一行：戰線、兩軍人數、城牆、敵城兵力、機關狀態
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'parts');
const src = fs.readdirSync(dir).filter((f) => /^(10|50|52|53|60|65)-.*\.js$/.test(f)).sort().map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  + '\nreturn {S, simInit, simStep, simUlt, botFor, LEVELS, L};';
const { S, simInit, simStep, botFor } = new Function(src)();
const arg = process.argv.slice(2), li = +arg[0] - 1, upL = +(arg[2] || 0);
simInit(li, { rate: upL, armor: upL, hero: upL, ult: upL, wall: upL }, 4321, +(arg[3] || 1));
const bot = botFor(arg[1] || 'good'); let floods = 0, fk = 0;
S.on = (t, a) => { if (t === 'flood') floods++; if (t === 'floodend') fk += a; };
while (S.state === 'play' && S.time < 300) {
  bot(1 / 60); simStep(1 / 60);
  if (S.frame % 240 === 0) console.log(`t=${S.time.toFixed(0).padStart(3)} front=${String(S.front).padStart(3)} B=${String(S.B.n).padStart(4)} R=${String(S.R.n).padStart(5)} wall=${S.wallHp}/${S.wallMax} fort=${S.fort.hp} kills=${S.kills} lost=${S.lost} ult=${S.ult.uses}` +
    (S.rgates.length ? ' 赤門 ' + S.rgates.map((g) => g.alive ? g.hp : '破').join('/') : '') + (S.peds.length ? ' 石座 ' + S.peds.map((p) => p.kind[0] + (p.built ? '✓' : p.got + '/' + p.need)).join(' ') : '') + (floods ? ` 放水${floods}次沖走${fk}` : '') + (S.bigs.length ? ' 大 ' + S.bigs.map((b) => b.kind[0] + Math.round(b.hp)).join(',') : ''));
}
console.log(S.state, S.time.toFixed(0) + 's', 'wall', S.wallHp + '/' + S.wallMax, 'kills', S.kills, 'lost', S.lost);
