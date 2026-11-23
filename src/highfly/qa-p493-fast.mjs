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
  const statics=[];
  for(const x of cached){
   if(!x.o.isSkinnedMesh)continue;
   const m=new THREE.Mesh(x.o.geometry,new THREE.MeshBasicMaterial({color:0xfff45a,side:THREE.DoubleSide,depthTest:false}));
   m.position.copy(x.o.position);m.quaternion.copy(x.o.quaternion);m.scale.copy(x.o.scale);m.frustumCulled=false;
   x.o.parent.add(m);x.o.visible=false;statics.push({mesh:m,original:x.o});
  }
  const staticScene=read();avatar.root.visible=false;const staticHidden=read();avatar.root.visible=true;
  const staticPixels=compare(staticScene,staticHidden);
  for(const item of statics){item.original.visible=true;item.mesh.removeFromParent();item.mesh.material.dispose();}
  const skinned=cached.filter(x=>x.o.isSkinnedMesh).map(x=>x.o);
  for(const m of skinned)m.bindMode='detached';
  const detScene=read();avatar.root.visible=false;const detHidden=read();avatar.root.visible=true;
  const detachedPixels=compare(detScene,detHidden);
  for(const m of skinned)m.bindMode='attached';
  const source=glbs[avatar.id].scene,bb=new THREE.Box3().setFromObject(source);
  const sourceHost=new THREE.Group(),origT=source.position.clone();
  source.position.set(-.5*(bb.min.x+bb.max.x),-bb.min.y,-.5*(bb.min.z+bb.max.z));
  sourceHost.scale.setScalar(({wolf:1.48,boar:1.10,crab:.85}[avatar.id])/bb.getSize(new THREE.Vector3()).y);
  sourceHost.position.copy(avatar.root.position);
  sourceHost.add(source);scene.add(sourceHost);avatar.root.visible=false;
  const srcScene=read();sourceHost.visible=false;const srcHidden=read();
  const sourcePixels=compare(srcScene,srcHidden);
  scene.remove(sourceHost);source.removeFromParent();source.position.copy(origT);avatar.root.visible=true;
  const attrs=cached.filter(x=>x.o.isSkinnedMesh).map(x=>({
   mesh:x.o.name,positionType:x.o.geometry?.attributes?.position?.array?.constructor?.name,
   positionNormalized:x.o.geometry?.attributes?.position?.normalized,
   skinIndexType:x.o.geometry?.attributes?.skinIndex?.array?.constructor?.name,
   skinWeightsNormalized:x.o.geometry?.attributes?.skinWeight?.normalized,
   bindMode:x.o.bindMode,bones:x.o.skeleton?.bones?.length}));
  const bounds=new THREE.Box3().setFromObject(avatar.root),center=bounds.getCenter(new THREE.Vector3());
  report.push({id:avatar.id,originalPixels:original,basicPixels:basic,staticPixels,detachedPixels,sourcePixels,
   meshes:cached.length,attributes:attrs,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},
   projection:center.project(camera).toArray()});
 }
 read();
 window.__p493Fast={ready:true,report};
 console.log('[HF_FAST_CC0_DIAGNOSTICS]',JSON.stringify(report));
}catch(e){window.__p493Fast={ready:false,error:String(e),stack:e.stack};console.error(e);}
