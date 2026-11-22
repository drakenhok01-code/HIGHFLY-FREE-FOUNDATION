/** HIGHFLY P4.6 — one physical-slot accounting model for every interaction.
 * Item ID quantities may span several slots, while each physical equipment
 * instance always occupies one slot and keeps its individual saved traits.
 * Never confuse total quantity, unique IDs and occupied inventory cells.
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
export function occupiedBagSlots(items={},professionInventory={},defs={}){
 const totals=combinedCounts(items,professionInventory);
 return Object.entries(totals).reduce((slots,[id,count])=>{
  const def=defs[id],max=perSlotLimit(def);
  return max>0?slots+Math.ceil(count/max):slots;
 },0);
}
export function inventoryStackRows(items={},professionInventory={},defs={}){
 const totals=combinedCounts(items,professionInventory);
 return Object.entries(totals).flatMap(([id,count])=>{
  const def=defs[id],max=perSlotLimit(def);
  if(!max)return [];
  const rows=[],quantity=Math.ceil(count/max);
  for(let i=0;i<quantity;i++)rows.push({...def,count:Math.min(max,count-i*max),
   stackIndex:i,variantIndex:isPhysicalGear(def)?i:0});
  return rows;
 }).sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name)||a.stackIndex-b.stackIndex);
}
export function bagCapacityStatus(items={},stock={},defs={},slots=36){
 const used=occupiedBagSlots(items,stock,defs);
 return {used,capacity:slots,free:Math.max(0,slots-used),ok:used<=slots};
}
