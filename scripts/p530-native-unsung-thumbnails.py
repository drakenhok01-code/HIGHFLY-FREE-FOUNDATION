#!/usr/bin/env python3
"""Render lightweight original Unsung 3D prefab thumbnails from exact MeshBuilder geometry.
Uses Pillow + numpy already pinned in HIGHFLY build; no external image assets.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw,ImageFilter

root=Path("public/highfly")
meta=json.loads((root/"unsung-original-prefabs.json").read_text())
data=(root/"unsung-original-prefabs.bin").read_bytes()
out=root/"unsung-original"/"thumbs"
out.mkdir(parents=True,exist_ok=True)
palette=np.array([(164,161,160),(214,212,203),(232,189,117),(146,121,143),
                  (178,167,155),(170,161,165),(132,182,191),(81,75,83)],dtype=np.float32)
SCALE=2
W,H=156*SCALE,110*SCALE
for spec in meta["models"]:
    fields=spec["fields"]
    def array(name,dtype):
        f=fields[name];return np.frombuffer(data,dtype=dtype,count=f["length"]//np.dtype(dtype).itemsize,offset=f["offset"])
    vertices=array("position",'<f4').reshape(-1,3)
    indices=array("index",'<u4').reshape(-1,3)
    mats=array("material",'u1')
    center=np.array(spec["box"]["center"])
    pts=vertices-center
    proj=np.column_stack(((pts[:,0]-pts[:,2])*.79,(pts[:,0]+pts[:,2])*.33-pts[:,1]*.86))
    span=np.max(proj,axis=0)-np.min(proj,axis=0)
    fac=min(W*.76/max(1.,span[0]),H*.79/max(1.,span[1]),10.)
    proj=proj*fac
    proj[:,0]+=W/2-(np.max(proj[:,0])+np.min(proj[:,0]))*.5
    proj[:,1]+=H/2-(np.max(proj[:,1])+np.min(proj[:,1]))*.5+4*SCALE
    img=Image.new("RGB",(W,H),(32,31,49))
    d=ImageDraw.Draw(img)
    # Restrict to visible triangle subsets for consistent CI runtime.
    total=len(indices)
    if total>12000: indices=indices[::int(np.ceil(total/12000))]
    a=vertices[indices[:,0]];b=vertices[indices[:,1]];c=vertices[indices[:,2]]
    normals=np.cross(b-a,c-a)
    lengths=np.linalg.norm(normals,axis=1);normals=normals/np.maximum(lengths[:,None],1e-4)
    # Eye above (+x,+y,+z). Skip back-faces in thumbnail only.
    eye=np.array([.6,.67,.6]);valid=np.einsum('ij,j->i',normals,eye)>-.03
    shade=.61+.39*np.maximum(0,np.einsum('ij,j->i',normals,np.array([-.2,.83,.5])))
    depth=(a[:,0]+b[:,0]+c[:,0]+a[:,2]+b[:,2]+c[:,2])/6
    for j in np.argsort(depth):
        if not valid[j]:continue
        ix=indices[j];xy=proj[ix]
        if np.abs(np.linalg.det(np.array([[xy[1,0]-xy[0,0],xy[1,1]-xy[0,1]],
                                      [xy[2,0]-xy[0,0],xy[2,1]-xy[0,1]]])))<.9:continue
        col=np.clip(palette[int(mats[ix[0]])%8]*shade[j]+12,0,255).astype(np.uint8)
        d.polygon([tuple(x) for x in xy],fill=tuple(map(int,col)))
    img=img.resize((W//SCALE,H//SCALE),Image.Resampling.LANCZOS)
    img.save(out/(spec["id"]+".png"),optimize=True)
print("[P530 UNSUNG THUMBNAILS]",len(meta["models"]),"real source geometry thumbnails")
