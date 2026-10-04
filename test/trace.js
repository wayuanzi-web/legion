// node test/trace.js <level> <bot> <flow|-> <up> [every=5]  逐段印出戰況
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'parts');
const src = ['10-core.js', '50-sim.js', '60-levels.js', '65-bot.js'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  + '\nreturn {S, simInit, simStep, simUlt, makeBot, LEVELS, L};';
const G = new Function(src)();
const { S, simInit, simStep, makeBot, LEVELS } = G;
const a = process.argv.slice(2), li = +a[0] - 1, botName = a[1] || 'good', upL = +(a[3] || 0), every = +(a[4] || 5);
const lv = LEVELS[li];
if (a[2] && a[2] !== '-') { const sc = +a[2] / lv.flow; lv.flow = +a[2]; lv.fort = Math.round(lv.fort * sc); }
const up = { rate: upL, armor: upL, hero: upL, ult: upL, wall: upL };
simInit(li, up, 777);
const bot = makeBot(botName, Math.random);
let lastK = 0, lastShots = 0, born = 0, lastBorn = 0;
const ev0 = {};
S.on = (t, x) => { ev0[t] = (ev0[t] || 0) + 1; if (t === 'g') born += arguments.length; };
let made = 0; const origOn = S.on;
S.on = function (t, g, x, z, m) { ev0[t] = (ev0[t] || 0) + 1; if (t === 'g') made += m; };
while (S.state === 'play' && S.time < 260) {
  bot(1 / 60); simStep(1 / 60);
  if (S.frame % (60 * every) === 0) {
    const dk = S.kills - lastK, ds = S.shots - lastShots, dm = made - lastBorn;
    console.log(`t=${String(S.time.toFixed(0)).padStart(3)} front=${String(S.front).padStart(3)} B=${String(S.B.n).padStart(4)} R=${String(S.R.n).padStart(4)} fort=${String(S.fort.hp).padStart(4)} wall=${String(S.wallHp).padStart(2)} kills/s=${(dk / every).toFixed(0).padStart(3)} blue/s=${((ds + dm) / every).toFixed(0).padStart(3)} (x${((ds + dm) / ds).toFixed(1)}) cannonX=${S.cannonX.toFixed(1)} bigs=${S.bigs.map((b) => b.kind[0] + Math.round(b.hp)).join(',')} surge=${S.surge.on > 0 ? 'ON' : '-'} ult=${S.ult.uses}`);
    lastK = S.kills; lastShots = S.shots; lastBorn = made;
  }
}
console.log(S.state, 't=' + S.time.toFixed(0), 'kills', S.kills, 'lost', S.lost, 'wall', S.wallHp, JSON.stringify(ev0));
