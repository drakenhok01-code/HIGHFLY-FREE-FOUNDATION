/** HIGHFLY P5.2.0 — SAFE WORLD SETTLEMENTS LAB.
 * OPT-IN ONLY: ?hfcities=1; never writes Unsung heightmaps, layouts,
 * native quest/NPC lists, weather, spires, original wildlife or public game save.
 * Structures use Unsung's own MIT MeshBuilder+materials, ONE mesh/BVH per town.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {MeshBuilder,M} from '../world/arch/builder.js';
import {lantern,bench} from '../world/arch/kit.js';
import {planP520Settlements} from './p520-settlement-plan.mjs';

function building(b,p){
 const {x,y,z,yaw=0,w=10,d=8,h=7}=p;
 const wall=.4,halfW=w/2,halfD=d/2,door=2.8,head=3.2;
 b.at(x,y,z,yaw,q=>{
  // Floor and deep foundations: no geometry displacement or world height edit.
  q.mat_(M.ASHLAR).box(-halfW,-1.8,-halfD,w,1.88,d);
  q.mat_(M.PAVING).box(-halfW,.075,-halfD,w,.14,d);
  // Walk-in front doorway at +z (real opening; NOT a false blocked facade).
  q.mat_(M.ASHLAR).box(-halfW,.18,-halfD,w,h-.18,wall);
  q.box(-halfW,.18,-halfD,wall,h-.18,d);
  q.box(halfW-wall,.18,-halfD,wall,h-.18,d);
  const fw=(w-door)/2;
  q.box(-halfW,.18,halfD-wall,fw,h-.18,wall);
  q.box(door/2,.18,halfD-wall,fw,h-.18,wall);
  q.mat_(M.MARBLE).box(-door/2,head,halfD-wall,door,h-head,wall);
  // Distinct native marble and gilt accents instead of imported restricted assets.
  q.mat_(M.FRIEZE).box(-halfW,h-.7,halfD-.5,w,.38,.6);
  q.mat_(M.MARBLE).box(-halfW-.22,h,-halfD-.22,w+.44,.38,d+.44);
  const peak=h+Math.min(3.8,d*.38),lip=.6;
  q.mat_(M.ROOF).quad(
   [-halfW-lip,h+.38,halfD+lip],[halfW+lip,h+.38,halfD+lip],
   [halfW+lip,peak,0],[-halfW-lip,peak,0]
  );
  q.quad(
   [halfW+lip,h+.38,-halfD-lip],[-halfW-lip,h+.38,-halfD-lip],
   [-halfW-lip,peak,0],[halfW+lip,peak,0]
  );
  q.mat_(M.GOLD).box(-halfW-lip,peak-.14,-.12,w+2*lip,.29,.24);
  // Entrance marker and lamps, no additional dynamic lights.
  for(const side of [-1,1]){
   q.at(side*(halfW-1),.12,halfD+1.15,0,j=>lantern(j,2.6));
   q.mat_(M.MARBLE).box(side*(door/2+.10)-(side===-1?.12:0),.2,halfD+.02,.13,head+.18,.28);
  }
  if(['guild','market','inn','fishery','ranger'].includes(p.type)){
   q.at(-halfW+2,.21,halfD+3,0,j=>bench(j,2.2));
  }
  if(p.type==='mill'){
   // Native material mill crest, simple structural signifier in first pass.
   q.mat_(M.DARK).box(-.25,h+1.2,halfD+.32,.5,4.2,.28);
   q.mat_(M.MARBLE).box(-2.3,h+3,halfD+.35,4.6,.30,.28);
   q.box(-.16,h+.8,halfD+.35,.32,4.7,.26);
  }
  if(['forge','smelter'].includes(p.type)){
   q.mat_(M.ASHLAR).box(halfW-2.5,.2,-halfD-1.6,2.1,2.5,2.1);
   q.mat_(M.DARK).box(halfW-2.4,2.7,-halfD-1.5,1.9,3.5,1.9);
  }
 });
}
function resourceProp(b,p){
 b.at(p.x,p.y,p.z,0,q=>{
  if(p.kind==='tree'){
   q.mat_(M.ASHLAR).cbox(0,0,0,.55,2.3,.55);
   q.mat_(M.GOLD).prism(1.1,.1,1.45,3.15,7);
  }else if(p.kind==='ore'){
   q.mat_(M.MARBLE).prism(.9,1.0,0,1.4,6);
   q.mat_(M.GOLD).prism(.35,.20,.2,.8,6);
  }else if(p.kind==='soil'){
   q.mat_(M.ASHLAR).cbox(0,.01,0,2.8,.18,2.8);
   q.mat_(M.GOLD).box(-.08,.20,-1.1,.16,.18,2.2);
  }else if(p.kind==='furnace'){
   q.mat_(M.ASHLAR).prism(1.05,.98,0,1.85,8);
   q.mat_(M.DARK).prism(.45,.45,1.83,.24,8);
  }else if(p.kind==='fishSpot'){
   q.mat_(M.MARBLE).prism(.5,.45,0,.58,6);
   q.mat_(M.GOLD).box(-.1,.6,-.08,.2,1.15,.16);
  }
 });
}
function entrance(p,W){
 const d=p.d*.5+2.8,dx=Math.sin(p.yaw||0)*d,dz=Math.cos(p.yaw||0)*d;
 const x=p.x+dx,z=p.z+dz;
 const y=Number(W.groundHeight(x,z));
 return {x,y:Number.isFinite(y)?y:p.y,z};
}
const sq=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function speakingText(p){
 const intro={
 guild:'El gremio reúne las misiones del Valle y sus agujas. Sera, Brann y Mira ya trabajan en sus respectivas regiones.',
 forge:'Esta herrería abre la fabricación que ya tenés en HIGHFLY. Los lingotes y los materiales siguen en tu inventario real.',
 market:'Los comerciantes de Arvelia conectarán las aldeas. Abrí tu Bolsa para ver el equipo y los materiales.',
 mill:'Los campos abastecen al Valle. El cultivo utiliza los oficios reales y las herramientas correspondientes.',
 fishery:'El puerto se construye junto a los cangrejos y la zona de pesca; Mira conserva su encargo original.',
 smelter:'La minería y la fundición utilizarán nodos de recurso y las recetas reales del sistema de oficios.',
 ranger:'Este campamento vigila los lobos del Bosque de los Susurros. Las misiones de Sera siguen activas.'
 };
 return intro[p.type]??'Bienvenido a '+p.regionName+'. Esta localización forma parte de la primera prueba de asentamientos.';
}
export function installP520Settlements(game,{enabled=false,doc=globalThis.document}={}){
 if(!enabled||!game?.world||!game?.arch||!game?.pipe?.scene)return null;
 if(game.__hfP520Settlements)return game.__hfP520Settlements;
 const stage=game.pipe.scene,W=game.world;
 const plan=planP520Settlements(W,game.__highflyHunts);
 let disposed=false;
 const meshes=[],actors=[],objects=[],nodes=[],regionSummaries=[];
 for(const region of plan.regions){
  const things=plan.placed.filter(x=>x.region===region.id);
  const resources=plan.resources.filter(x=>x.region===region.id);
  if(!things.length&&!resources.length)continue;
  const b=new MeshBuilder();
  for(const entry of things)building(b,entry);
  for(const entry of resources)resourceProp(b,entry);
  if(!b.triCount)continue;
  const mesh=game.arch.add(b,{near:false});
  mesh.name='HIGHFLY_P520_'+region.id.toUpperCase();
  mesh.updateMatrixWorld(true);
  // One native world-space BVH per entire district, not hundreds of colliders.
  // Deliberately irreversible until page reload: this is an isolated opt-in lab.
  W.addGeometry(mesh.geometry);
  meshes.push(mesh);
  for(const p of things)objects.push({...p,entry:entrance(p,W)});
  for(const p of resources){
   const node={id:p.id,kind:p.kind,x:p.x,y:p.y,z:p.z,charges:p.charges??1,available:true,
    ...(p.kind==='soil'?{phase:'empty',growSeconds:p.growSeconds??12}:{})};
   nodes.push(node);
  }
  regionSummaries.push({...region,triangles:b.triCount});
 }
 W.highflyInteractables=[...(W.highflyInteractables??[]),...nodes];
 const interactive=objects.filter(p=>p.npc);
 const css=doc?.createElement?.('style');
 if(css){css.id='hf-p520-style';css.textContent=`
  #hf-p520-prompt{position:fixed;z-index:99950;left:50%;bottom:14%;transform:translateX(-50%);
   border:1px solid #d7ad75;border-radius:15px;background:#1d133fe8;color:#fff6db;
   box-shadow:0 4px 18px #0008;padding:9px 18px;font:700 13px system-ui;pointer-events:auto}
  #hf-p520-prompt[hidden],#hf-p520-dialog[hidden]{display:none!important}
  #hf-p520-dialog{position:fixed;z-index:99960;top:8%;left:50%;transform:translateX(-50%);
   width:min(500px,77vw);max-height:64vh;overflow:auto;background:#14122bf2;border:1px solid #ddb888;
   border-radius:13px;color:#f9f0ff;padding:16px;font:13px/1.45 system-ui;box-shadow:0 9px 27px #000c}
  #hf-p520-dialog h3{margin:4px 0 8px;font-size:18px;color:#f6d78d}
  #hf-p520-dialog p{margin:6px 0 12px}
  #hf-p520-dialog button{background:#513076;border:1px solid #c3aae9;color:white;
   border-radius:9px;padding:10px 12px;margin-right:8px;touch-action:manipulation}
 `;doc.head?.appendChild(css);}
 const prompt=doc?.createElement?.('button'),dialog=doc?.createElement?.('div');
 if(prompt&&dialog){
  prompt.id='hf-p520-prompt';prompt.type='button';prompt.hidden=true;
  dialog.id='hf-p520-dialog';dialog.hidden=true;
  doc.body.append(prompt,dialog);
 }
 let current=null;
 const close=()=>{if(dialog)dialog.hidden=true;current=null;};
 function talk(p){
  if(!dialog||!p)return;
  current=p;dialog.hidden=false;
  dialog.replaceChildren();
  const small=doc.createElement('small');small.textContent='HIGHFLY · ASENTAMIENTOS DEL VALLE';
  const title=doc.createElement('h3');title.textContent=(p.npc??p.label)+' · '+(p.role??p.regionName);
  const text=doc.createElement('p');text.textContent=speakingText(p);
  dialog.append(small,title,text);
  const menu=doc.createElement('button');menu.type='button';
  menu.textContent=({misiones:'VER MISIONES',forja:'ABRIR FORJA',bolsa:'ABRIR BOLSA',oficios:'VER OFICIOS'})[p.menu]??'VER PERSONAJE';
  menu.addEventListener('click',()=>{close();game.__highflyRpg?.open?.(p.menu??'personaje');});
  const dismiss=doc.createElement('button');dismiss.textContent='CERRAR';dismiss.addEventListener('click',close);
  dialog.append(menu,dismiss);
 }
 const loaderPromise=new GLTFLoader().loadAsync(import.meta.env.BASE_URL+'models/hf-kaykit-knight.glb')
 .then(gltf=>{
  if(disposed)return;
  const box=new THREE.Box3().setFromObject(gltf.scene),h=Math.max(.1,box.getSize(new THREE.Vector3()).y);
  const idle=gltf.animations.find(x=>x.name==='Idle');
  for(const [i,p] of interactive.entries()){
   const model=cloneSkeleton(gltf.scene),anchor=new THREE.Group();
   anchor.name='HIGHFLY_P520_NPC_'+p.npc;
   anchor.position.set(p.entry.x,p.entry.y+.06,p.entry.z);
   model.scale.setScalar(1.75/h);model.position.set(0,0,0);
   model.traverse(m=>{
    if(!m.isMesh)return;
    m.frustumCulled=false;
    if(/sword|shield|helmet|visor|cape|dagger|bow|staff/i.test(m.name)){m.visible=false;return;}
    const old=Array.isArray(m.material)?m.material[0]:m.material;
    m.material=new THREE.MeshBasicMaterial({map:old?.map??null,
     color:/Head/.test(m.name)?0xffffff:[0xcbb3e9,0xf3c48e,0xb8decd,0xc8b9eb,0xb1d6cc][i%5],
     side:THREE.DoubleSide,transparent:!!old?.transparent,alphaTest:old?.alphaTest??0});
   });
   anchor.add(model);anchor.visible=false;stage.add(anchor);anchor.updateMatrixWorld(true);
   const mixer=new THREE.AnimationMixer(model);if(idle)mixer.clipAction(idle).play();
   actors.push({anchor,model,mixer,p});
  }
 }).catch(err=>console.warn('[HIGHFLY P520] NPC CC0 model unavailable, buildings still load',err));
 let previous=game.update;
 game.update=function(realDt){
  const out=previous.call(this,realDt);
  if(disposed)return out;
  const player=game.player,ok=game.state==='playing'&&!game.cine&&player?.state!=='dead';
  for(const a of actors){
   const distance=sq(player.pos,a.p.entry);
   a.anchor.visible=distance<110;
   if(distance<60){a.mixer.update(Math.max(0,Math.min(.05,realDt||0)));a.anchor.updateMatrixWorld(true);}
  }
  if(!ok||!interactive.length){if(prompt)prompt.hidden=true;return out;}
  let best=null,range=3.5;
  if(!current&&!game.people?.talk){
   for(const p of interactive){
    const d=sq(player.pos,p.entry);
    if(d<range&&Math.abs(player.pos.y-p.entry.y)<2.7){best=p;range=d;}
   }
  }
  if(prompt){
   prompt.hidden=!best;
   prompt.textContent=best?'✦ USAR · '+best.npc+' · '+best.label:'';
  }
  if(best&&game.input?.pressed?.has('interact')){
   game.input.pressed.delete('interact');talk(best);
  }
  return out;
 };
 prompt?.addEventListener?.('click',()=>{if(prompt.hidden)return;const p=interactive.find(p=>sq(game.player.pos,p.entry)<3.5);if(p)talk(p);});
 const api={enabled:true,plan,meshes,objects,nodes,regionSummaries,readyPromise:loaderPromise,
  get npcCount(){return actors.length;},
  close,dispose(){
   disposed=true;close();game.update=previous;prompt?.remove();dialog?.remove();css?.remove();
   W.highflyInteractables=(W.highflyInteractables??[]).filter(x=>!nodes.includes(x));
   for(const a of actors){stage.remove(a.anchor);a.mixer.stopAllAction();
    a.model.traverse(m=>{if(m.isMesh&&m.material?.dispose)m.material.dispose();});}
   // Mesh BVHs and shadow casters are retained until reload; never promise live
   // uninstallation. The lab is switched OFF by removing ?hfcities=1 and reloading.
  }};
 game.__hfP520Settlements=api;globalThis.__hfP520Settlements=api;
 console.info('[HIGHFLY P520]',regionSummaries.length,'districts',objects.length,'buildings',
  nodes.length,'profession nodes',plan.skipped.length,'terrain-safety skips');
 return api;
}
