#!/usr/bin/env python3
"""P4.9.7 icon fix: photo-like HIGHFLY wolf pelt within the ORIGINAL
approved metallic rarity frame. No fake extra CSS border or replacement frame.
All six rarities are generated downstream by the established P4.3/P4.4 pass.
"""
import base64, hashlib, io, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

assets, dest = Path(sys.argv[1]), Path(sys.argv[2])
pieces = sorted(assets.glob('part-*.b64'))
assert len(pieces)==3, ('P497 wolf artwork must contain three source chunks',pieces)
encoded=''.join(p.read_text().strip() for p in pieces)
raw=base64.b64decode(encoded,validate=True)
assert hashlib.sha256(raw).hexdigest()=='240670d27c330ef7ed0531eea11b4cf6af44084b1caead3f283c390c626322cf', 'Wrong original wolf pelt photo file'
source=Image.open(io.BytesIO(raw)).convert('RGBA')
assert source.size==(256,256),source.size
approved=Image.open(dest/'items'/'leather.webp').convert('RGBA')
assert approved.size==(256,256)
# Replace ONLY the central leather illustration, keep the exact approved
# HIGHFLY frame; the downstream rarity pipeline recolors that real frame.
interior=Image.new('RGBA',approved.size,(22,13,41,255))
m=Image.new('L',approved.size,0)
ImageDraw.Draw(m).rounded_rectangle((38,39,218,218),radius=31,fill=255)
m=m.filter(ImageFilter.GaussianBlur(8))
out=Image.composite(interior,approved,m)
# Crisp true 256px animal skin photographed on the premium purple backdrop.
# 206px subject avoids cropping claws and provides room for the metal border.
wolf=source.resize((206,206),Image.Resampling.LANCZOS)
out.alpha_composite(wolf,(25,25))
p=dest/'items'/'wolf_pelt.webp'
out.save(p,'WEBP',quality=96,method=6)
assert Image.open(p).size==(256,256)
assert p.stat().st_size>10000,('Unexpectedly empty wolf pelt',p.stat().st_size)
print('[HIGHFLY WOLF PELT] Approved photographic 256px painting + original HIGHFLY frame: '+str(p))
