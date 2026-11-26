// P564 Phoenix mobility. Pure math; actual movement stays with native Player capsule.
export const PHOENIX=Object.freeze({speed:9.0,sink:3.4,brake:18,energyPerSecond:1.25,minEnergy:3,safeImpact:5.2});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function phoenixVelocity(v,move,yaw,dt){
 const x=clamp(move?.x??0,-1,1),y=clamp(move?.y??0,-1,1),mag=Math.max(1,Math.hypot(x,y)),k=1-Math.exp(-5*dt);
 const vx=(Math.sin(yaw)*y-Math.cos(yaw)*x)/mag*PHOENIX.speed,vz=(Math.cos(yaw)*y+Math.sin(yaw)*x)/mag*PHOENIX.speed;
 return {x:v.x+(vx-v.x)*k,z:v.z+(vz-v.z)*k,y:Math.max(-55,Math.min(-PHOENIX.sink,v.y+PHOENIX.brake*dt))};
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
