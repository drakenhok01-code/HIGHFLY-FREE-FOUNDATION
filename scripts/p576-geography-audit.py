"""Read-only P576 geography comparison on the real P575 native height rasters."""
import json, math, sys, heapq, random
from pathlib import Path
import numpy as np
from PIL import Image
root=Path('dist/highfly')
out=Path('p576-audit');out.mkdir(exist_ok=True)
def read(p):return json.loads((root/p).read_text())
meta=read('native-terrain-manifest.json')['meta']
overview=read('native-overview.json')
regions=sorted(read('regions-p575/placements.json')['placements'],key=lambda p:p['seed'])
beacons={'petal':(-385,-392),'cantor':(53,-490.5),'choir':(171.2,-36.2),'east':(568.8,-427.8),'south3':(517,424),'aurel':(148.6,542.6),'south1':(-392.4,438.4),'crown':(-993.7,-156.7)}
raster={}
for k in ['core','region']:
 a=np.asarray(Image.open(root/f'native-terrain-{k}.png').convert('RGBA')).astype(np.float32);m=meta[k]
 raster[k]=m['min']+(a[:,:,0]*256+a[:,:,1])*(m['max']-m['min'])/65535
 raster[k].astype('<f4').tofile(out/f'{k}.bin')
(out/'meta.json').write_text(json.dumps(meta))
def sample(k,x,z):
 m=meta[k];a=raster[k];n=m['res'];fx=np.clip((np.asarray(x)/m['size']+.5)*n-.5,0,n-1.0001);fz=np.clip((np.asarray(z)/m['size']+.5)*n-.5,0,n-1.0001)
 ix=fx.astype(int);iz=fz.astype(int);tx=fx-ix;tz=fz-iz
 return (a[iz,ix]*(1-tx)+a[iz,ix+1]*tx)*(1-tz)+(a[iz+1,ix]*(1-tx)+a[iz+1,ix+1]*tx)*tz
def height(x,z):
 e=np.maximum(np.abs(x),np.abs(z))/(meta['core']['size']/2);t=np.clip((e-.9)/.085,0,1);t=t*t*(3-2*t)
 return sample('core',x,z)*(1-t)+sample('region',x,z)*t
def edge(b,x,z):return math.hypot(max(b['minX']-x,0,x-b['maxX']),max(b['minZ']-z,0,z-b['maxZ']))
def overlap(a,b,gap=80):return a['minX']<b['maxX']+gap and a['maxX']>b['minX']-gap and a['minZ']<b['maxZ']+gap and a['maxZ']>b['minZ']-gap
core=dict(minX=-1080,maxX=1080,minZ=-1080,maxZ=1080)
route=[]
for line in overview.get('routes',[]):
 for (x,z),(u,v) in zip(line,line[1:]):
  n=max(1,math.ceil(math.hypot(u-x,v-z)/8))
  route.extend((x+(u-x)*i/n,z+(v-z)*i/n) for i in range(n+1))
route=np.array(route)
STEP=32;LIMIT=4352;axis=np.arange(-LIMIT,LIMIT+1,STEP);N=len(axis);X,Z=np.meshgrid(axis,axis);H=height(X,Z)
# Multi-source shortest native dry path from the original network (no imaginary traversable water).
D=np.full((N,N),np.inf);B=np.full((N,N),-1,dtype=np.int16);names=list(beacons);queue=[]
for k,(x,z) in enumerate(beacons.values()):
 iy,ix=round((z+LIMIT)/STEP),round((x+LIMIT)/STEP)
 for j in range(max(0,iy-2),min(N,iy+3)):
  for i in range(max(0,ix-2),min(N,ix+3)):
   if H[j,i]<.8:continue
   d=math.hypot(axis[i]-x,axis[j]-z)
   if d<D[j,i]:D[j,i]=d;B[j,i]=k;heapq.heappush(queue,(d,j,i,k))
while queue:
 d,j,i,k=heapq.heappop(queue)
 if d!=D[j,i]:continue
 for dj,di in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]:
  y,x=j+dj,i+di
  if not(0<=y<N and 0<=x<N) or H[y,x]<.8:continue
  if di and dj and (H[j,x]<.8 or H[y,i]<.8):continue
  run=STEP*math.hypot(di,dj);slope=abs(float(H[y,x]-H[j,i]))/run
  if slope>.55:continue
  nd=d+run*(1+1.5*slope)
  if nd<D[y,x]:D[y,x]=nd;B[y,x]=k;heapq.heappush(queue,(nd,y,x,k))
def access(b):
 # Search near edge, outside the region. Choose a dry and locally flat station.
 dx=np.maximum(np.maximum(b['minX']-X,0),X-b['maxX']);dz=np.maximum(np.maximum(b['minZ']-Z,0),Z-b['maxZ']);ed=np.hypot(dx,dz)
 valid=(ed>=12)&(ed<=90)&(H>.9)
 ys,xs=np.where(valid)
 stations=[]
 for j,i in zip(ys,xs):
  x,z=float(axis[i]),float(axis[j]);h=float(H[j,i]);a=np.array([height(x+u,z+v) for u,v in [(0,0),(4,0),(-4,0),(0,4),(0,-4)]])
  if a.min()<.8 or a.max()-a.min()>1.6:continue
  k=min(range(len(names)),key=lambda k:math.hypot(x-beacons[names[k]][0],z-beacons[names[k]][1]))
  near=math.hypot(x-beacons[names[k]][0],z-beacons[names[k]][1])
  walk=float(D[j,i])
  cost=near*.45+float(ed[j,i])*2+float(a.max()-a.min())*15+(0 if math.isfinite(walk) else 150)
  stations.append((cost,{'x':int(x),'z':int(z),'y':round(h,2),'edgeM':round(float(ed[j,i])),'nearest':names[k],'lineM':round(near),'walkWeightedM':round(walk) if math.isfinite(walk) else None,'walkFrom':names[int(B[j,i])] if B[j,i]>=0 else None}))
 if not stations:return None
 return min(stations,key=lambda q:q[0])[1]
def candidate(p,x,z):
 b={k:v+(x-p['x'] if k.endswith('X') else z-p['z']) for k,v in p['bounds'].items()}
 if max(abs(v) for v in b.values())>4200 or overlap(b,core,0):return None
 if route.size and np.any((route[:,0]>b['minX']-12)&(route[:,0]<b['maxX']+12)&(route[:,1]>b['minZ']-12)&(route[:,1]<b['maxZ']+12)):return None
 xx,zz=np.meshgrid(np.linspace(b['minX'],b['maxX'],9),np.linspace(b['minZ'],b['maxZ'],9));h=height(xx,zz);wet=float(np.mean(h<.1));land=h[h>=.1]
 maritime=p['seed'] in [3,6]
 if not len(land) or wet>(.68 if maritime else .23) or (maritime and wet<.08):return None
 median=float(np.median(land));spread=float(np.percentile(land,90)-np.percentile(land,10));base=0 if maritime and wet>.12 else median
 # Keep the relative geographic identity, but favor a shorter journey.
 rad=math.hypot(x,z);ang=math.atan2(z,x)-math.atan2(p['z'],p['x']);ang=abs(math.atan2(math.sin(ang),math.cos(ang)))
 distance=min(edge(b,*v) for v in beacons.values())
 score=distance*.6+rad*.1+spread*7+ang*180+abs(wet-(.27 if maritime else .03))*200
 return {'seed':p['seed'],'city':p['city'],'x':x,'z':z,'base':round(base,2),'bounds':b,'wet':round(wet,3),'spread':round(spread,2),'nearestEdgeM':round(distance),'score':score,'moveM':round(math.hypot(x-p['x'],z-p['z']))}
pool={}
for p in regions:
 opts=[]
 for x in range(-2800,2801,100):
  for z in range(-2800,2801,100):
   v=candidate(p,x,z)
   if v:opts.append(v)
 opts.sort(key=lambda v:v['score'])
 # Preserve the current site as a fallback, even if outside the new compact search radius.
 old=candidate(p,p['x'],p['z'])
 if old:opts.append(old)
 pool[p['seed']]=opts[:160]+([old] if old else [])
 print('HF576_POOL',p['city'],len(opts),flush=True)
# Multiple deterministic greedy passes; no overlap; prefer compact arrangements with diverse open corridors.
rng=random.Random(576);best=None
for trial in range(240):
 order=sorted(regions,key=lambda p:-(p['bounds']['maxX']-p['bounds']['minX'])*(p['bounds']['maxZ']-p['bounds']['minZ'])) if trial==0 else rng.sample(regions,len(regions))
 chosen=[]
 for p in order:
  opts=[v for v in pool[p['seed']] if not any(overlap(v['bounds'],q['bounds'],160) for q in chosen)]
  if not opts:break
  v=opts[0] if trial==0 else min(opts[:35],key=lambda q:q['score']+rng.uniform(0,160))
  chosen.append(v)
 if len(chosen)==8:
  score=sum(v['score'] for v in chosen)
  if best is None or score<best[0]:best=(score,chosen)
if best is None:raise RuntimeError('No safe compact layout among tested candidates')
current=[];compact=[]
for p in regions:
 b=p['bounds'];station=access(b);current.append({'seed':p['seed'],'city':p['city'],'x':p['x'],'z':p['z'],'base':p['base'],'nearestEdgeM':round(min(edge(b,*v) for v in beacons.values())),'station':station,'bounds':b})
for p in sorted(best[1],key=lambda p:p['seed']):
 p['station']=access(p['bounds']);compact.append(p)
for a,b in zip(current,compact):
 print('HF576_GEO',json.dumps({'city':a['city'],'current':{k:a[k] for k in ['x','z','nearestEdgeM','station']},'compact':{k:b[k] for k in ['x','z','base','nearestEdgeM','station','moveM','wet','spread']}}),flush=True)
report={'current':current,'compact':compact,'nativeBeacons':beacons,'spawn':overview.get('spawn'),'notes':['Native raster candidate search only, not physical route validation.','Station coordinates are outside city footprints; proposed, not placed.','Weighted dry approach is coarse and excludes water; null means no path found at grid resolution.','Do not apply until approved.']}
(out/'geography.json').write_text(json.dumps(report,indent=2))
print('HF576_GEO_SUMMARY',json.dumps({'currentMeanEdge':round(np.mean([p['nearestEdgeM'] for p in current])),'compactMeanEdge':round(np.mean([p['nearestEdgeM'] for p in compact])),'currentMaxEdge':max(p['nearestEdgeM'] for p in current),'compactMaxEdge':max(p['nearestEdgeM'] for p in compact),'nativeBeacons':len(beacons)}),flush=True)
