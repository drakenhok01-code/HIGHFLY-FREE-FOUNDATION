"""P575: rebuild the real regional overlays from the approved source worlds."""
import json,math,sys
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(sys.argv[1] if len(sys.argv)>1 else 'dist/highfly')
out=root/'p564-p575';out.mkdir(exist_ok=True)
def read(p):return json.loads(p.read_text())
meta=read(root/'native-terrain-manifest.json')['meta']
regions=read(root/'regions-p575/placements.json')['placements']
atlas=[]
for p in sorted(regions,key=lambda q:q['seed']):
 seed=p['seed'];b=p['bounds'];source=read(root/'regions-p575'/f'island-{seed}.json');s=p['scale']
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
(out/'atlas.json').write_text(json.dumps({'schema':1,'meta':meta,'regions':atlas}))
assert len(atlas)==8
print('HF575_ATLAS',len(atlas))
