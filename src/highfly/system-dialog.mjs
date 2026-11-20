/** HIGHFLY PHOENIX — no-side-effect validation and copy for premium System decisions.
 * Only a confirmed action in premium-rpg.mjs may modify the real RPG state.
 */
import {ITEM_DEFS,RECIPES,canCraft,skillReady} from './rpg-core.mjs';
import {EQUIP_SLOTS,EQUIP_ITEM_DEFS} from './rpg-equipment.mjs';

const findSlot=id=>EQUIP_SLOTS.find(s=>s.id===id);
export function describeSystemIntent(type,payload={},bag={},professionInventory={},player=null){
 const itemId=payload.itemId;
 const slotId=payload.slotId;
 const item=ITEM_DEFS[itemId];
 if(type==='equip-choose'||type==='equip'){
  const def=EQUIP_ITEM_DEFS[itemId];
  if(!def||!item||(bag.items?.[itemId]??0)<1)
   return {ok:false,reason:'Ese equipo ya no está disponible en tu Bolsa'};
  if(type==='equip-choose')
   return {ok:true,type,itemId,title:'ELEGIR RANURA',description:'¿Dónde querés equipar '+def.name+'?',icon:def.icon,
    slots:def.slots.map(id=>({id,label:findSlot(id)?.label??id}))};
  if(!def.slots.includes(slotId)||!findSlot(slotId))return {ok:false,reason:'Ranura incompatible con ese equipo'};
  return {ok:true,type,itemId,slotId,title:'¿EQUIPAR OBJETO?',description:def.name+' se equipará en '+findSlot(slotId).label+
   (bag.equipped?.[slotId]?' y reemplazará el objeto actual.':'.'),
   icon:def.icon,verb:'EQUIPAR',details:[{label:'Destino',value:findSlot(slotId).label}]};
 }
 if(type==='unequip'){
  if(!findSlot(slotId)||!EQUIP_ITEM_DEFS[bag.equipped?.[slotId]])
   return {ok:false,reason:'No hay un objeto equipable en esa ranura'};
  const selected=EQUIP_ITEM_DEFS[bag.equipped[slotId]];
  return {ok:true,type,slotId,itemId:selected.id,title:'¿DESEQUIPAR OBJETO?',
   description:'¿Querés devolver '+selected.name+' a tu Bolsa?',icon:selected.icon,verb:'DESEQUIPAR',
   details:[{label:'Origen',value:findSlot(slotId).label},{label:'Destino',value:'Bolsa'}]};
 }
 if(type==='craft'){
  const recipe=RECIPES[payload.recipeId];
  if(!recipe)return {ok:false,reason:'Receta desconocida'};
  const valid=canCraft(recipe.item,professionInventory,bag);
  if(!valid.ok)return {ok:false,reason:valid.reason};
  return {ok:true,type,recipeId:recipe.item,itemId:recipe.item,title:'¿INICIAR FABRICACIÓN?',
   description:'¿Querés fabricar '+recipe.count+' × '+recipe.name+' usando estos materiales?',
   icon:ITEM_DEFS[recipe.item].icon,verb:'FABRICAR',
   details:Object.entries(recipe.ingredients).map(([id,n])=>({
    label:ITEM_DEFS[id]?.name??id,value:n+' unidades',have:professionInventory[id]??0}))};
 }
 if(type==='assign-skill'){
  const {slotIndex,skillId}=payload;
  if(!Number.isInteger(slotIndex)||slotIndex<0||slotIndex>=6||!skillReady(player,skillId))
   return {ok:false,reason:'Esa habilidad todavía no se puede asignar'};
  return {ok:true,type,slotIndex,skillId,title:'¿ASIGNAR HABILIDAD?',verb:'ASIGNAR',
   icon:skillId==='heal'?'health':'weapon',
   description:'¿Querés asignar esta habilidad a la ranura '+(slotIndex+1)+' del HUD?',
   details:[{label:'Ranura',value:String(slotIndex+1)}]};
 }
 if(type==='expand'){
  if(!(bag.items?.bag_upgrade>0)||Number(bag.slots)>=72)
   return {ok:false,reason:'No tenés sellos disponibles o la Bolsa ya alcanzó su capacidad máxima'};
  return {ok:true,type,title:'¿AMPLIAR BOLSA?',icon:'bag',verb:'AMPLIAR',
   description:'¿Usar un Sello de Expansión para obtener 12 casillas permanentes?',
   details:[{label:'Capacidad',value:bag.slots+' → '+Math.min(72,bag.slots+12)}]};
 }
 return {ok:false,reason:'Acción del Sistema desconocida'};
}
