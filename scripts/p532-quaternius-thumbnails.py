#!/usr/bin/env python3
"""Lightweight geometry-derived PNG previews for each strictly CC0 Quaternius GLB.
No screenshot mockups, no external art. Source geometry and PBR colors determine silhouette.
"""
from pathlib import Path
import struct,json
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path('public/highfly/quaternius-cc0')
DECODED=Path('tools/p532-decoded-quaternius')
items=json.loads((ROOT/'manifest.json').read_text())['models']
OUT=ROOT/'thumbs';OUT.mkdir(parents=True,exist_ok=True)
def glb(path):
 raw=path.read_bytes()
 if raw[:4]!=b'glTF':raise ValueError('Invalid binary glTF '+str(path))
 off=12;doc=None;binary=None
 while off+8<=len(raw):
  length,typ=struct.unpack_from('<II',raw,off);off+=8;body=raw[off:off+length];off+=length
  if typ==0x4e4f534a:doc=json.loads(body.rstrip(b'\0 \t\n').decode('utf-8'))
  elif typ==0x004e4942:binary=body
 if doc is None or binary is None:raise ValueError('GLB missing required chunk')
 return doc,binary
def read(doc,bin,i):
 a=doc['accessors'][i];view=doc['bufferViews'][a['bufferView']]
 typ={5126:'<f4',5123:'<u2',5125:'<u4',5121:'u1',5122:'<i2',5120:'i1'}[a['componentType']]
 fields={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
 dt=np.dtype(typ);stride=view.get('byteStride',fields*dt.itemsize)
 off=view.get('byteOffset',0)+a.get('byteOffset',0)
 arr=np.ndarray((a['count'],fields),dtype=dt,buffer=bin,offset=off,strides=(stride,dt.itemsize))
 return arr.copy()
for rec in items:
 rel=rec['source'].split('/public/models/',1)[1]
 input_file=DECODED/rel
 if not input_file.is_file():raise ValueError('Missing actual decoded meshopt GLB '+str(input_file))
 doc,bin=glb(input_file)
 id=rec['id'];foliage='/foliage/' in rec['source']
 if 'pine' in id:base=np.array([62,112,77],float)
 elif 'oak' in id:base=np.array([95,139,84],float)
 elif 'bush' in id or 'fern' in id:base=np.array([79,142,79],float)
 elif 'twisted' in id:base=np.array([113,123,91],float)
 elif 'dead' in id:base=np.array([135,112,94],float)
 elif 'flower' in id:base=np.array([151,167,113],float)
 elif 'rock' in id:base=np.array([137,132,135],float)
 elif 'well' in id:base=np.array([168,160,147],float)
 elif 'lantern' in id:base=np.array([207,165,82],float)
 else:base=np.array([170,140,108],float)
 primitives=[]
 for mesh in doc.get('meshes',[]):
  for obj in mesh.get('primitives',[]):
   if 'POSITION' not in obj.get('attributes',{}):continue
   p=read(doc,bin,obj['attributes']['POSITION']).astype(float)
   if 'indices' in obj:ind=read(doc,bin,obj['indices']).flatten()
   else:ind=np.arange(len(p),dtype=int)
   n=len(ind)//3
   if n<1:continue
   inds=ind[:n*3].reshape((-1,3))
   if len(inds)>6500:inds=inds[::int(np.ceil(len(inds)/6500))]
   material=doc.get('materials',[])
   m=material[obj['material']] if 'material' in obj and obj['material']<len(material) else {}
   tint=m.get('pbrMetallicRoughness',{}).get('baseColorFactor',[1,1,1,1])
   tint=np.array(tint[:3],dtype=float)
   if np.max(tint)-np.min(tint)<.07 and np.min(tint)>.8:tint=np.ones(3)
   primitives.append((p,inds,tint))
 if not primitives:raise ValueError('No model triangles in '+id)
 combined=np.concatenate([p for p,_,_ in primitives])
 ranges=combined.max(axis=0)-combined.min(axis=0)
 center=(combined.max(axis=0)+combined.min(axis=0))*.5
 def project(p):
  pt=p-center
  return np.column_stack((pt[:,0]-pt[:,2],(pt[:,0]+pt[:,2])*.42-pt[:,1]*1.45))
 whole=project(combined)
 span=np.ptp(whole,axis=0)
 scale=min(150/max(.001,span[0]),152/max(.001,span[1]))
 img=Image.new('RGBA',(192,192),(0,0,0,0));draw=ImageDraw.Draw(img,'RGBA')
 batch=[]
 for p,inds,tint in primitives:
  projected=project(p)*scale+np.array([96,100])
  triangles=p[inds];norm=np.cross(triangles[:,1]-triangles[:,0],triangles[:,2]-triangles[:,0])
  norm=norm/np.maximum(np.linalg.norm(norm,axis=1,keepdims=True),1e-9)
  shades=.63+.39*np.maximum(0,np.dot(norm,np.array([-.22,.8,.45])))
  depths=np.mean(triangles[:,:,0]+triangles[:,:,2]+triangles[:,:,1]*.16,axis=1)
  for i in range(len(inds)):
   xy=projected[inds[i]]
   color=np.clip(base*tint*shades[i]+11,0,255).astype(np.uint8)
   batch.append((depths[i],xy,tuple(map(int,color))+(255,)))
 for _,xy,color in sorted(batch,key=lambda v:v[0]):
  draw.polygon([tuple(float(x) for x in v) for v in xy],fill=color)
 img.resize((128,128),Image.Resampling.LANCZOS).save(OUT/(id+'.png'),optimize=True)
print('[P532 QUATERNIUS THUMBNAILS]',len(items),'source-geometry-derived CC0 icons')
