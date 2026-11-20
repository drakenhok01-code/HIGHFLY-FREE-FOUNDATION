/** HIGHFLY individual icon registry: each game ID maps to one transparent SVG.
 * F0.14.8 frozen raster/background assets stay unchanged.
 */
import {premiumVectorArt} from './premium-vector-art.mjs';
export const SPRITE_COLS=6,SPRITE_ROWS=2;
export const ICONS=Object.freeze({health:0,mana:1,herb:2,ore:3,wood:4,weapon:5,shield:6,armor:7,ring:8,bag:9,skills:10,forge:11});
export const assetUrl=name=>import.meta.env.BASE_URL+'highfly/'+name+(name.startsWith('approved-')?'.webp':'.svg');
const aliases={health:'item_hp_potion',mana:'item_mp_potion',herb:'item_herb',ore:'item_ore',wood:'item_wood',fish:'item_fish',ingot:'item_ingot',blade:'item_blade_blank',weapon:'item_training_sword',shield:'item_training_shield',expansion:'item_bag_upgrade',ring:'slot_ring',armor:'slot_chest',helmet:'slot_helmet',gloves:'slot_gloves',boots:'slot_boots'};
export function premiumArt(name,large=false){
 const key=name.startsWith('item_')||name.startsWith('slot_')||name.startsWith('profession_')?name:(aliases[name]||'item_'+name);
 const svg=premiumVectorArt(key,large);
 if(svg)return svg;
 const i=ICONS[name];if(i===undefined)return null;
 const x=i%SPRITE_COLS,y=Math.floor(i/SPRITE_COLS);
 return '<span class="hf-rpg-art hf-rpg-sprite'+(large?' is-large':'')+'" role="img" aria-label="'+name+'" style="--hf-sprite-x:'+(100*x/5)+'%;--hf-sprite-y:'+(100*y)+'%"></span>';
}
export const PLEDGE='Iconos SVG vectoriales originales por ID: marco/interacción/textos del juego, no de capturas';