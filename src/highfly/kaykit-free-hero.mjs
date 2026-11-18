/** HIGHFLY F1 experimental KayKit FREE renderer: preserves ONE Unsung Player/capsule. 
 * KayKit Adventures Knight.glb CC0 1.0 by Kay Lousberg, official commit 672074b73ba...
 * No paid models, no SOURCE and no artificial jump/roll mechanics.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {stylizeUniversalKayKit} from './stylize-kaykit-free.mjs';
import {createUniversalMaterial} from './kaykit-material.mjs';

const CLIPS={
 idle:'Idle',walk:'Walking_A',run:'Running_A',sprint:'Running_B',
 jump:'Jump_Idle',land:'Jump_Land',swim:'Idle',
 roll:'Dodge_Forward',dash:'Dodge_Forward',attack1:'1H_Melee_Attack_Slice_Horizontal',
 attack2:'1H_Melee_Attack_Chop',attack3:'1H_Melee_Attack_Slice_Diagonal',
 heavy:'2H_Melee_Attack_Slice',hurt:'Block_Hit',dead:'Death_A',
 plunge:'Jump_Full_Long'
};
const HIDE=new Set(['1H_Sword_Offhand','2H_Sword','Badge_Shield','Rectangle_Shield','Round_Shield','Spike_Shield']); // Keep CC0 1H_Sword visible in Knight rig
export class KayKitFreeHero {
 static async load(pipe,url=import.meta.env.BASE_URL+'models/hf-kaykit-knight.glb'){
   const data=await new GLTFLoader().loadAsync(url);
   return new KayKitFreeHero(pipe,data);
 }
 constructor(pipe,data){
   this.pipe=pipe;this.profile=stylizeUniversalKayKit(data);this.root=data.scene;
   this.root.name='HIGHFLY_KAYKIT_FREE_KNIGHT';
   this.root.scale.setScalar(1.82/this.profile.naturalHeight);
   // The KayKit GLB is a skin, not the physics authority: one Unsung capsule.
   this.actor=new THREE.Group();this.actor.name='HIGHFLY_ONE_KAYKIT_ACTOR';
   this.rollPivot=new THREE.Group();this.rollPivot.name='UNSUNG_FULL_BODY_ROLL';
   this.offset=new THREE.Group();this.offset.position.y=-.91;this.rollPivot.position.y=.91;
   this.actor.add(this.rollPivot);this.rollPivot.add(this.offset);this.offset.add(this.root);
   const armored=new URLSearchParams(globalThis.location?.search??'').get('hflook')==='armored';
   const hidden=new Set(HIDE);
   if(!armored)for(const name of ['Knight_Helmet','Knight_HelmetVisor','Knight_Cape'])hidden.add(name);
   this.bodyParts=new Set();this.sword=null;
   this.flash={value:0};this.rim={value:0};
   this.root.frustumCulled=false;
   this.socket=null;this.visibleMeshes=0;this.swordMeshes=0;
   const norm=n=>(n??'').toLowerCase().replace(/[^a-z0-9]/g,'');
   let handFallback=null;
   this.root.traverse(o=>{
     const n=norm(o.name);
     // Three GLTFLoader sanitizes dotted names: handslot.r can become handslot_r.
     if(n==='handslotr'||n==='righthandslot')this.socket=o;
     if(!handFallback&&['handr','righthand','handright'].includes(n))handFallback=o;
     if(!o.isMesh)return;
     o.visible=!hidden.has(o.name);
     if(/^Knight_(Body|Head|ArmLeft|ArmRight|LegLeft|LegRight)$/i.test(o.name)){
       o.visible=true;this.bodyParts.add(o.name);
     }
     if(o.visible&&/^1H_Sword$/i.test(o.name))this.sword=o;
     if(o.visible)this.visibleMeshes++;
     if(o.visible&&/^1h.?sword$/i.test(o.name))this.swordMeshes++;
     o.frustumCulled=false;
     // Original Unsung lighting uses custom shaders, not Three's stock light objects.
     // Use the CC0 embedded texture unlit for a reliable Android visibility test.
     // Do not throw away glTF texture, vertex colors, UV and skinned PBR.
     const mk=m=>createUniversalMaterial(m,this.flash,this.rim);
     o.material=Array.isArray(o.material)?o.material.map(mk):mk(o.material);
   });
   this.socket??=handFallback??this.root;
   if(this.bodyParts.size!==6)throw Error('KayKit body incomplete: '+[...this.bodyParts].join(','));
   if(!this.sword)throw Error('KayKit 1H_Sword not found for actual tip/trail');
   if(this.socket===this.root)console.warn('[HIGHFLY] KayKit FREE right-hand socket not found; using root hit-effect position without blocking character rendering');
   console.log('[HIGHFLY] KayKit FREE visible meshes='+this.visibleMeshes+' swordMeshes='+this.swordMeshes+' tipSocket='+this.socket.name);
   if(!this.visibleMeshes)throw Error('KayKit FREE contains no visible character meshes');
   this.mixer=new THREE.AnimationMixer(this.root);
   const clips=new Map(data.animations.map(c=>[c.name,c]));
   for(const [key,name] of Object.entries(CLIPS))if(!clips.has(name))throw Error('Required FREE animation missing: '+key+' '+name);
   this.clips=clips;this.actions=new Map();this.current=null;this.key='';
   // Shared flash/rim uniforms already initialized before material creation.
   this.tip=new THREE.Vector3();this.tipVel=new THREE.Vector3();this.lastTip=new THREE.Vector3();
   this.landSignal=0;this.hitSignal=0;this.updated=false;
   // Unsung shaders do not emit Three lights; illuminate only the skinned GLTF.
   // The original Unsung render pipeline owns one scene and one GPU context.
   pipe.scene.add(this.actor);
   this.trailHistory=[];this.trailMax=18;
   const geo=new THREE.BufferGeometry();
   geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(this.trailMax*6),3));
   const indices=[];
   for(let i=0;i<this.trailMax-1;i++){const a=i*2;indices.push(a,a+1,a+2,a+2,a+1,a+3);}
   geo.setIndex(indices);geo.setDrawRange(0,0);
   this.trail=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({
     color:0xffd77e,transparent:true,side:THREE.DoubleSide,
     depthWrite:false,blending:THREE.AdditiveBlending,opacity:.8
   }));
   this.trail.frustumCulled=false;this.trail.visible=false;
   this.trail.name='HIGHFLY_ACTUAL_SWORD_TIP_TRAIL';
   pipe.scene.add(this.trail);
   this.bladeBase=new THREE.Vector3();
   this.play('idle');
   this.availableActions=[...this.clips.keys()];
   this.diagnostics={mode:'NATIVE_UNSUNG_GPU_SKINNING',rig:this.profile.rig,
    bodyParts:this.bodyParts.size,clips:this.availableActions.length,
    boneTracks:this.profile.tracks,headRatio:this.profile.headRatio,
    renderContexts:1,cpuSkin:false,overlay:false};
   globalThis.__highflyActorReport=this.diagnostics;
   console.log('[HIGHFLY CLEAN HERO]',JSON.stringify(this.diagnostics));
 }
 play(key,duration=0){
   if(key===this.key)return;
   const raw=this.clips.get(CLIPS[key]||(key.startsWith('raw:')?key.slice(4):CLIPS.idle));
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
   const once=/^(roll|dash|attack1|attack2|attack3|heavy|land|hurt|dead|plunge)$/.test(key);
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
   else if(p.state==='hf_dash'){key='dash';duration=.24;}
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
   // One actor transform driven exclusively by Unsung Player; no root-motion.
   this.actor.position.set(p.pos.x,p.viewY??p.pos.y,p.pos.z);
   this.actor.rotation.y=p.yaw;
   const k=p.state==='roll'?Math.min(1,Math.max(0,(p.stateTime??0)/.62)):0;
   const eased=k*k*(3-2*k);
   // Unsung's 360-degree full-body ROLL, around the torso rather than the feet.
   this.rollPivot.rotation.x=p.state==='roll'?Math.PI*2*eased:0;
   this.rollPivot.position.y=.91-(p.state==='roll'?.24*Math.sin(Math.PI*k):0);
   this.actor.updateMatrixWorld(true);
   // Skinning uses the original GPU bone shader; no CPU geometry copies.
   const {base,next}=this._swordEndpoints();
   this.bladeBase.copy(base);
   if(this.updated&&dt>0)this.tipVel.copy(next).sub(this.lastTip).divideScalar(dt);
   else this.tipVel.set(0,0,0);
   this.tip.copy(next);this.lastTip.copy(next);this.updated=true;
   this._drawBladeTrail(Math.max(0,dt),p);
 }
 _swordEndpoints(){
   // Longest actual local weapon-geometry axis, rather than the hand socket.
   const g=this.sword.geometry;
   if(!g.boundingBox)g.computeBoundingBox();
   const bb=g.boundingBox,span=bb.getSize(new THREE.Vector3());
   const axis=span.y>=span.x&&span.y>=span.z?'y':span.x>=span.z?'x':'z';
   const a=bb.getCenter(new THREE.Vector3()),b=a.clone();
   a[axis]=bb.min[axis];b[axis]=bb.max[axis];
   this.sword.updateWorldMatrix(true,false);
   this.sword.localToWorld(a);this.sword.localToWorld(b);
   const hand=this.socket.getWorldPosition(new THREE.Vector3());
   return a.distanceToSquared(hand)<b.distanceToSquared(hand)?{base:a,next:b}:{base:b,next:a};
 }
 _drawBladeTrail(dt,p){
   for(const h of this.trailHistory)h.age+=dt;
   this.trailHistory=this.trailHistory.filter(h=>h.age<.18);
   const attack=p.state==='attack'&&Array.isArray(p.attack?.hit)&&
     p.stateTime>=p.attack.hit[0]-.035&&p.stateTime<=p.attack.hit[1]+.04;
   if(attack&&this.sword.visible){
     this.trailHistory.push({a:this.bladeBase.clone(),b:this.tip.clone(),age:0});
     if(this.trailHistory.length>this.trailMax)this.trailHistory.shift();
   }
   const n=this.trailHistory.length;
   if(n<2){this.trail.visible=false;this.trail.geometry.setDrawRange(0,0);return;}
   const pos=this.trail.geometry.attributes.position;
   for(let i=0;i<n;i++){
     const h=this.trailHistory[i];
     const start=h.a.clone().lerp(h.b,.15+.65*h.age/.18);
     pos.setXYZ(i*2,start.x,start.y,start.z);
     pos.setXYZ(i*2+1,h.b.x,h.b.y,h.b.z);
   }
   pos.needsUpdate=true;this.trail.geometry.setDrawRange(0,(n-1)*6);
   this.trail.visible=true;this.trail.material.opacity=attack?.8:.46;
 }
 // All original 76 CC0 clips can be selected for future abilities.
 playRawClip(name){if(!this.clips.has(name))return false;this.play('raw:'+name);return true;}
 onHit(){this.hitSignal++}
 onLand(){this.landSignal++}
}
