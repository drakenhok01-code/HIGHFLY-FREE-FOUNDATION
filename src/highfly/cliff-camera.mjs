/** HIGHFLY F0.14.3-5: prevent the third-person camera clipping through tall terrain cliffs.
 * Supplements Unsung camera's CENTER ray with a small collision volume,
 * checking the terrain heightfield and rays offset to the camera's sides.
 * Does not change player collision, scattered rocks, or the render material.
 */
import * as THREE from 'three';
const SIDE=new THREE.Vector3(), ORIGIN=new THREE.Vector3();
const finite=n=>Number.isFinite(n);
export function safeCliffCameraDistance(world,pivot,dir,desired,initial,{
 radius=.36,terrainClearance=.54,scanSteps=12
}={}){
 if(!world||typeof world.groundHeight!=='function'||typeof world.raycast!=='function'
   ||!finite(desired)||desired<=0||!finite(initial))return initial;
 const reach=Math.min(desired,Math.max(.38,initial));
 let capped=reach;
 const clear=d=>{
  const x=pivot.x+dir.x*d,z=pivot.z+dir.z*d,y=pivot.y+dir.y*d;
  const ground=world.groundHeight(x,z);
  return !finite(ground)||y-ground>=terrainClearance;
 };
 // Look for the first cliff face rather than merely checking where the
 // camera ends up; a tall ridge can lie between a safe pivot and a safe end.
 let last=0;
 for(let i=1;i<=scanSteps;i++){
  const d=reach*i/scanSteps;
  if(!clear(d)){
   let lo=last,hi=d;
   for(let j=0;j<7;j++){const mid=(lo+hi)/2;if(clear(mid))lo=mid;else hi=mid;}
   capped=Math.min(capped,Math.max(.38,lo-.10));break;
  }
  last=d;
 }
 // Extra rays approximate a camera sphere; huge steep cliffs can miss the
 // center ray when the follow camera orbits close to the edge. Only probe
 // lateral rays where terrain is close, keeping the vast open world cheap.
 const bx=pivot.x+dir.x*reach,bz=pivot.z+dir.z*reach;
 SIDE.set(-dir.z,0,dir.x);
 const mag=SIDE.length();
 if(mag>1e-5)SIDE.multiplyScalar(radius/mag);
 const h0=world.groundHeight(pivot.x,pivot.z);
 const hEnd=world.groundHeight(bx,bz);
 const hLeft=world.groundHeight(bx+SIDE.x,bz+SIDE.z);
 const hRight=world.groundHeight(bx-SIDE.x,bz-SIDE.z);
 // Only apply expensive shoulder probes when terrain climbs sharply into
 // the camera. Lowland ground and isolated small rocks stay on native physics.
 const rise=Math.max(hEnd,hLeft,hRight)-h0;
 const nearCliff=rise>1.15||capped<reach-.02;
 if(nearCliff){
  for(const side of [-1,1]){
   ORIGIN.copy(pivot).addScaledVector(SIDE,side);
   const hit=world.raycast(ORIGIN,dir,reach+radius+.12);
   if(finite(hit)&&hit<reach+radius+.1)
    capped=Math.min(capped,Math.max(.38,hit-radius-.08));
   // Terrain's giant heightfield cliff can lack a loaded mesh collider:
   // keep left and right edges of the virtual camera outside the slope.
   for(let i=1;i<=scanSteps;i++){
    const d=reach*i/scanSteps;
    const x=ORIGIN.x+dir.x*d,z=ORIGIN.z+dir.z*d,y=ORIGIN.y+dir.y*d;
    if(y-world.groundHeight(x,z)<terrainClearance){
     capped=Math.min(capped,Math.max(.38,d-reach/scanSteps-.10));
     break;
    }
   }
  }
 }
 return Math.max(.38,Math.min(reach,capped));
}
