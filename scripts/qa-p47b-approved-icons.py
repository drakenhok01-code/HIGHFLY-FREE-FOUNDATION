#!/usr/bin/env python3
"""P47B acceptance of 12 original painted icons in six ACTUAL in-app frames."""
from pathlib import Path
from PIL import Image
import sys
import numpy as np

root=Path(sys.argv[1]);src=Image.open(sys.argv[2]).convert('RGB')
rarity=Path(sys.argv[3])
assert src.size==(1024,768)
ids=['coal','ore','ore_copper','ore_iron','ore_silver','ore_gold',
     'raw_diamond','raw_obsidian','upgrade_stone','upgrade_stone_advanced','ingot_copper','ore_mithril']
grades=['comun','poco-comun','raro','epico','legendario','mitico']
signatures=set()
for i,name in enumerate(ids):
 master=root/'items'/(name+'.webp')
 assert master.exists(),master
 image=Image.open(master).convert('RGBA')
 assert image.size==(256,256),master
 assert image.getpixel((0,0))[3]==0,'Original approved painting must leave outside frame transparent'
 ref=src.crop(((i%4)*256,(i//4)*256,(i%4+1)*256,(i//4+1)*256))
 roi=(60,65,193,195)
 delta=np.mean(np.abs(np.array(ref.crop(roi),dtype=np.float32)-
                     np.array(image.convert('RGB').crop(roi),dtype=np.float32)))
 if name!='ingot_copper':
  assert delta<18,(name,'Approved art changed unexpectedly',delta)
 else:
  assert delta>12,('Copper ingots must be stacked in 3, not the old single bar',delta)
 for grade in grades:
  path=rarity/'items'/(name+'__'+grade+'.webp')
  assert path.is_file(),path
  framed=Image.open(path).convert('RGBA')
  assert framed.size==(256,256),(name,grade,framed.size)
  # The previously approved original P4.4 outer frame is shared by EVERY item.
  expected=Image.open(rarity/'items'/('hp_potion__'+grade+'.webp')).convert('RGBA')
  for point in [(0,0),(4,128),(251,128),(128,4),(128,251)]:
   actual=framed.getpixel(point);reference=expected.getpixel(point)
   assert max(abs(actual[c]-reference[c]) for c in range(4))<=20,(name,grade,point,'Frame mismatch',actual,reference)
  if grade=='comun':
   raw=np.array(framed.crop((77,80,174,175)).convert('RGB').resize((24,24)))
   sig=raw.tobytes()
   assert sig not in signatures,('Repeated/diffused painted item',name)
   signatures.add(sig)
 print('[P47B PAINTING IN APP]',name,'source delta',round(float(delta),2),'six matching old HIGHFLY frames')
assert len(signatures)==12
print('[P47B ART PASS] 12 authentic accepted paintings × 6 existing rarity frames = 72 fully integrated images')
