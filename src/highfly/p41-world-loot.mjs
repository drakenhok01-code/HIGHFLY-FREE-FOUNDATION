/** HIGHFLY P4.1 World drops — real native Unsung enemy deaths; no external
 * ClaudeCraft media. Collect with game interact / mobile USAR when nearby.
 * Transparent 256px icons are sourced only from approved HIGHFLY pack.
 * This module wraps update without replacing combat, enemies or physics.
 */
import * as THREE from 'three';
import {userIconUrl} from './premium-assets.mjs';
import {receiveP41WorldPickup} from './p41-loot.mjs';
import {saveRpgState} from './rpg-core.mjs';

const GRADES={Común:0xEAF3FF,'Poco común':0x2EFF80,Raro:0x168EFF,Épico:0xBA40FF,Legendario:0xFFB332,Mítico:0xFF324C};
export function installP41WorldLoot(game,bag,getProfession,onUpdate=()=>{}){
 if(!game||game.__hfP41WorldLoot)return game?.__hfP41WorldLoot??null;
 const stage=game.pipe?.sceneT??game.pipe?.scene;
 if(!stage||!game.on||!game.update)return null;
 const loader=new THREE.TextureLoader(),cache=new Map(),drops=[];
 const label=document.createElement('div');label.id='hf-p41-pickup-prompt';label.hidden=true;
 document.body.appendChild(label);
 const notice=document.createElement('div');notice.id='hf-p41-world-toast';notice.hidden=true;
 document.body.appendChild(notice);
 let noticeUntil=0;
 const ticker=()=>game.time||0;
 function msg(text){
  notice.textContent=text;notice.hidden=false;noticeUntil=ticker()+2.8;
 }
 function release(drop){
  if(!drop)return;
  if(drop.sprite){stage.remove(drop.sprite);drop.sprite.material.dispose();}
  if(drop.avatar){drop.avatar.corpseLootPending=false;drop.avatar.corpseLootUntil=0;}
  const i=drops.indexOf(drop);if(i>=0)drops.splice(i,1);
 }
 function getTexture(id){
  const url=userIconUrl('item_'+id);
  if(!url)return null;
  if(!cache.has(id)){
   const tex=loader.load(url);
   tex.colorSpace=THREE.SRGBColorSpace;
   cache.set(id,tex);
  }
  return cache.get(id);
 }
 function spawn(enemy){
  if(!enemy||!enemy.pos)return;
  const boss=!!enemy.def?.boss;
  const kind=String(enemy.kind??'').toLowerCase();
  // Unique HIGHFLY P4.9 species drops; legacy Unsung foes keep their old behavior.
  const special={'hf_wolf':'wolf_pelt','hf_boar':'boar_tusk','hf_crab':'crab_shell'};
  const itemId=special[kind]??(boss?'training_shield':/hound|wolf|beast/.test(kind)?'leather':'ore');
  const rarity=boss?'Raro':'Común';
  const wildlife=Object.prototype.hasOwnProperty.call(special,kind);
  const avatar=wildlife?game.__highflyHunts?.avatarFor?.(enemy):null;
  // Fail closed: no unsupported fake purple orb / a floating wolf pelt when
  // the actual Quaternius animal rig failed to load.
  if(wildlife&&!avatar){console.error('[HIGHFLY CORPSE] No real CC0 animal model for',kind);return;}
  const x=Number(enemy.pos.x),y=Number(enemy.pos.y),z=Number(enemy.pos.z);
  if(![x,y,z].every(Number.isFinite))return;
  let sprite=null;
  const base=Math.max(y,Number(game.world?.groundHeight?.(x,z))||y)+(wildlife ? .20 : .86);
  if(wildlife){
   avatar.corpseLootPending=true;
   avatar.corpseLootUntil=ticker()+60;
  }else{
   const art=getTexture(itemId);if(!art)return;
   const material=new THREE.SpriteMaterial({map:art,color:0xffffff,transparent:true,depthWrite:false,alphaTest:.06});
   sprite=new THREE.Sprite(material);
   sprite.position.set(x,base,z);sprite.scale.set(1.05,1.05,1);sprite.renderOrder=12;stage.add(sprite);sprite.updateMatrixWorld(true);
  }
  drops.push({id:itemId,rarity,count:1,x,y:base,z,sprite,avatar:avatar??null,
   expires:ticker()+(wildlife?60:32),phase:drops.length*.72});
  // Never scatter eight visual items in one spot: all three hunting corpses
  // stay single-interaction bodies. Legacy Unsung markers are capped to 4.
  const visual=drops.filter(d=>!!d.sprite);
  while(visual.length>4){const oldest=visual.shift();release(oldest);}
  while(drops.length>15)release(drops[0]);
 }
 const seen=new WeakSet();
 game.on((type,event)=>{
  if(type!=='enemy'||event?.type!=='death'||game.cine||!event.enemy||seen.has(event.enemy))return;
  seen.add(event.enemy);
  try{spawn(event.enemy)}catch(e){console.warn('[HIGHFLY P41 world loot]',e)}
 });
 const originalUpdate=game.update;
 game.update=function(realDt){
  const result=originalUpdate.call(this,realDt);
  try{
   const player=game.player;
   if(!player||game.state!=='playing'||game.cine||player.state==='dead'){
    label.hidden=true;
   }else{
    let nearest=null,dist=2.7*2.7;
    for(const drop of [...drops]){
     if(ticker()>=drop.expires){release(drop);continue;}
     if(drop.sprite){
      drop.sprite.position.y=drop.y+Math.sin(ticker()*2+drop.phase)*.13;
      drop.sprite.updateMatrixWorld(true);
     }
     const dx=drop.x-player.pos.x,dz=drop.z-player.pos.z;
     const d=dx*dx+dz*dz;
     if(d<dist&&Math.abs(drop.y-player.pos.y)<3.5){dist=d;nearest=drop;}
    }
    if(nearest){
     const labelNames={leather:'CUERO DE CRIATURA',ore:'MINERAL',wolf_pelt:'PIEL DE LOBO',boar_tusk:'COLMILLO DE JABALÍ',crab_shell:'CAPARAZÓN DE CANGREJO'};
     label.textContent=nearest.avatar?'✦ USAR · SAQUEAR '+(labelNames[nearest.id]??'CRIATURA'):
      '✦ USAR · RECOGER '+(labelNames[nearest.id]??'ESCUDO RARO +0');
     label.hidden=false;
     if(game.input?.pressed?.has('interact')){
      const result=receiveP41WorldPickup(bag,getProfession(),nearest);
      if(result.ok){
       saveRpgState(bag);
       msg('✦ Obtenido: '+result.name+' · '+result.rarity+' +0');
       release(nearest);
       onUpdate();
      }else msg(result.reason);
     }
    }else label.hidden=true;
   }
   if(!notice.hidden&&ticker()>noticeUntil)notice.hidden=true;
  }catch(e){console.warn('[HIGHFLY P41 world pickup]',e)}
  return result;
 };
 const api={drops,get active(){return drops.length},get corpses(){return drops.filter(d=>!!d.avatar).length},dispose(){
  game.update=originalUpdate;while(drops.length)release(drops[0]);
  for(const tex of cache.values())tex.dispose();
  label.remove();notice.remove();
 }};
 game.__hfP41WorldLoot=api;
 return api;
}
