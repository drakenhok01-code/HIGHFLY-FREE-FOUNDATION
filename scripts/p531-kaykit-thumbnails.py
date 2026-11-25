#!/usr/bin/env python3
"""Generate 221 actual model-driven thumbnail PNGs for KayKit FREE CC0.
Read the official glTF mesh, UV coordinates and bundled atlas only; no render API.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw

root=Path('public/highfly/kaykit-free')
records=json.loads((root/'all-manifest.json').read_text())['models']
out=root/'thumbs-all'
out.mkdir(exist_ok=True)
atlas_cache={}
for record in records:
   f=root/'all'/record['freePath']
   gltf=json.loads(f.read_text())
   folder=f.parent
   raw=(folder/gltf['buffers'][0]['uri']).read_bytes()
   images=gltf.get('images',[])
   atlas_path=folder/images[0]['uri'] if images and images[0].get('uri') else root/'hexagons_medieval.png'
   if atlas_path not in atlas_cache:atlas_cache[atlas_path]=Image.open(atlas_path).convert('RGB')
   atlas=atlas_cache[atlas_path];aw,ah=atlas.size
   primitive=gltf['meshes'][0]['primitives'][0]
   def accessor(i):
     a=gltf['accessors'][i]
     v=gltf['bufferViews'][a['bufferView']]
     dt={5126:'<f4',5123:'<u2',5125:'<u4',5121:'u1'}[a['componentType']]
     n={'VEC3':3,'VEC2':2,'VEC4':4,'SCALAR':1}[a['type']]
     off=v.get('byteOffset',0)+a.get('byteOffset',0)
     return np.frombuffer(raw,dtype=dt,count=n*a['count'],offset=off).reshape((-1,n))
   pos=accessor(primitive['attributes']['POSITION']).astype(np.float32)
   uv=(accessor(primitive['attributes']['TEXCOORD_0']).astype(np.float32)
       if 'TEXCOORD_0' in primitive['attributes'] else np.zeros((len(pos),2),np.float32))
   idx=accessor(primitive['indices']).reshape(-1,3)
   if len(idx)>3500:idx=idx[::int(np.ceil(len(idx)/3500))]
   proj=np.column_stack((pos[:,0]-pos[:,2],(pos[:,0]+pos[:,2])*.45-pos[:,1]*1.3))
   lim=np.ptp(proj,axis=0)
   scale=176/max(float(lim[0]),float(lim[1]),.001)
   mid=(np.max(proj,axis=0)+np.min(proj,axis=0))*.5
   screen=(proj-mid)*scale+np.array([96,96])
   image=Image.new('RGBA',(192,192),(0,0,0,0))
   draw=ImageDraw.Draw(image,'RGBA')
   order=np.argsort(np.mean(pos[idx,:,0]+pos[idx,:,2]+.2*pos[idx,:,1],axis=1))
   for i in order:
     a,b,c=map(int,idx[i])
     normal=np.cross(pos[b]-pos[a],pos[c]-pos[a])
     norm=np.linalg.norm(normal)
     if norm<1e-8:continue
     normal=normal/norm
     sample=np.mean(uv[[a,b,c]],axis=0)
     x=int(np.clip(sample[0],0,.999999)*aw)
     y=int((1-np.clip(sample[1],0,.999999))*ah)
     col=atlas.getpixel((x,y))
     k=.72+.24*max(0,float(np.dot(normal,np.array([-.52,.79,.34]))))
     rgb=tuple(int(np.clip(z*k,0,255)) for z in col)
     draw.polygon([tuple(float(v) for v in screen[k]) for k in (a,b,c)],fill=rgb+(255,))
   image.resize((128,128),Image.Resampling.LANCZOS).save(out/(record['thumbName']+'.png'),optimize=True)
print('[P531 FREE THUMBNAILS]',len(records),'original 3D model screenshots from glTF geometry, texture UVs')
