#!/usr/bin/env python3
"""P4.4: normalize the approved premium frame and give Engineering its OWN art.
Everything stays 256x256 WebP. Frames remain embedded in the image, never CSS.
"""
import sys,math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import numpy as np

user=Path(sys.argv[1]); rarity=Path(sys.argv[2])
glist=['comun','poco-comun','raro','epico','legendario','mitico']
h,w=256,256
yy,xx=np.mgrid[0:h,0:w]
# Wider frame at all four sides, soft anti-aliased transition; all icon
# categories now share one authentic user-painted canonical silhouette.
near=np.minimum.reduce([xx,yy,255-xx,255-yy]).astype('float32')
outer=np.clip((39-near)/19,0,1)
outer=np.maximum(outer,np.clip((34-np.minimum(np.abs(xx-128),np.abs(yy-128)))/100,0,.0))
mask=Image.fromarray(np.uint8(255*outer),'L').filter(ImageFilter.GaussianBlur(.8))

for grade in glist:
 anchor=rarity/'items'/('hp_potion__'+grade+'.webp')
 if not anchor.is_file():raise SystemExit('Canonical premium art is missing '+str(anchor))
 frame=Image.open(anchor).convert('RGBA')
 for typ in ('items','armor','weapons'):
  for file in sorted((rarity/typ).glob('*__'+grade+'.webp')):
   target=Image.open(file).convert('RGBA')
   if target.size!=(w,h):raise SystemExit('Wrong size '+str(file))
   if file.resolve()==anchor.resolve():continue
   # Keep the original item/painting/background center unchanged.
   # Normalize only the outer decorative metal geometry.
   out=Image.composite(frame,target,mask)
   out.save(file,'WEBP',quality=95,method=5)

profession=user/'professions'
frame=Image.open(profession/'forja.webp').convert('RGBA')

# Create wholly distinctive Engineering imagery from original gold/purple
# HIGHFLY frame. Gear wheels, rivets, brass hub and cyan arcane machine light.
S=4
canvas=frame.resize((w*S,h*S),Image.Resampling.LANCZOS).convert('RGBA')
paint=Image.new('RGBA',canvas.size,(0,0,0,0))
d=ImageDraw.Draw(paint)
def pt(p):return int(p*S)
def gear(cx,cy,rad,teeth,width,light,dark,inner):
 pts=[]
 for i in range(teeth*4):
  angle=(2*math.pi*i/(teeth*4))-math.pi/2
  segment=i%4
  radius=rad*(1.0 if segment in (0,1) else .78)
  pts.append((pt(cx+radius*math.cos(angle)),pt(cy+radius*math.sin(angle))))
 d.polygon(pts,fill=dark)
 d.line(pts+[pts[0]],fill=light,width=pt(width),joint='curve')
 d.ellipse([pt(cx-rad*.69),pt(cy-rad*.69),pt(cx+rad*.69),pt(cy+rad*.69)],fill=inner,outline=light,width=pt(width/1.5))
 d.ellipse([pt(cx-rad*.32),pt(cy-rad*.32),pt(cx+rad*.32),pt(cy+rad*.32)],fill=(14,18,49,255),outline=(233,197,124,255),width=pt(3))
 for k in range(teeth//2):
  angle=2*math.pi*k/(teeth//2)
  x=cx+rad*.53*math.cos(angle);y=cy+rad*.53*math.sin(angle)
  d.ellipse([pt(x-2),pt(y-2),pt(x+2),pt(y+2)],fill=(250,232,169,240))
# Center panel masks the forge/tool illustration, outer approved metal frame remains.
d.ellipse((pt(60),pt(52),pt(198),pt(202)),fill=(16,11,39,239),outline=(180,99,239,176),width=pt(3))
# Blue-violet energetic corona around the mechanical hub.
for i in range(11,0,-1):
 rad=82+i
 color=(79,64,225,int(14*(11-i)/11))
 d.ellipse((pt(130-rad),pt(125-rad),pt(130+rad),pt(125+rad)),outline=color,width=pt(2))
gear(116,122,58,12,3.4,(253,220,153,255),(107,65,43,255),(176,112,60,255))
gear(162,154,32,10,2.5,(178,249,251,255),(45,94,133,255),(64,147,189,255))
# Silhouette of a precision wrench and a fine spark.
d.line([(pt(84),pt(188)),(pt(150),pt(70))],fill=(10,7,31,255),width=pt(13))
d.line([(pt(84),pt(188)),(pt(150),pt(70))],fill=(232,184,105,255),width=pt(7))
d.ellipse((pt(75),pt(179),pt(91),pt(195)),fill=(21,27,51,255),outline=(255,226,157,255),width=pt(3))
d.line([(pt(177),pt(68)),(pt(177),pt(91)),(pt(166),pt(79)),(pt(188),pt(79))],fill=(217,254,251,240),width=pt(3))
canvas.alpha_composite(paint)
engineering=canvas.resize((w,h),Image.Resampling.LANCZOS)

# Reapply the approved profession metal frame from Forja without changing
# its geometry. Each of 15 occupations shares the identical frame border.
prof_files=sorted(profession.glob('*.webp'))
for file in prof_files:
 im=engineering if file.stem=='ingenieria' else Image.open(file).convert('RGBA')
 if im.size!=(w,h):raise SystemExit('Profession frame dimension '+str(file))
 standardized=Image.composite(frame,im,mask)
 standardized.save(file,'WEBP',quality=95,method=5)

assert len(prof_files)>=15,('Missing profession image',len(prof_files))
check=Image.open(profession/'ingenieria.webp')
assert check.size==(w,h)
# Restore the actual approved HIGHFLY RPG FITNESS logo, not P4.3's
# substitute phoenix SVG. Enhance scaling in the build once, never CSS pixel-art.
if len(sys.argv)>4:
 original=Image.open(sys.argv[3]).convert('RGBA')
 out=Path(sys.argv[4]);out.parent.mkdir(parents=True,exist_ok=True)
 width=1100
 enlarged=original.resize((width,round(original.height*width/original.width)),Image.Resampling.LANCZOS)
 enlarged=enlarged.filter(ImageFilter.UnsharpMask(radius=1.25,percent=115,threshold=2))
 enlarged.save(out,'WEBP',quality=94,method=5)
 print('[HIGHFLY P4.4 BRAND] Official original restored',original.size,'enhanced copy',enlarged.size)
print('[HIGHFLY P4.4] Normalized rarity frames and 15 occupation borders; distinctive Engineering gear art.')
