"""Arrange finished generated assets for visual review; does not draw game art."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/wire-loop'
plan = json.loads((ROOT / 'wire-loop-assets.plan.json').read_text())
qc = json.loads((BASE / 'pixel-qc.json').read_text())
font_path = '/System/Library/Fonts/STHeiti Medium.ttc'
def font(size): return ImageFont.truetype(font_path, size)
INK = '#214657'; MUTED = '#6e7d7a'; PAPER = '#faf7eb'


def paste_fit(canvas, path, rect):
    image = Image.open(path).convert('RGBA')
    w, h = rect[2], rect[3]
    image.thumbnail((w, h), Image.Resampling.LANCZOS)
    canvas.paste(image, (rect[0] + (w - image.width)//2, rect[1] + (h - image.height)//2), image)


def main():
    board = Image.new('RGB', (1600, 1490), PAPER)
    d = ImageDraw.Draw(board)
    d.text((48, 35), '火线冲击 · 首版素材', font=font(42), fill=INK)
    d.text((50, 95), '13 项生图 / 透明素材与金属贴图 / 仅美术预览，尚未接入玩法', font=font(20), fill=MUTED)
    lookup = {a['slug']: a for a in qc['assets']}
    groups = [
      ['probe-master', 'handle-stem', 'start-dock', 'finish-dock'],
      ['mode-icon', 'fist-move', 'wrist-tilt', 'release-hand'],
      ['timer-plaque', 'wire-metal-strip', 'probe-metal-strip'],
    ]
    labels = {a['slug']: a['name'] for a in plan['assets']}
    for row, slugs in enumerate(groups):
        y = 148 + row * 306
        cellw = 372 if len(slugs)==4 else 501
        for col, slug in enumerate(slugs):
            x = 40 + col * (cellw + 12)
            d.rounded_rectangle((x, y, x+cellw, y+292), radius=16, fill='#efe9d8')
            path = ROOT / lookup[slug]['exports'][0]['path']
            if 'metal-strip' in slug: path = BASE / slug / 'repeat-preview.png'
            paste_fit(board, path, (x+22, y+12, cellw-44, 220))
            d.text((x+18, y+242), labels[slug], font=font(20), fill=INK)
            d.text((x+18, y+269), lookup[slug]['id'], font=font(12), fill=MUTED)
    for row, (slug, title) in enumerate([('contact-flash','碰线短闪 · 4 帧 / 280ms'),('finish-sparkles','通关星光 · 4 帧 / 440ms')]):
        y = 1080 + row * 168
        d.text((48,y+40), title, font=font(22), fill=INK)
        for i, export in enumerate(lookup[slug]['exports']):
            x = 480 + i*267
            d.rounded_rectangle((x,y,x+246,y+148),radius=12,fill='#183340')
            paste_fit(board, ROOT/export['path'],(x+45,y+5,150,132))
            d.text((x+12,y+118),str(i+1),font=font(16),fill='#b4cac6')
    d.text((50,1440),'音效 WL-S01：缺少生成凭证，尚未生成。圆环/轨道几何与手势精度需在开发阶段验证。',font=font(18),fill=MUTED)
    board.save(BASE/'contact-sheet.png',optimize=True)
    # Actual-size readability checks, not inflated thumbnails.
    checks=Image.new('RGB',(1220,1100),PAPER);draw=ImageDraw.Draw(checks)
    draw.text((30,20),'实际尺寸与透明边缘检查',font=font(28),fill=INK)
    icons=['mode-icon','fist-move','wrist-tilt','release-hand','start-dock','finish-dock']
    for row,size in enumerate([64,96,128]):
        for col,slug in enumerate(icons):
            x=20+col*200;y=70+row*340
            draw.text((x+5,y),f'{labels[slug]} · {size}px',font=font(13),fill=INK)
            for side,bg in enumerate(['#faf7eb','#183340']):
                top=y+26+side*150
                draw.rectangle((x,top,x+190,top+146),fill=bg)
                im=Image.open(ROOT/lookup[slug]['exports'][0]['path']).convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)
                checks.paste(im,(x+(190-im.width)//2,top+(146-im.height)//2),im)
    checks.save(BASE/'small-size-review.png',optimize=True)
    # Full-res frame sheet with light and dark backgrounds.
    frames=Image.new('RGB',(1120,1150),PAPER);fd=ImageDraw.Draw(frames)
    for group,slug in enumerate(['contact-flash','finish-sparkles']):
        y=group*565;fd.text((22,y+8),labels[slug]+' / 256px 原尺寸',font=font(24),fill=INK)
        for row,bg in enumerate(['#faf7eb','#183340']):
            for i,e in enumerate(lookup[slug]['exports']):
                x=20+i*275;top=y+46+row*256
                fd.rectangle((x,top,x+255,top+255),fill=bg)
                im=Image.open(ROOT/e['path']).convert('RGBA');frames.paste(im,(x,top),im)
    frames.save(BASE/'frames-review.png',optimize=True)
    print('Saved contact-sheet.png, small-size-review.png, frames-review.png')


if __name__=='__main__': main()
