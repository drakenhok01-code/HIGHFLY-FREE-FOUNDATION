"""P564 read-only geography audit + pre-rendered minimap region overlays.
Uses exact published P561 source data; never modifies placements.json.
Coarse slope/water routes are candidates, not validated navigation meshes."""
import json, math, heapq, sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
root=Path(sys.argv[1] if len(sys.argv)>1 else 'dist/highfly')
out=root/'p564';out.mkdir(exist_ok=True)
def read(p):return json.loads(p.read_text())
meta=read(root/'native-terrain-manifest.json')['meta']
regions=read(root/'regions/placements.json')['placements']
beacons={'petal':(-385,-392),'cantor':(53,-490.5),'choir':(171.2,-36.2),'east':(568.8,-427.8),'south3':(517,424),'aurel':(148.6,542.6),'south1':(-392.4,438.4),'crown':(-993.7,-156.7)}
raster={}
for k in ['core','region']:
 a=np.asarray(Image.open(root/f'native-terrain-{k}.png').convert('RGBA')).astype(np.float32)
 m=meta[k];raster[k]=m['min']+(a[:,:,0]*256+a[:,:,1])*(m['max']-m['min'])/65535
def sample(k,x,z):
 m=meta[k];a=raster[k];n=m['res'];fx=np.clip((np.asarray(x)/m['size']+.5)*n-.5,0,n-1.0001);fz=np.clip((np.asarray(z)/m['size']+.5)*n-.5,0,n-1.0001)
 ix=fx.astype(int);iz=fz.astype(int);tx=fx-ix;tz=fz-iz
 return (a[iz,ix]*(1-tx)+a[iz,ix+1]*tx)*(1-tz)+(a[iz+1,ix]*(1-tx)+a[iz+1,ix+1]*tx)*tz
def height(x,z):
 e=np.maximum(np.abs(x),np.abs(z))/(meta['core']['size']/2);t=np.clip((e-.9)/.085,0,1);t=t*t*(3-2*t)
 return sample('core',x,z)*(1-t)+sample('region',x,z)*t
STEP=32;LIMIT=4352;axis=np.arange(-LIMIT,LIMIT+1,STEP);N=len(axis);X,Z=np.meshgrid(axis,axis);H=height(X,Z)
def idx(x,z):return int(round((z+LIMIT)/STEP)),int(round((x+LIMIT)/STEP))
def distances(x,z):
 iy,ix=idx(x,z);starts=[(math.hypot(axis[j]-x,axis[i]-z),i,j) for i in range(max(0,iy-2),min(N,iy+3)) for j in range(max(0,ix-2),min(N,ix+3)) if H[i,j]>.8]
 d=np.full((N,N),np.inf);prev=np.full((N,N,2),-1,dtype=np.int16)
 if not starts:return d,prev,None
 off,i,j=min(starts);d[i,j]=off;q=[(off,i,j)]
 while q:
  cost,i,j=heapq.heappop(q)
  if cost!=d[i,j]:continue
  for di,dj in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)]:
   y,z=i+di,j+dj
   if not(0<=y<N and 0<=z<N) or H[y,z]<.8:continue
   # No diagonal shortcuts across wet grid cells.
   if di and dj and (H[i,z]<.8 or H[y,j]<.8):continue
   run=STEP*math.hypot(di,dj);slope=abs(float(H[y,z]-H[i,j]))/run
   if slope>.65:continue
   nd=cost+run*(1+2*slope)
   if nd<d[y,z]:d[y,z]=nd;prev[y,z]=[i,j];heapq.heappush(q,(nd,y,z))
 return d,prev,(i,j) if not starts else min(starts)[1:]
fields={k:distances(*v) for k,v in beacons.items()}
def edge(b,x,z):return math.hypot(max(b['minX']-x,0,x-b['maxX']),max(b['minZ']-z,0,z-b['maxZ']))
def route(b):
 best=None
 for name,(x,z) in beacons.items():
  d,prev,start=fields[name]
  # Candidates on dry land just outside actual regional bounds.
  for j in range(max(0,idx(b['minX']-96,0)[1]),min(N,idx(b['maxX']+96,0)[1]+1)):
   for i in range(max(0,idx(0,b['minZ']-96)[0]),min(N,idx(0,b['maxZ']+96)[0]+1)):
    ed=edge(b,axis[j],axis[i])
    if ed<=0 or ed>80 or not math.isfinite(d[i,j]):continue
    cost=float(d[i,j])+ed
    if best is None or cost<best[0]:best=(cost,name,i,j,ed)
 if best is None:return None
 cost,name,i,j,ed=best;d,prev,start=fields[name];path=[];length=0;maxs=0
 while i>=0 and j>=0:
  path.append([int(axis[j]),int(axis[i]),round(float(H[i,j]),1)])
  a,c=map(int,prev[i,j])
  if a<0:break
  run=STEP*math.hypot(a-i,c-j);length+=run;maxs=max(maxs,abs(float(H[a,c]-H[i,j]))/run);i,j=a,c
 return {'beacon':name,'weightedCost':round(cost),'gridRouteM':round(length+ed),'maxGridSlope':round(maxs,3),'path':path[::-1],'beaconSnapM':round(math.hypot(path[-1][0]-beacons[name][0],path[-1][1]-beacons[name][1]))}
def overlap(a,b):return a['minX']<b['maxX']+48 and a['maxX']>b['minX']-48 and a['minZ']<b['maxZ']+48 and a['maxZ']>b['minZ']-48
overview=read(root/'native-overview.json');routes=overview.get('routes',[])
def protected(b):
 if b['minX']<1080 and b['maxX']>-1080 and b['minZ']<1080 and b['maxZ']>-1080:return True
 for line in routes:
  for (x,z),(u,v) in zip(line,line[1:]):
   if min(x,u)>b['maxX']+12 or max(x,u)<b['minX']-12 or min(z,v)>b['maxZ']+12 or max(z,v)<b['minZ']-12:continue
   # Conservatively reject overlapping route segment bounding box.
   return True
 return False
results=[];atlas=[]
for p in sorted(regions,key=lambda x:x['seed']):
 seed=p['seed'];b=p['bounds'];source=read(root/'regions'/f'island-{seed}.json');s=p['scale'];zcounts={}
 for q in source.get('zones',[]):zcounts[q['kind']]=zcounts.get(q['kind'],0)+1
 existing=route(b);nearest=min(beacons,key=lambda n:edge(b,*beacons[n]))
 candidates=[]
 for x in range(-2800,2801,200):
  for z in range(-2800,2801,200):
   nb={k:v+(x-p['x'] if k.endswith('X') else z-p['z']) for k,v in b.items()}
   if protected(nb) or any(overlap(nb,q['bounds']) for q in regions if q['seed']!=seed):continue
   ed=min(edge(nb,*v) for v in beacons.values())
   if ed<250 or ed>1400:continue
   xx,zz=np.meshgrid(np.linspace(nb['minX'],nb['maxX'],11),np.linspace(nb['minZ'],nb['maxZ'],11));h=height(xx,zz);wet=float(np.mean(h<.1));land=h[h>=.1]
   maritime=bool(p.get('maritime'))
   if not len(land) or wet>(.68 if maritime else .25):continue
   if maritime and wet<.08:continue
   spread=float(np.percentile(land,90)-np.percentile(land,10));base=0 if maritime and wet>.12 else float(np.median(land))
   score=abs(ed-850)*.12+spread*6+abs(wet-(.35 if maritime else 0))*120
   candidates.append((score,x,z,nb,ed,wet,spread,base))
 suggestions=[]
 for score,x,z,nb,ed,wet,spread,base in sorted(candidates,key=lambda t:t[0])[:12]:
  rr=route(nb)
  if rr:suggestions.append({'x':x,'z':z,'bounds':nb,'base':round(base,2),'edgeM':round(ed),'wetFraction':round(wet,3),'heightSpread':round(spread,1),'route':rr,'score':round(score+rr['weightedCost']*.08,1)})
 suggestions.sort(key=lambda q:q['score'])
 row={'seed':seed,'center':[p['x'],p['z']],'bounds':b,'nearest':nearest,'edgeM':round(edge(b,*beacons[nearest])),'zones':zcounts,'currentRoute':existing,'candidates':suggestions[:3]}
 results.append(row);print('HF564_REGION '+json.dumps({**row,'currentRoute':None if not existing else {k:v for k,v in existing.items() if k!='path'},'candidates':[{**q,'route':{k:v for k,v in q['route'].items() if k!='path'}} for q in suggestions[:3]]}),flush=True)
 # True source tiles, paths and building positions: schematic, not fabricated geometry.
 W=640;spanx=b['maxX']-b['minX'];spanz=b['maxZ']-b['minZ'];HH=max(1,round(W*spanz/spanx));im=Image.new('RGBA',(W,HH));draw=ImageDraw.Draw(im)
 def px(x,z):return ((p['x']+x*s-b['minX'])/spanx*W,(p['z']+z*s-b['minZ'])/spanz*HH)
 colors={'water':'#386a89','soil':'#aa9365','dirt':'#a98e65','sand':'#cbb685','paved':'#b6b5ae'}
 for tile in source['tiles']:
  x,z=tile['x'],tile['z'];r=source['tileRadius'];pts=[px(x+math.cos(math.pi/3*k+math.pi/6)*r,z+math.sin(math.pi/3*k+math.pi/6)*r) for k in range(6)]
  draw.polygon(pts,fill=colors.get(tile['ground'],'#64885b'))
 paths=source.get('paths',[])
 for i in range(0,len(paths)-8,9):draw.polygon([px(paths[i+j],paths[i+j+2]) for j in (0,3,6)],fill='#dfc69b')
 buildings=0
 for q in source['pieces']:
  name=q['piece'].lower()
  if not any(k in name for k in ['building-','castle','tower','windmill','watermill','barracks','lumbermill']):continue
  x,z=px(q['x'],q['z']);r=max(1.1,min(3,1.6*q.get('scale',1)));draw.rectangle((x-r,z-r,x+r,z+r),fill='#e5dbc4',outline='#635244');buildings+=1
 im.save(out/f'region-{seed}.png');atlas.append({'seed':seed,'bounds':b,'image':f'region-{seed}.png','buildingMarkers':buildings})
(out/'geography-audit.json').write_text(json.dumps({'note':'32 m grid on native raster; slope <=0.65; native dry land only, no physical navigation validation. Candidates not applied and may overlap each other. Original P561 placements untouched.','regions':results},indent=2))
(out/'atlas.json').write_text(json.dumps({'schema':1,'meta':meta,'regions':atlas}))
assert len(results)==8 and len(atlas)==8
