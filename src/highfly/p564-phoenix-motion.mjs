// P564 Phoenix mobility. Pure math; actual movement stays with native Player capsule.
export const PHOENIX=Object.freeze({speed:9.0,sink:3.4,brake:18,energyPerSecond:1.25,minEnergy:3,safeImpact:5.2});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const AIR_MODES=Object.freeze({glide:{speed:9,vertical:-3.4,cost:1.25},boost:{speed:16,vertical:-2.1,cost:3.2},dive:{speed:24,vertical:-12,cost:.7},ascend:{speed:10,vertical:6.2,cost:5.2},recover:{speed:17,vertical:2.8,cost:2.1}});
export function airMode(input,state,dt){if((state.launch??0)>0){state.launch=Math.max(0,state.launch-dt);return 'ascend'}if(input.pressed.has('air_dive')){if(state.diving){state.diving=false;state.recovery=.9}else{state.diving=true;state.recovery=0}}if(input.held.has('jump')||input.pressed.has('jump')){state.diving=false;state.recovery=0;return 'ascend'}if(state.diving)return 'dive';if((state.recovery??0)>0){state.recovery=Math.max(0,state.recovery-dt);return 'recover'}return input.held.has('dash')?'boost':'glide'}
export function phoenixVelocity(v,move,yaw,dt,mode='glide'){
 const x=clamp(move?.x??0,-1,1),y=clamp(move?.y??0,-1,1),mag=Math.max(1,Math.hypot(x,y)),k=1-Math.exp(-5*dt);
 const cfg=AIR_MODES[mode]??AIR_MODES.glide,forward=mode==='dive'&&Math.hypot(x,y)<.1?1:y;
 const vx=(Math.sin(yaw)*forward-Math.cos(yaw)*x)/mag*cfg.speed,vz=(Math.cos(yaw)*forward+Math.sin(yaw)*x)/mag*cfg.speed;
 const vy=v.y+clamp(cfg.vertical-v.y,-25*dt,PHOENIX.brake*dt);
 return {x:v.x+(vx-v.x)*k,z:v.z+(vz-v.z)*k,y:clamp(vy,-55,8)};
}
// Find a lower point immediately off a steep edge. Do NOT cross an unseen ledge
// or teleport down a mountain. Actual contact and capsule clearance are required by caller.
export function descentCandidate(world,pos,yaw){
 if(typeof world?.groundHeight!=='function')return null;
 const h=world.groundHeight(pos.x,pos.z);if(!Number.isFinite(h)||Math.abs(h-pos.y)>.65)return null;
 for(const delta of [0,.3,-.3,.6,-.6]){const ang=yaw+delta,dx=Math.sin(ang),dz=Math.cos(ang);
  for(const d of [.45,.65,.85,1.05,1.25,1.45]){
   const x=pos.x+dx*d,z=pos.z+dz*d,floor=world.groundHeight(x,z),drop=pos.y-floor;
   if(!Number.isFinite(floor)||drop<.85||drop/d<1.05)continue;
   const y=pos.y-.65;if(y<floor+.08)continue;
   return {x,y,z,yaw:ang+Math.PI};
  }
 }
 return null;
}
