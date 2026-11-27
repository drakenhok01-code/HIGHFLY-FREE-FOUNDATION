/* P555 playable streaming proof of concept. Keeps eight original world placements;
 * at most one high-detail region active. Original game, player and camera retained.
 * Building collisions approximate solid exteriors; no interiors or path/navmesh promise.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {makeContinuousRegion} from './p553-continuous-region.mjs';
import {nativeRegionMaterials} from './p565-native-materials.mjs';
import {installRegionCover} from './p565-region-cover.mjs';
import {isSeat,isMaritime} from './p566-interaction-policy.mjs';
import {steerBoat} from './p568-naval-policy.mjs';
import {resourceKind,makeResource} from './p568-resource-policy.mjs';
import {validResumePosition} from './p521-resume-position.mjs';
import {runtimeRegionVisuals} from './p536-native-editor-visuals.mjs';
import {REGION_THEMES,treeId,shrubId,guildLocation} from './p553-region-sampler.mjs';
import {sectorKey,sectorBounds,distanceToBounds,chooseArrival} from './p556-sector-policy.mjs';
import {CITY_BY_SEED} from './p564-city-identities.mjs';
import {mountRegionForest} from './p557-native-forest.mjs';
import {createLODCache,lodLevel,triangleCount} from './p558-model-lod.mjs';
import {installLivingWorld} from './p570-living-world.mjs';
const DIR=import.meta.env.BASE_URL+'highfly/regions/';
const get=async path=>{const r=await fetch(DIR+path);if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json()};
const inBounds=(p,x,z,pad=0)=>x>p.bounds.minX-pad&&x<p.bounds.maxX+pad&&z>p.bounds.minZ-pad&&z<p.bounds.maxZ+pad;
function clipMaterial(m,variable='vWorld'){
 const token='void main() {',other='void main(){',start=m.fragmentShader.includes(token)?token:other;if(!m.fragmentShader.includes(start)||!m.fragmentShader.includes('in vec3 '+variable+';'))throw Error('native shader clip unavailable');
 m.uniforms.uHFRegionClip={value:0};m.uniforms.uHFRegionBounds={value:new THREE.Vector4()};
 m.fragmentShader=m.fragmentShader.replace('in vec3 '+variable+';','uniform float uHFRegionClip; uniform vec4 uHFRegionBounds; in vec3 '+variable+';').replace(start,start+' if(uHFRegionClip>0.5 && '+variable+'.x>uHFRegionBounds.x && '+variable+'.x<uHFRegionBounds.y && '+variable+'.z>uHFRegionBounds.z && '+variable+'.z<uHFRegionBounds.w)discard;');m.needsUpdate=true;
 return p=>{m.uniforms.uHFRegionClip.value=p?1:0;if(p)m.uniforms.uHFRegionBounds.value.set(p.bounds.minX,p.bounds.maxX,p.bounds.minZ,p.bounds.maxZ)};
}
// Use actual deck/hull/platform geometry rather than an AABB spanning the mast.
function appendMaritimeTriangles(model,instance,dest){const v=new THREE.Vector3();model.traverse(m=>{if(!m.isMesh||m.isSkinnedMesh)return;const g=m.geometry,a=g?.attributes?.position,idx=g?.index;if(!a)return;const t=new THREE.Matrix4().multiplyMatrices(instance,m.matrixWorld),count=idx?idx.count:a.count;for(let i=0;i+2<count;i+=3)for(let j=0;j<3;j++){v.fromBufferAttribute(a,idx?idx.getX(i+j):i+j).applyMatrix4(t);dest.push(v.x,v.y,v.z)}})}
function findSeatSurface(model,box,id){const size=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3()),ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),hits=[];for(const ox of [0,-.18,.18,-.34,.34])for(const oz of [0,-.18,.18,-.34,.34]){const x=c.x+ox*size.x,z=c.z+oz*size.z;ray.set(new THREE.Vector3(x,box.max.y+.1,z),down);const hit=ray.intersectObject(model,true).find(h=>h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.65);if(!hit)continue;const f=(hit.point.y-box.min.y)/(size.y||1);if(id.endsWith('/bench')&&(f<.20||f>.82))continue;if(id.endsWith('/stool')&&f<.65)continue;hits.push({point:hit.point.clone(),score:Math.hypot(ox,oz)+(id.endsWith('/bench')?Math.abs(f-.43)*2:0)})}hits.sort((a,b)=>a.score-b.score);return hits[0]?.point??null}
export async function installP555Regions(game,{pipe,terrain,water,forest=globalThis.__forest}){
 const [index,placement,audit,overview]=await Promise.all([get('source-index.json'),get('placements.json'),get('asset-audit.json'),fetch(import.meta.env.BASE_URL+'highfly/native-overview.json').then(r=>r.json())]);
 if(index.regions.length!==8||placement.placements.length!==8||!audit.complete)throw Error('Incomplete original region data');
 const nativeHeight=terrain.heightAt.bind(terrain),nativeWaterLevel=game.world.waterLevel.bind(game.world);
 const nativeMaterials=nativeRegionMaterials(terrain,water),regionCover=installRegionCover(globalThis.__parts?.cover);const living=installLivingWorld(game,pipe);globalThis.__hfLivingWorld=living;
 const fusion=makeContinuousRegion(runtimeRegionVisuals(terrain),nativeHeight,overview,null,null,{nativeHeight,runtime:true,runtimeNativeForest:!!forest?.impMaterial,nativeMaterials});
 const clipTerrain=clipMaterial(terrain.material),clipNativeWater=clipMaterial(water.material);const waterRoot=new THREE.Group();waterRoot.name='P565 native regional water';pipe.sceneT.add(waterRoot);
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),ktx=new KTX2Loader().setTranscoderPath(import.meta.env.BASE_URL+'highfly/basis/').detectSupport(pipe.renderer);loader.setKTX2Loader(ktx);
 const assets=new Map(audit.assets.map(a=>[a.id,a])),models=new Map(),placements=new Map(placement.placements.map(p=>[p.seed,p]));
 // P561: reuse the original Strings of Light pylons, not urban teleport targets.
 const edgeDistance=(p,x,z)=>Math.hypot(Math.max(p.bounds.minX-x,0,x-p.bounds.maxX),Math.max(p.bounds.minZ-z,0,z-p.bounds.maxZ));
 const beacons=Object.values(game.strings?.nodes??{}).filter(n=>n.id!=='dawn');
 if(beacons.length!==8)throw Error('P561 expected eight native destination pylons');
 const beaconMap=new Map(placement.placements.map(p=>{const n=[...beacons].sort((a,b)=>edgeDistance(p,a.x,a.z)-edgeDistance(p,b.x,b.z)||Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(p.x-b.x,p.z-b.z))[0];return [p.seed,{id:n.id,x:n.x,z:n.z,edgeMetres:Math.round(edgeDistance(p,n.x,n.z)),centerMetres:Math.round(Math.hypot(p.x-n.x,p.z-n.z))}]}));
 const regionData=new Map();const fetchRegion=seed=>{if(!regionData.has(seed))regionData.set(seed,get('island-'+seed+'.json').catch(e=>{regionData.delete(seed);throw e}));return regionData.get(seed)};
 let destination=null,beaconArrival=null;
 const lodCache=await createLODCache();
 const load=id=>{if(!models.has(id)){const a=assets.get(id);if(!a)throw Error('Missing '+id);models.set(id,loader.loadAsync(DIR+a.path).then(x=>x.scene).catch(e=>{models.delete(id);throw e}))}return models.get(id)};
 let vessel=null;
 let active=null,busy=false,lastCheck=0,solids=[],lastSector=0;let loadMs=0,opaqueParts=null,collect=false;const drawStats=()=>({calls:0,triangles:0});
 const root=new THREE.Group();root.name='P555 streamed Guildhall region';pipe.scene.add(root);
 const renderer=pipe.renderer,originalRender=renderer.render;renderer.render=function(scene,camera){const opaque=scene===pipe.scene;if(opaque){opaqueParts={buildings:drawStats(),terrain:drawStats(),forest:drawStats()};collect=true}try{return originalRender.call(this,scene,camera)}finally{if(opaque){collect=false;globalThis.__hfP557Opaque={calls:this.info.render.calls,triangles:this.info.render.triangles,parts:opaqueParts}}}};
 function instrument(m,category){if(m.userData.hfInstrumented)return;m.userData.hfInstrumented=true;const old=m.onAfterRender;m.onAfterRender=function(r,sc,cam,geo,mat,group){old?.call(this,r,sc,cam,geo,mat,group);if(!collect)return;const stats=opaqueParts[category],count=group?.count??geo.index?.count??geo.attributes.position.count,n=this.isInstancedMesh?this.count:geo.isInstancedBufferGeometry?geo.instanceCount:1;stats.calls++;stats.triangles+=count/3*n}}
 forest?.group?.traverse(m=>{if(m.isMesh)instrument(m,'forest')});
 // Native Unsung uses custom lighting shaders; imported standard GLB materials need scene lights.
 const ambient=new THREE.AmbientLight(0xffffff,1.4),sun=new THREE.DirectionalLight(0xfff4d7,2);sun.position.set(30,70,40);pipe.scene.add(ambient,sun);ambient.updateMatrixWorld(true);sun.updateMatrixWorld(true);
 terrain.heightAt=(x,z)=>active&&inBounds(active.p,x,z)?active.integrated.gridHeight(x,z):nativeHeight(x,z);
 game.world.waterLevel=(x,z)=>{if(!active||!inBounds(active.p,x,z))return nativeWaterLevel(x,z);return active.integrated.gridWater(x,z)};
 function clear(){if(vessel?.pilot)return false;living.clear();clipNativeWater(null);if(vessel)removeVessel();game.world.highflyInteractables=(game.world.highflyInteractables??[]).filter(n=>!n.regionResource);active?.nativeForest?.dispose();regionCover?.clear();clipTerrain(null);waterRoot.traverse(o=>{if(o.userData.owned)o.geometry?.dispose()});waterRoot.clear();fusion.clear();for(const s of solids){const i=game.world.solids.indexOf(s);if(i>=0)game.world.solids.splice(i,1);s.bvh?.geometry?.dispose()}solids=[];root.traverse(o=>{if(o.userData.owned)o.geometry?.dispose();if(o.isInstancedMesh)o.dispose();if(o.userData.ownMaterial){o.material.map?.dispose();o.material.dispose()}});if(active)for(const g of active.sectors.values())if(!g.parent)g.traverse(o=>{if(o.isInstancedMesh)o.dispose()});root.clear();active=null}
 const css='background:#17142c;color:#eee3ff;border:1px solid #a48dc7;border-radius:8px;padding:7px;font:600 11px system-ui;';
 const toggle=document.createElement('button');toggle.textContent='🗺 Viaje · 5.7.3';toggle.style.cssText=css+'position:fixed;left:44%;top:5px;z-index:99980;';
 const panel=document.createElement('div');panel.style.cssText='display:none;position:fixed;left:50%;top:38px;transform:translateX(-50%);width:min(340px,85vw);z-index:99981;background:#151127ed;border:1px solid #b397dc;border-radius:12px;padding:10px;color:white;font:12px system-ui;max-height:70vh;overflow:auto;';
 const msg=document.createElement('div');msg.textContent='8 regiones asignadas · carga por proximidad';panel.append(msg);
 const buttons=[];function button(label,fn){const b=document.createElement('button');b.textContent=label;b.style.cssText=css+'margin:3px;';b.onclick=fn;panel.append(b);buttons.push(b);return b}
 toggle.onclick=()=>panel.style.display=panel.style.display==='none'?'block':'none';document.body.append(toggle,panel);
 const loading=document.createElement('div');loading.hidden=true;loading.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#130e24;color:#eed5a1;display:none;align-items:center;justify-content:center;flex-direction:column;font:600 15px system-ui';const loadingTitle=document.createElement('h2'),loadingText=document.createElement('p');loadingTitle.textContent='HIGHFLY · Preparando el mundo';loading.append(loadingTitle,loadingText);document.body.append(loading);const showLoading=v=>{loading.hidden=!v;loading.style.display=v?'flex':'none'};const say=t=>{msg.textContent=t;loadingText.textContent=t;console.info('[P555]',t)};
 function setBusy(v){busy=v;for(const b of buttons)b.disabled=v}
 function register(g){game.world.addGeometry(g);const s=game.world.solids.at(-1);solids.push(s);return s}
 function dropSolid(s){const i=game.world.solids.indexOf(s);if(i>=0)game.world.solids.splice(i,1);const k=solids.indexOf(s);if(k>=0)solids.splice(k,1);s.bvh?.geometry?.dispose()}
 // One rowboat per mounted region becomes a real movable actor. Other vessels
 // remain traversable static meshes. While driving, the avatar is attached to
 // the helm and the moving hull is checked against the actual water and ground.
 function removeVessel(){if(!vessel)return;if(vessel.solid)dropSolid(vessel.solid);vessel.label?.material?.map?.dispose();vessel.label?.material?.dispose();vessel.root.removeFromParent();vessel=null}
 function syncVessel(){if(!vessel)return;const b=vessel,delta=b.headingOffset;b.root.position.set(b.x,b.y,b.z);b.root.rotation.y=b.yaw+delta;b.root.updateMatrixWorld(true)}
 function deckPoint(b){return b.deck.clone().applyMatrix4(b.root.matrixWorld)}
 function dockVessel(){if(!vessel||vessel.solid)return;const b=vessel,positions=[];appendMaritimeTriangles(b.model,b.root.matrixWorld,positions);if(positions.length)b.solid=register(active?.geom?.(positions)??new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)))}
 function makeVessel(spec){if(!spec||vessel)return;const {model,transform,seed}=spec,root=new THREE.Group(),clone=model.clone(true),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();transform.decompose(pos,quat,scale);root.add(clone);root.scale.copy(scale);const e=new THREE.Euler().setFromQuaternion(quat,'YXZ'),box=new THREE.Box3().setFromObject(model),c=box.getCenter(new THREE.Vector3()),sz=box.getSize(new THREE.Vector3()),ray=new THREE.Raycaster(new THREE.Vector3(c.x,box.max.y+.1,c.z),new THREE.Vector3(0,-1,0));const hits=ray.intersectObject(model,true).filter(h=>h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.55);const deck=hits[0]?.point?.clone()??new THREE.Vector3(c.x,box.min.y+sz.y*.45,c.z);const alongX=sz.x>sz.z,axis=alongX?'x':'z',cross=alongX?'z':'x',half=sz[axis]*.5,ext=[[],[]],vert=new THREE.Vector3();model.traverse(o=>{if(!o.isMesh||!o.geometry?.attributes?.position)return;const ar=o.geometry.attributes.position;for(let i=0;i<ar.count;i++){vert.fromBufferAttribute(ar,i).applyMatrix4(o.matrixWorld);const v=vert[axis]-c[axis];if(Math.abs(v)>half*.7)ext[v>0?1:0].push(vert[cross])}});const width=a=>{let lo=Infinity,hi=-Infinity;for(const x of a){lo=Math.min(lo,x);hi=Math.max(hi,x)}return a.length?hi-lo:Infinity};const bowPositive=width(ext[1])<=width(ext[0]);const headingOffset=alongX?(bowPositive?-Math.PI/2:Math.PI/2):(bowPositive?0:Math.PI);
  vessel={seed,root,model,deck,headingOffset,x:pos.x,y:pos.y,z:pos.z,yaw:e.y-headingOffset,speed:0,waterOffset:pos.y-game.world.waterLevel(pos.x,pos.z),halfLength:Math.max(sz.x*scale.x,sz.z*scale.z)*.40,halfWidth:Math.min(sz.x*scale.x,sz.z*scale.z)*.35,solid:null,pilot:null};
  if(!Number.isFinite(vessel.waterOffset))vessel.waterOffset=.15;const c2=document.createElement('canvas');c2.width=384;c2.height=96;const ctx=c2.getContext('2d');ctx.fillStyle='#211440';ctx.fillRect(0,0,384,96);ctx.fillStyle='#fbe5a4';ctx.font='bold 35px sans-serif';ctx.textAlign='center';ctx.fillText('NAVEGAR',192,61);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c2),depthTest:true}));label.position.set(deck.x,box.max.y+1.5/scale.y,deck.z);label.scale.set(3.1/scale.x,.78/scale.y,1);root.add(label);vessel.label=label;pipe.scene.add(root);syncVessel();dockVessel();
 }
 function nearBoat(pos){if(!vessel||vessel.pilot||busy||!pos)return false;const d=deckPoint(vessel);return Math.hypot(d.x-pos.x,d.z-pos.z)<2.4&&Math.abs(d.y-pos.y)<1.5}
 function fishingWater(pl){if(!pl?.grounded||pl.state!=='move')return null;const pos=pl.pos;for(const d of [1.3,2.1,2.5])for(const a0 of [0,.7,-.7,1.5,-1.5,Math.PI]){const a=pl.yaw+a0,x=pos.x+Math.sin(a)*d,z=pos.z+Math.cos(a)*d,y=game.world.waterLevel(x,z),h=game.world.groundHeight(x,z);if(Number.isFinite(y)&&y-h>.65&&pos.y-y>=-.65&&pos.y-y<=3.4)return {x,y,z}}return null}
 function ensureFishing(pl){const at=fishingWater(pl);if(!at)return null;const nodes=game.world.highflyInteractables??(game.world.highflyInteractables=[]),seed=active?.p.seed??0,key='shore:'+Math.floor(at.x/4)+':'+Math.floor(at.z/4),id='p568:'+seed+':fishSpot:'+key;let n=nodes.find(n=>n.id===id);if(!n){n=makeResource(seed,'fishSpot',key,at.x,at.y,at.z);nodes.push(n)}if(active)n.product=active.p.seed===3||active.p.seed===6?'fish_coast':'fish_river';return n}
 function boatStep(pl,dt,input){if(!vessel||busy&&!vessel.pilot)return false;const b=vessel;if(b.pilot&&b.pilot!==pl)return false;
  if(!b.pilot){if(!input.pressed.has('boat_board')||pl.state!=='move'||!pl.grounded||!nearBoat(pl.pos))return false;b.pilot=pl;b.speed=0;if(b.solid){dropSolid(b.solid);b.solid=null}pl.setState('hf_boat');pl.vel.set(0,0,0);pl.emit('highflyBoatBoard');}
  if(pl.state!=='hf_boat'||pl.health<=0){b.pilot=null;b.speed=0;dockVessel();return false}
  if(input.pressed.has('boat_exit')||input.pressed.has('jump')){b.pilot=null;b.speed=0;dockVessel();const d=deckPoint(b);pl.pos.copy(d);pl.pos.y+=.12;pl.viewY=pl._viewY1=pl.pos.y;pl.vel.set(0,0,0);pl.setState('move');pl.grounded=false;pl.emit('highflyBoatExit');return true}
  const water=game.world.waterLevel(b.x,b.z);
  const canMove=(x,z,yaw)=>{const fx=Math.sin(yaw),fz=Math.cos(yaw),sx=Math.cos(yaw),sz=-Math.sin(yaw),depth=(x,z)=>game.world.waterLevel(x,z)-game.world.groundHeight(x,z);
   if(!Number.isFinite(water)||!active||active.p.seed!==b.seed||!inBounds(active.p,x,z)||edgeDistance(active.p,x,z)>0||Math.max(Math.abs(x),Math.abs(z))>7850)return false;
   for(const [a,c] of [[0,0],[b.halfLength,0],[-b.halfLength,0],[0,b.halfWidth],[0,-b.halfWidth]]){const xx=x+fx*a+sx*c,zz=z+fz*a+sz*c;if(!(depth(xx,zz)>.38)||Math.abs(game.world.waterLevel(xx,zz)-water)>1.1)return false}
   const dx=x-b.x,dz=z-b.z,len=Math.hypot(dx,dz);if(len>.01&&typeof game.world.raycast==='function'){const hit=game.world.raycast(new THREE.Vector3(b.x,b.y+.45,b.z),new THREE.Vector3(dx/len,0,dz/len),len+Math.max(.22,b.halfLength*.45));if(Number.isFinite(hit)&&hit>.015&&hit<len+Math.max(.22,b.halfLength*.45))return false}return true};
  if(!busy){const next=steerBoat(b,input.move,dt,canMove);Object.assign(b,next);const surface=game.world.waterLevel(b.x,b.z);if(Number.isFinite(surface)){b.y=surface+b.waterOffset;syncVessel()}}
  const d=deckPoint(b);pl.pos.copy(d);pl.pos.y+=.12;pl.viewY=pl._viewY1=pl.pos.y;pl.yaw=b.yaw;pl.vel.set(0,0,0);pl.speed=0;pl.grounded=true;pl.stateTime+=dt;return true
 }
 function syncSectors(x,z,force=false){
  if(!active)return;const n=performance.now();if(!force&&n-lastSector<180)return;lastSector=n;
  const lx=(x-active.p.x)/active.p.scale,lz=(z-active.p.z)/active.p.scale;
  let visible=0,levels=[0,0,0],materialized=0,queued=0;const begin=performance.now();
  const ordered=[...active.sectors].map(([key,g])=>({g,b:sectorBounds(key)})).map(o=>({...o,dist:distanceToBounds(lx,lz,o.b)*active.p.scale})).sort((a,b)=>a.dist-b.dist);
  for(const {g,b,dist} of ordered){const want=dist<=b.radius+(g.parent?12:0);if(want){const level=lodLevel(dist,b.kind,g.userData.level??0);if(!g.children.length){if(dist>36&&performance.now()-begin>7){queued++;continue}for(const row of g.userData.batches){const m=new THREE.InstancedMesh(row.geometries[level],row.material,row.matrices.length);row.matrices.forEach((mx,i)=>m.setMatrixAt(i,mx));m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();m.matrixAutoUpdate=false;m.userData.geometries=row.geometries;instrument(m,'buildings');g.add(m)}}else if(g.userData.level!==level){for(const m of g.children){m.geometry=m.userData.geometries[level]}}g.userData.level=level;if(!g.parent){active.tmp.add(g);g.updateMatrixWorld(true)}g.userData.lastUsed=n;visible++;levels[level]++}else{if(g.parent)g.removeFromParent();if(g.children.length&&n-(g.userData.lastUsed??0)>5000){for(const m of g.children)m.dispose();g.clear()}}if(g.children.length)materialized++}
  active.levels=levels;active.materialized=materialized;active.queued=queued;
  for(const m of active.integrated.group.children){if(!m.userData.regionVegetation)continue;const b=m.boundingSphere;const dist=Math.hypot(b.center.x-x,b.center.z-z)-b.radius;m.visible=dist<=m.userData.regionRadius;}
  // Only collision BVHs near the avatar. Register at most two new chunks per tick.
  const pending=[];for(const [key,v] of active.collisionChunks){const [i,j]=key.split(',').map(Number),cx=active.p.x+(i+.5)*60*active.p.scale,cz=active.p.z+(j+.5)*60*active.p.scale,d=Math.hypot(cx-x,cz-z);if(v.solid&&d>180){dropSolid(v.solid);v.solid=null}if(!v.solid&&d<135)pending.push({v,d})}
  pending.sort((a,b)=>a.d-b.d);for(const {v} of pending.slice(0,force?pending.length:2))v.solid=register(active.geom(v.pos));
  active.visible=visible;
 }
 function travel(x,z,y,yaw=game.player.yaw){const pl=game.player;syncSectors(x,z,true);pl.spawn(x,y+.12,z,yaw);pl.setState('move');game.rig.yaw=yaw;game.rig.snap(pl);if(game.input)game.input.enabled=true;pipe.taa.reset=true;root.updateMatrixWorld(true)}
 async function open(seed,warp=false){
  if(busy||game.state!=='playing'||vessel?.pilot)return;if(active?.p.seed===seed){if(warp)travel(active.spawn.x,active.spawn.z,active.spawn.y,active.spawn.yaw);return}
  setBusy(true);if(warp||resuming)showLoading(true);const started=performance.now();say('Cargando región '+seed+'…');try{
   const p=placements.get(seed),d=await fetchRegion(seed);if(!p)throw Error('No placement');
   const integrated=await fusion.buildAsync(d,p,assets,stage=>say('Región '+seed+' · '+stage)),tmp=new THREE.Group();integrated.group.traverse(m=>{if(m.isMesh)instrument(m,'terrain')});tmp.position.set(p.x,p.base,p.z);tmp.scale.setScalar(p.scale);
   const by=new Map();for(const q of d.pieces){if(treeId(q.piece)||shrubId(q.piece)||q.piece==='kenney-nature/ground-river-straight')continue;if(!by.has(q.piece))by.set(q.piece,[]);by.get(q.piece).push(q)}
   const ids=[...by.keys()];for(let i=0;i<ids.length;i+=8){await Promise.all(ids.slice(i,i+8).map(load));await new Promise(resolve=>setTimeout(resolve,0))}
   const dummy=new THREE.Object3D(),mat=new THREE.Matrix4(),boxes=[],chunk=new Map(),local=new THREE.Matrix4(),worldMatrix=new THREE.Matrix4().compose(tmp.position,tmp.quaternion,tmp.scale);
   const geom=(pos,col)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(col)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();return g};
   if(d.structures.position.length){const positions=d.structures.position,colors=d.structures.color,cells=new Map(),material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}),v=new THREE.Vector3();for(let i=0;i<positions.length;i+=9){const x=(positions[i]+positions[i+3]+positions[i+6])/3,z=(positions[i+2]+positions[i+5]+positions[i+8])/3,key=Math.floor(x/60)+','+Math.floor(z/60);let cell=cells.get(key);if(!cell){cell={pos:[],col:[]};cells.set(key,cell)}if(!chunk.has(key))chunk.set(key,[]);const dest=chunk.get(key);for(let j=0;j<9;j++)cell.pos.push(positions[i+j]);for(let j=0;j<9;j++)cell.col.push(colors[i+j]);for(let j=0;j<9;j+=3){v.set(positions[i+j],positions[i+j+1],positions[i+j+2]).applyMatrix4(worldMatrix);dest.push(v.x,v.y,v.z)}}let first=true;for(const cell of cells.values()){const m=new THREE.Mesh(geom(cell.pos,cell.col),material);m.userData.owned=true;m.userData.ownMaterial=first;first=false;instrument(m,'buildings');tmp.add(m)}}
   const sectors=new Map(),blockers=[],boxBuckets=new Map(),seats=[],resources=[];let boatSpec=null,groundedFurniture=0,steepFurniture=0;let batchClock=performance.now();
   for(const [id,items] of by){if(performance.now()-batchClock>12){await new Promise(resolve=>setTimeout(resolve,0));batchClock=performance.now()}const model=await load(id);model.updateMatrixWorld(true);const modelBox=new THREE.Box3().setFromObject(model),furniture=/bench|chair|stool|seat|barrel|crate|table/.test(id),seatKind=isSeat(id);const seatPoint=seatKind?findSeatSurface(model,modelBox,id):null;const arr=[];for(const q of items){const t=integrated.sampler.nearest(q.x,q.z).t,x=p.x+q.x*p.scale,z=p.z+q.z*p.scale,atY=integrated.gridHeight(x,z),shift=t&&t.ground!=='water'&&Math.abs(q.y-t.top)<1.8?Math.max(-1.2,Math.min(1.2,(atY-p.base)/p.scale-t.top)):0;dummy.position.set(q.x,q.y+shift,q.z);dummy.rotation.set(q.tilt?.[0]??0,q.rot??0,q.tilt?.[1]??0,'YXZ');const s=q.scale??1;dummy.scale.set(s*(q.stretch??1),s,s);dummy.updateMatrix();
     // Align small ground props by their actual model feet; leave elevated
     // docks, decks, buildings and suspended source furniture alone.
     if(furniture&&t&&t.ground!=='water'&&Math.abs(q.y-t.top)<.85){
      const wb=modelBox.clone().applyMatrix4(dummy.matrix).applyMatrix4(worldMatrix),ys=[integrated.gridHeight(x,z)];
      for(const xx of [wb.min.x,wb.max.x])for(const zz of [wb.min.z,wb.max.z])ys.push(integrated.gridHeight(xx,zz));
      const high=Math.max(...ys),low=Math.min(...ys);
      if(high-low<.5&&Number.isFinite(high)){dummy.position.y+=(high-wb.min.y+.012)/p.scale;dummy.updateMatrix();groundedFurniture++}else steepFurniture++;
     }
     if(seatPoint){const point=seatPoint.clone().applyMatrix4(dummy.matrix).applyMatrix4(worldMatrix),ground=integrated.gridHeight(point.x,point.z);
      if(point.y-ground>.14&&point.y-ground<1.3)seats.push({id:id+':'+seats.length,model:id,x:point.x,y:point.y,z:point.z,yaw:q.rot??0,ground});
     }
     const rk=resourceKind(id);if(rk&&resources.length<360&&Number.isFinite(atY)&&t?.ground!=='water')resources.push(makeResource(seed,rk,id+':'+q.x.toFixed(3)+':'+q.z.toFixed(3),x,atY,z));
     if(id==='kenney-pirate/structure-platform'&&resources.length<420){const wpos=new THREE.Vector3(q.x,q.y+shift,q.z).applyMatrix4(worldMatrix);for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const xx=wpos.x+Math.sin(angle)*1.45,zz=wpos.z+Math.cos(angle)*1.45,waterY=integrated.gridWater(xx,zz),floor=integrated.gridHeight(xx,zz);if(Number.isFinite(waterY)&&waterY-floor>1.15){resources.push({...makeResource(seed,'fishSpot',q.x.toFixed(3)+':'+q.z.toFixed(3)+':'+angle.toFixed(2),xx,waterY,zz),product:seed===3||seed===6?'fish_coast':'fish_river'});break}}}
     if(!boatSpec&&(!vessel||!vessel.pilot)&&/^kenney-pirate\/boat-row-/.test(id)){const transform=new THREE.Matrix4().multiplyMatrices(worldMatrix,dummy.matrix),origin=new THREE.Vector3().setFromMatrixPosition(transform),waterY=integrated.gridWater(origin.x,origin.z);if(Number.isFinite(waterY)&&waterY-integrated.gridHeight(origin.x,origin.z)>.5){boatSpec={model,transform,seed};continue}}
     arr.push({q,m:dummy.matrix.clone()});}
    // Geographic instance batches: never one huge non-culled region batch.
    const batches=new Map();for(const o of arr){const key=sectorKey(id,o.q.x,o.q.z);if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o)}
    for(const [key,list] of batches){let group=sectors.get(key);if(!group){group=new THREE.Group();group.name=key;group.userData.batches=[];sectors.set(key,group)}model.traverse(m=>{if(!m.isMesh||m.isSkinnedMesh)return;const geometries=lodCache.levels(m.geometry),matrices=list.map(o=>new THREE.Matrix4().multiplyMatrices(o.m,m.matrixWorld));group.userData.batches.push({geometries,material:m.material,matrices})})}
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),ctr=box.getCenter(new THREE.Vector3());
    if(size.x>.1&&size.z>.1&&(size.y>.25||isMaritime(id))){for(const o of arr){
     const wb=box.clone().applyMatrix4(o.m).applyMatrix4(worldMatrix);if(wb.max.y-wb.min.y>.45){const kx=Math.floor((wb.min.x+wb.max.x)/2/8),kz=Math.floor((wb.min.z+wb.max.z)/2/8);for(let ix=Math.floor(wb.min.x/8);ix<=Math.floor(wb.max.x/8);ix++)for(let iz=Math.floor(wb.min.z/8);iz<=Math.floor(wb.max.z/8);iz++){const key=ix+','+iz;if(!boxBuckets.has(key))boxBuckets.set(key,[]);boxBuckets.get(key).push(wb)}}
     if(isMaritime(id)){const key=Math.floor(o.q.x/60)+','+Math.floor(o.q.z/60);if(!chunk.has(key))chunk.set(key,[]);appendMaritimeTriangles(model,new THREE.Matrix4().multiplyMatrices(worldMatrix,o.m),chunk.get(key));continue;}
     if(!/building-|castle|wall-|fence-|rock-|tower|barracks|lumbermill|windmill|watermill|bench|chair|stool|seat|barrel|crate|table|boulder|well/.test(id)||/fence-gate|doorway|open-gate/.test(id))continue;
     const key=Math.floor(o.q.x/60)+','+Math.floor(o.q.z/60);if(!chunk.has(key))chunk.set(key,[]);const dest=chunk.get(key),transform=new THREE.Matrix4().multiplyMatrices(worldMatrix,o.m),corners=[];for(let v=0;v<8;v++)corners.push(new THREE.Vector3(ctr.x+(v&1?1:-1)*size.x*.45,ctr.y+(v&2?1:-1)*size.y*.47,ctr.z+(v&4?1:-1)*size.z*.45).applyMatrix4(transform));for(const v of [0,2,1,1,2,3,4,5,6,5,7,6,0,1,4,1,5,4,2,6,3,3,6,7,0,4,2,2,4,6,1,3,5,3,7,5]){const q=corners[v];dest.push(q.x,q.y,q.z)}
    }}
   }

   // P564: trunks only; foliage and shrubs stay traversable. Reuse streamed BVH cells.
   let trunkCount=0;
   for(const t of integrated.plants){if(t.name==='shrub'||!Number.isFinite(t.h)||t.h<1.8)continue;
    const lx=(t.x-p.x)/p.scale,lz=(t.z-p.z)/p.scale,key=Math.floor(lx/60)+','+Math.floor(lz/60);
    if(!chunk.has(key))chunk.set(key,[]);const dest=chunk.get(key),rad=Math.max(.16,Math.min(.62,t.h*.035)),y=t.y-.10,top=t.y+Math.min(2.8,t.h*.42);
    for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4,x0=t.x+Math.cos(a)*rad,z0=t.z+Math.sin(a)*rad,x1=t.x+Math.cos(b)*rad,z1=t.z+Math.sin(b)*rad;
     dest.push(x0,y,z0,x0,top,z0,x1,y,z1,x1,y,z1,x0,top,z0,x1,top,z1,t.x,top,t.z,x1,top,z1,x0,top,z0)}
    trunkCount++;
   }
   const guild=guildLocation(d),board=guild?.board,origin={x:p.x+(board?.[0]??0)*p.scale,z:p.z+(board?.[2]??0)*p.scale};
   const entryAngle=Math.atan2(-519-p.x,-70-p.z),target={x:p.x+Math.sin(entryAngle)*(p.bounds.maxX-p.bounds.minX)*.31,z:p.z+Math.cos(entryAngle)*(p.bounds.maxZ-p.bounds.minZ)*.31};
   const candidates=[];for(let i=0;i<d.paths.length;i+=9){const x=p.x+(d.paths[i]+d.paths[i+3]+d.paths[i+6])/3*p.scale,z=p.z+(d.paths[i+2]+d.paths[i+5]+d.paths[i+8])/3*p.scale;if(Math.hypot(x-origin.x,z-origin.z)>75)candidates.push({x,z,road:true})}
   for(const t of d.tiles){if(t.ground==='water')continue;const x=p.x+t.x*p.scale,z=p.z+t.z*p.scale;if(Math.hypot(x-origin.x,z-origin.z)>75)candidates.push({x,z,road:false})}
   const blocked=(x,z,y,r)=>{for(let i=Math.floor((x-r)/8);i<=Math.floor((x+r)/8);i++)for(let j=Math.floor((z-r)/8);j<=Math.floor((z+r)/8);j++)for(const b of boxBuckets.get(i+','+j)??[]){if(b.max.y>y+.22&&b.min.y<y+1.82&&x+r>b.min.x&&x-r<b.max.x&&z+r>b.min.z&&z-r<b.max.z)return true}return false};
   const waterAt=integrated.gridWater;
   const spawn=chooseArrival({origin:target,candidates:candidates.filter(c=>c.road),height:integrated.gridHeight,water:waterAt,blocked})??chooseArrival({origin:target,candidates,height:integrated.gridHeight,water:waterAt,blocked});
   let qaCenter=null;if(new URLSearchParams(location.search).get('hfqa')==='1'){const inner=[];for(let i=0;i<d.paths.length;i+=9){const x=p.x+(d.paths[i]+d.paths[i+3]+d.paths[i+6])/3*p.scale,z=p.z+(d.paths[i+2]+d.paths[i+5]+d.paths[i+8])/3*p.scale;if(Math.hypot(x-origin.x,z-origin.z)<90)inner.push({x,z})}qaCenter=chooseArrival({origin,candidates:inner,height:integrated.gridHeight,water:waterAt,blocked});}
   if(!spawn)throw Error('No se encontró llegada segura cerca del gremio');
   clear();game.world.highflyInteractables=[...(game.world.highflyInteractables??[]),...resources];for(const m of [...integrated.group.children])if(m.userData.regionWater)waterRoot.add(m);root.add(integrated.group,tmp);if(guild){const c=document.createElement('canvas');c.width=768;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#221b35';ctx.fillRect(0,0,768,160);ctx.fillStyle='#ffe4a1';ctx.font='bold 50px sans-serif';ctx.textAlign='center';ctx.fillText('GREMIO DE AVENTUREROS',384,100);const tex=new THREE.CanvasTexture(c),label=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false}));const x=p.x+(board?.[0]??guild.x)*p.scale,z=p.z+(board?.[2]??guild.z)*p.scale;label.position.set(x,integrated.gridHeight(x,z)+3.2,z);label.scale.set(7,1.46,1);label.userData.ownMaterial=true;root.add(label)}active={p,d,integrated,spawn,qaCenter,tmp,sectors,trunkCount,seats,resources,groundedFurniture,steepFurniture,nativePreexisting:forest?.trees?.filter(t=>inBounds(p,t.x,t.z)).length??null,nativeForest:forest?.impMaterial?mountRegionForest(forest,integrated.plants):null,collisionChunks:new Map([...chunk].map(([key,pos])=>[key,{pos,solid:null}])),geom,visible:0};fusion.activate(p);clipTerrain(p);clipNativeWater(p);regionCover?.mount(integrated.grid,blocked,d.paths,p);waterRoot.updateMatrixWorld(true);
   syncSectors(warp?spawn.x:game.player.pos.x,warp?spawn.z:game.player.pos.z,true);makeVessel(boatSpec);living.mount(active,origin,blocked);
   if(active.nativeForest)forest.group.traverse(m=>{if(m.isMesh)instrument(m,'forest')});root.updateMatrixWorld(true);if(warp)travel(spawn.x,spawn.z,spawn.y,spawn.yaw);loadMs=performance.now()-started;
   say('Región '+seed+' · llegada exterior · '+d.pieces.length+' piezas fuente · colisión experimental');panel.style.display='none';
  }catch(e){say('Error: '+e.message);console.error(e)}finally{setBusy(false);if(!resuming)showLoading(false)}
 }
 // Diagnostic shortcut: land on the existing pylon, no city geometry mounted by the warp.
 function travelToBeacon(seed){
  if(busy||game.state!=='playing'||game.strings?.ride||vessel?.pilot)return false;
  const b=beaconMap.get(seed),p=placements.get(seed),node=b&&game.strings.nodes[b.id];if(!node||!p)return false;
  const yaw=Math.atan2(p.x-node.x,p.z-node.z);
  // Native Strings landing method: stream nearby collision, sample floor and reject large height differences.
  const tries=[[node.x+Math.sin(yaw)*2.6,node.z+Math.cos(yaw)*2.6],[node.x-Math.sin(yaw)*2.6,node.z-Math.cos(yaw)*2.6],[node.x,node.z]];
  let land=null;
  for(const [x,z] of tries){game.world.stream(x,z,6);const y=game.world.floorBelow(x,node.y+2.5,z,8);if(Number.isFinite(y)&&Math.abs(y-node.y)<=3){land={x,z,y};break}}
  if(!land){say('No se encontró suelo seguro en '+node.id);return false}
  clear();destination=seed;beaconArrival={seed,id:node.id,...land,edgeMetres:b.edgeMetres,centerMetres:b.centerMetres};
  travel(land.x,land.z,land.y,yaw);
  game.checkpoint={x:land.x,y:land.y+.12,z:land.z,yaw};
  // Prefetch only destination JSON here; full region preparation is triggered by proximity.
  fetchRegion(seed).catch(e=>console.warn('P561 prefetch',e.message));
  say('Faro '+node.id+' · destino isla '+seed+' · '+b.edgeMetres+' m al límite');panel.style.display='none';
  return true;
 }
 const boatHint=document.createElement('div');boatHint.style.cssText='position:fixed;top:43px;left:50%;transform:translateX(-50%);z-index:99970;color:#f9d795;background:#18142baa;padding:3px 7px;border-radius:5px;pointer-events:none;font:10px system-ui;display:none';document.body.append(boatHint);
 const nav=document.createElement('div');nav.id='hf-p561-destination';nav.style.cssText='display:none;position:fixed;top:25px;left:44%;max-width:30vw;z-index:99970;pointer-events:none;color:#eee3ff;background:#161327b8;border-radius:5px;padding:3px 5px;font:10px system-ui';document.body.append(nav);
 for(const p of placement.placements.sort((a,b)=>a.seed-b.seed)){const b=beaconMap.get(p.seed);button((CITY_BY_SEED[p.seed]?.name??'Isla '+p.seed)+' · Faro '+b.id+' ('+b.edgeMetres+' m)',()=>travelToBeacon(p.seed))}

 button('Inicio original',()=>{if(busy||game.state!=='playing'||vessel?.pilot)return;clear();destination=null;beaconArrival=null;nav.style.display='none';const h=game.sites?.spawn??{x:-519,z:-70,y:game.world.floorBelow(-519,nativeHeight(-519,-70)+25,-70,35)};travel(h.x,h.z,h.y);panel.style.display='none'});
 button('FPS completo',()=>{globalThis.__hfP508Clock?.setDiagnostics('full');panel.style.display='none'});button('FPS mini',()=>{globalThis.__hfP508Clock?.setDiagnostics('mini');panel.style.display='none'});button('Ocultar FPS',()=>{globalThis.__hfP508Clock?.setDiagnostics('hidden');panel.style.display='none'});
 // Save a safe regional position and mount the saved region before restoring.
 const resumeKey='highfly-unsung-regional-resume-v2',qa=new URLSearchParams(location.search).get('hfqa')==='1';
 let resumeT=0,resumeAttempted=false,resuming=false;
 const readResume=()=>{try{const d=JSON.parse(localStorage.getItem(resumeKey)||'null');return d?.v===2&&d.pos&&[d.pos.x,d.pos.y,d.pos.z,d.pos.yaw].every(Number.isFinite)?d:null}catch{return null}};
 function saveResume(){if(qa||!resumeAttempted||resuming||busy||game.cine||!['playing','paused','menu'].includes(game.state))return false;const pl=game.player;if(!pl?.grounded||pl.health<=0||pl.state!=='move')return false;const pos={x:pl.pos.x,y:pl.pos.y,z:pl.pos.z,yaw:pl.yaw};if(!validResumePosition(pos,game.world))return false;const region=active&&inBounds(active.p,pos.x,pos.z)?active.p.seed:null;if(!region&&[...placements.values()].some(p=>inBounds(p,pos.x,pos.z)))return false;try{localStorage.setItem(resumeKey,JSON.stringify({v:2,region,pos,at:Date.now()}));return true}catch{return false}}
 async function restoreResume(){if(qa||resumeAttempted||game.state!=='playing'||game.cine||!game.introSeen)return;resumeAttempted=true;const saved=readResume();if(!saved)return;const p=saved.pos;resuming=true;showLoading(true);const enabled=game.input?.enabled;if(game.input)game.input.enabled=false;try{if(saved.region!=null){const placement=placements.get(saved.region);if(!placement||!inBounds(placement,p.x,p.z))return;await open(saved.region,false);if(active?.p.seed!==saved.region)return;syncSectors(p.x,p.z,true)}game.world.stream?.(p.x,p.z,6);if(validResumePosition(p,game.world))travel(p.x,p.z,p.y-.12,p.yaw)}finally{resuming=false;showLoading(false);if(game.input)game.input.enabled=enabled??true}}
 if(!qa){document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveResume()});window.addEventListener('pagehide',saveResume);for(const key of ['pause','toHome']){const old=game[key];if(typeof old==='function')game[key]=function(...args){saveResume();return old.apply(this,args)}}}
 pipe.onBeforeScene.push(()=>{
  if(!qa&&!resumeAttempted)restoreResume().catch(e=>console.warn('P566 resume',e));if(resuming)return;
  if(!qa&&performance.now()-resumeT>8000){resumeT=performance.now();saveResume()}
  if(active&&!busy)syncSectors(game.player.pos.x,game.player.pos.z);living.update(.016);if(vessel?.label)vessel.label.visible=!vessel.pilot&&Math.hypot(vessel.x-game.player.pos.x,vessel.z-game.player.pos.z)<4;
  const now=performance.now();if(now-lastCheck<900||game.state!=='playing')return;lastCheck=now;
  const {x,z}=game.player.pos;boatHint.style.display='none';
  if(destination){const p=placements.get(destination),d=edgeDistance(p,x,z),angle=Math.atan2(p.x-x,p.z-z),relative=(angle-game.rig.yaw+Math.PI*3)%(Math.PI*2)-Math.PI;const arrow=Math.abs(relative)<Math.PI/4?'↑':Math.abs(relative)>Math.PI*.75?'↓':relative>0?'→':'←';nav.style.display=d>0?'block':'none';nav.textContent=arrow+' '+(CITY_BY_SEED[destination]?.name??'Isla '+destination)+' · '+Math.round(d)+' m'+(busy?' · preparando':'');}
  if(busy||vessel?.pilot)return;
  // Begin ahead of the region, retain the current region while crossing it.
  if(active&&edgeDistance(active.p,x,z)<100)return;
  const nearby=[...placements.values()].map(p=>({p,d:edgeDistance(p,x,z)})).filter(o=>o.d<=600).sort((a,b)=>a.d-b.d);
  const best=nearby[0]?.p;
  if(best&&active?.p.seed!==best.seed){open(best.seed,false);return}
  if(active&&edgeDistance(active.p,x,z)>850)clear();
 });
 function nearSeat(pos,yaw){if(!active||busy||!pos)return null;let best=null,dist=1.12;for(const s of active.seats){const dx=s.x-pos.x,dz=s.z-pos.z,d=Math.hypot(dx,dz);if(d<dist&&Math.abs(s.ground-pos.y)<.55&&(d<.25||!Number.isFinite(yaw)||dx*Math.sin(yaw)+dz*Math.cos(yaw)>d*.20)){best=s;dist=d}}return best}
 game.world.hfRegionWalkway=(point)=>{if(!active||!point||!inBounds(active.p,point.x,point.z))return null;const p=active.p,q=active.integrated.sampler.walkwayAt((point.x-p.x)/p.scale,(point.z-p.z)/p.scale);if(!q)return null;const y=p.base+q.y*p.scale;return Math.abs(point.y-y)<1.05?{y,kind:q.w.kind}:null};
 function qaIntegrity(){if(new URLSearchParams(location.search).get('hfqa')!=='1'||!active)return null;const g=active.integrated.grid,{nx,nz,pos,b}=g;let wet=0,dry=0,mismatch=0;const samples=[];for(let j=1;j<nz;j+=Math.max(1,Math.floor(nz/24)))for(let i=1;i<nx;i+=Math.max(1,Math.floor(nx/24))){const k=j*(nx+1)+i,x=pos[k*3],z=pos[k*3+2],h=active.integrated.gridHeight(x,z),w=active.integrated.gridWater(x,z),actual=game.world.waterLevel(x,z);if(Number.isFinite(w)){wet++;if(samples.length<6)samples.push({x,z,h,w})}else dry++;if(w!==actual||!Number.isFinite(h)||Number.isFinite(w)&&w<h)mismatch++}
 const seat=active.seats.find(q=>Math.abs(q.y-q.ground)<1.3);const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),origin=new THREE.Vector3(),surface=active.integrated.group.children.filter(m=>m.material===nativeMaterials.ground),waterMeshes=waterRoot.children;let checkedDry=0,wetOnDry=0,missingTerrain=0;for(const t of active.d.tiles){if(t.ground==='water'||checkedDry>=48)continue;const x=active.p.x+t.x*active.p.scale,z=active.p.z+t.z*active.p.scale,h=active.integrated.gridHeight(x,z);if(!Number.isFinite(h)||Number.isFinite(active.integrated.gridWater(x,z)))continue;origin.set(x,h+100,z);ray.set(origin,down);const groundHit=ray.intersectObjects(surface,false)[0],wetHit=ray.intersectObjects(waterMeshes,false)[0];checkedDry++;if(!groundHit||Math.abs(groundHit.point.y-h)>.08)missingTerrain++;if(wetHit&&wetHit.point.y>h+.02)wetOnDry++}return {checkedDry,wetOnDry,missingTerrain,globalWaterClipped:water.material.uniforms.uHFRegionClip.value===1,seed:active.p.seed,wet,dry,mismatch,samples,seat:seat??null,stairs:(active.d.stairs??[]).length,nativeCover:!!regionCover,materials:[...new Set(active.integrated.group.children.map(o=>o.material?.name).filter(Boolean))],waterMeshes:waterRoot.children.length,groundedFurniture:active.groundedFurniture,steepFurniture:active.steepFurniture,seatCount:active.seats.length,waterUsesNative:waterRoot.children.every(m=>m.material===nativeMaterials.water)&&nativeMaterials.water.vertexShader===water.material.vertexShader&&water.material.uniforms.uHFRegionClip.value===1}}
 return {open,clear,travelToBeacon,nearSeat,nearBoat,boatStep,fishingWater,ensureFishing,qaBoat:()=>{if(!qa||!vessel)return null;const d=deckPoint(vessel);return {x:d.x,y:d.y,z:d.z,yaw:vessel.yaw,solid:!!vessel.solid,pilot:!!vessel.pilot,boatX:vessel.x,boatZ:vessel.z,region:active?.p.seed}},qaIntegrity,beacons:Object.fromEntries(beaconMap),get beaconArrival(){return beaconArrival},qaJumpCenter:()=>{if(new URLSearchParams(location.search).get('hfqa')!=='1'||!active?.qaCenter||busy)return false;const t=active.qaCenter;travel(t.x,t.z,t.y,t.yaw);return true},metrics:()=>({destination,beaconArrival,city:CITY_BY_SEED[active?.p.seed]??null,trunkColliders:active?.trunkCount??0,seatCount:active?.seats.length??0,resourceCount:active?.resources.length??0,groundedFurniture:active?.groundedFurniture??0,steepFurniture:active?.steepFurniture??0,nativeCover:!!regionCover,nativeWaterMeshes:waterRoot.children.length,seed:active?.p.seed??null,visible:active?.visible??0,total:active?.sectors.size??0,solids:solids.length,busy,loadMs,lod:lodCache.metrics(),levels:active?.levels??[],materialized:active?.materialized??0,queued:active?.queued??0,vegetationDensity:active?.integrated.stats.density??null,nativeTreesInsideBeforeMount:active?.nativePreexisting??null,forest:active?.nativeForest?{trees:active.nativeForest.trees,shrubs:active.nativeForest.shrubs,impostorBlocks:active.nativeForest.impostorBlocks}:null,spawn:active?.spawn??null,opaque:globalThis.__hfP557Opaque??null}),get active(){return active?.p.seed??null},get busy(){return busy},regions:placement.placements.map(p=>({...p,city:CITY_BY_SEED[p.seed]}))};
}
