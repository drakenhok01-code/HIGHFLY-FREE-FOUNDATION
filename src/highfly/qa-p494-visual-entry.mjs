import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {loadLicensedCreatureTemplates,makeLicensedCreature,animateLicensedCreature} from './p491-cc0-creatures.mjs';
import {stylizeUniversalKayKit} from './stylize-kaykit-free.mjs';
import {installP41WorldLoot} from './p41-world-loot.mjs';
import {normalizeRpgState} from './rpg-core.mjs';
const canvas=document.querySelector('#view');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
renderer.setPixelRatio(1);renderer.setSize(915,412,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x1b2039);
 // Crucial: match EXACT native Unsung Pipeline behaviour.
 scene.matrixWorldAutoUpdate=false;
// IMPORTANT: no standard Three.js lights, matching Unsung's custom shader engine.
const ground=new THREE.Mesh(new THREE.PlaneGeometry(22,13),new THREE.MeshLambertMaterial({color:0x395546,side:THREE.DoubleSide}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.03;scene.add(ground);
 ground.updateMatrixWorld(true);
const camera=new THREE.PerspectiveCamera(50,915/412,.1,100);
camera.position.set(0,4.0,10.5);camera.lookAt(0,.95,0);
const q={ready:false,issues:[],visuals:[],creatures:{},kaykit:null,frame:0,pixels:null,worldTransforms:[]};
window.__p494VisualQA=q;
// End-to-end executable corpse transaction using the SAME in-game handler:
// native death event -> 3D wolf body -> USAR -> inventory +1 -> remove corpse.
window.__p495ProbeCorpse=()=>{
 const wolf=q.visuals.find(v=>v.isCreature&&v.a.id==='wolf');
 if(!wolf)return {ok:false,reason:'Wolf rig missing'};
 const enemy=wolf.enemy,bag=normalizeRpgState({items:{wolf_pelt:0}}),profession={inventory:{}},subs=[];
 const game={time:1,state:'playing',cine:false,
  player:{pos:enemy.pos.clone(),state:'move'},
  pipe:{scene,sceneT:scene},
  input:{pressed:new Set()},
  world:{groundHeight:()=>0},
  on(fn){subs.push(fn);},
  update(dt){this.time+=dt;},
  __highflyHunts:{avatarFor:e=>e===enemy?wolf.a:null}
 };
 const loot=installP41WorldLoot(game,bag,()=>profession);
 if(!loot)return {ok:false,reason:'Loot layer failed to install'};
 enemy.kind='hf_wolf';enemy.alive=false;enemy.state='dead';
 for(const fn of subs)fn('enemy',{type:'death',enemy});
 const corpseBefore=loot.corpses;
 game.input.pressed.add('interact');
 game.update(.016);
 const result={ok:corpseBefore===1&&loot.corpses===0&&bag.items.wolf_pelt===1,
  corpseBefore,corpseAfter:loot.corpses,itemsInBag:bag.items.wolf_pelt,
  bodyFreed:!wolf.a.corpseLootPending,
  noFloatingSprite:loot.drops.every(d=>!d.sprite)};
 loot.dispose();
 return result;
};
(async()=>{
 try{
  const result=await loadLicensedCreatureTemplates(import.meta.env.BASE_URL);
  for(const [i,id] of ['wolf','boar','crab'].entries()){
   const gltf=result[id];
   if(!gltf){q.issues.push('GLB animation missing '+id);continue;}
   const a=makeLicensedCreature(id,gltf);
   a.root.position.set((i-1)*3.1,0,0);
   scene.add(a.root);a.root.updateMatrixWorld(true);
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
  idle&&mixer.clipAction(idle).play();q.visuals.push({mixer,root:holder});
  q.kaykit={meshCount:bodies.length,bodies,naturalHeight:profile.naturalHeight};
  if(bodies.length<5)q.issues.push('KayKit original body incomplete');
  q.ready=true;
 }catch(e){q.issues.push(String(e));q.ready=true;}
})();
let prev=performance.now();function update(now){
 const dt=Math.min(.05,Math.max(0,(now-prev)/1000));prev=now;
 for(const a of q.visuals){
  if(a.isCreature){const o=a.a,place=o.root.position.clone();animateLicensedCreature(o,{...a.enemy,pos:place},dt,true);}
  else{a.mixer?.update(dt);a.root?.updateMatrixWorld(true);}
 }
 renderer.render(scene,camera);
 // Test ACTUAL drawn pixels, not just glTF model existence/clip count.
 // The production scene has manual matrices: a naive Three.js QA passes
 // even when actors are invisible because their world matrices remain 0.
 if(q.ready&&!(q.frame++%20)){
  // Do not call gl.readPixels repeatedly: software WebGL can block the
  // event loop while Chromium composites the frame. The Playwright test
  // samples the final screenshot once, after models have finished loading.
  const W=915,H=412;
  const points=[[-3.1,'wolf'],[0,'boar'],[3.1,'crab'],[-5.9,'kaykit']];
  q.pixels={};
  for(const [worldX,id] of points){
   const center=new THREE.Vector3(worldX,.8,0).project(camera);
   q.pixels[id]={screenX:Math.round((center.x+1)*W/2),
    screenY:Math.round((center.y+1)*H/2),
    manualScene:scene.matrixWorldAutoUpdate===false};
  }
  q.worldTransforms=q.visuals.filter(v=>v.isCreature).map(v=>({
   id:v.a.id,x:v.a.root.matrixWorld.elements[12],z:v.a.root.matrixWorld.elements[14]}));
 }

 requestAnimationFrame(update);
}
requestAnimationFrame(update);
