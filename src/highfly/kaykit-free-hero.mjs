/** HIGHFLY F1 experimental KayKit FREE renderer: preserves ONE Unsung Player/capsule. 
 * KayKit Adventures Knight.glb CC0 1.0 by Kay Lousberg, official commit 672074b73ba...
 * No paid models, no SOURCE and no artificial jump/roll mechanics.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const CLIPS={
 idle:'Idle',walk:'Walking_A',run:'Running_A',sprint:'Running_B',
 jump:'Jump_Idle',land:'Jump_Land',swim:'Idle',
 roll:'Dodge_Forward',attack1:'1H_Melee_Attack_Slice_Horizontal',
 attack2:'1H_Melee_Attack_Chop',attack3:'1H_Melee_Attack_Slice_Diagonal',
 heavy:'2H_Melee_Attack_Slice',hurt:'Block_Hit',dead:'Death_A',
 plunge:'Jump_Full_Long'
};
const HIDE=new Set(['1H_Sword','1H_Sword_Offhand','2H_Sword','Badge_Shield','Rectangle_Shield','Round_Shield','Spike_Shield']);
export class KayKitFreeHero {
 static async load(pipe,url=import.meta.env.BASE_URL+'models/hf-kaykit-knight.glb'){
   const data=await new GLTFLoader().loadAsync(url);
   return new KayKitFreeHero(pipe,data);
 }
 constructor(pipe,data){
   this.pipe=pipe;this.root=data.scene;
   this.root.name='HIGHFLY_KAYKIT_FREE_KNIGHT';
   this.root.scale.setScalar(1.82/2.4374973315);
   this.root.frustumCulled=false;
   this.socket=null;this.visibleMeshes=0;
   this.root.traverse(o=>{
     if(o.name==='handslot.r')this.socket=o;
     if(!o.isMesh)return;
     o.visible=!HIDE.has(o.name);
     if(o.visible)this.visibleMeshes++;
     o.frustumCulled=false;
     // Original Unsung lighting uses custom shaders, not Three's stock light objects.
     // Use the CC0 embedded texture unlit for a reliable Android visibility test.
     const basic=m=>new THREE.MeshBasicMaterial({
       map:m.map??null,color:0xffffff,transparent:m.transparent??false,
       alphaTest:m.alphaTest??0,side:THREE.DoubleSide
     });
     o.material=Array.isArray(o.material)?o.material.map(basic):basic(o.material);
   });
   if(!this.socket)throw Error('KayKit FREE missing hands lot right socket');
   if(!this.visibleMeshes)throw Error('KayKit FREE contains no visible character meshes');
   this.mixer=new THREE.AnimationMixer(this.root);
   const clips=new Map(data.animations.map(c=>[c.name,c]));
   for(const [key,name] of Object.entries(CLIPS))if(!clips.has(name))throw Error('Required FREE animation missing: '+key+' '+name);
   this.clips=clips;this.actions=new Map();this.current=null;this.key='';
   this.tip=new THREE.Vector3();this.tipVel=new THREE.Vector3();this.lastTip=new THREE.Vector3();
   this.landSignal=0;this.hitSignal=0;this.updated=false;
   pipe.scene.add(this.root);
   this.play('idle');
 }
 play(key,duration=0){
   if(key===this.key)return;
   const raw=this.clips.get(CLIPS[key]||CLIPS.idle);
   const clip=raw.clone();
   // Physics is exclusively Unsung's kinematic capsule: strip animated root translations
   // so cinematic/dodge clips cannot teleport the collision body or visual origin.
   clip.tracks=clip.tracks.filter(t=>!/root\.position$/i.test(t.name));
   let action=this.actions.get(key);
   if(!action){
     action=this.mixer.clipAction(clip);
     this.actions.set(key,action);
   }
   action.reset();
   const once=/^(roll|attack1|attack2|attack3|heavy|land|hurt|dead|plunge)$/.test(key);
   action.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);
   action.clampWhenFinished=once;
   action.timeScale=duration>0?Math.min(3,Math.max(.3,clip.duration/duration)):1;
   if(this.current&&this.current!==action)this.current.fadeOut(.12);
   action.fadeIn(.12).play();
   this.current=action;this.key=key;
 }
 update(dt,p){
   const speed=p.speed??0;
   let key='idle',duration=0;
   if(p.state==='dead')key='dead';
   else if(p.state==='hurt')key='hurt';
   else if(p.state==='roll'){key='roll';duration=.62;}
   else if(p.state==='plunge')key='plunge';
   else if(p.state==='attack'){
      key=p.comboStep===3?'heavy':p.comboStep===1?'attack2':p.comboStep===2?'attack3':'attack1';
      duration=p.attack?.t??.46;
   }else if(p.state==='swim')key='swim'; // FREE swim clip absent: no false animation claim.
   else if(!p.grounded)key='jump';
   else if(speed>5.8)key='sprint';
   else if(speed>2.6)key='run';
   else if(speed>.2)key='walk';
   this.play(key,duration);
   this.mixer.update(dt);
   this.root.position.set(p.pos.x,p.viewY??p.pos.y,p.pos.z);
   this.root.rotation.y=p.yaw;
   this.root.updateWorldMatrix(true,true);
   const next=this.socket.getWorldPosition(new THREE.Vector3());
   if(this.updated&&dt>0)this.tipVel.copy(next).sub(this.lastTip).divideScalar(dt);
   else this.tipVel.set(0,0,0);
   this.tip.copy(next);this.lastTip.copy(next);this.updated=true;
 }
 onHit(){this.hitSignal++}
 onLand(){this.landSignal++}
}
