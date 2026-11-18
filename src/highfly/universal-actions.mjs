/**
 * HIGHFLY universal actor capabilities — one UNSUNG physics Player, one KayKit visual.
 * No party, no classes and no replacement capsule. Mounted in the isolated F0.8.2 lab.
 *
 * Native: 2nd jump, low-ledge mantle, resource targeting using real existing
 * tree/rock collision data, social/emote states.
 * Prototypes: swimming limb cycle and tool actions (real tool GLBs and additional
 * KayKit Rig_Medium_Tools animations must be imported separately).
 * No unrestricted wall-walking or false "every cliff is climbable".
 */
import * as THREE from 'three';
import {TUNE} from '../game/player.js';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const smooth=t=>{const x=clamp(t,0,1);return x*x*(3-2*x);};
export const ACTIONS=Object.freeze({
 hf_sit:{clip:'Sit_Floor_Down',hold:'Sit_Floor_Idle',duration:.8},
 hf_lie:{clip:'Lie_Down',hold:'Lie_Idle',duration:1.05},
 hf_cheer:{clip:'Cheer',duration:1.2},
 hf_pickup:{clip:'PickUp',duration:.85},
 hf_use:{clip:'Use_Item',duration:.95},
 hf_cast:{clip:'Spellcast_Long',duration:1.2},
 hf_chop:{clip:'1H_Melee_Attack_Chop',duration:.85,resource:'wood'},
 hf_mine:{clip:'2H_Melee_Attack_Chop',duration:1.0,resource:'stone'},
 hf_fish:{clip:'Interact',duration:1.2}
});
export function nearestResource(world,pos,kind,maxReach=2.5){
 if(kind==='wood'){
  const caps=world?.caps||[];let best=null;
  for(let j=0;j+6<caps.length;j+=7){
   const x=(caps[j]+caps[j+3])*.5,z=(caps[j+2]+caps[j+5])*.5;
   const lo=Math.min(caps[j+1],caps[j+4]),hi=Math.max(caps[j+1],caps[j+4]);
   const d=Math.hypot(x-pos.x,z-pos.z);
   if(d<=maxReach+caps[j+6]&&pos.y<hi+1&&pos.y+1.5>lo &&
      (!best||d<best.distance))best={kind:'wood',id:'tree:'+j,position:{x,z},distance:d};
  }
  return best;
 }
 if(kind==='stone'){
  const rocks=world?.lazy||[];let best=null;
  for(let i=0;i<rocks.length;i++){
   const r=rocks[i],d=Math.hypot(r.cx-pos.x,r.cz-pos.z)-Math.max(0,Number(r.r)||0);
   if(d<=maxReach&&(!best||d<best.distance))
     best={kind:'stone',id:'boulder:'+i,position:{x:r.cx,z:r.cz},distance:d};
  }
  return best;
 }
 return null;
}
export function findMantle(world,pos,yaw){
 if(!world||typeof world.raycast!=='function'||typeof world.floorBelow!=='function')
  return null;
 const dir=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 const near=new THREE.Vector3(pos.x,pos.y+.86,pos.z);
 const hit=world.raycast(near,dir,.95);
 if(!Number.isFinite(hit)||hit>=.90||hit<.03)return null;
 const reach=hit+TUNE.radius+0.38;
 const x=pos.x+dir.x*reach,z=pos.z+dir.z*reach;
 const floor=world.floorBelow(x,pos.y+2.15,z,2.5);
 const rise=floor-pos.y;
 if(!Number.isFinite(floor)||rise<.45||rise>1.35)return null;
 // A low wall/ledge only: no teleport through towers or cliff faces.
 const head=new THREE.Vector3(x,floor+TUNE.height*.85,z);
 const overhead=world.raycast(head,new THREE.Vector3(0,1,0),.75);
 if(overhead<.72)return null;
 return {target:new THREE.Vector3(x,floor,z),rise,wallDistance:hit};
}
export function installUniversalActions(player){
 if(player._hfUniversalInstalled)return player;
 player._hfUniversalInstalled=true;
 player._hfAirJumpUsed=false;player._hfJumpVisual=0;player._hfTime=0;player._hfBag={wood:0,stone:0};
 player._hfResourceCooldowns=new Map();player._hfActivity=null;player._hfMantle=null;
 const original=player.update.bind(player),spawn=player.spawn.bind(player);
 player.spawn=function(...args){
  const result=spawn(...args);
  this._hfAirJumpUsed=false;this._hfJumpVisual=0;this._hfActivity=null;this._hfMantle=null;
  this._hfResourceCooldowns.clear();
  return result;
 };
 player.update=function(dt,input,camYaw=0){
  const step=clamp(dt,0,.06);
  this._hfTime+=step;this._hfJumpVisual=Math.max(0,(this._hfJumpVisual||0)-step);
  const has=x=>input?.pressed?.has(x)??false;
  const cancel=has('jump')||has('dodge')||has('dash')||has('attack');
  if(this.state==='hf_mantle'){
   const m=this._hfMantle;
   if(!m){this.setState('move');return original(dt,input,camYaw);}
   m.t+=step;
   this.stateTime+=step;
   const t=clamp(m.t/m.duration,0,1),k=smooth(t);
   this.pos.copy(m.from).lerp(m.target,k);
   this.pos.y+=Math.sin(Math.PI*t)*.18;
   const before=this.pos.clone();
   this.world.resolveCapsule(this.pos,TUNE.radius,TUNE.height,0);
   if(this.pos.distanceTo(before)>.40){
    this.pos.copy(m.from);this.vel.set(0,0,0);this.setState('move');this._hfMantle=null;
    this.emit('hfMantleBlocked');return;
   }
   this.vel.set(0,0,0);this.speed=0;
   this.viewY=this._viewY1=this.pos.y;
   if(t>=1){
    this.pos.copy(m.target);this.grounded=true;this._hfAirJumpUsed=false;
    this.setState('move');this._hfMantle=null;this.emit('hfMantleEnd');
   }
   return;
  }
  if(this.state==='hf_action'){
   const a=this._hfActivity;
   if(!a){this.setState('move');return original(dt,input,camYaw);}
   if(cancel||this.stateTime>(a.hold?5e5:a.duration)){
    this._hfActivity=null;this.setState('move');
    if(cancel)return original(dt,input,camYaw);
   }else{
    this.stateTime+=step;this.vel.set(0,0,0);this.speed=0;
    this._integrate(step);
    if(a.hold&&this.stateTime>=a.duration)a.clip=a.hold;
    else if(!a.hold&&this.stateTime>=a.duration){
     if(a.resource){
      this._hfBag[a.resource]=(this._hfBag[a.resource]||0)+1;
      this._hfResourceCooldowns.set(a.target.id,this._hfTime+8);
      this.emit('hfResourceCollected',{resource:a.resource,target:a.target.id,count:this._hfBag[a.resource]});
     }
     this._hfActivity=null;this.setState('move');
    }
    return;
   }
  }
  if(this.grounded&&this.vel.y<=.06)this._hfAirJumpUsed=false;
  // Second jump is an actual additional impulse applied to Unsung's real
  // capsule. It consumes stamina and cannot reset in air, water, DASH or roll.
  if(has('jump')&&!this.grounded&&this.state==='move' &&
      this.airTime>.10&&!this._hfAirJumpUsed &&
      this.stamina>=9 && this.world.waterLevel(this.pos.x,this.pos.z)-this.pos.y<.8){
   if(this.spend(9)){
    this.vel.y=Math.max(0,this.vel.y,6.6);this._hfAirJumpUsed=true;this._hfJumpVisual=.48;
    this.jumpBuffer=0;input.pressed.delete('jump');
    this.emit('hfDoubleJump');
   }
  }
  if(has('hf_climb')&&this.state==='move'&&this.grounded){
   const ledge=findMantle(this.world,this.pos,this.yaw);
   if(ledge&&this.stamina>=10&&this.spend(10)){
    this._hfMantle={from:this.pos.clone(),target:ledge.target,t:0,duration:.62};
    this.setState('hf_mantle');this.grounded=false;this.vel.set(0,0,0);
    this.emit('hfMantleStart',{rise:ledge.rise});return;
   }
  }
  const keys=Object.keys(ACTIONS);
  const key=keys.find(has);
  if(key&&this.state==='move'&&this.grounded){
   const spec=ACTIONS[key];
   const node=spec.resource?nearestResource(this.world,this.pos,spec.resource):null;
   const cooldown=node?this._hfResourceCooldowns.get(node.id)||0:0;
   if((!spec.resource||node)&&cooldown<=this._hfTime){
    this._hfActivity={key,clip:spec.clip,hold:spec.hold||null,
     duration:spec.duration,resource:spec.resource||null,target:node};
    this.setState('hf_action');this.vel.set(0,0,0);
    this.emit('hfActionStart',{action:key,target:node?.id||null});
    return;
   }
   if(spec.resource&&!node)this.emit('hfResourceOutOfRange',{action:key});
  }
  const result=original(dt,input,camYaw);
  if(this.grounded&&this.state==='move'&&this.vel.y<=.06)this._hfAirJumpUsed=false;
  return result;
 };
 return player;
}
