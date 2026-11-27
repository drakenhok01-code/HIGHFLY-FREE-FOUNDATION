"""Fit approved islands near the previous city centres on the actual Unsung height raster."""
import json, math
from pathlib import Path
from PIL import Image
root=Path('dist/highfly')
def read(p):return json.loads((root/p).read_text())
old=read('regions/placements.json')['placements']
meta=read('native-terrain-manifest.json')['meta']
overview=read('native-overview.json')
rasters={k:Image.open(root/f'native-terrain-{k}.png').convert('RGBA') for k in ['core','region']}
def sample(k,x,z):
 m=meta[k];n=m['res'];im=rasters[k]
 fx=max(0,min(n-1.0001,(x/m['size']+.5)*n-.5));fz=max(0,min(n-1.0001,(z/m['size']+.5)*n-.5))
 i,j=int(fx),int(fz);a,b=fx-i,fz-j
 def v(i,j):
  r,g,_,_=im.getpixel((i,j));return m['min']+(r*256+g)*(m['max']-m['min'])/65535
 return (v(i,j)*(1-a)+v(i+1,j)*a)*(1-b)+(v(i,j+1)*(1-a)+v(i+1,j+1)*a)*b
def height(x,z):
 e=max(abs(x),abs(z))/(meta['core']['size']/2)
 t=max(0,min(1,(e-.9)/.085));t=t*t*(3-2*t)
 if t==0:return sample('core',x,z)
 if t==1:return sample('region',x,z)
 return sample('core',x,z)*(1-t)+sample('region',x,z)*t
def overlap(a,b,gap=48):
 return a['minX']<b['maxX']+gap and a['maxX']>b['minX']-gap and a['minZ']<b['maxZ']+gap and a['maxZ']>b['minZ']-gap
core=dict(minX=-1080,maxX=1080,minZ=-1080,maxZ=1080)
route=[]
for line in overview.get('routes',[]):
 for (x,z),(u,v) in zip(line,line[1:]):
  n=max(1,math.ceil(math.hypot(u-x,v-z)/8))
  route.extend((x+(u-x)*i/n,z+(v-z)*i/n) for i in range(n+1))
placed=[]
# Most constrained / largest footprints first.
worlds=[]
for p in old:
 d=read(f"regions-p575/island-{p['seed']}.json")
 s=p['scale'];q=d['tiles'];r=36
 local=dict(minX=min(t['x'] for t in q)*s-6,maxX=max(t['x'] for t in q)*s+6,minZ=min(t['z'] for t in q)*s-6,maxZ=max(t['z'] for t in q)*s+6)
 worlds.append((p,d,local))
worlds.sort(key=lambda w:-(w[2]['maxX']-w[2]['minX'])*(w[2]['maxZ']-w[2]['minZ']))
for p,d,l in worlds:
 seed=p['seed'];maritime=seed in [3,6] or bool(p.get('maritime'))
 def box(x,z):return dict(minX=x+l['minX']-36,maxX=x+l['maxX']+36,minZ=z+l['minZ']-36,maxZ=z+l['maxZ']+36)
 reserved=[q['bounds'] for q in old if q['seed']!=seed and not any(t['seed']==q['seed'] for t in placed)]
 candidates=[]
 # Retain the old centre if terrain and safety allow; otherwise search nearby.
 offsets=sorted(((dx,dz) for dx in range(-1200,1201,50) for dz in range(-1200,1201,50)),key=lambda q:math.hypot(*q))
 for dx,dz in offsets:
  x=p['x']+dx;z=p['z']+dz;b=box(x,z)
  if max(abs(v) for v in b.values())>4200 or overlap(b,core,0):continue
  if any(overlap(b,q['bounds']) for q in placed) or any(overlap(b,q) for q in reserved):continue
  if any(b['minX']-12<a<b['maxX']+12 and b['minZ']-12<c<b['maxZ']+12 for a,c in route):continue
  h=[height(b['minX']+(b['maxX']-b['minX'])*i/6,b['minZ']+(b['maxZ']-b['minZ'])*j/6) for i in range(7) for j in range(7)]
  land=sorted(y for y in h if y>=.1);wet=1-len(land)/49
  if not land or wet>(.68 if maritime else .25):continue
  median=land[len(land)//2];spread=land[int(.9*(len(land)-1))]-land[int(.1*(len(land)-1))]
  base=0 if maritime and wet>.12 else median
  # Strongly prefer previous geographic area and preserve native shoreline conditions.
  score=math.hypot(dx,dz)*.65+spread*5+abs(base-p['base'])*3+(abs(wet-.30)*80 if maritime else wet*300)
  candidates.append((score,x,z,b,base,wet,median,spread))
  if len(candidates)>=100:break
 if not candidates:raise RuntimeError(f'No safe placement near old region {seed}')
 score,x,z,b,base,wet,median,spread=min(candidates,key=lambda q:q[0])
 out={**p,'x':x,'z':z,'bounds':b,'localBounds':l,'base':base,'transition':36,'sourceSeed':d['sourceSeed'],'city':d['city'],'files':d['files'],'previousBounds':p['bounds'],'maritime':maritime,'nativeSample':{'landFraction':1-wet,'median':median,'spread':spread},'offset':math.hypot(x-p['x'],z-p['z'])}
 placed.append(out)
 print('HF575_SITE',json.dumps({'seed':seed,'city':d['city'],'old':[p['x'],p['z']],'new':[x,z],'offset':out['offset'],'base':base,'wet':wet,'bounds':b}),flush=True)
(root/'regions-p575/native-fit.json').write_text(json.dumps({'placements':sorted(placed,key=lambda p:p['seed'])}))
