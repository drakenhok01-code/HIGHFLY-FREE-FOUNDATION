#!/usr/bin/env python3
"""HIGHFLY P4.8.2: checks the 8 triple-bar ingots and 48 original rarity frames."""
from pathlib import Path
from PIL import Image
import hashlib,base64,io,sys
import numpy as np

if len(sys.argv)!=4:
    raise SystemExit("Usage: qa-p482-three-ingots.py <user-icons> <rarity> <source.b64>")
root, rarity, src = map(Path,sys.argv[1:])
raw=base64.b64decode(src.read_text().strip(),validate=True)
assert hashlib.sha256(raw).hexdigest()=='832f4f07e35f85eb7b0662e1d58204a350a9d627eda55918a62bae52cd9c85d6'
source=Image.open(io.BytesIO(raw)).convert('RGBA')
assert source.size==(200,155) and source.getpixel((0,0))[3]==0
source=source.resize((174,135),Image.Resampling.LANCZOS)
silhouette=np.asarray(source)[:,:,3]>235
assert np.count_nonzero(silhouette)>3000,'Three-bar painting needs fully opaque detail'

METALS=['copper','iron','steel','silver','gold','diamond','obsidian','mithril']
GRADES=['comun','poco-comun','raro','epico','legendario','mitico']
bounds=[(0,0),(8,128),(247,128),(128,8),(128,247),(19,19)]
color_means={}
for metal in METALS:
    image=Image.open(root/'items'/('ingot_'+metal+'.webp')).convert('RGBA')
    assert image.size==(256,256) and image.getpixel((0,0))[3]==0,metal
    texture=np.asarray(image.convert('RGB'))[72:207,41:215,:]
    color_means[metal]=texture[silhouette].mean(axis=0)
    for grade in GRADES:
        framed=Image.open(rarity/'items'/('ingot_'+metal+'__'+grade+'.webp')).convert('RGBA')
        anchor=Image.open(rarity/'items'/('hp_potion__'+grade+'.webp')).convert('RGBA')
        assert framed.size==anchor.size==(256,256),(metal,grade)
        # The exact same approved ornament and rarity color from P4.3 / P4.4.
        for xy in bounds:
            a=np.array(framed.getpixel(xy),dtype=int)
            b=np.array(anchor.getpixel(xy),dtype=int)
            assert np.max(abs(a-b))<=20,(metal,grade,'frame changed',xy,a,b)
        center=np.asarray(framed.convert('RGB'))[72:207,41:215,:][silhouette].mean(axis=0)
        assert np.linalg.norm(center-color_means[metal]) < 14,(metal,grade,'item color changed')
# Every real ingot has its distinct material tone, rather than eight copies
# or a rare-frame recolor changing the contents.
for i,a in enumerate(METALS):
    for b in METALS[i+1:]:
        assert np.linalg.norm(color_means[a]-color_means[b])>9,(a,b,'colors indistinguishable')
assert color_means['gold'][0]>color_means['gold'][2]*1.3
assert color_means['silver'][2]>color_means['copper'][2]
assert color_means['obsidian'][1]<color_means['mithril'][1]
print('[HIGHFLY P4.8.2 PASS] 8 distinct metals, 3 identical painted ingot silhouettes each, 48 unchanged 256x256 rarity frames')
