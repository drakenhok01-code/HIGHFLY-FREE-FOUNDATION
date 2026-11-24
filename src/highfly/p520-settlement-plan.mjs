/** HIGHFLY P5.2.0: deterministic, non-destructive settlement planner.
 * Uses ONLY runtime Unsung terrain queries. No modifications to height maps,
 * original stairs, tuning spires, original NPC/quests, or hunting spot spawns.
 * All coordinates are suggestions, resolved against the actual live terrain.
 */
export const P520_SETTLEMENTS = Object.freeze([
 {id:'arvelia',name:'Arvelia · Ciudad de los Inicios',kind:'city',at:{x:-615,z:-75},
  buildings:[
   {id:'guild',label:'Gremio de Aventureros',type:'guild',dx:0,dz:0,w:12,d:10,h:8,yaw:0,npc:'Arden',role:'Maestro del Gremio',menu:'misiones'},
   {id:'forge',label:'Herrería de Arvelia',type:'forge',dx:-20,dz:8,w:10,d:8,h:7,yaw:.2,npc:'Borin',role:'Maestro Herrero',menu:'forja'},
   {id:'market',label:'Mercado del Alba',type:'market',dx:19,dz:8,w:10,d:8,h:6,yaw:-.2,npc:'Elisia',role:'Comerciante',menu:'bolsa'},
   {id:'inn',label:'Posada del Alba',type:'inn',dx:0,dz:21,w:11,d:9,h:7,yaw:Math.PI,npc:null,menu:'personaje'}
  ]},
 {id:'cultivos',name:'Campos de Arvelia',kind:'farm',at:{x:-302,z:397},nearHunt:'boar',offset:{x:44,z:15},
  buildings:[
   {id:'windmill',label:'Molino de los Campos',type:'mill',dx:0,dz:0,w:10,d:9,h:9,yaw:0,npc:'Lia',role:'Molinera',menu:'oficios'},
   {id:'granary',label:'Granero de la Pradera',type:'granary',dx:17,dz:8,w:10,d:8,h:6,yaw:0,npc:null,menu:'oficios'}
  ],
  resources:[{id:'farm-plot',kind:'soil',dx:11,dz:-16,growSeconds:12}]},
 {id:'lumeria',name:'Embarcadero de Lumeria',kind:'port',at:{x:760,z:125},nearHunt:'crab',offset:{x:48,z:24},
  buildings:[
   {id:'fishery',label:'Lonja de Pescadores',type:'fishery',dx:0,dz:0,w:10,d:8,h:6,yaw:0,npc:'Ren',role:'Capitán del Embarcadero',menu:'misiones'},
   {id:'warehouse',label:'Almacén del Puerto',type:'warehouse',dx:17,dz:8,w:10,d:8,h:7,yaw:-.2,npc:null,menu:'bolsa'}
  ],
  resources:[{id:'shore-fish',kind:'fishSpot',dx:-12,dz:8,charges:5}]},
 {id:'cordillera',name:'Puesto Minero del Umbral',kind:'mine',at:{x:-145,z:-565},
  buildings:[
   {id:'smelter',label:'Fundición del Umbral',type:'smelter',dx:0,dz:0,w:10,d:9,h:8,yaw:0,npc:'Grom',role:'Capataz Minero',menu:'oficios'},
   {id:'stockpile',label:'Depósito de Mineral',type:'warehouse',dx:17,dz:6,w:9,d:8,h:6,yaw:0,npc:null,menu:'bolsa'}
  ],
  resources:[{id:'ore-face',kind:'ore',dx:-14,dz:6,charges:5},{id:'kiln',kind:'furnace',dx:-6,dz:-14}]},
 {id:'bosque',name:'Campamento de los Susurros',kind:'camp',at:{x:-308,z:-475},nearHunt:'wolf',offset:{x:-40,z:-24},
  buildings:[
   {id:'ranger',label:'Refugio de Guardabosques',type:'ranger',dx:0,dz:0,w:9,d:8,h:6,yaw:0,npc:'Mirel',role:'Guardabosques',menu:'misiones'}
  ],
  resources:[{id:'logging',kind:'tree',dx:12,dz:-11,charges:5}]}
]);
export const P520_PROTECTED=Object.freeze([
 {id:'dawn-spawn',x:-519,z:-70,r:53},
 ...[['petal',-372,-392,36],['cantor',66,-498,38],['choir',150,-15,49],['east',578,-437,37],
 ['south3',517,437,37],['aurel',136,546,37],['south1',-405,435,38],['crown',-1005,-168,54]]
 .map(([id,x,z,r])=>({id:'spire-'+id,x,z,r})),
 {id:'petal-cantor-stairs',x:-179,z:-459,r:28}
]);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function footprint(world,x,z,w,d,yaw=0){
 const points=[[0,0],[-w*.5,-d*.5],[w*.5,-d*.5],[-w*.5,d*.5],[w*.5,d*.5]];
 const c=Math.cos(yaw),s=Math.sin(yaw),heights=[];
 for(const [dx,dz] of points){
  const px=x+dx*c-dz*s,pz=z+dx*s+dz*c;
  const h=world.groundHeight(px,pz);
  if(!finite(h))return null;
  const water=world.waterLevel?.(px,pz);
  if(finite(water)&&water>=h-.1)return null;
  heights.push(h);
 }
 const min=Math.min(...heights),max=Math.max(...heights);
 if(max-min>1.75)return null;
 return {x,y:max+.05,z,grade:max-min};
}
function safe(world,p,w,d,yaw,protectedZones,placed,margin=2){
 const f=footprint(world,p.x,p.z,w,d,yaw);if(!f)return null;
 const radius=Math.hypot(w,d)*.45;
 if(protectedZones.some(q=>distance(p,q)<q.r+radius+margin))return null;
 if(placed.some(q=>distance(p,q)<q.radius+radius+margin))return null;
 return {...f,radius};
}
export function findSafeSite(world,wish,w,d,yaw,protectedZones=[],placed=[],radius=24){
 // Probe nearest first; deterministic rings, never randomly teleport a building.
 for(let ring=0;ring<=radius;ring+=4){
  const n=ring?Math.max(8,Math.ceil(2*Math.PI*ring/6)):1;
  for(let i=0;i<n;i++){
   const a=n===1?0:2*Math.PI*i/n,point={x:wish.x+Math.cos(a)*ring,z:wish.z+Math.sin(a)*ring};
   const found=safe(world,point,w,d,yaw,protectedZones,placed);
   if(found)return found;
  }
 }
 return null;
}
export function planP520Settlements(world,hunts=null){
 if(!world?.groundHeight)return {placed:[],resources:[],skipped:[{id:'world',reason:'no live terrain'}],regions:[]};
 const placed=[],resources=[],skipped=[],regions=[];
 const protectedZones=[...P520_PROTECTED];
 // Never bury the three existing animated hunt packs or their quest givers.
 for(const id of ['wolf','boar','crab']){
  const spot=hunts?.spots?.[id];
  if(spot?.point)protectedZones.push({id:'hunt-'+id,x:spot.point.x,z:spot.point.z,r:24});
  if(spot?.npc)protectedZones.push({id:'hunt-npc-'+id,x:spot.npc.x,z:spot.npc.z,r:7});
 }
 for(const r of P520_SETTLEMENTS){
  const hunt=r.nearHunt&&hunts?.spots?.[r.nearHunt]?.point;
  const anchor=hunt?{x:hunt.x+r.offset.x,z:hunt.z+r.offset.z}:r.at;
  // A whole region is skipped when its requested district cannot be placed.
  let regionCount=0;
  for(const def of r.buildings){
   const wish={x:anchor.x+def.dx,z:anchor.z+def.dz};
   const found=findSafeSite(world,wish,def.w,def.d,def.yaw,protectedZones,placed,24);
   if(!found){skipped.push({id:r.id+'/'+def.id,reason:'slope/water/obstacle/protected area'});continue;}
   const obj={...def,id:r.id+'/'+def.id,region:r.id,regionName:r.name,...found};
   placed.push(obj);regionCount++;
  }
  for(const node of r.resources??[]){
   const wish={x:anchor.x+node.dx,z:anchor.z+node.dz};
   const found=findSafeSite(world,wish,2,2,0,protectedZones,placed,12);
   if(!found){skipped.push({id:r.id+'/'+node.id,reason:'resource terrain unsafe'});continue;}
   resources.push({...node,id:'hf-p520-'+r.id+'-'+node.id,region:r.id,...found,available:true});
  }
  regions.push({id:r.id,name:r.name,buildings:regionCount,nearHunt:r.nearHunt??null});
 }
 return {placed,resources,skipped,regions};
}
