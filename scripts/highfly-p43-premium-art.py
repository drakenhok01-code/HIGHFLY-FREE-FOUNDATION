#!/usr/bin/env python3
"""HIGHFLY P4.3 -- approved painterly USER WebP icons with metallic rarity recolors.
Source remains the approved 256x256 painterly asset. Six grades alter ONLY the
outer metal frame, not the painting, ambient backdrop or central illustrated item.
No proprietary external art and no low-detail vector replacement.
"""
from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import numpy as np
import sys

icons=Path(sys.argv[1])
destination=Path(sys.argv[2])
destination.mkdir(parents=True,exist_ok=True)
COLORS={'comun':'#EEF3FF','poco-comun':'#27FF73','raro':'#188EFF','epico':'#B43FFF','legendario':'#FFAE17','mitico':'#FF253F'}

def grade_source(src,code):
 im=Image.open(src).convert('RGBA')
 assert im.size==(256,256),src
 a=np.asarray(im,dtype=np.float32);r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
 yy,xx=np.mgrid[:256,:256]
 exterior=(xx<=46)|(xx>=210)|(yy<=46)|(yy>=206)
 gold=(r>92)&(r>g*.98)&(g>b*1.095)&(g>58)
 bright=(r>175)&(g>150)&(b>135)
 strength=np.clip((r-65)/145,0,1)*(.65+.35*np.clip(g/160,0,1))
 mask=np.maximum(gold.astype(float)*strength,bright.astype(float)*.47)*exterior
 mask=np.asarray(Image.fromarray(np.uint8(np.clip(mask,0,1)*255),'L').filter(ImageFilter.GaussianBlur(1.20)),dtype=np.float32)/255
 mask*=np.clip(a[:,:,3]/255,0,1)
 rgb=np.array([int(code[i:i+2],16) for i in (1,3,5)],dtype=np.float32)
 lum=np.clip((r*.29+g*.58+b*.13)/255,0,1)
 spec=np.clip((lum-.68)/.32,0,1)
 target=np.clip(rgb[None,None,:]*(.53+.60*lum[:,:,None])+255*(.26*spec[:,:,None]),0,255)
 out=a.copy();weight=(mask*.97)[:,:,None]
 out[:,:,:3]=out[:,:,:3]*(1-weight)+target*weight
 return Image.fromarray(np.uint8(np.clip(out,0,255)),'RGBA')

def crystal_variant(base,id):
 a=np.asarray(Image.open(base).convert('RGBA'),dtype=np.float32)
 yy,xx=np.mgrid[:256,:256]
 mask=np.maximum(0,1-((xx-130)/94)**2-((yy-119)/91)**2)**1.45
 b=a.copy();r,g,blue=a[:,:,0],a[:,:,1],a[:,:,2]
 bright=(r*.3+g*.59+blue*.11)/255
 tint=np.array([147,80,249] if id=='upgrade_stone' else [246,150,78],dtype=np.float32)
 for c in range(3):
  color=np.clip(tint[c]*(.25+.92*bright),0,255)
  b[:,:,c]=a[:,:,c]*(1-mask*.72)+color*mask*.72
 out=Image.fromarray(np.uint8(np.clip(b,0,255)),'RGBA')
 S=4;overlay=Image.new('RGBA',(256*S,256*S));d=ImageDraw.Draw(overlay)
 d.ellipse((108*S,102*S,155*S,151*S),fill=(10,7,36,105),outline=(253,222,163,245),width=2*S)
 if id=='upgrade_stone':
  points=[(131,107),(137,121),(152,126),(137,131),(131,148),(125,131),(110,126),(125,121)]
  d.polygon([(int(x*S),int(y*S)) for x,y in points],fill=(236,221,255,225))
  d.line([(131*S,109*S),(131*S,146*S)],fill=(100,40,227,220),width=3*S)
 else:
  d.line([(131*S,108*S),(150*S,126*S),(131*S,145*S),(112*S,126*S),(131*S,108*S)],fill=(255,230,177,255),width=3*S)
 out.alpha_composite(overlay.resize((256,256),Image.Resampling.LANCZOS))
 out.save(icons/'items'/(id+'.webp'),'WEBP',quality=96,method=6)

# P4.6 provides original painted upgrade_stone and upgrade_stone_advanced.
# Only the ascension core keeps its older P4.3 illustration.
for name in ['ascension_core']:
 crystal_variant(icons/'items'/'ore.webp',name)

prof={
 'marroquineria':('items','leather'),'sastreria':('armor','gloves'),
 'joyeria':('armor','ring'),'ingenieria':('items','ingot'),
 'encantamiento':('weapons','wand_orb'),
 'inscripcion':('skills-advanced','holy_seal'),
 'desuello':('weapons','dual_daggers')
}
for name,(folder,srcid) in prof.items():
 image=Image.open(icons/folder/(srcid+'.webp')).convert('RGBA')
 S=3;seal=Image.new('RGBA',(256*S,256*S));d=ImageDraw.Draw(seal)
 d.ellipse((180*S,171*S,215*S,208*S),fill=(24,12,42,220),outline=(250,213,121,245),width=2*S)
 d.line([(190*S,194*S),(199*S,180*S),(207*S,194*S)],fill=(253,228,154,235),width=2*S)
 d.ellipse((196*S,190*S,202*S,196*S),fill=(251,211,128,238))
 image.alpha_composite(seal.resize((256,256),Image.Resampling.LANCZOS))
 image.save(icons/'professions'/(name+'.webp'),'WEBP',quality=96,method=6)

amount=0
for category in ['items','armor','weapons']:
 for file in sorted((icons/category).glob('*.webp')):
  for grade,color in COLORS.items():
   dest=destination/category/(file.stem+'__'+grade+'.webp')
   dest.parent.mkdir(parents=True,exist_ok=True)
   grade_source(file,color).save(dest,'WEBP',quality=94,method=5)
   if dest.stat().st_size<1000:raise SystemExit('Bad premium rarity '+str(dest))
   amount+=1
print('[HIGHFLY P4.3] '+str(amount)+' full 256x256 framed rarity images; 7 profession illustrations; 2 crystal designs')
