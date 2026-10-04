#!/usr/bin/env python3
"""重新產生 App 圖示與連結預覽圖（og.png）。
需要：pip install playwright pillow，以及 Noto Serif CJK 字型。
python3 src/gen_icons.py [預覽圖要用的遊戲截圖.png]"""
import asyncio, base64, pathlib, sys
from playwright.async_api import async_playwright
root = pathlib.Path(__file__).resolve().parent
out = root.parent
js = "\n".join((root / 'parts' / f).read_text(encoding='utf8') for f in ['10-core.js', '30-atlas.js'])
PAGE = """<body style="margin:0;background:#333"><canvas id="c" width="512" height="512"></canvas><script>%s
function drawIcon(maskable) {
  const cv = document.getElementById('c'), c = cv.getContext('2d'); c.lineJoin = 'round'; c.lineCap = 'round';
  // 底：上紅下藍兩軍對峙，中間一道金色的交鋒線
  c.fillStyle = lg(c, 0, 0, 0, 512, [0, '#3b1022', 0.5, '#241a4a', 1, '#101a44']); c.fillRect(0, 0, 512, 512);
  c.fillStyle = rg(c, 256, 250, 20, 330, [0, 'rgba(255,200,90,.38)', 1, 'rgba(255,200,90,0)']); c.fillRect(0, 0, 512, 512);
  const s = maskable ? 0.8 : 1;                      // maskable 圖示要把內容縮進安全區
  c.save(); c.translate(256, 256); c.scale(s, s); c.translate(-256, -256);
  // 後排的小兵（暗一點、小一點），營造人海
  const row = (fn, y, n, sc, a, x0, dx) => { for (let i = 0; i < n; i++) { c.save(); c.globalAlpha = a; c.translate(x0 + i * dx, y); c.scale(sc, sc); c.translate(-32, -57); fn(c, i %% 4); c.restore(); } };
  row(artRed, 150, 7, 1.5, 0.55, 26, 76); row(artRed, 196, 6, 1.9, 0.8, 64, 76);
  row(artBlue, 520, 7, 1.5, 0.55, 26, 76);
  // 主角：一紅一藍
  c.save(); c.translate(330, 318); c.scale(3.7, 3.7); c.translate(-32, -57); artRed(c, 0); c.restore();
  c.save(); c.translate(178, 470); c.scale(4.3, 4.3); c.translate(-32, -57); artBlue(c, 2); c.restore();
  // 交鋒的火花
  c.save(); c.translate(262, 262); c.rotate(0.3); c.scale(2.3, 2.3); c.translate(-32, -32); c.globalAlpha = 0.95;
  c.fillStyle = '#fff3b0'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = (i & 1) ? 7 : 30; c.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } c.closePath(); c.fill(); c.restore();
  c.restore();
  if (!maskable) { c.strokeStyle = '#ffc93c'; c.lineWidth = 10; const k = 46; c.beginPath(); c.moveTo(k, 5); c.lineTo(512 - k, 5); c.lineTo(507, k); c.lineTo(507, 512 - k); c.lineTo(512 - k, 507); c.lineTo(k, 507); c.lineTo(5, 512 - k); c.lineTo(5, k); c.closePath(); c.stroke(); }
  return cv.toDataURL('image/png');
}
</script></body>""" % js
async def main():
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    import io
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 512, 'height': 512})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.set_content(PAGE)
        imgs = {}
        for name, mask in [('plain', False), ('mask', True)]:
            data = await pg.evaluate('(m) => drawIcon(m)', mask)
            imgs[name] = Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))).convert('RGBA')
        await b.close()
        if errs: print('errors', errs)
    plain = imgs['plain']
    # 切角：四個角透明，跟遊戲裡的軍牌同一個造型
    m = Image.new('L', (512, 512), 0); d = ImageDraw.Draw(m); k = 46
    d.polygon([(k, 0), (512 - k, 0), (512, k), (512, 512 - k), (512 - k, 512), (k, 512), (0, 512 - k), (0, k)], fill=255)
    cut = plain.copy(); cut.putalpha(m)
    cut.save(out / 'icon-512.png'); cut.resize((192, 192), Image.LANCZOS).save(out / 'icon-192.png')
    imgs['mask'].convert('RGB').save(out / 'icon-maskable-512.png')
    plain.convert('RGB').resize((180, 180), Image.LANCZOS).save(out / 'apple-touch-icon.png')
    # 連結預覽圖 1200×630：左邊標題、右邊一張遊戲畫面
    shot = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'og-shot.png'
    og = Image.new('RGB', (1200, 630), '#120f1c')
    if shot.exists():
        s = Image.open(shot).convert('RGB')
        bg = s.resize((1200, int(s.height * 1200 / s.width)), Image.LANCZOS)
        top = max(0, (bg.height - 630) // 3)
        bg = bg.crop((0, top, 1200, top + 630)).filter(ImageFilter.GaussianBlur(14))
        og.paste(Image.blend(bg, Image.new('RGB', (1200, 630), '#120f1c'), 0.62))
        ph = s.resize((int(s.width * 590 / s.height), 590), Image.LANCZOS)
        frame = Image.new('RGB', (ph.width + 12, ph.height + 12), '#ffc93c'); frame.paste(ph, (6, 6))
        og.paste(frame, (1200 - frame.width - 70, 14))
    d = ImageDraw.Draw(og)
    def font(sz, bold=True):
        for f in ['/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc']:
            try: return ImageFont.truetype(f, sz, index=3)
            except Exception: pass
        return ImageFont.load_default()
    d.text((84, 150), '萬軍破陣', font=font(156), fill='#ffc93c', stroke_width=6, stroke_fill='#3a2203')
    d.text((92, 104), '一 砲 轟 出 千 軍 萬 馬', font=font(34), fill='#fff0b0')
    d.text((92, 380), '拖曳兵砲 · 穿過倍增門 · 衝垮赤潮', font=font(38), fill='#f6eeda')
    d.text((92, 440), '五個關卡，手機點開就能玩', font=font(38), fill='#aea6c8')
    og.save(out / 'og.png', optimize=True)
    print('icons and og.png written to', out)
asyncio.run(main())
