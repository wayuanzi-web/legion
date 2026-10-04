import asyncio, sys, pathlib
from playwright.async_api import async_playwright
root = pathlib.Path(__file__).resolve().parent.parent
js = "\n".join((root/'src/parts'/f).read_text(encoding='utf8') for f in ['10-core.js','15-view.js','30-atlas.js','40-terrain.js','60-levels.js'])
W,H = 540,1170
HTML = """<body style="margin:0;background:#222;display:flex;gap:6px"><script>%s
const which = %s;
for (const i of which){ const lv=LEVELS[i]; buildRoad(lv.road); setView(%d,%d); const cv=renderTerrain(lv, i===99); document.body.appendChild(cv);}
{ const lv=LEVELS[0]; buildRoad(lv.road); setView(%d,%d); document.body.appendChild(renderTerrain(lv,true)); }
document.title='ok q0='+V.q0.toFixed(2);
</script></body>"""
async def main():
    which = sys.argv[1] if len(sys.argv)>1 else '[0,1,2,3,4]'
    n = len(eval(which))+1
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':(W+6)*n,'height':H})
        msgs=[]
        pg.on('console', lambda m: msgs.append(m.text)); pg.on('pageerror', lambda e: msgs.append('ERR '+str(e)))
        await pg.set_content(HTML % (js, which, W,H,W,H))
        print(await pg.title(), msgs)
        await pg.screenshot(path=str(root/'shots/terrain.png'))
        await b.close()
asyncio.run(main())
