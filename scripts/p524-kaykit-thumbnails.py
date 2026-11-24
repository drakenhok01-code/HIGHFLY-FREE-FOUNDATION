#!/usr/bin/env python3
"""Produce real (not emoji/fake) isometric PNG catalog thumbnails from official CC0 glTF.
CPU-only; same model vertices, UVs and texture atlas used in the 3D game.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw
root=Path('public/highfly/kaykit-free')
manifest=json.loads((root/'manifest.json').read_text())
dest=root/'thumbs';dest.mkdir(exist_ok=True)
atlas=Image.open(root/'hexagons_medieval.png').convert('RGB')
W,H=atlas.size
for rec in manifest['models']:
 name=rec['model'].removesuffix('.gltf')
 gltf=json.loads((root/rec['model']).read_text())
 raw=(root/(name+'.bin')).read_bytes()
 p=gltf['meshes'][0]['primitives'][0]
 def accessor(id):
  a=gltf['accessors'][id];v=gltf['bufferViews'][a['bufferView']]
  n={'VEC3':3,'VEC2':2,'SCALAR':1}[a['type']]
  dt={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']]
  off=v.get('byteOffset',0)+a.get('byteOffset',0)
  return np.frombuffer(raw,dtype=dt,count=a['count']*n,offset=off).reshape((-1,n))
 pts=accessor(p['attributes']['POSITION']).astype(np.float32)
 uv=accessor(p['attributes']['TEXCOORD_0']).astype(np.float32)
 idx=accessor(p['indices']).reshape(-1,3).astype(np.int32)
 X=pts[:,0]-pts[:,2]
 Y=(pts[:,0]+pts[:,2])*.48-pts[:,1]*1.45
 x0,x1=float(np.min(X)),float(np.max(X))
 y0,y1=float(np.min(Y)),float(np.max(Y))
 span=max(x1-x0,y1-y0,.001)
 factor=205/span
 ox=128-(x0+x1)*.5*factor
 oy=122-(y0+y1)*.5*factor
 screen=np.stack((X*factor+ox,Y*factor+oy),axis=1)
 im=Image.new('RGBA',(256,256),(0,0,0,0));draw=ImageDraw.Draw(im,'RGBA')
 # Back-to-front isometric painter's sorting, lit from upper-left.
 tpts=pts[idx]
 depth=np.mean(tpts[:,:,0]+tpts[:,:,2]+.2*tpts[:,:,1],axis=1)
 order=np.argsort(depth)
 for t in order:
  a,b,c=(int(x) for x in idx[t])
  coords=[tuple(float(v) for v in screen[k]) for k in (a,b,c)]
  texture=np.mean(uv[[a,b,c]],axis=0)
  tx=int(np.clip(texture[0],0,.999999)*W)
  ty=int((1-np.clip(texture[1],0,.999999))*H)
  rgb=atlas.getpixel((tx,ty))
  normal=np.cross(pts[b]-pts[a],pts[c]-pts[a])
  norm=np.linalg.norm(normal)
  if norm<1e-8:continue
  normal/=norm
  lit=.68+.30*max(0,float(np.dot(normal,[-.52,.79,.34])))
  col=tuple(int(np.clip(v*lit,0,255)) for v in rgb)
  draw.polygon(coords,fill=(*col,255))
 # Maintain large thumbs readable on a small Samsung landscape display.
 im.resize((116,116),Image.Resampling.LANCZOS).save(dest/(name+'.png'),optimize=True)
 print('[KAYKIT THUMB]',name,'triangles',len(idx))
print('[P524 PASS]',len(manifest['models']),'model-derived CC0 icon thumbnails')
