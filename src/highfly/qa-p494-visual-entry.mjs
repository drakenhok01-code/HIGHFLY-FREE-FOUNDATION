import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {loadLicensedCreatureTemplates,makeLicensedCreature,animateLicensedCreature} from './p491-cc0-creatures.mjs';
import {stylizeUniversalKayKit} from './stylize-kaykit-free.mjs';
const canvas=document.querySelector('#view');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
renderer.setPixelRatio(1);renderer.setSize(915,412,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x1b2039);
// The actual Unsung Pipeline disables automatic world transforms.
scene.matrixWorldAutoUpdate=false;
// IMPORTANT: no standard Three.js lights, matching Unsung's custom shader engine.
const ground=new THREE.Mesh(new THREE.PlaneGeometry(22,13),new THREE.MeshLambertMaterial({color:0x395546,side:THREE.DoubleSide}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.03;scene.add(ground);
const camera=new THREE.PerspectiveCamera(50,915/412,.1,100);
camera.position.set(0,4.0,10.5);camera.lookAt(0,.95,0);
const q={ready:false,issues:[],visuals:[],creatures:{},kaykit:null};
window.__p494VisualQA=q;
(async()=>{
 try{
  const result=await loadLicensedCreatureTemplates(import.meta.env.BASE_URL);
  for(const [i,id] of ['wolf','boar','crab'].entries()){
   const gltf=result[id];
   if(!gltf){q.issues.push('GLB animation missing '+id);continue;}
   const a=makeLicensedCreature(id,gltf);
   a.root.position.set((i-1)*3.1,0,0);
   scene.add(a.root);
   const meshCount=(()=>{let n=0;a.model.traverse(m=>{if(m.isSkinnedMesh&&m.visible)n++;});return n;})();
   const skins=[];a.model.traverse(m=>{if(m.isSkinnedMesh)skins.push({
    material:m.material?.type??m.material?.[0]?.type,visible:m.visible
   });});
   q.creatures[id]={realRig:!!gltf.animations.length,meshCount,clips:gltf.animations.length,
    unlit:skins.length>0&&skins.every(m=>m.material==='MeshBasicMaterial'&&m.visible)};
   q.visuals.push({a,enemy:{alive:true,state:'idle',pos:a.root.position.clone(),yaw:.2,vel:new THREE.Vector3(),t:0},isCreature:true});
  }
  const src=await new GLTFLoader().loadAsync(import.meta.env.BASE_URL+'models/hf-kaykit-knight.glb');
  const profile=stylizeUniversalKayKit(src);
  const model=cloneSkeleton(src.scene);const holder=new THREE.Group();holder.position.set(-5.9,0,0);
  holder.scale.setScalar(1.8/profile.naturalHeight);
  const bodies=[];
  model.traverse(m=>{
   if(!m.isMesh)return;
   if(/sword|shield|helmet|visor|cape|dagger|bow|staff/i.test(m.name)){m.visible=false;return;}
   if(m.isSkinnedMesh&&m.visible)bodies.push(m.name);
   m.frustumCulled=false;
   const material=Array.isArray(m.material)?m.material[0]:m.material;
   m.material=new THREE.MeshBasicMaterial({map:material?.map??null,color:0xf0d5c1,side:THREE.DoubleSide});
  });
  holder.add(model);scene.add(holder);holder.updateMatrixWorld(true);
  const mixer=new THREE.AnimationMixer(model),idle=src.animations.find(x=>x.name==='Idle');
  idle&&mixer.clipAction(idle).play();q.visuals.push({mixer,holder});
  q.kaykit={meshCount:bodies.length,bodies,naturalHeight:profile.naturalHeight};
  q.manualWorldMatrix=true;
  if(bodies.length<5)q.issues.push('KayKit original body incomplete');
  q.ready=true;
 }catch(e){q.issues.push(String(e));q.ready=true;}
})();
let prev=performance.now();function update(now){
 const dt=Math.min(.05,Math.max(0,(now-prev)/1000));prev=now;
 for(const a of q.visuals){
  if(a.isCreature){const o=a.a,place=o.root.position.clone();animateLicensedCreature(o,{...a.enemy,pos:place},dt,true);}
  else if(a.mixer){a.mixer.update(dt);a.holder.updateMatrixWorld(true);}
 }
 renderer.render(scene,camera);
 requestAnimationFrame(update);
}
requestAnimationFrame(update);
