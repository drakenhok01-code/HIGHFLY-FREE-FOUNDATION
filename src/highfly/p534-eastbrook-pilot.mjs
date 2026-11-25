/**
 * HIGHFLY UNSUNG 13 / P5.3.4 — Eastbrook -> Arvelia pilot.
 *
 * Only the six roles and relative town-planning coordinates are studied
 * from World of ClaudeCraft's MIT TypeScript layout (eastbrook_layout.ts).
 * None of the restricted Tidehold GLBs, materials or audio are copied.
 * Real houses: KayKit FREE (CC0). Special guild hall: native Unsung (MIT).
 * All coordinates must pass the in-editor heightfield and collision checks.
 */
export const EASTBROOK_PILOT_SPECS=Object.freeze([
 // Offsets relative to ClaudeCraft's CIVIC_CENTER (-14,-102).
 {role:'banco',sourceId:'eastbrook_bank',type:'kaykit-home-b',dx:-47.99,dz:-16.33,yaw:225*Math.PI/180,scale:1.3,required:true},
 {role:'herreria',sourceId:'eastbrook_smithy',type:'kaykit-blacksmith',dx:9.8,dz:26.8,yaw:20*Math.PI/180,scale:1.25,required:true},
 {role:'taberna',sourceId:'eastbrook_inn',type:'kaykit-tavern',dx:-16.34,dz:41.37,yaw:24*Math.PI/180,scale:1.3,required:true},
 {role:'capilla',sourceId:'eastbrook_chapel',type:'kaykit-church',dx:42.2,dz:-17.62,yaw:125*Math.PI/180,scale:1.25,required:true},
 {role:'botica',sourceId:'eastbrook_apothecary',type:'kaykit-home-a',dx:-16.59,dz:-25.63,yaw:175*Math.PI/180,scale:1.3,required:true},
 {role:'casa_muelle',sourceId:'eastbrook_quay_cottage',type:'kaykit-home-b',dx:-45.11,dz:50.65,yaw:46*Math.PI/180,scale:1.25,required:true},
 // Additional HIGHFLY buildings, not claimed to be the original ClaudeCraft ones.
 {role:'gremio_highfly',sourceId:null,type:'unsung-hall',dx:61,dz:39,yaw:Math.PI,scale:1,required:true},
 {role:'mercado_highfly',sourceId:null,type:'kaykit-market',dx:3,dz:1,yaw:0,scale:1,required:false},
 {role:'vivienda_1',sourceId:null,type:'kaykit-home-a',dx:45,dz:61,yaw:.4,scale:1.1,required:false},
 {role:'vivienda_2',sourceId:null,type:'kaykit-home-a',dx:-68,dz:23,yaw:-.5,scale:1.1,required:false},
 {role:'torre_entrada',sourceId:null,type:'unsung-tower',dx:65,dz:-47,yaw:0,scale:.85,required:false},
]);
const DIMENSIONS=Object.freeze({
 'kaykit-home-a':[10,9],'kaykit-home-b':[10,9],
 'kaykit-blacksmith':[12,12],'kaykit-tavern':[13,12],
 'kaykit-church':[13,13],'kaykit-market':[13,11],
 'unsung-hall':[25,15],'unsung-tower':[9,9]
});
const sn=(x,s=2)=>Math.round(x/s)*s;
const radius=o=>{const d=DIMENSIONS[o.type];return Math.hypot(d[0],d[1])*o.scale*.32;};
const overlaps=(o,placed)=>placed.some(p=>Math.hypot(o.x-p.x,o.z-p.z)<radius(o)+radius(p)+1.4);
const shifts=Object.freeze([[0,0],[6,0],[-6,0],[0,6],[0,-6],[12,0],[-12,0],[0,12],[0,-12],[9,9],[-9,-9],[9,-9],[-9,9]]);
const centres=Object.freeze([[0,0],[24,0],[-24,0],[0,24],[0,-24],[40,0],[-40,0],[0,40],[0,-40],[24,24],[-24,-24],[24,-24],[-24,24],[56,0],[-56,0],[0,56],[0,-56],[-96,0],[-112,0],[-128,0],[-144,0],[-160,0],[-176,0],[-128,24],[-144,24],[-160,24],[-128,-24],[-144,-24],[-160,-24],[-176,24],[-176,-24]]);
function buildForCenter(center,canPlace,tag){
 const placed=[],roles=[],missing=[];
 for(let i=0;i<EASTBROOK_PILOT_SPECS.length;i++){
  const spec=EASTBROOK_PILOT_SPECS[i];
  let found=false;
  for(const [dx,dz] of shifts){
   const o={id:tag+'-'+i, type:spec.type,
    x:sn(center.x+spec.dx+dx),z:sn(center.z+spec.dz+dz),
    yaw:spec.yaw,scale:spec.scale,y:0,clearTrees:true};
   if(overlaps(o,placed))continue;
   const check=canPlace(o);
   if(!check?.ok)continue;
   o.y=Number.isFinite(check.y)?check.y:0;
   o.highflyTown='eastbrook';o.highflyRole=spec.role;
   placed.push(o);roles.push(spec.role);found=true;break;
  }
  if(!found)missing.push(spec.role);
 }
 const requiredMissing=missing.filter(role=>EASTBROOK_PILOT_SPECS.find(s=>s.role===role)?.required);
 return {center,objects:placed,roles,missing,requiredMissing,
  primary:roles.filter(r=>EASTBROOK_PILOT_SPECS.find(s=>s.role===r)?.sourceId).length,
  complete:requiredMissing.length===0};
}
/**
 * Deliberately returns a PREVIEW plan only. The browser integration checks
 * every actual GLTF before a confirmed, backed-up additive commit.
 */
export function buildEastbrookPilot({origin={x:-512,z:-70},canPlace,existing=[]}={}){
 if(typeof canPlace!=='function')throw Error('Se requiere validación del terreno Unsung real');
 if(!Number.isFinite(origin?.x)||!Number.isFinite(origin?.z))throw Error('Centro inválido');
 const tag='hf-p534-eastbrook-'+Date.now().toString(36);
 const src={x:sn(origin.x,4),z:sn(origin.z,4)};
 let best=null,bestScore=-Infinity;
 for(const [dx,dz] of centres){
  const center={x:src.x+dx,z:src.z+dz};
  const proposal=buildForCenter(center,canPlace,tag);
  const score=proposal.primary*1000+(proposal.complete?10000:0)+
   proposal.roles.length*20-Math.hypot(dx,dz)*.3;
  if(score>bestScore){bestScore=score;best=proposal;}
 }
 return {...best,origin:src,existingCount:existing.length,
  credits:'ClaudeCraft MIT layout reference / KayKit FREE CC0 / Unsung MIT',
  warning:'Sin confirmación en el S23 Ultra; no duplicar ni sustituir edificios originales'};
}
