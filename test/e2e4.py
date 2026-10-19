"""端對端（四）：天下篇。解鎖後切到「天下篇」分頁 → 自動玩家打完第十三關（風沙）→ 結算 → 下一關（第十四關）→ 暫停回主畫面 →
直接開第十六關打到帝王巨像倒下 → 結算畫面（標題「天下一統」，沒有「下一關」）。  python3 test/e2e4.py [--2d] [--skip16]"""
import asyncio, sys, pathlib, json
from playwright.async_api import async_playwright
import os
GPU_ARGS = [] if os.environ.get('WJ_GPU') == '0' else ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']      # WJ_GPU=0：有些機器加了這兩個參數截圖反而很慢
root = pathlib.Path(__file__).resolve().parent.parent
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=GPU_ARGS + ['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 300, 'height': 650}, device_scale_factor=1, has_touch=True)
        pg = await ctx.new_page(); msgs = []
        pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and 'ERR_TUNNEL' not in m.text else None)
        pg.on('pageerror', lambda e: msgs.append('PAGEERR ' + str(e)))
        await pg.goto((root / 'src/dist/index.html').as_uri() + ('#2d' if '--2d' in sys.argv else ''))
        await pg.wait_for_timeout(1000)
        st = lambda: pg.evaluate('''() => { const w = window.__wj, S = w.S, q = S.sq; return {mode:w.G.mode, state:S.state, t:+S.time.toFixed(1), lvl:S.idx+1, march:S.mode, B:S.B.n, R:S.R.n, kills:S.kills, cx:+S.cannonX.toFixed(2), sqx: q ? +q.x.toFixed(2) : null, dist: q ? Math.round(q.dist) : null, fort:S.fort.alive ? S.fort.hp : null, boss: S.boss ? Math.round(S.boss.hp) : null, hud: document.getElementById('wallLbl').textContent + ' ' + document.getElementById('wallNum').textContent + ' / ' + document.getElementById('tugB').textContent + ' vs ' + document.getElementById('tugR').textContent + document.getElementById('tugRl').textContent, hint: !document.getElementById('hint').hidden, ft:+w.G.ft.toFixed(0), gl:w.GLR.mode}; }''')
        drive = '''() => { const w = window.__wj; clearInterval(w._drv); w._bot = w.botFor('good'); w._drv = setInterval(() => { if (w.G.mode === 'play' && w.S.state === 'play') { w._bot(1 / 30); if (w.S.ult.charge >= w.S.ult.need) document.getElementById('btnUlt').click(); } }, 33); }'''
        async def play(tag, limit):
            for i in range(limit):
                await pg.wait_for_timeout(500); s = await st()
                if i % 20 == 0: print('  ', json.dumps(s, ensure_ascii=False))
                if s['mode'] == 'result': break
            s = await st(); print(tag, 'end', json.dumps(s, ensure_ascii=False))
            res = await pg.evaluate("({shown: !document.getElementById('result').hidden, title: document.getElementById('resTitle').textContent, sub: document.getElementById('resSub').textContent, stars: document.querySelectorAll('#resStars .on').length, lostLbl: document.getElementById('rsLostL').textContent, lostVal: document.getElementById('rsLost').textContent, coins: document.getElementById('rsCoins').textContent, nextHidden: document.getElementById('btnNext').hidden, tip: document.getElementById('resTip').hidden ? '' : document.getElementById('resTip').textContent, save: localStorage.getItem('wanjun-pozhen-1')})")
            print(tag, 'result', json.dumps(res, ensure_ascii=False)); return res
        await pg.click('#btnOpt'); await pg.wait_for_timeout(200); await pg.click('#btnUnlock'); await pg.wait_for_timeout(300)
        await pg.locator('#chaps button').nth(2).click(); await pg.wait_for_timeout(400)      # 天下篇
        tabs = await pg.evaluate("[...document.querySelectorAll('#chaps button')].map((b) => b.getAttribute('aria-selected') + ':' + b.textContent).join(' | ')")
        tiles = await pg.evaluate("[...document.querySelectorAll('#lvls .lv b')].map((b) => b.textContent).join(',')")
        print('tabs', tabs, 'tiles', tiles)
        await pg.locator('#lvls .lv').nth(2).click(); await pg.wait_for_timeout(500)
        print('home L13', json.dumps(await st(), ensure_ascii=False), await pg.evaluate("document.getElementById('liName').textContent"))
        await pg.click('#btnGo'); await pg.wait_for_timeout(700)
        print('started', json.dumps(await st(), ensure_ascii=False))
        await pg.evaluate(drive)
        r13 = await play('L13', 500)
        await pg.wait_for_timeout(1200); await pg.screenshot(path=str(root / 'shots/e4_result13.png'))
        if not r13['nextHidden']:
            await pg.click('#btnNext'); await pg.wait_for_timeout(1500)
            print('next →', json.dumps(await st(), ensure_ascii=False))
            await pg.click('#btnPause'); await pg.wait_for_timeout(300); await pg.click('#btnQuit'); await pg.wait_for_timeout(800)
            print('home again', json.dumps(await st(), ensure_ascii=False), await pg.evaluate("[...document.querySelectorAll('#chaps button')].map((b) => b.getAttribute('aria-selected')).join(',')"))
        if '--skip16' not in sys.argv:
            await pg.evaluate("() => { const w = window.__wj; w.goHome(); }")
            await pg.locator('#chaps button').nth(2).click(); await pg.wait_for_timeout(300)
            await pg.locator('#lvls .lv').nth(5).click(); await pg.wait_for_timeout(400); await pg.click('#btnGo'); await pg.wait_for_timeout(600)
            await pg.evaluate(drive)
            r16 = await play('L16', 900)
            await pg.wait_for_timeout(1200); await pg.screenshot(path=str(root / 'shots/e4_result16.png'))
        print('console:', msgs[:12])
        await b.close()
asyncio.run(main())
