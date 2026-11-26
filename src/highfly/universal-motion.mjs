/**
 * HIGHFLY F0.9 — capability layer for ONE original Unsung Player.
 * The pinned Unsung controller remains the authoritative hitbox, velocity,
 * combo 1→2→3, water and damage source. These features are gated by state.
 * Only CC0 KayKit FREE visual clips are used; no paid SOURCE imports.
 */
import * as THREE from 'three';
import {TUNE} from '../game/player.js';
import {PHOENIX,phoenixVelocity,descentCandidate,AIR_MODES,airMode} from './p564-phoenix-motion.mjs';
import {WEAPON_MODES} from './universal-gear.mjs';
import {recordFlowStrike, directionFromAim} from './flow-combat.mjs';
import {oxygenMax,oxygenRate} from './oxygen-progression.mjs';
import {allowTerrainTraverse,wallRunEligible,WALL_RUN,terrainWallContact,allowCliffCapsule,walkableBuiltFloor} from './wall-physics.mjs';
import {professionState,findProfessionTarget,prepareProfession,commitProfession,advanceCrops,PROFESSION_RULES} from './professions.mjs';
export const MOTION={
  secondJumpSpeed:7.58,secondJumpCost:9,secondJumpBuffer:.17,
  minAirBeforeSecond:.095,mantleTime:.42,
  climbSpeed:2.15,climbDownSpeed:3.1,climbStrafeSpeed:1.7,climbCostPerSecond:3.2,climbIdleCost:.7,
  combatWalk:3.25,combatRun:4.6,combatResponse:12,
  workTime:.74,
};
export const OXYGEN_TUNE=Object.freeze({normal:100/32,sprint:4.65,regenerate:17});
export const MAX_ATTACK_WALK_SLOPE=1.0; // 45deg. No wall-walking via attack impulse.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const vec=(yaw)=>({x:Math.sin(yaw),z:Math.cos(yaw)});
const lerp=(a,b,t)=>a+(b-a)*t;
export const ACTIONS=Object.freeze({
 sit:{clip:'Sit_Floor_Down',idle:'Sit_Floor_Idle',duration:3.2,kind:'pose'},
 lie:{clip:'Lie_Down',idle:'Lie_Idle',duration:3.2,kind:'pose'},
 cheer:{clip:'Cheer',duration:1.9,kind:'gesture'},
 pickup:{clip:'PickUp',duration:.85,kind:'interaction'},
 use:{clip:'Use_Item',duration:.8,kind:'interaction'},
 collectWood:{clip:'PickUp',duration:.85,kind:'work'},
 collectStone:{clip:'1H_Melee_Attack_Chop',duration:.9,kind:'work'},
 chop:{clip:'1H_Melee_Attack_Chop',duration:.8,kind:'work'},
 mine:{clip:'1H_Melee_Attack_Chop',duration:.9,kind:'work'},
 fishing:{clip:'Use_Item',duration:1.6,kind:'work'},
 plant:{clip:'PickUp',duration:.85,kind:'work'},
 water:{clip:'Use_Item',duration:.8,kind:'work'},
 harvest:{clip:'PickUp',duration:.9,kind:'work'},
 smelt:{clip:'Use_Item',duration:1.5,kind:'work'},
 forge:{clip:'1H_Melee_Attack_Chop',duration:1.7,kind:'work'},
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
 if(!(hit>.04&&hit<.83)){
   const cliff=terrainWallContact(world,p.pos,direction,.85,.75);
   if(!cliff)return null;
   const d=cliff.distance+.55,tx=p.pos.x+direction.x*d,tz=p.pos.z+direction.z*d;
   return {distance:cliff.distance,headBlocked:true,ledge:false,rise:0,tx,tz,
     targetY:p.pos.y+.6,dir,heightfield:true};
 }
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
 p._hfClimb=null;p.setState('move');p.grounded=false;p.vel.set(0,0,0);p.fallStart=p.pos.y;
 p.emit('highflyClimbEnd');
}

/** Test multiple collision heights and nearby normals on uneven rock/trunks. */
function gripContact(p,yaw,reach=1.25){
 if(typeof p.world?.raycast!=='function')return null;
 let best=null;
 for(const delta of [0,.22,-.22,.44,-.44,.7,-.7]){
  const ang=yaw+delta,dir={x:Math.sin(ang),z:Math.cos(ang)};
  for(const height of [.75,1.18,.4]){
   const d=p.world.raycast(new THREE.Vector3(p.pos.x,p.pos.y+height,p.pos.z),
       new THREE.Vector3(dir.x,0,dir.z),reach);
   if(d>.04&&d<reach-.03&&(!best||d<best.distance))best={distance:d,dir,ang};
  }
  if(best&&best.distance<.65)break;
 }
 const v=terrainWallContact(p.world,p.pos,{x:Math.sin(yaw),z:Math.cos(yaw)},reach,.75);
 if(v&&(!best||v.distance<best.distance))
  best={distance:v.distance,kind:'heightfield',dir:{x:Math.sin(yaw),z:Math.cos(yaw)},ang:yaw};
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
 const verticalSpeed=y<0?MOTION.climbDownSpeed:MOTION.climbSpeed;
 candidate.y+=y*verticalSpeed*dt;
 let probe=gripContact({...p,pos:candidate},grip.yaw);
 // When the wall flares outward at a lower elevation, step out along its normal
 // only if the next contact is real; do not pass through heightfield.
 if(!probe&&Math.abs(y)>.1){for(const shift of [.10,-.10,.20,-.20]){const trial=candidate.clone();trial.x+=f.x*shift;trial.z+=f.z*shift;const floor=p.world.groundHeight(trial.x,trial.z);if(Number.isFinite(floor)&&floor>trial.y+.03)continue;const hit=gripContact({...p,pos:trial},grip.yaw);if(hit){candidate.copy(trial);probe=hit;break}}}
 const floorAtCandidate=p.world.groundHeight?.(candidate.x,candidate.z);
 if(y<-.1&&Number.isFinite(floorAtCandidate)&&candidate.y<=floorAtCandidate+.045&&before.y-floorAtCandidate<.32){
  dropClimb(p);p.pos.set(candidate.x,floorAtCandidate,candidate.z);p.grounded=true;p.viewY=p._viewY1=p.pos.y;p.fallStart=p.pos.y;return;
 }
 const top=y>.16?gripLedge({...p,pos:candidate},grip):null;
 if(top&&(!probe||probe.distance>.72)){
   startMantle(p,top);p._hfClimb=null;p._hfClimbInput={x:0,y:0};return;
 }
 if(!probe){
   grip.lost+=dt;p._hfClimbInput={x:0,y:0};
   p.stateTime+=dt;p.vel.set(0,0,0);p.speed=0;
   p.stamina=Math.max(0,p.stamina-MOTION.climbIdleCost*dt);p.staminaWait=.65;
   if(grip.lost>.85)dropClimb(p);
   return;
 }
 grip.lost=0;
 // Keep the capsule near the surface; never teleport through stone.
 const correction=Math.hypot(x,y)>.08?clamp(probe.distance-.54,-.08,.07):0; // stationary grip never drifts
 candidate.x+=probe.dir.x*correction;candidate.z+=probe.dir.z*correction;
 const turn=Math.atan2(Math.sin(probe.ang-grip.yaw),Math.cos(probe.ang-grip.yaw));grip.yaw+=turn*Math.min(1,dt*5);p.yaw=grip.yaw;
 const floor=p.world.groundHeight?.(candidate.x,candidate.z);
 if(y<-.1&&Number.isFinite(floor)&&candidate.y<floor+.02){
  dropClimb(p);p.pos.set(candidate.x,floor,candidate.z);p.grounded=true;p.viewY=p._viewY1=p.pos.y;p.fallStart=p.pos.y;return;
 }
 const resolved=candidate.clone();p.world.resolveCapsule(resolved,.36,1.82,0);
 const terrainTop=p.world.groundHeight?.(resolved.x,resolved.z);
 // Native terrain is a heightfield: it is NOT inside the BVH capsule
 // resolver. Never accept a proposed climb point inside solid mountains.
 if(Number.isFinite(terrainTop)&&terrainTop>resolved.y+.10){
  p._hfClimbInput={x:0,y:0};p.speed=0;
  p.stateTime+=dt;p.vel.set(0,0,0);p.stamina=Math.max(0,p.stamina-MOTION.climbIdleCost*dt);p.staminaWait=.65;return;
 }
 if(resolved.distanceTo(candidate)<.35&&resolved.distanceTo(before)<Math.max(.22,dt*6))p.pos.copy(resolved);
 const dx=p.pos.x-before.x,dy=p.pos.y-before.y,dz=p.pos.z-before.z;
 const lateral=dx*side.x+dz*side.z;
 // Limb movement is measured from ACTUAL collision-accepted travel.
 p._hfClimbInput={
  x:Math.abs(lateral)<.001?0:clamp(-lateral/(dt*MOTION.climbStrafeSpeed),-1,1),
  y:Math.abs(dy)<.001?0:clamp(dy/Math.max(.001,dt*verticalSpeed),-1,1)};
 const moved=Math.hypot(dx,dy,dz);
 p.stamina=Math.max(0,p.stamina-(moved>.002?MOTION.climbCostPerSecond:MOTION.climbIdleCost)*dt);
 p.staminaWait=.65;p.stateTime+=dt;p.vel.set(0,0,0);p.grounded=false;
 p.speed=moved>.002?moved/dt:0;p.viewY=p._viewY1=p.pos.y;
}

function beginCliffDescent(p){
 const c=descentCandidate(p.world,p.pos,p.yaw);if(!c)return false;
 const trial=new THREE.Vector3(c.x,c.y,c.z),resolved=trial.clone();
 p.world.resolveCapsule(resolved,.36,1.82,0);
 if(resolved.distanceTo(trial)>.18||p.world.groundHeight(resolved.x,resolved.z)>resolved.y+.02)return false;
 const hit=gripContact({...p,pos:resolved},c.yaw);if(!hit)return false;
 p.pos.copy(resolved);p.viewY=p._viewY1=p.pos.y;p.yaw=c.yaw;
 p.vel.set(0,0,0);p._hfClimb={yaw:c.yaw,lost:0};p._hfClimbInput={x:0,y:0};p.grounded=false;p.fallStart=p.pos.y;p.setState('hf_climb');
 p.emit('highflyClimbStart',{descent:true});return true;
}
function endPhoenix(p,reason){p._hfGlide=null;if(p.state==='hf_glide')p.setState('move');p.emit('highflyGlideEnd',{reason});}
function stepPhoenix(p,dt,input,yaw){
 if(p.stamina<=0||input.pressed.has('dodge')||input.pressed.has('attack')){endPhoenix(p,'cancel');return;}
 const mode=airMode(input,p._hfGlide??={},dt),cfg=AIR_MODES[mode],v=phoenixVelocity(p.vel,input.move,yaw,dt,mode),before=p.pos.clone();p._hfGlide.mode=mode;
 p.vel.set(v.x,v.y+TUNE.gravity*dt,v.z);
 // Do not allow the native capsule to snap up a cliff face while gliding.
 const ahead={x:p.pos.x+v.x*dt,z:p.pos.z+v.z*dt};
 const h=p.world.groundHeight(ahead.x,ahead.z);
 if(Number.isFinite(h)&&h>p.pos.y+.18){p.vel.x=0;p.vel.z=0;}
 if(v.y>=-PHOENIX.safeImpact)p.fallStart=p.pos.y;
 p._integrate(dt);
 p.stamina=Math.max(0,p.stamina-cfg.cost*dt);p.staminaWait=.65;
 p.invulnerable=Math.max(0,(p.invulnerable??0)-dt);p.stateTime+=dt;
 if(Math.hypot(v.x,v.z)>.3){const a=Math.atan2(v.x,v.z);p.yaw+=Math.atan2(Math.sin(a-p.yaw),Math.cos(a-p.yaw))*Math.min(1,dt*7);}
 const water=p.world.waterLevel(p.pos.x,p.pos.z);
 if(p.state!=='hf_glide'||p.grounded||p.pos.y<water+.1){endPhoenix(p,p.grounded?'land':'water-or-interrupted');}
 else if(p.pos.y>before.y+Math.max(.2,Math.max(0,v.y)*dt+.15)){p.pos.copy(before);p.viewY=p._viewY1=p.pos.y;p.vel.x=p.vel.z=0;}
}
function beginPhoenix(p){p._hfGlide={};p._hfJumpQueued=0;p._hfJumpPrimed=false;p._hfDoubleUsed=true;p.setState('hf_glide');p.emit('highflyGlideStart');}
/** Wall-run is a deliberate sprint+forward air maneuver alongside real raycast
 * collision. It cannot run on terrain lacking near-wall samples.
 */
function tryWallRun(p,input){
 if(typeof p.world?.raycast!=='function')return false;
 const speed=Math.hypot(p.vel.x,p.vel.z);
 const right=gripContact(p,p.yaw+Math.PI/2,.95);
 const left=gripContact(p,p.yaw-Math.PI/2,.95);
 const wall=right&&left?(right.distance<left.distance?right:left):right||left;
 if(!wallRunEligible({grounded:p.grounded,stamina:p.stamina,
      held:input.held,move:input.move,contact:wall,speed}))return false;
 const side=right&&wall===right?'right':'left',f=vec(p.yaw);
 p._hfWallRun={time:0,side,dir:{x:f.x,z:f.z},yaw:p.yaw};
 p.setState('hf_wallrun');p.grounded=false;
 p.emit('highflyWallRunStart',{side});
 return true;
}
function stepWallRun(p,dt,input){
 const w=p._hfWallRun;
 if(!w)return p.setState('move');
 if(input.pressed.has('jump')){
  p._hfWallRun=null;p.setState('move');p.grounded=false;
  const kick=vec(w.yaw+(w.side==='right'?-.75:.75));
  p.vel.set(kick.x*4.4,6.0,kick.z*4.4);
  p.emit('highflyWallJump');return;
 }
 if(!input.held.has('sprint')||!input.move?.y||p.stamina<1||w.time>WALL_RUN.duration){
  p._hfWallRun=null;p.setState('move');p.emit('highflyWallRunEnd');return;
 }
 const contact=gripContact(p,w.yaw+(w.side==='right'?Math.PI/2:-Math.PI/2),WALL_RUN.contactDistance);
 if(!contact){p._hfWallRun=null;p.setState('move');p.emit('highflyWallRunEnd',{reason:'lost-contact'});return;}
 const before=p.pos.clone();
 const speed=4.0;const next=before.clone();
 next.x+=w.dir.x*speed*dt;next.z+=w.dir.z*speed*dt;
 next.y+=((WALL_RUN.maxRise-w.time*.95)*dt);
 const safe=allowCliffCapsule(p.world,before,next);
 if(!safe.ok){p._hfWallRun=null;p.setState('move');p.emit('highflyWallRunEnd',{reason:'cliff-face'});return;}
 const resolved=next.clone();p.world.resolveCapsule?.(resolved,.36,1.82,0);
 if(resolved.distanceTo(next)>.22){p._hfWallRun=null;p.setState('move');p.emit('highflyWallRunEnd',{reason:'obstacle'});return;}
 p.pos.copy(resolved);p.viewY=p._viewY1=p.pos.y;p.vel.set(w.dir.x*speed,0,w.dir.z*speed);
 p.speed=speed;p.grounded=false;p.stateTime+=dt;w.time+=dt;
 p.stamina=Math.max(0,p.stamina-WALL_RUN.costPerSecond*dt);
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
 const tagged=findProfessionTarget(p.world,p.pos,p.yaw,kind);
 if(tagged)return {kind:tagged.kind,id:tagged.id,distance:Math.hypot(tagged.x-p.pos.x,tagged.z-p.pos.z)};
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
 const target=cfg.kind==='work'?workTarget(p,name):null;
 let job=null;
 if(PROFESSION_RULES[name]&&target?.id){
   const prep=prepareProfession(p._hfProfession,p.world,name,p.pos,p.yaw);
   if(!prep.ok){p.emit('highflyProfessionBlocked',{name,reason:prep.reason,tool:prep.tool,item:prep.item});return;}
   job=prep.job;
 }else if(PROFESSION_RULES[name]){
   p.emit('highflyProfessionBlocked',{name,reason:'no-real-target'});return;
 }
 p._hfAction={name,time:0,done:false,target,job};
 p.setState('hf_action');p.vel.x=p.vel.z=0;p.speed=0;
 p.emit('highflyActionStart',{name,target:target?.kind??'none',simulated:!job});
}

/** F0.12: independent physical steering while an Unsung combo is active.
 * The native attack state applies 7.5/s drag. Reuse actual LAST accepted
 * locomotion velocity rather than blending from a value already decelerated.
 * The original capsule, hit windows, target validation and damage stay native.
 */
function attackLocomotion(p,original,dt,input,camYaw){
 const integrate=p._integrate;
 p._integrate=function(step){
  const attacking=this.state==='attack'&&!!this.attack&&this.grounded;
  if(attacking){
    const x=input.move?.x||0,y=input.move?.y||0,len=Math.min(1,Math.hypot(x,y));
    this._hfAttackSteering=len>.15;
    const fx=Math.sin(camYaw),fz=Math.cos(camYaw);
    const top=input.held.has('sprint')&&this.stamina>1?TUNE.sprint:
      len>.55&&!this.walking?TUNE.run:TUNE.walk;
    const vx=(fx*y-fz*x)*top,vz=(fz*y+fx*x)*top;
    const previous=this._hfFlowVelocity??{x:this.vel.x,z:this.vel.z};
    const gap=Math.hypot(vx-previous.x,vz-previous.z);
    // Same acceleration budget as grounded Unsung movement; no FPS-dependent
    // velocity ratio and NO second kinematic capsule.
    const k=Math.min(1,(TUNE.accel*step)/Math.max(.001,gap));
    const value={x:previous.x+(vx-previous.x)*k,z:previous.z+(vz-previous.z)*k};
    this._hfFlowVelocity=value;
    this.vel.x=value.x;this.vel.z=value.z;
    if(len>.15&&!this.lockTarget){
      const aim=Math.atan2(vx,vz);
      const delta=Math.atan2(Math.sin(aim-this.yaw),Math.cos(aim-this.yaw));
      this.yaw+=delta*Math.min(1,TUNE.turn*step);
    }
  }else this._hfFlowVelocity=null;
  const beforeX=this.pos.x,beforeZ=this.pos.z,beforeY=this.pos.y;
  // Unlike generic stairs, terrain *heightfield* can instantly elevate a
  // grounded attacker as it snaps to the next sampled height. Inspect the
  // upcoming grade BEFORE the native step-up and reject truly steep ascents.
  if(attacking){
    const dx=this.vel.x*step,dz=this.vel.z*step,travel=Math.hypot(dx,dz);
    if(travel>.002&&typeof this.world?.groundHeight==='function'&&
       !(walkableBuiltFloor(this.world,this.pos)&&walkableBuiltFloor(this.world,{x:beforeX+dx,y:beforeY,z:beforeZ+dz}))){
      const current=this.world.groundHeight(beforeX,beforeZ);
      const next=this.world.groundHeight(beforeX+dx,beforeZ+dz);
      if(Number.isFinite(current)&&Number.isFinite(next)&&
        next-current>0.002&&(next-current)/travel>MAX_ATTACK_WALK_SLOPE){
         this.vel.x=this.vel.z=0;
         this._hfFlowVelocity={x:0,z:0};
         this._hfAttackSteering=false;
         this.emit('highflySteepAttackBlocked',{rise:next-current,run:travel});
      }
    }
  }
  const out=integrate.call(this,step);
  // Second guard catches native auto-step and collider edge cases. Never
  // convert ATTACK into an uncommanded vertical mantle.
  if(attacking&&this.pos.y-beforeY>.035&&
     this.pos.y-beforeY>Math.hypot(this.pos.x-beforeX,this.pos.z-beforeZ)*MAX_ATTACK_WALK_SLOPE+.012){
    this.pos.set(beforeX,beforeY,beforeZ);
    this.vel.x=this.vel.z=0;this.vel.y=0;
    this._hfFlowVelocity={x:0,z:0};
    this.viewY=this._viewY1=beforeY;this.fallStart=beforeY;
    this.grounded=true;this.speed=0;this._hfAttackSteering=false;
    this.emit('highflySteepAttackBlocked',{reason:'auto-step'});
  }
  if(attacking){
    const traveled=Math.hypot(this.pos.x-beforeX,this.pos.z-beforeZ)/Math.max(step,1e-5);
    this._hfAttackTravelSpeed=traveled;
    this._hfAttackSteering=traveled>.25&&this._hfAttackSteering;
    // Terrain/props may stop the capsule: never animate legs against a wall.
    if(traveled<.2)this._hfFlowVelocity={x:0,z:0};
  }else this._hfAttackTravelSpeed=0;
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
 const nativeSwim=p._swim.bind(p);
 const nativeStart=p.startAttack.bind(p);
 p._hfFlowCombat=true;p._hfFlowClock=0;p._hfFlowHistory=[];
 p._hfMana=100;p._hfManaMax=100;p._hfLevel=1;p._hfTrainingScore=0;
 p._hfOxygenMax=oxygenMax(1,0);p._hfOxygen=p._hfOxygenMax;
 p._hfDrownTimer=0;p._hfFlowVelocity=null;
 p._hfProfession=professionState();
 p._hfProfessionLoad=function(){
   try{
     const v=JSON.parse(globalThis.localStorage?.getItem('highfly-profession-f013')??'null');
     if(v&&typeof v==='object')this._hfProfession=professionState(v.inventory||{},v.tools||[]);
   }catch{}
 };
 p._hfProfessionSave=function(){
   try{globalThis.localStorage?.setItem('highfly-profession-f013',
    JSON.stringify({inventory:this._hfProfession.inventory,tools:[...this._hfProfession.tools]}));}catch{}
 };
 p._hfProfessionLoad();
 p.setHighflyProgression=function(level=1,verifiedPoints=0){
  this._hfLevel=clamp(Math.trunc(Number(level)||1),1,99);
  this._hfTrainingScore=Math.max(0,Math.trunc(verifiedPoints));
  const old=this._hfOxygenMax;
  this._hfOxygenMax=oxygenMax(this._hfLevel,this._hfTrainingScore);
  this._hfOxygen=Math.min(this._hfOxygenMax,this._hfOxygen+Math.max(0,this._hfOxygenMax-old));
  return this._hfOxygenMax;
 };
 // True direction/timing bonus belongs to the real Unsung damage descriptor.
 // F0.12.2 normal slashes now have small visible ENERGY costs (3/3/5).
 // Specials/heavy actions retain their original costs; normal chains still flow.
 p.startAttack=function(desc,index){
   const aim=this._hfFlowQueuedDirection??null;
   const dir=directionFromAim(aim);
   const flow=recordFlowStrike(this._hfFlowHistory,this._hfFlowClock,dir,
     WEAPON_MODES[this._hfGearCycle]?.id??'sword');
   const charged=(index===3||index===2&&desc===TUNE.dash);
   const basic=!charged&&index>=0&&index<3;
   const bonus=basic&&flow.accepted?(flow.secret?1.22:1.08):1;
   const modified=basic?{...desc,cost:index===2?5:3,dmg:desc.dmg*bonus}:desc;
   const prior={x:this.vel.x,z:this.vel.z,yaw:this.yaw};
   const ok=nativeStart(modified,index);
   if(ok){
     this.vel.x=prior.x;this.vel.z=prior.z;
     // Preserve facing across chained attacks when the joystick is moving.
     this.yaw=prior.yaw;
     this._hfFlowHistory=flow.history;
     this._hfFlowDirection=dir;this._hfFlowSecret=flow.secret;
     this._hfFlowQueuedDirection=null;
     this.emit('highflyFlowStrike',{index,dir,bonus:bonus-1,secret:flow.secret});
     if(flow.secret)this.emit('highflySecretCombo',{weapon:WEAPON_MODES[this._hfGearCycle]?.id??'sword',dir});
   }
   return ok;
 };
 p._hfDive=false;p._hfDiveEntering=false;p._hfWallRun=null;
 // Keep Unsung's real surface swimming/buoyancy and collisions, but allow a
 // separate controlled descent to a floor-clamped underwater target.
 p._swim=function(dt,input,wish,wishLen,surface){
  const oldY=this.pos.y;
  const result=nativeSwim(dt,input,wish,wishLen,surface);
  if(this.state!=='swim'){this._hfDive=false;this._hfDiveEntering=false;return result;}
  if(this._hfDive&&Number.isFinite(surface)){
   const floor=this.world.floorBelow(this.pos.x,surface-.1,this.pos.z,15);
   if(Number.isFinite(floor)&&surface-floor>2.25){
    const minY=floor+.70,maxY=surface-1.79;
    const fast=input.held.has('sprint')?3.6:2.6;
    const pitch=clamp(this._hfCameraPitch??0,-1.0,1.0);
    const forward=clamp(input.move?.y??0,-1,1);
    const vertical=Math.sin(pitch)*forward*fast;
    const desired=this._hfDiveEntering?
      Math.max(minY,Math.min(oldY-.0,oldY-2.5*dt)):
      clamp(oldY+vertical*dt,minY,maxY);
    const next=clamp(desired,minY,maxY);
    this.pos.y=next;this.vel.y=(next-oldY)/Math.max(dt,.001);
    this.viewY=this._viewY1=next;this.grounded=false;
    if(next<=maxY+.015)this._hfDiveEntering=false;
    // The next Unsung swim tick still runs native horizontal collision and
    // buoyancy, but vertical positioning is replaced by this 3D dive control.
   }else{this._hfDive=false;this._hfDiveEntering=false;this.emit('highflyDiveBlocked',{reason:'shallow'});}
  }
  return result;
 };
 p._hfDoubleUsed=false;p._hfJumpPrimed=false;p._hfJumpQueued=0;p._hfJumpFx=0;p._hfGearCycle=0;
 p.spawn=function(...args){
  nativeSpawn(...args);this._hfDoubleUsed=false;this._hfJumpPrimed=false;this._hfJumpQueued=0;
  this._hfSeat=null;this._hfGlide=null;this._hfJumpFx=0;this._hfAction=null;this._hfMantle=null;this._hfClimb=null;this._hfWallRun=null;this._hfGearCycle=0;this._hfRollVisual='forward';this._hfDive=false;this._hfDiveEntering=false;this._hfOxygen=this._hfOxygenMax;this._hfFlowClock=0;this._hfFlowHistory=[];this._hfFlowVelocity=null;
 };
 p.update=function(dt,input,camYaw=0){
  const step=clamp(dt,0,.05);
  this._hfJumpFx=Math.max(0,(this._hfJumpFx||0)-step);
  this._hfJumpQueued=Math.max(0,(this._hfJumpQueued||0)-step);
  const active=input&&input.pressed&&input.held;
  if(!active)return nativeUpdate(dt,input,camYaw);
  this._hfFlowClock+=step;
   if(globalThis.__hfP555Regions?.boatStep?.(this,step,input,camYaw))return;
  advanceCrops(this.world,step);
  this._hfCameraPitch=Number.isFinite(this._hfCameraPitch)?this._hfCameraPitch:0;
  if(input.highflyAbilityAim&&Object.prototype.hasOwnProperty.call(input.highflyAbilityAim,'attack')){
    this._hfFlowQueuedDirection=input.highflyAbilityAim.attack;
  }
  if(input.pressed.has('dive')&&this.state==='swim'){
   this._hfDive=!this._hfDive;this._hfDiveEntering=this._hfDive;
   this.emit('highflyDiveToggle',{active:this._hfDive});
  }
  if(this.state!=='swim'){this._hfDive=false;this._hfDiveEntering=false;}
  // Like Emberfall, holding ATK continues the combo at the ORIGINAL Unsung
  // attack cadence. Keep one native strike event/damage window per step.
  if(input.held.has('attack')&&!input.pressed.has('attack')){
   input={...input,pressed:new Set(input.pressed)};
   input.pressed.add('attack');
  }
  // P565: a real seat anchor belongs to the active streamed region.
  if(this._hfSeat&&this.state!=='hf_seated')this._hfSeat=null;
  if(this.state==='hf_seated'){
   const seat=this._hfSeat,move=Math.hypot(input.move?.x??0,input.move?.y??0);
   if(!seat||seat.region!==globalThis.__hfP555Regions?.active||move>.18||['seat','jump','dash','attack','interact'].some(k=>input.pressed.has(k))){
    if(seat){this.pos.copy(seat.exit);this.viewY=this._viewY1=this.pos.y;this.yaw=seat.yaw;this.fallStart=this.pos.y}
    this._hfSeat=null;this.setState('move');this.vel.set(0,0,0);this.grounded=false;this.emit('highflySeatEnd');return;
   }
   this.vel.set(0,0,0);this.speed=0;this.stateTime+=step;this.invulnerable=Math.max(0,this.invulnerable-step);return;
  }
  if(isMove(this)&&this.grounded&&input.pressed.has('seat')){
   const regions=globalThis.__hfP555Regions,seat=regions?.nearSeat(this.pos,this.yaw);
   if(seat){this._hfSeat={...seat,exit:this.pos.clone(),region:regions.active};this.pos.set(seat.x,seat.y,seat.z);this.viewY=this._viewY1=this.pos.y;this.yaw=seat.yaw;this.vel.set(0,0,0);this.speed=0;this.setState('hf_seated');this.emit('highflySeatStart',{id:seat.id});return;}
  }
  // Explicit full-body states own the player. Combat, ROLL and DASH cannot
  // play at the same time as mantle/climb/sit/work.
  if(this.state==='hf_glide'){stepPhoenix(this,step,input,camYaw);return;}
  if(this.state==='hf_wallrun'){stepWallRun(this,step,input);return;}
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
     if(action.job){
       const finished=commitProfession(this._hfProfession,this.world,action.job);
       this.emit(finished.ok?'highflyProfessionComplete':'highflyProfessionBlocked',{name:action.name,...finished});
       if(finished.ok)this._hfProfessionSave();
     }
     this._hfAction=null;this.setState('move');
     this.emit('highflyActionEnd',{name:action.name,completed:!!action.job});
    }
    // Sit/lie idle cancels on the joystick deadzone or other movement/attack action.
    return;
   }
  }
  if(input.pressed.has('equip')&&isMove(this)&&!this._hfEquipmentLocked){
   this._hfGearCycle=(this._hfGearCycle+1)%WEAPON_MODES.length;
   this.emit('highflyEquipPreview',{variant:this._hfGearCycle});
  }
  if((isMove(this)||this.state==='swim')&&input.pressed.has('climb')){
   const hit=probeHighflyWall(this)||gripContact(this,this.yaw);
   if(!hit&&this.grounded&&this.stamina>3&&beginCliffDescent(this))return;
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
  // Preserve double jump on the first airborne press. Subsequent descending
  // presses, or falling from a cliff, deploy Phoenix wings in this test build.
  if(isMove(this)&&!this.grounded&&this.vel.y<-.65&&this.airTime>.12&&input.pressed.has('jump')&&(!this._hfJumpPrimed||this._hfDoubleUsed)&&this.stamina>=PHOENIX.minEnergy){
   beginPhoenix(this);stepPhoenix(this,step,otherInput(input,['jump']),camYaw);return;
  }
  // Only grant second jump after the first genuine Unsung ground jump.
  // Never grant it from a cliff fall, during water, ROLL, DASH or attacks.
  if(isMove(this)&&!this.grounded&&this._hfJumpPrimed&&!this._hfDoubleUsed&&input.pressed.has('jump'))
   this._hfJumpQueued=MOTION.secondJumpBuffer;
  const second=isMove(this)&&!this.grounded&&this._hfJumpPrimed&&
   !this._hfDoubleUsed&&this.airTime>=MOTION.minAirBeforeSecond&&
   this._hfJumpQueued>0&&this.stamina>=MOTION.secondJumpCost;
  if(second){
   this.spend(MOTION.secondJumpCost);
   this.vel.y=Math.max(MOTION.secondJumpSpeed,this.vel.y);
   this._hfDoubleUsed=true;this._hfJumpPrimed=false;this._hfJumpQueued=0;
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
  const posBefore=this.pos.clone(),groundBefore=this.grounded;
  // Magic consumes blue MANA; physical strikes and mobility consume ENERGÍA.
  if(input.pressed.has('pulse')&&this.skills?.has('pulse')&&this.grounded&&
     this.pulseTimer<=0){
    if(this._hfMana<18){
      input={...input,pressed:new Set(input.pressed)};input.pressed.delete('pulse');
      this.emit('highflyManaBlocked',{cost:18});
    }else this._hfMana-=18;
  }
  this._hfMana=clamp(this._hfMana+step*4.5,0,this._hfManaMax);
  const result=attackLocomotion(this,nativeUpdate,dt,nativeRollInput,camYaw);
  // Extra heightfield side-wall barrier for airborne collision as well:
  // native BVH ignores steep terrain until its vertical terrain snap.
  const cliffSafety=allowCliffCapsule(this.world,posBefore,this.pos);
  if(!cliffSafety.ok){
    this.pos.x=posBefore.x;this.pos.z=posBefore.z;
    this.vel.x=0;this.vel.z=0;this._hfFlowVelocity=null;this.speed=0;
    this.viewY=this._viewY1=this.pos.y;
    this.emit('highflyCliffBarrier',{slope:cliffSafety.slope,reason:cliffSafety.reason});
  }
  // Heightfields are NOT vertical collision meshes. On high-gradient ascent
  // reject a native snap instead of entering a visual rock face, also outside ATK.
  if(groundBefore&&this.pos.y>posBefore.y+.025){
    const crossing=allowTerrainTraverse(this.world,posBefore,this.pos);
    if(!crossing.ok){
      this.pos.copy(posBefore);this.vel.x=this.vel.z=this.vel.y=0;
      this.viewY=this._viewY1=this.pos.y;this.grounded=true;
      this._hfFlowVelocity=null;this.speed=0;
      this.emit('highflyCliffBarrier',{slope:crossing.slope});
    }
  }
  if(this.state==='move'&&!this.grounded&&!this._hfWallRun){
   tryWallRun(this,input);
  }
  // Oxygen is strictly head-submerged time, not merely standing in water.
  const water=this.world?.waterLevel?.(this.pos.x,this.pos.z)??-Infinity;
  const underwater=this.state==='swim'&&Number.isFinite(water)&&this.pos.y+1.62<water;
  this._hfUnderwater=underwater;
  // 50s of normal submerged breathing from 100 O2; 33s sprint swim.
  const depletion=oxygenRate(underwater,input.held.has('sprint'));
  this._hfOxygen=clamp(this._hfOxygen+depletion*step,0,this._hfOxygenMax);
  if(underwater&&this._hfOxygen<=0){
    this._hfDrownTimer=(this._hfDrownTimer??0)+step;
    if(this._hfDrownTimer>=.9){this._hfDrownTimer-=.9;this.damage(8,null);this.emit('highflyDrowning');}
  }else this._hfDrownTimer=0;
  if(rollAttempt&&this.state==='roll'){
   const d=this.rollDir,front=Math.sin(originalFacing)*d.x+Math.cos(originalFacing)*d.z;
   const side=Math.cos(originalFacing)*d.x-Math.sin(originalFacing)*d.z;
   this._hfRollVisual=front<-.45?'backward':Math.abs(side)>.45?(side>0?'right':'left'):'forward';
   if(this._hfRollVisual!=='forward')this.yaw=originalFacing;
   this.emit('hfRollDirection',{direction:this._hfRollVisual});
  }
  if(this.events?.slice(startEvents).some(e=>e.type==='jump')){
   this._hfJumpPrimed=true;this._hfDoubleUsed=false;this._hfJumpQueued=0;
  }
  if(this.grounded){
   this._hfJumpPrimed=false;this._hfDoubleUsed=false;this._hfJumpQueued=0;
  }
  return result;
 };
 return p;
}
