#!/usr/bin/env python3
"""Eight visually distinct metal grades from ONE original 256px ingot item icon.
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
# Preserve gold outer artwork and brighten ONLY the two hand-masked ingot faces.
# Prior P4.1 was subtle because it recolored only already-gold pixels.
palette={
 'copper':(226,116,62), 'iron':(148,163,178),
 'steel':(115,148,190), 'silver':(222,233,247),
 'gold':(255,189,64), 'diamond':(115,218,253),
 'obsidian':(94,71,141), 'mithril':(62,230,190)
}
light=np.clip((.299*r+.587*g+.114*b)/139,.32,1.48)
weight=inside*.90
for material,rgb in palette.items():
 result=src.copy()
 for i,color in enumerate(rgb):
  target=np.clip(color*light,0,255)
  result[:,:,i]=src[:,:,i]*(1-weight)+target*weight
 output=root/'items'/('ingot_'+material+'.webp')
 Image.fromarray(np.uint8(np.clip(result,0,255)),'RGBA').save(output,format='WEBP',quality=96,method=5)
 check=Image.open(output)
 if check.size!=(256,256) or check.getpixel((0,0))[3]>15:raise SystemExit('Bad metal art '+str(output))
 print('[HIGHFLY P4.2 METALS]',material,output.stat().st_size,'bytes')

# P4.1: original ore painting with unique named mineral colors. The same
# gold/black/purple painted item background is deliberately preserved.
ore=Image.open(root/'items'/'ore.webp').convert('RGBA')
if ore.size!=(256,256):raise SystemExit('Unexpected original mineral size')
a=np.asarray(ore).astype('float32')
yy,xx=np.mgrid[0:256,0:256]
center=np.clip(1-((xx-130)**2+(yy-125)**2)/(97*97),0,1)
center=Image.fromarray(np.uint8(center*255),'L').filter(ImageFilter.GaussianBlur(10))
w=(np.asarray(center)/255).astype('float32')[:,:,None]
lum=np.max(a[:,:,:3],axis=2,keepdims=True)/255
palette={
 'ore_copper':(230,119,61),'ore_iron':(113,139,172),
 'coal':(78,79,99),'ore_silver':(206,226,243),
 'ore_gold':(255,194,70),'raw_diamond':(152,238,255),
 'raw_obsidian':(77,50,111),'ore_mithril':(76,238,212)
}
for item,(red,green,blue) in palette.items():
 out=a.copy()
 for i,color in enumerate([red,green,blue]):
  tone=np.clip(color*(.35+.82*lum[:,:,0]),0,255)
  out[:,:,i]=a[:,:,i]*(1-w[:,:,0]*.87)+tone*w[:,:,0]*.87
 dest=root/'items'/(item+'.webp')
 Image.fromarray(np.uint8(np.clip(out,0,255)),'RGBA').save(dest,format='WEBP',quality=95,method=5)
 check=Image.open(dest)
 if check.size!=(256,256) or check.getpixel((0,0))[3]>15:raise SystemExit('Bad ore art '+str(dest))
 print('[HIGHFLY MATERIAL]',item,dest.stat().st_size,'bytes')
