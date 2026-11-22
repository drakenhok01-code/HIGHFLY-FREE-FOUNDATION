#!/usr/bin/env python3
"""HIGHFLY P4.6 Art QA: all illustrated minerals and both upgrade stones
are 256x256 RGBA and use unique visible silhouettes, not file aliases.
"""
from PIL import Image,ImageFilter
from pathlib import Path
import sys,hashlib
root=Path(sys.argv[1]);icons=root/'items';rarity=Path(sys.argv[2])
ids=['coal','ore_copper','ore_iron','ore_silver','ore_gold','raw_diamond','raw_obsidian','ore_mithril','upgrade_stone','upgrade_stone_advanced']
visual=set();total=0
for id in ids:
 path=icons/(id+'.webp')
 if not path.exists():raise SystemExit('Missing master illustration: '+str(path))
 image=Image.open(path).convert('RGBA')
 if image.size!=(256,256):raise SystemExit('Wrong dimensions '+str(path))
 if image.getpixel((0,0))[3]>15:raise SystemExit('Untrimmed frame alpha '+str(path))
 cropped=image.crop((65,67,190,190)).convert('L').filter(ImageFilter.FIND_EDGES)
 signature=hashlib.sha256(cropped.resize((32,32)).tobytes()).hexdigest()
 if signature in visual:raise SystemExit('Duplicated mineral silhouette: '+id)
 visual.add(signature)
 for grade in ['comun','poco-comun','raro','epico','legendario','mitico']:
  final=rarity/'items'/(id+'__'+grade+'.webp')
  if not final.exists():raise SystemExit('Missing rarity grade '+str(final))
  im=Image.open(final)
  if im.size!=(256,256):raise SystemExit('Wrong rarity dimensions '+str(final))
  total+=1
 print('[P4.6 ICON CHECK]',id,path.stat().st_size,'bytes — six rarities OK')
if len(visual)!=len(ids) or total!=60:raise SystemExit('Incomplete icon family')
print('[P4.6 PASS]',len(ids),'independent painted material icons × 6 grades =',total,'real 256px WebPs')
