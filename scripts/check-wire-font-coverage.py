"""Audit existing WOFF2 coverage using Node's built-in Brotli decompressor."""
import json
import re
import subprocess
import sys
import types
from pathlib import Path

def decompress(data):
    return subprocess.run(['node','-e',"const fs=require('fs'),z=require('zlib');process.stdout.write(z.brotliDecompressSync(fs.readFileSync(0)));"],input=data,stdout=subprocess.PIPE,check=True).stdout

sys.modules['brotli']=types.SimpleNamespace(decompress=decompress)
from fontTools.ttLib import TTFont
root=Path(__file__).resolve().parent.parent
chars=set(re.findall('[\u4e00-\u9fff]',(root/'wire-loop-ui.mjs').read_text()))
coverage={}
for name in ['xiaolai/Xiaolai-Regular-subset.woff2','resource-han-rounded/ResourceHanRoundedCN-VF-subset.woff2']:
    font=TTFont(root/'assets/fonts'/name)
    supported=set(font.getBestCmap())
    missing=''.join(sorted(c for c in chars if ord(c) not in supported))
    coverage[name]={'missing':missing,'missingCount':len(missing)}
output=root/'output/playwright/wire-loop/font-coverage.json'
output.write_text(json.dumps({'scope':'wire-loop-ui CJK source literals, including comments','fallback':'existing --font-ui/--font-display system Chinese fallback','fonts':coverage},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(coverage,ensure_ascii=False))
