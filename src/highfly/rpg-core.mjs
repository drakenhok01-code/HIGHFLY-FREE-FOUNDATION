/** HIGHFLY F0.14 - shared RPG domain. Real inventory and Player only.
 * Item definitions and UI assets are original HIGHFLY code, not imported media.
 * 80/20 applies to earned BASE points; equipped item bonuses are independent.
 */
export const SAVE_KEY='highfly-rpg-f014-v1';
/** All 36 grid slots exist even before any item is collected. */
export const MAX_BAG_SLOTS=36;
export const MAX_EXPANDED_BAG_SLOTS=72;
export const BAG_EXPANSION_INCREMENT=12;
export function bagSlots(items=[],capacity=MAX_BAG_SLOTS){
 return Array.from({length:Math.max(1,Math.floor(capacity))},(_,i)=>items[i]??null);
}
export const ITEM_DEFS=Object.freeze({
 hp_potion:{id:'hp_potion',name:'Poción de Vida',kind:'Consumibles',icon:'health',rarity:'Poco común',description:'Recupera el 35% de la Vida máxima.',max:99},
 mp_potion:{id:'mp_potion',name:'Poción de Maná',kind:'Consumibles',icon:'mana',rarity:'Poco común',description:'Recupera el 40% del Maná máximo.',max:99},
 herb:{id:'herb',name:'Hierbas recolectadas',kind:'Materiales',icon:'herb',rarity:'Común',description:'Hierbas obtenidas mediante recolección real.',max:999},
 ore:{id:'ore',name:'Mineral',kind:'Materiales',icon:'ore',rarity:'Común',description:'Mineral conseguido de una veta real.',max:999},
 wood:{id:'wood',name:'Madera',kind:'Materiales',icon:'wood',rarity:'Común',description:'Madera talada en el mundo.',max:999},
 fish:{id:'fish',name:'Pescado',kind:'Materiales',icon:'fish',rarity:'Común',description:'Captura obtenida con caña.',max:999},
 ingot:{id:'ingot',name:'Lingote',kind:'Materiales',icon:'ingot',rarity:'Común',description:'Lingote fundido con minerales reales.',max:999},
 blade_blank:{id:'blade_blank',name:'Hoja sin terminar',kind:'Materiales',icon:'blade',rarity:'Común',description:'Pieza forjada, todavía no equipable.',max:999},
 seed:{id:'seed',name:'Semillas',kind:'Materiales',icon:'herb',rarity:'Común',description:'Semillas para plantar.',max:999},
 bag_upgrade:{id:'bag_upgrade',name:'Sello de Expansión',kind:'Especial',icon:'expansion',rarity:'Raro',description:'Amplía la capacidad permanente de la Bolsa en 12 casillas, hasta un máximo de 72.',max:3}
});
export const RECIPES=Object.freeze({
 hp_potion:{item:'hp_potion',name:'Poción de Vida',ingredients:{herb:2},count:1,profession:'Alquimia'},
 mp_potion:{item:'mp_potion',name:'Poción de Maná',ingredients:{herb:1,ore:1},count:1,profession:'Alquimia'},
 bag_upgrade:{item:'bag_upgrade',name:'Sello de Expansión',ingredients:{wood:8,ore:8},count:1,profession:'Marroquinería'}
});
const bounded=(n,max=999)=>Number.isInteger(n)?Math.max(0,Math.min(max,n)):0;
export function normalizeRpgState(raw){
 const counts=raw&&typeof raw==='object'&&raw.items&&typeof raw.items==='object'?raw.items:{};
 const items={hp_potion:bounded(counts.hp_potion??2,99),mp_potion:bounded(counts.mp_potion??2,99)};
 for(const [id,def] of Object.entries(ITEM_DEFS))if(id!=='hp_potion'&&id!=='mp_potion'&&id in counts)
  items[id]=bounded(counts[id],def.max);
 const slots=Number.isInteger(raw?.slots)?Math.min(MAX_EXPANDED_BAG_SLOTS,Math.max(MAX_BAG_SLOTS,raw.slots)):MAX_BAG_SLOTS;
 return {schema:2,items,slots};
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
 const owned={...state?.items,...professionInventory};
 return Object.entries(owned).filter(([id,n])=>ITEM_DEFS[id]&&Number.isInteger(n)&&n>0)
  .map(([id,n])=>({...ITEM_DEFS[id],count:n})).sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name));
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
export function canCraft(recipeId,professionInventory={},state){
 const recipe=RECIPES[recipeId];
 if(!recipe)return {ok:false,reason:'Receta desconocida'};
 if((state?.items?.[recipe.item]??0)+recipe.count>ITEM_DEFS[recipe.item].max)
  return {ok:false,reason:'No queda espacio para esa poción'};
 const missing=Object.entries(recipe.ingredients).filter(([id,n])=>(professionInventory[id]??0)<n);
 return missing.length?{ok:false,reason:'Faltan materiales',missing}:{ok:true};
}
export function craftPotion(recipeId,professionState,state){
 const inventory=professionState?.inventory;
 if(!inventory||!state)return {ok:false,reason:'No hay inventario de profesiones'};
 const valid=canCraft(recipeId,inventory,state);
 if(!valid.ok)return valid;
 const recipe=RECIPES[recipeId];
 for(const [id,n] of Object.entries(recipe.ingredients))inventory[id]-=n;
 state.items[recipe.item]=(state.items[recipe.item]??0)+recipe.count;
 return {ok:true,id:recipe.item,count:recipe.count,remaining:state.items[recipe.item]};
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
