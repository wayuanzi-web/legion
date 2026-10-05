"""端對端（三）：行軍關。真的拖曳帶隊 → 自動玩家接手打完第六關 → 結算 → 下一關（第七關）→ 暫停回主畫面 →
直接開第十關打到赤龍倒下 → 結算畫面。  python3 test/e2e3.py [--2d] [--skip10]"""
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
        await pg.locator('#lvls .lv').nth(5).click(); await pg.wait_for_timeout(500)
        print('home L6', json.dumps(await st(), ensure_ascii=False))
        await pg.click('#btnGo'); await pg.wait_for_timeout(700)
        print('started', json.dumps(await st(), ensure_ascii=False))
        # 觸控拖曳（相對位移）
        await pg.evaluate('''() => { const s = document.getElementById('stage'); const ev = (type, x) => s.dispatchEvent(new PointerEvent(type, {pointerId: 7, pointerType: 'touch', clientX: x, clientY: 520, bubbles: true, cancelable: true}));
            ev('pointerdown', 150); for (let i = 1; i <= 12; i++) ev('pointermove', 150 + i * 5); ev('pointerup', 210); }''')
        await pg.wait_for_timeout(400)
        print('after drag +60px', json.dumps(await st(), ensure_ascii=False))
        await pg.keyboard.down('ArrowLeft'); await pg.wait_for_timeout(500); await pg.keyboard.up('ArrowLeft')
        print('after key left', json.dumps(await st(), ensure_ascii=False))
        await pg.mouse.move(60, 520); await pg.wait_for_timeout(300)
        print('after mouse to x=60', json.dumps(await st(), ensure_ascii=False))
        await pg.evaluate(drive)
        r6 = await play('L6', 400)
        await pg.wait_for_timeout(1200); await pg.screenshot(path=str(root / 'shots/e3_result6.png'))
        if not r6['nextHidden']:
            await pg.click('#btnNext'); await pg.wait_for_timeout(1500)
            print('next →', json.dumps(await st(), ensure_ascii=False))
            await pg.click('#btnPause'); await pg.wait_for_timeout(300); await pg.click('#btnQuit'); await pg.wait_for_timeout(800)
            print('home again', json.dumps(await st(), ensure_ascii=False))
        if '--skip10' not in sys.argv:
            await pg.evaluate("() => { const w = window.__wj; w.goHome(); }")
            await pg.locator('#lvls .lv').nth(9).click(); await pg.wait_for_timeout(400); await pg.click('#btnGo'); await pg.wait_for_timeout(600)
            await pg.evaluate(drive)
            r10 = await play('L10', 700)
            await pg.wait_for_timeout(1200); await pg.screenshot(path=str(root / 'shots/e3_result10.png'))
        print('console:', msgs[:12])
        await b.close()
asyncio.run(main())
