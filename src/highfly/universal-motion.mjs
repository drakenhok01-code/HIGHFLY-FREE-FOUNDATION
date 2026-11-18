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
  climbSpeed:1.85,climbCostPerSecond:8,
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
function stepClimb(p,dt,input){
 const held=input.held?.has('climb')||input.pressed?.has('climb');
 const hit=probeHighflyWall(p);
 if(hit?.ledge){startMantle(p,hit);return;}
 if(!held||!hit||p.stateTime>2.8||p.stamina<=0){
  p.setState('move');p.vel.y=0;p.grounded=false;return;
 }
 p.stateTime+=dt;p.stamina=Math.max(0,p.stamina-MOTION.climbCostPerSecond*dt);
 p.staminaWait=.65;
 const speed=MOTION.climbSpeed*(input.move?.y<-.2?.35:1);
 p.pos.y+=speed*dt;
 p.vel.set(0,0,0);p.world.resolveCapsule(p.pos,.36,1.82,speed);
 p.viewY=p._viewY1=p.pos.y;p.grounded=false;p.speed=0;
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
  this._hfJumpFx=0;this._hfAction=null;this._hfMantle=null;this._hfGearCycle=0;this._hfRollVisual='forward';
 };
 p.update=function(dt,input,camYaw=0){
  const step=clamp(dt,0,.05);
  this._hfJumpFx=Math.max(0,(this._hfJumpFx||0)-step);
  const active=input&&input.pressed&&input.held;
  if(!active)return nativeUpdate(dt,input,camYaw);
  // Explicit full-body states own the player. Combat, ROLL and DASH cannot
  // play at the same time as mantle/climb/sit/work.
  if(this.state==='hf_mantle'){this.stateTime+=step;stepMantle(this,step);return;}
  if(this.state==='hf_climb'){stepClimb(this,step,input);return;}
  if(this.state==='hf_action'){
   const action=this._hfAction;
   if(!action){this.setState('move');return;}
   if(input.pressed.has('jump')||input.pressed.has('attack')||
      input.pressed.has('dash')||input.pressed.has('dodge')){
    this._hfAction=null;this.setState('move');
    // Pass the canceling input back to original Unsung.
   }else{
    this.stateTime+=step;action.time+=step;this.speed=0;
    if(action.time>=ACTIONS[action.name].duration&&!ACTIONS[action.name].idle){
     this._hfAction=null;this.setState('move');this.emit('highflyActionEnd',{name:action.name});
    }
    // Sit/lie remain in their idle clip until Jump, ATK, DASH or ROLL cancels.
    return;
   }
  }
  if(input.pressed.has('equip')&&isMove(this)){
   this._hfGearCycle=(this._hfGearCycle+1)%WEAPON_MODES.length;
   this.emit('highflyEquipPreview',{variant:this._hfGearCycle});
  }
  if(isMove(this)&&this.grounded&&input.pressed.has('climb')){
   const hit=probeHighflyWall(this);
   if(hit){
    if(hit.ledge)startMantle(this,hit);
    else{this.vel.set(0,0,0);this.setState('hf_climb');this.grounded=false;}
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
  const result=nativeUpdate(dt,input,camYaw);
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
