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
   // Unsung deliberately uses CUSTOM Three ShaderMaterials and NO standard
   // Ambient/Directional lights. PBR GLB materials render black/invisible.
   // Keep the licensed textures/UVs/vertex colors, but make animal surfaces
   // unlit, just like our known-visible KayKit player and NPCs.
   let visibleMeshes=0;
   gltf.scene.traverse(node=>{
    if(!node.isMesh)return;
    const toUnlit=material=>{
     const m=new THREE.MeshBasicMaterial({
      color:material?.color?.clone?.()??new THREE.Color(0xffffff),
      map:material?.map??null,vertexColors:!!material?.vertexColors,
      transparent:!!material?.transparent,opacity:material?.opacity??1,
      alphaTest:material?.alphaTest??0,side:THREE.DoubleSide,
      depthTest:true,depthWrite:true,skinning:true
     });
     m.name='HIGHFLY_P494_UNLIT_'+id;
     return m;
    };
    node.material=Array.isArray(node.material)?node.material.map(toUnlit):toUnlit(node.material);
    node.frustumCulled=false;visibleMeshes++;
   });
   if(!visibleMeshes)throw Error('Real licensed animal has no visible mesh '+id);
   result[id]=gltf;
   console.info('[HIGHFLY P494] UNLIT CC0 READY',id,meta.author,visibleMeshes,'meshes',gltf.animations.length,'clips');
  }catch(e){console.error('[HIGHFLY P491] Species disabled; licensed GLB failed:',id,e);}
 }));
 return result;
}
export function makeLicensedCreature(id,gltf){
 if(!gltf||!CLIPS[id])return null;
 const model=cloneSkeleton(gltf.scene);
 model.name='HIGHFLY_LICENSED_ANIMATED_'+id.toUpperCase();
 const box=new THREE.Box3().setFromObject(model);
 const h=box.getSize(new THREE.Vector3()).y;
 if(!Number.isFinite(h)||h<0.00001)throw Error(id+' invalid rig dimensions');
 const root=new THREE.Group();
 root.name='HIGHFLY_CC0_'+id.toUpperCase();
 const scaled=new THREE.Group();
 scaled.scale.setScalar(HEIGHT[id]/h);
 model.position.set(-(box.min.x+box.max.x)*0.5,-box.min.y,-(box.min.z+box.max.z)*0.5);
 scaled.add(model);root.add(scaled);
 const mixer=new THREE.AnimationMixer(model),actions={};
 for(const [label,clipName] of Object.entries(CLIPS[id])){
  const clip=gltf.animations.find(a=>a.name===clipName);
  if(!clip)continue;
  const a=mixer.clipAction(clip);
  if(['attack','hurt','death'].includes(label)){a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}
  actions[label]=a;
 }
 const avatar={id,root,mixer,actions,state:null,model,disposed:false};
 setCreatureAction(avatar,'idle');
 root.updateMatrixWorld(true);
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
 // A looted body disappears after pickup; an unlooted animal remains
 // in its actual death pose until the 60-second window expires.
 avatar.root.visible=near&&(enemy.alive||!!avatar.corpseLootPending||enemy.t<=2.8);
 avatar.root.position.copy(enemy.pos);
 avatar.root.rotation.y=enemy.yaw;
 avatar.mixer.update(Math.min(0.06,Math.max(0,Number(dt)||0)));
 // Unsung's Pipeline has scene.matrixWorldAutoUpdate=false.  Unlike a
 // standard Three.js scene, its renderer NEVER traverses new actors to
 // calculate world transforms. Explicitly sync the whole skinned hierarchy
 // AFTER moving, changing animation pose and before Pipeline.render().
 avatar.root.updateMatrixWorld(true);
}
export function disposeLicensedCreature(avatar){
 if(!avatar||avatar.disposed)return;
 avatar.disposed=true;
 avatar.mixer.stopAllAction();
 // Geometry, textures and original GLTF materials are SHARED by all clones.
 // NEVER dispose them on individual respawns; keep them cached for all 9 mobs.
 avatar.mixer.uncacheRoot(avatar.model);
 avatar.root.removeFromParent();
}
