/** HIGHFLY P4.8 — one inventory grouping contract for visuals AND capacity.
 * Identical gear (same item ID + rarity + enhancement) stacks as one visible
 * slot up to that gear's max. Distinct traits NEVER merge; underlying
 * per-instance gearTraits arrays remain untouched for equip/save/upgrade.
 */
export const isPhysicalGear=def=>def?.kind==='Equipamiento'||def?.kind==='Accesorios';
export function perSlotLimit(def){
 if(!def)return 0;
 return isPhysicalGear(def)?1:Math.max(1,Math.floor(Number(def.max)||1));
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
const identity=(trait,def)=>JSON.stringify([
  trait?.rarity??def?.rarity??'Común',Number.isInteger(trait?.plus)?trait.plus:0
]);
export function inventoryStackRows(items={},professionInventory={},defs={},gearTraits={}){
 const totals=combinedCounts(items,professionInventory);
 return Object.entries(totals).flatMap(([id,count])=>{
  const def=defs[id];
  if(!def)return [];
  if(isPhysicalGear(def)){
   const traits=Array.isArray(gearTraits?.[id])?gearTraits[id]:[];
   const limit=Math.max(1,Math.floor(Number(def.max)||10));
   const groups=new Map();
   for(let i=0;i<count;i++){
    const key=identity(traits[i],def),group=groups.get(key)??[];
    group.push(i);
    groups.set(key,group);
   }
   const rows=[];
   for(const [key,indices] of groups){
    for(let start=0;start<indices.length;start+=limit){
     const part=indices.slice(start,start+limit);
     rows.push({...def,count:part.length,stackIndex:part[0],
      variantIndex:part[0],variantIndices:part,traitKey:key});
    }
   }
   return rows;
  }
  const max=perSlotLimit(def),rows=[];
  for(let i=0;i<Math.ceil(count/max);i++)
   rows.push({...def,count:Math.min(max,count-i*max),stackIndex:i,variantIndex:0});
  return rows;
 }).sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name)||a.stackIndex-b.stackIndex);
}
export function occupiedBagSlots(items={},stock={},defs={},gearTraits={}){
 return inventoryStackRows(items,stock,defs,gearTraits).length;
}
export function bagCapacityStatus(items={},stock={},defs={},slots=36,gearTraits={}){
 const used=occupiedBagSlots(items,stock,defs,gearTraits);
 return {used,capacity:slots,free:Math.max(0,slots-used),ok:used<=slots};
}
