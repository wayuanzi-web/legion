"""量 JS 端每幀花多少時間（不含 GPU）：模擬、特效、組繪圖批次。"""
import asyncio, sys, pathlib, json
from playwright.async_api import async_playwright
import os
GPU_ARGS = [] if os.environ.get('WJ_GPU') == '0' else ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']      # WJ_GPU=0：有些機器加了這兩個參數截圖反而很慢
root = pathlib.Path(__file__).resolve().parent.parent
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=GPU_ARGS)
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto((root / 'src/dist/index.html').as_uri())
        await pg.wait_for_timeout(500)
        for level, t in [(1, 20), (3, 40), (5, 32), (5, 34), (6, 60), (7, 12), (8, 72), (9, 30), (10, 66), (10, 95)]:
            r = await pg.evaluate('''([level, t]) => { const w = window.__wj, S = w.S; w.G.freeze = true; w.startLevel(level - 1); const bot = w.botFor('good');
              let guard = 0; while (S.time < t && S.state === 'play' && guard++ < 4000) w.advance(0.1, bot);
              const N = 120; let t0 = performance.now(); for (let i = 0; i < N; i++) { bot(1/60); w.simStep(1/60); } const sim = (performance.now() - t0) / N;
              t0 = performance.now(); for (let i = 0; i < N; i++) w.fxStep(1/60, 1/60); const fx = (performance.now() - t0) / N;
              w.GLR.nodraw = true; t0 = performance.now(); for (let i = 0; i < N; i++) w.renderFrame(); const batch = (performance.now() - t0) / N; w.GLR.nodraw = false;
              return {level, t: +S.time.toFixed(0), B: S.B.n, R: S.R.n, quads: w.GLR.quads, simMs: +sim.toFixed(2), fxMs: +fx.toFixed(2), batchMs: +batch.toFixed(2)}; }''', [level, t])
            print(json.dumps(r))
        print('errors', errs)
        await b.close()
asyncio.run(main())
