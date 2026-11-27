#!/usr/bin/env python3
"""Put the three existing unframed creature paintings into the original ornate frame.
Only these three SVGs get a new composite; all approved WebPs are untouched."""
import io,sys
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
import cairosvg
root,rarity=map(Path,sys.argv[1:3])
grades=['comun','poco-comun','raro','epico','legendario','mitico']
sources={'wolf_pelt':'p496/wolf_pelt.svg','boar_tusk':'p494/boar_tusk.svg','crab_shell':'p494/crab_shell.svg'}
yy,xx=np.mgrid[:256,:256]
near=np.minimum.reduce([xx,yy,255-xx,255-yy]).astype(float)
# Preserve the full outer ring, including the centered ornamental tips.
center=np.clip((55-np.abs(xx-128))/22,0,1)
ornament=np.maximum(np.clip((52-yy)/12,0,1),np.clip((yy-204)/12,0,1))*center
mask=np.maximum(np.clip((39-near)/9,0,1),ornament)
mask=Image.fromarray(np.uint8(mask*255),'L').filter(ImageFilter.GaussianBlur(.6))
for id,src in sources.items():
    raw=Image.open(io.BytesIO(cairosvg.svg2png(url=str(root/src),output_width=256,output_height=256))).convert('RGBA')
    # Keep original aspect ratio and all silhouette; center inside the frame.
    inner=raw.resize((176,176),Image.Resampling.LANCZOS)
    bg=Image.new('RGBA',(256,256),(20,13,38,255))
    bg.alpha_composite(inner,(40,40))
    for grade in grades:
        frame=Image.open(rarity/'items'/('hp_potion__'+grade+'.webp')).convert('RGBA')
        out=Image.composite(frame,bg,mask)
        out.save(rarity/'items'/(id+'__'+grade+'.webp'),'WEBP',quality=95,method=5)
        assert out.size==(256,256)
print('P572: 18 creature art variants with authentic original frame.')
