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
export function allowTerrainTraverse(world,a,b,maximum=1.1){
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
