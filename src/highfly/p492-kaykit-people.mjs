/** HIGHFLY P4.9.2: reskin original Unsung people without altering any quest.
 * Keeps native people IDs, waypoints, walking, dialogue, collision and rewards.
 * KayKit FREE CC0 source only; no paid SOURCE assets in this public Pages demo.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {stylizeUniversalKayKit} from './stylize-kaykit-free.mjs';

const TINTS=[0xe0c6f8,0xf5d7af,0xc5e8d9,0xc8d7f9,0xf2bfcc,0xe0c885];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function installHighflyKayKitPeople(game){
 if(!game?.people?.list?.length)return null;
 if(game.__highflyKayKitPeople)return game.__highflyKayKitPeople;
 const actors=[],native=game.people.list,prior=game.update;
 let disposed=false,issue=null;
 const readyPromise=new GLTFLoader().loadAsync(import.meta.env.BASE_URL+'models/hf-kaykit-knight.glb')
  .then(gltf=>{
   if(disposed)return 0;
   const rawBounds=new THREE.Box3().setFromObject(gltf.scene);
   const naturalHeight=rawBounds.getSize(new THREE.Vector3()).y;
   if(!Number.isFinite(naturalHeight)||naturalHeight<1)throw Error('KayKit FREE actual height invalid');
   // Clone AUTHENTIC unmodified rig first. Old clone-after-retarget path can
   // break the skinned mesh visibility and must not hide the working native NPC.
   for(const [i,n] of native.entries()){
    try{
     const model=cloneSkeleton(gltf.scene);
     model.name='HIGHFLY_KAYKIT_ORIGINAL_'+n.def.id;
     model.traverse(m=>{
      if(!m.isMesh)return;
      m.frustumCulled=false;
      m.visible=/^Knight_(Body|Head|ArmLeft|ArmRight|LegLeft|LegRight)$/i.test(m.name);
      if(!m.visible)return;
      const base=Array.isArray(m.material)?m.material[0]:m.material;
      m.material=new THREE.MeshBasicMaterial({
       map:base?.map??null,color:m.name.includes('Head')?0xffffff:TINTS[i%TINTS.length],
       side:THREE.DoubleSide,transparent:!!base?.transparent,alphaTest:base?.alphaTest??0
      });
     });
     const bounds=new THREE.Box3().setFromObject(model);
     const scale=1.82/naturalHeight;
     const holder=new THREE.Group();
     holder.name='HIGHFLY_PEOPLE_VISUAL_'+n.def.id;
     holder.scale.setScalar(scale);
     model.position.set(-(bounds.min.x+bounds.max.x)*.5,-bounds.min.y,
       -(bounds.min.z+bounds.max.z)*.5);
     const parts=[];model.traverse(m=>{if(m.isMesh&&m.visible)parts.push(m);});
     if(parts.length!==6)throw Error('KayKit NPC visible parts != 6: '+parts.length);
     holder.add(model);n.root.add(holder);
     const mixer=new THREE.AnimationMixer(model);
     const idle=gltf.animations.find(c=>c.name==='Idle');
     const walk=gltf.animations.find(c=>c.name==='Walking_A');
     const actions={idle:idle?mixer.clipAction(idle):null,walk:walk?mixer.clipAction(walk):null};
     actions.idle?.play();
     actors.push({n,holder,model,mixer,actions,state:'idle'});
    }catch(error){console.warn('[HIGHFLY NPC] Native visual retained for '+n.def.id,error);}
   }
   console.info('[HIGHFLY P492] KayKit original NPC skins',actors.length,'/',native.length);
   return actors.length;
  })
  .catch(error=>{issue=String(error);console.error('[HIGHFLY P492] Original NPC visual fallback',error);return 0;});
 game.update=function(dt){
  const out=prior.call(this,dt);
  if(disposed)return out;
  const p=game.player?.pos;
  for(const a of actors){
   // Native visibility is reasserted during people's update, so suppress it
   // AFTER that update; never mutate the original render geometry or its IDs.
   for(const mesh of a.n.meshes)mesh.visible=false;
   const near=!!p&&distance(a.n,p)<190&&!game.cine;
   a.holder.visible=near&&a.n.shown!==false;
   if(!near)continue;
   const stance=a.n.moving&&a.n.k>=.9?'walk':'idle';
   if(stance!==a.state){
    a.actions[a.state]?.fadeOut(.18);
    a.actions[stance]?.reset().fadeIn(.18).play();
    a.state=stance;
   }
   if(distance(a.n,p)<75)a.mixer.update(Math.min(.05,Math.max(0,dt||0)));
  }
  return out;
 };
 const api={readyPromise,get count(){return actors.length;},get nativeCount(){return native.length;},
  get error(){return issue;},dispose(){
   disposed=true;game.update=prior;
   for(const a of actors){
    a.mixer.stopAllAction();a.mixer.uncacheRoot(a.model);
    a.holder.removeFromParent();
    a.model.traverse(m=>{if(m.isMesh&&m.material?.dispose)m.material.dispose();});
    for(const m of a.n.meshes)m.visible=!!a.n.shown;
   }
   actors.length=0;
  }};
 game.__highflyKayKitPeople=api;globalThis.__highflyKayKitPeople=api;
 return api;
}
