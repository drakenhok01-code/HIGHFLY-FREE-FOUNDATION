/** P4.9.3 — explicit, reversible inventory rules. Items always +0 on world drop.
 * Selling only at the actual luthier NPC (Odo); earned copper is saved.
 * Never remove an equipped piece from its gear slot.
 */
import {ITEM_DEFS} from './rpg-core.mjs';
import {EQUIP_ITEM_DEFS} from './rpg-equipment.mjs';
import {gearTraitAt} from './rpg-itemization.mjs';
const worth={Común:3,'Poco común':6,Raro:15,'Épico':45,Legendario:110,'Mítico':260};
const safeCount=(v)=>Number.isSafeInteger(v)&&v>0?v:0;
export function nearHighflyMerchant(game){
 const n=game?.people?.get?.('odo'),p=game?.player?.pos;
 return !!(n?.awake&&p&&Math.hypot(n.x-p.x,n.z-p.z)<4&&Math.abs(n.y-p.y)<3);
}
export function itemSalePrice(item,rarity){
 const w=worth[rarity]??worth[item?.rarity]??3;
 return Math.max(1,Math.round(w*(item?.kind==='Equipamiento'?4:item?.kind==='Consumibles'?2:1)));
}
export function highflyRemoveItem(bag,resources,{id,count=1,variantIndex=0,sell=false,merchant=false}={}){
 const item=ITEM_DEFS[id],quantity=safeCount(count),available=safeCount(bag?.items?.[id])+safeCount(resources?.[id]);
 if(!item||!quantity||available<quantity)return {ok:false,reason:'Objeto o cantidad inválidos'};
 if(sell&&!merchant)return {ok:false,reason:'Para vender, hablá con Odo, el lutier de la Terraza del Alba'};
 if(EQUIP_ITEM_DEFS[id]&&quantity!==1)return {ok:false,reason:'Elegí una pieza de equipo por vez'};
 const gear=EQUIP_ITEM_DEFS[id]?bag?.gearTraits?.bag?.[id]:null;
 const idx=Math.max(0,Math.floor(Number(variantIndex)||0));
 if(EQUIP_ITEM_DEFS[id]&&(!Array.isArray(gear)||!gear[idx]))
  return {ok:false,reason:'La pieza seleccionada no está disponible'};
 const price=sell?itemSalePrice(item,gear?.[idx]?.rarity??item.rarity)*quantity:0;
 // Stock changes only after all validation (transaction is atomic).
 const inBag=safeCount(bag?.items?.[id]),removeBag=Math.min(quantity,inBag),removeResource=quantity-removeBag;
 if(removeResource&&safeCount(resources?.[id])<removeResource)return {ok:false,reason:'Stock insuficiente'};
 bag.items[id]=inBag-removeBag;
 if(removeResource)resources[id]-=removeResource;
 if(gear){gear.splice(idx,1);if(!gear.length)delete bag.gearTraits.bag[id];}
 if(sell)bag.coins=safeCount(bag.coins)+price;
 return {ok:true,id,count:quantity,price,name:item.name};
}
