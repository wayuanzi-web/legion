"""端對端（二）：輸掉一場 → 結算 → 強化購買 → 再戰；設定裡切難度、解鎖全部、清除進度。"""
import asyncio, sys, pathlib, json
from playwright.async_api import async_playwright
root = pathlib.Path(__file__).resolve().parent.parent
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 300, 'height': 650}, device_scale_factor=1, has_touch=True)
        pg = await ctx.new_page()
        msgs = []
        pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and 'ERR_TUNNEL' not in m.text else None)
        pg.on('pageerror', lambda e: msgs.append('PAGEERR ' + str(e)))
        await pg.goto((root / 'src/dist/index.html').as_uri())
        await pg.wait_for_timeout(1000)
        st = lambda: pg.evaluate('''() => { const w = window.__wj, S = w.S; return {mode:w.G.mode, state:S.state, t:+S.time.toFixed(1), lvl:S.idx+1, kills:S.kills, wall:S.wallHp+'/'+S.wallMax, fort:S.fort.hp+'/'+S.fort.max, coins:w.SV.coins, open:w.SV.open, diff:w.SV.diff, up:JSON.stringify(w.SV.up)}; }''')
        # 設定：切到硬仗、解鎖全部
        await pg.click('#btnOpt'); await pg.wait_for_timeout(200)
        await pg.click('#diffSeg button[data-d="2"]'); await pg.click('#btnUnlock'); await pg.wait_for_timeout(300)
        print('after unlock', json.dumps(await st()))
        await pg.click('#lvls .lv:nth-child(4)'); await pg.wait_for_timeout(500)
        await pg.click('#btnGo'); await pg.wait_for_timeout(500)
        print('started L4 hard', json.dumps(await st()))
        for i in range(200):
            await pg.wait_for_timeout(500); s = await st()
            if i % 16 == 0: print('  ', json.dumps(s))
            if s['mode'] == 'result': break
        res = await pg.evaluate("({shown: !document.getElementById('result').hidden, title: document.getElementById('resTitle').textContent, tip: document.getElementById('resTip').textContent, tipHidden: document.getElementById('resTip').hidden, nextHidden: document.getElementById('btnNext').hidden, again: document.getElementById('btnAgain').textContent, coins: document.getElementById('rsCoins').textContent})")
        print('result', json.dumps(res, ensure_ascii=False))
        await pg.screenshot(path=str(root / 'shots/e_lose.png'))
        await pg.evaluate('window.__wj.SV.coins = 500')
        await pg.click('#btnUp'); await pg.wait_for_timeout(300)
        await pg.click('#upList li:nth-child(1) .btn'); await pg.click('#upList li:nth-child(1) .btn'); await pg.click('#upList li:nth-child(5) .btn'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=str(root / 'shots/e_shop.png'))
        print('after buying', json.dumps(await st()))
        await pg.click('#shop [data-close]'); await pg.wait_for_timeout(200)
        await pg.click('#btnAgain'); await pg.wait_for_timeout(1200)
        print('retry', json.dumps(await st()))
        await pg.click('#btnPause'); await pg.wait_for_timeout(200); await pg.click('#btnQuit'); await pg.wait_for_timeout(500)
        await pg.click('#btnOpt'); await pg.wait_for_timeout(200); await pg.click('#btnWipe'); await pg.wait_for_timeout(150)
        print('wipe armed text:', await pg.evaluate("document.getElementById('btnWipe').textContent"))
        await pg.click('#btnWipe'); await pg.wait_for_timeout(300)
        print('after wipe', json.dumps(await st()), await pg.evaluate("localStorage.getItem('wanjun-pozhen-1')"))
        await pg.screenshot(path=str(root / 'shots/e_home2.png'))
        print('console:', msgs[:12])
        await b.close()
asyncio.run(main())
