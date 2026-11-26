// P559: deterministic landscape policy. Source placements are never edited/deleted.
// Dense city lots retain ornamental trees; countryside keeps wider natural spacing.
// Existing native vegetation beyond the region rectangle is not modified.
export function thinRegionPlants(plants,d,p){
 const urban=new Set((d.zones??[]).filter(z=>['town','harbour','castle','market','hamlet','fishing','mine','camp','monastery'].includes(z.kind)).flatMap(z=>[z.tile,...(z.tiles??[])]));
 const rural=new Set((d.zones??[]).filter(z=>['farm','lumber'].includes(z.kind)).flatMap(z=>[z.tile,...(z.tiles??[])]));
 const cells=new Map(),tiles=new Map(d.tiles.map(t=>[t.q*65536+t.r,t])),R=d.tileRadius,S=p.scale;
 const key=(x,z)=>Math.floor(x/8)+','+Math.floor(z/8);
 function tileAt(t){const x=(t.x-p.x)/S,z=(t.z-p.z)/S,q=Math.round((Math.sqrt(3)*x/3-z/3)/R),r=Math.round(2*z/(3*R));let best=null,dist=Infinity;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const v=tiles.get((q+a)*65536+r+b);if(v){const n=Math.hypot(v.x-x,v.z-z);if(n<dist){best=v;dist=n}}}return best}
 const kept=[],counts={sourceTrees:0,sourceShrubs:0,recycledTrees:0,extraTrees:0,keptSourceTrees:0,keptSourceShrubs:0,keptRecycledTrees:0,keptExtraTrees:0,urbanTrees:0,ruralTrees:0,removedTrees:0,removedShrubs:0};
 const priority=t=>t.source==='native-recycled'?0:t.source==='guildhall'?1:2;
 const rank=t=>{const n=Math.sin(t.x*12.9898+t.z*78.233)*43758.5453;return n-Math.floor(n)};
 for(const t of plants){if(t.source==='guildhall')counts[t.name==='shrub'?'sourceShrubs':'sourceTrees']++;else if(t.source==='native-recycled')counts.recycledTrees++;else counts.extraTrees++}
 const ordered=[...plants].sort((a,b)=>priority(a)-priority(b)||rank(a)-rank(b));
 function add(t,spacing){
  if(spacing){const R=Math.ceil(spacing/8),ix=Math.floor(t.x/8),iz=Math.floor(t.z/8);for(let a=-R;a<=R;a++)for(let b=-R;b<=R;b++)for(const other of cells.get((ix+a)+','+(iz+b))??[]){if((other.name==='shrub')!==(t.name==='shrub'))continue;if(Math.hypot(other.x-t.x,other.z-t.z)<Math.max(spacing,other.spacing))return false}}
  const k=key(t.x,t.z);if(!cells.has(k))cells.set(k,[]);cells.get(k).push({...t,spacing});kept.push(t);return true;
 }
 for(const t of ordered){
  if(t.source==='native-added')continue;
  if(t.source==='native-recycled'){add(t,0);counts.keptRecycledTrees++;continue}
  const tile=tileAt(t),isUrban=urban.has(tile?.i)||(!rural.has(tile?.i)&&/square|market|court|dock|building|castle|street/i.test(tile?.prefab??''));
  const shrub=t.name==='shrub';
  if(add(t,shrub?(isUrban?6:4):(isUrban?18:10))){if(shrub)counts.keptSourceShrubs++;else{counts.keptSourceTrees++;counts[isUrban?'urbanTrees':'ruralTrees']++}}
 }
 counts.removedTrees=counts.sourceTrees+counts.recycledTrees+counts.extraTrees-counts.keptSourceTrees-counts.keptRecycledTrees;
 counts.removedShrubs=counts.sourceShrubs-counts.keptSourceShrubs;
 return {plants:kept,counts};
}
