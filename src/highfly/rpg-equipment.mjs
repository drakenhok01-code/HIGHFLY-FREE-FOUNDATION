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
  id:'training_greatsword',name:'Mandoble de Aprendiz',kind:'Equipamiento',icon:'greatsword',
  rarity:'Poco común',max:10,slots:['right_hand'],stats:{physicalAttack:9},
  description:'Mandoble a dos manos ya incluido en el Knight FREE.'
 }
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
export function equipmentBonuses(equipped){
 const stats={physicalAttack:0,magicalAttack:0,defense:0,blockChance:0};
 for(const id of Object.values(equipped??{})){
  const modifiers=EQUIP_ITEM_DEFS[id]?.stats;
  if(modifiers)for(const [key,val] of Object.entries(modifiers))
   stats[key]=(stats[key]??0)+val;
 }
 return stats;
}
export function equipFromBag(state,slotId,itemId){
 if(!state?.items||!state?.equipped)return {ok:false,reason:'Inventario no disponible'};
 const def=EQUIP_ITEM_DEFS[itemId];
 if(!EQUIP_SLOTS.some(s=>s.id===slotId)||!def?.slots.includes(slotId))
  return {ok:false,reason:'Este objeto no es compatible con esa ranura'};
 if((state.items[itemId]??0)<1)return {ok:false,reason:'No tenés ese objeto en la Bolsa'};
 // The free Knight rig supports a shield or second sword only with a main sword.
 if(slotId==='left_hand'&&state.equipped.right_hand!=='training_sword')
  return {ok:false,reason:'La mano izquierda requiere una espada principal equipada'};
 const affected=[slotId];
 if(slotId==='right_hand'&&itemId==='training_greatsword'&&state.equipped.left_hand)
  affected.push('left_hand');
 if(slotId==='right_hand'&&itemId!=='training_sword'&&state.equipped.left_hand)
  affected.push('left_hand');
 const nextItems={...state.items},nextEquipped={...state.equipped};
 for(const slot of affected){
  const previous=nextEquipped[slot];if(!previous)continue;
  const d=EQUIP_ITEM_DEFS[previous];
  if((nextItems[previous]??0)>=d.max)
   return {ok:false,reason:'No hay espacio para devolver '+d.name+' a la Bolsa'};
  nextItems[previous]=(nextItems[previous]??0)+1;
  nextEquipped[slot]=null;
 }
 nextItems[itemId]-=1;
 nextEquipped[slotId]=itemId;
 state.items=nextItems;state.equipped=nextEquipped;
 return {ok:true,item:itemId,slot:slotId,mode:equippedMode(state.equipped)};
}
export function unequipToBag(state,slotId){
 if(!state?.items||!state?.equipped||!EQUIP_SLOTS.some(s=>s.id===slotId))
  return {ok:false,reason:'Ranura no disponible'};
 const id=state.equipped[slotId];
 if(!id)return {ok:false,reason:'Esa ranura ya está vacía'};
 const item=EQUIP_ITEM_DEFS[id];
 if(!item)return {ok:false,reason:'Objeto sin adaptador de equipamiento'};
 if((state.items[id]??0)>=item.max)return {ok:false,reason:'La pila de '+item.name+' está completa'};
 // Unequipping the main sword with something in the offhand returns BOTH.
 const affected=slotId==='right_hand'&&state.equipped.left_hand?['right_hand','left_hand']:[slotId];
 const next={...state.items};
 for(const slot of affected){
  const equippedId=state.equipped[slot];
  const limit=EQUIP_ITEM_DEFS[equippedId]?.max??0;
  if((next[equippedId]??0)>=limit)return {ok:false,reason:'No hay espacio en la Bolsa'};
  next[equippedId]=(next[equippedId]??0)+1;
 }
 state.items=next;
 for(const slot of affected)state.equipped[slot]=null;
 return {ok:true,item:id,slot:slotId,mode:equippedMode(state.equipped)};
}
