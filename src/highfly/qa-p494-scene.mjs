/** Independent real WebGL smoke — loads the SAME deployed GLBs.
 * Hero GLB and wolf rig must render visible pixels; no fake proxy shapes.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {loadLicensedCreatureTemplates,makeLicensedCreature} from './p491-cc0-creatures.mjs';
const report={ready:false,npcMeshes:0,wolfMeshes:0,npcPixelDifference:0,wolfPixelDifference:0,
 assets:[],error:null};
globalThis.__highflyP494SceneQA=report;
try{
 const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
 renderer.setSize(900,440);
 renderer.setClearColor(0x15263b,1);
 document.body.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(46,900/440,.1,60);
 camera.position.set(0,2.7,10);camera.lookAt(0,1.1,0);
 const gltf=await new GLTFLoader().loadAsync(import.meta.env.BASE_URL+'models/hf-kaykit-knight.glb');
 const n=cloneSkeleton(gltf.scene),bounds=new THREE.Box3().setFromObject(n);
 const scale=1.8/bounds.getSize(new THREE.Vector3()).y;
 const holder=new THREE.Group();holder.position.x=-1.65;holder.scale.setScalar(scale);
 n.position.set(-(bounds.min.x+bounds.max.x)*.5,-bounds.min.y,-(bounds.min.z+bounds.max.z)*.5);
 n.traverse(mesh=>{
  if(!mesh.isMesh)return;
  mesh.visible=/^Knight_(Body|Head|ArmLeft|ArmRight|LegLeft|LegRight)$/i.test(mesh.name);
  if(!mesh.visible)return;report.npcMeshes++;
  const m=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
  mesh.material=new THREE.MeshBasicMaterial({map:m?.map??null,color:0xe2d6ff,side:THREE.DoubleSide});
  mesh.frustumCulled=false;
 });holder.add(n);scene.add(holder);
 const templates=await loadLicensedCreatureTemplates(import.meta.env.BASE_URL);
 const wolf=makeLicensedCreature('wolf',templates.wolf);
 if(!wolf)throw Error('Quaternius CC0 wolf GLB failed to instantiate');
 wolf.root.position.x=1.75;scene.add(wolf.root);
 wolf.model.traverse(mesh=>{if(mesh.isMesh&&mesh.visible)report.wolfMeshes++;});
 const pixels=()=>{renderer.render(scene,camera);return renderer.domElement.getContext('webgl2')?'webgl2':'WebGL';};
 pixels();const cv=renderer.domElement;
 const context=renderer.getContext(),raw=new Uint8Array(900*440*4);
 context.readPixels(0,0,900,440,context.RGBA,context.UNSIGNED_BYTE,raw);
 // Compared to flat background: substantial fragment count in both halves.
 for(let y=0;y<440;y+=3)for(let x=0;x<900;x+=3){
  const i=(y*900+x)*4,r=raw[i],g=raw[i+1],bl=raw[i+2];
  const different=Math.abs(r-21)+Math.abs(g-38)+Math.abs(bl-59)>35;
  if(different){if(x<450)report.npcPixelDifference++;else report.wolfPixelDifference++;}
 }
 report.assets=['KayKit FREE Knight.glb','Quaternius CC0 wolf.glb'];
 report.ready=true;
 document.getElementById('status').textContent=JSON.stringify(report);
}catch(err){report.ready=true;report.error=String(err);console.error(err);}
