"""Build same-size WebP delivery images; retain original PNG authoring files.
Requires Pillow with WebP support. Run from any directory.
"""
from pathlib import Path
from PIL import Image
import json,re
ROOT=Path(__file__).resolve().parent.parent
SOURCES=['04B-prototype-手势小狗探险MVP.html','wire-loop-ui.mjs','wire-loop-renderer.mjs','wire-loop.css']
paths=set()
for name in SOURCES:
    text=(ROOT/name).read_text()
    for ref in re.findall(r'assets/[^\s\x27\x22`<>)}]+\.(?:png|webp)',text):
        p=ROOT/Path(ref).with_suffix('.png')
        if p.is_file():paths.add(p)
characters=['bluey','bingo','grey-puppy','blue-heeler-dad','garden-girl','lilac-girl']
actions=['idle','run','jump','hover','bump','hurt','celebrate']
for c in characters:
    for a in actions:
        for i in range(1,5):paths.add(ROOT/f'assets/characters/{c}/{a}/{a}-{i}.png')
for slug in ['start-dock','finish-dock']:
    paths.add(ROOT/f'assets/wire-loop/{slug}/{slug}.png')
for slug,prefix in [('contact-flash','contact'),('finish-sparkles','finish')]:
    for i in range(1,5):paths.add(ROOT/f'assets/wire-loop/{slug}/processed/{prefix}-{i}.png')
entries=[]
for p in sorted(paths):
    dest=p.with_suffix('.webp')
    with Image.open(p) as im:
        # Keep exact canvas dimensions/alpha; no cropping or resampling.
        im.save(dest,'WEBP',quality=85,method=6,exact=True)
        size=im.size
    entries.append({'source':str(p.relative_to(ROOT)),'url':str(dest.relative_to(ROOT)),'sourceBytes':p.stat().st_size,'bytes':dest.stat().st_size,'width':size[0],'height':size[1]})
manifest={'version':1,'images':entries}
(ROOT/'runtime-images.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'runtime-images.js').write_text('window.RUNTIME_IMAGES = '+json.dumps(entries,ensure_ascii=False,separators=(',',':'))+';\n')
a=sum(e['sourceBytes'] for e in entries);b=sum(e['bytes'] for e in entries)
print(json.dumps({'images':len(entries),'pngBytes':a,'webpBytes':b,'reductionPercent':round((1-b/a)*100,1)},ensure_ascii=False))
