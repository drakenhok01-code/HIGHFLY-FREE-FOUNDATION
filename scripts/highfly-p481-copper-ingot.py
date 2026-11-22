#!/usr/bin/env python3
"""HIGHFLY P4.8.1: ONLY fix the copper ingot illustration.
The correctly stacked THREE reddish copper bars were painted from the approved
HIGHFLY icon language. Every other material, item, profession and frame stays
exactly as approved in P4.8.

Apply AFTER P4.7B's import and BEFORE P4.3's original six rarity-frame pass.
The transparent, high-resolution three-ingot image is installed behind the
already-approved exterior frame, at the same small internal visual scale.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import io, base64, math, sys

if len(sys.argv)!=3:raise SystemExit("Usage: highfly-p481-copper-ingot.py <source.webp.b64> <user-icons-root>")
source=Path(sys.argv[1]);root=Path(sys.argv[2])
painting=Image.open(io.BytesIO(base64.b64decode(source.read_text().strip(),validate=True))).convert('RGBA')
assert painting.size==(200,155),'Unexpected three-copper-ingot source dimensions'
assert painting.getpixel((0,0))[3]==0,'The three bars require transparent outside pixels'
dest=root/'items'/'ingot_copper.webp'
approved=Image.open(dest).convert('RGBA')
assert approved.size==(256,256),'The existing HIGHFLY frame is fixed at 256px'
# Original outer gold/fantasy rim stays pixel-perfect. Remove only the old
# malformed copper-ingot interior, which looked larger than the other lingots.
vignette=Image.new('RGBA',(256,256),(20,8,39,255))
pixels=vignette.load()
for y in range(256):
 for x in range(256):
  distance=math.hypot((x-130)/125,(y-126)/125)
  glow=max(0.,1.-distance)
  pixels[x,y]=(round(20+16*glow),round(8+5*glow),round(39+35*glow),255)
# Never touch the shape of the gold border or its six approved rarity colors.
inside=Image.new('L',(256,256),0)
ImageDraw.Draw(inside).rounded_rectangle((29,24,227,234),radius=25,fill=255)
inside=inside.filter(ImageFilter.GaussianBlur(2))
out=Image.composite(vignette,approved,inside)
# Identical compact scale to the remaining ingot family; genuine copper, not
# a gold or bronze recolor and NOT three overlapping doubled silhouettes.
scaled=painting.resize((174,135),Image.Resampling.LANCZOS)
out.alpha_composite(scaled,(41,72))
for point in [(0,0),(8,128),(247,128),(128,8),(128,247)]:
 assert out.getpixel(point)==approved.getpixel(point),(point,'Approved outer frame changed')
out.save(dest,format='WEBP',quality=97,method=6)
check=Image.open(dest).convert('RGBA')
assert check.size==(256,256) and check.getpixel((0,0))[3]==0
print('[HIGHFLY P4.8.1 COPPER] ONLY ingot_copper redrawn as exactly 3 compact realistic copper bars; outer frame preserved')
