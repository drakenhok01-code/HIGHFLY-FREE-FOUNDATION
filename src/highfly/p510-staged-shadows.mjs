/** P510 progressive terrain shadow rebake for Unsung.
 *
 * The live baked terrain shadow maps are NEVER overwritten while preparing an
 * angle. Two lazy allocated scratch targets are filled at <=1 tile/12 frames.
 * Only when ALL the tiles are ready do the scratch textures atomically swap
 * into the existing uSCore/uSRegion uniforms.
 *
 * The fixed-object static map refreshes once per committed solar angle;
 * near/far camera shadow cascades keep Unsung's original frame pacing.
 * This code is opt-out with ?hfshadows=fixed (full native P509 compatibility).
 */
import * as THREE from 'three';
export function installP510StagedShadows(terrain,pipe,opts={}){
 if(!terrain||!pipe)return {enabled:false,reason:'missing terrain'};
 if(terrain._hfP510Shadows)return terrain._hfP510Shadows;
 const tooBig=Math.max(terrain.coreRes,terrain.regionRes)>2048;
 let pending=null,scratchCore=null,scratchRegion=null,frames=0;
 let requests=0,commits=0,tilesRendered=0,aborts=0;
 const create=(res)=>{
   const t=new THREE.WebGLRenderTarget(res,res,{
     depthBuffer:false,type:THREE.HalfFloatType,format:THREE.RGFormat,
     generateMipmaps:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter
   });
   t.texture.anisotropy=1;return t;
 };
 function targetForScratch(){
   if(!scratchCore)scratchCore=create(terrain.coreRes);
   if(!scratchRegion)scratchRegion=create(terrain.regionRes);
 }
 terrain.hfStartSunBake=(key,dir)=>{
   if(tooBig||pending||!terrain.shadowBake||terrain._queue?.length)return false;
   if(!Number.isInteger(key)||key<0||key>4)return false;
   targetForScratch();
   const v=pipe.sky.sunDir.clone().set(dir.x,dir.y,dir.z).normalize();
   const tiles=[],T=256;
   // Preserve the resolution and number of raymarch steps of the original.
   for(const [kind,res] of [['region',terrain.regionRes],['core',terrain.coreRes]]){
     for(let y=0;y<res;y+=T)for(let x=0;x<res;x+=T){
       tiles.push({kind,x,y,size:Math.min(T,res-x),height:Math.min(T,res-y)});
     }
   }
   pending={key,dir:v,tiles,at:0,total:tiles.length};
   requests++;
   return true;
 };
 terrain.hfAdvanceSunBake=(desiredKey)=>{
   if(!pending)return null;
   if(desiredKey!==undefined&&desiredKey!==pending.key){
     // Do not waste GPU processing obsolete solar angles during accelerated
     // tests or after manual switches.
     pending=null;aborts++;return {aborted:true};
   }
   if(++frames%12!==0)return null;
   const job=pending.tiles[pending.at++];
   if(job){
     const u=terrain.shadowBake.uniforms;
     const old={sun:u.uSunDir.value,h:u.uH.value,size:u.uSize.value,texel:u.uTexel.value,steps:u.uSteps.value};
     try {
       u.uSunDir.value=pending.dir;
       u.uH.value=job.kind==='core'?terrain.texHCore:terrain.texHRegion;
       u.uSize.value=job.kind==='core'?terrain.coreSize:terrain.regionSize;
       u.uTexel.value=job.kind==='core'?terrain.coreSize/terrain.coreRes:terrain.regionSize/terrain.regionRes;
       u.uSteps.value=job.kind==='core'?230:150;
       const target=job.kind==='core'?scratchCore:scratchRegion;
       terrain.shadowBake.renderRegion(pipe.renderer,target,job.x,job.y,job.size,job.height);
       tilesRendered++;
     } finally {
       u.uSunDir.value=old.sun;u.uH.value=old.h;u.uSize.value=old.size;
       u.uTexel.value=old.texel;u.uSteps.value=old.steps;
     }
   }
   if(pending.at<pending.total)return {progress:pending.at/pending.total,key:pending.key};
   const key=pending.key;
   // Atomic target swap: all terrain-shadow texels are ready.
   [terrain.sCore,scratchCore]=[scratchCore,terrain.sCore];
   [terrain.sRegion,scratchRegion]=[scratchRegion,terrain.sRegion];
   terrain.uniforms.uSCore.value=terrain.sCore.texture;
   terrain.uniforms.uSRegion.value=terrain.sRegion.texture;
   // Sun light, terrain and the two dynamic cascades now share one direction.
   pipe.sky.sunDir.copy(pending.dir);
   // Static geometry rebakes once per committed keyframe, never per frame.
   pipe.shadows._staticDirty=true;
   pending=null;commits++;
   return {committed:true,key};
 };
 const api={enabled:!tooBig,
   get status(){return{requests,commits,tilesRendered,aborts,shadowTileProgress:pending?pending.at/pending.total:1,key:pending?.key??null,tooBig}},
 };
 terrain._hfP510Shadows=api;
 return api;
}
