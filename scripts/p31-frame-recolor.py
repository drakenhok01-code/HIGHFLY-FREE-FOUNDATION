#!/usr/bin/env python3
"""HIGHFLY P3.1 — recolor GOLD FRAME ONLY. 256x256 RGBA user art. Not imported by game."""
from pathlib import Path
from PIL import Image
import numpy as np, sys
PALETTE={
 "comun":(191,202,217),"poco-comun":(85,220,150),"raro":(81,169,255),
 "epico":(185,109,249),"legendario":None,"mitico":(249,77,144),
}
def frame_only(im,color):
 if color is None:return im.copy()
 a=np.array(im.convert('RGBA'),dtype=np.float32);h,w=a.shape[:2]
 yy,xx=np.mgrid[:h,:w]
 d=np.minimum.reduce([xx,w-1-xx,yy,h-1-yy])
 r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
 gold=(r>100)&(g>48)&(r>g*.99)&(g>b*1.26)&((r-b)>51)&(a[:,:,3]>20)
 strength=np.where(gold&(d<35),.95,0).astype(np.float32)
 lum=np.clip((.25*r+.6*g+.15*b)/235,.22,1.18)
 common=color==(191,202,217)
 for ch,v in enumerate(color):
  target=v*lum*.98+15 if common else v*(lum*.66+.28)+np.maximum((r-170),0)*.27
  a[:,:,ch]=np.clip(a[:,:,ch]*(1-strength)+np.clip(target,0,255)*strength,0,255)
 return Image.fromarray(a.astype('uint8'),'RGBA')
if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit("usage: python scripts/p31-frame-recolor.py original_256.webp out_directory")
 source=Path(sys.argv[1]);out=Path(sys.argv[2]);img=Image.open(source).convert('RGBA')
 if img.size!=(256,256):raise SystemExit("Expected original 256×256 icon; never silently rescale")
 for rarity,col in PALETTE.items():
  p=out/rarity/(source.stem+'.webp');p.parent.mkdir(parents=True,exist_ok=True)
  frame_only(img,col).save(p,'WEBP',quality=86,method=3,exact=True)
 print("Generated six 256×256 highfly rarity frame variants; original image untouched.")
