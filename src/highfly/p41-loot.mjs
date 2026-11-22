/** HIGHFLY P4.1 — isolated, deterministic loot interaction for UI testing.
 * NOT a real enemy loot table. No borrowed names or source art.
 * Rewards are physical inventory transactions; no equipment drops above +0.
 */
import {ITEM_DEFS} from './rpg-core.mjs';
import {bagCapacityStatus} from './rpg-bag-capacity.mjs';
import {registerCraftedGear,normalizeGearTraits,RARITIES,GEAR_IDS} from './rpg-itemization.mjs';
export const MATERIAL_ORDER=Object.freeze(['cobre','hierro','acero','plata','oro','diamante','obsidiana','mitrilo']);
export const P41_TEST_DROPS=Object.freeze({
 lobo:Object.freeze({label:'Botín de prueba · lobo',bag:Object.freeze({hp_potion:1}),resources:Object.freeze({herb:2})}),
 veta:Object.freeze({label:'Botín de prueba · veta minera',bag:Object.freeze({}),resources:Object.freeze({ore:4,ore_copper:5,ore_iron:2,coal:2})}),
 cofre:Object.freeze({label:'Botín de prueba · cofre',bag:Object.freeze({training_shield:1,hf_iron_chest:1,hf_copper_ring:1,upgrade_stone:1}),resources:Object.freeze({wood:3})}),
 muestras:Object.freeze({label:'Muestrario · 8 minerales y dos piedras',bag:Object.freeze({upgrade_stone:2,upgrade_stone_advanced:2}),resources:Object.freeze({ore_copper:1,ore_iron:1,coal:1,ore_silver:1,ore_gold:1,raw_diamond:1,raw_obsidian:1,ore_mithril:1})})
});
export function grantP41TestLoot(state,profession,source){
 const drop=P41_TEST_DROPS[source],resources=profession?.inventory;
 if(!drop||!state?.items||!state?.equipped||!resources)return {ok:false,reason:'Prueba o inventario inválidos'};
 const all={...drop.bag,...drop.resources},items={...state.items},stock={...resources};
 for(const [item,amount] of Object.entries(drop.bag))items[item]=(items[item]??0)+amount;
 for(const [item,amount] of Object.entries(drop.resources))stock[item]=(stock[item]??0)+amount;
 for(const [item,amount] of Object.entries(all)){
  if(!ITEM_DEFS[item]||!Number.isInteger(amount)||amount<1)return {ok:false,reason:'Objeto de botín inválido'};
  // Physical stacks automatically spill into another real inventory cell.
  // A filled single stack is NOT a filled 36–72 slot bag.
 }
 const projection=bagCapacityStatus(items,stock,ITEM_DEFS,state.slots,normalizeGearTraits(state.gearTraits,items,state.equipped).bag);
 if(!projection.ok)return {ok:false,reason:'No hay ranuras libres en la Bolsa: '+projection.used+' / '+state.slots};
 // All validations passed: atomic award, gear traits are normalized to +0.
 Object.assign(state.items,items);
 Object.assign(resources,stock);
 for(const [item,amount] of Object.entries(drop.bag))registerCraftedGear(state,item,amount);
 return {ok:true,source,label:drop.label,awarded:Object.entries(all).map(([id,count])=>({id,count,name:ITEM_DEFS[id].name}))};
}

/** Native kill -> physical world pickup. Not a simulation; the player must press
 * USAR/interact by the actual fallen enemy. The item always drops +0. */
export function receiveP41WorldPickup(state,profession,{id,count=1,rarity='Común'}={}){
 const def=ITEM_DEFS[id],stock=profession?.inventory;
 if(!state?.items||!stock||!def||!Number.isInteger(count)||count<1||count>5||!RARITIES.includes(rarity))
  return {ok:false,reason:'Botín inválido'};
 const next={...state.items,[id]:(state.items[id]??0)+count};
 const preview=normalizeGearTraits(state.gearTraits,next,state.equipped);
 if(GEAR_IDS.includes(id)){
  const list=preview.bag[id];
  for(let i=list.length-count;i<list.length;i++){
   list[i].rarity=rarity;
   list[i].plus=0;
  }
 }
 const projection=bagCapacityStatus(next,stock,ITEM_DEFS,state.slots,preview.bag);
 if(!projection.ok)return {ok:false,reason:'Bolsa llena: '+projection.used+' / '+state.slots};
 state.items[id]=(state.items[id]??0)+count;
 if(GEAR_IDS.includes(id)){
  registerCraftedGear(state,id,count);
  const traits=state.gearTraits.bag[id];
  for(let i=traits.length-count;i<traits.length;i++){
   traits[i].rarity=rarity;
   traits[i].plus=0;
  }
 }
 return {ok:true,id,count,rarity,name:def.name};
}
