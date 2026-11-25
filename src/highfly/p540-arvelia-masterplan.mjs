/**
 * HIGHFLY P5.4.0 — ARVELIA MASTERPLAN
 * Reproducible real-asset composition, not a baked AI illustration.
 * Existing Unsung plaza, stairs and viaduct retained. All placements use
 * the schema-1 World Forge model, exactly shared with the RPG.
 * Real assets: KayKit Medieval Hexagon CC0, HIGHFLY MIT street furniture
 * and Unsung MIT procedural original structures.
 */
import {buildEastbrookLand} from './p538-eastbrook-land.mjs';
import {VILLAGE_DECOR_ASSETS} from './p528-village-layout.mjs';
import {PUBLIC_URBAN_ASSETS} from './p532-public-urban-assets.mjs';
import {UNSUNG_ORIGINAL_ASSETS} from './p530-unsung-original.mjs';
import {KAYKIT_FREE_ALL} from './p531-kaykit-free-catalog.mjs';

export const ARVELIA_MASTER_VERSION='p540-v1';
export const ARVELIA_PALETTE=Object.freeze({
 source:'KayKit FREE CC0 + Unsung MIT + HIGHFLY MIT + Quaternius CC0 (where actually present)',
 exactAsReference:false,
 retained:['Unsung plaza and stairs','Unsung viaduct','Unsung hillside','P539 NPCs and dialogues'],
 composited:['road network','civic courtyard','market district','smith workshop','tavern garden','chapel entry','flower gardens'],
 notShipped:['AI-image-only painted façades','premium ClaudeCraft GLB','baked warm window emission','unlicensed signs']
});
const CATALOG=new Map([...VILLAGE_DECOR_ASSETS,...PUBLIC_URBAN_ASSETS,...UNSUNG_ORIGINAL_ASSETS,...KAYKIT_FREE_ALL].map(a=>[a.id,a]));
const FIXED_SIZE={
 'floor-stone':[4,4],'floor-earth':[4,4],'floor-wood':[4,4],
 'npc-merchant':[1,1],'npc-artisan':[1,1],'npc-guard':[1,1],
 'kaykit-blacksmith':[12,12],'kaykit-market':[13,11],
 'kaykit-church':[13,13],'kaykit-tavern':[13,12],
 'kaykit-home-a':[10,9],'kaykit-home-b':[10,9],
 'unsung-hall':[25,15],
 'bench':[3,1.4],'barrel':[1.1,1.1],'fence':[4,.4]
};
const finite=Number.isFinite,round=(v,n=1)=>Math.round(v/n)*n;
const len=(a,b,c,d)=>Math.hypot(a-c,b-d);
const maybe=(fn,arg)=>{try{return fn?.(arg)}catch{return null}};
const cubic=(a,b,c,d,t)=>{const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d;};
const DEG=Math.PI/180;
/** Returns only fully validated, deterministic items; never alters external objects. */
export function buildArveliaMasterplan({
 canPlace,existing=[],sizeOf,blockedAt,buildingTypes={},maxItems=2500
}={}){
 if(typeof canPlace!=='function')throw Error('P540 requires a real Unsung terrain validator');
 const other=existing.filter(o=>o?.highflyTown!=='arvelia');
 const core=buildEastbrookLand({canPlace,existing:other,sizeOf,blockedAt,buildingTypes});
 if(!core.complete)return {...core,master:false,objects:[],reason:'No se encontró un pueblo terrestre seguro sobre el relieve auténtico'};
 const buildings=core.objects.filter(x=>!x.type.startsWith('npc-'));
 const items=core.objects.map(o=>({...o,id:o.id.replace('hf-p538-','hf-p540-'),
   highflyMaster:true,highflyTown:'arvelia',highflyZone:o.highflyNpc?'encargos':'centro'}));
 const center=core.center;
 const size=(type)=>{
  const found=sizeOf?.(type)||FIXED_SIZE[type];
  if(found)return found;
  const d=CATALOG.get(type);return d?[d.w,d.d]:[3,3];
 };
 const built=o=>!o.type.startsWith('floor-')&&!o.type.startsWith('npc-')&&
  (o.highflyRole||o.type.startsWith('kaykit-')&&o.type.includes('building'));
 const structural=buildings;
 const overlapsBuilding=(x,z,r=1.1)=>{
  return structural.some(o=>{
   const [w,d]=size(o.type),dx=x-o.x,dz=z-o.z,c=Math.cos(o.yaw),s=Math.sin(o.yaw);
   return Math.abs(dx*c+dz*s)<w*o.scale*.5+r&&Math.abs(-dx*s+dz*c)<d*o.scale*.5+r;
  });
 };
 const occupied=(x,z,r)=>items.some(o=>!o.type.startsWith('floor-')&&!o.type.startsWith('npc-')&&
  len(x,z,o.x,o.z)<r+Math.hypot(...size(o.type))*o.scale*.29);
 const counts={buildings:buildings.length,npcs:core.objects.filter(o=>o.highflyNpc).length,paving:0,decorations:0,roads:0,skipped:0,sourceModelTypes:[...new Set(core.objects.map(x=>x.type))]};
 let serial=0;const pavement=new Set(),floorRadius=0;
 const put=(type,x,z,{yaw=0,scale=1,zone='plaza',kind='decor',clearTrees=false}={})=>{
  if(items.length+other.length>=maxItems){counts.skipped++;return null;}
  const isFloor=type.startsWith('floor-'),px=isFloor?round(x,4):round(x,1),pz=isFloor?round(z,4):round(z,1);
  const id='hf-p540-'+zone+'-'+type.replace(/[^a-z0-9-]/gi,'')+'-'+String(serial++).padStart(4,'0');
  const obj={id,type,x:px,z:pz,yaw,scale,y:0,clearTrees:!!clearTrees,highflyTown:'arvelia',highflyMaster:true,highflyZone:zone};
  // The original white Unsung plaza and stair apron must stay uncovered.
  if(isFloor&&len(px,pz,-518,-71)<19){counts.skipped++;return null;}
  if(isFloor&&overlapsBuilding(px,pz,1)){counts.skipped++;return null;}
  if(!isFloor&&kind!=='flora'&&overlapsBuilding(px,pz,type.startsWith('village-stall-')?2.5:1)){counts.skipped++;return null;}
  const key=type+':'+px+':'+pz;
  if(isFloor&&pavement.has(key))return null;
  if(!isFloor&&occupied(px,pz,kind==='flora'?2.2:.8)){counts.skipped++;return null;}
  const verdict=maybe(canPlace,obj);
  if(!verdict?.ok||!finite(verdict.y)){counts.skipped++;return null;}
  obj.y=verdict.y;items.push(obj);
  if(isFloor){pavement.add(key);counts.paving++;}
  else counts.decorations++;
  return obj;
 };
 const findDecor=(type,dx,dz,{yaw=0,scale=1,zone='jardines',kind='decor'}={})=>{
  // Small local shifts keep ornaments away from native architecture/trees;
  // every final coordinate is recorded exactly in exported editable JSON.
  for(const [ox,oz] of [[0,0],[3,0],[-3,0],[0,3],[0,-3],[4,4],[-4,4],[4,-4],[-4,-4],[6,0],[-6,0]]){
   const x=center.x+dx+ox,z=center.z+dz+oz;
   if(Math.abs(x-center.x)>74||Math.abs(z-center.z)>65)continue;
   const placed=put(type,x,z,{yaw,scale,zone,kind});
   if(placed)return placed;
  }
  return null;
 };
 const tile=(x,z,kind='floor-stone',zone='caminos')=>put(kind,x,z,{zone,kind:'paving'});
 const square=(x,z,rx,rz,zone)=>{
  for(let dx=-rx;dx<=rx;dx+=4)for(let dz=-rz;dz<=rz;dz+=4){
   const u=dx/Math.max(1,rx),v=dz/Math.max(1,rz);
   if(u*u+v*v<1.03)tile(x+dx,z+dz,'floor-stone',zone);
  }
 };
 const road=(points,{width=4,zone='caminos',material='floor-stone'}={})=>{
  for(let i=0;i<points.length-1;i++){
   const a=points[i],b=points[i+1],dx=b[0]-a[0],dz=b[1]-a[1];
   const steps=Math.max(2,Math.ceil(Math.hypot(dx,dz)/2.3));
   for(let j=0;j<=steps;j++){
    const t=j/steps,x=a[0]+dx*t,z=a[1]+dz*t;
    tile(x,z,material,zone);
    if(width>=6){const inv=1/(Math.hypot(dx,dz)||1),nx=-dz*inv,nz=dx*inv;
     tile(x+nx*3,z+nz*3,material,zone);
     tile(x-nx*3,z-nz*3,material,zone);}
   }
   counts.roads++;
  }
 };
 // 1. The native stair and marble forecourt stay intact; these paths meet
 // its terrestrial entrance, leading west into the village in one flow.
 const stair=[-532,-77],cross=[center.x+20,center.z+8];
 const civic=[center.x+12,center.z-8],market=[center.x+1,center.z+2];
 square(civic[0],civic[1],11,10,'plaza-civica');
 square(market[0],market[1],11,10,'mercado');
 road([stair,cross,civic,market],{width:6,zone:'eje-principal'});
 const role=name=>buildings.find(o=>o.highflyRole===name);
 // All nine buildings get an authentic readable approach from the central
 // paving rather than being scattered amid opaque grass and trees.
 const targets=[
  ['gremio',[-5,12]],['herreria',[-11,-16]],['taberna',[-20,15]],
  ['capilla',[18,-15]],['botica',[-13,-19]],['banco',[-35,-9]],
  ['mercado',[0,4]],['casa-norte',[22,17]],['casa-sur',[-37,26]]
 ];
 for(const [name,gate] of targets){
  const b=role(name);if(!b)continue;
  const vx=b.x-center.x,vz=b.z-center.z;
  const dist=Math.hypot(vx,vz)||1;
  const front=[b.x-vx/dist*8,b.z-vz/dist*8];
  const hub=name==='gremio'||name==='capilla'?cross:market;
  road([hub,[center.x+gate[0],center.z+gate[1]],front],{width:name==='gremio'||name==='taberna'?6:4,
   zone:'camino-'+name,material:name.startsWith('casa-')?'floor-earth':'floor-stone'});
 }
 // Friendly public garden and warm street lighting around the civic center.
 const fountain=findDecor('hf-fountain-stone',13,-9,{zone:'plaza-civica',scale:.94});
 if(!fountain){
  findDecor('hf-round-flowerbed',13,-9,{zone:'plaza-civica',scale:.95});
 }
 for(const p of [
  [-9,-7],[-3,-16],[9,-19],[25,-7],[24,4],[15,15],
  [-19,11],[-27,22],[-34,6],[-46,-1],[-24,-25],[9,28],[34,-26]
 ])findDecor('hf-streetlamp-bronze',p[0],p[1],{zone:'iluminacion',scale:.9});
 for(const p of [[-18,-6],[19,-6],[8,16],[-4,18],[29,-19],[-28,19]])
  findDecor('village-banner',p[0],p[1],{zone:'banderas',scale:1});
 for(const p of [[-17,3],[3,20],[15,2],[-16,-25]])
  findDecor('unsung-bench',p[0],p[1],{zone:'descanso',scale:.9,yaw:(p[0]%3)*DEG*30});
 for(const p of [[-11,-12],[15,-16],[23,16],[-23,25],[2,32],[-37,-12],[31,-29]])
  findDecor('hf-round-flowerbed',p[0],p[1],{zone:'jardines',scale:.76});
 // 2. Occupied market and craft yards: no imaginary shop textures or fake GLBs.
 for(const [type,x,z,yaw] of [
  ['village-stall-red',-13,11,.1],['village-stall-blue',4,15,-.25],
  ['village-stall-red',-20,18,.2],['village-stall-blue',10,23,.15],
  ['village-crates',-8,18,0],['village-crates',-22,18,0],
  ['village-crates',-15,-28,0],['village-crates',-26,-13,0],
  ['hf-wooden-signpost',22,8,.4],['hf-wooden-signpost',-25,2,-.4],
  ['hf-wooden-signpost',-3,-25,.6],
  ['village-gazebo',-35,32,.1],
 ])findDecor(type,x,z,{yaw,zone:type.includes('stall')?'mercado':type.includes('crates')?'oficios':'urbanismo',
  scale:type==='village-gazebo'?.75:1});
 for(const p of [[-11,-28],[-28,-21],[-21,28],[4,29],[31,-21],[29,9]])
  findDecor('village-lamp',p[0],p[1],{zone:'calle',scale:1});
 // 3. Terraced gardens, flowerbeds and shrubbery. Keep native Unsung tree
 // positions: decorative additions are shifted when blocked, never overwrite.
 for(const p of [
  [-52,-17],[-45,18],[-43,37],[-58,30],[-31,42],
  [10,35],[39,25],[42,-10],[-46,-33],[-23,-40],[28,-35],
 ])findDecor(['village-blossom','village-lilac','village-autumn'][Math.abs(Math.round(p[0]+p[1]))%3],
  p[0],p[1],{zone:'arboleda',scale:.92,kind:'flora'});
 for(const p of [
  [-10,-22],[-13,-23],[-16,-22],[-26,-28],[-28,-28],
  [9,-22],[11,-24],[17,-23],[18,-23],
  [-29,35],[-32,35],[-35,34],
  [24,18],[27,18],[30,18],
  [33,-14],[35,-16],[34,-19],
  [-50,13],[-50,17],[-46,14],
 ])findDecor('village-shrub',p[0],p[1],{zone:'arbustos',scale:.8,kind:'flora'});
 for(const p of [
  [-2,-13],[4,-13],[16,-3],[14,8],[12,18],[18,21],
  [-18,11],[-24,12],[-37,17],[-44,-11],[-30,-24],
  [29,-27],[31,-26],[-27,31],[-12,31],[6,33]
 ])findDecor('village-flowerbed',p[0],p[1],{zone:'flores',scale:.95});
 const result={complete:true,master:true,version:ARVELIA_MASTER_VERSION,
  center:core.center,turn:core.turn,objects:items,counts,
  fountain:fountain?{x:fountain.x,z:fountain.z,type:fountain.type}:null,
  roles:buildings.map(o=>({role:o.highflyRole,type:o.type,x:o.x,z:o.z,yaw:o.yaw,scale:o.scale})),
  reason:'Plano maestro compuesto con prefabs originales y caminos adaptados al terreno'};
 if(items.length+other.length>maxItems)throw Error('P540 plan exceeds 2500 records');
 if(items.some(o=>!finite(o.x)||!finite(o.z)||!finite(o.y)||!finite(o.yaw)||!finite(o.scale)))
  throw Error('P540 invalid coordinates in plan');
 return result;
}
