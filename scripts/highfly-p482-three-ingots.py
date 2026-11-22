#!/usr/bin/env python3
"""HIGHFLY P4.8.2 — unify all eight in-game ingots as THREE painted bars.

Use the original user-approved P4.8.1 THREE-bar copper painting as the only
silhouette source, preserve the existing approved 256px icon's entire outer
frame, and tint the material artwork ONLY. No new frame, no item IDs/recipes
or equipment rules altered. P4.3/P4.4 apply the existing 6 rarity frames AFTER.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import base64, hashlib, io, sys
import numpy as np

if len(sys.argv) != 3:
    raise SystemExit("Usage: highfly-p482-three-ingots.py <copper-triple.webp.b64> <user-icons-root>")
source = Path(sys.argv[1])
root = Path(sys.argv[2])
raw = base64.b64decode(source.read_text().strip(), validate=True)
assert hashlib.sha256(raw).hexdigest() == '832f4f07e35f85eb7b0662e1d58204a350a9d627eda55918a62bae52cd9c85d6'
painting = Image.open(io.BytesIO(raw)).convert('RGBA')
assert painting.size == (200, 155) and painting.getpixel((0, 0))[3] == 0

# Eight active and distinct HIGHFLY ingots; copper is already repaired in P4.8.1.
PALETTE = {
    'iron': (150, 162, 179),
    'steel': (99, 143, 183),
    'silver': (216, 229, 242),
    'gold': (255, 190, 66),
    'diamond': (132, 217, 248),
    'obsidian': (105, 77, 146),
    'mithril': (82, 223, 199),
}
assert (root/'items'/'ingot_copper.webp').is_file()
reference = Image.open(root/'items'/'ingot_copper.webp').convert('RGBA')
assert reference.size == (256, 256)
border_samples = [(0, 0), (8, 128), (247, 128), (128, 8), (128, 247), (19, 19)]

source_pixels = np.asarray(painting, dtype=np.float32)
rgb = source_pixels[:, :, :3]
# Smooth material recoloring preserves the painterly highlights, texture, and
# 3-bar silhouette, rather than overlaying flat vector polygons.
luminance = rgb[:,:,0]*.29 + rgb[:,:,1]*.59 + rgb[:,:,2]*.12
shade = np.clip((luminance / 124.0)**0.88, .29, 1.35)
highlight = np.clip((np.max(rgb,axis=2)-luminance)/185.0,0,.32)
alpha = np.asarray(painting)[:,:,3]

inside = Image.new('L',(256,256),0)
ImageDraw.Draw(inside).rounded_rectangle((29,24,227,234),radius=25,fill=255)
inside = inside.filter(ImageFilter.GaussianBlur(2))
# The exact interior/background recipe from the approved P4.8.1 repair.
vignette = Image.new('RGBA',(256,256),(20,8,39,255))
v = np.empty((256,256,4),dtype=np.uint8)
yy,xx = np.mgrid[:256,:256]
distance = np.hypot((xx-130)/125.0,(yy-126)/125.0)
glow = np.maximum(0.,1.-distance)
v[:,:,0]=np.rint(20+16*glow).astype('uint8')
v[:,:,1]=np.rint(8+5*glow).astype('uint8')
v[:,:,2]=np.rint(39+35*glow).astype('uint8')
v[:,:,3]=255
vignette=Image.fromarray(v,'RGBA')

for metal, base in PALETTE.items():
    dest = root/'items'/('ingot_'+metal+'.webp')
    approved = Image.open(dest).convert('RGBA')
    assert approved.size == (256,256)
    out_rgb = np.clip(np.array(base)[None,None,:] * shade[:,:,None]
                      + (255-np.array(base))[None,None,:] * highlight[:,:,None] * .34, 0, 255)
    recolored = Image.fromarray(np.dstack([np.uint8(np.rint(out_rgb)),alpha]).astype('uint8'),'RGBA')
    out = Image.composite(vignette, approved, inside)
    resized = recolored.resize((174,135),Image.Resampling.LANCZOS)
    out.alpha_composite(resized,(41,72))
    for xy in border_samples:
        assert out.getpixel(xy) == approved.getpixel(xy), ('frame changed',metal,xy)
    out.save(dest,format='WEBP',quality=97,method=6)
    check = Image.open(dest).convert('RGBA')
    assert check.size == (256,256) and check.getpixel((0,0))[3] == 0
    print('[HIGHFLY P4.8.2 THREE INGOTS]', metal, dest.stat().st_size, 'bytes')
print('[HIGHFLY P4.8.2] 8 ingots (copper + 7 recolors), one approved triple-bar silhouette, 6 unchanged rarity frames')
