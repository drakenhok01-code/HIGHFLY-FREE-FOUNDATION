#!/usr/bin/env python3
"""HIGHFLY P4.7B: import the 12 painted illustrations approved in Unsung 4/5.
The GitHub asset assets/highfly/p47/source-12-icons.jpg is a real, committed
binary user-approved artwork atlas (4 columns x 3 rows at 256px).

This pass changes ONLY the painting INSIDE the already-established rarity
frame. The later P4.3/P4.4 pipeline applies the EXISTING rarity frames
and normalizes their borders, without drawing a new one here.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import sys

atlas=Path(sys.argv[1])
icons=Path(sys.argv[2])
im=Image.open(atlas).convert('RGB')
assert im.size==(1024,768),f'Wrong approved source atlas size: {im.size}'
ids=['coal','ore','ore_copper','ore_iron','ore_silver','ore_gold',
     'raw_diamond','raw_obsidian','upgrade_stone','upgrade_stone_advanced',
     'ingot_copper','ore_mithril']
target=icons/'items';target.mkdir(parents=True,exist_ok=True)

def triple_copper_ingot(one):
 """Three painterly, PHOTOGRAPHIC copper bars built only from the approved
 painted ingot's own texture. No flat polygons or vector drawing."""
 one=one.convert('RGBA')
 mask=Image.new('L',(256,256),0)
 d=ImageDraw.Draw(mask)
 # The original hand-painted ingot's visible outline (only used for cropping).
 d.polygon([(13,150),(37,103),(166,38),(225,56),
            (247,122),(235,149),(103,227),(25,211),(11,175)],fill=255)
 one.putalpha(mask.filter(ImageFilter.GaussianBlur(0.95)))
 # The approved purple background is retained, NOT a newly styled frame.
 bg=Image.new('RGBA',(256,256),(24,12,41,255))
 for x,y,z,brightness in [(23,61,.61,.82),(111,61,.54,.95),(57,124,.57,1.08)]:
  scaled=one.resize((round(256*z),round(256*z)),Image.Resampling.LANCZOS)
  scaled=ImageEnhance.Brightness(scaled).enhance(brightness)
  bg.alpha_composite(scaled,(x,y))
 return bg

for index,name in enumerate(ids):
 x=(index%4)*256;y=(index//4)*256
 image=im.crop((x,y,x+256,y+256)).convert('RGBA')
 if name=='ingot_copper':image=triple_copper_ingot(image)
 # P4.8: keep the ORIGINAL user-approved icon FRAME AND BACKGROUND.
 # Paste only the painting inside it, 16% smaller. The frame is never
 # flattened, replaced or overpainted by the 12 newly illustrated minerals.
 dest=target/(name+'.webp')
 approved=Image.open(dest).convert('RGBA')
 assert approved.size==(256,256),name
 painting=image.resize((216,216),Image.Resampling.LANCZOS)
 interior=approved.copy()
 interior.alpha_composite(painting,(20,20))
 # Feather the photographic edges back into the existing premium vignette.
 # The original gold frame is untouched outside the inner 188px area.
 mask=Image.new('L',(256,256),0)
 d=ImageDraw.Draw(mask)
 d.rounded_rectangle((36,36,220,220),radius=37,fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(8))
 image=Image.composite(interior,approved,mask)
 image.save(dest,'WEBP',quality=97,method=6)
 check=Image.open(dest)
 assert check.size==(256,256) and check.getpixel((0,0))[3]==0, f'Invalid P47B icon {name}'
 print('[HIGHFLY P47B APPROVED PAINTING]',name, dest.stat().st_size,'bytes')
print('[HIGHFLY P47B] 12 approved photographic mineral/stone/3-copper-ingot sources -> existing 6 rarity frames')
