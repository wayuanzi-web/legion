"""測公開網頁 App：本機起伺服器 → 開啟 → service worker 註冊 → 斷線重開 → 分享與安裝按鈕。"""
import asyncio, pathlib, json, subprocess, sys, time
from playwright.async_api import async_playwright
root = pathlib.Path(__file__).resolve().parent.parent
async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8765', '--bind', '127.0.0.1'], cwd=str(root), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
            pg = await ctx.new_page()
            msgs = []
            pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and 'ERR_TUNNEL' not in m.text and 'fonts.g' not in m.text else None)
            pg.on('pageerror', lambda e: msgs.append('PAGEERR ' + str(e)))
            await pg.goto('http://localhost:8765/')
            await pg.wait_for_timeout(2500)
            info = await pg.evaluate('''async () => { const reg = await navigator.serviceWorker.getRegistration(); const keys = await caches.keys(); const c = keys.length ? await (await caches.open(keys[0])).keys() : [];
              return {title: document.title, sw: !!reg, active: !!(reg && reg.active), caches: keys, cached: c.map(r => new URL(r.url).pathname), share: !!document.getElementById('btnShare'), install: !document.getElementById('btnInstall').hidden, manifest: document.querySelector('link[rel=manifest]').href, mode: window.__wj.G.mode}; }''')
            print(json.dumps(info, ensure_ascii=False))
            await pg.screenshot(path=str(root / 'shots/w_home.png'))
            await pg.click('#btnInstall'); await pg.wait_for_timeout(400)
            print('install hint:', await pg.evaluate("document.getElementById('howText').textContent"))
            await pg.screenshot(path=str(root / 'shots/w_install.png'))
            await pg.click('#howClose')
            await pg.click('#btnShare'); await pg.wait_for_timeout(400)
            print('after share tip:', await pg.evaluate("document.getElementById('liTip').textContent"))
            # 斷線後重新整理，應該還開得起來
            await ctx.set_offline(True)
            await pg.reload(); await pg.wait_for_timeout(2000)
            print('offline reload:', await pg.evaluate("({title: document.title, mode: window.__wj && window.__wj.G.mode, gl: window.__wj && window.__wj.GLR.mode})"))
            await ctx.set_offline(False)
            mf = await pg.evaluate("fetch('manifest.webmanifest').then(r => r.json())")
            print('manifest:', mf['name'], mf['display'], [i['src'] for i in mf['icons']])
            print('console:', msgs[:10])
            await b.close()
    finally:
        srv.terminate()
asyncio.run(main())
