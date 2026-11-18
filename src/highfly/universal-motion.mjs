/**
 * HIGHFLY F0.9 — capability layer for ONE original Unsung Player.
 * The pinned Unsung controller remains the authoritative hitbox, velocity,
 * combo 1→2→3, water and damage source. These features are gated by state.
 * Only CC0 KayKit FREE visual clips are used; no paid SOURCE imports.
 */
import * as THREE from 'three';
import {TUNE} from '../game/player.js';
import {WEAPON_MODES} from './universal-gear.mjs';
export const MOTION={
  secondJumpSpeed:7.05,secondJumpCost:9,
  minAirBeforeSecond:.095,mantleTime:.42,
  climbSpeed:1.85,climbStrafeSpeed:1.55,climbCostPerSecond:6,climbIdleCost:1.5,
  combatWalk:3.25,combatRun:4.6,combatResponse:12,
  workTime:.74,
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const vec=(yaw)=>({x:Math.sin(yaw),z:Math.cos(yaw)});
const lerp=(a,b,t)=>a+(b-a)*t;
export const ACTIONS=Object.freeze({
 sit:{clip:'Sit_Floor_Down',idle:'Sit_Floor_Idle',duration:3.2,kind:'pose'},
 lie:{clip:'Lie_Down',idle:'Lie_Idle',duration:3.2,kind:'pose'},
 cheer:{clip:'Cheer',duration:1.9,kind:'gesture'},
 pickup:{clip:'PickUp',duration:.85,kind:'interaction'},
 use:{clip:'Use_Item',duration:.8,kind:'interaction'},
 chop:{clip:'1H_Melee_Attack_Chop',duration:.8,kind:'work'},
 mine:{clip:'1H_Melee_Attack_Chop',duration:.9,kind:'work'},
 fishing:{clip:'1H_Ranged_Shooting',duration:1.6,kind:'preview'},
});
const isMove=p=>p.state==='move';
function otherInput(input,ignored){
 const pressed=new Set(input.pressed);for(const item of ignored)pressed.delete(item);
 return {...input,pressed};
}
export function probeHighflyWall(p,yaw=p.yaw){
 const world=p.world;
 if(typeof world?.raycast!=='function'||typeof world?.floorBelow!=='function')return null;
 const direction=vec(yaw),dir=new THREE.Vector3(direction.x,0,direction.z);
 const origin=new THREE.Vector3(p.pos.x,p.pos.y+.85,p.pos.z);
 const hit=world.raycast(origin,dir,.85);
 if(!(hit>.04&&hit<.83))return null;
 const high=world.raycast(new THREE.Vector3(p.pos.x,p.pos.y+1.62,p.pos.z),dir,1);
 const fwd=hit+.72,tx=p.pos.x+direction.x*fwd,tz=p.pos.z+direction.z*fwd;
 const floor=world.floorBelow(tx,p.pos.y+2.2,tz,2.6),rise=floor-p.pos.y;
 const ledge=high>=.95&&rise>=.20&&rise<=1.22;
 return {distance:hit,headBlocked:high<.95,ledge,
   rise,tx,tz,targetY:floor,dir};
}
function startMantle(p,hit){
 p._hfMantle={elapsed:0,start:p.pos.clone(),target:new THREE.Vector3(hit.tx,hit.targetY+.03,hit.tz)};
 p.vel.set(0,0,0);p.setState('hf_mantle');p.grounded=false;p.emit('highflyMantleStart',{height:hit.rise});
}
function stepMantle(p,dt){
 const m=p._hfMantle;if(!m){p.setState('move');return;}
 m.elapsed+=dt;const t=clamp(m.elapsed/MOTION.mantleTime,0,1),ease=t*t*(3-2*t);
 // Lift before moving forward; never noclip blindly through the ledge.
 const candidate=m.start.clone().lerp(m.target,ease);
 candidate.y+=.25*Math.sin(Math.PI*t);
 p.pos.copy(candidate);
 p.world.resolveCapsule(p.pos,.36,1.82,Math.max(0,p.vel.y));
 p.viewY=p._viewY1=p.pos.y;p.speed=0;
 if(t>=1){p._hfMantle=null;p.setState('move');p.grounded=true;p.vel.set(0,0,0);p.emit('highflyMantleEnd');}
}
function dropClimb(p){
 p._hfClimb=null;p.setState('move');p.grounded=false;p.vel.set(0,0,0);
 p.emit('highflyClimbEnd');
}

/** Test multiple collision heights and nearby normals on uneven rock/trunks. */
function gripContact(p,yaw,reach=1.25){
 if(typeof p.world?.raycast!=='function')return null;
 let best=null;
 for(const delta of [0,.22,-.22,.44,-.44]){
  const ang=yaw+delta,dir={x:Math.sin(ang),z:Math.cos(ang)};
  for(const height of [.75,1.18,.4]){
   const d=p.world.raycast(new THREE.Vector3(p.pos.x,p.pos.y+height,p.pos.z),
       new THREE.Vector3(dir.x,0,dir.z),reach);
   if(d>.04&&d<reach-.03&&(!best||d<best.distance))best={distance:d,dir,ang};
  }
  if(best&&best.distance<.65)break;
 }
 return best;
}
function gripLedge(p,grip){
 const w=p.world,f=vec(grip.yaw),tx=p.pos.x+f.x*.83,tz=p.pos.z+f.z*.83;
 const floor=w.floorBelow(tx,p.pos.y+1.5,tz,2.2),rise=floor-p.pos.y;
 if(!Number.isFinite(floor)||rise<-.12||rise>1.22)return null;
 const head=w.raycast(new THREE.Vector3(p.pos.x,p.pos.y+1.65,p.pos.z),
 new THREE.Vector3(f.x,0,f.z),1.06);
 return head<.9?null:{tx,tz,targetY:floor,rise};
}
function stepClimb(p,dt,input,camYaw,nativeUpdate){
 const grip=p._hfClimb;if(!grip){dropClimb(p);return;}
 // One press latches. Press again, jump, or dash to leave.
 if(input.pressed.has('climb')){dropClimb(p);return;}
 if(input.pressed.has('dash')){dropClimb(p);return nativeUpdate(dt,input,camYaw);}
 if(input.pressed.has('jump')){
  dropClimb(p);const f=vec(grip.yaw);
  p.vel.set(-f.x*3.5,5.8,-f.z*3.5);
  p._hfJumpPrimed=false;p._hfDoubleUsed=true;p.emit('highflyWallJump');return;
 }
 if(p.stamina<=0){dropClimb(p);return;}
 const x=clamp(input.move?.x||0,-1,1),y=clamp(input.move?.y||0,-1,1);
 const f=vec(grip.yaw),side={x:f.z,z:-f.x};
 const before=p.pos.clone(),candidate=before.clone();
 candidate.x-=side.x*x*MOTION.climbStrafeSpeed*dt;
 candidate.z-=side.z*x*MOTION.climbStrafeSpeed*dt;
 candidate.y+=y*MOTION.climbSpeed*dt;
 const probe=gripContact({...p,pos:candidate},grip.yaw);
 const top=y>.16?gripLedge({...p,pos:candidate},grip):null;
 if(top&&(!probe||probe.distance>.72)){
   startMantle(p,top);p._hfClimb=null;p._hfClimbInput={x:0,y:0};return;
 }
 if(!probe){
   grip.lost+=dt;p._hfClimbInput={x:0,y:0};
   p.stateTime+=dt;p.vel.set(0,0,0);p.speed=0;
   if(grip.lost>.52)dropClimb(p);
   return;
 }
 grip.lost=0;
 // Keep the capsule near the surface; never teleport through stone.
 const correction=Math.hypot(x,y)>.08?clamp(probe.distance-.54,-.08,.07):0; // stationary grip never drifts
 candidate.x+=probe.dir.x*correction;candidate.z+=probe.dir.z*correction;
 const floor=p.world.groundHeight?.(candidate.x,candidate.z);
 if(y<-.1&&Number.isFinite(floor)&&candidate.y<floor+.02){
  dropClimb(p);p.pos.y=Math.max(p.pos.y,floor);p.grounded=true;return;
 }
 const resolved=candidate.clone();p.world.resolveCapsule(resolved,.36,1.82,0);
 if(resolved.distanceTo(candidate)<.35&&resolved.distanceTo(before)<.22)p.pos.copy(resolved);
 const dx=p.pos.x-before.x,dy=p.pos.y-before.y,dz=p.pos.z-before.z;
 const lateral=dx*side.x+dz*side.z;
 // Limb movement is measured from ACTUAL collision-accepted travel.
 p._hfClimbInput={
  x:Math.abs(lateral)<.001?0:clamp(-lateral/(dt*MOTION.climbStrafeSpeed),-1,1),
  y:Math.abs(dy)<.001?0:clamp(dy/(dt*MOTION.climbSpeed),-1,1)};
 const moved=Math.hypot(dx,dy,dz);
 p.stamina=Math.max(0,p.stamina-(moved>.002?MOTION.climbCostPerSecond:MOTION.climbIdleCost)*dt);
 p.staminaWait=.65;p.stateTime+=dt;p.vel.set(0,0,0);p.grounded=false;
 p.speed=moved>.002?moved/dt:0;p.viewY=p._viewY1=p.pos.y;
}

function closestTree(p){
 const caps=p.world?.caps;if(!caps?.length)return null;
 const f=vec(p.yaw);let best=-1,bd=9;
 for(let i=0;i<caps.length;i+=7){
  const x=(caps[i]+caps[i+3])/2-p.pos.x,z=(caps[i+2]+caps[i+5])/2-p.pos.z;
  const d2=x*x+z*z;
  if(d2<bd&&x*f.x+z*f.z>0){bd=d2;best=i/7;}
 }
 return best<0?null:{kind:'tree',index:best,distance:Math.sqrt(bd)};
}
export function workTarget(p,kind){
 if(kind==='chop')return closestTree(p);
 if(kind==='mine'&&typeof p.world?.raycast==='function'){
  const f=vec(p.yaw);
  const dist=p.world.raycast(new THREE.Vector3(p.pos.x,p.pos.y+.8,p.pos.z),new THREE.Vector3(f.x,0,f.z),1.8);
  // This only confirms a solid surface, NOT a verified mineral node.
  if(dist>.05&&dist<1.8)return {kind:'solid-surface-not-ore',distance:dist};
 }
 return null;
}
function startAction(p,name){
 const cfg=ACTIONS[name];if(!cfg)return;
 p._hfAction={name,time:0,done:false,target:cfg.kind==='work'?workTarget(p,name):null};
 p.setState('hf_action');p.vel.x=p.vel.z=0;p.speed=0;
 p.emit('highflyActionStart',{name,target:p._hfAction.target?.kind??'none'});
}

/** Let Unsung integrate exactly once while attack steering supplies velocity.
 * No duplicate capsule, hitbox or combo timing, even when attacking in motion.
 */
function attackLocomotion(p,original,dt,input,camYaw){
 const integrate=p._integrate;
 p._integrate=function(step){
  if(this.state==='attack'&&this.attack&&this.grounded){
   const x=input.move?.x||0,y=input.move?.y||0,len=Math.min(1,Math.hypot(x,y));
   this._hfAttackSteering=len>.15;
   if(len>.15){
    const fx=Math.sin(camYaw),fz=Math.cos(camYaw);
    const speed=(input.held.has('sprint')?MOTION.combatRun:MOTION.combatWalk)*len;
    const vx=(fx*y-fz*x)/len*speed,vz=(fz*y+fx*x)/len*speed;
    const mix=clamp(step*MOTION.combatResponse,0,1);
    this.vel.x+=(vx-this.vel.x)*mix;this.vel.z+=(vz-this.vel.z)*mix;
   }
  }
  const out=integrate.call(this,step);
  this._hfAttackTravelSpeed=this.state==='attack'?Math.hypot(this.vel.x,this.vel.z):0;
  return out;
 };
 try{return original(dt,input,camYaw);}finally{p._integrate=integrate;}
}
export function installHighflyUniversalMotion(p){
 if(p._hfUniversalInstalled)return p;
 p._hfUniversalInstalled=true;
 TUNE.rollCost=12; // lighter grounded roll; native Unsung roll physics unchanged
 p._hfRollVisual='forward';
 const nativeUpdate=p.update.bind(p);
 const nativeSpawn=p.spawn.bind(p);
 p._hfDoubleUsed=false;p._hfJumpPrimed=false;p._hfJumpFx=0;p._hfGearCycle=0;
 p.spawn=function(...args){
  nativeSpawn(...args);this._hfDoubleUsed=false;this._hfJumpPrimed=false;
  this._hfJumpFx=0;this._hfAction=null;this._hfMantle=null;this._hfClimb=null;this._hfGearCycle=0;this._hfRollVisual='forward';
 };
 p.update=function(dt,input,camYaw=0){
  const step=clamp(dt,0,.05);
  this._hfJumpFx=Math.max(0,(this._hfJumpFx||0)-step);
  const active=input&&input.pressed&&input.held;
  if(!active)return nativeUpdate(dt,input,camYaw);
  // Explicit full-body states own the player. Combat, ROLL and DASH cannot
  // play at the same time as mantle/climb/sit/work.
  if(this.state==='hf_mantle'){this.stateTime+=step;stepMantle(this,step);return;}
  if(this.state==='hf_climb'){stepClimb(this,step,input,camYaw,nativeUpdate);return;}
  if(this.state==='hf_action'){
   const action=this._hfAction;
   if(!action){this.setState('move');return;}
   const moveIntent=Math.hypot(input.move?.x??0,input.move?.y??0)>.22;
   if(moveIntent||input.pressed.has('jump')||input.pressed.has('attack')||
      input.pressed.has('dash')||input.pressed.has('dodge')){
    this._hfAction=null;this.setState('move');
    // Pass the canceling input back to original Unsung.
   }else{
    this.stateTime+=step;action.time+=step;this.speed=0;
    if(action.time>=ACTIONS[action.name].duration&&!ACTIONS[action.name].idle){
     this._hfAction=null;this.setState('move');this.emit('highflyActionEnd',{name:action.name});
    }
    // Sit/lie idle cancels on the joystick deadzone or other movement/attack action.
    return;
   }
  }
  if(input.pressed.has('equip')&&isMove(this)){
   this._hfGearCycle=(this._hfGearCycle+1)%WEAPON_MODES.length;
   this.emit('highflyEquipPreview',{variant:this._hfGearCycle});
  }
  if(isMove(this)&&input.pressed.has('climb')){
   const hit=probeHighflyWall(this)||gripContact(this,this.yaw);
   if(hit){
    if(hit.ledge)startMantle(this,hit);
    else{
     const wasAirborne=!this.grounded;
     this.vel.set(0,0,0);this._hfClimb={yaw:this.yaw,lost:0};this._hfClimbInput={x:0,y:0};
     this.setState('hf_climb');this.grounded=false;
     this.emit('highflyClimbStart',{airborne:wasAirborne});
    }
    return;
   }
  }
  if(isMove(this)&&this.grounded){
   for(const name of Object.keys(ACTIONS)){
    if(input.pressed.has(name)){startAction(this,name);return;}
   }
  }
  // Only grant second jump after the first genuine Unsung ground jump.
  // Never grant it from a cliff fall, during water, ROLL, DASH or attacks.
  const second=isMove(this)&&!this.grounded&&this._hfJumpPrimed&&
   !this._hfDoubleUsed&&this.airTime>=MOTION.minAirBeforeSecond&&
   input.pressed.has('jump')&&this.stamina>=MOTION.secondJumpCost;
  if(second){
   this.spend(MOTION.secondJumpCost);
   this.vel.y=Math.max(MOTION.secondJumpSpeed,this.vel.y);
   this._hfDoubleUsed=true;this._hfJumpPrimed=false;
   this._hfJumpFx=.55;this.fallStart=this.pos.y;
   this.emit('highflyDoubleJump');
   input=otherInput(input,['jump']);
  }
  const startEvents=this.events?.length??0;
  const rollAttempt=isMove(this)&&this.grounded&&input.pressed.has('dodge');
  const originalFacing=this.yaw;
  const aimInput=input.highflyAbilityAim;
  const aim=aimInput?.dodge;
  const tap=!!aimInput&&Object.prototype.hasOwnProperty.call(aimInput,'dodge')&&aim===null;
  const relYaw=this.yaw-camYaw;
  // Native Unsung movement basis: right-stick x is inverted in world space.
  // Choose the camera-relative wish that points along the HERO facing angle.
  const facingWish={x:-Math.sin(relYaw),y:Math.cos(relYaw)};
  // A circle tap ignores the left thumb; dragging keeps independent direction.
  const nativeRollInput=input.pressed.has('dodge')&&(aim||tap)?
   {...input,move:aim||facingWish}:input;
  const result=attackLocomotion(this,nativeUpdate,dt,nativeRollInput,camYaw);
  if(rollAttempt&&this.state==='roll'){
   const d=this.rollDir,front=Math.sin(originalFacing)*d.x+Math.cos(originalFacing)*d.z;
   const side=Math.cos(originalFacing)*d.x-Math.sin(originalFacing)*d.z;
   this._hfRollVisual=front<-.45?'backward':Math.abs(side)>.45?(side>0?'right':'left'):'forward';
   if(this._hfRollVisual!=='forward')this.yaw=originalFacing;
   this.emit('hfRollDirection',{direction:this._hfRollVisual});
  }
  if(this.events?.slice(startEvents).some(e=>e.type==='jump')){
   this._hfJumpPrimed=true;this._hfDoubleUsed=false;
  }
  if(this.grounded){
   this._hfJumpPrimed=false;this._hfDoubleUsed=false;
  }
  return result;
 };
 return p;
}
