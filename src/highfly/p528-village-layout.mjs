/* HIGHFLY UNSUNG 12 · Pueblo de los Inicios · compositional preset.
 * Deterministic, reversible schema-1 World Forge objects. Never modifies terrain.
 * Uses bundled CC0 KayKit FREE buildings + new original HIGHFLY/Unsung-style décor.
 * Paid KayKit SOURCE parts and Mixed Bag 2 must remain private, not copied here.
 */
export const VILLAGE_DECOR_ASSETS=Object.freeze([
 {id:'village-blossom',label:'Árbol rosa · floración',icon:'🌸',cat:'Naturaleza',w:5,d:5},
 {id:'village-lilac',label:'Árbol violeta · floración',icon:'🌺',cat:'Naturaleza',w:6,d:6},
 {id:'village-autumn',label:'Árbol ámbar otoñal',icon:'🍁',cat:'Naturaleza',w:5,d:5},
 {id:'village-shrub',label:'Arbusto redondeado',icon:'🌿',cat:'Naturaleza',w:2.4,d:2.4},
 {id:'village-flowerbed',label:'Jardinera con flores',icon:'💐',cat:'Decoración',w:3,d:1.8},
 {id:'village-stall-red',label:'Puesto de mercado rojo',icon:'🏪',cat:'Decoración',w:5,d:4},
 {id:'village-stall-blue',label:'Puesto de mercado azul',icon:'🏪',cat:'Decoración',w:5,d:4},
 {id:'village-gazebo',label:'Pabellón con cúpula',icon:'🏛️',cat:'Decoración',w:8,d:8},
 {id:'village-banner',label:'Estandarte del gremio',icon:'🚩',cat:'Decoración',w:1.4,d:1.4},
 {id:'village-lamp',label:'Farol dorado ornamental',icon:'🏮',cat:'Decoración',w:1.4,d:1.4},
 {id:'village-crates',label:'Cajas y provisiones',icon:'📦',cat:'Decoración',w:2.5,d:2.5},
]);
export const VILLAGE_DECOR_IDS=new Set(VILLAGE_DECOR_ASSETS.map(a=>a.id));
const HOUSE_SPECS=Object.freeze([
 // x,z are offsets from the heart of the preserved native Unsung plaza.
 {type:'kaykit-church',x:-47,z:-34,yaw:.19,scale:1.13},
 {type:'kaykit-tavern',x:-21,z:-27,yaw:-.22,scale:1.14},
 {type:'kaykit-castle',x:31,z:-32,yaw:.12,scale:1.15},
 {type:'kaykit-blacksmith',x:-47,z:7,yaw:.12,scale:1.12},
 {type:'kaykit-market',x:-20,z:3,yaw:-.16,scale:.93},
 {type:'kaykit-home-a',x:-42,z:43,yaw:-.24,scale:1},
 {type:'kaykit-home-b',x:-13,z:51,yaw:.15,scale:1},
 {type:'kaykit-home-a',x:17,z:45,yaw:-.18,scale:1},
 {type:'kaykit-tower-a',x:54,z:-23,yaw:.18,scale:1.05},
 {type:'kaykit-well',x:0,z:2,yaw:0,scale:.87}
]);
const BUILDING_DIMS=Object.freeze({
 'kaykit-church':[13,13],'kaykit-tavern':[13,12],
 'kaykit-castle':[23,23],'kaykit-blacksmith':[12,12],
 'kaykit-market':[13,11],'kaykit-home-a':[10,9],
 'kaykit-home-b':[10,9],'kaykit-tower-a':[8,8],
 'kaykit-well':[6,6]
});
const PATHS=[
 [[-46,-34],[-34,-29],[-25,-19],[0,0]],
 [[-21,-27],[-17,-15],[-10,-5],[0,0]],
 [[31,-32],[27,-21],[15,-10],[0,0]],
 [[-47,7],[-33,9],[-19,9],[0,0]],
 [[-42,43],[-30,33],[-13,22],[0,0]],
 [[-13,51],[-8,36],[-5,22],[0,0]],
 [[17,45],[14,29],[8,15],[0,0]],
 [[0,0],[16,2],[32,9],[51,9]],
 [[0,0],[14,14],[25,29],[37,45]]
];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const finite=n=>Number.isFinite(n);
const d2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const TILE=4;
function overlapsExisting(item,placements){
 const d=BUILDING_DIMS[item.type];if(!d)return false;
 const r=Math.hypot(d[0],d[1])*item.scale*.32;
 return placements.some(other=>{
  const e=BUILDING_DIMS[other.type];if(!e)return false;
  const q=Math.hypot(e[0],e[1])*other.scale*.32;
  return d2(item,other)<r+q+1;
 });
}
function buildCandidates(){
 const a=[[0,0]];
 for(const rad of [24,48,72]){
  for(let i=0;i<8;i++){const t=i*Math.PI/4;a.push([Math.round(Math.cos(t)*rad),Math.round(Math.sin(t)*rad)]);}
 }
 return a;
}
function testLayoutCenter(x,z,canPlace,existing){
 let count=0;
 for(const spec of HOUSE_SPECS.slice(0,9)){
  const item={type:spec.type,x:x+spec.x,z:z+spec.z,yaw:spec.yaw,scale:spec.scale,clearTrees:true};
  const r=canPlace(item);
  if(r?.ok)count++;
 }
 // Close to the current original plaza is strongly preferred.
 return count-existing.length*.00001;
}
function layoutObjects(x,z,canPlace,existing,idPrefix){
 const objects=[],placements=[],skips=[],paving=new Set();
 let sequence=0;
 const make=(type,px,pz,yaw=0,scale=1)=>{
  const o={id:idPrefix+'-'+(sequence++).toString(36),type,x:px,z:pz,yaw,scale,y:0};
  if(!type.startsWith('floor-')&&!type.startsWith('npc-'))o.clearTrees=true;
  return o;
 };
 const accept=o=>{
  if(objects.length+existing.length>=2500)return false;
  const res=canPlace(o);
  if(!res?.ok)return false;
  o.y=finite(res.y)?res.y:0;objects.push(o);return true;
 };
 function building(spec){
  const shifts=[[0,0],[6,0],[-6,0],[0,6],[0,-6],[9,9],[-9,-9],[-9,9],[9,-9],[13,0],[-13,0],[0,13],[0,-13]];
  for(const [dx,dz] of shifts){
   const o=make(spec.type,Math.round((x+spec.x+dx)/2)*2,Math.round((z+spec.z+dz)/2)*2,spec.yaw,spec.scale);
   if(overlapsExisting(o,placements))continue;
   if(accept(o)){placements.push(o);return true;}
  }
  skips.push(spec.type);return false;
 }
 // 1. First the actual building lots, protected by real original Unsung collision.
 for(const b of HOUSE_SPECS)building(b);
 const plaza={x,z};
 function floor(px,pz){
  const nx=Math.round(px/TILE)*TILE,nz=Math.round(pz/TILE)*TILE,key=nx+','+nz;
  if(paving.has(key))return;
  paving.add(key);
  if(existing.some(q=>q.type==='floor-stone'&&Math.hypot(q.x-nx,q.z-nz)<1))return;
  accept(make('floor-stone',nx,nz,0,1));
 }
 // 2. Round stone plaza with gaps for the original architecture and clean marble paving.
 for(let ix=-19;ix<=19;ix+=TILE)for(let iz=-19;iz<=19;iz+=TILE){
  if(Math.hypot(ix,iz)<19.2)floor(x+ix,z+iz);
 }
 // Smooth cubic road spline, 7-8m wide, built from existing editable 4m paving blocks.
 function curve(points){
  const [a,b,c,d]=points;
  const len=Math.hypot(d[0]-a[0],d[1]-a[1]),steps=Math.max(12,Math.ceil(len/1.7));
  for(let i=0;i<=steps;i++){
   const t=i/steps,u=1-t;
   const xx=u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0];
   const zz=u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1];
   for(const [dx,dz] of [[0,0],[-4,0],[4,0],[0,-4],[0,4]])
    floor(x+xx+dx,z+zz+dz);
  }
 }
 PATHS.forEach(curve);
 const decor=(type,xx,zz,yaw=0,scale=1)=>{
  const original=make(type,Math.round(x+xx),Math.round(z+zz),yaw,scale);
  const asset=VILLAGE_DECOR_ASSETS.find(a=>a.id===type);
  if(!asset)return false;
  const r=Math.hypot(asset.w,asset.d)*scale*.27;
  // Never grow trees, market booths or gazebos INSIDE real houses.
  if(placements.some(b=>{
   const dims=BUILDING_DIMS[b.type],br=Math.hypot(dims[0],dims[1])*b.scale*.34;
   return d2(original,b)<r+br+.8;
  }))return false;
  return accept(original);
 };
 // 3. Market life, central well entourage, lamp-lit benches and flag standards.
 const props=[
 ['village-stall-red',-13,10,-.16,1],['village-stall-blue',9,12,.18,1],
 ['village-stall-red',-5,17,.12,.84],['village-gazebo',38,42,.1,1],
 ['village-lamp',-17,2],['village-lamp',16,-4],['village-lamp',-13,29],
 ['village-lamp',23,22],['village-lamp',-39,23],['village-lamp',-32,-16],
 ['village-lamp',11,-25],['village-lamp',-7,-17],['village-lamp',34,12],
 ['village-banner',19,-22],['village-banner',47,-33],['village-banner',-34,-30],
 ['village-crates',-35,11],['village-crates',-25,6],['village-crates',5,17],
 ['village-flowerbed',-10,2,0,1.1],['village-flowerbed',12,0,0,1.1],
 ['village-flowerbed',-40,-23,0,1.1],['village-flowerbed',33,-16,0,1.1],
 ['village-flowerbed',-35,53],['village-flowerbed',-10,60],
 ['village-flowerbed',20,55],['village-flowerbed',40,51],
 ['village-shrub',-18,22],['village-shrub',-20,24],['village-shrub',19,17],
 ['village-shrub',22,17],['village-shrub',-27,50],['village-shrub',29,50],
 ['village-blossom',-64,-21,0,1.1],['village-lilac',-62,-5,0,1.1],
 ['village-autumn',-63,35,0,1],['village-autumn',-32,-47,0,1.1],
 ['village-lilac',-11,-46,0,1.15],['village-blossom',42,60,0,1.25],
 ['village-blossom',-56,60,0,1.05],['village-autumn',54,23,0,1.1],
 ['village-lilac',11,63,0,1.06],['village-shrub',-57,48,0,.9],
 ];
 for(const [type,dx,dz,yaw=0,scale=1] of props)decor(type,dx,dz,yaw,scale);
 // 4. Unsung native benches and fencing remain in the same editable schema.
 for(const [type,xx,zz,yaw,scale] of [
 ['bench',-9,-7,-.4,1],['bench',8,-8,.4,1],['bench',-18,14,.3,1],
 ['bench',19,12,-.4,1],['bench',42,33,.3,1],
 ['fence',-48,54,-.22,1],['fence',-38,60,.15,1],
 ['fence',-18,62,.17,1],['fence',14,60,.16,1],
 ['barrel',-36,15,0,1],['barrel',-27,12,0,1],['barrel',-6,14,0,1]
 ])decorBase(type,xx,zz,yaw,scale);
 function decorBase(type,xx,zz,yaw=0,scale=1){
  const o=make(type,Math.round(x+xx),Math.round(z+zz),yaw,scale);
  accept(o);
 }
 return {objects,buildings:placements.length,skipped:skips,paved:objects.filter(o=>o.type==='floor-stone').length,
  decorations:objects.filter(o=>!o.type.startsWith('floor-')&&!o.type.startsWith('kaykit-')).length,
  center:plaza};
}
export function buildBeginningVillage({origin={x:-512,z:-70},canPlace,existing=[]}={}){
 if(typeof canPlace!=='function')throw Error('World Forge needs real terrain validation');
 const nx=finite(origin.x)?origin.x:-512,nz=finite(origin.z)?origin.z:-70;
 const initial={x:Math.round(nx/4)*4,z:Math.round(nz/4)*4};
 let best=initial,score=-Infinity;
 for(const [dx,dz] of buildCandidates()){
  const x=initial.x+dx,z=initial.z+dz;
  const s=testLayoutCenter(x,z,canPlace,existing)-Math.hypot(dx,dz)/36;
  if(s>score){score=s;best={x,z};}
 }
 const prefix='hf-p528-'+Date.now().toString(36);
 const plan=layoutObjects(best.x,best.z,canPlace,existing,prefix);
 return {...plan,origin:initial};
}
