/**
 * HIGHFLY P4.9.1 — genuine licensed skeletal animals (not geometry stand-ins).
 *
 * Wolf: Quaternius animated creature, CC0, pinned WoC v0.45.8 archive.
 * Crab: Quaternius CrabEnemy, CC0, pinned WoC v0.45.8 archive.
 * Boar: Gobkit Free Animal Pack B, CC0, pinned source-conserving mirror.
 * All three have genuine animation clips; no restricted WoC sounds or art.
 * The native Unsung Enemies engine remains authoritative for AI / hitboxes.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';

const HEIGHT=Object.freeze({wolf:1.48,boar:1.10,crab:0.85});
const _skinPoint=new THREE.Vector3();
/** WebGL driver guard: Quaternius's offset-armature skinned shaders can
 * upload valid skeletons yet rasterize ZERO pixels. We keep the real source
 * bones and animation clips, bake the animated vertices into a normal Mesh.
 * This is actual animation, NOT a static proxy or primitive stand-in.
 * Batch at 20Hz near player; 6Hz beyond 50m for Android GPU performance. */
function bakeActualSkinnedVertices(avatar,force=false){
 if(!avatar?.cpuSkins?.length)return;
 const near=avatar._near??true;
 const interval=force?0:(near?.045:.16);
 if(!force&&(avatar._skinElapsed??0)<interval)return;
 avatar._skinElapsed=0;
 avatar.model.updateMatrixWorld(true);
 for(const part of avatar.cpuSkins){
  const src=part.source,geo=part.visual.geometry,attr=geo.attributes.position;
  src.skeleton?.update();
  for(let i=0;i<attr.count;i++){
   src.getVertexPosition(i,_skinPoint);
   attr.setXYZ(i,_skinPoint.x,_skinPoint.y,_skinPoint.z);
  }
  attr.needsUpdate=true;
 }
}

const CLIPS=Object.freeze({
 wolf:{idle:'Idle',walk:'Walk',run:'Gallop',attack:'Attack',hurt:'Idle_HitReact_Left',death:'Death'},
 boar:{idle:'idle',walk:'walk',run:'walk',attack:'attack',death:'dead'},
 crab:{idle:'Idle',walk:'Walk',run:'Walk',attack:'Bite_Front',hurt:'HitRecieve',death:'Death'}
});
export const LICENSED_CREATURES=Object.freeze({
 wolf:Object.freeze({author:'Quaternius',license:'CC0-1.0',path:'models/hf-p491-wolf.glb',clipCount:12}),
 boar:Object.freeze({author:'Gobkit',license:'CC0-1.0',path:'models/hf-p491-boar.glb',clipCount:4}),
 crab:Object.freeze({author:'Quaternius',license:'CC0-1.0',path:'models/hf-p491-crab.glb',clipCount:10})
});
export async function loadLicensedCreatureTemplates(base){
 const result=Object.create(null);
 await MeshoptDecoder.ready;
 const loader=new GLTFLoader();
 loader.setMeshoptDecoder(MeshoptDecoder);
 await Promise.all(Object.entries(LICENSED_CREATURES).map(async([id,meta])=>{
  try{
   const gltf=await loader.loadAsync(base+meta.path);
   const available=new Set(gltf.animations.map(a=>a.name));
   for(const name of ['idle','walk','attack','death']){
    if(!available.has(CLIPS[id][name]))throw Error(id+' missing animation '+CLIPS[id][name]);
   }
   if(!gltf.scene.getObjectByProperty('isSkinnedMesh',true)){
    let skins=0;gltf.scene.traverse(x=>{if(x.isSkinnedMesh)skins++});
    if(!skins)throw Error(id+' model lacks a real skeletal mesh');
   }
   result[id]=gltf;
   console.info('[HIGHFLY P491] READY',id,meta.author,'CC0',gltf.animations.map(a=>a.name));
  }catch(e){console.error('[HIGHFLY P491] Species disabled; licensed GLB failed:',id,e);}
 }));
 return result;
}
export function makeLicensedCreature(id,gltf){
 if(!gltf||!CLIPS[id])return null;
 const model=cloneSkeleton(gltf.scene);
 model.name='HIGHFLY_LICENSED_ANIMATED_'+id.toUpperCase();
 // Unsung has a custom lighting pipeline and no general Three.js lights.
 // Convert skinned PBR meshes to UNLIT texture-preserving materials, as we
 // already do for the visible KayKit hero. Preserve bone skinning / UVs.
 let visibleMeshes=0;
 model.traverse(mesh=>{
  if(!mesh.isMesh)return;
  mesh.visible=true;mesh.frustumCulled=false;visibleMeshes++;
  const toUnlit=base=>new THREE.MeshBasicMaterial({
   map:base?.map??null,
   color:base?.color?.clone?.()??new THREE.Color(0xffffff),
   side:THREE.DoubleSide,
   transparent:!!base?.transparent,
   opacity:base?.opacity??1,
   alphaTest:base?.alphaTest??0,
   depthWrite:true
  });
  mesh.material=Array.isArray(mesh.material)?mesh.material.map(toUnlit):toUnlit(mesh.material);
 });
 if(visibleMeshes<1)throw Error('HIGHFLY '+id+' rig has no visible mesh');
 const box=new THREE.Box3().setFromObject(model);
 const h=box.getSize(new THREE.Vector3()).y;
 if(!Number.isFinite(h)||h<0.00001)throw Error(id+' invalid rig dimensions');
 const root=new THREE.Group();
 root.name='HIGHFLY_CC0_'+id.toUpperCase();
 const scaled=new THREE.Group();
 // The Quaternius GLB's skeleton is authored hundreds of units away from its
 // scene origin. Moving the skinned SCENE root after GLTFLoader has bound it
 // can invalidate GPU skinning (CPU boxes still look centered but 0 pixels).
 // Normalize through the OUTER carrier, leaving source rig/bind pose intact.
 const unit=HEIGHT[id]/h;
 scaled.scale.setScalar(unit);
 scaled.position.set(-(box.min.x+box.max.x)*0.5*unit,
   -box.min.y*unit,-(box.min.z+box.max.z)*0.5*unit);
 scaled.add(model);root.add(scaled);
 root.updateMatrixWorld(true);
 // The skinned source is still present as the real 51-bone animation owner.
 // Only its GPU draw is replaced with a CPU-updated non-skinned visible mesh.
 const cpuSkins=[];
 const originalSkins=[];model.traverse(m=>{if(m.isSkinnedMesh&&m.visible)originalSkins.push(m);});
 for(const src of originalSkins){
  const geom=src.geometry.clone();
  geom.attributes.position.setUsage(THREE.DynamicDrawUsage);
  const visual=new THREE.Mesh(geom,src.material);
  visual.name='HIGHFLY_REAL_ANIMATED_MESH_'+src.name;
  visual.position.copy(src.position);
  visual.quaternion.copy(src.quaternion);
  visual.scale.copy(src.scale);
  visual.frustumCulled=false;
  src.parent.add(visual);
  src.visible=false;
  cpuSkins.push({source:src,visual});
 }
 const mixer=new THREE.AnimationMixer(model),actions={};
 for(const [label,clipName] of Object.entries(CLIPS[id])){
  const clip=gltf.animations.find(a=>a.name===clipName);
  if(!clip)continue;
  const a=mixer.clipAction(clip);
  if(['attack','hurt','death'].includes(label)){a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}
  actions[label]=a;
 }
 const avatar={id,root,mixer,actions,state:null,model,disposed:false,visibleMeshes,corpseAvailable:false,
  cpuSkins,_skinElapsed:0,_near:true};
 setCreatureAction(avatar,'idle');
 avatar.mixer.update(0);
 bakeActualSkinnedVertices(avatar,true);
 return avatar;
}
function setCreatureAction(avatar,label){
 const next=avatar.actions[label]??avatar.actions.walk??avatar.actions.idle;
 if(!next||avatar.state===label)return;
 const previous=avatar.actions[avatar.state];
 if(previous&&previous!==next)previous.fadeOut(0.13);
 next.reset().fadeIn(0.13).play();
 avatar.state=label;
}
export function animateLicensedCreature(avatar,enemy,dt,near=true){
 if(!avatar||avatar.disposed)return;
 const moving=enemy.state==='chase'||enemy.state==='return';
 let action='idle';
 if(!enemy.alive||enemy.state==='dead')action='death';
 else if(enemy.state==='windup'||enemy.state==='strike')action='attack';
 else if(enemy.state==='stagger'&&avatar.actions.hurt)action='hurt';
 else if(moving)action=enemy.vel?.lengthSq?.()>8&&avatar.actions.run?'run':'walk';
 setCreatureAction(avatar,action);
 avatar.root.visible=near&&(enemy.alive||avatar.corpseAvailable||enemy.t<=2.8);
 avatar.root.position.copy(enemy.pos);
 avatar.root.rotation.y=enemy.yaw;
 const delta=Math.min(.06,Math.max(0,Number(dt)||0));
 avatar.mixer.update(delta);
 avatar._near=!!near;
 avatar._skinElapsed+=delta;
 bakeActualSkinnedVertices(avatar);
}
export function disposeLicensedCreature(avatar){
 if(!avatar||avatar.disposed)return;
 avatar.disposed=true;
 avatar.mixer.stopAllAction();
 // Geometry, textures and original GLTF materials are SHARED by all clones.
 // NEVER dispose them on individual respawns; keep them cached for all 9 mobs.
 avatar.mixer.uncacheRoot(avatar.model);
 avatar.model.traverse(mesh=>{if(mesh.isMesh){for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material])mat?.dispose?.();}});
 avatar.root.removeFromParent();
}
