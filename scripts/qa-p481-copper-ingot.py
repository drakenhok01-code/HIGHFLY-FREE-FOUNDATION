#!/usr/bin/env python3
"""P4.8.1 icon-only acceptance; all six preapproved rarity frames unchanged."""
from pathlib import Path
from PIL import Image
import base64,hashlib,io,sys
assert len(sys.argv)==4
root=Path(sys.argv[1]);rarity=Path(sys.argv[2]);src=Path(sys.argv[3])
raw=base64.b64decode(src.read_text().strip(),validate=True)
assert hashlib.sha256(raw).hexdigest()=='832f4f07e35f85eb7b0662e1d58204a350a9d627eda55918a62bae52cd9c85d6'
painting=Image.open(io.BytesIO(raw)).convert('RGBA')
assert painting.size==(200,155) and painting.getpixel((0,0))[3]==0
icon=Image.open(root/'items'/'ingot_copper.webp').convert('RGBA')
assert icon.size==(256,256) and icon.getpixel((0,0))[3]==0
# Both the core and actual rarity variant must show copper, not gold.
r,g,b,a=icon.getpixel((125,113))
assert a>0 and r>g*1.15 and g>b*.85,('Copper must stay copper',r,g,b)
for grade in ['comun','poco-comun','raro','epico','legendario','mitico']:
 copper=Image.open(rarity/'items'/('ingot_copper__'+grade+'.webp')).convert('RGBA')
 canonical=Image.open(rarity/'items'/('hp_potion__'+grade+'.webp')).convert('RGBA')
 assert copper.size==canonical.size==(256,256)
 for xy in [(0,0),(4,128),(251,128),(128,4),(128,251),(19,19)]:
  c=tuple(copper.getpixel(xy));d=tuple(canonical.getpixel(xy))
  assert max(abs(v-w) for v,w in zip(c,d))<=20,(grade,xy,c,d)
 print('[HIGHFLY P4.8.1]',grade,'same original rarity border; newly painted three copper bars within frame')
print('[HIGHFLY P4.8.1 PASS] copper ingot only; 6 real rarity assets; 256x256 WebP')
