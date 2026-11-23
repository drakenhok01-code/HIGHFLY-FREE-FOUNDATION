/** GPU scene acceptance: real CC0 3D models and skinned KayKit NPC visible.
 * Isolated lightweight rig render; whole Unsung world still requires Samsung QA.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {stylizeUniversalKayKit} from './stylize-kaykit-free.mjs';
import {loadLicensedCreatureTemplates,makeLicensedCreature} from './p491-cc0-creatures.mjs';
window.__hfP493RigQA={ready:false,error:null};
try{
 const width=1120,height=450,scene=new THREE.Scene();
 scene.background=new THREE.Color('#101d34');
 const camera=new THREE.PerspectiveCamera(50,width/height,.1,100);
 camera.position.set(0,3,15);camera.lookAt(0,1,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x60708a,3));
 const sun=new THREE.DirectionalLight(0xffffff,2.5);sun.position.set(1,8,8);scene.add(sun);
 const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true,alpha:false});
 renderer.setSize(width,height,false);renderer.setPixelRatio(1);document.body.append(renderer.domElement);
 const actors=[];
 const kt=await new GLTFLoader().loadAsync('/models/hf-kaykit-knight.glb');
 const profile=stylizeUniversalKayKit(kt);
 const person=cloneSkeleton(kt.scene);
 const box=new THREE.Box3().setFromObject(person),scale=1.8/profile.naturalHeight;
 const host=new THREE.Group();host.scale.setScalar(scale);
 person.position.y-=box.min.y;host.add(person);host.position.x=-5.7;scene.add(host);
 actors.push({name:'kaykit-npc',host,skinned:0});
 for(const id of ['wolf','boar','crab']){
  const gltf=(await loadLicensedCreatureTemplates('/'))[id];
  if(!gltf)throw Error('Missing '+id+' licensed GLB');
  const animal=makeLicensedCreature(id,gltf);
  if(!animal)throw Error('No scene avatar for '+id);
  animal.root.position.x={wolf:-1.9,boar:1.9,crab:5.7}[id];
  scene.add(animal.root);actors.push({name:id,host:animal.root,skinned:0});
 }
 const gl=renderer.getContext(),draw=()=>{
  scene.updateMatrixWorld(true);renderer.render(scene,camera);
  const pixels=new Uint8Array(width*height*4);
  gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;
 };
 const all=draw(),report=[];
 for(const a of actors){
  a.host.traverse(n=>{if(n.isSkinnedMesh)a.skinned++});
  a.host.visible=false;const absent=draw();a.host.visible=true;
  let pixels=0;
  for(let i=0;i<all.length;i+=4)
   if(Math.abs(all[i]-absent[i])+Math.abs(all[i+1]-absent[i+1])+Math.abs(all[i+2]-absent[i+2])>36)pixels++;
  report.push({name:a.name,skinned:a.skinned,visiblePixels:pixels});
 }
 draw();
 window.__hfP493RigQA={ready:true,error:null,profile,report,triangles:renderer.info.render.triangles};
}catch(e){
 window.__hfP493RigQA={ready:false,error:String(e),stack:String(e.stack)};
 console.error('[P493 REAL GLB VISIBILITY QA]',e);
}
