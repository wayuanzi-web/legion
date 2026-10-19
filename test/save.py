"""舊存檔相容：五關版、十關版的存檔讀進十六關版之後，該開的關卡有沒有開。
python3 test/save.py"""
import asyncio, json, pathlib
from playwright.async_api import async_playwright
import os
GPU_ARGS = [] if os.environ.get('WJ_GPU') == '0' else ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']      # WJ_GPU=0：有些機器加了這兩個參數截圖反而很慢
root = pathlib.Path(__file__).resolve().parent.parent
CASES = [
    ('破完第五關的舊存檔', {'coins': 900, 'stars': [3, 3, 2, 1, 1], 'open': 5, 'up': {'rate': 2, 'armor': 1, 'hero': 0, 'ult': 0, 'wall': 3}, 'sfx': True, 'mus': False, 'vib': True, 'seen': True, 'ultSeen': True, 'kills': 12345, 'diff': 2}, 6),
    ('第五關剛解鎖、還沒破', {'coins': 10, 'stars': [3, 3, 2, 1, 0], 'open': 5, 'up': {'rate': 0, 'armor': 0, 'hero': 0, 'ult': 0, 'wall': 0}, 'seen': True, 'kills': 50, 'diff': 1}, 5),
    ('只打過第一關', {'coins': 0, 'stars': [2], 'open': 2}, 2),
    ('壞掉的存檔', 'not json', 1),
    ('十關版存檔', {'coins': 5, 'stars': [3, 3, 3, 3, 3, 2, 1, 0, 0, 0], 'open': 8, 'seenM': True}, 8),
    ('十關版破完第十關', {'coins': 2000, 'stars': [3, 3, 3, 3, 3, 3, 2, 3, 2, 1], 'open': 10, 'seenM': True, 'up': {'rate': 3, 'armor': 2, 'hero': 2, 'ult': 1, 'wall': 2}}, 11),
    ('十關版第十關還沒破', {'coins': 30, 'stars': [3, 3, 3, 3, 3, 3, 2, 3, 2, 0], 'open': 10}, 10),
]
NL, CH = 16, [0, 5, 10, 16]      # 關卡數、每一篇從第幾關開始
async def main():
    bad = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(args=GPU_ARGS)
        for name, sv, want in CASES:
            ctx = await b.new_context(viewport={'width': 390, 'height': 844})
            await ctx.add_init_script("try { localStorage.setItem('wanjun-pozhen-1', %s); } catch (e) {}" % json.dumps(sv if isinstance(sv, str) else json.dumps(sv)))
            pg = await ctx.new_page(); msgs = []
            pg.on('pageerror', lambda e: msgs.append('PAGEERR ' + str(e)))
            await pg.goto((root / 'src/dist/index.html').as_uri()); await pg.wait_for_timeout(700)
            r = await pg.evaluate("() => { const w = window.__wj; return {open: w.SV.open, stars: w.SV.stars, coins: w.SV.coins, up: w.SV.up, diff: w.SV.diff, tiles: [...document.querySelectorAll('#lvls .lv')].map((e) => e.classList.contains('locked') ? 0 : 1).join('')}; }")
            # 主畫面顯示的是最後一個打得到的關卡所在的那一篇
            c = max(k for k in range(3) if CH[k] <= want - 1); exp = ''.join('1' if i < want else '0' for i in range(CH[c], CH[c + 1]))
            ok = r['open'] == want and len(r['stars']) == NL and r['tiles'] == exp and not msgs
            if not ok: bad += 1
            print('OK ' if ok else 'BAD', name, json.dumps(r, ensure_ascii=False), msgs)
            await ctx.close()
        await b.close()
    print('problems', bad)
asyncio.run(main())
