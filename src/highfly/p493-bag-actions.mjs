/** P4.9.3 Bag actions: confirm-before-mutate, stack-aware, persistent currency.
 * Never touch equipped slots, mission save, EXP, or item enhancement levels.
 */
import {ITEM_DEFS} from './rpg-core.mjs';
import {EQUIP_ITEM_DEFS} from './rpg-equipment.mjs';
const RARITY_FACTOR={'Común':1,'Poco común':1.5,'Raro':2,'Épico':3,'Legendario':5,'Mítico':8};
const SPECIAL_LOCKED=new Set(['bag_upgrade']);
export function bagItemPrice(id,trait=null){
 const def=ITEM_DEFS[id];if(!def||SPECIAL_LOCKED.has(id))return 0;
 const base=def.kind==='Equipamiento'||def.kind==='Accesorios'?30:
  def.kind==='Consumibles'?8:def.kind==='Especial'?20:2;
 return Math.max(1,Math.floor(base*(RARITY_FACTOR[trait?.rarity??def.rarity]??1)+
  (EQUIP_ITEM_DEFS[id]?(trait?.plus??0)*7:0)));
}
export function transactBagItem(state,profession,id,action='discard',quantity=1,variantIndex=0){
 const def=ITEM_DEFS[id],bag=state?.items??{},stock=profession?.inventory??{};
 if(!def||!['discard','sell'].includes(action))return {ok:false,reason:'Objeto o acción no disponibles'};
 if(SPECIAL_LOCKED.has(id))return {ok:false,reason:'Este objeto especial no se descarta ni vende'};
 const ownedBag=Math.max(0,Math.floor(Number(bag[id])||0));
 const ownedStock=Math.max(0,Math.floor(Number(stock[id])||0));
 const total=ownedBag+ownedStock;
 const isGear=!!EQUIP_ITEM_DEFS[id];
 if(total<1)return {ok:false,reason:'Ya no tenés este objeto en la Bolsa'};
 if(!Number.isSafeInteger(quantity)||quantity<1||quantity>total)return {ok:false,reason:'Cantidad no válida'};
 if(isGear&&quantity!==1)return {ok:false,reason:'Elegí una pieza de equipamiento por vez'};
 const variants=state?.gearTraits?.bag?.[id];
 if(isGear&&(!Array.isArray(variants)||variantIndex<0||variantIndex>=variants.length))
  return {ok:false,reason:'La variante seleccionada ya no existe'};
 const price=action==='sell'?bagItemPrice(id,isGear?variants[variantIndex]:null):0;
 if(action==='sell'&&price<=0)return {ok:false,reason:'Este objeto no se puede vender'};
 // Validate the entire change before mutating either inventory.
 const moveFromBag=Math.min(ownedBag,quantity),moveFromStock=quantity-moveFromBag;
 const earned=price*quantity;
 if(earned>Number.MAX_SAFE_INTEGER-(state.coins??0))return {ok:false,reason:'Límite de monedas'};
 if(moveFromBag)bag[id]=ownedBag-moveFromBag;
 if(moveFromStock)stock[id]=ownedStock-moveFromStock;
 if(isGear)variants.splice(variantIndex,1);
 if(action==='sell')state.coins=(state.coins??0)+earned;
 return {ok:true,id,action,count:quantity,earned,remaining:total-quantity,name:def.name};
}
