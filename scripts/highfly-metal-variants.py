#!/usr/bin/env python3
"""Four material grades from ONE original 256px ingot item icon.
The purchased/user drawing and its original gold frame are never replaced.
Recolor only the ingots at their known image coordinates; keep transparent alpha.
"""
from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import numpy as np
import sys
if len(sys.argv)!=2:raise SystemExit("Usage: highfly-metal-variants.py <user-icons dir>")
root=Path(sys.argv[1]);source=root/'items'/'ingot.webp'
im=Image.open(source).convert('RGBA')
if im.size!=(256,256):raise SystemExit("Unexpected original ingot icon size")
mask=Image.new('L',im.size,0);brush=ImageDraw.Draw(mask)
for poly in (
 [(76,72),(129,47),(199,50),(195,89),(150,119),(72,108)],
 [(42,117),(91,95),(150,115),(195,106),(221,142),(178,176),(128,186),(36,153)]
):brush.polygon(poly,fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(4))
src=np.asarray(im).astype('float32')
r,g,b=src[:,:,0],src[:,:,1],src[:,:,2]
inside=(np.asarray(mask)/255).astype('float32')
gold=(r>75)&(r>g*1.06)&(g>b*1.18)&(g>48)
weight=(inside*gold).astype('float32')
for material,ratios in {
 'copper':(.98,.61,.47),'iron':(.55,.66,.77),
 'silver':(.9,1.0,1.15),'gold':(1,1,1)
}.items():
 result=src.copy()
 for i,mul in enumerate(ratios):
  result[:,:,i]=src[:,:,i]*(1-weight)+np.clip(src[:,:,i]*mul,0,255)*weight
 if material in ('iron','silver'):
  neutral=(r*.299+g*.587+b*.114)
  factor=.54 if material=='iron' else .84
  for i in range(3):result[:,:,i]=result[:,:,i]*(1-weight*factor)+neutral*weight*factor
 output=root/'items'/('ingot_'+material+'.webp')
 Image.fromarray(np.uint8(np.clip(result,0,255)),'RGBA').save(output,format='WEBP',quality=95,method=5)
 check=Image.open(output)
 if check.size!=(256,256) or check.getpixel((0,0))[3]>15:raise SystemExit("Bad metal art "+str(output))
 print("[HIGHFLY METALS]",material,output.stat().st_size,"bytes")
