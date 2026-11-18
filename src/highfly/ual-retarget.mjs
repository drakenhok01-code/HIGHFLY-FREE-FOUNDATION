/** Retarget Quaternius CC0 source rotation DELTAS to one existing KayKit
 * skeleton. Do not instantiate/display an imported source mannequin.
 * World-rest alignment keeps UAL and KayKit axes independent.
 */
import * as THREE from 'three';
const q=([x,y,z,w])=>new THREE.Quaternion(x,y,z,w).normalize();
const ZERO=new THREE.Quaternion();
function sampled(track,time){
 const n=track.times.length,end=n-1,t=Math.max(0,Math.min(track.times[end],time));
 let lo=0,hi=end;
 while(hi-lo>1){const m=(lo+hi)>>1;if(track.times[m]<=t)lo=m;else hi=m;}
 const i=lo*4,j=hi*4,arr=track.values;
 const u=Math.min(1,Math.max(0,(t-track.times[lo])/Math.max(.00001,track.times[hi]-track.times[lo])));
 return new THREE.Quaternion(...arr.slice(i,i+4)).slerp(new THREE.Quaternion(...arr.slice(j,j+4)),u).normalize();
}
export function applyUALPose(hero,name,time,weight=0.6){
 const clip=hero.ualData?.clips?.[name];if(!clip||weight<=0)return 0;
 let done=0;
 for(const track of clip.bones){
  if(track.target==='head')continue;
  const bone=hero._bone(track.target),basis=hero._ualParentRest?.get(track.target);
  if(!bone||!basis)continue;
  // delta in Quaternius parent rest frame -> world rest -> KayKit local parent rest
  const sourceRest=q(track.rest),sourceParent=q(track.parent);
  const delta=sampled(track,((time%clip.duration)+clip.duration)%clip.duration).multiply(sourceRest.invert());
  delta.premultiply(sourceParent).multiply(sourceParent.clone().invert());
  delta.premultiply(basis.clone().invert()).multiply(basis);
  const intensity=/^(spine|chest)/.test(track.target)?.18:
   /upperleg|lowerleg|foot/.test(track.target)?.45:.72;
  const limited=ZERO.clone().slerp(delta,Math.min(.85,weight*intensity));
  bone.quaternion.premultiply(limited).normalize();
  done++;
 }
 hero.ualApplied=(hero.ualApplied||0)+done;
 return done;
}
