/** Original HIGHFLY directional blade choreography; no copied game animations.
 * The cue denotes the START side of the cut. Both arms have distinct targets.
 * Deterministic phase samples are shared by the renderer, hit validation and QA.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=t=>{const x=clamp(t,0,1);return x*x*(3-2*x)};
export const DIRS=Object.freeze(['left','right','up','down']);
export function attackPhase(t,duration){
 const f=clamp(t/Math.max(.05,duration),0,1);
 return smooth((f-.12)/.66); // preparation 12%, slash 66%, follow-through
}
export function targetForHand(dir,phase,hand='right',step=0){
 const k=smooth(phase),left=hand==='left',side=left?-1:1;
 const cross=step===2; // the third dual hit may be an X-cross
 const start=dir==='left'?-1:dir==='right'?1:side;
 const end=dir==='left'?1:dir==='right'?-1:-side;
 let x=(start+(end-start)*k)*.56;
 let y=1.20+.13*Math.sin(Math.PI*k);
 if(dir==='up'){x=side*.45;y=.77+1.00*k;}
 if(dir==='down'){x=side*.45;y=1.73-.92*k;}
 if(cross){x=side*(.62-1.24*k);y=left?.80+.85*k:1.62-.85*k;}
 const z=.58+.15*Math.sin(Math.PI*k);
 return {x,y,z};
}
export function directionalArms(style,dir,step=0){
 if(!DIRS.includes(dir)&&!(style==='dual'&&step===2))return [];
 if(style==='dual'){
  if(step===2)return ['left','right'];
  if(dir==='left')return ['left'];
  if(dir==='right')return ['right'];
  return step%2?['left']:['right'];
 }
 return ['right'];
}
export function planDirectionalStroke(style,dir,step,duration=.46){
 const arms=directionalArms(style,dir,step);
 const track=(hand,t)=>targetForHand(dir,attackPhase(t,duration),hand,style==='dual'?step:0);
 return {style,dir,step,duration,arms,at:(time)=>Object.fromEntries(arms.map(a=>[a,track(a,time)]))};
}
/** Iterative per-joint CCD IK on existing KayKit skinned bones.
 * No mannequin, second skeleton, teleport, root motion or hidden hand mesh.
 * Joint rotation is bounded per iteration, preserving silhouette and controls.
 */
export function driveHandCCD(THREE,actor,joints,target,iterations=4){
 const hand=joints.hand,elbow=joints.elbow,shoulder=joints.shoulder;
 if(!hand||!elbow||!shoulder)return {ok:false,reason:'missing-bone'};
 actor.updateMatrixWorld(true);
 const end=new THREE.Vector3(),pivot=new THREE.Vector3(),v=new THREE.Vector3(),d=new THREE.Vector3();
 const q=new THREE.Quaternion(),local=new THREE.Quaternion(),parent=new THREE.Quaternion();
 const desired=new THREE.Vector3(target.x,target.y,target.z);
 actor.localToWorld(desired);
 for(let n=0;n<iterations;n++){
  for(const bone of [elbow,shoulder]){
   hand.getWorldPosition(end);bone.getWorldPosition(pivot);
   v.copy(end).sub(pivot);d.copy(desired).sub(pivot);
   if(v.lengthSq()<1e-6||d.lengthSq()<1e-6)continue;
   q.setFromUnitVectors(v.normalize(),d.normalize());
   // prevent 180° elbow flips, keep realistic arm motion
   const angle=2*Math.acos(clamp(q.w,-1,1));
   if(angle>.40)q.slerp(new THREE.Quaternion(),1-.40/angle);
   bone.parent.getWorldQuaternion(parent);
   local.copy(parent).invert().multiply(q).multiply(parent);
   bone.quaternion.premultiply(local).normalize();
   actor.updateMatrixWorld(true);
  }
 }
 hand.getWorldPosition(end);
 return {ok:true,error:end.distanceTo(desired)};
}
