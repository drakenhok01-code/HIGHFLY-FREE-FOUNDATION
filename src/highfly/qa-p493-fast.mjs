/** Independent CC0 wolf / boar / crab shader diagnostic, no whole-world bake. */
import * as THREE from 'three';
import {loadLicensedCreatureTemplates,makeLicensedCreature} from './p491-cc0-creatures.mjs';
const scene=new THREE.Scene();scene.background=new THREE.Color(0x213b53);
scene.add(new THREE.HemisphereLight(0xffffff,0x9ebeff,4));
const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(4,9,9);scene.add(light);
const camera=new THREE.PerspectiveCamera(50,1200/470,.1,100);camera.position.set(0,3,12);camera.lookAt(0,0.8,0);
const renderer=new THREE.WebGLRenderer({preserveDrawingBuffer:true,antialias:false});
renderer.setSize(1200,470,false);document.body.append(renderer.domElement);
const read=()=>{renderer.render(scene,camera);const bytes=new Uint8Array(1200*470*4);renderer.getContext().readPixels(0,0,1200,470,renderer.getContext().RGBA,renderer.getContext().UNSIGNED_BYTE,bytes);return bytes};
const compare=(a,b)=>{let pixels=0;for(let i=0;i<a.length;i+=4){if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>30)pixels++;}return pixels;};
try{
 const glbs=await loadLicensedCreatureTemplates('/');
 const actors=[];
 for(const id of ['wolf','boar','crab']){
  const avatar=makeLicensedCreature(id,glbs[id]);
  avatar.root.position.set({wolf:-3,boar:0,crab:3}[id],0,0);scene.add(avatar.root);
  actors.push(avatar);
 }
 const all=read(),report=[];
 for(const avatar of actors){
  avatar.root.visible=false;const hidden=read();avatar.root.visible=true;
  const original=compare(all,hidden);
  const cached=[];avatar.root.traverse(o=>{if(!o.isMesh)return;cached.push({o,material:o.material});o.material=new THREE.MeshBasicMaterial({color:0xffe22c,side:THREE.DoubleSide,depthTest:false});});
  const basicScene=read();avatar.root.visible=false;const basicHidden=read();avatar.root.visible=true;
  const basic=compare(basicScene,basicHidden);
  for(const x of cached){x.o.material.dispose();x.o.material=x.material;}
  const bounds=new THREE.Box3().setFromObject(avatar.root),center=bounds.getCenter(new THREE.Vector3());
  report.push({id:avatar.id,originalPixels:original,basicPixels:basic,meshes:cached.length,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},projection:center.project(camera).toArray()});
 }
 read();
 window.__p493Fast={ready:true,report};
 console.log('[HF_FAST_CC0_DIAGNOSTICS]',JSON.stringify(report));
}catch(e){window.__p493Fast={ready:false,error:String(e),stack:e.stack};console.error(e);}
