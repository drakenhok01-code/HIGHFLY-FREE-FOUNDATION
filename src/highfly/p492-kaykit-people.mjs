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
 const actors=[],native=game.people.list,prior=game.update,pipe=game.people.pipe;
 if(!pipe?.scene||!Array.isArray(pipe.onBeforeScene))return null;
 let disposed=false,issue=null;
 const readyPromise=new GLTFLoader().loadAsync(import.meta.env.BASE_URL+'models/hf-kaykit-knight.glb')
  .then(gltf=>{
   if(disposed)return 0;
   const profile=stylizeUniversalKayKit(gltf);
   for(const [i,n] of native.entries()){
    try{
     const model=cloneSkeleton(gltf.scene);
     model.name='HIGHFLY_KAYKIT_ORIGINAL_'+n.def.id;
     model.traverse(m=>{
      if(!m.isMesh)return;
      m.frustumCulled=false;
      if(/sword|shield|helmet|visor|cape|dagger|bow|staff/i.test(m.name)){m.visible=false;return;}
      const base=Array.isArray(m.material)?m.material[0]:m.material;
      m.material=new THREE.MeshBasicMaterial({
       map:base?.map??null,color:m.name.includes('Head')?0xffffff:TINTS[i%TINTS.length],
       side:THREE.DoubleSide,transparent:!!base?.transparent,alphaTest:base?.alphaTest??0
      });
     });
     const scale=1.82/profile.naturalHeight;
     const holder=new THREE.Group();
     holder.name='HIGHFLY_PEOPLE_VISUAL_'+n.def.id;
     holder.scale.setScalar(scale);
     // Preserve bind-pose origin as in the visible KayKit player.
     holder.add(model);pipe.scene.add(holder);holder.visible=false;
     // n.root is updated manually by native People, but the newly attached
     // skinned child needs an initial world-matrix pass to be visible at once.
     holder.position.set(n.x,n.y,n.z);holder.rotation.y=n.yaw;holder.updateMatrixWorld(true);
     const body=[];model.traverse(m=>{if(m.isSkinnedMesh&&m.visible)body.push(m)});if(body.length<5){holder.removeFromParent();throw Error('Missing styled body meshes '+n.def.id)}
     const visibility={lastDraw:-Infinity};for(const m of body){const old=m.onAfterRender;m.onAfterRender=function(...args){old?.apply(this,args);if(args[1]===pipe.scene)visibility.lastDraw=performance.now()}};
     const mixer=new THREE.AnimationMixer(model);
     const idle=gltf.animations.find(c=>c.name==='Idle');
     const walk=gltf.animations.find(c=>c.name==='Walking_A');
     const actions={idle:idle?mixer.clipAction(idle):null,walk:walk?mixer.clipAction(walk):null};
     actions.idle?.play();
     actors.push({n,holder,model,mixer,actions,state:'idle',visibility});
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
   const talking=game.people.talk?.n===a.n;
   const near=!!p&&(talking||(!game.cine&&distance(a.n,p)<190&&a.n.shown!==false)||distance(a.n,p)<12);
   a.holder.visible=near;
   const drawn=performance.now()-a.visibility.lastDraw<350&&a.holder.parent===pipe.scene;
   for(const mesh of a.n.meshes)mesh.visible=near&&!drawn;
   if(!near)continue;
   const stance=a.n.moving&&a.n.k>=.9?'walk':'idle';
   if(stance!==a.state){
    a.actions[a.state]?.fadeOut(.18);
    a.actions[stance]?.reset().fadeIn(.18).play();
    a.state=stance;
   }
   if(distance(a.n,p)<75)a.mixer.update(Math.min(.05,Math.max(0,dt||0)));
   // Native People updates n.root BEFORE our GLTF AnimationMixer. Rebuild
   // all child matrices after the skinned pose has changed.
   a.holder.position.set(a.n.x,a.n.y,a.n.z);a.holder.rotation.y=a.n.yaw;a.holder.updateMatrixWorld(true);
  }
  return out;
 };
 const before=()=>{for(const a of actors){if(!a.holder.visible)continue;if(a.holder.parent!==pipe.scene)pipe.scene.add(a.holder);a.holder.updateMatrixWorld(true);const missed=performance.now()-a.visibility.lastDraw>=350;for(const m of a.n.meshes)m.visible=missed;if(missed){a.n.root.visible=true;a.n.root.updateMatrixWorld(true)}}};pipe.onBeforeScene.push(before);
 const api={readyPromise,get count(){return actors.length;},get nativeCount(){return native.length;},
  get error(){return issue;},dispose(){
   disposed=true;game.update=prior;const i=pipe.onBeforeScene.indexOf(before);if(i>=0)pipe.onBeforeScene.splice(i,1);
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
