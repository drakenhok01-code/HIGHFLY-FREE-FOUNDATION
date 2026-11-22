#!/usr/bin/env python3
"""HIGHFLY P4.6 — material identity pass.
Uses the approved user-drawn premium 256px ore frame/background; redraws the
center into recognizably DIFFERENT mineral silhouettes, not recolored copies.
Two special enhancement crystal families: +0→+6 and +6→+9.
All output is 256x256 lossless-alpha WebP; outer frame remains untouched.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math, random, sys

root=Path(sys.argv[1]);items=root/'items';S=4;N=256*S
origin=Image.open(items/'ore.webp').convert('RGBA').resize((N,N),Image.Resampling.LANCZOS)
def sc(v):return round(v*S)
def P(poly):return [(sc(x),sc(y)) for x,y in poly]
def rect(box):return [sc(v) for v in box]
def col(rgb,a=255):return tuple(int(max(0,min(255,v))) for v in rgb)+(a,)
def tint(rgb,k):return tuple(min(255,max(0,round(c*k))) for c in rgb)
def rng_for(name):return random.Random(sum((i+1)*ord(c) for i,c in enumerate(name))+42031)
def new_canvas(name,glow):
 r=rng_for(name)
 # Replace ONLY the old central ore painting, while retaining HIGHFLY's
 # approved fantasy-violet atmosphere and every original gilt frame pixel.
 background=Image.new('RGBA',(N,N),(14,8,30,255))
 nebula=Image.new('RGBA',(N,N),(0,0,0,0));gd=ImageDraw.Draw(nebula)
 for n in range(23,0,-1):
  rad=72+round(n*2.2)
  alpha=max(0,round((25-n)*2.4))
  gd.ellipse(rect((128-rad,129-rad,128+rad,129+rad)),fill=col(glow,alpha))
 # Dark silk background, soft nebula glow, subtle ambient glitter.
 for i in range(84):
  x=r.randrange(54,203);y=r.randrange(44,205);rad=r.choice([.35,.6,.9,1.2])
  gd.ellipse(rect((x-rad,y-rad,x+rad,y+rad)),fill=(209,185,244,r.randrange(20,85)))
 background=Image.alpha_composite(background,nebula)
 mask=Image.new('L',(N,N),0)
 ImageDraw.Draw(mask).ellipse(rect((50,45,210,215)),fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(sc(10)))
 base=Image.composite(background,origin,mask)
 return base,r
def poly(d,p,fill,outline=None,width=1):
 d.polygon(P(p),fill=fill)
 if outline:d.line(P(p+[p[0]]),fill=outline,width=max(1,sc(width)),joint='curve')
def shard(d,shape,base,rng,glass=False,edge=None):
 xs=[x for x,y in shape];ys=[y for x,y in shape];cx=sum(xs)/len(xs);cy=sum(ys)/len(ys)
 edge=edge or tint(base,1.58)
 poly(d,shape,col(tint(base,.38)),col(edge,240),2.1)
 # Faceted planes have their own subtle highlights and geometry.
 for i in range(len(shape)):
  a=shape[i];b=shape[(i+1)%len(shape)]
  target=(cx+rng.uniform(-7,7),cy+rng.uniform(-6,6))
  shade=[.49,.63,.78,.94,1.1,1.28][i%6]
  poly(d,[a,b,target],col(tint(base,shade),240))
  if i%3==1:d.line(P([a,target]),fill=col(tint(edge,.92),rng.randint(85,175)),width=sc(1))
 for i in range(4):
  x=rng.uniform(min(xs)+5,max(xs)-5);y=rng.uniform(min(ys)+5,max(ys)-5)
  rr=rng.uniform(.7,2)
  d.ellipse(rect((x-rr,y-rr,x+rr,y+rr)),fill=col(edge,rng.randint(90,200)))
 if glass:
  d.line(P([shape[0],(cx,cy),shape[len(shape)//2]]),fill=(229,247,255,140),width=sc(1.7))
def rock_shape(cx,cy,rx,ry,rng,points=9):
 return [(cx+math.cos(2*math.pi*i/points)*rx*rng.uniform(.76,1.10),
          cy+math.sin(2*math.pi*i/points)*ry*rng.uniform(.73,1.14)) for i in range(points)]
def star(d,x,y,size,c,a=220):
 d.line(P([(x-size,y),(x+size,y)]),fill=col(c,a),width=max(1,sc(1.25)))
 d.line(P([(x,y-size),(x,y+size)]),fill=col(c,a),width=max(1,sc(1.25)))
 d.ellipse(rect((x-1,y-1,x+1,y+1)),fill=(255,255,240,240))
def draw_rocks(name,color,style='rock'):
 glow=tint(color,.70)
 out,r=new_canvas(name,glow)
 layer=Image.new('RGBA',(N,N),(0,0,0,0));d=ImageDraw.Draw(layer)
 # Weight, texture and geology are unique per material. Coal is fully matte.
 shadows=Image.new('RGBA',(N,N));sd=ImageDraw.Draw(shadows)
 for k in range(12,0,-1):
  sd.ellipse(rect((76-k*.5,171-k*.3,187+k*.5,200+k*.3)),fill=(0,0,0,round(5+(12-k)*1.5)))
 out=Image.alpha_composite(out,shadows.filter(ImageFilter.GaussianBlur(sc(5))))
 if style=='coal':
  for i,(cx,cy,rx,ry) in enumerate([(87,163,38,27),(144,157,45,34),(117,108,45,41),(165,111,27,31)]):
   sh=rock_shape(cx,cy,rx,ry,r,points=9)
   shard(d,sh,(29+i*3,30+i*3,38+i*2),r,edge=(100,105,114))
   for j in range(11):
    x=cx+r.uniform(-rx*.55,rx*.55);y=cy+r.uniform(-ry*.55,ry*.55)
    rr=r.uniform(.5,1.7)
    d.ellipse(rect((x-rr,y-rr,x+rr,y+rr)),fill=(10,12,16,r.randrange(95,215)))
  for i in range(8):
   x=r.randint(62,190);y=r.randint(80,195)
   d.line(P([(x,y),(x+r.randint(3,10),y+r.randint(1,4))]),fill=(111,107,116,r.randint(60,125)),width=sc(.7))
 elif style=='copper':
  for i,(cx,cy,rx,ry) in enumerate([(94,149,42,34),(152,138,46,39),(121,103,47,41)]):
   shard(d,rock_shape(cx,cy,rx,ry,r),(125,75,56),r,edge=(218,127,64))
  for i in range(18):
   x=r.randint(78,176);y=r.randint(87,166)
   d.line(P([(x,y),(x+r.randint(-9,12),y+r.randint(3,14)),(x+r.randint(8,20),y+r.randint(10,18))]),
    fill=r.choice([(252,142,57,220),(255,197,108,180),(91,180,146,182)]),width=sc(r.choice([1.5,2,2.7])))
 elif style=='gold':
  for cx,cy,rx,ry in [(92,153,35,25),(147,155,39,28),(126,117,49,40)]:
   shard(d,rock_shape(cx,cy,rx,ry,r,points=12),(210,139,38),r,edge=(255,227,122))
  for j in range(18):
   x=r.randint(68,180);y=r.randint(93,178)
   rr=r.randint(1,3)
   d.ellipse(rect((x-rr,y-rr,x+rr,y+rr)),fill=(255,232,129,230))
 elif style in ('diamond','obsidian','mithril'):
  if style=='diamond':
   colors=[(146,219,252),(182,238,255),(98,178,235)]
   shapes=[[(78,157),(105,94),(111,66),(143,91),(137,171),(99,194)],
           [(127,174),(151,80),(177,59),(189,127),(175,188)],
           [(87,174),(65,120),(86,102),(112,155)]]
  elif style=='obsidian':
   colors=[(36,30,54),(46,34,69),(22,24,43)]
   shapes=[[(76,192),(70,94),(119,47),(151,134),(130,201)],
           [(121,183),(163,67),(195,113),(186,182)],
           [(56,167),(78,113),(118,186)]]
  else:
   colors=[(42,181,179),(65,230,210),(36,126,163)]
   shapes=[[(77,183),(91,91),(126,57),(141,167),(115,201)],
           [(117,170),(153,70),(183,93),(176,184)],
           [(55,163),(84,115),(106,164)]]
  for i,shape in enumerate(shapes):
   edge=(211,244,255) if style=='diamond' else (110,63,186) if style=='obsidian' else (185,255,223)
   shard(d,shape,colors[i],r,glass=True,edge=edge)
  for _ in range(12 if style!='obsidian' else 4):
   x=r.randint(63,193);y=r.randint(66,188)
   star(d,x,y,r.uniform(1.3,3.7),(231,250,255) if style=='diamond' else (116,211,252) if style=='mithril' else (161,105,234),a=160)
 else:
  for i,(cx,cy,rx,ry) in enumerate([(92,153,43,30),(148,151,44,35),(128,110,48,45)]):
   shade=tint(color,[.91,.72,1.09][i])
   shard(d,rock_shape(cx,cy,rx,ry,r,points=9),shade,r,edge=tint(color,1.65))
  for _ in range(16):
   x=r.randint(74,180);y=r.randint(91,174)
   d.line(P([(x,y),(x+r.randint(3,13),y+r.randint(0,11))]),fill=col(tint(color,1.65),r.randint(80,170)),width=sc(1))
 out=Image.alpha_composite(out,layer)
 out=out.resize((256,256),Image.Resampling.LANCZOS)
 out.save(items/(name+'.webp'),'WEBP',quality=97,method=6)
 return out

materials={
 'coal':((30,32,39),'coal'),
 'ore_copper':((204,112,60),'copper'),
 'ore_iron':((100,126,148),'rock'),
 'ore_silver':((198,220,238),'rock'),
 'ore_gold':((245,179,60),'gold'),
 'raw_diamond':((156,229,255),'diamond'),
 'raw_obsidian':((40,28,59),'obsidian'),
 'ore_mithril':((50,222,196),'mithril')
}
for key,(color,kind) in materials.items():draw_rocks(key,color,kind)

def stone(name,advanced):
 base,r=new_canvas(name,(154,44,202) if advanced else (59,149,226))
 layer=Image.new('RGBA',(N,N),(0,0,0,0));d=ImageDraw.Draw(layer)
 cx,cy=128,128
 if advanced:
  for rr in (85,77,68):
   d.arc(rect((cx-rr,cy-rr,cx+rr,cy+rr)),start=16,end=345,fill=(255,111,93,185),width=sc(1.8))
  shape=[(128,47),(152,83),(180,99),(161,168),(125,209),(94,177),(76,112),(105,85)]
  shard(d,shape,(95,24,78),r,glass=True,edge=(255,113,108))
  shard(d,[(124,68),(147,110),(136,174),(123,192),(105,140)],(246,65,93),r,glass=True,edge=(255,232,181))
  for i in range(8):
   a=i*math.pi/4;px=128+78*math.cos(a);py=128+78*math.sin(a)
   star(d,px,py,4,(255,145,89),205)
  d.line(P([(128,78),(150,119),(127,176),(102,123),(128,78)]),fill=(255,227,135,225),width=sc(3))
  d.text((sc(116),sc(118)),'VII',fill=(255,233,171,255),stroke_width=sc(.35),stroke_fill=(114,39,22,180))
 else:
  for rr in (86,74):
   d.arc(rect((cx-rr,cy-rr,cx+rr,cy+rr)),start=10,end=320,fill=(101,186,255,115),width=sc(1.6))
  shape=[(128,41),(163,79),(188,129),(153,186),(128,207),(96,183),(68,129),(94,76)]
  shard(d,shape,(71,115,231),r,glass=True,edge=(182,233,255))
  shard(d,[(128,63),(145,113),(129,178),(109,120)],(127,82,240),r,glass=True,edge=(242,214,255))
  d.line(P([(128,69),(144,122),(127,176),(108,121),(128,69)]),fill=(240,228,255,225),width=sc(2.2))
  for i in range(6):
   a=i*math.pi/3;star(d,128+81*math.cos(a),128+81*math.sin(a),3,(178,222,255),180)
 base=Image.alpha_composite(base,layer)
 base.resize((256,256),Image.Resampling.LANCZOS).save(items/(name+'.webp'),'WEBP',quality=97,method=6)

stone('upgrade_stone',False)
stone('upgrade_stone_advanced',True)
for name in [*materials,'upgrade_stone','upgrade_stone_advanced']:
 path=items/(name+'.webp')
 img=Image.open(path)
 if img.size!=(256,256) or img.getpixel((0,0))[3]>15:raise SystemExit('Invalid premium image '+str(path))
 print('[HIGHFLY P4.6 MATERIAL]',name,path.stat().st_size,'bytes')
