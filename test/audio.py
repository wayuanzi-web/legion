"""把各種音效與配樂離線算出來，量音量，確認有聲音、不爆音。"""
import asyncio, pathlib, json
from playwright.async_api import async_playwright
root = pathlib.Path(__file__).resolve().parent.parent
JS = '''async (names) => {
  const w = window.__wj, AU = w.AU, out = {};
  const mk = (sec) => { const ctx = new OfflineAudioContext(1, 44100 * sec, 44100);
    AU.ctx = ctx; AU.out = ctx.createGain(); AU.out.gain.value = 1.5; AU.out.connect(ctx.destination);
    AU.sg = ctx.createGain(); AU.sg.connect(AU.out); AU.mg = ctx.createGain(); AU.mg.gain.value = 0.5; AU.mg.connect(AU.out);
    const n = 44100 * 1.5, buf = ctx.createBuffer(1, n, 44100), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; AU.nbuf = buf;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; const lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; AU.roarG = ctx.createGain(); AU.roarG.gain.value = 0; src.connect(lp); lp.connect(AU.roarG); AU.roarG.connect(AU.sg); src.start(); AU.roar = lp;
    Object.defineProperty(ctx, 'state', { get: () => 'running' }); AU.last = {}; return ctx; };
  const meas = async (ctx) => { const b = await ctx.startRendering(); const d = b.getChannelData(0); let pk = 0, sq = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; sq += d[i] * d[i]; } return [ +pk.toFixed(3), +Math.sqrt(sq / d.length).toFixed(4) ]; };
  AU.sfxOn = true; AU.musOn = true;
  for (const nm of names) { const ctx = mk(2.5); try { w.sfx(nm, 3); out[nm] = await meas(ctx); } catch (e) { out[nm] = 'ERR ' + e.message; } }
  // 配樂 6 秒：離線環境的 currentTime 不會走，所以用假的時鐘推進
  for (const [label, theme, menu, heat] of [['music battle', 2, false, 0.8], ['music menu', 0, true, 0]]) {
    const ctx = mk(6); let fake = 0; Object.defineProperty(ctx, 'currentTime', { get: () => fake, configurable: true });
    try { w.musStart(theme, menu); for (fake = 0; fake < 5.8; fake += 0.05) w.musStep(heat); delete ctx.currentTime; out[label] = await meas(ctx); } catch (e) { out[label] = 'ERR ' + e.message; }
  }
  // 戰場喧囂：殺敵速率 150/秒，3 秒
  { const ctx = mk(3); let fake = 0; Object.defineProperty(ctx, 'currentTime', { get: () => fake, configurable: true });
    try { for (fake = 0; fake < 2.9; fake += 1 / 60) w.auStep(1 / 60, 150, true); delete ctx.currentTime; out['battle din'] = await meas(ctx); } catch (e) { out['battle din'] = 'ERR ' + e.message; } }
  return out; }'''
NAMES = ['shot', 'gate', 'gold', 'goldin', 'gbreak', 'bad', 'wall', 'fh', 'horn', 'fortdie', 'giant', 'bigdie', 'boom', 'boom2', 'smash', 'windup', 'charge', 'hero', 'land', 'clang', 'clank', 'warning', 'roar', 'ult', 'bolt', 'mortar', 'throw', 'feed', 'built', 'click', 'buy', 'deny', 'star', 'win', 'lose0', 'lose', 'milestone']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 300, 'height': 650})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto((root / 'src/dist/index.html').as_uri())
        await pg.wait_for_timeout(600)
        r = await pg.evaluate(JS, NAMES)
        for k, v in r.items(): print(f'{k:14s} peak/rms = {v}')
        print('errors', errs)
        await b.close()
asyncio.run(main())
