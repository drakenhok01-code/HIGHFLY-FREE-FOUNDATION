/** HIGHFLY P4.9: THREE controlled live hunting spots, KayKit FREE CC0
 * quest NPCs, real native combat, hand-in and persisting character experience.
 * Installed as an additive layer, never alters Unsung's original encounters.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {stylizeUniversalKayKit} from './stylize-kaykit-free.mjs';
import {KINDS} from '../game/enemies.js';
import {loadLicensedCreatureTemplates,makeLicensedCreature,animateLicensedCreature,disposeLicensedCreature} from './p491-cc0-creatures.mjs';
import {saveRpgState} from './rpg-core.mjs';
import {CORPSE_TIMEOUT,corpseLootFor,closestLootableCorpse} from './p494-creature-loot.mjs';
import {HUNT_SAVE_KEY,HUNT_ORDER,HUNT_MOBS,HUNT_MISSIONS,createHuntState,
 gainHuntXp,acceptHunt,recordHuntKill,turnInHunt,xpRequired} from './p49-hunt-data.mjs';
import './p49-hunts.css';

const CAP=3, LOAD_RANGE=125, UNLOAD_RANGE=165, RESP_COOLDOWN=23;
// Every mob is a *real skeletal CC0 GLB*. No fake animal geometry remains.
const d2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const safeNumber=v=>Number.isFinite(v)?v:null;

function pointOnLand(W,x,z){
 const y=safeNumber(W.groundHeight(x,z));
 if(y===null)return null;
 const water=Number(W.waterLevel?.(x,z));
 if(Number.isFinite(water)&&y<=water+.3)return null;
 const d=Math.abs(W.groundHeight(x+2,z)-y)+Math.abs(W.groundHeight(x,z+2)-y);
 if(!Number.isFinite(d)||d>8)return null;
 return {x,z,y};
}
function coastAnchor(W){
 // Unsung waterLevel() returns -Infinity on DRY ground: look for a nearby
 // *wet neighbour*, not a finite waterLevel at the crab's standing point.
 // Scan the authentic coastline of the core sea/lake; no invented coordinates
 // or terrain edits. Wildlife must stand above water on walkable solid land.
 const offsets=[[9,0],[-9,0],[0,9],[0,-9],[16,0],[-16,0],[0,16],[0,-16]];
 let best=null,score=Infinity;
 for(let x=180;x<=1240;x+=24)for(let z=-620;z<=610;z+=24){
  const dry=pointOnLand(W,x,z);
  if(!dry||dry.y>28||dry.y<.25)continue;
  let sea=false;
  for(const [dx,dz] of offsets){
   const wx=x+dx,wz=z+dz;
   // Ignore elevated mesa pools; this is the central coast (sea level = 0).
   if(W.groundHeight(wx,wz)<-.25&&Math.abs(W.waterLevel(wx,wz))<.01){sea=true;break;}
  }
  if(!sea)continue;
  const value=Math.abs(x-740)*.018+Math.abs(z+85)*.012+dry.y*.065;
  if(value<score){score=value;best=dry;}
 }
 if(best)return best;
 // Last-resort wet shoreline, not an invented coastal spawn: discover the
 // eastern mesa pool's actual bank and warn during QA.
 const pool={x:560,z:-330,r:38};
 for(let radius=pool.r+4;radius<pool.r+30;radius+=4)
  for(let n=0;n<20;n++){
   const ang=2*Math.PI*n/20,x=pool.x+Math.cos(ang)*radius,z=pool.z+Math.sin(ang)*radius;
   const p=pointOnLand(W,x,z);
   if(p&&Math.abs(p.y-125)<9){
    console.warn('[HIGHFLY P4.9] Coastal search failed: crab fallback uses EASTERN POOL SHORE. Review terrain on Android.');
    return p;
   }
  }
 console.warn('[HIGHFLY P4.9] No walkable coastline; crab spot disabled instead of underwater spawning.');
 return null;
}
function pickNpc(W,spot){
 // NPC quest givers stand outside the combat pack's aggro radius when terrain
 // permits. Never put a dialogue giver inside a dense hostile spawn.
 for(const [dx,dz] of [[-44,8],[44,-8],[-8,44],[8,-44],[-54,-16],[54,16],[-32,28],[32,-28]]){
  const p=pointOnLand(W,spot.x+dx,spot.z+dz);
  if(p&&Math.abs(p.y-spot.y)<6)return p;
 }
 for(const [dx,dz] of [[-18,16],[20,-18],[17,22],[-24,-12],[0,-30],[0,30]]){
  const p=pointOnLand(W,spot.x+dx,spot.z+dz);
  if(p&&Math.abs(p.y-spot.y)<6)return p;
 }
 return {x:spot.x+14,z:spot.z+14,y:spot.y};
}
function npcBillboard(name,role){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='rgba(16,9,30,.80)';ctx.beginPath();ctx.roundRect(6,5,500,118,22);ctx.fill();
 ctx.strokeStyle='#ceab68';ctx.lineWidth=4;ctx.stroke();
 ctx.fillStyle='#f5e4bd';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText(name,256,56);
 ctx.fillStyle='#bca9e5';ctx.font='26px sans-serif';ctx.fillText(role,256,95);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:true}));
 sprite.scale.set(3.6,.90,1);
 return sprite;
}
export function installP49Hunts(game){
 if(!game||game.__highflyHunts)return game?.__highflyHunts??null;
 const W=game.world,stage=game.pipe?.scene,hero=game.player;
 if(!W||!stage||!hero||!game.enemies?.spawn)return null;
 let saved=null;try{saved=JSON.parse(localStorage.getItem(HUNT_SAVE_KEY)??'null')}catch{}
 const state=createHuntState(saved),killsSeen=new WeakSet(),spots={};
 const species=Object.create(null);
 const readyPromise=loadLicensedCreatureTemplates(import.meta.env.BASE_URL)
  .then(loaded=>{if(!disposed)Object.assign(species,loaded);return loaded;});
 const rpg=()=>game.__highflyRpg?.state??globalThis.__highflyRpg?.state;
 const persist=()=>{try{localStorage.setItem(HUNT_SAVE_KEY,JSON.stringify(state))}catch{}};
 hero._hfLevel=state.level;hero._hfXp=state.xp;
 // Native Unsung hit/collision/AI remains authoritative. Only original
 // creature definitions and render skins are added on our own prefixed IDs.
 KINDS.hf_wolf={...KINDS.hound,slots:[],name:HUNT_MOBS.wolf.name,hp:44,damage:9,
  speed:5.2,xp:0,core:.72,hover:.11};
 KINDS.hf_boar={...KINDS.hound,slots:[],name:HUNT_MOBS.boar.name,hp:72,damage:12,
  speed:3.6,xp:0,core:.85,hover:.06,circle:false,lunge:11};
 KINDS.hf_crab={...KINDS.hound,slots:[],name:HUNT_MOBS.crab.name,hp:32,damage:7,
  speed:2.8,xp:0,core:.6,hover:.05,circle:false,lunge:7};
 for(const id of HUNT_ORDER){
  const def=HUNT_MOBS[id];
  const pt=id==='crab'?coastAnchor(W):pointOnLand(W,def.anchor.x,def.anchor.z);
  if(!pt){console.warn('[HIGHFLY P4.9] Unsafe spot skipped',id);continue;}
  spots[id]={id,point:pt,npc:pickNpc(W,pt),members:new Map(),launched:false,respawnAt:0};
 }
 const prompt=document.createElement('button');prompt.id='hf-p49-prompt';prompt.type='button';
 prompt.hidden=true;document.body.appendChild(prompt);
 const dialog=document.createElement('div');dialog.id='hf-p49-dialog';dialog.hidden=true;
 document.body.appendChild(dialog);
 const toast=document.createElement('div');toast.id='hf-p49-toast';toast.hidden=true;
 document.body.appendChild(toast);
 let toastUntil=0,dialogOpen=null,npcActors=[],disposed=false,corpseSeq=0;
 const corpses=[]; // Real animated dead GLB bodies, 1 pickup each, 52 seconds.
 function releaseCorpse(c){
  c.collected=true;c.avatar.corpseAvailable=false;
  disposeLicensedCreature(c.avatar);
  const i=corpses.indexOf(c);if(i>=0)corpses.splice(i,1);
 }
 function claimCorpse(c){
  if(!c||c.collected||game.time>=c.expiresAt)return false;
  const claim=game.__hfP41WorldLoot?.claimCorpse?.(c.enemy);
  if(claim?.ok){releaseCorpse(c);game.__highflyRpg?.render?.();return true;}
  if(!claim)tell('Bolsa aún no disponible. Abrí el menú HIGHFLY e intentá de nuevo.');
  return false;
 }
 const tell=message=>{toast.textContent=message;toast.hidden=false;toastUntil=game.time+3.2;};
 const getEntry=id=>HUNT_MISSIONS[id];
 const progress=id=>state.missions[id];
 function closeDialog(){dialog.hidden=true;dialog.innerHTML='';dialogOpen=null;}
 function speak(id){
  const q=getEntry(id),m=progress(id);if(!q||!m)return;
  dialogOpen=id;dialog.hidden=false;
  const status=m.status;
  const speech=status==='available'?q.introduction:
   status==='done'?q.thanks:status==='ready'?'¡Completaste el encargo! Volvé con tu recompensa.':q.progress;
  dialog.innerHTML='<section role="dialog" aria-label="Misión de '+q.npc+'"><small>HIGHFLY · LA LLAMA SIN NOMBRE</small><h3>'+
   q.npc+' · '+q.role+'</h3><b>'+q.title+'</b><p>'+speech+'</p>'+
   '<p>Progreso: '+m.count+' / '+q.count+' · Recompensa: '+q.bonusXp+' EXP extra</p>'+
   '<div class="hf-p49-dialog-actions">'+
   (status==='available'?'<button data-action="accept">ACEPTAR MISIÓN</button>':
    status==='ready'?'<button data-action="claim">ENTREGAR MISIÓN</button>':'')+
   '<button data-action="close">CERRAR</button></div></section>';
 }
 dialog.addEventListener('click',event=>{
  const action=event.target?.closest?.('button')?.dataset?.action,id=dialogOpen;
  if(!id||!action)return;
  if(action==='accept'&&acceptHunt(state,id)){persist();tell('¡Misión aceptada: '+getEntry(id).title+'!');}
  if(action==='claim'){
   const bag=rpg();
   if(!bag){tell('Abrí primero el menú RPG para iniciar la Bolsa');return;}
   const result=turnInHunt(state,id,bag);
   if(result.ok){saveRpgState(bag);persist();hero._hfLevel=state.level;hero._hfXp=state.xp;
    tell('Misión completada · +'+getEntry(id).bonusXp+' EXP · Poción en Bolsa');
    game.__highflyRpg?.render?.();
   }
  }
  closeDialog();
 });
 game.on((type,event)=>{
  if(disposed||type!=='enemy'||event?.type!=='death'||!event.enemy||killsSeen.has(event.enemy))return;
  const enemy=event.enemy,id=HUNT_ORDER.find(key=>HUNT_MOBS[key].kind===enemy.kind);
  if(!id)return;
  killsSeen.add(enemy);
  const spot=spots[id],avatar=spot?.members.get(enemy);
  if(avatar){
   spot.members.delete(enemy);
   avatar.corpseAvailable=true;
   corpses.push({id:++corpseSeq,enemy,avatar,kind:id,collected:false,
    pos:enemy.pos.clone(),expiresAt:game.time+CORPSE_TIMEOUT,now:game.time});
  }else console.warn('[HIGHFLY P494] Wildlife death without skinned body',id);
  const xp=gainHuntXp(state,HUNT_MOBS[id].xp);
  const counted=recordHuntKill(state,id);
  hero._hfLevel=state.level;hero._hfXp=state.xp;persist();
  if(spots[id])spots[id].respawnAt=Math.max(spots[id].respawnAt,game.time+RESP_COOLDOWN);
  tell('+ '+HUNT_MOBS[id].xp+' EXP HIGHFLY'+(counted?' · '+HUNT_MISSIONS[id].title+
   ' '+state.missions[id].count+'/'+HUNT_MISSIONS[id].count:'')+(xp.levels?' · ¡NIVEL '+xp.level+'!':''));
  game.__highflyRpg?.render?.();
 });
 function spawnOne(spot,index){
  const base=spot.point,angle=(index*2.3999632297)+.36;
  const x=base.x+Math.sin(angle)*6,z=base.z+Math.cos(angle)*6;
  const pos=pointOnLand(W,x,z);
  if(!pos||Math.abs(pos.y-base.y)>7||!species[spot.id])return null;
  const e=game.enemies.spawn(HUNT_MOBS[spot.id].kind,x,z,'hf49:'+spot.id,null,base.y);
  if(!Number.isFinite(e?.pos?.y))return null;
  const avatar=makeLicensedCreature(spot.id,species[spot.id]);
  if(!avatar){console.warn('[HIGHFLY P493] Missing animal visual; enemy removed',spot.id);game.enemies.list=game.enemies.list.filter(e0=>e0!==e);return null;}
  stage.add(avatar.root);
  spot.members.set(e,avatar);
  return e;
 }
 function purge(spot){
  for(const corpse of [...corpses])if(corpse.kind===spot.id)releaseCorpse(corpse);
  for(const avatar of spot.members.values())disposeLicensedCreature(avatar);
  spot.members.clear();spot.launched=false;spot.respawnAt=0;
  game.enemies.list=game.enemies.list.filter(e=>e.group!=='hf49:'+spot.id);
 }
 async function loadKaykitNpcs(){
  // P4.9.4: PRIORITY = actually visible on Android. The hero's 41-bone
  // authentic KayKit CC0 rig is rendered first. Stylizing the shared GLB
  // *before* SkeletonUtils.clone can invalidate clone bone inverse matrices.
  // NPCs keep the original rig until a GPU-backed stylized clone test passes.
  let gltf;
  try{gltf=await new GLTFLoader().loadAsync(import.meta.env.BASE_URL+'models/hf-kaykit-knight.glb');}
  catch(err){console.error('[HIGHFLY P494 NPC] GLB unavailable',err);}
  if(disposed)return;
  const report={source:'KayKit FREE CC0 Knight',models:0,fallbacks:0,visibleMeshes:0,
   species:HUNT_ORDER.filter(id=>!!spots[id]),error:gltf?'':String('Knight.glb load failed')};
  globalThis.__highflyP494Npcs=report;
  for(const [i,id] of HUNT_ORDER.entries()){
   const spot=spots[id];if(!spot)continue;
   const anchor=new THREE.Group();anchor.name='HIGHFLY_QUEST_NPC_'+id;
   anchor.position.set(spot.npc.x,spot.npc.y,spot.npc.z);
   anchor.rotation.y=Math.atan2(spot.point.x-spot.npc.x,spot.point.z-spot.npc.z)+Math.PI;
   const billboard=npcBillboard(HUNT_MISSIONS[id].npc,HUNT_MISSIONS[id].role);
   billboard.position.y=2.25;billboard.material.depthTest=false;billboard.renderOrder=80;
   anchor.add(billboard);
   let n=null,mixer={update(){},stopAllAction(){}},fallback=true,meshCount=0;
   if(gltf){
    try{
     n=cloneSkeleton(gltf.scene);
     n.name='HIGHFLY_KAYKIT_NPC_'+id;
     const bounds=new THREE.Box3().setFromObject(n);
     const h=bounds.getSize(new THREE.Vector3()).y;
     if(!Number.isFinite(h)||h<1||h>20)throw Error('Invalid Knight 3D bounds '+h);
     const visual=new THREE.Group();visual.name='ACTUAL_3D_KAYKIT_'+id;
     visual.scale.setScalar(1.80/h); // Translation and dimensions share the same scale.
     n.position.set(-(bounds.min.x+bounds.max.x)*.5,-bounds.min.y,-(bounds.min.z+bounds.max.z)*.5);
     visual.add(n);anchor.add(visual);
     n.traverse(m=>{
      if(!m.isMesh)return;
      m.frustumCulled=false;
      const body=/^Knight_(Body|Head|ArmLeft|ArmRight|LegLeft|LegRight)$/i.test(m.name);
      m.visible=body;
      if(body)meshCount++;
      const base=Array.isArray(m.material)?m.material[0]:m.material;
      m.material=new THREE.MeshBasicMaterial({
       map:base?.map??null,color:m.name==='Knight_Head'?0xffffff:
        [0xd5c9ff,0xe4bb94,0xb5d7c2][i],
       side:THREE.DoubleSide,transparent:!!base?.transparent,
       alphaTest:base?.alphaTest??0,depthWrite:true
      });
     });
     if(meshCount!==6)throw Error('KayKit must show 6 original body meshes, got '+meshCount);
     const idle=gltf.animations.find(a=>a.name==='Idle');
     mixer=new THREE.AnimationMixer(n);if(idle)mixer.clipAction(idle).play();
     fallback=false;report.models++;report.visibleMeshes+=meshCount;
    }catch(err){
     console.error('[HIGHFLY P494 NPC] 3D failed for '+id,err);
     // Never claim a real model when the rig is missing; billboard stays visible.
     for(const child of [...anchor.children])if(child!==billboard)anchor.remove(child);
     report.error=String(err);n=null;
    }
   }
   stage.add(anchor);
   if(fallback)report.fallbacks++;
   npcActors.push({id,anchor,mixer,billboard,model:n??anchor,fallback,meshCount});
  }
  console.info('[HIGHFLY P494 NPC QA]',JSON.stringify(report));
 }

 loadKaykitNpcs();
 const prior=game.update;
 game.update=function(realDt){
  const result=prior.call(this,realDt);
  if(disposed)return result;
  const playing=game.state==='playing'&&!game.cine&&hero.state!=='dead';
  for(const spot of Object.values(spots)){
   const distance=d2(hero.pos,spot.point);
   if(!playing||distance>UNLOAD_RANGE){if(distance>UNLOAD_RANGE&&spot.launched)purge(spot);continue;}
   if(distance<LOAD_RANGE&&!spot.launched&&species[spot.id]){
    for(let i=0;i<CAP;i++)spawnOne(spot,i);
    spot.launched=true;
   }
   if(spot.launched){
    for(const [enemy,avatar] of [...spot.members]){
     // The native Unsung enemy drives aggro, hits, walk speed and facing;
     // the *source rig* plays the corresponding authentic GLB clip.
     animateLicensedCreature(avatar,enemy,realDt,distance<LOAD_RANGE);
    }
    const active=[...spot.members.keys()].filter(e=>e.alive).length;
    if(active<CAP&&game.time>=spot.respawnAt){
     for(const [enemy,avatar] of [...spot.members])if(!enemy.alive){
      disposeLicensedCreature(avatar);
      spot.members.delete(enemy);
     }
     game.enemies.list=game.enemies.list.filter(e=>e.alive||e.group!=='hf49:'+spot.id);
     const used=spot.members.size;
     if(used<CAP)spawnOne(spot,(Math.floor(game.time)%7)+used);
     spot.respawnAt=game.time+RESP_COOLDOWN;
    }
   }
  }
  for(const c of [...corpses]){
   c.now=game.time;
   const dist=d2(hero.pos,c.enemy.pos);
   if(c.expiresAt<=game.time||dist>UNLOAD_RANGE||c.collected){releaseCorpse(c);continue;}
   animateLicensedCreature(c.avatar,c.enemy,realDt,dist<LOAD_RANGE);
  }
  const corpse=playing?closestLootableCorpse(corpses,hero.pos,3.3):null;
  let closest=null,range=3.2;
  if(playing&&!dialogOpen&&!game.people?.talk){
   for(const spot of Object.values(spots)){
    const d=d2(hero.pos,spot.npc);
    if(d<range&&Math.abs(hero.pos.y-spot.npc.y)<3){closest=spot;range=d;}
   }
  }
  prompt.hidden=!closest&&!corpse;prompt.dataset.quest=corpse?'':closest?.id??'';
  prompt.dataset.corpse=corpse?String(corpse.id):'';
  if(corpse){const def=corpseLootFor(corpse.enemy);prompt.textContent='✦ '+def?.verb+' · '+def?.name+' · LOOT +0';}
  else if(closest)prompt.textContent='✦ HABLAR · '+HUNT_MISSIONS[closest.id].npc+' · '+HUNT_MISSIONS[closest.id].title;
  if((closest||corpse)&&game.input.pressed?.has('interact')){
   game.input.pressed.delete('interact');
   if(corpse)claimCorpse(corpse);else speak(closest.id);
  }
  for(const npc of npcActors)if(d2(hero.pos,npc.anchor.position)<110)npc.mixer.update(Math.min(realDt,.05));
  if(!toast.hidden&&game.time>toastUntil)toast.hidden=true;
  return result;
 };
 prompt.addEventListener('click',()=>{
  const corpseId=Number(prompt.dataset.corpse);
  if(corpseId){const c=corpses.find(item=>item.id===corpseId);if(c&&d2(hero.pos,c.enemy.pos)<3.3)claimCorpse(c);return;}
  const id=prompt.dataset.quest;
  if(id&&spots[id]&&d2(hero.pos,spots[id].npc)<3.2)speak(id);
 });
 const api={state,spots,missions:HUNT_MISSIONS,readyPromise,corpses,
  get loadedSpecies(){return Object.keys(species)},accept:id=>{const ok=acceptHunt(state,id);if(ok)persist();return ok;},
  progress:id=>state.missions[id]??null,closeDialog,
  get npcCount(){return npcActors.length;},
  get activeCount(){return Object.values(spots).reduce((v,s)=>v+[...s.members.keys()].filter(e=>e.alive).length,0)},
  get corpseCount(){return corpses.length;},
  dispose(){disposed=true;game.update=prior;closeDialog();prompt.remove();dialog.remove();toast.remove();
   for(const spot of Object.values(spots))purge(spot);
   for(const corpse of [...corpses])releaseCorpse(corpse);
   for(const n of npcActors){stage.remove(n.anchor);n.mixer.stopAllAction();
    n.billboard.material.map.dispose();n.billboard.material.dispose();}
  }};
 game.__highflyHunts=api;globalThis.__highflyHunts=api;
 console.info('[HIGHFLY P4.9.1] CC0 animated wolf, boar and crab hunting spots registered',Object.keys(spots));
 return api;
}
