/**
 * HIGHFLY P5.3.8 — Arvelia / Eastbrook LAND layout (experimental).
 *
 * Relative civic-role planning based on the MIT World of ClaudeCraft
 * v0.44.7 Eastbrook TypeScript layout studied by HIGHFLY P5.3.4.
 * The 0.45.8 rebuild is NOT treated as a licensed asset library.
 * No Tidehold GLBs, project-only art, text, sound, harbor or quay included.
 * Visible prefabs: already bundled KayKit FREE CC0 and Unsung MIT only.
 * The native Unsung terrain and stair/plaza meshes are never changed here.
 */
export const EASTBROOK_LAND_ANCHOR=Object.freeze({x:-512,z:-70});
export const EASTBROOK_LAND_SPECS=Object.freeze([
 {role:'banco',source:'eastbrook_bank',type:'kaykit-home-b',dx:-47.99,dz:-16.33,yaw:225,scale:1.15,required:true},
 {role:'herreria',source:'eastbrook_smithy',type:'kaykit-blacksmith',dx:9.80,dz:26.80,yaw:20,scale:1.18,required:true},
 {role:'taberna',source:'eastbrook_inn',type:'kaykit-tavern',dx:-16.34,dz:41.37,yaw:24,scale:1.18,required:true},
 {role:'capilla',source:'eastbrook_chapel',type:'kaykit-church',dx:42.20,dz:-17.62,yaw:125,scale:1.15,required:true},
 {role:'botica',source:'eastbrook_apothecary',type:'kaykit-home-a',dx:-16.59,dz:-25.63,yaw:175,scale:1.16,required:true},
 {role:'gremio',source:null,type:'unsung-hall',dx:33,dz:39,yaw:180,scale:0.85,required:true},
 {role:'mercado',source:null,type:'kaykit-market',dx:2,dz:1,yaw:0,scale:0.92,required:false},
 {role:'casa-norte',source:null,type:'kaykit-home-a',dx:50,dz:49,yaw:18,scale:1.05,required:false},
 {role:'casa-sur',source:null,type:'kaykit-home-b',dx:-55,dz:48,yaw:-30,scale:1.05,required:false}
]);
export const EASTBROOK_NPCS=Object.freeze([
 {id:'sera',name:'Sera',type:'npc-merchant',at:'gremio',quest:'primer-encargo',dx:0,dz:-11},
 {id:'borin',name:'Borin',type:'npc-artisan',at:'herreria',quest:'primer-encargo',dx:8,dz:1},
 {id:'galdren',name:'Galdren',type:'npc-guard',at:'capilla',quest:'caminos',dx:8,dz:-7},
 {id:'mila',name:'Mila',type:'npc-merchant',at:'mercado',quest:'caminos',dx:0,dz:9}
]);
// Curated LAND-only positions around the foot of the plaza stair. Never scan
// 150+ metres west as P5.3.4 did. Reject all underwater/blocked candidates.
const CENTERS=Object.freeze([
 [-462,-110],[-474,-127],[-453,-84],[-496,-125],[-542,-126],
 [-561,-94],[-469,-46],[-521,-149],[-442,-146],[-580,-117]
]);
const SHIFTS=Object.freeze([[0,0],[5,0],[-5,0],[0,5],[0,-5],[10,0],[-10,0],[0,10],[0,-10],[8,8],[-8,-8],[8,-8],[-8,8],[15,0],[-15,0],[0,15],[0,-15]]);
const SIZE=Object.freeze({
 'kaykit-home-a':[10,9],'kaykit-home-b':[10,9],'kaykit-blacksmith':[12,12],
 'kaykit-tavern':[13,12],'kaykit-church':[13,13],'kaykit-market':[13,11],
 'unsung-hall':[25,15],
 'npc-merchant':[1,1],'npc-guard':[1,1],'npc-artisan':[1,1]
});
const round=(n,s=2)=>Math.round(n/s)*s;
const finite=Number.isFinite;
const radius=(o,sizeOf)=>{
 const [w,d]=sizeOf?.(o.type)||SIZE[o.type]||[16,13];
 return Math.hypot(w,d)*Math.max(.5,o.scale||1)*.32;
};
const isBuilding=o=>!o.type?.startsWith('npc-')&&!o.type?.startsWith('floor-')&&!o.type?.startsWith('road-');
function occupied(o,placed,existing,sizeOf){
 if(!isBuilding(o))return false;
 return [...placed,...existing].some(p=>isBuilding(p)&&Math.hypot(p.x-o.x,p.z-o.z)<radius(p,sizeOf)+radius(o,sizeOf)+2.5);
}
function rotate(dx,dz,turn){
 if(turn===1)return [-dz,dx];if(turn===2)return [-dx,-dz];
 if(turn===3)return [dz,-dx];return [dx,dz];
}
function attempt(center,turn,{canPlace,existing,sizeOf,blockedAt}){
 const result=[],missing=[],lookup=new Map(),scaleOffsets=.75;
 for(const spec of EASTBROOK_LAND_SPECS){
  const [ox,oz]=rotate(spec.dx*scaleOffsets,spec.dz*scaleOffsets,turn);
  let placed=null;
  for(const [mx,mz] of SHIFTS){
   const o={id:'hf-p538-eastbrook-'+spec.role,type:spec.type,
     x:round(center.x+ox+mx),z:round(center.z+oz+mz),
     yaw:(spec.yaw+turn*90)*Math.PI/180,scale:spec.scale,y:0,clearTrees:false,
     highflyTown:'arvelia',highflyRole:spec.role,highflyOrigin:'claudecraft-mit-layout'};
   // Plaza/stair protected and NO dock area. Never clear the native trees:
   // instead move this lot to an adjacent valid position.
   if(Math.hypot(o.x-EASTBROOK_LAND_ANCHOR.x,o.z-EASTBROOK_LAND_ANCHOR.z)>115)continue;
   if(occupied(o,result,existing,sizeOf))continue;
   if(blockedAt?.(o.x,o.z,radius(o,sizeOf)))continue;
   const check=canPlace(o);
   if(!check?.ok||!finite(check.y))continue;
   placed={...o,y:check.y};break;
  }
  if(placed){result.push(placed);lookup.set(spec.role,placed);}
  else missing.push(spec.role);
 }
 const npcMissing=[];
 for(const spec of EASTBROOK_NPCS){
  const target=lookup.get(spec.at);
  if(!target){npcMissing.push(spec.id);continue;}
  let placed=null;
  for(const [ox,oz] of SHIFTS){
   const o={id:'hf-p538-npc-'+spec.id,type:spec.type,
    x:round(target.x+spec.dx+ox,1),z:round(target.z+spec.dz+oz,1),
    yaw:0,scale:1,y:0,clearTrees:false,
    highflyTown:'arvelia',highflyNpc:spec.id,highflyName:spec.name,
    highflyQuest:spec.quest};
   if(blockedAt?.(o.x,o.z,1.2))continue;
   const check=canPlace(o);
   if(!check?.ok||!finite(check.y))continue;
   placed={...o,y:check.y};break;
  }
  if(placed)result.push(placed);else npcMissing.push(spec.id);
 }
 const needed=EASTBROOK_LAND_SPECS.filter(s=>s.required).map(s=>s.role);
 const complete=needed.every(x=>lookup.has(x))&&['sera','borin','galdren'].every(x=>!npcMissing.includes(x));
 return {center,turn,objects:result,missing,npcMissing,complete,
  major:needed.length-needed.filter(x=>missing.includes(x)).length,
  optional:EASTBROOK_LAND_SPECS.length-needed.length-missing.filter(x=>!needed.includes(x)).length};
}
/**
 * Pure deterministic placement. Call canPlace with REAL Unsung terrain/stairs,
 * water, original geometry and local editor collisions. On failure make NO edit.
 */
export function buildEastbrookLand({canPlace,existing=[],sizeOf,blockedAt}={}){
 if(typeof canPlace!=='function')throw Error('Arvelia: terreno original sin validador');
 if(!Array.isArray(existing))throw Error('Arvelia: plano inválido');
 if(existing.some(o=>o?.highflyTown==='arvelia'&&String(o.id).startsWith('hf-p538-')))
  return {complete:false,duplicate:true,objects:[],reason:'Arvelia ya está colocada'};
 let best=null,bestScore=-Infinity;
 for(const [x,z] of CENTERS)for(let turn=0;turn<4;turn++){
  const candidate=attempt({x,z},turn,{canPlace,existing,sizeOf,blockedAt});
  const score=candidate.major*10000+(candidate.complete?100000:0)+
   candidate.objects.length*80-Math.hypot(x-EASTBROOK_LAND_ANCHOR.x,z-EASTBROOK_LAND_ANCHOR.z)*2;
  if(score>bestScore){best=candidate;bestScore=score;}
 }
 return {...best,objects:best.complete?best.objects:[],reason:best.complete?'listo':'Sin seis edificios principales y los tres NPC en terreno seco: no se hizo ningún cambio',
  attribution:'ClaudeCraft MIT planning reference; KayKit FREE CC0; Unsung MIT',
  legal:'No ClaudeCraft Tidehold GLBs, no puerto, no modelos o diálogos con restricciones'};
}
export const EASTBROOK_MISSIONS=Object.freeze([
 {id:'primer-encargo',title:'La llama de Arvelia',steps:['sera','borin','sera'],
  dialogues:['Sera: Bienvenido a Arvelia. El gremio necesita manos nuevas. Hablá con Borin en la herrería.',
   'Borin: La forja sigue encendida. Decile a Sera que el pueblo ya tiene un artesano dispuesto a ayudar.',
   'Sera: ¡Excelente! Completaste tu primer encargo del gremio.']},
 {id:'caminos',title:'Guardianes del camino',steps:['galdren','mila','galdren'],
  dialogues:['Galdren: Protegemos el acceso a la plaza. Preguntale a Mila si necesita suministros.',
   'Mila: El mercado está listo. Avisale a Galdren que podemos abastecer a los viajeros.',
   'Galdren: ¡Buen trabajo! El camino de Arvelia vuelve a estar comunicado.']}
]);
