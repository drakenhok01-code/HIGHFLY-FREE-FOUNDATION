/** HIGHFLY P4.1 — isolated, deterministic loot interaction for UI testing.
 * NOT a real enemy loot table. No borrowed names or source art.
 * Rewards are physical inventory transactions; no equipment drops above +0.
 */
import {ITEM_DEFS,inventoryRows} from './rpg-core.mjs';
import {registerCraftedGear} from './rpg-itemization.mjs';
export const MATERIAL_ORDER=Object.freeze(['cobre','hierro','acero','plata','oro','diamante','obsidiana','mitrilo']);
export const P41_TEST_DROPS=Object.freeze({
 lobo:Object.freeze({label:'Botín de prueba · lobo',bag:Object.freeze({hp_potion:1}),resources:Object.freeze({herb:2})}),
 veta:Object.freeze({label:'Botín de prueba · veta minera',bag:Object.freeze({}),resources:Object.freeze({ore:4,ore_copper:5,ore_iron:2,coal:2})}),
 cofre:Object.freeze({label:'Botín de prueba · cofre',bag:Object.freeze({training_shield:1,upgrade_stone:1}),resources:Object.freeze({wood:3})})
});
export function grantP41TestLoot(state,profession,source){
 const drop=P41_TEST_DROPS[source],resources=profession?.inventory;
 if(!drop||!state?.items||!state?.equipped||!resources)return {ok:false,reason:'Prueba o inventario inválidos'};
 const all={...drop.bag,...drop.resources},items={...state.items},stock={...resources};
 for(const [item,amount] of Object.entries(drop.bag))items[item]=(items[item]??0)+amount;
 for(const [item,amount] of Object.entries(drop.resources))stock[item]=(stock[item]??0)+amount;
 for(const [item,amount] of Object.entries(all)){
  if(!ITEM_DEFS[item]||!Number.isInteger(amount)||amount<1)return {ok:false,reason:'Objeto de botín inválido'};
  if((items[item]??0)+(stock[item]??0)>ITEM_DEFS[item].max)
   return {ok:false,reason:'La pila de '+ITEM_DEFS[item].name+' está completa'};
 }
 if(inventoryRows({items},stock).length>state.slots)
  return {ok:false,reason:'No hay ranuras libres en la Bolsa'};
 // All validations passed: atomic award, gear traits are normalized to +0.
 Object.assign(state.items,items);
 Object.assign(resources,stock);
 for(const [item,amount] of Object.entries(drop.bag))registerCraftedGear(state,item,amount);
 return {ok:true,source,label:drop.label,awarded:Object.entries(all).map(([id,count])=>({id,count,name:ITEM_DEFS[id].name}))};
}
