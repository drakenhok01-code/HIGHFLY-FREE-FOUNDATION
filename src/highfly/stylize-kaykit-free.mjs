/**
 * HIGHFLY universal CC0 KayKit body — port of the P6.8 continuous anime
 * deformation / rest-pose-retarget ALGORITHM. No SOURCE meshes or animation
 * banks, only the official CC0 FREE Knight's 41-bone skinned GLB and 76 clips.
 * Never mix rigs or scale a separate head over an unchanged skeleton.
 */
import * as THREE from 'three';
const key=n=>(n||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const WORLD=()=>new THREE.Vector3();
function boneMap(root){const out=new Map();root.traverse(n=>{if(n.isBone)out.set(key(n.name),n);});return out;}
function rest(root){const r=new Map();root.traverse(n=>{if(n.isBone)r.set(key(n.name),{name:n.name,p:n.position.clone(),q:n.quaternion.clone(),s:n.scale.clone()});});return r;}
function interpolate(x,pts){
 let j=0;while(j<pts.length-2&&x>pts[j+1][0])j++;
 const [a,b]=pts[j],[c,d]=pts[j+1];return b+(x-a)*(d-b)/Math.max(.000001,c-a);
}
// Derived from the original HIGHFLY Anime V6.6 shape-preserving continuum:
// one field for shoulders, torso, arms, legs and their shared joint positions.
function warp(v){
 const {x,y,z}=v;
 const ys=[[0,0],[.40,.98],[.60,1.39],[.93,1.93],[1.12,2.16],[1.31,2.37],[1.65,2.68],[2.20,3.16],[2.75,3.64]];
 const hi=THREE.MathUtils.smoothstep(y,1.18,1.56);
 const lo=THREE.MathUtils.smoothstep(y,.15,.52);
 const fx=THREE.MathUtils.lerp(THREE.MathUtils.lerp(1.25,1.354,lo),.87,hi);
 const arm=.18*THREE.MathUtils.smoothstep(Math.abs(x),.28,.88)*(1-hi);
 const belly=THREE.MathUtils.smoothstep(y,.40,.64)*(1-THREE.MathUtils.smoothstep(y,.89,1.10));
 const core=1-THREE.MathUtils.smoothstep(Math.abs(x),.27,.50);
 const px=x*(fx+arm)*(1-.09*belly*core);
 const pz=z*THREE.MathUtils.lerp(1.25,.90,hi)*(1-(z>0?.19:.10)*belly*core);
 return new THREE.Vector3(px,interpolate(y,ys),pz);
}
function stretchHead(v,headBox,oldBoneWorld){
 const anchor=new THREE.Vector3(oldBoneWorld.x,headBox.min.y,oldBoneWorld.z);
 // Same center for hair, face and head; no detached/oversized face.
 return v.clone().sub(anchor).multiplyScalar(.86).add(warp(anchor));
}
function meshWorldBox(mesh){
 mesh.geometry.computeBoundingBox();
 return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
}
function adjustedAnimation(clip,src,dst,counts){
 const tracks=[];
 for(const tr of clip.tracks){
  const dot=tr.name.lastIndexOf('.');
  if(dot<0){counts.skipped++;continue;}
  const original=src.get(key(tr.name.slice(0,dot)));
  const target=dst.get(key(tr.name.slice(0,dot)));
  const prop=tr.name.slice(dot+1);
  if(!original||!target){counts.skipped++;continue;}
  const t=tr.clone();
  t.name=target.name+'.'+prop;
  if(prop==='position'){
   const u=t.values,ratio=original.p.length()>.0001
     ?THREE.MathUtils.clamp(target.p.length()/original.p.length(),.15,7):1;
   for(let i=0;i<u.length;i+=3){
    u[i]=target.p.x+(u[i]-original.p.x)*ratio;
    u[i+1]=target.p.y+(u[i+1]-original.p.y)*ratio;
    u[i+2]=target.p.z+(u[i+2]-original.p.z)*ratio;
   }
  }else if(prop==='quaternion'){
   const inv=original.q.clone().invert(),q=new THREE.Quaternion(),u=t.values;
   for(let i=0;i<u.length;i+=4){
    q.fromArray(u,i).premultiply(inv).premultiply(target.q).normalize().toArray(u,i);
   }
  }else if(prop==='scale'){
   const u=t.values;
   for(let i=0;i<u.length;i+=3){
    u[i]*=target.s.x/(original.s.x||1);
    u[i+1]*=target.s.y/(original.s.y||1);
    u[i+2]*=target.s.z/(original.s.z||1);
   }
  }
  tracks.push(t);counts.bound++;
 }
 return new THREE.AnimationClip(clip.name,clip.duration,tracks);
}
export function stylizeUniversalKayKit(gltf,{npc=false}={}){
 const root=gltf.scene;
 root.updateMatrixWorld(true);
 const bones=boneMap(root),before=rest(root);
 if(bones.size!==41||!bones.has('head')||!bones.has('handslotr'))
  throw Error('Expected authentic 41-bone FREE Knight medium rig, got '+bones.size);
 const oldWorld=new Map([...bones].map(([k,b])=>[k,b.getWorldPosition(WORLD())]));
 const headMesh=root.getObjectByName('Knight_Head')??(npc?(()=>{let m=null;root.traverse(o=>{if(o.isSkinnedMesh&&/_Head$/i.test(o.name))m=o});return m})():null);
 if(!headMesh?.isSkinnedMesh)throw Error('Original Knight_Head skinned mesh missing');
 const headBox=meshWorldBox(headMesh),headBone=oldWorld.get('head');
 if(!headBone||headBox.max.y-headBox.min.y<.5)throw Error('Invalid KayKit FREE original head geometry');
 const meshes=[];root.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
 if((!npc&&meshes.length!==6)||(npc&&meshes.length<3))throw Error('Expected six original skinned parts, found '+meshes.length);
 const skeletons=new Set(),meshRest=[];
 let verts=0;
 for(const mesh of meshes){
  const old=mesh.matrixWorld.clone(),inverse=old.clone().invert();
  const face=mesh===headMesh,geometry=mesh.geometry.clone(),pos=geometry.attributes.position;
  const temp=new THREE.Vector3(),bounds=new THREE.Box3();
  for(let i=0;i<pos.count;i++){
   temp.fromBufferAttribute(pos,i).applyMatrix4(old);
   const changed=face?stretchHead(temp,headBox,headBone):warp(temp);
   if(!Number.isFinite(changed.x+changed.y+changed.z))throw Error('Non-finite stylized vertex');
   bounds.expandByPoint(changed);
   changed.applyMatrix4(inverse);
   pos.setXYZ(i,changed.x,changed.y,changed.z);
  }
  if(!face)geometry.computeVertexNormals();
  geometry.computeBoundingBox();geometry.computeBoundingSphere();pos.needsUpdate=true;
  mesh.geometry=geometry;mesh.frustumCulled=false;
  verts+=pos.count;skeletons.add(mesh.skeleton);
  meshRest.push({name:mesh.name,box:bounds});
 }
 // Move rest joints by the SAME field as the six meshes, parent-first.
 const changeBone=node=>{
  if(!node.isBone)return;
  const name=key(node.name),original=oldWorld.get(name);
  if(!original)throw Error('Missing original bone position '+node.name);
  const position=name==='head'?stretchHead(original,headBox,headBone):warp(original);
  node.parent.updateWorldMatrix(true,false);
  node.position.copy(position.applyMatrix4(node.parent.matrixWorld.clone().invert()));
  node.updateWorldMatrix(false,false);
 };
 root.traverse(changeBone);
 root.updateMatrixWorld(true);
 for(const skin of skeletons)skin.calculateInverses();
 for(const mesh of meshes){mesh.bind(mesh.skeleton,mesh.matrixWorld);mesh.computeBoundingBox();}
 const after=rest(root),counts={bound:0,skipped:0};
 const clips=gltf.animations.map(c=>adjustedAnimation(c,before,after,counts));
 if((!npc&&(clips.length!==76||counts.bound<6000))||(npc&&(clips.length<20||counts.bound<1000)))
  throw Error('KayKit animation rest retarget incomplete: '+JSON.stringify({clips:clips.length,...counts}));
 const bodyBox=new THREE.Box3(),headWarp=meshRest.find(m=>m.name===headMesh.name)?.box;
 for(const part of meshRest)if(!npc||/_(Head|Body|ArmLeft|ArmRight|LegLeft|LegRight)$/i.test(part.name))bodyBox.union(part.box);
 const naturalHeight=bodyBox.getSize(new THREE.Vector3()).y;
 const headRatio=headWarp.getSize(new THREE.Vector3()).y/naturalHeight;
 if(!(naturalHeight>2.7&&naturalHeight<4.2&&headRatio>.17&&headRatio<.35))
  throw Error('Stylized proportions invalid: '+JSON.stringify({naturalHeight,headRatio}));
 gltf.animations=clips;
 const result={rig:'FREE_KNIGHT_MEDIUM_41',bones:bones.size,meshCount:meshes.length,
  vertices:verts,naturalHeight,headRatio,tracks:counts.bound,skipped:counts.skipped,clips:clips.length};
 root.userData.highflyUniversal=result;
 return result;
}
