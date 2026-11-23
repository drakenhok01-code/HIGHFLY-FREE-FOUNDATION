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
function safeSeraSite(W,game){
 // Safe quest giver on Dawn Terrace, away from native monster-wave triggers.
 const maren=game.people?.get?.('maren');
 if(!maren)return null;
 const candidates=[[8,7],[11,1],[11,-5],[5,-9],[-7,8],[-10,-4],[6,11]];
 for(const [dx,dz] of candidates){
  const x=maren.x+dx,z=maren.z+dz;
  const y=W.floorBelow?.(x,maren.y+2,z,7);
  if(!Number.isFinite(y)||Math.abs(y-maren.y)>2.5)continue;
  if((game.people?.list??[]).some(n=>Math.hypot(n.x-x,n.z-z)<3.2))continue;
  return {x,z,y};
 }
 return {x:maren.x+7,z:maren.z+5,y:maren.y};
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
  const questNpc=id==='wolf'?safeSeraSite(W,game):null;
  spots[id]={id,point:pt,npc:questNpc??pickNpc(W,pt),members:new Map(),launched:false,respawnAt:0};
 }
 const prompt=document.createElement('button');prompt.id='hf-p49-prompt';prompt.type='button';
 prompt.hidden=true;document.body.appendChild(prompt);
 const dialog=document.createElement('div');dialog.id='hf-p49-dialog';dialog.hidden=true;
 document.body.appendChild(dialog);
 const toast=document.createElement('div');toast.id='hf-p49-toast';toast.hidden=true;
 document.body.appendChild(toast);
 let toastUntil=0,dialogOpen=null,npcActors=[],disposed=false;
 // Anchor and nameplate exist immediately. Failed asynchronous GLB loading
 // never leaves an invisible quest giver with a functional interaction.
 const npcMarkers=[];
 for(const id of HUNT_ORDER){
  const spot=spots[id];if(!spot)continue;
  const anchor=new THREE.Group();
  anchor.name='HIGHFLY_QUEST_NPC_'+id;
  anchor.position.set(spot.npc.x,spot.npc.y+.08,spot.npc.z);
  anchor.rotation.y=Math.atan2(spot.point.x-spot.npc.x,spot.point.z-spot.npc.z)+Math.PI;
  const fallback=new THREE.Mesh(new THREE.CapsuleGeometry(.32,1.17,3,8),
   new THREE.MeshBasicMaterial({color:0xae8aea,depthTest:true}));
  fallback.name='HIGHFLY_NPC_LOADING_'+id;fallback.position.y=.91;
  const billboard=npcBillboard(HUNT_MISSIONS[id].npc,HUNT_MISSIONS[id].role);
  billboard.position.y=2.45;billboard.material.depthTest=false;
  anchor.add(fallback,billboard);stage.add(anchor);
  spot.npcAnchor=anchor;spot.npcFallback=fallback;spot.npcBillboard=billboard;
  npcMarkers.push({anchor,fallback,billboard});
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
  let avatar=null;
  try{avatar=makeLicensedCreature(spot.id,species[spot.id]);}
  catch(error){console.error('[HIGHFLY P493] Enemy rig failed:',spot.id,error);}
  if(!avatar){
   game.enemies.list=game.enemies.list.filter(other=>other!==e);
   return null; // Never keep a combat hitbox with an invisible animal.
  }
  stage.add(avatar.root);
  spot.members.set(e,avatar);
  return e;
 }
 function purge(spot){
  for(const avatar of spot.members.values())disposeLicensedCreature(avatar);
  spot.members.clear();spot.launched=false;spot.respawnAt=0;
  game.enemies.list=game.enemies.list.filter(e=>e.group!=='hf49:'+spot.id);
 }
 async function loadKaykitNpcs(){
  try{
   const gltf=await new GLTFLoader().loadAsync(import.meta.env.BASE_URL+'models/hf-kaykit-knight.glb');
   if(disposed)return;
   const profile=stylizeUniversalKayKit(gltf);
   for(const [i,id] of HUNT_ORDER.entries()){
    const spot=spots[id];if(!spot)continue;
    const n=cloneSkeleton(gltf.scene);n.name='HIGHFLY_KAYKIT_NPC_'+id;
    const anchor=spot.npcAnchor;
    n.scale.setScalar(1.80/profile.naturalHeight);
    n.traverse(m=>{
     if(!m.isMesh)return;
     m.frustumCulled=false;
     if(/sword|shield|helmet|visor|cape|dagger|bow|staff/i.test(m.name))m.visible=false;
     const base=Array.isArray(m.material)?m.material[0]:m.material;
     const color=m.name.includes('Head')?0xffffff:[0xc6b6ff,0xe0b592,0x9ccfbe][i];
     m.material=new THREE.MeshBasicMaterial({map:base?.map??null,color,side:THREE.DoubleSide,
      transparent:!!base?.transparent,alphaTest:base?.alphaTest??0});
    });
    const box=new THREE.Box3().setFromObject(n);
    if(!Number.isFinite(box.min.y))throw Error('KayKit NPC bounding box invalid '+id);
    n.position.y-=box.min.y;
    anchor.add(n);spot.npcFallback.visible=false;
    const billboard=spot.npcBillboard;
    const idle=gltf.animations.find(a=>a.name==='Idle');
    const mixer=new THREE.AnimationMixer(n);
    if(idle)mixer.clipAction(idle).play();
    stage.add(anchor);npcActors.push({id,anchor,mixer,billboard,model:n});
   }
   console.info('[HIGHFLY P4.9] KayKit FREE CC0 NPCs',npcActors.length);
  }catch(e){console.warn('[HIGHFLY P4.9] NPC GLB loading failed; no hidden fake models',e);}
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
   if(distance<LOAD_RANGE&&!spot.launched&&species[spot.id]&&game.time>=spot.respawnAt){
    let created=0;
    for(let i=0;i<CAP;i++)if(spawnOne(spot,i))created++;
    spot.launched=created>0;
    if(!created){
     console.warn('[HIGHFLY P493] Spawn site has no safe visible rig:',spot.id);
     spot.respawnAt=game.time+6;
    }
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
  let closest=null,range=3.2;
  if(playing&&!dialogOpen&&!game.people?.talk){
   for(const spot of Object.values(spots)){
    const d=d2(hero.pos,spot.npc);
    if(d<range&&Math.abs(hero.pos.y-spot.npc.y)<3){closest=spot;range=d;}
   }
  }
  prompt.hidden=!closest;prompt.dataset.quest=closest?.id??'';
  if(closest)prompt.textContent='✦ USAR · '+HUNT_MISSIONS[closest.id].npc+' · '+HUNT_MISSIONS[closest.id].title;
  if(closest&&game.input.pressed?.has('interact')){
   game.input.pressed.delete('interact');speak(closest.id);
  }
  for(const npc of npcActors)if(d2(hero.pos,npc.anchor.position)<110)npc.mixer.update(Math.min(realDt,.05));
  if(!toast.hidden&&game.time>toastUntil)toast.hidden=true;
  return result;
 };
 prompt.addEventListener('click',()=>{const id=prompt.dataset.quest;if(id&&spots[id]&&d2(hero.pos,spots[id].npc)<3.2)speak(id);});
 const api={state,spots,missions:HUNT_MISSIONS,readyPromise,
  get loadedSpecies(){return Object.keys(species)},accept:id=>{const ok=acceptHunt(state,id);if(ok)persist();return ok;},
  progress:id=>state.missions[id]??null,closeDialog,
  get npcCount(){return npcActors.length;},
  get npcMarkers(){return npcMarkers.length;},
  get npcLoaded(){return npcActors.map(n=>n.id);},
  get spawnDiagnostics(){return Object.fromEntries(Object.entries(spots).map(([id,spot])=>[id,
   {placed:!!spot.npcAnchor,visual:!!npcActors.find(n=>n.id===id),active:spot.members.size}]))},
  get activeCount(){return Object.values(spots).reduce((v,s)=>v+[...s.members.keys()].filter(e=>e.alive).length,0)},
  dispose(){disposed=true;game.update=prior;closeDialog();prompt.remove();dialog.remove();toast.remove();
   for(const spot of Object.values(spots))purge(spot);
   for(const n of npcActors)n.mixer.stopAllAction();
   for(const n of npcMarkers){
    stage.remove(n.anchor);n.billboard.material.map.dispose();n.billboard.material.dispose();
    n.fallback.material.dispose();n.fallback.geometry.dispose();
   }
  }};
 game.__highflyHunts=api;globalThis.__highflyHunts=api;
 console.info('[HIGHFLY P4.9.1] CC0 animated wolf, boar and crab hunting spots registered',Object.keys(spots));
 return api;
}
