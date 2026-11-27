/** HIGHFLY P4.8 — one inventory grouping contract for visuals AND capacity.
 * Gear of the same item ID and rarity stacks as one visible
 * slot without the legacy ten-copy limit. Enhancements remain distinct individual traits; underlying
 * per-instance gearTraits arrays remain untouched for equip/save/upgrade.
 */
export const MAX_GEAR_COPIES_PER_ID=9999; // persistence safety ceiling, not a visual stack cap
export const isPhysicalGear=def=>def?.kind==='Equipamiento'||def?.kind==='Accesorios';
export function perSlotLimit(def){
 if(!def)return 0;
 return isPhysicalGear(def)?MAX_GEAR_COPIES_PER_ID:Math.max(1,Math.floor(Number(def.max)||1));
}
export function combinedCounts(items={},professionInventory={}){
 const totals={};
 for(const pool of [items,professionInventory]){
  for(const [source,n] of Object.entries(pool??{})){
   if(!Number.isInteger(n)||n<=0)continue;
   const id=source==='ingot'?'ingot_iron':source;
   totals[id]=(totals[id]??0)+n;
  }
 }
 return totals;
}
const identity=(trait,def)=>JSON.stringify([trait?.rarity??def?.rarity??'Común']);
// Subgroups are only for the detail selector, never extra bag cells.
export function enhancementChoices(indices=[],traits=[]){
 const levels=new Map();
 for(const index of indices){const plus=Number.isInteger(traits[index]?.plus)?traits[index].plus:0;const row=levels.get(plus)??{plus,count:0,index,indices:[]};row.count++;row.indices.push(index);levels.set(plus,row);}
 return [...levels.values()].sort((a,b)=>a.plus-b.plus);
}
export function inventoryStackRows(items={},professionInventory={},defs={},gearTraits={}){
 const totals=combinedCounts(items,professionInventory);
 return Object.entries(totals).flatMap(([id,count])=>{
  const def=defs[id];
  if(!def)return [];
  if(isPhysicalGear(def)){
   const traits=Array.isArray(gearTraits?.[id])?gearTraits[id]:[];
   const groups=new Map();
   for(let i=0;i<count;i++){
    const key=identity(traits[i],def),group=groups.get(key)??[];
    group.push(i);
    groups.set(key,group);
   }
   const rows=[];
   for(const [key,indices] of groups){
    rows.push({...def,count:indices.length,stackIndex:indices[0],
      variantIndex:indices[0],variantIndices:indices,traitKey:key});
   }
   return rows;
  }
  const max=perSlotLimit(def),rows=[];
  for(let i=0;i<Math.ceil(count/max);i++)
   rows.push({...def,count:Math.min(max,count-i*max),stackIndex:i,variantIndex:0});
  return rows;
 }).sort((a,b)=>String(a.kind??'').localeCompare(String(b.kind??''))||String(a.name??a.id).localeCompare(String(b.name??b.id))||a.stackIndex-b.stackIndex);
}
export function occupiedBagSlots(items={},stock={},defs={},gearTraits={}){
 return inventoryStackRows(items,stock,defs,gearTraits).length;
}
export function bagCapacityStatus(items={},stock={},defs={},slots=36,gearTraits={}){
 const used=occupiedBagSlots(items,stock,defs,gearTraits);
 return {used,capacity:slots,free:Math.max(0,slots-used),ok:used<=slots};
}
