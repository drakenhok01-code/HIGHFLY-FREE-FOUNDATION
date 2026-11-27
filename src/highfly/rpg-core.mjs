/** HIGHFLY F0.14 - shared RPG domain. Real inventory and Player only.
 * Item definitions and UI assets are original HIGHFLY code, not imported media.
 * 80/20 applies to earned BASE points; equipped item bonuses are independent.
 */
import {EQUIP_ITEM_DEFS,normalizeEquipped} from './rpg-equipment.mjs';
import {normalizeGearTraits,registerCraftedGear} from './rpg-itemization.mjs';
import {inventoryStackRows,occupiedBagSlots,bagCapacityStatus,combinedCounts,perSlotLimit} from './rpg-bag-capacity.mjs';
export const SAVE_KEY='highfly-rpg-f014-v1';
export const SKILL_SLOT_COUNT=6;
export const DEFAULT_SKILL_SLOTS=Object.freeze(['pulse','heavy','heal',null,null,null]);
/** All 36 grid slots exist even before any item is collected. */
export const MAX_BAG_SLOTS=36;
export const MAX_EXPANDED_BAG_SLOTS=72;
export const BAG_EXPANSION_INCREMENT=12;
export function bagSlots(items=[],capacity=MAX_BAG_SLOTS){
 return Array.from({length:Math.max(1,Math.floor(capacity))},(_,i)=>items[i]??null);
}
export const ITEM_DEFS=Object.freeze({
 ...EQUIP_ITEM_DEFS,
 hp_potion:{id:'hp_potion',name:'Poción de Vida',kind:'Consumibles',icon:'health',rarity:'Poco común',description:'Recupera el 35% de la Vida máxima.',max:99},
 mp_potion:{id:'mp_potion',name:'Poción de Maná',kind:'Consumibles',icon:'mana',rarity:'Poco común',description:'Recupera el 40% del Maná máximo.',max:99},
 herb:{id:'herb',name:'Hierbas recolectadas',kind:'Materiales',icon:'herb',rarity:'Común',description:'Hierbas obtenidas mediante recolección real.',max:999},
 ore:{id:'ore',name:'Mineral',kind:'Materiales',icon:'ore',rarity:'Común',description:'Mineral conseguido de una veta real.',max:999},
 leather:{id:'leather',name:'Cuero de criatura',kind:'Materiales',icon:'leather',rarity:'Común',description:'Material obtenido de criaturas derrotadas.',max:999},
 wolf_pelt:{id:'wolf_pelt',name:'Piel de lobo',kind:'Materiales',icon:'wolf_pelt',rarity:'Común',description:'Piel curtible obtenida de los lobos del bosque.',max:999},
 boar_tusk:{id:'boar_tusk',name:'Colmillo de jabalí',kind:'Materiales',icon:'boar_tusk',rarity:'Común',description:'Colmillo resistente para artesanía y encargos del gremio.',max:999},
 crab_shell:{id:'crab_shell',name:'Caparazón de cangrejo',kind:'Materiales',icon:'crab_shell',rarity:'Común',description:'Material duro recogido en la orilla; útil para artesanía futura.',max:999},
 stone:{id:'stone',name:'Piedra común',kind:'Materiales',icon:'ore',rarity:'Común',description:'Piedra recogida de afloramientos y pilas de roca.',max:999},
 wood:{id:'wood',name:'Madera',kind:'Materiales',icon:'wood',rarity:'Común',description:'Madera talada en el mundo.',max:999},
 fish_river:{id:'fish_river',name:'Pez de río',kind:'Materiales',icon:'fish',rarity:'Común',description:'Captura de agua dulce.',max:999},
 fish_coast:{id:'fish_coast',name:'Pez costero',kind:'Materiales',icon:'fish',rarity:'Poco común',description:'Captura del litoral.',max:999},
 fish:{id:'fish',name:'Pescado',kind:'Materiales',icon:'fish',rarity:'Común',description:'Captura obtenida con caña.',max:999},
 ingot:{id:'ingot',name:'Lingote de hierro',kind:'Materiales',icon:'ingot',rarity:'Común',description:'Lingote básico compatible con recetas iniciales. Los metales especiales tienen sus lingotes propios.',max:999},
 blade_blank:{id:'blade_blank',name:'Hoja sin terminar',kind:'Materiales',icon:'blade',rarity:'Común',description:'Pieza forjada, todavía no equipable.',max:999},
 seed:{id:'seed',name:'Semillas',kind:'Materiales',icon:'herb',rarity:'Común',description:'Semillas para plantar.',max:999},
 bag_upgrade:{id:'bag_upgrade',name:'Sello de Expansión',kind:'Especial',icon:'expansion',rarity:'Raro',description:'Amplía la capacidad permanente de la Bolsa en 12 casillas, hasta un máximo de 72.',max:3},
 ingot_copper:{id:'ingot_copper',name:'Lingote de cobre',kind:'Materiales',icon:'ingot',rarity:'Común',description:'Metal refinado: cobre.',max:999},
 ingot_iron:{id:'ingot_iron',name:'Lingote de hierro',kind:'Materiales',icon:'ingot',rarity:'Común',description:'Metal refinado: hierro.',max:999},
 ingot_silver:{id:'ingot_silver',name:'Lingote de plata',kind:'Materiales',icon:'ingot',rarity:'Común',description:'Metal refinado: plata.',max:999},
 ingot_gold:{id:'ingot_gold',name:'Lingote de oro',kind:'Materiales',icon:'ingot',rarity:'Común',description:'Metal refinado: oro.',max:999},
 ore_copper:{id:'ore_copper',name:'Mineral de cobre',kind:'Materiales',icon:'ore',rarity:'Común',description:'Cobre extraído de una veta.',max:999},
 ore_iron:{id:'ore_iron',name:'Mineral de hierro',kind:'Materiales',icon:'ore',rarity:'Común',description:'Hierro bruto extraído.',max:999},
 coal:{id:'coal',name:'Carbón de forja',kind:'Materiales',icon:'ore',rarity:'Común',description:'Combustible y carbono para acero.',max:999},
 ore_silver:{id:'ore_silver',name:'Mineral de plata',kind:'Materiales',icon:'ore',rarity:'Común',description:'Plata extraída y sin refinar.',max:999},
 ore_gold:{id:'ore_gold',name:'Mineral de oro',kind:'Materiales',icon:'ore',rarity:'Común',description:'Oro extraído y sin refinar.',max:999},
 raw_diamond:{id:'raw_diamond',name:'Diamante en bruto',kind:'Materiales',icon:'ore',rarity:'Común',description:'Cristal sin tallar de veta profunda.',max:999},
 raw_obsidian:{id:'raw_obsidian',name:'Obsidiana en bruto',kind:'Materiales',icon:'ore',rarity:'Común',description:'Vidrio volcánico de origen natural.',max:999},
 ore_mithril:{id:'ore_mithril',name:'Mineral de mitrilo',kind:'Materiales',icon:'ore',rarity:'Común',description:'Mena fantástica de mitrilo.',max:999},
 ingot_steel:{id:'ingot_steel',name:'Lingote de acero',kind:'Materiales',icon:'ingot',rarity:'Común',description:'Aleación de hierro con carbono.',max:999},
 ingot_diamond:{id:'ingot_diamond',name:'Lingote de diamante',kind:'Materiales',icon:'ingot',rarity:'Común',description:'Diamante refinado y compactado para fabricar equipamiento HIGHFLY.',max:999},
 ingot_obsidian:{id:'ingot_obsidian',name:'Lingote de obsidiana',kind:'Materiales',icon:'ingot',rarity:'Común',description:'Obsidiana refinada para equipamiento especial HIGHFLY.',max:999},
 ingot_mithril:{id:'ingot_mithril',name:'Lingote de mitrilo',kind:'Materiales',icon:'ingot',rarity:'Común',description:'Metal fantástico de alta calidad.',max:999},
 upgrade_stone:{id:'upgrade_stone',name:'Piedra de mejora menor',kind:'Materiales',icon:'ore',rarity:'Raro',description:'Refuerza el equipo desde +0 hasta +6. Los porcentajes de éxito definitivos se definirán más adelante.',max:999},
 upgrade_stone_advanced:{id:'upgrade_stone_advanced',name:'Piedra de mejora superior',kind:'Materiales',icon:'ore',rarity:'Épico',description:'Refuerzo avanzado para pasar de +6 a +7, de +7 a +8 y de +8 a +9. Tasas de éxito pendientes de definir.',max:999},
 ascension_core:{id:'ascension_core',name:'Núcleo de Ascensión',kind:'Especial',icon:'ore',rarity:'Épico',description:'Sube la rareza de un objeto +9, reiniciándolo a +0.',max:99}
});
export const RECIPES=Object.freeze({
 hp_potion:{item:'hp_potion',name:'Poción de Vida',ingredients:{herb:2},count:1,profession:'Alquimia'},
 mp_potion:{item:'mp_potion',name:'Poción de Maná',ingredients:{herb:1,ore:1},count:1,profession:'Alquimia'},
 bag_upgrade:{item:'bag_upgrade',name:'Sello de Expansión',ingredients:{wood:8,ore:8},count:1,profession:'Marroquinería'},
 training_sword:{item:'training_sword',name:'Espada de Aprendiz',ingredients:{ingot:2,wood:1},count:1,profession:'Forja'},
 training_shield:{item:'training_shield',name:'Escudo de Aprendiz',ingredients:{ingot:2,wood:2},count:1,profession:'Forja'},
 training_greatsword:{item:'training_greatsword',name:'Mandoble de Aprendiz',ingredients:{ingot:4,wood:2},count:1,profession:'Forja'},
 ingot_copper:{item:'ingot_copper',name:'Lingote de cobre',ingredients:{ore_copper:2},count:3,profession:'Fundición'},
 ingot_iron:{item:'ingot_iron',name:'Lingote de hierro',ingredients:{ore_iron:3},count:3,profession:'Fundición'},
 ingot_silver:{item:'ingot_silver',name:'Lingote de plata',ingredients:{ore_silver:5},count:3,profession:'Fundición'},
 ingot_gold:{item:'ingot_gold',name:'Lingote de oro',ingredients:{ore:8},count:3,profession:'Fundición'},
 refine_copper:{item:'ingot_copper',name:'Lingote de cobre',ingredients:{ore_copper:2},count:3,profession:'Fundición'},
 refine_iron:{item:'ingot_iron',name:'Lingote de hierro',ingredients:{ore_iron:3},count:3,profession:'Fundición'},
 refine_silver:{item:'ingot_silver',name:'Lingote de plata',ingredients:{ore_silver:3},count:3,profession:'Fundición'},
 refine_gold:{item:'ingot_gold',name:'Lingote de oro',ingredients:{ore_gold:4},count:3,profession:'Fundición'},
 ingot_steel:{item:'ingot_steel',name:'Lingote de acero',ingredients:{ingot_iron:2,coal:2},count:3,profession:'Fundición'},
 ingot_diamond:{item:'ingot_diamond',name:'Lingote de diamante',ingredients:{raw_diamond:3},count:3,profession:'Fundición'},
 ingot_obsidian:{item:'ingot_obsidian',name:'Lingote de obsidiana',ingredients:{raw_obsidian:3},count:3,profession:'Fundición'},
 ingot_mithril:{item:'ingot_mithril',name:'Lingote de mitrilo',ingredients:{ore_mithril:5},count:3,profession:'Fundición'},
 upgrade_stone:{item:'upgrade_stone',name:'Piedra de mejora menor',ingredients:{ore:2,ingot:1},count:1,profession:'Forja'},
 upgrade_stone_advanced:{item:'upgrade_stone_advanced',name:'Piedra de mejora superior',ingredients:{upgrade_stone:3,ingot_mithril:1,ore_gold:2},count:1,profession:'Forja'},
 ascension_core:{item:'ascension_core',name:'Núcleo de Ascensión',ingredients:{ore:6,ingot:3},count:1,profession:'Forja'}
});
const bounded=(n,max=999)=>Number.isInteger(n)?Math.max(0,Math.min(max,n)):0;
export function normalizeRpgState(raw){
 const counts=raw&&typeof raw==='object'&&raw.items&&typeof raw.items==='object'?raw.items:{};
 const items={hp_potion:bounded(counts.hp_potion??2,72*99),mp_potion:bounded(counts.mp_potion??2,72*99)};
 for(const [id,def] of Object.entries(ITEM_DEFS))if(id!=='hp_potion'&&id!=='mp_potion'&&id in counts)
  items[id]=bounded(counts[id],MAX_EXPANDED_BAG_SLOTS*perSlotLimit(def));
 // Saved generic ingots become a typed material; no legacy item lost.
 if((items.ingot??0)>0){items.ingot_iron=bounded((items.ingot_iron??0)+items.ingot,MAX_EXPANDED_BAG_SLOTS*perSlotLimit(ITEM_DEFS.ingot_iron));delete items.ingot;}
 const slots=Number.isInteger(raw?.slots)?Math.min(MAX_EXPANDED_BAG_SLOTS,Math.max(MAX_BAG_SLOTS,raw.slots)):MAX_BAG_SLOTS;
 const equipped=normalizeEquipped(raw?.equipped,true);
 const skills=Array.isArray(raw?.skillSlots)?raw.skillSlots:DEFAULT_SKILL_SLOTS;
 const skillSlots=Array.from({length:SKILL_SLOT_COUNT},(_,i)=>typeof skills[i]==='string'&&SKILL_IDS.includes(skills[i])?skills[i]:null);
 return {schema:4,items,slots,equipped,skillSlots,coins:bounded(raw?.coins??0,100000000),gearTraits:normalizeGearTraits(raw?.gearTraits,items,equipped)};
}
export function loadRpgState(store=globalThis.localStorage){
 try{return normalizeRpgState(JSON.parse(store?.getItem(SAVE_KEY)||'null'));}catch{return normalizeRpgState(null);}
}
export function saveRpgState(state,store=globalThis.localStorage){
 try{store?.setItem(SAVE_KEY,JSON.stringify(normalizeRpgState(state)));return true;}catch{return false;}
}
export function consumeBagUpgrade(state){
 if(!state||!(state.items?.bag_upgrade>0))return {ok:false,reason:'Necesitás un Sello de Expansión'};
 const current=Number(state.slots)||MAX_BAG_SLOTS;
 if(current>=MAX_EXPANDED_BAG_SLOTS)return {ok:false,reason:'Bolsa ya ampliada al máximo'};
 state.items.bag_upgrade--;state.slots=Math.min(MAX_EXPANDED_BAG_SLOTS,current+BAG_EXPANSION_INCREMENT);
 return {ok:true,slots:state.slots,remaining:state.items.bag_upgrade};
}
export function inventoryRows(state,professionInventory={}){
 return inventoryStackRows(state?.items,professionInventory,ITEM_DEFS,state?.gearTraits?.bag);
}
export function occupiedInventorySlots(state,professionInventory={}){
 return occupiedBagSlots(state?.items,professionInventory,ITEM_DEFS,state?.gearTraits?.bag);
}
export function distinctInventoryItems(state,professionInventory={}){
 return Object.keys(combinedCounts(state?.items,professionInventory)).filter(id=>ITEM_DEFS[id]).length;
}
export function inventoryCapacity(state,professionInventory={}){
 return bagCapacityStatus(state?.items,professionInventory,ITEM_DEFS,Number(state?.slots)||MAX_BAG_SLOTS,state?.gearTraits?.bag);
}
export function spendPotion(state,player,id){
 const item=ITEM_DEFS[id];
 if(!item||!['hp_potion','mp_potion'].includes(id))return {ok:false,reason:'Objeto no consumible'};
 if(!player||player.state==='dead'||!Number.isFinite(state?.items?.[id])||state.items[id]<1)
  return {ok:false,reason:'No tenés esa poción'};
 const life=id==='hp_potion';
 const k=life?'health':'_hfMana',maxK=life?'healthMax':'_hfManaMax';
 const max=Number(player[maxK]),current=Number(player[k]);
 if(!Number.isFinite(max)||!Number.isFinite(current)||max<=0||current>=max-.01)
  return {ok:false,reason:life?'La Vida ya está completa':'El Maná ya está completo'};
 const restored=Math.min(max-current,Math.ceil(max*(life?.35:.40)));
 player[k]=Math.min(max,current+restored);
 state.items[id]--;
 return {ok:true,restored,remaining:state.items[id],resource:life?'Vida':'Maná'};
}
// 'ingot' is a hidden save-compatible alias of iron; both pools can be used
// without losing old profession progress or duplicating the displayed item.
export const ownedMaterialCount=(id,professionInventory={},state=null)=>{
 const keys=id==='ingot'||id==='ingot_iron'?['ingot','ingot_iron']:[id];
 return keys.reduce((sum,key)=>sum+Math.max(0,Number(professionInventory?.[key])||0)+Math.max(0,Number(state?.items?.[key])||0),0);
};
export function canCraft(recipeId,professionInventory={},state){
 const recipe=RECIPES[recipeId];
 if(!recipe)return {ok:false,reason:'Receta desconocida'};
 if(!state?.items)return {ok:false,reason:'Bolsa no disponible'};
 const missing=Object.entries(recipe.ingredients).filter(([id,n])=>ownedMaterialCount(id,professionInventory,state)<n);
 if(missing.length)return {ok:false,reason:'Faltan materiales',missing};
 // Capacity is tested on the FINAL transaction. Ingredients may free slots
 // before the newly crafted item is inserted (even in a full bag).
 const next={...state.items},stock={...professionInventory};
 for(const [id,n] of Object.entries(recipe.ingredients)){
  let due=n;
  const keys=id==='ingot'||id==='ingot_iron'?[id,id==='ingot'?'ingot_iron':'ingot']:[id];
  for(const pool of [stock,next]){
   for(const key of keys){
    const amount=Math.min(due,Math.max(0,pool[key]??0));
    if(amount){pool[key]-=amount;due-=amount;}
   }
  }
  if(due)throw Error('HIGHFLY craft validation drift on '+id);
 }
 next[recipe.item]=(next[recipe.item]??0)+recipe.count;
 const capacity=bagCapacityStatus(next,stock,ITEM_DEFS,state.slots,normalizeGearTraits(state.gearTraits,next,state.equipped).bag);
 return capacity.ok?{ok:true,used:capacity.used,free:capacity.free}:{ok:false,reason:'Bolsa llena',used:capacity.used,capacity:capacity.capacity};
}
export function craftPotion(recipeId,professionState,state){
 const inventory=professionState?.inventory;
 if(!inventory||!state)return {ok:false,reason:'No hay inventario de profesiones'};
 const valid=canCraft(recipeId,inventory,state);
 if(!valid.ok)return valid;
 const recipe=RECIPES[recipeId];
 // Commit exactly once: spend profession stock first, then normal bag stock.
 for(const [id,n] of Object.entries(recipe.ingredients)){
  let due=n;
  const keys=id==='ingot'||id==='ingot_iron'?[id,id==='ingot'?'ingot_iron':'ingot']:[id];
  for(const key of keys){const fromProf=Math.min(due,Math.max(0,inventory[key]??0));if(fromProf){inventory[key]-=fromProf;due-=fromProf;}}
  for(const key of keys){const fromBag=Math.min(due,Math.max(0,state.items[key]??0));if(fromBag){state.items[key]-=fromBag;due-=fromBag;}}
  if(due)throw Error('HIGHFLY crafting atomicity: missing confirmed '+id);
 }
 state.items[recipe.item]=(state.items[recipe.item]??0)+recipe.count;
 registerCraftedGear(state,recipe.item,recipe.count);
 return {ok:true,id:recipe.item,count:recipe.count,remaining:state.items[recipe.item]};
}
export const SKILL_IDS=Object.freeze(['attack','dash','roll','heavy','pulse','heal']);
export function skillReady(player,id){
 if(!SKILL_IDS.includes(id))return false;
 if(id==='pulse')return !!player?.skills?.has?.('pulse');
 if(id==='heal')return (player?.refrains??0)>0;
 return true;
}
export function assignSkillSlot(state,slotIndex,skillId,player){
 if(!state||!Array.isArray(state.skillSlots)||!Number.isInteger(slotIndex)||slotIndex<0||slotIndex>=SKILL_SLOT_COUNT)return {ok:false,reason:'Ranura inválida'};
 if(!skillReady(player,skillId))return {ok:false,reason:'Esta habilidad todavía no está disponible'};
 for(let i=0;i<SKILL_SLOT_COUNT;i++)if(state.skillSlots[i]===skillId)state.skillSlots[i]=null;
 state.skillSlots[slotIndex]=skillId;
 return {ok:true,slot:slotIndex,skill:skillId};
}
export function clearSkillSlot(state,slotIndex){
 if(!state||!Array.isArray(state.skillSlots)||!Number.isInteger(slotIndex)||slotIndex<0||slotIndex>=SKILL_SLOT_COUNT)return {ok:false,reason:'Ranura inválida'};
 state.skillSlots[slotIndex]=null;return {ok:true,slot:slotIndex};
}
export const ATTRIBUTE_IDS=Object.freeze(['STR','AGI','VIT','PER','INT']);
export const ATTRIBUTE_LABELS=Object.freeze({STR:'Fuerza',AGI:'Agilidad',VIT:'Vitalidad',PER:'Percepción',INT:'Inteligencia'});
function distribute(n,i){return Math.floor(n/5)+(i<n%5?1:0);}
export function attributeBreakdown(level=1,verifiedTraining=0,equipment={}){
 const lvl=Math.max(1,Math.floor(Number(level)||1));
 const points=5*(lvl-1),levelPoints=4*(lvl-1),trainingCap=points-levelPoints;
 const trainingPoints=Math.min(trainingCap,Math.max(0,Math.floor(Number(verifiedTraining)||0)));
 const rows=ATTRIBUTE_IDS.map((id,i)=>{
  const fromLevel=distribute(levelPoints,i),fromTraining=distribute(trainingPoints,i);
  const fromEquipment=Math.trunc(Number(equipment?.[id])||0);
  return {id,name:ATTRIBUTE_LABELS[id],base:10,level:fromLevel,training:fromTraining,equipment:fromEquipment,total:10+fromLevel+fromTraining+fromEquipment};
 });
 return {level:lvl,levelPoints,trainingPoints,trainingCap,rows};
}
export function liveSkillRows(player){
 return [
  {id:'attack',label:'Combo básico',kind:'Física',cost:'Energía',available:true,desc:'Tres cortes encadenados del combate original.'},
  {id:'dash',label:'DASH',kind:'Movilidad',cost:'Energía',available:true,desc:'Desplazamiento direccional de HIGHFLY.'},
  {id:'roll',label:'ROLL',kind:'Movilidad',cost:'Energía',available:true,desc:'Esquiva y reposicionamiento.'},
  {id:'heavy',label:'Ataque pesado',kind:'Física',cost:'Energía',available:true,desc:'Golpe pesado del sistema original.'},
  {id:'pulse',label:'Pulso de resonancia',kind:'Mágica',cost:'Maná',available:!!player?.skills?.has?.('pulse'),desc:'Onda de resonancia desbloqueable en Unsung.'},
  {id:'heal',label:'Curación de emergencia',kind:'Curación',cost:'Carga curativa',available:(player?.refrains??0)>0,desc:'La curación nativa se activa con el botón curativo disponible en el HUD.'}
 ];
}
