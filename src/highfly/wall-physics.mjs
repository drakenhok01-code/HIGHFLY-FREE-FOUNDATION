/** Heightfield steep-wall safety for the ONE Unsung capsule.
 * Native terrain heightfields cannot represent true vertical overhang geometry.
 * This layer adds a conservative side-wall barrier; no fabricated ledges.
 */
export function terrainGradient(world,x,z,eps=.30){
 if(typeof world?.groundHeight!=='function')return null;
 const h=(a,b)=>world.groundHeight(a,b),l=h(x-eps,z),r=h(x+eps,z),b=h(x,z-eps),f=h(x,z+eps);
 if(![l,r,b,f].every(Number.isFinite))return null;
 const dx=(r-l)/(2*eps),dz=(f-b)/(2*eps);
 return {dx,dz,slope:Math.hypot(dx,dz),normal:{x:-dx,y:1,z:-dz}};
}
/** Actual built floor standing above the heightfield (paved plaza, bridge, stairs).
 * Physics of that surface is still owned by native Unsung collision BVH. */
export function walkableBuiltFloor(world,p,tolerance=.23){
 if(typeof world?.floorBelow!=='function'||typeof world?.groundHeight!=='function'||!p)return false;
 const ground=world.groundHeight(p.x,p.z);
 const floor=world.floorBelow(p.x,p.y+.55,p.z,.95);
 return Number.isFinite(ground)&&Number.isFinite(floor)&&floor-ground>.24&&Math.abs(floor-p.y)<tolerance;
}
export function allowTerrainTraverse(world,a,b,maximum=1.1){
 if(walkableBuiltFloor(world,a)&&walkableBuiltFloor(world,b))return {ok:true,builtFloor:true};
 if(typeof world?.groundHeight!=='function')return {ok:true};
 const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
 if(len<.00001)return {ok:true};
 for(const t of [.25,.5,.75,1]){
  const x=a.x+dx*t,z=a.z+dz*t;
  const g=terrainGradient(world,x,z);
  if(!g)continue;
  const toward=(g.dx*dx+g.dz*dz)/len;
  if(toward>maximum&&g.slope>maximum)return {ok:false,grade:toward,slope:g.slope};
 }
 return {ok:true};
}
export function wallRunEligible({grounded,stamina,held,move,contact,speed}){
 return !grounded&&stamina>=10&&held?.has?.('sprint')&&
   (move?.y??0)>.4&&speed>=2.3&&contact?.distance>.08&&contact?.distance<1.12;
}
export const WALL_RUN={duration:1.0,costPerSecond:10,maxRise:.45,contactDistance:1.20};

/** Additional solid proxy for cliffs represented only by heightfield elevations.
 * Unlike BVH rays, this considers a high-gradient terrain face to be a wall
 * before the player capsule's centre can enter it. Not a true overhang mesh.
 */
export function terrainWallContact(world,pos,dir,reach=1.15,height=.82){
 if(typeof world?.groundHeight!=='function'||!pos||!dir)return null;
 const mag=Math.hypot(dir.x,dir.z);
 if(mag<.001)return null;
 const dx=dir.x/mag,dz=dir.z/mag;
 for(let distance=.12;distance<=reach+.001;distance+=.07){
  const x=pos.x+dx*distance,z=pos.z+dz*distance;
  const g=terrainGradient(world,x,z,.2),h=world.groundHeight(x,z);
  if(!g||!Number.isFinite(h))continue;
  const facing=dx*g.dx+dz*g.dz;
  if(g.slope>1.08&&facing>0.84&&h>pos.y+Math.max(.22,height*.43))
   return {distance,kind:'steep-heightfield',slope:g.slope,
     normal:{x:-g.dx/g.slope,y:0,z:-g.dz/g.slope},x,z,height:h};
 }
 return null;
}
/** Accepts downhill travel and gentle slopes; rejects travel INTO very
 * steep faces even when native capsule BVH did not report the terrain.
 */
export function allowCliffCapsule(world,previous,next,radius=.35){
 if(!previous||!next)return {ok:true};
 if(walkableBuiltFloor(world,previous)&&walkableBuiltFloor(world,next))return {ok:true,builtFloor:true};
 const dx=next.x-previous.x,dz=next.z-previous.z,len=Math.hypot(dx,dz);
 if(len<.001)return {ok:true};
 const direct=allowTerrainTraverse(world,previous,next,1.0);
 if(!direct.ok)return {...direct,reason:'steep-ascent'};
 const endH=world?.groundHeight?.(next.x,next.z);
 const g=terrainGradient(world,next.x,next.z,.2);
 if(g&&Number.isFinite(endH)&&g.slope>1.08&&endH>next.y+.12){
  return {ok:false,reason:'embedded-cliff',slope:g.slope};
 }
 const projection={x:dx/len,z:dz/len};
 const wall=terrainWallContact(world,previous,projection,Math.min(len+radius,.9),.58);
 if(wall&&wall.distance<=len+radius*.2&&Number.isFinite(endH)&&endH>previous.y+.18)
  return {ok:false,reason:'rock-face-contact',slope:wall.slope};
 return {ok:true};
}
