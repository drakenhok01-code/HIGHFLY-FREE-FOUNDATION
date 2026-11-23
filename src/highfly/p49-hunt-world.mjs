/** HIGHFLY P4.9: THREE controlled live hunting spots, KayKit FREE CC0
 * quest NPCs, real native combat, hand-in and persisting character experience.
 * Installed as an additive layer, never alters Unsung's original encounters.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {stylizeUniversalKayKit} from './stylize-kaykit-free.mjs';
import {KINDS} from '../game/enemies.js';
import {saveRpgState} from './rpg-core.mjs';
import {HUNT_SAVE_KEY,HUNT_ORDER,HUNT_MOBS,HUNT_MISSIONS,createHuntState,
 gainHuntXp,acceptHunt,recordHuntKill,turnInHunt,xpRequired} from './p49-hunt-data.mjs';
import './p49-hunts.css';

const CAP=3, LOAD_RANGE=125, UNLOAD_RANGE=165, RESP_COOLDOWN=23;
const sphere=new THREE.SphereGeometry(1,9,7),cone=new THREE.ConeGeometry(1,1,7);
const cylinder=new THREE.CylinderGeometry(1,1,1,7);
const palette={
 wolf:{body:0x8b969f,head:0x9aa7ad,detail:0xe5e8dd,dark:0x293544},
 boar:{body:0x785142,head:0x94614a,detail:0xefddbd,dark:0x33201d},
 crab:{body:0xb65e50,head:0xd2785d,detail:0xffb987,dark:0x29373c}
};
const d2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const safeNumber=v=>Number.isFinite(v)?v:null;

function animal(type){
 const color=palette[type],root=new THREE.Group();root.name='HIGHFLY_'+type.toUpperCase()+'_ORIGINAL_LOW_POLY';
 const mats={};for(const [id,c] of Object.entries(color))mats[id]=new THREE.MeshBasicMaterial({color:c});
 const add=(mat,geo,x,y,z,sx,sy,sz,rz=0)=>{
  const m=new THREE.Mesh(geo,mats[mat]);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.z=rz;root.add(m);return m;
 };
 if(type==='wolf'||type==='boar'){
  const boar=type==='boar';
  add('body',sphere,0,.70,0,boar?.72:.56,boar?.53:.39,boar?.92:.83);
  add('head',sphere,0,boar?.86:1.02,.76,boar?.48:.39,boar?.39:.36,boar?.42:.43);
  add('dark',sphere,0,boar?.77:.94,1.13,boar?.32:.25,boar?.20:.16,.20);
  for(const x of [-.36,.36])for(const z of [-.59,.57]){
   add('body',cylinder,x,.31,z,.13,.59,.14);
   add('dark',sphere,x,.075,z,.155,.075,.17);
  }
  for(const x of [-.27,.27]){
   if(boar){
    add('detail',cone,x,.83,1.08,.10,.27,.10,x>0?-.65:.65);
    add('dark',sphere,x,1.03,1.115,.048,.05,.045);
   }else{
    add('head',cone,x,1.39,.77,.15,.36,.14);
    add('dark',sphere,x,1.05,1.135,.048,.052,.05);
   }
  }
  add('body',cone,0,.92,-.84,.17,.45,.20,Math.PI/2);
 }else{
  add('body',sphere,0,.60,0,.79,.35,.66);
  add('head',sphere,0,.69,.42,.56,.26,.45);
  add('detail',sphere,0,.82,.12,.51,.17,.48);
  for(const side of [-1,1]){
   for(let i=0;i<3;i++){
    add('body',cylinder,side*(.62+i*.17),.37,(i-1)*.31,.085,.64,.085,side*(.6+i*.17));
   }
   add('body',sphere,side*1.02,.64,.37,.23,.18,.23);
   add('head',cone,side*1.24,.77,.59,.19,.48,.18,side*.74);
   add('dark',cylinder,side*.28,1.02,.52,.045,.33,.045);
   add('detail',sphere,side*.28,1.20,.52,.085,.085,.08);
  }
 }
 return {root,mats};
}
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
 let toastUntil=0,dialogOpen=null,npcActors=[],disposed=false;
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
  if(!pos||Math.abs(pos.y-base.y)>7)return null;
  const e=game.enemies.spawn(HUNT_MOBS[spot.id].kind,x,z,'hf49:'+spot.id,null,base.y);
  if(!Number.isFinite(e?.pos?.y))return null;
  const avatar=animal(spot.id);stage.add(avatar.root);
  spot.members.set(e,avatar);
  return e;
 }
 function purge(spot){
  for(const [e,avatar] of spot.members){stage.remove(avatar.root);
   for(const m of Object.values(avatar.mats))m.dispose();}
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
    const anchor=new THREE.Group();anchor.position.set(spot.npc.x,spot.npc.y,spot.npc.z);
    anchor.rotation.y=(Math.atan2(spot.point.x-spot.npc.x,spot.point.z-spot.npc.z)+Math.PI);
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
    anchor.add(n);
    const billboard=npcBillboard(HUNT_MISSIONS[id].npc,HUNT_MISSIONS[id].role);
    billboard.position.y=2.35;anchor.add(billboard);
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
   if(distance<LOAD_RANGE&&!spot.launched){
    for(let i=0;i<CAP;i++)spawnOne(spot,i);
    spot.launched=true;
   }
   if(spot.launched){
    for(const [enemy,avatar] of [...spot.members]){
     if(!enemy.alive){avatar.root.visible=false;continue;}
     avatar.root.visible=distance<LOAD_RANGE;
     avatar.root.position.copy(enemy.pos);avatar.root.rotation.y=enemy.yaw;
     // Light gait movement, never detached from actual native enemy collision.
     avatar.root.position.y+=Math.sin(game.time*4+enemy.seed*5)*.025;
    }
    const active=[...spot.members.keys()].filter(e=>e.alive).length;
    if(active<CAP&&game.time>=spot.respawnAt){
     for(const [enemy,avatar] of [...spot.members])if(!enemy.alive){
      stage.remove(avatar.root);for(const m of Object.values(avatar.mats))m.dispose();
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
 const api={state,spots,missions:HUNT_MISSIONS,accept:id=>{const ok=acceptHunt(state,id);if(ok)persist();return ok;},
  progress:id=>state.missions[id]??null,closeDialog,
  get npcCount(){return npcActors.length;},
  get activeCount(){return Object.values(spots).reduce((v,s)=>v+[...s.members.keys()].filter(e=>e.alive).length,0)},
  dispose(){disposed=true;game.update=prior;closeDialog();prompt.remove();dialog.remove();toast.remove();
   for(const spot of Object.values(spots))purge(spot);
   for(const n of npcActors){stage.remove(n.anchor);n.mixer.stopAllAction();
    n.billboard.material.map.dispose();n.billboard.material.dispose();}
  }};
 game.__highflyHunts=api;globalThis.__highflyHunts=api;
 console.info('[HIGHFLY P4.9] 3 controlled hunting spots and 3 offline quests registered',Object.keys(spots));
 return api;
}
