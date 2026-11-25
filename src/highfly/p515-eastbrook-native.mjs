/** HIGHFLY P515 — EASTBROOK / ARVELIA NATIVE RPG SCENE
 * Imported by P514's main.js once, before main gameplay begins.
 * NO World Forge/editor/localStorage dependency. No paid KayKit SOURCE files.
 * 11 real KayKit FREE CC0 / original Unsung MIT buildings always present.
 * Hand-authored curved stone plazas/roads use the original world-space architecture material.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshBuilder,M} from '../world/arch/builder.js';
import {hall,tower,lantern,bench} from '../world/arch/kit.js';
import {
 EASTBROOK_VERSION,EASTBROOK_LOTS,EASTBROOK_SQUARE,EASTBROOK_SAMPLED_PATHS,
 EASTBROOK_SOURCE,eastbrookClearing,eastbrookMask
} from './p515-eastbrook-layout.mjs';
export {eastbrookClearing,EASTBROOK_VERSION,EASTBROOK_LOTS,EASTBROOK_SOURCE};

const finite=x=>Number.isFinite(x);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function ground(world,x,z){
 const h=world.groundHeight?.(x,z);
 return finite(h)?h:null;
}
function footprint(world,o){
 const w=o.w*o.scale,d=o.d*o.scale,c=Math.cos(o.yaw),s=Math.sin(o.yaw),hs=[];
 for(const [a,b] of [[0,0],[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]]){
  const x=o.x+a*c-b*s,z=o.z+a*s+b*c,h=ground(world,x,z),water=world.waterLevel?.(x,z);
  if(h===null||h<-.1||(finite(water)&&water>=h-.1))return null;
  hs.push(h);
 }
 const min=Math.min(...hs),max=Math.max(...hs);
 if(max-min>Math.min(5.2,1.75+o.scale*1.5))return null;
 return {x:o.x,z:o.z,y:max,min,w,d,slope:max-min};
}
function buildUnsungModel(game,o,fp){
 const b=new MeshBuilder();
 b.at(o.x,fp.y+.03,o.z,o.yaw,q=>{
  if(o.model==='hall')hall(q,{w:23*o.scale,d:13*o.scale,h:16*o.scale,bays:5,detail:1,foot:3*o.scale});
  else if(o.model==='tower')tower(q,{r:3.2*o.scale,h:22*o.scale,sides:8,stages:2,top:'spire',spireH:10*o.scale,detail:1,foot:2*o.scale});
  else throw Error('Non-original Unsung city model '+o.model);
 });
 const mesh=game.arch.add(b,{near:false});
 mesh.name='HF_EASTBROOK_UNSUNG_'+o.id;
 mesh.updateMatrixWorld(true);
 game.world.addGeometry(mesh.geometry);
 return mesh;
}
function addFoundation(game,lot,fp){
 const b=new MeshBuilder(),deep=clamp(fp.y-fp.min+.24,.24,3.8);
 b.mat_(M.ASHLAR).at(lot.x,fp.y-deep,lot.z,lot.yaw,q=>{
  q.cbox(0,0,0,fp.w+.65,deep,fp.d+.65);
  q.mat_(M.PAVING).cbox(0,deep-.03,0,fp.w+.82,.10,fp.d+.82);
 });
 const mesh=game.arch.add(b,{near:false});
 mesh.name='HF_EASTBROOK_FOUNDATION_'+lot.id;
 // Only the top needs to be solid, native terrain supplies the rest.
 mesh.updateMatrixWorld(true);
 game.world.addLazy(lot.x,lot.z,Math.max(fp.w,fp.d),()=>mesh.geometry);
 return mesh;
}
function paintRoads(game){
 const world=game.world,b=new MeshBuilder(),meta=[];
 let roadSegments=0,rejected=0;
 // A single mesh preserves the native Unsung triplanar PAVING material.
 for(const road of EASTBROOK_SAMPLED_PATHS){
  const pts=road.samples;
  let n=0;
  for(let i=1;i<pts.length;i++){
   const a=pts[i-1],d=pts[i],dx=d.x-a.x,dz=d.z-a.z,len=Math.hypot(dx,dz);
   if(len<.05)continue;
   const px=-dz/len,pz=dx/len,width=road.width*.5;
   const at=(v,side,raise)=>{
    const x=v.x+px*side,z=v.z+pz*side;
    const h=ground(world,x,z);
    return h===null?null:[x,h+raise,z];
   };
   const midA=ground(world,a.x,a.z),midB=ground(world,d.x,d.z);
   if(midA===null||midB===null||Math.abs(midA-midB)>1.2){rejected++;continue;}
   // Top surface, both 0.19m-tall visually distinct stone side borders.
   const l0=at(a,width,.10),l1=at(d,width,.10),r1=at(d,-width,.10),r0=at(a,-width,.10);
   if([l0,l1,r1,r0].some(x=>x===null)){rejected++;continue;}
   const maximum=Math.max(...[l0,l1,r1,r0].map(x=>x[1]));
   const minimum=Math.min(...[l0,l1,r1,r0].map(x=>x[1]));
   if(maximum-minimum>1.55){rejected++;continue;}
   b.mat_(M.PAVING).quad(l0,l1,r1,r0);
   for(const sign of [-1,1]){
    const near=width-.16,far=width+.20;
    const p0=at(a,sign*near,.14),p1=at(d,sign*near,.14);
    const q1=at(d,sign*far,.14),q0=at(a,sign*far,.14);
    if([p0,p1,q1,q0].every(Boolean)){
     b.mat_(M.FRIEZE);
     if(sign>0)b.quad(q0,q1,p1,p0);else b.quad(p0,p1,q1,q0);
    }
   }
   n++;roadSegments++;
  }
  meta.push({id:road.id,segments:n});
 }
 // Town square is independently terraced to the TRUE heightfield, with no
 // large horizontal floating plane and without replacing Unsung's native plaza.
 const sq=EASTBROOK_SQUARE;
 for(let r=0;r<sq.radius;r+=1.25){
  const outer=Math.min(sq.radius,r+1.25),N=Math.max(30,Math.ceil(2*Math.PI*outer/1.6));
  for(let i=0;i<N;i++){
   const a=i*2*Math.PI/N,c=(i+1)*2*Math.PI/N;
   const point=(rad,ang)=>{
    const x=sq.x+Math.cos(ang)*rad,z=sq.z+Math.sin(ang)*rad,h=ground(world,x,z);
    return h===null?null:[x,h+.095,z];
   };
   const p0=point(r,a),p1=point(outer,a),p2=point(outer,c),p3=point(r,c);
   if([p0,p1,p2,p3].some(x=>x===null))continue;
   const spread=Math.max(p0[1],p1[1],p2[1],p3[1])-Math.min(p0[1],p1[1],p2[1],p3[1]);
   if(spread>1.25)continue;
   b.mat_(r>=sq.radius-1.25?M.FRIEZE:M.PAVING);
   // CCW top face.
   b.quad(p0,p1,p2,p3);
  }
 }
 if(b.triCount===0)throw Error('P515 zero stone roads: native Unsung heightfield not ready');
 const roads=game.arch.add(b,{near:false});
 roads.name='HF_EASTBROOK_CURVED_COBBLE_AND_PLAZA';
 // Decorative slabs hug the native ground; collision remains the original
 // terrain BVH, preventing invisible road walls or blocked stairs.
 return {mesh:roads,triangles:b.triCount,roadSegments,rejected,meta};
}
function addSmallProps(game){
 const b=new MeshBuilder(),world=game.world;
 const decorations=[
  {kind:'lantern',x:-590,z:-75},{kind:'lantern',x:-578,z:-73},
  {kind:'lantern',x:-619,z:-67},{kind:'lantern',x:-640,z:-67},
  {kind:'lantern',x:-566,z:-56},{kind:'lantern',x:-552,z:-72},
  {kind:'bench',x:-581,z:-58},{kind:'bench',x:-594,z:-51}
 ];
 for(const p of decorations){
  const y=ground(world,p.x,p.z);if(y===null)continue;
  b.at(p.x,y+.04,p.z,0,q=>{
   if(p.kind==='lantern')lantern(q,3.0);
   else bench(q,2.5);
  });
 }
 if(!b.triCount)return null;
 const result=game.arch.add(b,{near:false});
 result.name='HF_EASTBROOK_NATIVE_LANTERNS_BENCHES';
 return result;
}
function prepareGrassMask(cover){
 const {data,painted,size}=eastbrookMask(1024);
 const tex=new THREE.DataTexture(data,size,size,THREE.RedFormat,THREE.UnsignedByteType);
 tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;
 tex.wrapS=THREE.ClampToEdgeWrapping;tex.wrapT=THREE.ClampToEdgeWrapping;
 tex.generateMipmaps=false;tex.needsUpdate=true;
 for(const material of [cover?.grassMat,cover?.flowerMat]){
  if(!material?.uniforms?.uHFEastbrook)throw Error('Missing P515 native meadow exclusion shader uniform');
  material.uniforms.uHFEastbrook.value=tex;
 }
 return {texture:tex,painted};
}
export function installNativeEastbrook(game,{cover=globalThis.__parts?.cover}={}){
 if(!game?.world||!game?.arch||!game?.pipe?.scene)throw Error('Eastbrook native requires initialized Unsung world');
 if(game.__hfP515Eastbrook)return game.__hfP515Eastbrook;
 const world=game.world,scene=game.pipe.scene,loader=new GLTFLoader(),started=performance.now();
 const lots=[],skipped=[],loaded=[],failed=[],foundations=[],originals=[];
 const map=new Map(),base=import.meta.env.BASE_URL+'highfly/kaykit-free/';
 const loadPrefab=(name)=>{
  if(!map.has(name))map.set(name,loader.loadAsync(base+'building_'+name+'_red.gltf'));
  return map.get(name);
 };
 // Grass and tree clearing is static, never runs in the per-frame gameplay loop.
 const vegetation=prepareGrassMask(cover);
 for(const lot of EASTBROOK_LOTS){
  const fp=footprint(world,lot);
  if(!fp){skipped.push({id:lot.id,reason:'slope, water or missing ground'});continue;}
  lots.push({lot,fp});
  foundations.push(addFoundation(game,lot,fp));
  if(lot.type==='unsung')originals.push(buildUnsungModel(game,lot,fp));
 }
 const roads=paintRoads(game),props=addSmallProps(game);
 const api={
  id:EASTBROOK_VERSION,mode:'native-original-p514',editor:false,placed:true,source:EASTBROOK_SOURCE,
  intended:EASTBROOK_LOTS.length,lots:lots.map(x=>({...x.lot,y:x.fp.y,slope:x.fp.slope})),
  skipped,loaded,failed,roads:{triangles:roads.triangles,segments:roads.roadSegments,rejected:roads.rejected},paved:roads.mesh.name,
  grassPixels:vegetation.painted,readyPromise:null,ms:0,
  get visibleBuildings(){return loaded.length+originals.length;},
  get fullyBuilt(){return !skipped.length&&!failed.length&&loaded.length+originals.length===EASTBROOK_LOTS.length;}
 };
 game.__hfP515Eastbrook=api;
 globalThis.__hfEastbrook=api;
 api.readyPromise=Promise.allSettled(lots.filter(x=>x.lot.type==='kaykit').map(async ({lot,fp})=>{
  const gltf=await loadPrefab(lot.model);
  const model=gltf.scene.clone(true);
  model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),sz=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(sz.x<.01||sz.z<.01)throw Error('KayKit asset has no footprint: '+lot.model);
  const scale=Math.min(fp.w/sz.x,fp.d/sz.z);
  model.scale.setScalar(scale);
  model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  const anchor=new THREE.Group();
  anchor.name='HF_EASTBROOK_KAYKIT_CC0_'+lot.id;
  anchor.position.set(lot.x,fp.y+.10,lot.z);
  anchor.rotation.y=lot.yaw;
  anchor.add(model);
  scene.add(anchor);
  anchor.updateMatrixWorld(true);
  let solid=0;
  model.traverse(mesh=>{
   if(!mesh.isMesh||!mesh.geometry?.attributes?.position)return;
   mesh.frustumCulled=true;mesh.castShadow=false;mesh.receiveShadow=true;
   const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
   if(geometry.index?.count>80000){geometry.dispose();return;}
   world.addLazy(lot.x,lot.z,Math.max(fp.w,fp.d)*.75,()=>geometry);
   solid++;
  });
  loaded.push({id:lot.id,model:lot.model,anchor,colliders:solid});
 })).then(results=>{
  results.forEach((r,i)=>{if(r.status==='rejected')failed.push({id:lots.filter(x=>x.lot.type==='kaykit')[i].lot.id,error:String(r.reason)});});
  api.ms=Math.round(performance.now()-started);
  console.info('[HIGHFLY P515 NATIVE EASTBROOK]',JSON.stringify({
   loaded:loaded.length,unsung:originals.length,skipped,failed,roads:api.roads,grassPixels:api.grassPixels,elapsedMs:api.ms
  }));
  return api;
 });
 console.info('[HIGHFLY P515] Always-on native Eastbrook placed, NO World Forge',lots.length,'foundations',roads.roadSegments,'cobblestone segments');
 return api;
}
