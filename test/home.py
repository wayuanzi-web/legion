"""主畫面與選單截圖：python3 test/home.py [寬 高]"""
import asyncio, sys, pathlib
from playwright.async_api import async_playwright
import os
GPU_ARGS = [] if os.environ.get('WJ_GPU') == '0' else ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']      # WJ_GPU=0：有些機器加了這兩個參數截圖反而很慢
root = pathlib.Path(__file__).resolve().parent.parent
W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (390, 844)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=GPU_ARGS)
        ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); msgs = []
        pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and 'ERR_TUNNEL' not in m.text else None)
        pg.on('pageerror', lambda e: msgs.append('PAGEERR ' + str(e)))
        await pg.goto((root / 'src/dist/index.html').as_uri()); await pg.wait_for_timeout(1500)
        tag = f'{W}x{H}'
        await pg.screenshot(path=str(root / f'shots/h_{tag}_new.png'))
        await pg.evaluate("() => { const w = window.__wj; w.SV.coins = 480; w.SV.open = 8; w.SV.stars = [3,3,2,3,1,3,2,0,0,0]; }")
        lv = pg.locator('#lvls .lv')
        await lv.nth(5).click(); await pg.wait_for_timeout(1200); await pg.screenshot(path=str(root / f'shots/h_{tag}_l6.png'))
        await lv.nth(6).click(); await pg.wait_for_timeout(1200); await pg.screenshot(path=str(root / f'shots/h_{tag}_l7.png'))
        await lv.nth(9).click(); await pg.wait_for_timeout(900); await pg.screenshot(path=str(root / f'shots/h_{tag}_l10.png'))
        await pg.click('#btnShop'); await pg.wait_for_timeout(500); await pg.screenshot(path=str(root / f'shots/h_{tag}_shop.png'))
        box = await pg.evaluate("() => { const h = document.getElementById('home'); return {sh: h.scrollHeight, ch: h.clientHeight}; }")
        print(tag, box, 'console:', msgs[:8]); await b.close()
asyncio.run(main())
