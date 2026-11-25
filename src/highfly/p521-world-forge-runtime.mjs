/** HIGHFLY WORLD FORGE V0.1: render saved, placed editor objects
 * inside REAL Unsung world. Only opt-in ?hfworld=1 and same-origin storage.
 * No KayKit SOURCE or project-restricted assets. Existing terrain untouched.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneRig} from 'three/addons/utils/SkeletonUtils.js';
import {MeshBuilder,M} from '../world/arch/builder.js';
import {lantern,bench,hall,pavilion} from '../world/arch/kit.js';
import * as NativeKit from '../world/arch/kit.js';
import * as NativeArch from '../world/arch/builder.js';
import {UNSUNG_ORIGINAL_ASSETS,UNSUNG_ORIGINAL_IDS,buildUnsungOriginal} from './p530-unsung-original.mjs';
import {buildWorldForgeCityMask} from './p530-city-ground-mask.mjs';
import {VILLAGE_DECOR_ASSETS,VILLAGE_DECOR_IDS,buildBeginningVillage} from './p528-village-layout.mjs';
import {makeVillageDecor} from './p528-village-decor-3d.mjs';
import {loadPrivateSourceCatalog,readPrivateSourceGLB,privateSourceType} from './p529-private-source-import.mjs';
const PRIVATE_SOURCE=new Map(loadPrivateSourceCatalog().map(a=>[a.id,a]));

const P530_PREVIEW=globalThis.location?.pathname?.includes('/preview-p530/')===true;
const P529_PREVIEW=globalThis.location?.pathname?.includes('/preview-p529/')===true;
export const WORLD_FORGE_KEY=P530_PREVIEW?'hf-world-forge-layout-p530-v1':P529_PREVIEW?'hf-world-forge-layout-p529-v1':'hf-world-forge-layout-v1';
const BOUNDS=Object.freeze({
 guild:[14,11],forge:[11,9],inn:[12,10],house:[9,8],
 timber:[8,8],market:[12,9],mill:[10,10],granary:[12,9],
 warehouse:[11,9],fishery:[10,8],ranger:[9,8],
 'floor-stone':[4,4],'floor-earth':[4,4],'floor-wood':[4,4],
 lantern:[1.5,1.5],well:[4,4],fence:[4,.4],barrel:[1.1,1.1],
 bench:[3,1.4],tree:[3,3],rock:[3,2.5],ore:[3,3],
 'npc-merchant':[1,1],'npc-guard':[1,1],'npc-artisan':[1,1],
 'kaykit-archeryrange':[16,13],
 'kaykit-barracks':[14,12],
 'kaykit-blacksmith':[12,12],
 'kaykit-castle':[23,23],
 'kaykit-church':[13,13],
 'kaykit-home-a':[10,9],
 'kaykit-home-b':[10,9],
 'kaykit-lumbermill':[14,12],
 'kaykit-market':[13,11],
 'kaykit-mine':[13,12],
 'kaykit-tavern':[13,12],
 'kaykit-tower-a':[8,8],
 'kaykit-tower-b':[8,8],
 'kaykit-watermill':[12,12],
 'kaykit-well':[6,6],
 'kaykit-windmill':[12,12],
 ...Object.fromEntries(VILLAGE_DECOR_ASSETS.map(a=>[a.id,[a.w,a.d]])),
 ...Object.fromEntries(UNSUNG_ORIGINAL_ASSETS.map(a=>[a.id,[a.w,a.d]])),
 ...Object.fromEntries([...PRIVATE_SOURCE.values()].map(a=>[a.id,[a.width,a.depth]]))
});
// Protect actual arrival spot and original walkable geometry; broad 42m circles used
// to veto even empty buildable terrain. The editor checks original footprint separately.
const PROTECTED=[[-519,-70,8],[-179,-459,7]];
const num=x=>typeof x==='number'&&Number.isFinite(x);
// The original Unsung renderer can exclude tree instances on a building's footprint
// BEFORE creating GPU instance buffers, preserving the source forest everywhere else.
export function worldForgeTreeClearings({search=globalThis.location?.search??'',storage=globalThis.localStorage}={}){
 if(new URLSearchParams(search).get('hfworld')!=='1')return ()=>false;
 const loaded=loadedLayout(storage);
 if(!loaded.ok)return ()=>false;
 const cleared=loaded.objects.filter(o=>o.clearTrees===true&&!o.type.startsWith('npc-'));
 return (x,z)=>cleared.some(o=>{
  const dims=BOUNDS[o.type];if(!dims)return false;
  const dx=x-o.x,dz=z-o.z,c=Math.cos(o.yaw),s=Math.sin(o.yaw);
  const lx=dx*c+dz*s,lz=-dx*s+dz*c;
  return Math.abs(lx)<dims[0]*o.scale*.5+1.8&&Math.abs(lz)<dims[1]*o.scale*.5+1.8;
 });
}

const KAYKIT_FREE_NAMES=Object.freeze({
 'kaykit-archeryrange':'archeryrange','kaykit-barracks':'barracks',
 'kaykit-blacksmith':'blacksmith','kaykit-castle':'castle',
 'kaykit-church':'church','kaykit-home-a':'home_A','kaykit-home-b':'home_B',
 'kaykit-lumbermill':'lumbermill','kaykit-market':'market',
 'kaykit-mine':'mine','kaykit-tavern':'tavern',
 'kaykit-tower-a':'tower_A','kaykit-tower-b':'tower_B',
 'kaykit-watermill':'watermill','kaykit-well':'well','kaykit-windmill':'windmill'
});
// Pinned public CC0 glTF, not privately purchased SOURCE content.
// All model files and their legal licence are shipped by build P524.
const kaykitFreeUrl=type=>import.meta.env.BASE_URL+'highfly/kaykit-free/building_'+KAYKIT_FREE_NAMES[type]+'_red.gltf';

export function validateWorldForgeLayout(data){
 if(!data||data.schema!==1||data.world!=='unsung-vale'||!Array.isArray(data.objects)||data.objects.length>2500)
  return {ok:false,reason:'invalid layout/schema/size',objects:[]};
 const all=[],ids=new Set();
 for(const o of data.objects){
  if(!o||typeof o.id!=='string'||o.id.length>80||ids.has(o.id)||
     !Object.hasOwn(BOUNDS,o.type)||![o.x,o.z,o.yaw,o.scale].every(num)||
     Math.abs(o.x)>8120||Math.abs(o.z)>8120||o.scale<.5||o.scale>3)
    return {ok:false,reason:'invalid item',objects:[]};
  ids.add(o.id);all.push({...o});
 }
 return {ok:true,objects:all};
}
function footprint(world,o){
 const [w0,d0]=BOUNDS[o.type],w=w0*o.scale,d=d0*o.scale;
 const c=Math.cos(o.yaw),s=Math.sin(o.yaw),heights=[];
 for(const [dx,dz] of [[0,0],[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]]){
  const x=o.x+dx*c-dz*s,z=o.z+dx*s+dz*c;
  const h=world.groundHeight(x,z),water=world.waterLevel?.(x,z);
  if(!num(h)||h<-.1||(num(water)&&water>=h-.1))return null;
  heights.push(h);
 }
 const y=Math.max(...heights),slope=y-Math.min(...heights);
 if(!o.type.startsWith('floor-')&&!o.type.startsWith('npc-')&&slope>Math.min(5.2,1.75+o.scale*1.5))
  return null;
 if(!o.type.startsWith('floor-')){
  const r=Math.hypot(w,d)*.22;
  if(PROTECTED.some(([x,z,radius])=>Math.hypot(o.x-x,o.z-z)<radius+r))return null;
  // Original stone platforms and stairs already have real solids in CollisionWorld.
  // Buildings cannot overwrite those solids; paths/paving may continue across them.
  for(const [dx,dz] of [[0,0],[-w*.3,-d*.3],[w*.3,-d*.3]]){
   const x=o.x+dx,z=o.z+dz,top=world.floorBelow?.(x,y+20,z,40);
   if(num(top)&&top>world.groundHeight(x,z)+.75)return null;
  }
 }
 return {y,w,d,slope};
}
function roof(q,w,d,h,type){
 const e=.45,peak=h+Math.min(4,d*.4);
 q.mat_(type==='timber'||type==='ranger'?M.DARK:M.ROOF);
 q.quad([-w/2-e,h,d/2+e],[w/2+e,h,d/2+e],[w/2+e,peak,0],[-w/2-e,peak,0]);
 q.quad([w/2+e,h,-d/2-e],[-w/2-e,h,-d/2-e],[-w/2-e,peak,0],[w/2+e,peak,0]);
 q.mat_(M.GOLD).box(-w/2-e,peak-.13,-.13,w+2*e,.27,.26);
}
function house(q,type,w,d,h){
 const wall=.35,door=2.55,d2=(w-door)/2;
 q.mat_(type==='timber'||type==='ranger'?M.DARK:M.ASHLAR);
 q.box(-w/2,0,-d/2,w,h,wall);
 q.box(-w/2,0,-d/2,wall,h,d);
 q.box(w/2-wall,0,-d/2,wall,h,d);
 q.box(-w/2,0,d/2-wall,d2,h,wall);
 q.box(door/2,0,d/2-wall,d2,h,wall);
 q.box(-door/2,3.25,d/2-wall,door,h-3.25,wall);
 q.mat_(M.MARBLE).box(-w/2,-.03,-d/2,w,.10,d);
 for(const x of [-w*.33,w*.33]){
  q.mat_(M.FRIEZE).box(x-.38,h*.52,d/2-.11,.76,1.3,.18);
  q.mat_(M.GLASS).box(x-.3,h*.6,d/2+.07,.6,.85,.03);
 }
 if(type==='timber'||type==='ranger'){
  q.mat_(M.ROOF);
  for(const x of [-w/2+.5,0,w/2-.5])q.box(x-.15,0,d/2-.45,.3,h,d+.1);
 }
 roof(q,w,d,h,type);
}
function buildStructure(b,o,f){
 const type=o.type,[w0,d0]=BOUNDS[type],w=w0*o.scale,d=d0*o.scale;
 const h=({guild:12,forge:7.5,inn:8,house:7,timber:6,market:5,mill:11,granary:7,warehouse:7,fishery:6.5,ranger:6})[type]*o.scale;
 b.at(o.x,f.y+.03,o.z,o.yaw,q=>{
  if(type==='guild'){
   // Reuse actual original Unsung architecture, not the previous P520 stone cubes.
   hall(q,{w,d,h:Math.max(h,9),bays:3,detail:1,foot:1.2});
   q.mat_(M.PAVING).box(-w/2-.7,-.17,d/2,w+1.4,.16,2.8);
  }else if(type==='market'){
   q.mat_(M.PAVING).box(-w/2,-.16,-d/2,w,.16,d);
   for(const x of [-w*.31,w*.31]){
    q.mat_(M.ASHLAR).box(x-1,0,-d*.3,2,1.1,3);
    q.mat_(M.ROOF).box(x-3,2.6,-d*.44,6,.27,d*.65);
    for(const z of [-d*.38,d*.15])q.mat_(M.MARBLE).box(x-2.9,0,z,.18,2.6,.18);
   }
  }else if(type==='mill'){
   q.mat_(M.ASHLAR).prism(w*.4,w*.32,0,h,8);
   q.mat_(M.ROOF).prism(w*.43,0,h,h+3*o.scale,8);
   q.mat_(M.DARK).box(-.25,h*.5,d*.39,.5,h*.55,.3);
   q.mat_(M.MARBLE).box(-w*.35,h*.73,d*.48,w*.7,.26,.35);
   q.mat_(M.MARBLE).box(-.15,h*.4,d*.48,.3,h*.7,.35);
   q.mat_(M.MARBLE).box(-w*.21,h*.53,d*.5,w*.42,.14,.18);
  }else{
   house(q,type,w,d,h);
   if(type==='forge'){
    q.mat_(M.ASHLAR).box(w*.34,h*.62,-d*.37,1.1,4*o.scale,1.1);
    q.mat_(M.DARK).box(w*.28,h*.62+4*o.scale,-d*.45,1.25,.4,1.25);
   }
   if(type==='inn'){q.at(0,0,d/2+2*o.scale,0,j=>bench(j,2.2*o.scale));}
   if(type==='fishery'){q.mat_(M.PAVING).box(-w/2,-.15,d/2,w,.15,2.5*o.scale);}
  }
  for(const x of [-w/2+.9,w/2-.9])q.at(x,0,d/2+1.1,0,j=>lantern(j,2.5*o.scale));
 });
}
function decorate(b,o,f,world){
 const type=o.type,[w0,d0]=BOUNDS[type],w=w0*o.scale,d=d0*o.scale;
 if(type.startsWith('floor-')){
  const x=o.x,z=o.z,y=(px,pz)=>{
   const ground=world.groundHeight(px,pz);
   // Align new paving with the real native Unsung plaza platform and its ramps.
   const solid=world.floorBelow?.(px,ground+65,pz,65);
   return num(solid)?Math.max(ground,solid):ground;
  };
  const c=Math.cos(o.yaw),s=Math.sin(o.yaw),pos=(a,b)=>{
   const px=x+a*c-b*s,pz=z+a*s+b*c;
   return [px,y(px,pz)+.06,pz];
  };
  b.mat_(type==='floor-stone'?M.PAVING:type==='floor-wood'?M.ROOF:M.ASHLAR);
  b.quad(pos(-w/2,d/2),pos(w/2,d/2),pos(w/2,-d/2),pos(-w/2,-d/2));
  return;
 }
 b.at(o.x,f.y+.035,o.z,o.yaw,q=>{
  const scale=o.scale;
  if(type==='lantern')q.at(0,0,0,0,j=>lantern(j,3*scale));
  if(type==='bench')q.at(0,0,0,0,j=>bench(j,3*scale));
  if(type==='well'){
   q.mat_(M.MARBLE).lathe([[2*scale,0],[2*scale,1.0*scale],[1.6*scale,1.0*scale]],12);
   q.mat_(M.DARK).prism(1.45*scale,1.2*scale,.65*scale,.1*scale,12);
  }
  if(type==='fence'){
   for(const x of [-w/2,w/2])q.mat_(M.ASHLAR).box(x-.16,0,-.16,.32,1.55*scale,.32);
   for(const y of [.45,1.07])q.mat_(M.ROOF).box(-w/2,y*scale,-.13,w,.17*scale,.26);
  }
  if(type==='barrel'){
   q.mat_(M.ROOF).prism(.5*scale,.58*scale,0,1.12*scale,8);
   for(const y of [.2,.92])q.mat_(M.GOLD).prism(.61*scale,.61*scale,y*scale,.08*scale,8);
  }
  if(type==='tree'){
   q.mat_(M.DARK).prism(.4*scale,.34*scale,0,3.1*scale,7);
   q.mat_(M.ROOF).prism(2*scale,1*scale,2.4*scale,6.7*scale,8);
  }
  if(type==='rock')q.mat_(M.ASHLAR).prism(1.7*scale,1.1*scale,0,1.8*scale,7);
  if(type==='ore'){
   q.mat_(M.ASHLAR).prism(1.4*scale,.9*scale,0,1.5*scale,6);
   q.mat_(M.GOLD).prism(.5*scale,.2*scale,.4*scale,1.5*scale,5);
  }
 });
}
function loadedLayout(storage){
 try{return validateWorldForgeLayout(JSON.parse(storage?.getItem(WORLD_FORGE_KEY)||'null'));}
 catch{return {ok:false,objects:[],reason:'Storage unavailable or invalid JSON'};}
}
export function installHighflyWorldForge(game,{search=globalThis.location?.search??'',storage=globalThis.localStorage}={}){
 if(!game||game.__hfP521WorldForge)return game?.__hfP521WorldForge??null;
 if(new URLSearchParams(search).get('hfworld')!=='1')return null;
 let loaded=loadedLayout(storage);
 // P529 demo only: the exact same editable, collision-checked town is
 // generated on the first gameplay visit, even if World Forge wasn't opened.
 // Existing saved layouts take precedence. Other versions are not modified.
 if(!loaded.ok&&P529_PREVIEW&&storage?.getItem(WORLD_FORGE_KEY)===null){
  const origin={x:-512,z:-70};
  const plan=buildBeginningVillage({
   origin,existing:[],
   canPlace:o=>{
    const fp=footprint(game.world,o);
    if(!fp)return {ok:false,why:'Agua, pendiente o arquitectura original'};
    return {ok:true,y:fp.y};
   }
  });
  if(plan.buildings>=3&&plan.paved>=40){
   const payload={schema:1,world:'unsung-vale',author:'HIGHFLY P529 Pueblo de los Inicios',objects:plan.objects};
   loaded=validateWorldForgeLayout(payload);
   if(loaded.ok){
    try{storage.setItem(WORLD_FORGE_KEY,JSON.stringify(payload));}catch(e){console.warn('[HIGHFLY P529] Pueblo temporal sin guardado',e);}
    console.info('[HIGHFLY P529] Pueblo de los Inicios generado en mapa nativo',plan.buildings,plan.paved,plan.decorations);
   }
  }
 }
 if(!loaded.ok){console.info('[HIGHFLY WORLD FORGE] No layout available',loaded.reason);return null;}
 const world=game.world,group=game.pipe.scene,byChunk=new Map(),people=[],resources=[],kaykitBuildings=[],sourceBuildings=[],originalBuildings=[],scenic=[],skipped=[];
 // Original GroundCover shaders receive one R8 city mask, not thousands of CPU raycasts.
 const cover=globalThis.__parts?.cover;
 const oldCoverTex=cover?.grassMat?.uniforms?.uHighflyCityMask?.value??null;
 let cityTexture=null;
 if(cover?.grassMat?.uniforms?.uHighflyCityMask&&cover?.flowerMat?.uniforms?.uHighflyCityMask){
  const paved=buildWorldForgeCityMask(loaded.objects,BOUNDS);
  if(paved.painted){
   cityTexture=new THREE.DataTexture(paved.mask,paved.resolution,paved.resolution,THREE.RedFormat,THREE.UnsignedByteType);
   cityTexture.minFilter=THREE.LinearFilter;cityTexture.magFilter=THREE.LinearFilter;
   cityTexture.wrapS=cityTexture.wrapT=THREE.ClampToEdgeWrapping;
   cityTexture.needsUpdate=true;
   cover.grassMat.uniforms.uHighflyCityMask.value=cityTexture;
   cover.flowerMat.uniforms.uHighflyCityMask.value=cityTexture;
   console.info('[HIGHFLY WORLD FORGE CITY MASK]',paved.surfaces,'surfaces,',paved.painted,'2m pixels; grass and flowers cleared');
  }
 }
 const nativeCenters=new Map();
 const nativeCenter=type=>{
  if(nativeCenters.has(type))return nativeCenters.get(type);
  const tmp=new MeshBuilder();buildUnsungOriginal(type,tmp,{kit:NativeKit,arch:NativeArch});
  const a=tmp.pos;
  let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity,minY=Infinity;
  for(let j=0;j<a.length;j+=3){
   minX=Math.min(minX,a[j]);maxX=Math.max(maxX,a[j]);
   minY=Math.min(minY,a[j+1]);minZ=Math.min(minZ,a[j+2]);maxZ=Math.max(maxZ,a[j+2]);
  }
  const result={x:(minX+maxX)*.5,y:minY,z:(minZ+maxZ)*.5,sx:maxX-minX,sz:maxZ-minZ};
  nativeCenters.set(type,result);return result;
 };
 const size=220,add=(o,kind)=>{const key=Math.floor(o.x/size)+':'+Math.floor(o.z/size);
  if(!byChunk.has(key))byChunk.set(key,new MeshBuilder());
  return byChunk.get(key);
 };
 for(const o of loaded.objects){
  const fp=footprint(world,o);
  if(!fp){skipped.push(o.id);continue;}
  if(o.type.startsWith('npc-')){people.push({...o,y:fp.y});continue;}
  if(VILLAGE_DECOR_IDS.has(o.type)){scenic.push({...o,y:fp.y});continue;}
  if(UNSUNG_ORIGINAL_IDS.has(o.type)){
   // Real MIT Unsung kit pieces, same original procedural geometry and shader as native map.
   const center=nativeCenter(o.type),b=add(o),dims=BOUNDS[o.type];
   const k=Math.min(dims[0]/Math.max(.01,center.sx),dims[1]/Math.max(.01,center.sz))*o.scale;
   b.at(o.x,fp.y+.065,o.z,o.yaw,q=>{
    q.push().scale(k,k,k).translate(-center.x,-center.y,-center.z);
    buildUnsungOriginal(o.type,q,{kit:NativeKit,arch:NativeArch});
    q.pop();
   });
   originalBuildings.push(o);continue;
  }
  if(privateSourceType(o.type)&&PRIVATE_SOURCE.has(o.type)){
   const a=PRIVATE_SOURCE.get(o.type);
   if(a.kind==='building'){
    const slabH=Math.max(.16,fp.slope+.26),builder=add(o);
    builder.at(o.x,fp.y+.065,o.z,o.yaw,q=>{
     q.mat_(M.ASHLAR).box(-fp.w*.485,-slabH,-fp.d*.485,fp.w*.97,slabH,fp.d*.97);
    });
   }
   sourceBuildings.push({o,fp});
   continue;
  }
  if(Object.hasOwn(KAYKIT_FREE_NAMES,o.type)){
   // A real native Unsung stone foundation follows the max of all footprint corners.
   // Matches the editor's solid plinth, prevents a complete building sinking into slopes.
   const slabH=Math.max(.16,fp.slope+.26),builder=add(o);
   builder.at(o.x,fp.y+.065,o.z,o.yaw,q=>{
    q.mat_(M.ASHLAR).box(-fp.w*.485,-slabH,-fp.d*.485,fp.w*.97,slabH,fp.d*.97);
   });
   kaykitBuildings.push({o,fp});continue;
  }
  if(o.type==='ore'||o.type==='tree')resources.push({...o,y:fp.y});
  const builder=add(o);
  if(['guild','forge','inn','house','timber','market','mill','granary','warehouse','fishery','ranger'].includes(o.type))
   buildStructure(builder,o,fp);
  else decorate(builder,o,fp,world);
 }
 const meshes=[],collisions=[];
 for(const [key,builder] of byChunk){
  if(!builder.triCount)continue;
  const mesh=game.arch.add(builder,{near:false});
  mesh.name='HIGHFLY_WORLD_FORGE_CHUNK_'+key;
  mesh.updateMatrixWorld(true);meshes.push(mesh);
  // Static, solid and walkable; a single original BVH for each 220m cell.
  world.addGeometry(mesh.geometry);collisions.push(mesh.geometry);
 }
 // The same premium low-poly meshes used by the 3D editor appear in gameplay.
 // One static group per prop; simple nearby collision proxies are generated only
 // for solid pillars, tree trunks and elevated gazebo floor to protect Android.
 const scenicObjects=[];
 for(const o of scenic){
  const model=makeVillageDecor(o.type,o.scale);if(!model){skipped.push(o.id);continue;}
  model.position.set(o.x,o.y+.045,o.z);model.rotation.y=o.yaw;
  model.traverse(mesh=>{if(mesh.isMesh)mesh.frustumCulled=true;});
  group.add(model);scenicObjects.push({o,model});
  const addSolid=(localX,localZ,localY,w,h,d)=>{
   const c=Math.cos(o.yaw),s=Math.sin(o.yaw),
    wx=o.x+(localX*c-localZ*s)*o.scale,wz=o.z+(localX*s+localZ*c)*o.scale;
   const geom=new THREE.BoxGeometry(w*o.scale,h*o.scale,d*o.scale);
   geom.rotateY(o.yaw);geom.translate(wx,o.y+localY*o.scale,wz);
   world.addLazy(wx,wz,Math.max(w,d)*o.scale,()=>geom);
   collisions.push(geom);
  };
  if(['village-blossom','village-lilac','village-autumn'].includes(o.type))
   addSolid(0,0,1.48,.64,2.85,.64);
  else if(o.type==='village-gazebo'){
   // Walkable pavilion plinth, four outside pillars; center remains accessible.
   addSolid(0,0,.19,7.6,.4,7.6);
   for(const [x,z] of [[3.35,0],[-3.35,0],[0,3.35],[0,-3.35]])
    addSolid(x,z,2.35,.46,3.7,.46);
  }else if(o.type.startsWith('village-stall-')){
   for(const x of [-2.12,2.12])for(const z of [-1.5,1.5])
    addSolid(x,z,1.6,.18,3.1,.18);
  }else if(o.type==='village-lamp'||o.type==='village-banner')
   addSolid(0,0,1.6,.25,3.15,.25);
  else if(o.type==='village-crates')addSolid(0,0,.48,2,1,1.6);
  else if(o.type==='village-flowerbed')addSolid(0,0,.2,2.9,.35,1.7);
 }
 const nodes=resources.map(o=>({id:'hf-wf-'+o.id,kind:o.type==='ore'?'ore':'tree',
  x:o.x,y:o.y,z:o.z,charges:8,available:true}));
 world.highflyInteractables=[...(world.highflyInteractables??[]),...nodes];
 let actors=[],disposed=false;
 const peopleReadyPromise=people.length?new GLTFLoader()
  .loadAsync(import.meta.env.BASE_URL+'models/hf-kaykit-knight.glb')
  .then(gltf=>{
   if(disposed)return;
   const bounds=new THREE.Box3().setFromObject(gltf.scene),h=Math.max(.1,bounds.getSize(new THREE.Vector3()).y);
   const idle=gltf.animations.find(x=>x.name==='Idle');
   for(const p of people.slice(0,90)){
    const anchor=new THREE.Group(),model=cloneRig(gltf.scene);
    anchor.name='HIGHFLY_WF_'+p.type+'_'+p.id;
    anchor.position.set(p.x,p.y+.045,p.z);anchor.rotation.y=p.yaw;
    model.scale.setScalar((1.8*p.scale)/h);
    model.traverse(x=>{
     if(!x.isMesh)return;
     x.frustumCulled=false;
     if(/sword|shield|helmet|visor|cape|dagger|bow|staff/i.test(x.name)){x.visible=false;return;}
     const old=Array.isArray(x.material)?x.material[0]:x.material;
     x.material=new THREE.MeshBasicMaterial({map:old?.map??null,color:x.name.includes('Head')?0xffffff:
      p.type==='npc-guard'?0xb0b8e6:p.type==='npc-artisan'?0xd7b185:0xbf98d9,
      side:THREE.DoubleSide,transparent:!!old?.transparent,alphaTest:old?.alphaTest??0});
    });
    anchor.add(model);anchor.visible=false;group.add(anchor);
    const mixer=new THREE.AnimationMixer(model);if(idle)mixer.clipAction(idle).play();
    actors.push({anchor,mixer,p});
   }
  })
  .catch(err=>console.warn('[HIGHFLY WORLD FORGE] NPC model failed',err)):Promise.resolve();

 // KayKit FREE (CC0): reuse glTF scene per type, but create fresh transforms for each
 // world-placed prefab. Static collision uses actual mesh triangles in world space.
 const kaykitObjects=[],kaykitFailures=[];
 const loader=new GLTFLoader(),prefabLoads=new Map();
 const getPrefab=type=>{
  if(!prefabLoads.has(type)){
   const p=privateSourceType(type)
    ?readPrivateSourceGLB(type).then(data=>loader.parseAsync(data,''))
    :loader.loadAsync(kaykitFreeUrl(type));
   prefabLoads.set(type,p);
  }
  return prefabLoads.get(type);
 };
 const allModelLots=[...kaykitBuildings,...sourceBuildings];
 const buildingsReadyPromise=Promise.allSettled(allModelLots.slice(0,160).map(async ({o,fp})=>{
  const gltf=await getPrefab(o.type);
  if(disposed)return;
  const scene=gltf.scene.clone(true);
  const box=new THREE.Box3().setFromObject(scene);
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  if(size.x<.01||size.z<.01)throw Error('Modelo KayKit sin volumen '+o.type);
  const scale=Math.min(fp.w/size.x,fp.d/size.z);
  const anchor=new THREE.Group();
  anchor.name='HIGHFLY_KAYKIT_FREE_'+o.type+'_'+o.id;
  anchor.position.set(o.x,fp.y+.03,o.z);anchor.rotation.y=o.yaw;
  scene.scale.setScalar(scale);
  scene.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
  scene.traverse(mesh=>{
   if(!mesh.isMesh)return;
   mesh.frustumCulled=true;
   if(privateSourceType(o.type))return; // Preserve actual SOURCE GLB textured materials.
   const old=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
   mesh.material=new THREE.MeshBasicMaterial({
    map:old?.map??null,
    color:0xfff5e7,
    side:THREE.FrontSide
   });
  });
  anchor.add(scene);group.add(anchor);anchor.updateMatrixWorld(true);
  // Actual meshes, exact scale and correct terrain y, not a fake stone cube.
  let added=0;
  scene.traverse(mesh=>{
   if(!mesh.isMesh||!mesh.geometry?.attributes?.position)return;
   // Trees and loose props retain visual fidelity without treating leaves as impassable walls.
   if(privateSourceType(o.type)&&!['building','rock'].includes(PRIVATE_SOURCE.get(o.type)?.kind))return;
   const geom=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
   if(geom.index?.count>120000)return;
   // Only collision for interactive proximity; BVHs can remain immutable until reload.
   world.addLazy(o.x,o.z,Math.max(fp.w,fp.d)*.7,()=>geom);
   collisions.push(geom);added++;
  });
  kaykitObjects.push({anchor,o,colliders:added});
 })).then(results=>{
  results.forEach((v,i)=>{if(v.status==='rejected')kaykitFailures.push({id:allModelLots[i]?.o.id,error:String(v.reason)});});
  console.info('[HIGHFLY KAYKIT FREE CC0]',kaykitObjects.length,'real medieval models,',kaykitFailures.length,'load failures');
 }).catch(err=>console.error('[HIGHFLY KAYKIT FREE]',err));
 const readyPromise=Promise.all([peopleReadyPromise,buildingsReadyPromise]);
 let lastUpdate=game.update;
 game.update=function(realDt){
  const result=lastUpdate.call(this,realDt);
  if(!disposed&&this.player?.pos)for(const a of actors){
   const d=Math.hypot(a.p.x-this.player.pos.x,a.p.z-this.player.pos.z);
   a.anchor.visible=d<130;
   if(d<65){a.mixer.update(Math.min(.05,Math.max(0,realDt||0)));a.anchor.updateMatrixWorld(true);}
  }
  return result;
 };
 const api={key:WORLD_FORGE_KEY,loaded:true,meshes,people,resources,nodes,skipped,kaykitBuildings,sourceBuildings,originalBuildings,kaykitObjects,kaykitFailures,scenicObjects,readyPromise,
  get npcCount(){return actors.length;},
  get placedCount(){return loaded.objects.length-skipped.length;},
  dispose(){
   disposed=true;game.update=lastUpdate;
   if(cityTexture&&cover?.grassMat?.uniforms?.uHighflyCityMask){
    cover.grassMat.uniforms.uHighflyCityMask.value=oldCoverTex;
    cover.flowerMat.uniforms.uHighflyCityMask.value=oldCoverTex;
    cityTexture.dispose();
   }
   world.highflyInteractables=(world.highflyInteractables??[]).filter(n=>!nodes.includes(n));
   for(const a of actors){group.remove(a.anchor);a.mixer.stopAllAction();}
   for(const k of kaykitObjects){group.remove(k.anchor);}
   for(const a of scenicObjects){group.remove(a.model);}
   // World collision is deliberately kept until page reload: no orphan BVH edits.
  }};
 game.__hfP521WorldForge=api;globalThis.__hfP521WorldForge=api;
 console.info('[HIGHFLY WORLD FORGE]',meshes.length,'native 3D chunks,',people.length,'placed NPCs,',skipped.length,'safety skips');
 return api;
}
