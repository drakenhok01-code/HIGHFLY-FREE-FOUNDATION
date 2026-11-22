import {moveTraitsOnEquip,moveTraitsOnUnequip,enhancedStats} from './rpg-itemization.mjs';
import {bagCapacityStatus} from './rpg-bag-capacity.mjs';
/** HIGHFLY PHOENIX PREMIUM: real, persistent equip/unequip transactions.
 * No fake armor is equipped. Only supported KayKit Knight FREE weapon meshes
 * are exposed; future rigs/armour must provide verified visible adapters.
 */
export const EQUIP_SLOTS=Object.freeze([
 {id:'helmet',label:'Casco',icon:'helmet'},
 {id:'chest',label:'Pechera',icon:'armor'},
 {id:'gloves',label:'Guantes',icon:'gloves'},
 {id:'right_hand',label:'Mano derecha',icon:'weapon'},
 {id:'necklace',label:'Collar',icon:'ring'},
 {id:'shoulders',label:'Hombros',icon:'armor'},
 {id:'pants',label:'Pantalón',icon:'armor'},
 {id:'boots',label:'Botas',icon:'boots'},
 {id:'left_hand',label:'Mano izquierda',icon:'shield'},
 {id:'ring',label:'Anillo',icon:'ring'}
]);
export const DEFAULT_EQUIPPED=Object.freeze({
 helmet:null,chest:null,gloves:null,right_hand:'training_sword',necklace:null,
 shoulders:null,pants:null,boots:null,left_hand:null,ring:null
});
export const EQUIP_ITEM_DEFS=Object.freeze({
 training_sword:{
  id:'training_sword',name:'Espada de Aprendiz',kind:'Equipamiento',icon:'weapon',
  rarity:'Común',max:10,slots:['right_hand','left_hand'],stats:{physicalAttack:4},
  description:'Espada KayKit FREE real del Cazador Universal. Equipada al comenzar.'
 },
 training_shield:{
  id:'training_shield',name:'Escudo de Aprendiz',kind:'Equipamiento',icon:'shield',
  rarity:'Común',max:10,slots:['left_hand'],stats:{defense:3,blockChance:2},
  description:'Escudo redondo compatible con la mano izquierda del Knight FREE.'
 },
 training_greatsword:{
  id:'training_greatsword',name:'Mandoble de Aprendiz',kind:'Equipamiento',icon:'weapon',
  rarity:'Poco común',max:10,slots:['right_hand'],stats:{physicalAttack:9},
  description:'Mandoble a dos manos del Cazador Universal.'
 },
 hf_iron_helmet:{id:'hf_iron_helmet',name:'Yelmo de hierro',kind:'Equipamiento',icon:'helmet',rarity:'Común',max:10,slots:['helmet'],stats:{defense:2,VIT:1},description:'Casco de placas HIGHFLY. Bonificación real, modelo 3D de armadura reservado.'},
 hf_iron_chest:{id:'hf_iron_chest',name:'Pechera de hierro',kind:'Equipamiento',icon:'armor',rarity:'Común',max:10,slots:['chest'],stats:{defense:5,VIT:2},description:'Pechera de hierro HIGHFLY. Se equipa y mejora atributos sin cambiar aún la apariencia 3D.'},
 hf_iron_gloves:{id:'hf_iron_gloves',name:'Guantes de hierro',kind:'Equipamiento',icon:'gloves',rarity:'Común',max:10,slots:['gloves'],stats:{defense:1,AGI:1},description:'Protección de manos de hierro.'},
 hf_iron_pants:{id:'hf_iron_pants',name:'Grebas de hierro',kind:'Equipamiento',icon:'armor',rarity:'Común',max:10,slots:['pants'],stats:{defense:3,VIT:1},description:'Protección inferior forjada en hierro.'},
 hf_iron_boots:{id:'hf_iron_boots',name:'Botas de hierro',kind:'Equipamiento',icon:'boots',rarity:'Común',max:10,slots:['boots'],stats:{defense:2,AGI:1},description:'Botas resistentes para el Cazador.'},
 hf_iron_shoulders:{id:'hf_iron_shoulders',name:'Hombreras de hierro',kind:'Equipamiento',icon:'armor',rarity:'Común',max:10,slots:['shoulders'],stats:{defense:2,STR:1},description:'Hombreras reforzadas de hierro.'},
 hf_copper_ring:{id:'hf_copper_ring',name:'Anillo de cobre',kind:'Accesorios',icon:'ring',rarity:'Común',max:10,slots:['ring'],stats:{INT:1},description:'Anillo original HIGHFLY. Aumenta Inteligencia.'},
 hf_silver_necklace:{id:'hf_silver_necklace',name:'Collar de plata',kind:'Accesorios',icon:'ring',rarity:'Común',max:10,slots:['necklace'],stats:{magicalAttack:2,INT:1},description:'Collar de plata de artesano HIGHFLY.'}
});
export function normalizeEquipped(raw,legacyDefault=true){
 const out={...DEFAULT_EQUIPPED};
 if(!legacyDefault)out.right_hand=null;
 if(raw&&typeof raw==='object'){
  for(const slot of EQUIP_SLOTS){
   if(!Object.hasOwn(raw,slot.id))continue;
   const item=raw[slot.id];
   out[slot.id]=item===null||item===undefined?null:
    EQUIP_ITEM_DEFS[item]?.slots.includes(slot.id)?item:null;
  }
 }
 if(out.right_hand==='training_greatsword')out.left_hand=null;
 if(out.left_hand&&!out.right_hand)out.left_hand=null;
 return out;
}
export function equippedMode(equipped){
 const right=equipped?.right_hand,left=equipped?.left_hand;
 if(right==='training_greatsword')return 1;
 if(right==='training_sword'){
  if(left==='training_shield')return 3;
  if(left==='training_sword')return 2;
  return 0;
 }
 return 4; // existing unarmed KayKit animations and invisible weapon meshes
}
export function equipmentBonuses(equipped,gearTraits=null){
 const stats={physicalAttack:0,magicalAttack:0,defense:0,blockChance:0};
 for(const [slot,id] of Object.entries(equipped??{})){
  const modifiers=EQUIP_ITEM_DEFS[id]?.stats;
  if(modifiers)for(const [key,val] of Object.entries(enhancedStats(modifiers,gearTraits?.equipped?.[slot])))
   stats[key]=+((stats[key]??0)+val).toFixed(2);
 }
 return stats;
}
/** Item totals are not the number of physical slots. Replacements are atomic. */
const equipmentBagDefs=(items,stock,extra={})=>({
 ...Object.fromEntries(Object.keys({...items,...stock}).map(id=>[id,{
  kind:'Materiales',max:id==='hp_potion'||id==='mp_potion'||id==='ascension_core'?99:id==='bag_upgrade'?3:999
 }])),
 ...EQUIP_ITEM_DEFS,...extra
});
export function equipFromBag(state,slotId,itemId,variantIndex=0,professionInventory={},itemDefinitions={}){
 if(!state?.items||!state?.equipped)return {ok:false,reason:'Inventario no disponible'};
 const def=EQUIP_ITEM_DEFS[itemId];
 if(!EQUIP_SLOTS.some(s=>s.id===slotId)||!def?.slots.includes(slotId))
  return {ok:false,reason:'Este objeto no es compatible con esa ranura'};
 if((state.items[itemId]??0)<1)return {ok:false,reason:'No tenés ese objeto en la Bolsa'};
 if(slotId==='left_hand'&&state.equipped.right_hand!=='training_sword')
  return {ok:false,reason:'La mano izquierda requiere una espada principal equipada'};
 const affected=[slotId];
 if(slotId==='right_hand'&&itemId!=='training_sword'&&state.equipped.left_hand)
  affected.push('left_hand');
 const nextItems={...state.items},nextEquipped={...state.equipped};
 for(const slot of affected){
  const previous=nextEquipped[slot];if(!previous)continue;
  nextItems[previous]=(nextItems[previous]??0)+1;
  nextEquipped[slot]=null;
 }
 nextItems[itemId]-=1;
 nextEquipped[slotId]=itemId;
 // Preview gear-trait movement without touching the saved state. The same
 // ID, rarity and + can merge into one stack; different traits remain separate.
 const preview={equipped:{...state.equipped},
  gearTraits:JSON.parse(JSON.stringify(state.gearTraits??{bag:{},equipped:{}}))};
 moveTraitsOnEquip(preview,slotId,itemId,affected,variantIndex);
 const projection=bagCapacityStatus(nextItems,professionInventory,
  equipmentBagDefs(nextItems,professionInventory,itemDefinitions),state.slots,preview.gearTraits.bag);
 if(!projection.ok)
  return {ok:false,reason:'Bolsa llena: '+projection.used+' / '+projection.capacity+' casillas ocupadas'};
 // Commit together, not one mutation per returned item.
 moveTraitsOnEquip(state,slotId,itemId,affected,variantIndex);
 state.items=nextItems;state.equipped=nextEquipped;
 return {ok:true,item:itemId,slot:slotId,mode:equippedMode(state.equipped),used:projection.used};
}
export function unequipToBag(state,slotId,professionInventory={},itemDefinitions={}){
 if(!state?.items||!state?.equipped||!EQUIP_SLOTS.some(s=>s.id===slotId))
  return {ok:false,reason:'Ranura no disponible'};
 const id=state.equipped[slotId];
 if(!id)return {ok:false,reason:'Esa ranura ya está vacía'};
 const item=EQUIP_ITEM_DEFS[id];
 if(!item)return {ok:false,reason:'Objeto sin adaptador de equipamiento'};
 // Unequipping a main sword also returns its companion shield/sword.
 const affected=slotId==='right_hand'&&state.equipped.left_hand?['right_hand','left_hand']:[slotId];
 const next={...state.items};
 for(const slot of affected){
  const equippedId=state.equipped[slot];
  next[equippedId]=(next[equippedId]??0)+1;
 }
 const preview={equipped:{...state.equipped},
  gearTraits:JSON.parse(JSON.stringify(state.gearTraits??{bag:{},equipped:{}}))};
 moveTraitsOnUnequip(preview,affected);
 const projected=bagCapacityStatus(next,professionInventory,
  equipmentBagDefs(next,professionInventory,itemDefinitions),state.slots,preview.gearTraits.bag);
 if(!projected.ok)return {ok:false,reason:'Bolsa llena: '+projected.used+' / '+projected.capacity+' casillas ocupadas'};
 // No separate max-per-stack rejection. A free physical slot can receive
 // an equipped item even if there are already 10 copies of that same ID.
 moveTraitsOnUnequip(state,affected);
 state.items=next;
 for(const slot of affected)state.equipped[slot]=null;
 return {ok:true,item:id,slot:slotId,mode:equippedMode(state.equipped),used:projected.used};
}
