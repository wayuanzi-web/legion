"""端對端：用真的點擊與拖曳走一遍 主畫面 → 第一關 → 結算 → 下一關 → 暫停 → 回主畫面。"""
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
        await pg.goto((root / 'src/dist/index.html').as_uri() + ('#2d' if '--2d' in sys.argv else ''))
        await pg.wait_for_timeout(1200)
        st = lambda: pg.evaluate('''() => { const w = window.__wj, S = w.S; return {mode:w.G.mode, demo:w.G.demo, state:S.state, t:+S.time.toFixed(1), lvl:S.idx+1, B:S.B.n, R:S.R.n, kills:S.kills, wall:S.wallHp, fort:S.fort.hp, cx:+S.cannonX.toFixed(2), audio: (window.__wj.AU && window.__wj.AU.ctx) ? window.__wj.AU.ctx.state : 'none', ft:+w.G.ft.toFixed(0), low:w.FX.low, dpr:w.G.dprCap, gl:w.GLR.mode}; }''')
        print('home', json.dumps(await st()))
        await pg.click('#btnGo'); await pg.wait_for_timeout(600)
        print('started', json.dumps(await st()))
        # 觸控拖曳（相對位移）：合成 touch 型的 pointer 事件
        await pg.evaluate('''() => { const s = document.getElementById('stage'); const ev = (type, x) => s.dispatchEvent(new PointerEvent(type, {pointerId: 7, pointerType: 'touch', clientX: x, clientY: 560, bubbles: true, cancelable: true}));
            ev('pointerdown', 150); for (let i = 1; i <= 10; i++) ev('pointermove', 150 + i * 4); ev('pointerup', 190); }''')
        s1 = await st(); print('after touch drag +40px', json.dumps(s1))
        await pg.evaluate('''() => { const s = document.getElementById('stage'); const ev = (type, x) => s.dispatchEvent(new PointerEvent(type, {pointerId: 8, pointerType: 'touch', clientX: x, clientY: 560, bubbles: true, cancelable: true}));
            ev('pointerdown', 200); for (let i = 1; i <= 30; i++) ev('pointermove', 200 - i * 6); ev('pointerup', 20); }''')
        print('after drag far left', json.dumps(await st()))
        # 滑鼠：兵砲直接跟著游標。把游標停在右邊 ×3 門再偏左一點的甜蜜點
        await pg.mouse.move(150 + 26, 560)
        for i in range(260):
            await pg.wait_for_timeout(500)
            s = await st()
            if i % 12 == 0: print('  ', json.dumps(s))
            if s['mode'] == 'result': break
            # 箭雨滿了就按
            await pg.evaluate("(() => { const b = document.getElementById('btnUlt'); if (b.classList.contains('ready')) b.click(); })()")
        print('end', json.dumps(await st()))
        vis = await pg.evaluate("({result: !document.getElementById('result').hidden, title: document.getElementById('resTitle').textContent, coins: document.getElementById('rsCoins').textContent, stars: document.querySelectorAll('#resStars .on').length, next: !document.getElementById('btnNext').hidden, save: localStorage.getItem('wanjun-pozhen-1')})")
        print('result', json.dumps(vis, ensure_ascii=False))
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=str(root / 'shots/e_result.png'))
        if vis['next']:
            await pg.click('#btnNext'); await pg.wait_for_timeout(1500)
            print('next', json.dumps(await st()))
            await pg.keyboard.press('ArrowRight'); await pg.keyboard.down('ArrowRight'); await pg.wait_for_timeout(600); await pg.keyboard.up('ArrowRight')
            print('after key right', json.dumps(await st()))
            await pg.click('#btnPause'); await pg.wait_for_timeout(300)
            a = await st(); await pg.wait_for_timeout(800); b2 = await st()
            print('paused', a['mode'], a['t'], '->', b2['t'])
            await pg.click('#tMus'); await pg.click('#btnResume'); await pg.wait_for_timeout(500)
            print('resumed', json.dumps(await st()))
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300); await pg.click('#btnQuit'); await pg.wait_for_timeout(800)
            print('home again', json.dumps(await st()))
            await pg.screenshot(path=str(root / 'shots/e_home.png'))
        print('console:', msgs[:12])
        await b.close()
asyncio.run(main())
