/** HIGHFLY F1 experimental KayKit FREE renderer: preserves ONE Unsung Player/capsule. 
 * KayKit Adventures Knight.glb CC0 1.0 by Kay Lousberg, official commit 672074b73ba...
 * No paid models, no SOURCE and no artificial jump/roll mechanics.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {stylizeUniversalKayKit} from './stylize-kaykit-free.mjs';
import {createUniversalMaterial} from './kaykit-material.mjs';
import {ACTIONS} from './universal-motion.mjs';
import {applyUALPose} from './ual-retarget.mjs';
import {WEAPON_MODES,EQUIPMENT_NODES,WEAPON_ANIMATIONS,attackAnimation,applyEquipment} from './universal-gear.mjs';

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
   const extra={};
   for(const [id,name] of [['spear','hf-emberfall-spear.glb'],['staff','hf-emberfall-staff.glb']]){
     try{extra[id]=(await new GLTFLoader().loadAsync(import.meta.env.BASE_URL+'models/'+name)).scene;}
     catch(error){console.warn('[HIGHFLY F010] optional original Emberfall model unavailable',id,error);}
   }
   let ualData=null;
   try{
    const result=await fetch(import.meta.env.BASE_URL+'animation/hf-ual-retarget.json');
    if(result.ok)ualData=await result.json();
    else console.warn('[HIGHFLY F011] Quaternius CC0 pose data unavailable');
   }catch(error){console.warn('[HIGHFLY F011] Quaternius retarget fallback',error);}
   return new KayKitFreeHero(pipe,data,extra,ualData);
 }
 constructor(pipe,data,extra={},ualData=null){
   this.pipe=pipe;
   const styleParams=new URLSearchParams(globalThis.location?.search??'');
   // A/B visual comparison: ?hfstyle=original keeps the authentic FREE KayKit
   // chibi rig and all native animation data; the standard game keeps HIGHFLY V6.6.
   this.originalLook=styleParams.get('hfstyle')==='original';
   this.profile=this.originalLook?{
     rig:'FREE_KNIGHT_ORIGINAL_41',bones:41,meshCount:6,clips:data.animations.length,
     naturalHeight:2.4374973315,
     headRatio:.45,tracks:data.animations.reduce((n,a)=>n+a.tracks.length,0)
   }:stylizeUniversalKayKit(data);
   this.root=data.scene;
   this.root.name='HIGHFLY_KAYKIT_FREE_KNIGHT';
   this.root.scale.setScalar(1.82/this.profile.naturalHeight);
   // The KayKit GLB is a skin, not the physics authority: one Unsung capsule.
   this.actor=new THREE.Group();this.actor.name='HIGHFLY_ONE_KAYKIT_ACTOR';
   this.rollPivot=new THREE.Group();this.rollPivot.name='UNSUNG_FULL_BODY_ROLL';
   this.offset=new THREE.Group();this.offset.position.y=-.91;this.rollPivot.position.y=.91;
   this.actor.add(this.rollPivot);this.rollPivot.add(this.offset);this.offset.add(this.root);
   const armored=styleParams.get('hflook')==='armored'||this.originalLook;
   const hidden=new Set(HIDE);
   if(!armored)for(const name of ['Knight_Helmet','Knight_HelmetVisor','Knight_Cape'])hidden.add(name);
   this.bodyParts=new Set();this.sword=null;this.gearNodes=new Map();this.rigBones=new Map();
   this.flash={value:0};this.rim={value:0};
   this.root.frustumCulled=false;
   this.socket=null;this.visibleMeshes=0;this.swordMeshes=0;
   const norm=n=>(n??'').toLowerCase().replace(/[^a-z0-9]/g,'');
   let handFallback=null;
   this.root.traverse(o=>{
     const n=norm(o.name);
     if(o.isBone)this.rigBones.set(n,o);
     // Three GLTFLoader sanitizes dotted names: handslot.r can become handslot_r.
     if(n==='handslotr'||n==='righthandslot')this.socket=o;
     if(!handFallback&&['handr','righthand','handright'].includes(n))handFallback=o;
     if(!o.isMesh)return;
     if(EQUIPMENT_NODES.includes(o.name))this.gearNodes.set(o.name,o);
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
   this.extraWeapons=new Map();
   for(const [id,model] of Object.entries(extra)){
     if(!model)continue;
     model.name='HIGHFLY_EMBERFALL_'+id.toUpperCase();
     model.traverse(node=>{
       if(!node.isMesh)return;
       node.frustumCulled=false;
       const basic=m=>new THREE.MeshBasicMaterial({color:m?.color?.clone?.()??new THREE.Color(0xb9c7d8),
        map:m?.map??null,side:THREE.DoubleSide,depthTest:true,depthWrite:true});
       node.material=Array.isArray(node.material)?node.material.map(basic):basic(node.material);
     });
     this.socket.add(model);model.visible=false;this.extraWeapons.set(id,model);
   }
   applyEquipment(this,0);
   if(this.bodyParts.size!==6)throw Error('KayKit body incomplete: '+[...this.bodyParts].join(','));
   if(!this.sword)throw Error('KayKit 1H_Sword not found for actual tip/trail');
   if(this.socket===this.root)console.warn('[HIGHFLY] KayKit FREE right-hand socket not found; using root hit-effect position without blocking character rendering');
   console.log('[HIGHFLY] KayKit FREE visible meshes='+this.visibleMeshes+' swordMeshes='+this.swordMeshes+' tipSocket='+this.socket.name);
   if(!this.visibleMeshes)throw Error('KayKit FREE contains no visible character meshes');
   this.mixer=new THREE.AnimationMixer(this.root);
   const clips=new Map(data.animations.map(c=>[c.name,c]));
   for(const [key,name] of Object.entries(CLIPS))if(!clips.has(name))throw Error('Required FREE animation missing: '+key+' '+name);
   this.clips=clips;this.actions=new Map();this.current=null;this.key='';
   this.ualData=ualData;this.ualApplied=0;this._ualParentRest=new Map();
   this.root.updateMatrixWorld(true);
   for(const boneName of ['spine','chest','upperarm.l','lowerarm.l','hand.l',
      'upperarm.r','lowerarm.r','hand.r','upperleg.l','lowerleg.l','foot.l',
      'upperleg.r','lowerleg.r','foot.r']){
    const bone=this._bone(boneName);
    if(bone?.parent)this._ualParentRest.set(boneName,bone.parent.getWorldQuaternion(new THREE.Quaternion()));
   }
   this._playToken='';this.lowerActions=new Map();this.lowerCurrent=null;this.lowerKey='';this._swimBlend=0;
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
   // A second real blade gets its OWN actual world-space geometry trail.
   this.offTrail=this.trail.clone();
   this.offTrail.geometry=this.trail.geometry.clone();
   this.offTrail.material=this.trail.material.clone();
   this.offTrail.name='HIGHFLY_ACTUAL_LEFT_SWORD_TIP_TRAIL';
   this.offTrail.visible=false;
   this.offTrailHistory=[];
   pipe.scene.add(this.offTrail);
   this.bladeBase=new THREE.Vector3();
   this.play('idle');
   this.availableActions=[...this.clips.keys()];
   this.equipmentModes=WEAPON_MODES.map(x=>x.id);this._lastEquipCycle=0;this._hfPhase=0;
   this.diagnostics={mode:'NATIVE_UNSUNG_GPU_SKINNING',look:this.originalLook?'original-kaykit':'anime-v66',rig:this.profile.rig,
    bodyParts:this.bodyParts.size,clips:this.availableActions.length,
    boneTracks:this.profile.tracks,headRatio:this.profile.headRatio,
    renderContexts:1,cpuSkin:false,overlay:false,quaterniusClips:Object.keys(this.ualData?.clips??{})};
   globalThis.__highflyActorReport=this.diagnostics;
   console.log('[HIGHFLY CLEAN HERO]',JSON.stringify(this.diagnostics));
 }
 _upperTrack(track){
   const name=track.name.slice(0,track.name.lastIndexOf('.')).split('/').pop().replace(/[^a-z]/ig,'').toLowerCase();
   return /^(spine|chest|neck|head|shoulder|upperarm|lowerarm|hand|wrist|elbow)/.test(name);
 }
 _blendLower(p,dt,active){
   // Emberfall-style continuously weighted locomotion: no clip restarts
   // when a running attack turns into strafe/backward movement.
   const speed=active&&p._hfAttackSteering?(p._hfAttackTravelSpeed??0):0;
   const moving=THREE.MathUtils.clamp((speed-.14)/.60,0,1);
   const facingX=Math.sin(p.yaw),facingZ=Math.cos(p.yaw);
   const vx=p.vel?.x??0,vz=p.vel?.z??0;
   const denom=Math.hypot(vx,vz)||1;
   const forward=(vx*facingX+vz*facingZ)/denom;
   const side=(vx*facingZ-vz*facingX)/denom;
   const dirs=[
      Math.max(0,forward)**2,Math.max(0,-forward)**2,
      Math.max(0,-side)**2,Math.max(0,side)**2
   ];
   const total=dirs.reduce((acc,x)=>acc+x,0)||1;
   const run=THREE.MathUtils.clamp((speed-2.15)/2.1,0,1);
   const targets={
     Idle:1-moving,
     Walking_A:moving*dirs[0]/total*(1-run),
     Running_A:moving*dirs[0]/total*run,
     Walking_Backwards:moving*dirs[1]/total,
     Running_Strafe_Left:moving*dirs[2]/total,
     Running_Strafe_Right:moving*dirs[3]/total
   };
   this._lowerWeights??=new Map();
   for(const [name,target] of Object.entries(targets)){
     const source=this.clips.get(name);
     if(!source)continue;
     let action=this.lowerActions.get(name);
     if(!action){
       const clip=source.clone();
       clip.tracks=clip.tracks.filter(t=>!this._upperTrack(t)&&!/root\.position$/i.test(t.name));
       if(!clip.tracks.length)continue;
       action=this.mixer.clipAction(clip);
       action.setLoop(THREE.LoopRepeat,Infinity).setEffectiveWeight(0).play();
       this.lowerActions.set(name,action);
     }
     const prior=this._lowerWeights.get(name)||0;
     const weight=active?prior+(target-prior)*(1-Math.exp(-14*Math.max(dt,0))):0;
     this._lowerWeights.set(name,weight);
     const cadence=name==='Idle'?1:THREE.MathUtils.clamp(speed/
       (name.includes('Running')?4.7:2.4),.62,1.52);
     action.setEffectiveTimeScale(cadence);
     action.setEffectiveWeight(weight);
   }
 }

 play(key,duration=0,layered=false){
   const token=key+'|'+(layered?'upper':'full')+(key==='roll'?'|'+(this._rollVisualClip??'Dodge_Forward'):'');
   if(token===this._playToken)return;
   const clipName=key==='roll'?(this._rollVisualClip??'Dodge_Forward'):(CLIPS[key]||(key.startsWith('raw:')?key.slice(4):CLIPS.idle));
   const raw=this.clips.get(clipName);
   if(!raw){console.warn('[HIGHFLY] Unknown FREE clip '+clipName);return;}
   const clip=raw.clone();
   // Physics is exclusively Unsung's kinematic capsule: strip animated root translations
   // so cinematic/dodge clips cannot teleport the collision body or visual origin.
   clip.tracks=clip.tracks.filter(t=>!/root\.position$/i.test(t.name)&&(!layered||this._upperTrack(t)));
   if(!clip.tracks.length){console.warn('[HIGHFLY F010] missing animation lane',clipName);return;}
   let action=this.actions.get(token);
   if(!action){
     action=this.mixer.clipAction(clip);
     this.actions.set(token,action);
   }
   action.reset();
   const once=/^(roll|dash|attack1|attack2|attack3|heavy|land|hurt|dead|plunge)$/.test(key)||
    (key.startsWith('raw:')&&!/_(Idle|Pose|Shooting)$/.test(key));
   action.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);
   // Finished attacks cannot hold and overlay a last-frame sword pose.
   action.clampWhenFinished=key==='dead'||key.includes('Pose');
   // Keep Unsung attack hit windows, but avoid 3x sped-up KayKit slashes.
   action.timeScale=duration>0?Math.min(2.1,Math.max(.75,clip.duration/duration)):1;
   if(this.current&&this.current!==action)this.current.fadeOut(.12);
   action.fadeIn(.12).play();
   this.current=action;this.key=key;this._playToken=token;
 }
 update(dt,p){
   const speed=p.speed??0;
   let key='idle',duration=0;
   if(p.state==='dead')key='dead';
   else if(p.state==='hurt')key='hurt';
   else if(p.state==='roll'){
     key='roll';duration=.62;
     this._rollVisualClip={
       forward:'Dodge_Forward',backward:'Dodge_Backward',
       left:'Dodge_Left',right:'Dodge_Right'
     }[p._hfRollVisual]??'Dodge_Forward';
     if(!this.clips.has(this._rollVisualClip))this._rollVisualClip='Dodge_Forward';
   }
   else if(p.state==='hf_dash'){key='dash';duration=.24;}
   else if(p.state==='hf_mantle'){key='raw:Jump_Full_Short';duration=.42;}
   else if(p.state==='hf_climb'){key='idle';} // anchored hands procedurally, not an endless Interact flap
   else if(p.state==='hf_action'&&p._hfAction){
      const cfg=ACTIONS[p._hfAction.name];
      if(cfg){
       const seated=p._hfAction.time>.7&&cfg.idle;
       key='raw:'+(seated?cfg.idle:cfg.clip);
       duration=cfg.duration;
      }
   }
   else if(p.state==='plunge')key='plunge';
   else if(p.state==='attack'){
      const profile=this.weaponMode?.style??'onehand';
      const arr=WEAPON_ANIMATIONS[profile]??WEAPON_ANIMATIONS.onehand;
      const step=p.comboStep===3?2:Math.max(0,Math.min(2,p.comboStep));
      const anim=attackAnimation(profile,step,p._hfFlowDirection);
      key='raw:'+(this.clips.has(anim)?anim:WEAPON_ANIMATIONS.onehand[step]);
      duration=p.attack?.t??.46;
   }else if(p.state==='swim')key='swim';
   else if(!p.grounded&&p._hfJumpFx>0)key='raw:Jump_Full_Short';
   else if(!p.grounded)key='jump';
   else if(speed>5.8)key='sprint';
   else if(speed>2.6)key='run';
   else if(speed>.2)key='walk';
   if((p._hfGearCycle??0)!==this._lastEquipCycle){
    const index=p._hfGearCycle??0;this.equip(index);this._lastEquipCycle=index;
   }
   // Upper-body attack lane MUST remain stable until the attack ends.
   const layered=p.state==='attack';
   this.play(key,duration,layered);
   this._blendLower(p,dt,layered);
   if(layered&&this.current&&p.attack){
     // Emberfall-style fixed normalized action phase, exactly one sword
     // swing per native Unsung damage window (no arbitrary 2.1x speed cap).
     const clip=this.current.getClip(),length=Math.max(.001,clip.duration);
     this.current.paused=true;
     this.current.time=Math.min(length-.00001,
       Math.max(0,(p.stateTime??0)/Math.max(.05,p.attack.t))*length);
   }
   this.mixer.update(dt);
   this._poseProcedural(Math.max(0,dt),p);
   if(p.state==='swim'&&this.ualData){
     // ONLY KayKit bones are animated; UAL source mannequin is never created.
     applyUALPose(this,speed>.35?'Swim_Fwd_Loop':'Swim_Idle_Loop',this._hfPhase/3.5,.85);
   }else if(p.state==='hf_mantle'&&this.ualData){
     applyUALPose(this,'ClimbUp_1m',Math.min(.66,p.stateTime*.95),.88);
   }
   // One actor transform driven exclusively by Unsung Player; no root-motion.
   this.actor.position.set(p.pos.x,p.viewY??p.pos.y,p.pos.z);
   this.actor.rotation.y=p.yaw;
   const k=p.state==='roll'?Math.min(1,Math.max(0,(p.stateTime??0)/.62)):0;
   const eased=k*k*(3-2*k);
   // Unsung's 360-degree full-body ROLL, around the torso rather than the feet.
   // Ground-hugging Unsung ROLL: tuck into a short cylinder. The old
   // 0.91 m high pivot rotated a standing avatar like an aerial flic-flac.
   const tuck=p.state==='roll'?Math.pow(Math.max(0,Math.sin(Math.PI*k)),.72):0;
   const direction=p._hfRollVisual??'forward';
   this._swimBlend=THREE.MathUtils.clamp(this._swimBlend+(p.state==='swim'?1:-1)*dt*4,0,1);
   this.rollPivot.rotation.x=p.state==='roll'?
     (direction==='backward'?-1:direction==='forward'?1:0)*Math.PI*2*eased:
     // Shoulder and head no longer inherit the 66-degree unstable body flip.
     this._swimBlend*THREE.MathUtils.clamp(
       p._hfDive?1.04-(p._hfCameraPitch??0)*.35:1.07,.55,1.40);
   this.rollPivot.rotation.z=p.state==='roll'?
     (direction==='left'?1:direction==='right'?-1:0)*Math.PI*2*eased-.08*tuck:0;
   this.offset.scale.y=1-.43*tuck;
   this.rollPivot.position.y=.91-.39*tuck+this._swimBlend*.08;
   // No head correction quaternion: KayKit's stylized mirrored rig turned
   // previous compensators into 180-degree flips. UAL1 controls the strokes.
   this.actor.updateMatrixWorld(true);
   // Skinning uses the original GPU bone shader; no CPU geometry copies.
   const rightBlade=this.sword??this.extraWeapons?.get(this.weaponMode?.external);
   const {base,next}=this._swordEndpoints(rightBlade,this.socket);
   const off=this.offSword?.visible?
    this._swordEndpoints(this.offSword,this._bone('hand.l')??this.offSword.parent):null;
   this.offBlade=off;
   this.bladeBase.copy(base);
   if(this.updated&&dt>0)this.tipVel.copy(next).sub(this.lastTip).divideScalar(dt);
   else this.tipVel.set(0,0,0);
   this.tip.copy(this.weaponMode?.style==='dual'&&p.comboStep===1&&off?off.next:next);
   this.lastTip.copy(next);this.updated=true;
   this._drawBladeTrail(Math.max(0,dt),p);
 }

 equip(index){
  const mode=applyEquipment(this,index);
  this.diagnostics&&(this.diagnostics.equipped=mode.id);
  return mode;
 }
 _bone(key){return this.rigBones.get(key.replace(/[^a-z0-9]/gi,'').toLowerCase());}
 _addPose(name,axis,angle){
  if(!angle)return;
  const bone=this._bone(name);if(!bone)return;
  const basis=axis==='x'?new THREE.Vector3(1,0,0):axis==='z'?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0);
  bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(basis,angle));
 }
 _poseProcedural(dt,p){
  // Small procedural steering cue makes direction readable when four gestures
  // must share a 3-clip KayKit weapon catalog. No new unlicensed VFX/models.
  if(p.state==='attack'&&p._hfFlowDirection&&p.attack){
   const phase=THREE.MathUtils.clamp((p.stateTime??0)/Math.max(.1,p.attack.t),0,1);
   const blend=Math.sin(Math.PI*phase);
   const dir=p._hfFlowDirection;
   if(dir==='left'||dir==='right'){
    this._addPose('chest','y',(dir==='left'?-1:1)*.12*blend);
    this._addPose('upperarm.r','z',(dir==='left'?.14:-.14)*blend);
   }else if(dir==='up'){
    this._addPose('upperarm.r','x',-.18*blend);
    this._addPose('lowerarm.r','x',-.09*blend);
   }else if(dir==='down'){
    this._addPose('upperarm.r','x',.16*blend);
    this._addPose('lowerarm.r','x',.08*blend);
   }
  }
  this._hfPhase+=dt*(p.state==='swim'?Math.max(2.2,3.5+(p.speed??0)*1.1):1.0);
  if(p.state==='roll'){
   const k=Math.min(1,Math.max(0,(p.stateTime??0)/.62));
   const t=Math.pow(Math.sin(Math.PI*k),.72);
   this._addPose('upperleg.l','x',-.75*t);
   this._addPose('upperleg.r','x',-.75*t);
   this._addPose('lowerleg.l','x',1.16*t);
   this._addPose('lowerleg.r','x',1.16*t);
   this._addPose('upperarm.l','x',.62*t);
   this._addPose('upperarm.r','x',.62*t);
   this._addPose('head','x',-.12*t);
  }else if(p.state==='swim'&&!this.ualData){
   // Original Unsung _swim controls buoyancy, direction, speed and ripples.
   // The 76-clip Knight has no swim clip, so apply a small alternating
   // stroke to the SAME 41-bone skinned character. No duplicate skeleton.
   // Original HIGHFLY surface crawl, not a protected ClaudeCraft animation.
    const phase=this._hfPhase,amount=.3+Math.min(1,(p.speed??0)/3)*.7;
    const left=Math.sin(phase),right=Math.sin(phase+Math.PI);
    this._addPose('upperarm.l','x',(-1.1+.65*left)*amount);
    this._addPose('upperarm.r','x',(-1.1+.65*right)*amount);
    this._addPose('lowerarm.l','x',(-.3+.4*Math.max(0,left))*amount);
    this._addPose('lowerarm.r','x',(-.3+.4*Math.max(0,right))*amount);
    this._addPose('upperleg.l','x',.3*Math.sin(phase*1.7)*amount);
    this._addPose('upperleg.r','x',-.3*Math.sin(phase*1.7)*amount);
    this._addPose('lowerleg.l','x',(.24+.3*Math.max(0,left))*amount);
    this._addPose('lowerleg.r','x',(.24+.3*Math.max(0,right))*amount);
    // Keep the head fixed relative to upper torso; no Power Ranger neck twist.
   }else if(p.state==='hf_climb'||(p.state==='hf_mantle'&&!this.ualData)){
   const move=p._hfClimbInput??{x:0,y:p.state==='hf_mantle'?1:0};
   const strength=Math.min(1,Math.hypot(move.x,move.y));
   const phase=this._hfPhase*3.7;
   // 0 speed = fixed gripping posture, no false cycling near blocked rocks.
   this._addPose('upperarm.l','x',-.86+strength*.32*Math.sin(phase));
   this._addPose('upperarm.r','x',-.86-strength*.32*Math.sin(phase));
   this._addPose('lowerarm.l','x',-.15);
   this._addPose('lowerarm.r','x',-.15);
   this._addPose('upperleg.l','x',strength*.28*Math.sin(phase));
   this._addPose('upperleg.r','x',-strength*.28*Math.sin(phase));
  }
 }
 _swordEndpoints(item=this.sword,grip=this.socket){
   if(!item){
     const hand=(grip??this.socket)?.getWorldPosition(new THREE.Vector3())??new THREE.Vector3();
     return {base:hand.clone(),next:hand};
   }
   let weapon=item;
   if(!weapon.geometry){
     const meshes=[];weapon.traverse(o=>{if(o.isMesh&&o.geometry)meshes.push(o);});
     if(meshes.length){
       weapon=meshes.sort((a,b)=>{
         a.geometry.computeBoundingBox();b.geometry.computeBoundingBox();
         return b.geometry.boundingBox.getSize(new THREE.Vector3()).length()-
           a.geometry.boundingBox.getSize(new THREE.Vector3()).length();
       })[0];
     }
   }
   if(!weapon.geometry){
     const h=item.getWorldPosition(new THREE.Vector3());return {base:h.clone(),next:h};
   }
   const g=weapon.geometry;
   if(!g.boundingBox)g.computeBoundingBox();
   const bb=g.boundingBox,span=bb.getSize(new THREE.Vector3());
   const axis=span.y>=span.x&&span.y>=span.z?'y':span.x>=span.z?'x':'z';
   const a=bb.getCenter(new THREE.Vector3()),b=a.clone();
   a[axis]=bb.min[axis];b[axis]=bb.max[axis];
   weapon.updateWorldMatrix(true,false);weapon.localToWorld(a);weapon.localToWorld(b);
   const hand=(grip??weapon.parent??this.socket).getWorldPosition(new THREE.Vector3());
   return a.distanceToSquared(hand)<b.distanceToSquared(hand)?{base:a,next:b}:{base:b,next:a};
 }
 _renderWeaponTrail(dt,p,item,trail,history,ends,enabled){
   for(const h of history)h.age+=dt;
   for(let i=history.length-1;i>=0;i--)if(history[i].age>=.18)history.splice(i,1);
   const attacking=p.state==='attack'&&Array.isArray(p.attack?.hit)&&
    p.stateTime>=p.attack.hit[0]-.035&&p.stateTime<=p.attack.hit[1]+.04;
   const slash=attacking&&enabled&&item?.visible;
   if(slash&&ends){
     history.push({a:ends.base.clone(),b:ends.next.clone(),age:0});
     if(history.length>this.trailMax)history.shift();
   }
   if(!item?.visible||history.length<2){trail.visible=false;trail.geometry.setDrawRange(0,0);return;}
   const attr=trail.geometry.attributes.position;
   for(let i=0;i<history.length;i++){
     const h=history[i],start=h.a.clone().lerp(h.b,.15+.65*h.age/.18);
     attr.setXYZ(i*2,start.x,start.y,start.z);
     attr.setXYZ(i*2+1,h.b.x,h.b.y,h.b.z);
   }
   attr.needsUpdate=true;
   trail.geometry.setDrawRange(0,(history.length-1)*6);
   trail.visible=true;trail.material.opacity=slash?.8:.46;
   trail.material.color.setHex(p._hfFlowSecret?0x70dfff:0xffd77e);
 }
 _drawBladeTrail(dt,p){
   const dual=this.weaponMode?.style==='dual';
   // Dual 1=>left, 0=>right, 2=>both; no fake duplicate of the same tip.
   const dir=p._hfFlowDirection;
   const rightActive=!dual||(dir==='right'||dir==='down'||!dir&&p.comboStep!==1);
   const leftActive=dual&&(dir==='left'||dir==='up'||!dir&&(p.comboStep===1||p.comboStep===2));
   const right=this.sword??this.extraWeapons?.get(this.weaponMode?.external);
   this._renderWeaponTrail(dt,p,right,this.trail,this.trailHistory,
     {base:this.bladeBase,next:this.lastTip},rightActive);
   this._renderWeaponTrail(dt,p,this.offSword,this.offTrail,this.offTrailHistory,
     this.offBlade,leftActive);
 }
 // All original 76 CC0 clips can be selected for future abilities.
 playRawClip(name){if(!this.clips.has(name))return false;this.play('raw:'+name);return true;}
 onHit(){this.hitSignal++}
 onLand(){this.landSignal++}
}
