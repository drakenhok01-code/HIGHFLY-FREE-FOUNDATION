/** HIGHFLY visual asset registry.
 * Original scalable SVG interpretations of the HIGHFLY approved iconography.
 * The sprite atlas is one lightweight SVG; all menu elements remain real HTML.
 */
import {extraPremiumIcon} from './premium-extra-art.mjs';
export const SPRITE_COLS=6,SPRITE_ROWS=2;
export const ICONS=Object.freeze({
 health:0,mana:1,herb:2,ore:3,wood:4,weapon:5,shield:6,armor:7,
 ring:8,bag:9,skills:10,forge:11
});
export const assetUrl=name=>(import.meta.env?.BASE_URL??'/')+'highfly/'+name+(name.startsWith('approved-')?'.webp':name.startsWith('premium-')?'.avif':'.svg');
/** Index in approved 5x4 original HIGHFLY artwork atlas. No invented item state. */
export const PREMIUM_ATLAS=Object.freeze({
 'skill-attack':0,'skill-dash':1,'skill-roll':2,'skill-heavy':3,'skill-pulse':4,'skill-heal':5,
 herb:6,ore:7,wood:8,fish:9,food:10,'mana-prof':11,ingot:12,'forge-pro':13,
 health:14,mana:15,expansion:16,weapon:17,blade:17,shield:18,greatsword:19
});
export function premiumArt(name,large=false){
 const premium=PREMIUM_ATLAS[name];
 if(premium!==undefined){
  const x=100*(premium%5)/4,y=100*Math.floor(premium/5)/3;
  const potion=name==='health'||name==='mana';
  return '<span class="hf-rpg-art hf-rpg-premium-icon'+(potion?' hf-rpg-potion-approved':'')+(large?' is-large':'')+'" data-hf-premium-icon="'+name+'" role="img" aria-label="'+name+'" style="--hf-atlas-x:'+x+'%;--hf-atlas-y:'+y+'%"></span>';
 }
 if(name==='health'||name==='mana')
  return '<span role="img" aria-label="'+(name==='health'?'Poción de Vida':'Poción de Maná')+'" class="hf-rpg-art hf-rpg-potion-approved '+(name==='health'?'is-health':'is-mana')+(large?' is-large':'')+'"></span>';
 const extra=extraPremiumIcon(name,large);if(extra)return extra;
 const index=ICONS[name];
 if(index===undefined)return null;
 const x=index%SPRITE_COLS,y=Math.floor(index/SPRITE_COLS);
 const style='--hf-sprite-x:'+(100*x/(SPRITE_COLS-1))+'%;--hf-sprite-y:'+(100*y/(SPRITE_ROWS-1))+'%';
 return '<span class="hf-rpg-art hf-rpg-sprite'+(large?' is-large':'')+'" role="img" aria-label="'+name+'" style="'+style+'"></span>';
}
export const PLEDGE='Dibujos SVG originales basados en la dirección HIGHFLY aprobada, sin copiar material ajeno';
