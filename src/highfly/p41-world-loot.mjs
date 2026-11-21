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
  stage.remove(drop.sprite);
  drop.sprite.material.dispose();
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
  const itemId=boss?'training_shield':/hound|wolf|beast/.test(kind)?'leather':'ore';
  const rarity=boss?'Raro':'Común';
  const art=getTexture(itemId);
  if(!art)return;
  const material=new THREE.SpriteMaterial({map:art,color:0xffffff,transparent:true,depthWrite:false,alphaTest:.06});
  const sprite=new THREE.Sprite(material);
  const x=Number(enemy.pos.x),y=Number(enemy.pos.y),z=Number(enemy.pos.z);
  if(![x,y,z].every(Number.isFinite)){material.dispose();return;}
  const base=Math.max(y,Number(game.world?.groundHeight?.(x,z))||y)+.86;
  sprite.position.set(x,base,z);
  sprite.scale.set(1.18,1.18,1);
  sprite.renderOrder=12;
  stage.add(sprite);
  drops.push({id:itemId,rarity,count:1,x,y:base,z,sprite,phase:drops.length*.72});
  while(drops.length>16)release(drops[0]);
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
    for(const drop of drops){
     drop.sprite.position.y=drop.y+Math.sin(ticker()*2+drop.phase)*.13;
     const dx=drop.x-player.pos.x,dz=drop.z-player.pos.z;
     const d=dx*dx+dz*dz;
     if(d<dist&&Math.abs(drop.y-player.pos.y)<3.5){dist=d;nearest=drop;}
    }
    if(nearest){
     label.textContent='✦ USAR · RECOGER '+(nearest.id==='leather'?'CUERO DE CRIATURA':nearest.id==='ore'?'MINERAL':'ESCUDO RARO +0');
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
 const api={drops,get active(){return drops.length},dispose(){
  game.update=originalUpdate;while(drops.length)release(drops[0]);
  for(const tex of cache.values())tex.dispose();
  label.remove();notice.remove();
 }};
 game.__hfP41WorldLoot=api;
 return api;
}
