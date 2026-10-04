"""用無頭瀏覽器開遊戲、自動玩、截圖。
python3 test/play.py <level 1-5> <bot> <shots: t1,t2,...> [--w 390 --h 844] [--2d]"""
import asyncio, sys, pathlib, json
from playwright.async_api import async_playwright
root = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]
def opt(name, d):
    return type(d)(args[args.index(name)+1]) if name in args else d
level = int(args[0]) if args and args[0].isdigit() else 1
bot = args[1] if len(args) > 1 and not args[1].startswith('-') else 'good'
times = [float(x) for x in (args[2] if len(args) > 2 and not args[2].startswith('-') else '3,8,15').split(',')]
W, H = opt('--w', 390), opt('--h', 844)
tag = opt('--tag', 'p')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        msgs = []
        pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: msgs.append('PAGEERR ' + str(e)))
        url = (root / 'src/dist/index.html').as_uri() + ('#2d' if '--2d' in args else '')
        await pg.goto(url)
        await pg.wait_for_timeout(700)
        print('mode', await pg.evaluate('window.__wj.GLR.mode'), 'view', await pg.evaluate('[__wj.V.W, __wj.V.H, +__wj.V.q0.toFixed(2)]'))
        if '--home' in args:
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=str(root / f'shots/{tag}_home.png'))
        await pg.evaluate(f'''() => {{ const w = window.__wj; w.startLevel({level - 1}); w._bot = w.makeBot('{bot}'); w._auto = true;
            const st = w.G; // 讓自動玩家每幀先動
            w._iv = setInterval(() => {{ if (w.S.state === 'play' && w.G.mode === 'play') w._bot(1/60 * 2); }}, 16); }}''')
        last = 0
        for t in times:
            # 等到模擬時間到 t
            for _ in range(400):
                cur = await pg.evaluate('window.__wj.S.time')
                st = await pg.evaluate('window.__wj.S.state')
                if cur >= t or st != 'play': break
                await pg.wait_for_timeout(100)
            await pg.screenshot(path=str(root / f'shots/{tag}_L{level}_{int(t):03d}.png'))
            info = await pg.evaluate('''() => { const w = window.__wj, S = w.S; return {t:+S.time.toFixed(1), state:S.state, B:S.B.n, R:S.R.n, kills:S.kills, front:S.front, fort:S.fort.hp, wall:S.wallHp, quads:w.GLR.quads, ft:+w.G.ft.toFixed(1), low:w.FX.low, dpr:w.G.dprCap}; }''')
            print(json.dumps(info))
        print('console:', msgs[:12])
        await b.close()
asyncio.run(main())
