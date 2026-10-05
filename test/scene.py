"""情境測試：開某一關，凍結即時迴圈、用固定步長把戰局推到指定時間，再執行 JS 或截圖。
python3 test/scene.py <name> [--2d]   （情境寫在 SCENES 裡）"""
import asyncio, sys, pathlib, json
from playwright.async_api import async_playwright
import os
GPU_ARGS = [] if os.environ.get('WJ_GPU') == '0' else ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']      # WJ_GPU=0：有些機器加了這兩個參數截圖反而很慢
root = pathlib.Path(__file__).resolve().parent.parent
W, H = 390, 844
FULL = None
def crop(x, y, w, h): return {'x': x, 'y': y, 'width': w, 'height': h}
# step: ('t', simTime) 推進到那個時間；('adv', 秒) 再推進幾秒；('js', code)；('shot', name, clip)
SCENES = {
  'ult': (2, 'good', [('t', 9), ('js', 'S.ult.charge=S.ult.need; w.simUlt()'), ('adv', 0.35), ('shot', 'ult1', FULL), ('adv', 0.5), ('shot', 'ult2', FULL), ('adv', 0.8), ('shot', 'ult3', FULL)]),
  'hero': (1, 'good', [('t', 8), ('js', 'S.hero.t=S.hero.cd'), ('adv', 0.6), ('shot', 'hero0', FULL), ('adv', 0.9), ('shot', 'hero1', FULL), ('adv', 0.75), ('shot', 'hero2', FULL), ('adv', 0.12), ('shot', 'hero3', FULL), ('adv', 1.5), ('shot', 'hero4', FULL), ('adv', 2.6), ('shot', 'hero5', FULL)]),
  'clash': (2, 'good', [('t', 21), ('shot', 'clash', crop(70, 150, 250, 230)), ('adv', 0.1), ('shot', 'clash2', crop(70, 150, 250, 230)), ('adv', 0.1), ('shot', 'clash3', crop(70, 150, 250, 230))]),
  'l3': (3, 'good', [('t', 12), ('shot', 'l3a', FULL), ('t', 30), ('shot', 'l3b', FULL), ('t', 47), ('shot', 'l3c', FULL), ('t', 62), ('shot', 'l3d', FULL)]),
  'l4': (4, 'good', [('t', 8), ('shot', 'l4a', FULL), ('t', 22), ('shot', 'l4b', FULL), ('t', 40), ('shot', 'l4c', FULL), ('t', 60), ('shot', 'l4d', FULL)]),
  'l5': (5, 'good', [('t', 10), ('shot', 'l5a', FULL), ('t', 32), ('shot', 'l5b', FULL), ('t', 55), ('shot', 'l5c', FULL), ('t', 80), ('shot', 'l5d', FULL)]),
  'boss': (5, 'good', [('t', 3), ('js', 'S.R.n=0; S.fort.hp=3; S.fort.floor=3; S.bigs.length=0'), ('adv', 2.5), ('shot', 'boss1', FULL), ('adv', 2.6), ('shot', 'boss2', FULL), ('adv', 6), ('shot', 'boss3', FULL), ('adv', 9), ('shot', 'boss3b', FULL), ('js', 'S.boss && (S.boss.hp=30)'), ('adv', 1.2), ('shot', 'boss4', FULL), ('adv', 1.6), ('shot', 'boss5', FULL), ('adv', 3), ('shot', 'boss6', FULL)]),
  'win': (1, 'good', [('t', 20), ('js', 'S.fort.hp=40; S.fort.floor=40; S.fort.dry=true; for(let j=0;j<S.R.n;j++) if(S.R.z[j]<75) S.R.hp[j]=0;'), ('until', '!w.S.fort.alive'), ('adv', 0.1), ('shot', 'win1', FULL), ('adv', 0.5), ('shot', 'win2', FULL), ('adv', 1.2), ('shot', 'win3', FULL), ('rt', 6000), ('shot', 'win4', FULL)]),
  'lose': (2, 'afk', [('t', 16), ('shot', 'lose0', FULL), ('t', 400), ('adv', 0.5), ('shot', 'lose1', FULL), ('rt', 5000), ('shot', 'lose2', FULL)]),
  'beacon': (2, 'afk', [('until', 'w.S.burn.active'), ('adv', 0.25), ('shot', 'beacon0', FULL), ('adv', 0.3), ('shot', 'beacon1', FULL), ('adv', 0.6), ('shot', 'beacon2', FULL)]),
  'menus': (0, '', []),
  'near': (3, 'afk', [('js', 'S.hero.t=0;'), ('t', 24), ('js', 'for (const b of S.bigs) if (b.team===1) { b.z = 26; }'), ('adv', 3.5), ('shot', 'near1', FULL), ('adv', 1.4), ('shot', 'near2', FULL), ('adv', 1.5), ('shot', 'near3', FULL)]),
  'opt': (0, '', []),
  'zoom': (3, 'casual', [('t', 29), ('shot', 'zoom1', crop(40, 300, 260, 220)), ('adv', 0.15), ('shot', 'zoom2', crop(40, 300, 260, 220)), ('adv', 0.15), ('shot', 'zoom3', crop(40, 300, 260, 220))]),
  'l5full': (5, 'good', [('until', '!w.S.fort.alive'), ('adv', 1.0), ('shot', 'f_fortdie', FULL), ('adv', 2.2), ('shot', 'f_bossrise', FULL), ('adv', 8), ('shot', 'f_boss8', FULL), ('until', 'w.S.boss && w.S.boss.hp < w.S.boss.maxHp * 0.48'), ('adv', 0.6), ('shot', 'f_rage', FULL), ('until', '!w.S.boss'), ('adv', 0.3), ('shot', 'f_bossdie', FULL), ('rt', 6500), ('shot', 'f_result', FULL)]),
  'gold': (5, 'good', [('t', 31.5), ('shot', 'gold0', FULL), ('t', 33.5), ('shot', 'gold1', FULL), ('t', 35), ('shot', 'gold2', FULL)]),
  'surge': (3, 'good', [('t', 27), ('shot', 'surge0', FULL), ('t', 30), ('shot', 'surge1', FULL)]),
  'm6': (6, 'good', [('t', 1.5), ('shot', 'm6_01', FULL), ('t', 5), ('shot', 'm6_05', FULL), ('t', 9.5), ('shot', 'm6_09', FULL), ('t', 14), ('shot', 'm6_14', FULL), ('t', 19), ('shot', 'm6_19', FULL), ('t', 24), ('shot', 'm6_24', FULL), ('t', 31), ('shot', 'm6_31', FULL)]),
  'l7': (7, 'good', [('t', 3), ('shot', 'l7_03', FULL), ('until', '!w.S.rgates[0].alive'), ('adv', 0.2), ('shot', 'l7_break', FULL), ('adv', 0.6), ('shot', 'l7_break2', FULL), ('until', '!w.S.rgates[1].alive'), ('adv', 0.3), ('shot', 'l7_break3', FULL)]),
  'l9': (9, 'good', [('t', 3), ('shot', 'l9_03', FULL), ('t', 20), ('shot', 'l9_20', FULL), ('t', 26), ('until', 'w.S.flood && w.S.flood.t > 0.5 && w.S.flood.t < 0.9'), ('shot', 'l9_flood1', FULL), ('adv', 0.8), ('shot', 'l9_flood2', FULL), ('adv', 1.0), ('shot', 'l9_flood3', FULL), ('adv', 1.2), ('shot', 'l9_flood4', FULL)]),
  'm8': (8, 'good', [('t', 5), ('shot', 'm8_05', FULL), ('t', 9.5), ('shot', 'm8_09', FULL), ('t', 17), ('shot', 'm8_17', FULL), ('t', 22), ('shot', 'm8_22', FULL), ('t', 30), ('shot', 'm8_30', FULL), ('t', 38), ('shot', 'm8_38', FULL)]),
  'm10': (10, 'good', [('t', 4), ('shot', 'm10_04', FULL), ('until', 'w.S.strafes.length'), ('adv', 0.9), ('shot', 'm10_warn', FULL), ('adv', 0.75), ('shot', 'm10_fire1', FULL), ('adv', 0.3), ('shot', 'm10_fire2', FULL), ('adv', 0.5), ('shot', 'm10_fire3', FULL)]),
  'm10b': (10, 'good', [('t', 2), ('js', 'S.ti = S.track.length - 1; S.sq.dist = S.track[S.ti].d - 150; S.R.n = 0; S.bigs.length = 0; S.gates.length = 0; S.barrels.length = 0; S.holes.length = 0; S.saws.length = 0; S.sq.wpn = 2; for (let i = 0; i < 700; i++) w.addBlue(0, 4, 0, 0, 0, 0);'),
    ('adv', 6), ('shot', 'm10_come', FULL), ('until', 'w.S.boss && w.S.boss.fixed'), ('adv', 0.6), ('shot', 'm10_boss0', FULL), ('adv', 2.2), ('shot', 'm10_boss1', FULL), ('adv', 0.9), ('shot', 'm10_boss2', FULL), ('adv', 5), ('shot', 'm10_boss3', FULL),
    ('js', 'S.boss && (S.boss.hp = S.boss.maxHp * 0.4)'), ('adv', 3), ('shot', 'm10_rage', FULL), ('js', 'S.boss && (S.boss.hp = 20)'), ('until', '!w.S.boss'), ('adv', 0.3), ('shot', 'm10_die1', FULL), ('adv', 1.2), ('shot', 'm10_die2', FULL), ('rt', 6500), ('shot', 'm10_result', FULL)]),
  'm10c': (10, 'good', [('until', 'w.S.boss && w.S.boss.fixed'), ('adv', 0.5), ('shot', 'c10_arrive', FULL),
    ('until', 'w.S.strafes.length && w.S.strafes[0].t > 1.0'), ('shot', 'c10_warn', FULL), ('until', 'w.S.strafes.length && w.S.strafes[0].lit'), ('adv', 0.22), ('shot', 'c10_fire', FULL),
    ('js', 'S.hero.t = S.hero.cd'), ('adv', 1.5), ('shot', 'c10_hero1', FULL), ('adv', 0.9), ('shot', 'c10_hero2', FULL), ('adv', 1.2), ('shot', 'c10_hero3', FULL),
    ('until', 'w.S.boss && w.S.boss.rage'), ('until', 'w.S.strafes.length && w.S.strafes[0].w > 6 && w.S.strafes[0].t > 1.1'), ('shot', 'c10_rwarn', FULL),
    ('until', 'w.S.strafes.length && w.S.strafes[0].lit'), ('adv', 0.22), ('shot', 'c10_rfire', FULL), ('adv', 1.4), ('shot', 'c10_after', FULL),
    ('until', '!w.S.boss'), ('adv', 0.3), ('shot', 'c10_die1', FULL), ('adv', 1.3), ('shot', 'c10_die2', FULL)]),
  'tnt6': (6, 'good', [('until', 'w.S.sq.dist > 392'), ('shot', 't6_a', FULL), ('until', 'w.S.barrels.some((o) => o.fuse >= 0)'), ('adv', 0.05), ('shot', 't6_b', FULL), ('adv', 0.25), ('shot', 't6_c', FULL), ('adv', 0.5), ('shot', 't6_d', FULL)]),
  'tnt8': (8, 'good', [('until', 'w.S.sq.dist > 440'), ('shot', 't8_a', FULL), ('until', 'w.S.barrels.some((o) => o.fuse >= 0)'), ('adv', 0.3), ('shot', 't8_b', FULL), ('adv', 0.6), ('shot', 't8_c', FULL), ('until', 'w.S.sq.dist > 566'), ('shot', 't8_d', FULL), ('until', 'w.S.sq.siege'), ('shot', 't8_e', FULL)]),
  'hz8': (8, 'afk', [('t', 1), ('js', 'for (let i = 0; i < 300; i++) w.addBlue(0, 4, 0, 0, 0, 0)'), ('until', 'w.S.holes.length && w.S.holes[0].z < 12'), ('shot', 'hz8_a', FULL), ('adv', 0.6), ('shot', 'hz8_b', FULL), ('adv', 0.6), ('shot', 'hz8_c', FULL), ('adv', 1.2), ('shot', 'hz8_d', FULL)]),
  'hz10': (10, 'afk', [('t', 1), ('js', 'for (let i = 0; i < 400; i++) w.addBlue(0, 4, 0, 0, 0, 0)'), ('until', 'w.S.strafes.length && w.S.strafes[0].lit && w.S.strafes[0].zf < 40'), ('shot', 'hz10_a', FULL), ('adv', 0.25), ('shot', 'hz10_b', FULL), ('adv', 0.3), ('shot', 'hz10_c', FULL), ('adv', 1.2), ('shot', 'hz10_d', FULL)]),
  'saw8': (8, 'afk', [('t', 1), ('js', 'S.cannonX = 3'), ('t', 16.5), ('js', 'for (let i = 0; i < 300; i++) w.addBlue(3, 4, 0, 0, 0, 0); S.cannonX = -1'), ('until', 'w.S.saws.length && w.S.saws[0].z < 16'), ('shot', 'saw8_a', FULL), ('until', 'w.S.saws[0].z < 8'), ('shot', 'saw8_b', FULL), ('until', 'w.S.saws[0].z < 3'), ('shot', 'saw8_c', FULL), ('adv', 0.8), ('shot', 'saw8_d', FULL)]),
  'm6b': (6, 'good', [('t', 37), ('shot', 'm6_37', FULL), ('t', 44), ('shot', 'm6_44', FULL), ('t', 50), ('shot', 'm6_50', FULL), ('t', 57), ('shot', 'm6_57', FULL), ('t', 62), ('shot', 'm6_62', FULL), ('until', 'w.S.sq.siege'), ('adv', 0.5), ('shot', 'm6_siege0', FULL), ('adv', 2), ('shot', 'm6_siege1', FULL), ('adv', 2.5), ('shot', 'm6_siege2', FULL), ('until', '!w.S.fort.alive'), ('adv', 0.4), ('shot', 'm6_win', FULL), ('rt', 6000), ('shot', 'm6_result', FULL)]),
}
async def main():
    name = sys.argv[1]
    level, bot, steps = SCENES[name]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=GPU_ARGS)
        ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        msgs = []
        pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and 'ERR_TUNNEL' not in m.text else None)
        pg.on('pageerror', lambda e: msgs.append('PAGEERR ' + str(e)))
        await pg.goto((root / 'src/dist/index.html').as_uri() + ('#2d' if '--2d' in sys.argv else ''))
        await pg.wait_for_timeout(500)
        if name == 'opt':
            await pg.wait_for_timeout(800); await pg.click('#btnOpt'); await pg.wait_for_timeout(400)
            await pg.screenshot(path=str(root / 'shots/m_opt.png')); print('console:', msgs[:10]); await b.close(); return
        if name == 'menus':
            await pg.wait_for_timeout(1500)
            await pg.screenshot(path=str(root / 'shots/m_home.png'))
            await pg.evaluate("() => { const w = window.__wj; w.SV.coins = 480; w.SV.open = 3; w.SV.stars[0] = 3; w.SV.stars[1] = 2; w.SV.up.rate = 2; w.SV.up.wall = 1; }")
            await pg.click('#btnShop'); await pg.wait_for_timeout(500)
            await pg.screenshot(path=str(root / 'shots/m_shop.png'))
            await pg.click('#shop [data-close]'); await pg.wait_for_timeout(300)
            await pg.click('#btnOpt'); await pg.wait_for_timeout(400)
            await pg.screenshot(path=str(root / 'shots/m_opt.png'))
            await pg.click('#opt [data-close]'); await pg.wait_for_timeout(300)
            await pg.click('#lvls .lv:nth-child(2)'); await pg.wait_for_timeout(900)
            await pg.screenshot(path=str(root / 'shots/m_home2.png'))
            await pg.click('#lvls .lv:nth-child(5)'); await pg.wait_for_timeout(900)
            await pg.screenshot(path=str(root / 'shots/m_home5.png'))
            await pg.click('#lvls .lv:nth-child(2)'); await pg.click('#btnGo'); await pg.wait_for_timeout(650)
            await pg.screenshot(path=str(root / 'shots/m_start.png'))
            await pg.click('#btnPause'); await pg.wait_for_timeout(400)
            await pg.screenshot(path=str(root / 'shots/m_pause.png'))
            print('console:', msgs[:10]); await b.close(); return
        await pg.evaluate(f'''() => {{ const w = window.__wj; w.G.freeze = true; w.startLevel({level - 1}); w._bot = w.botFor('{bot}'); }}''')
        for st in steps:
            if st[0] == 't':
                await pg.evaluate('(t) => { const w = window.__wj; let guard = 0; while (w.S.time < t && w.S.state === "play" && guard++ < 4000) w.advance(0.1, w._bot); }', st[1])
            elif st[0] == 'until':
                await pg.evaluate('(c) => { const w = window.__wj; let guard = 0; const f = new Function("w", "return " + c); while (!f(w) && w.S.state === "play" && guard++ < 6000) w.advance(0.05, w._bot); }', st[1])
            elif st[0] == 'adv':
                if st[1] > 0: await pg.evaluate('(s) => { const w = window.__wj; w.advance(s, w._bot); }', st[1])
            elif st[0] == 'rt':      # 放開凍結，讓即時迴圈跑一段（測結算畫面）
                await pg.evaluate('window.__wj.G.freeze = false'); await pg.wait_for_timeout(st[1]); await pg.evaluate('window.__wj.G.freeze = true')
            elif st[0] == 'js':
                await pg.evaluate('() => { const w = window.__wj, S = w.S; ' + st[1] + ' }')
            elif st[0] == 'shot':
                kw = {'clip': st[2]} if st[2] else {}
                await pg.wait_for_timeout(200)
                await pg.screenshot(path=str(root / f'shots/s_{st[1]}.png'), **kw)
                info = await pg.evaluate('''() => { const w = window.__wj, S = w.S; return {t:+S.time.toFixed(1), state:S.state, mode:w.G.mode, B:S.B.n, R:S.R.n, kills:S.kills, front:S.front, fort:S.fort.hp, wall:S.wallHp, dist: S.sq ? Math.round(S.sq.dist) : null, bigs:S.bigs.map(b=>b.kind+':'+Math.round(b.hp)+':'+b.st), quads:w.GLR.quads, atlasY: w.AT.py + w.AT.rowH}; }''')
                print(st[1], json.dumps(info))
        print('console:', msgs[:10])
        await b.close()
asyncio.run(main())
