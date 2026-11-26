/* P555 playable streaming proof of concept. Keeps eight original world placements;
 * at most one high-detail region active. Original game, player and camera retained.
 * Building collisions approximate solid exteriors; no interiors or path/navmesh promise.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {makeContinuousRegion} from './p553-continuous-region.mjs';
import {runtimeRegionVisuals} from './p536-native-editor-visuals.mjs';
import {REGION_THEMES,treeId,shrubId,guildLocation} from './p553-region-sampler.mjs';
const DIR=import.meta.env.BASE_URL+'highfly/regions/';
const get=async path=>{const r=await fetch(DIR+path);if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json()};
const inBounds=(p,x,z,pad=0)=>x>p.bounds.minX-pad&&x<p.bounds.maxX+pad&&z>p.bounds.minZ-pad&&z<p.bounds.maxZ+pad;
function clipMaterial(m,variable='vWorld'){
 const token='void main() {',other='void main(){',start=m.fragmentShader.includes(token)?token:other;if(!m.fragmentShader.includes(start)||!m.fragmentShader.includes('in vec3 '+variable+';'))throw Error('native shader clip unavailable');
 m.uniforms.uHFRegionClip={value:0};m.uniforms.uHFRegionBounds={value:new THREE.Vector4()};
 m.fragmentShader=m.fragmentShader.replace('in vec3 '+variable+';','uniform float uHFRegionClip; uniform vec4 uHFRegionBounds; in vec3 '+variable+';').replace(start,start+' if(uHFRegionClip>0.5 && '+variable+'.x>uHFRegionBounds.x && '+variable+'.x<uHFRegionBounds.y && '+variable+'.z>uHFRegionBounds.z && '+variable+'.z<uHFRegionBounds.w)discard;');m.needsUpdate=true;
 return p=>{m.uniforms.uHFRegionClip.value=p?1:0;if(p)m.uniforms.uHFRegionBounds.value.set(p.bounds.minX,p.bounds.maxX,p.bounds.minZ,p.bounds.maxZ)};
}
export async function installP555Regions(game,{pipe,terrain,water}){
 const [index,placement,audit,overview]=await Promise.all([get('source-index.json'),get('placements.json'),get('asset-audit.json'),fetch(import.meta.env.BASE_URL+'highfly/native-overview.json').then(r=>r.json())]);
 if(index.regions.length!==8||placement.placements.length!==8||!audit.complete)throw Error('Incomplete original region data');
 const nativeHeight=terrain.heightAt.bind(terrain),nativeWaterLevel=game.world.waterLevel.bind(game.world);
 const fusion=makeContinuousRegion(runtimeRegionVisuals(terrain),nativeHeight,overview,null,null,{nativeHeight});
 const clipTerrain=clipMaterial(terrain.material),clipWater=clipMaterial(water.material);
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),ktx=new KTX2Loader().setTranscoderPath(import.meta.env.BASE_URL+'highfly/basis/').detectSupport(pipe.renderer);loader.setKTX2Loader(ktx);
 const assets=new Map(audit.assets.map(a=>[a.id,a])),models=new Map(),placements=new Map(placement.placements.map(p=>[p.seed,p]));
 const load=id=>{if(!models.has(id)){const a=assets.get(id);if(!a)throw Error('Missing '+id);models.set(id,loader.loadAsync(DIR+a.path).then(x=>x.scene).catch(e=>{models.delete(id);throw e}))}return models.get(id)};
 let active=null,busy=false,auto=true,lastCheck=0,solids=[];
 const root=new THREE.Group();root.name='P555 streamed Guildhall region';pipe.scene.add(root);
 // Native Unsung uses custom lighting shaders; imported standard GLB materials need scene lights.
 const ambient=new THREE.AmbientLight(0xffffff,1.4),sun=new THREE.DirectionalLight(0xfff4d7,2);sun.position.set(30,70,40);pipe.scene.add(ambient,sun);ambient.updateMatrixWorld(true);sun.updateMatrixWorld(true);
 terrain.heightAt=(x,z)=>active&&inBounds(active.p,x,z)?active.integrated.gridHeight(x,z):nativeHeight(x,z);
 game.world.waterLevel=(x,z)=>{if(!active||!inBounds(active.p,x,z))return nativeWaterLevel(x,z);const t=active.integrated.sampler.sample(x,z),h=active.integrated.gridHeight(x,z),level=t.water>.30?Math.max(-.07,t.level):-.07;return h<level-.025?level:-Infinity};
 function clear(){clipTerrain(null);clipWater(null);fusion.clear();for(const s of solids){const i=game.world.solids.indexOf(s);if(i>=0)game.world.solids.splice(i,1);s.bvh?.geometry?.dispose()}solids=[];root.traverse(o=>{if(o.userData.owned)o.geometry?.dispose();if(o.isInstancedMesh)o.dispose();if(o.userData.ownMaterial){o.material.map?.dispose();o.material.dispose()}});root.clear();active=null}
 const css='background:#17142c;color:#eee3ff;border:1px solid #a48dc7;border-radius:8px;padding:7px;font:600 11px system-ui;';
 const toggle=document.createElement('button');toggle.textContent='🗺 Viaje';toggle.style.cssText=css+'position:fixed;left:44%;top:5px;z-index:99980;';
 const panel=document.createElement('div');panel.style.cssText='display:none;position:fixed;left:50%;top:38px;transform:translateX(-50%);width:min(340px,85vw);z-index:99981;background:#151127ed;border:1px solid #b397dc;border-radius:12px;padding:10px;color:white;font:12px system-ui;max-height:70vh;overflow:auto;';
 const msg=document.createElement('div');msg.textContent='8 regiones asignadas · carga por proximidad';panel.append(msg);
 const buttons=[];function button(label,fn){const b=document.createElement('button');b.textContent=label;b.style.cssText=css+'margin:3px;';b.onclick=fn;panel.append(b);buttons.push(b);return b}
 toggle.onclick=()=>panel.style.display=panel.style.display==='none'?'block':'none';document.body.append(toggle,panel);
 const say=t=>{msg.textContent=t;console.info('[P555]',t)};
 function setBusy(v){busy=v;for(const b of buttons)b.disabled=v}
 function register(g){game.world.addGeometry(g);solids.push(game.world.solids.at(-1))}
 function travel(x,z,y){const pl=game.player;pl.spawn(x,y+.12,z,pl.yaw);game.rig.snap(pl);pipe.taa.reset=true;root.updateMatrixWorld(true)}
 async function open(seed,warp=false){
  if(busy||game.state!=='playing')return;if(active?.p.seed===seed){if(warp)travel(active.spawn.x,active.spawn.z,active.spawn.y);return}
  setBusy(true);say('Cargando región '+seed+'…');try{
   const p=placements.get(seed),d=await get('island-'+seed+'.json');if(!p)throw Error('No placement');
   const integrated=fusion.build(d,p,assets),tmp=new THREE.Group();tmp.position.set(p.x,p.base,p.z);tmp.scale.setScalar(p.scale);
   const by=new Map();for(const q of d.pieces){if(treeId(q.piece)||shrubId(q.piece)||q.piece==='kenney-nature/ground-river-straight')continue;if(!by.has(q.piece))by.set(q.piece,[]);by.get(q.piece).push(q)}
   const ids=[...by.keys()];for(let i=0;i<ids.length;i+=8){await Promise.all(ids.slice(i,i+8).map(load));await new Promise(requestAnimationFrame)}
   const dummy=new THREE.Object3D(),mat=new THREE.Matrix4(),boxes=[],chunk=new Map(),local=new THREE.Matrix4(),worldMatrix=new THREE.Matrix4().compose(tmp.position,tmp.quaternion,tmp.scale);
   const geom=(pos,col)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(col)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();return g};
   let structure=null;if(d.structures.position.length){const g=geom(d.structures.position,d.structures.color),m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));m.userData.owned=true;m.userData.ownMaterial=true;tmp.add(m);structure=g.clone().applyMatrix4(worldMatrix)}
   const transforms=new Map();
   for(const [id,items] of by){const model=await load(id);model.updateMatrixWorld(true);const arr=[];for(const q of items){const t=integrated.sampler.nearest(q.x,q.z).t,x=p.x+q.x*p.scale,z=p.z+q.z*p.scale,at=integrated.sampler.sample(x,z),shift=t&&t.ground!=='water'&&Math.abs(q.y-t.top)<1.8?Math.max(-1.2,Math.min(1.2,(at.y-p.base)/p.scale-t.top)):0;dummy.position.set(q.x,q.y+shift,q.z);dummy.rotation.set(q.tilt?.[0]??0,q.rot??0,q.tilt?.[1]??0,'YXZ');const s=q.scale??1;dummy.scale.set(s*(q.stretch??1),s,s);dummy.updateMatrix();arr.push({q,m:dummy.matrix.clone()});}
    // Geographic instance batches: never one huge non-culled region batch.
    const sectors=new Map();for(const o of arr){const k=Math.floor(o.q.x/60)+','+Math.floor(o.q.z/60);if(!sectors.has(k))sectors.set(k,[]);sectors.get(k).push(o)}
    for(const list of sectors.values())model.traverse(m=>{if(!m.isMesh||m.isSkinnedMesh)return;const inst=new THREE.InstancedMesh(m.geometry,m.material,list.length);list.forEach((o,i)=>{mat.multiplyMatrices(o.m,m.matrixWorld);inst.setMatrixAt(i,mat)});inst.instanceMatrix.needsUpdate=true;inst.computeBoundingSphere();tmp.add(inst)});
    // Approximate solid exterior volumes only; no fake walkable interiors.
    if(/building-|castle|wall-|fence-|rock-|tower|barracks|lumbermill|windmill|watermill/.test(id)){const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),ctr=box.getCenter(new THREE.Vector3());if(size.x>.1&&size.y>.25&&size.z>.1){for(const o of arr){const g=new THREE.BoxGeometry(size.x*.90,size.y*.94,size.z*.90).translate(ctr.x,ctr.y,ctr.z).applyMatrix4(o.m).applyMatrix4(worldMatrix).toNonIndexed();const pos=g.getAttribute('position').array,key=Math.floor(o.q.x/60)+','+Math.floor(o.q.z/60);if(!chunk.has(key))chunk.set(key,[]);chunk.get(key).push(...pos);g.dispose()}}}
   }
   const guild=guildLocation(d),board=guild?.board;let spawn=null;
   if(board){const facing=d.board?.facing??0,x=p.x+(board[0]+Math.sin(facing)*2)*p.scale,z=p.z+(board[2]+Math.cos(facing)*2)*p.scale,y=integrated.gridHeight(x,z);spawn={x,z,y}}
   if(!spawn){const t=d.tiles.find(t=>t.ground!=='water'&&t.paths?.length&&!t.prefab);if(t){const x=p.x+t.x*p.scale,z=p.z+t.z*p.scale;spawn={x,z,y:integrated.gridHeight(x,z)}}}
   if(!spawn)throw Error('No safe arrival candidate');
   clear();root.add(integrated.group,tmp);if(guild){const c=document.createElement('canvas');c.width=768;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#221b35';ctx.fillRect(0,0,768,160);ctx.fillStyle='#ffe4a1';ctx.font='bold 50px sans-serif';ctx.textAlign='center';ctx.fillText('GREMIO DE AVENTUREROS',384,100);const tex=new THREE.CanvasTexture(c),label=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false}));const x=p.x+(board?.[0]??guild.x)*p.scale,z=p.z+(board?.[2]??guild.z)*p.scale;label.position.set(x,integrated.gridHeight(x,z)+3.2,z);label.scale.set(7,1.46,1);label.userData.ownMaterial=true;root.add(label)}active={p,d,integrated,spawn};fusion.activate(p);clipTerrain(p);clipWater(p);
   if(structure)register(structure);for(const arr of chunk.values())register(geom(arr));
   root.updateMatrixWorld(true);if(warp)travel(spawn.x,spawn.z,spawn.y);
   say('Región '+seed+' · '+d.pieces.length+' piezas fuente · colisión exterior experimental');panel.style.display='none';
  }catch(e){say('Error: '+e.message);console.error(e)}finally{setBusy(false)}
 }
 for(const p of placement.placements.sort((a,b)=>a.seed-b.seed))button('Isla '+p.seed+' · '+REGION_THEMES[p.seed],()=>open(p.seed,true));
 button('Inicio original',()=>{if(busy||game.state!=='playing')return;clear();const h=game.sites?.spawn??{x:-519,z:-70,y:game.world.floorBelow(-519,nativeHeight(-519,-70)+25,-70,35)};travel(h.x,h.z,h.y);panel.style.display='none'});
 button('FPS: mostrar/ocultar',()=>globalThis.__hfP508Clock?.cycleDiagnostics());
 pipe.onBeforeScene.push(()=>{const now=performance.now();if(now-lastCheck<900||busy||game.state!=='playing')return;lastCheck=now;const {x,z}=game.player.pos;const p=placement.placements.find(q=>inBounds(q,x,z,80));if(p&&active?.p.seed!==p.seed)open(p.seed,false);else if(active&&!inBounds(active.p,x,z,180))clear()});
 return {open,clear,get active(){return active?.p.seed??null},get busy(){return busy},regions:placement.placements};
}
