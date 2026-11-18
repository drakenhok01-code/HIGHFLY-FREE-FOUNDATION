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
function stepClimb(p,dt,input,camYaw,nativeUpdate){
 const anchor=p._hfClimb;
 if(!anchor){dropClimb(p);return;}
 const held=input.held?.has('climb')||input.pressed?.has('climb');
 if(input.pressed.has('dash')){
  dropClimb(p);
  return nativeUpdate(dt,input,camYaw); // DASH keeps its real cooldown and air limit
 }
 if(input.pressed.has('jump')){
  dropClimb(p);
  const fx=Math.sin(anchor.yaw),fz=Math.cos(anchor.yaw);
  p.vel.set(-fx*3.5,5.8,-fz*3.5);
  p._hfJumpPrimed=false;p._hfDoubleUsed=true;
  p.emit('highflyWallJump');
  return;
 }
 if(!held||p.stamina<=0){dropClimb(p);return;}
 const x=Number(input.move?.x)||0,y=Number(input.move?.y)||0;
 const f={x:Math.sin(anchor.yaw),z:Math.cos(anchor.yaw)};
 const tangent={x:f.z,z:-f.x};
 const candidate=p.pos.clone();
 candidate.x+=tangent.x*x*MOTION.climbStrafeSpeed*dt;
 candidate.z+=tangent.z*x*MOTION.climbStrafeSpeed*dt;
 candidate.y+=y*MOTION.climbSpeed*dt;
 // Stable contact: probe at the proposed position BEFORE committing.
 // A missing side wall cannot pull the capsule into empty space.
 const fake={pos:candidate,yaw:anchor.yaw,world:p.world};
 const hit=probeHighflyWall(fake,anchor.yaw);
 if(hit?.ledge&&y>.15){startMantle(p,hit);p._hfClimb=null;return;}
 if(!hit){
  anchor.lost+=dt;
  if(anchor.lost>.18)dropClimb(p);
  return;
 }
 anchor.lost=0;
 // Avoid underground descent and positional jitter at the wall.
 const floor=p.world.groundHeight?.(candidate.x,candidate.z);
 if(Number.isFinite(floor)&&candidate.y<floor+.03&&y<0){
   dropClimb(p);p.grounded=true;p.pos.y=floor;return;
 }
 const resolved=candidate.clone();
 p.world.resolveCapsule(resolved,.36,1.82,0);
 if(resolved.distanceTo(candidate)<.20)p.pos.copy(resolved);
 else if(Math.abs(x)+Math.abs(y)<.06)p.pos.copy(p.pos);
 // No arbitrary 2.8-second cutoff: only energy, wall contact or user release.
 const moving=Math.hypot(x,y)>.12;
 p.stamina=Math.max(0,p.stamina-(moving?MOTION.climbCostPerSecond:MOTION.climbIdleCost)*dt);
 p.staminaWait=.65;
 p.stateTime+=dt;p.vel.set(0,0,0);
 p.viewY=p._viewY1=p.pos.y;p.grounded=false;p.speed=moving?1:0;
 p._hfClimbInput={x,y};
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
   const hit=probeHighflyWall(this);
   if(hit){
    if(hit.ledge)startMantle(this,hit);
    else{
     this.vel.set(0,0,0);this._hfClimb={yaw:this.yaw,lost:0};
     this.setState('hf_climb');this.grounded=false;
     this.emit('highflyClimbStart',{airborne:!this.grounded});
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
  const result=nativeUpdate(dt,nativeRollInput,camYaw);
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
