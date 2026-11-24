#!/usr/bin/env python3
"""P522: render exact native Unsung structure triangles & tree instances into transparent aerial references.
This is a CPU-only cartographic preview, not a simulated gameplay or a 3D screenshot.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw
p=Path('public/highfly')
data=json.loads((p/'native-overview.json').read_text())
tri=np.fromfile(p/'native-architecture-triangles.bin',dtype='<f4')
if tri.size%8:raise RuntimeError('malformed world architecture')
tri=tri.reshape(-1,8)
mats=[
 (128,129,137,235), # actual M.ASHLAR
 (201,199,194,239), # M.MARBLE
 (226,182,100,245), # M.GOLD
 (109,78,91,244),   # M.ROOF
 (170,167,145,246), # M.PAVING
 (164,134,145,244), # M.FRIEZE
 (127,185,196,236), # M.GLASS
 (80,76,86,244)     # M.DARK
]
tree_colors=[
 (154,75,66,202),  # ember
 (205,145,176,218), # blossom
 (171,155,202,214), # elder
 (49,87,69,216),   # cypress
 (67,130,87,213)   # green
]
v_species=['ember','ember','ember','blossom','blossom','elder','elder','cypress','cypress','green','green','green']
radii={'ember':6.5,'blossom':6.0,'elder':7.5,'cypress':2.2,'green':6}
sources=[('core',2048),('region',16384)]
for name,worldsize in sources:
 res=2048
 if name=='core':res=2048
 origin=worldsize/2
 img=Image.new('RGBA',(res,res),(0,0,0,0)); draw=ImageDraw.Draw(img,'RGBA')
 # Roofs and stone from native THREE.Mesh geometry; the highest projected
 # surfaces appear on top (we never draw imaginary buildings).
 mask=(np.max(np.abs(tri[:,[0,2,4]]),axis=1)<origin+150)&(np.max(np.abs(tri[:,[1,3,5]]),axis=1)<origin+150)
 subset=tri[mask]
 order=np.argsort(subset[:,6],kind='stable')
 for v in subset[order]:
  pts=[((float(v[j])/worldsize+.5)*res,(float(v[j+1])/worldsize+.5)*res) for j in [0,2,4]]
  if max(x for x,z in pts)<0 or min(x for x,z in pts)>=res or max(z for x,z in pts)<0 or min(z for x,z in pts)>=res:continue
  mat=int(v[7]);col=mats[mat] if 0<=mat<len(mats) else mats[0]
  draw.polygon(pts,fill=col)
 archfile=p/('native-architecture-'+name+'.png')
 img.save(archfile,optimize=True)
 trees=Image.new('RGBA',(res,res),(0,0,0,0));td=ImageDraw.Draw(trees,'RGBA')
 n=0
 for tx,tz,scale,vi in data['trees']:
  if abs(tx)>origin+50 or abs(tz)>origin+50:continue
  sp=v_species[int(vi)];rad=radii[sp]*scale
  x=(tx/worldsize+.5)*res;z=(tz/worldsize+.5)*res;rp=max(.7,rad/worldsize*res)
  if x+rp<0 or x-rp>=res or z+rp<0 or z-rp>=res:continue
  col=tree_colors[0 if sp=='ember' else 1 if sp=='blossom' else 2 if sp=='elder' else 3 if sp=='cypress' else 4]
  td.ellipse((x-rp,z-rp,x+rp,z+rp),fill=col,outline=(23,51,40,155),width=1 if rp<3 else 2)
  if rp>4:td.arc((x-rp*.73,z-rp*.77,x+rp*.4,z+rp*.4),170,340,fill=(238,242,202,95),width=1)
  n+=1
 treefile=p/('native-trees-'+name+'.png')
 trees.save(treefile,optimize=True)
 print(f'[P522 AERIAL] {name}: {len(subset):,} native roof/paving triangles; {n:,} actual Unsung trees; architecture={archfile.stat().st_size:,} B; trees={treefile.stat().st_size:,} B')
(p/'native-architecture-triangles.bin').unlink(missing_ok=True)
