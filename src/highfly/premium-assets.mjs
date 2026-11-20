/** HIGHFLY PREMIUM v2: standalone, resolution-independent artwork per real RPG ID.
 *  F0.14.8 game/UI state still drives all interactivity. No screenshots used as UI.
 */
export const assetUrl=name=>import.meta.env.BASE_URL+'highfly/'+name+((name.startsWith('approved-')||/^premium\/(item_|skill_|profession_|quest_|character_sanctuary$|forge_workshop$)/.test(name))?'.webp':'.svg');
const ITEMS=new Set(['hp_potion','mp_potion','herb','ore','wood','fish','ingot','blade_blank','seed','bag_upgrade','training_sword','training_shield','training_greatsword']);
const SLOTS=new Set(['helmet','chest','gloves','right_hand','necklace','shoulders','pants','boots','left_hand','ring']);
const PROFS=new Set(['recoleccion','mineria','tala','pesca','cocina','alquimia','fundicion','forja']);
const SKILLS=new Set(['attack','dash','roll','heavy','pulse','heal']);
const QUESTS=new Set(['primary','scales','amber','kept','nine','answer','vellum2','count2','names','rings','vellum','count','seeds','stair','voices','lamps','water','debt','windfall']);
const ALIAS={health:'item_hp_potion',mana:'item_mp_potion',herb:'item_herb',ore:'item_ore',wood:'item_wood',fish:'item_fish',ingot:'item_ingot',blade:'item_blade_blank',weapon:'item_training_sword',shield:'item_training_shield',expansion:'item_bag_upgrade',armor:'slot_chest',ring:'slot_ring',helmet:'slot_helmet',gloves:'slot_gloves',boots:'slot_boots',forge:'profession_forja',food:'profession_cocina'};
const valid=id=>id.startsWith('item_')?ITEMS.has(id.slice(5)):id.startsWith('slot_')?SLOTS.has(id.slice(5)):id.startsWith('profession_')?PROFS.has(id.slice(11)):id.startsWith('skill_')?SKILLS.has(id.slice(6)):false;
export function premiumArt(name,large=false){
 const id=ALIAS[name]||name;
 if(!valid(id))return null;
 return '<img class="hf-rpg-art hf-premium-icon'+(large?' is-large':'')+'" data-hf-art-id="'+id+'" src="'+assetUrl('premium/'+id)+'" draggable="false" loading="eager" alt="" aria-hidden="true"/>';
}
const jobNames={'Recolección':'recoleccion','Minería':'mineria','Tala':'tala','Pesca':'pesca','Cocina':'cocina','Alquimia':'alquimia','Fundición':'fundicion','Forja':'forja'};
export const professionIcon=job=>'profession_'+(jobNames[job]||'recoleccion');
export const questArtUrl=id=>assetUrl('premium/quest_'+(QUESTS.has(id)?id:'primary'));
export const PREMIUM_IDS=Object.freeze({items:[...ITEMS],slots:[...SLOTS],professions:[...PROFS],skills:[...SKILLS],quests:[...QUESTS]});
export const PLEDGE='48 recursos WebP originales independientes, con slots y navegación SVG. La lógica sigue en DOM/Canvas de F0.14.8.';
