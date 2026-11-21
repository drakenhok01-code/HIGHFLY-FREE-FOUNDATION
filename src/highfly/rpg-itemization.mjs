/**
 * HIGHFLY itemization v1.
 * One base image per item. Every physical sword/shield copy has its OWN
 * persistent rarity and +0..+9 level; the original equipment model stays
 * compatible with KayKit gear meshes, saved game and legacy inventory.
 */
export const RARITIES=Object.freeze(['Común','Poco común','Raro','Épico','Legendario','Mítico']);
export const GEAR_IDS=Object.freeze(['training_sword','training_shield','training_greatsword','hf_iron_helmet','hf_iron_chest','hf_iron_gloves','hf_iron_pants','hf_iron_boots','hf_iron_shoulders','hf_copper_ring','hf_silver_necklace']);
export const MAX_ENHANCEMENT=9;
export const defaultTrait=id=>({id,rarity:'Común',plus:0});
const validTrait=(raw,id)=>{
 const rarity=RARITIES.includes(raw?.rarity)?raw.rarity:'Común';
 const plus=Number.isInteger(raw?.plus)?Math.max(0,Math.min(MAX_ENHANCEMENT,raw.plus)):0;
 return {id,rarity,plus};
};
export const rarityIndex=rarity=>Math.max(0,RARITIES.indexOf(rarity));
export const traitLabel=(itemName,trait)=>String(itemName)+(trait?.plus?' +'+trait.plus:'');
export const enhancedStats=(stats={},trait)=>{
 const factor=1+rarityIndex(trait?.rarity)*.12+(trait?.plus??0)*.035;
 return Object.fromEntries(Object.entries(stats).map(([name,n])=>[name,+(n*factor).toFixed(2)]));
};
export function normalizeGearTraits(raw,items={},equipped={}){
 const bag={},eq={};
 for(const id of GEAR_IDS){
  const n=Math.max(0,Math.min(10,Number(items[id])||0));
  const input=Array.isArray(raw?.bag?.[id])?raw.bag[id]:[];
  bag[id]=Array.from({length:n},(_,i)=>validTrait(input[i],id));
 }
 for(const [slot,id] of Object.entries(equipped)){
  if(!GEAR_IDS.includes(id))continue;
  const original=raw?.equipped?.[slot];
  eq[slot]=validTrait(original?.id===id?original:null,id);
 }
 return {bag,equipped:eq};
}
export function moveTraitsOnEquip(state,slotId,itemId,affected=[],variantIndex=0){
 const slots=state.gearTraits?.equipped??{};
 const bags=state.gearTraits?.bag??{};
 const src=Array.isArray(bags[itemId])?bags[itemId]:[];
 const index=Math.max(0,Math.min(src.length-1,Math.floor(Number(variantIndex)||0)));
 const moving=src.splice(index,1)[0]??defaultTrait(itemId);
 for(const slot of affected){
  const before=state.equipped?.[slot];
  if(before&&GEAR_IDS.includes(before)) {
   (bags[before]??=[]).push(slots[slot]??defaultTrait(before));
   delete slots[slot];
  }
 }
 slots[slotId]=moving;
}
export function moveTraitsOnUnequip(state,affected=[]){
 const slots=state.gearTraits?.equipped??{},bags=state.gearTraits?.bag??{};
 for(const slot of affected){
  const id=state.equipped?.[slot];
  if(!GEAR_IDS.includes(id))continue;
  (bags[id]??=[]).push(slots[slot]??defaultTrait(id));
  delete slots[slot];
 }
}
export function registerCraftedGear(state,itemId,count=1){
 if(!GEAR_IDS.includes(itemId))return;
 state.gearTraits??=normalizeGearTraits(null,state.items,state.equipped);
 // Caller has already incremented count in state.items.
 const arr=state.gearTraits.bag[itemId]??=[];
 for(let i=0;i<count;i++)arr.push(defaultTrait(itemId));
}
export function gearTraitAt(state,target,id,index=0){
 if(target==='equipped')return state?.gearTraits?.equipped?.[id]??null;
 const list=state?.gearTraits?.bag?.[id]??[];
 return list[Math.floor(index)]??null;
}
export function enhanceGear(state,{place='bag',id,index=0},kind='upgrade'){
 const trait=gearTraitAt(state,place,id,index);
 if(!trait)return {ok:false,reason:'No hay un equipo válido seleccionado'};
 if(kind==='upgrade'){
  if(trait.plus>=MAX_ENHANCEMENT)return {ok:false,reason:'Este equipo ya está en +9'};
  const count=1+Math.floor(trait.plus/3);
  if((state.items?.upgrade_stone??0)<count)return {ok:false,reason:'Necesitás '+count+' piedras de mejora'};
  state.items.upgrade_stone-=count;
  trait.plus++;
  return {ok:true,trait:{...trait},spent:count,material:'Piedra de mejora'};
 }
 if(kind==='ascend'){
  if(trait.plus<MAX_ENHANCEMENT)return {ok:false,reason:'Primero mejorá el equipo hasta +9'};
  const next=rarityIndex(trait.rarity)+1;
  if(next>=RARITIES.length)return {ok:false,reason:'Este equipo ya es Mítico'};
  if((state.items?.ascension_core??0)<1)return {ok:false,reason:'Necesitás un Núcleo de Ascensión'};
  state.items.ascension_core--;
  trait.rarity=RARITIES[next];trait.plus=0;
  return {ok:true,trait:{...trait},spent:1,material:'Núcleo de Ascensión'};
 }
 return {ok:false,reason:'Acción desconocida'};
}
