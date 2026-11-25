/* HIGHFLY WORLD FORGE 3D P525 — NO COMBAT, original Unsung elevation/architecture */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {clone as cloneRig} from 'three/addons/utils/SkeletonUtils.js';
import {VILLAGE_DECOR_ASSETS,buildBeginningVillage} from './p528-village-layout.mjs';
import {buildEastbrookLand,EASTBROOK_LAND_SPECS,EASTBROOK_FREE_FALLBACKS} from './p538-eastbrook-land.mjs';
import {makeVillageDecor} from './p528-village-decor-3d.mjs';
import {loadPrivateSourceCatalog,readPrivateSourceGLB,importPrivateSourcePack} from './p529-private-source-import.mjs';
import {UNSUNG_ORIGINAL_ASSETS} from './p530-unsung-original.mjs';
import {loadUnsungOriginal} from './p530-unsung-loader.mjs';
import {KAYKIT_FREE_ALL,KAYKIT_FREE_BY_ID,KAYKIT_FREE_GROUPS} from './p531-kaykit-free-catalog.mjs';
import {UNSUNG_FLORA,nativeUnsungFlora} from './p531-unsung-flora.mjs';
import {QUATERNIUS_CC0_ALL} from './p532-quaternius-cc0-catalog.mjs';
import {localizePublicAsset} from './p532-spanish-labels.mjs';
import {PUBLIC_URBAN_ASSETS,makePublicUrbanPrefab} from './p532-public-urban-prefabs.mjs';
import {CURVED_ROAD_TYPE,CURVED_ROAD_CATALOG,isCurvedRoad,roadPathValid,sampleCurvedRoad,roadClearance,ROAD_WIDTHS} from './p533-curved-road-path.mjs';
import {makeCurvedCobblestone3D,disposeCurvedRoadGeometry} from './p533-curved-road-3d.mjs';
import {MODULAR_COBBLE_TILES,isModularCobble,isModularCobbleType,makeModularCobbleTile3D,disposeModularCobbleGeometry} from './p536-modular-cobble-kit.mjs';
import {nativeEditorTerrainMaterial,nativeEditorStaticDepthWater,nativeEditorOriginalGrass,nativeEditorOriginalLeaves} from './p536-native-editor-visuals.mjs';
import {gradePlanFor,fastGradeHeightAt,indexGradePlans,gradePatchGrid} from './p537-grade-parcels.mjs';
import {conformingTileGrid,buildingSupportPlan} from './p542-native-conform.mjs';
const $=id=>document.getElementById(id);
const P542_PREVIEW=globalThis.location?.pathname?.includes('/preview-p542/')===true;
const P541_PREVIEW=globalThis.location?.pathname?.includes('/preview-p541/')===true||P542_PREVIEW;
const P539_PREVIEW=globalThis.location?.pathname?.includes('/preview-p539/')===true||P541_PREVIEW;
const P538_PREVIEW=globalThis.location?.pathname?.includes('/preview-p538/')===true||P539_PREVIEW;
const P537_PREVIEW=globalThis.location?.pathname?.includes('/preview-p537/')===true||P538_PREVIEW;
const P536_PREVIEW=globalThis.location?.pathname?.includes('/preview-p536/')===true||P537_PREVIEW;
const P533_PREVIEW=globalThis.location?.pathname?.includes('/preview-p533/')===true||P536_PREVIEW;
const P532_PREVIEW=globalThis.location?.pathname?.includes('/preview-p532/')===true;
const P531_PREVIEW=globalThis.location?.pathname?.includes('/preview-p531/')===true;
const P530_PREVIEW=globalThis.location?.pathname?.includes('/preview-p530/')===true;
const P529_PREVIEW=globalThis.location?.pathname?.includes('/preview-p529/')===true;
const STORE=P542_PREVIEW?'hf-world-forge-layout-p542-conform-v1':P541_PREVIEW?'hf-world-forge-layout-p541-manual-v1':P539_PREVIEW?'hf-world-forge-layout-p539-v1':P538_PREVIEW?'hf-world-forge-layout-p538-v1':P537_PREVIEW?'hf-world-forge-layout-p537-v1':P536_PREVIEW?'hf-world-forge-layout-p536-v1':P533_PREVIEW?'hf-world-forge-layout-p533-v1':P532_PREVIEW?'hf-world-forge-layout-p532-v1':P531_PREVIEW?'hf-world-forge-layout-p531-v1':P530_PREVIEW?'hf-world-forge-layout-p530-v1':P529_PREVIEW?'hf-world-forge-layout-p529-v1':'hf-world-forge-layout-v1';
const VIEW=P542_PREVIEW?'hf-world-forge-view-p542-conform-v1':P541_PREVIEW?'hf-world-forge-view-p541-manual-v1':P539_PREVIEW?'hf-world-forge-view-p539-v1':P538_PREVIEW?'hf-world-forge-view-p538-v1':P537_PREVIEW?'hf-world-forge-view-p537-v1':P536_PREVIEW?'hf-world-forge-view-p536-v1':P533_PREVIEW?'hf-world-forge-view-p533-v1':P532_PREVIEW?'hf-world-forge-view-p532-v1':P531_PREVIEW?'hf-world-forge-view-p531-v1':P530_PREVIEW?'hf-world-forge-view-p530-v1':P529_PREVIEW?'hf-world-forge-view-p529-v1':'hf-world-forge-view-v1';
const BACKUP=P542_PREVIEW?'hf-world-forge-layout-p542-before-edit':P541_PREVIEW?'hf-world-forge-layout-p541-manual-before-edit':P539_PREVIEW?'hf-world-forge-layout-p539-before-edit':P538_PREVIEW?'hf-world-forge-layout-p538-before-edit':P537_PREVIEW?'hf-world-forge-layout-p537-backup':P536_PREVIEW?'hf-world-forge-layout-p536-backup':P533_PREVIEW?'hf-world-forge-layout-p533-backup':P532_PREVIEW?'hf-world-forge-layout-p532-backup':P531_PREVIEW?'hf-world-forge-layout-p531-backup':P530_PREVIEW?'hf-world-forge-layout-p530-backup':P529_PREVIEW?'hf-world-forge-layout-p529-backup':'hf-world-forge-layout-v1-backup-pre-p526';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),snap=(x,s=1)=>Math.round(x/s)*s,finite=n=>typeof n==='number'&&Number.isFinite(n);
const base=[
 ['guild','Gremio','🏰','Edificios',14,11],['forge','Herrería','⚒️','Edificios',11,9],['inn','Posada','🏠','Edificios',12,10],
 ['house','Casa medieval','🏡','Edificios',9,8],['timber','Casa madera','🛖','Edificios',8,8],['market','Mercado','🏪','Edificios',12,9],
 ['mill','Molino','🌾','Edificios',10,10],['granary','Granero','🌽','Edificios',12,9],['warehouse','Almacén','📦','Edificios',11,9],
 ['fishery','Pesquería','🎣','Edificios',10,8],['ranger','Refugio','🏕','Edificios',9,8],
 ['floor-stone','Continuar plaza · piedra','▩','Pisos',4,4],['floor-earth','Tierra original Unsung','🟫','Pisos',4,4],['floor-grass','Pasto original Unsung','🌿','Pisos',4,4],['floor-wood','Tablas de madera','🟨','Pisos',4,4],
 ['lantern','Farol original','🏮','Decoración',1.5,1.5],['well','Pozo','🕳','Decoración',4,4],
 ['fence','Valla','🚧','Decoración',4,.4],['barrel','Barril','🛢','Decoración',1.1,1.1],['bench','Banco','🪑','Decoración',3,1.4],
 ['tree','Árbol','🌳','Naturaleza',3,3],['rock','Roca','🪨','Naturaleza',3,2.5],['ore','Mineral','⛏','Naturaleza',3,3],
 ['npc-merchant','Comerciante','🧙','NPC',1,1],['npc-guard','Guardia','🛡','NPC',1,1],['npc-artisan','Artesano','🧑','NPC',1,1],
 ['kaykit-archeryrange','Campo de tiro','🏹','KayKit FREE',16,13,'archeryrange'],
 ['kaykit-barracks','Cuartel','🛡','KayKit FREE',14,12,'barracks'],
 ['kaykit-blacksmith','Herrería KayKit','⚒','KayKit FREE',12,12,'blacksmith'],
 ['kaykit-castle','Castillo','🏰','KayKit FREE',23,23,'castle'],
 ['kaykit-church','Templo','⛪','KayKit FREE',13,13,'church'],
 ['kaykit-home-a','Casa A','🏡','KayKit FREE',10,9,'home_A'],['kaykit-home-b','Casa B','🏠','KayKit FREE',10,9,'home_B'],
 ['kaykit-lumbermill','Aserradero','🪵','KayKit FREE',14,12,'lumbermill'],
 ['kaykit-market','Mercado KayKit','🏪','KayKit FREE',13,11,'market'],
 ['kaykit-mine','Mina','⛏','KayKit FREE',13,12,'mine'],
 ['kaykit-tavern','Taberna','🍻','KayKit FREE',13,12,'tavern'],
 ['kaykit-tower-a','Torre A','🏰','KayKit FREE',8,8,'tower_A'],
 ['kaykit-tower-b','Torre B','🏰','KayKit FREE',8,8,'tower_B'],
 ['kaykit-watermill','Molino de agua','🌊','KayKit FREE',12,12,'watermill'],
 ['kaykit-well','Pozo KayKit','🪣','KayKit FREE',6,6,'well'],
 ['kaykit-windmill','Molino de viento','🌾','KayKit FREE',12,12,'windmill']
].concat(VILLAGE_DECOR_ASSETS.map(a=>[a.id,a.label,a.icon,a.cat,a.w,a.d]))
 .map(([id,label,icon,cat,w,d,model])=>({id,label,icon,cat:model?cat:(cat==='Edificios'?'Bocetos antiguos':cat),w,d,model}));
// Extend the 16 legacy red houses in place; all 221 FREE models remain
// uniquely addressable and use real GLTF meshes, not procedural cube stand-ins.
for(const extra of KAYKIT_FREE_ALL){
 const v=(P532_PREVIEW||P533_PREVIEW)?localizePublicAsset(extra):extra;
 const prev=base.find(x=>x.id===extra.id);
 if(prev)Object.assign(prev,v);
 else base.push({...v});
}
// Old editor placeholders stay readable, but no new generic cube/roof buildings are offered.
function addPrivateCatalog(models){
 for(const x of models){
  const a={id:x.id,label:x.label,icon:x.kind==='building'?'🏰':x.kind==='tree'?'🌳':'🧰',
   cat:'KayKit SOURCE',originalCategory:x.category,kind:x.kind,w:x.width,d:x.depth,
   privateModel:true,sourcePack:x.sourcePack||'',license:x.license||'CC0'};
  const index=base.findIndex(v=>v.id===a.id);
  if(index>=0)base[index]=a;else base.push(a);
  BY_ID.set(a.id,a);
 }
}
for(const a of UNSUNG_FLORA)base.push({...a,cat:'Unsung árboles',nativeFlora:true});
for(const a of QUATERNIUS_CC0_ALL)base.push({...a});
for(const a of PUBLIC_URBAN_ASSETS)base.push({...a,publicUrban:true});
if(P533_PREVIEW||P536_PREVIEW)base.push({...CURVED_ROAD_CATALOG});
if(P536_PREVIEW)for(const tile of MODULAR_COBBLE_TILES)base.push({...tile});
 // Twelve authentic MIT Unsung procedural kit pieces, exported from its real source.
for(const a of UNSUNG_ORIGINAL_ASSETS)base.push({...a,cat:'Unsung original',originalPrefab:true,w:a.w,d:a.d});
const BY_ID=new Map(base.map(a=>[a.id,a]));
addPrivateCatalog(loadPrivateSourceCatalog());
const LEGACY_UPGRADE=Object.freeze({guild:'kaykit-castle',forge:'kaykit-blacksmith',inn:'kaykit-tavern',house:'kaykit-home-a',timber:'kaykit-home-b',market:'kaykit-market',mill:'kaykit-windmill',ranger:'kaykit-archeryrange'});
// Only documented real CC0 model equivalents: granary, warehouse and fishery have no 1:1 CC0 building.
// Protect the actual spawn and staircase, not entire 42m-radius free land parcels.
const safety=[[-519,-70,8],[-179,-459,7]];
const logData={phase:'inicio',lines:[],errors:[]};
const log=(message,detail='',ok=true)=>{
 const s=(ok==='warn'?'⚠ ':ok?'✓ ':'✕ ')+message+(detail?' — '+detail:'');
 logData.lines.push(s);if(ok===false){logData.errors.push(s);$('diagnostics').hidden=false;}
 $('log').textContent=['HIGHFLY WORLD FORGE 3D P5.2.5','Estado '+logData.phase,'URL '+location.pathname,'',...logData.lines].join('\n');
 console[ok===false?'error':ok==='warn'?'warn':'info']('[HIGHFLY WORLD FORGE 3D]',s);
};
const status=s=>$('status').textContent=s;
window.__highfly3DEditorHealth=logData;
const url=f=>new URL('./'+f,import.meta.url).href;
const holder=$('canvas-holder');
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa8c7dd);
scene.fog=new THREE.Fog(0xa8c7dd,850,6300);
const DESKTOP_FINE=!!globalThis.matchMedia?.('(pointer:fine) and (min-width:900px)')?.matches;
let qualityHigh=DESKTOP_FINE;
const renderer=new THREE.WebGLRenderer({antialias:DESKTOP_FINE,powerPreference:DESKTOP_FINE?'high-performance':'low-power'});
renderer.setPixelRatio(Math.min(qualityHigh?2:1.2,window.devicePixelRatio||1));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
holder.insertBefore(renderer.domElement,holder.firstChild);
const cam=new THREE.PerspectiveCamera(54,1,.1,35000);
const orbit=new OrbitControls(cam,renderer.domElement);orbit.enableDamping=false;orbit.minDistance=8;orbit.maxDistance=4500;
orbit.maxPolarAngle=Math.PI/2-.02;orbit.screenSpacePanning=true;
orbit.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.PAN,RIGHT:P539_PREVIEW?null:THREE.MOUSE.PAN};
scene.add(new THREE.HemisphereLight(0xe4f2ff,0x746251,2.15));
const sun=new THREE.DirectionalLight(0xffedd7,2);sun.position.set(120,350,210);scene.add(sun);
const groups={original:new THREE.Group(),trees:new THREE.Group(),water:new THREE.Group(),placed:new THREE.Group()};
Object.values(groups).forEach(g=>scene.add(g));
const geo={core:null,region:null,near:null};
const ktx2Loader=new KTX2Loader()
 .setTranscoderPath(url('basis/'))
 .detectSupport(renderer);
const gltfLoader=new GLTFLoader()
 .setMeshoptDecoder(MeshoptDecoder)
 .setKTX2Loader(ktx2Loader),
 textureLoader=new THREE.TextureLoader(),cache=new Map(),objectViews=new Map();
let nativeVisuals=null,nativeWater=null,nativeGrass=null,nativeLeaves=null;
let adaptSlope=P539_PREVIEW;let gradePlans=[],gradeSpatial=null;const gradeScene=new THREE.Group();gradeScene.name='HIGHFLY_EDITABLE_EARTH_SLOPES_P537';scene.add(gradeScene);
let map=null,overview=null,architectPixel=null,records=[],history=[],redoStack=[],mode='orbit',chosen=null,selected=null,category=(P536_PREVIEW||P533_PREVIEW||P532_PREVIEW||P531_PREVIEW)?'KayKit FREE · Edificios':'Edificios',gizmo=null,rendering=0,treeFocus=[Infinity,Infinity],nearFocus=[Infinity,Infinity],dragPainting=false,lastPaint=null,ghost=null,pendingDrop=null,activePointer=null,downPos=null,pendingYaw=0,pendingScale=1,movingExisting=null;
let movedPivot={x:-512,z:-70};
try{const v=JSON.parse(localStorage.getItem(VIEW)||'null');if(finite(v?.x)&&finite(v?.z))movedPivot={x:v.x,z:v.z};}catch{}
orbit.target.set(movedPivot.x,209,movedPivot.z);cam.position.set(movedPivot.x+105,326,movedPivot.z+155);
const viewCache=new Map(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function render(){if(rendering)return;rendering=requestAnimationFrame(()=>{rendering=0;renderer.render(scene,cam);});}
function fit(){const w=Math.max(4,holder.clientWidth),h=Math.max(4,holder.clientHeight);renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();render();}
new ResizeObserver(fit).observe(holder);window.addEventListener('resize',fit);
function loadPicture(name){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error(name+' no se pudo cargar'));img.src=url(name);});}
async function loadHeights(){
 const res=await fetch(url('native-terrain-manifest.json'));if(!res.ok)throw Error('Manifiesto alturas HTTP '+res.status);
 const manifest=await res.json(),meta=manifest.meta;if(manifest.schema!==3||meta.core.res!==2048||meta.region.res!==2048)throw Error('Mapa Unsung 16bit incorrecto');
 const arrays={};
 for(const k of ['core','region']){
  const img=await loadPicture('native-terrain-'+k+'.png'),dim=meta[k].res;
  if(img.width!==dim||img.height!==dim)throw Error('Imagen alturas tamaño incorrecto '+k);
  const c=document.createElement('canvas');c.width=c.height=dim;const cc=c.getContext('2d',{willReadFrequently:true});
  cc.drawImage(img,0,0);const pixels=cc.getImageData(0,0,dim,dim).data;
  if(pixels[2]!==165||pixels[3]!==255)throw Error('Firma de altura PNG incorrecta '+k);
  const a=new Float32Array(dim*dim),factor=(meta[k].max-meta[k].min)/65535;
  for(let i=0,j=0;i<a.length;i++,j+=4)a[i]=meta[k].min+(pixels[j]*256+pixels[j+1])*factor;
  arrays[k]=a;log('Mapa de alturas '+k,dim+'x'+dim+' muestras originales');
 }
 map={meta,core:arrays.core,region:arrays.region};
}
function sample(data,m,x,z){
 const fx=Math.max(0,Math.min(m.res-1.0001,(x/m.size+.5)*m.res-.5));
 const fz=Math.max(0,Math.min(m.res-1.0001,(z/m.size+.5)*m.res-.5));
 const ix=Math.min(m.res-2,Math.floor(fx)),iz=Math.min(m.res-2,Math.floor(fz)),tx=fx-ix,tz=fz-iz,k=iz*m.res+ix;
 return (data[k]*(1-tx)+data[k+1]*tx)*(1-tz)+(data[k+m.res]*(1-tx)+data[k+m.res+1]*tx)*tz;
}
function elevation(x,z){
 if(!map)return 0;
 const e=Math.max(Math.abs(x),Math.abs(z))/(map.meta.core.size/2);
 const hr=e<.90?0:sample(map.region,map.meta.region,x,z);if(e>=.985)return hr;
 const hc=sample(map.core,map.meta.core,x,z);if(e<=.90)return hc;
 const t=(e-.90)/.085,w=1-t*t*(3-2*t);return hr+(hc-hr)*w;
}

function gradeEligible(a,o){
 return !P542_PREVIEW&&P537_PREVIEW&&a&&o&&!o.type.startsWith('floor-')&&!o.type.startsWith('npc-')&&
  (a.kind==='building'||a.cat==='Edificios'||!!a.model);
}
function syncGradePlans(){
 if(P542_PREVIEW||!P537_PREVIEW||!map){gradePlans=[];gradeSpatial=null;return;}
 gradePlans=[];
 for(const o of records){
  const a=BY_ID.get(o.type);if(!gradeEligible(a,o))continue;
  try{
   const plan=gradePlanFor(o,{w:a.w,d:a.d},elevation,{apron:3,subdivisions:6,dynamicApron:P539_PREVIEW});
   if(plan.slope<=(P539_PREVIEW?24:1.75)&&plan.y>-.1)gradePlans.push(plan);
  }catch(err){log('Nivel de parcela '+o.id,err.message,false);}
 }
 gradeSpatial=indexGradePlans(gradePlans);
}
function gradedElevation(x,z){
 const original=elevation(x,z);
 return P542_PREVIEW?original:P537_PREVIEW?fastGradeHeightAt(x,z,original,gradeSpatial):original;
}
function redrawGradedTerrain(){
 if(P542_PREVIEW||!P537_PREVIEW||!map||!geo.core||!geo.near)return;
 const core=terrain(2048,256,-.15);geo.core.geometry.dispose();geo.core.geometry=core;
 nearFocus=[Infinity,Infinity];updateNear();
 for(const mesh of [...gradeScene.children]){gradeScene.remove(mesh);mesh.geometry.dispose();}
 if(!nativeVisuals)return;
 for(const plan of gradePlans){
  const g=gradePatchGrid(plan,elevation,{step:.95,raise:.245});
  const ge=new THREE.BufferGeometry();
  ge.setAttribute('position',new THREE.Float32BufferAttribute(g.vertices,3));
  ge.setAttribute('uv',new THREE.Float32BufferAttribute(g.uv,2));
  ge.setIndex(g.indices);ge.computeVertexNormals();ge.computeBoundingSphere();
  const mesh=new THREE.Mesh(ge,nativeVisuals.material);
  mesh.name='Explanada natural de '+plan.id;mesh.receiveShadow=true;
  gradeScene.add(mesh);
 }
 nativeGrass?.update(orbit.target.x,orbit.target.z,true);
}

function terrain(size,steps,offset=0,ox=0,oz=0){
 const n=steps+1,pos=new Float32Array(n*n*3),uv=new Float32Array(n*n*2),idx=new Uint32Array(steps*steps*6);let a=0,u=0,k=0;
 for(let z=0;z<=steps;z++)for(let x=0;x<=steps;x++){
  const gx=ox+(x/steps-.5)*size,gz=oz+(z/steps-.5)*size;
  pos[a++]=gx;pos[a++]=gradedElevation(gx,gz)+offset;pos[a++]=gz;
  uv[u++]=gx/size+.5;uv[u++]=1-(gz/size+.5);
 }
 for(let z=0;z<steps;z++)for(let x=0;x<steps;x++){
  const t=z*n+x;idx[k++]=t;idx[k++]=t+n;idx[k++]=t+1;idx[k++]=t+1;idx[k++]=t+n;idx[k++]=t+n+1;
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();g.computeBoundingSphere();return g;
}
async function drawTerrain(){
 const textures=await Promise.all(['region','core'].map(async name=>{
  const t=await new Promise((resolve,reject)=>textureLoader.load(url('native-relief-'+name+'.png'),resolve,undefined,reject));
  t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;
 }));
 const mat=(t)=>new THREE.MeshLambertMaterial({map:t,side:THREE.DoubleSide});
 geo.region=new THREE.Mesh(terrain(16384,256,-.7),mat(textures[0]));geo.core=new THREE.Mesh(terrain(2048,256,-.15),mat(textures[1]));
 // Near tile uses same original samples but finer mesh; UVs refer to full 2048m core, not tile.
 const nearG=terrain(470,qualityHigh?270:170,.18,movedPivot.x,movedPivot.z);
 const att=nearG.getAttribute('uv'),pp=nearG.getAttribute('position');
 for(let i=0;i<att.count;i++){att.setXY(i,pp.getX(i)/2048+.5,1-(pp.getZ(i)/2048+.5));}att.needsUpdate=true;
 geo.near=new THREE.Mesh(nearG,mat(textures[1]));scene.add(geo.region,geo.core,geo.near);
 log('Terreno real 3D','región 16km, valle 2km, detalle 470m; sin combate ni sombras dinámicas');render();
}
function updateNear(){
 if(!geo.near||!map)return;
 const x=orbit.target.x,z=orbit.target.z;
 if(Math.hypot(x-nearFocus[0],z-nearFocus[1])<80)return;
 nearFocus=[x,z];
 if(Math.max(Math.abs(x),Math.abs(z))>1050){geo.near.visible=false;return;}geo.near.visible=true;
 const g=terrain(470,qualityHigh?270:170,.22,snap(x,40),snap(z,40)),u=g.getAttribute('uv'),p=g.getAttribute('position');
 for(let i=0;i<u.count;i++)u.setXY(i,p.getX(i)/2048+.5,1-(p.getZ(i)/2048+.5));
 u.needsUpdate=true;geo.near.geometry.dispose();geo.near.geometry=g;render();
}
function positionPointer(ev){const a=renderer.domElement.getBoundingClientRect();pointer.set((ev.clientX-a.left)/a.width*2-1,-(ev.clientY-a.top)/a.height*2+1);raycaster.setFromCamera(pointer,cam);}
function hitTerrain(ev){
 if(!map||!geo.core)return null;positionPointer(ev);
 const hits=raycaster.intersectObjects([geo.near,geo.core,geo.region].filter(m=>m&&m.visible),false);
 for(const hit of hits)if(Math.max(Math.abs(hit.point.x),Math.abs(hit.point.z))<8100){
  return {x:hit.point.x,z:hit.point.z,y:elevation(hit.point.x,hit.point.z)};
 }
 return null;
}
function focus(x=-512,z=-70,range=170){
 const h=elevation(x,z);orbit.target.set(x,h+5,z);cam.position.set(x+range*.59,h+range*.78,z+range*.63);orbit.update();render();
}
function originalRender(){
 if(!overview)return;
 const waterMat=nativeWater?.material??new THREE.MeshLambertMaterial({color:0x388eab,transparent:true,opacity:.66,depthWrite:false,side:THREE.DoubleSide});
 const sea=new THREE.Mesh(new THREE.PlaneGeometry(16384,16384).rotateX(-Math.PI/2),waterMat);sea.position.y=-.07;groups.water.add(sea);
 for(const p of overview.pools||[]){
  const lake=new THREE.Mesh(new THREE.CircleGeometry(p.r,64).rotateX(-Math.PI/2),waterMat);
  lake.position.set(p.x,p.level+.03,p.z);groups.water.add(lake);
 }
 const treeIndex=new Map();for(const t of overview.trees){
  const key=Math.floor(t[0]/128)+','+Math.floor(t[1]/128);
  if(!treeIndex.has(key))treeIndex.set(key,[]);treeIndex.get(key).push(t);
 }
 overview.treeIndex=treeIndex;
 // Actual Unsung procedural branches and leaf geometry close to the camera;
 // distant forest remains lightweight instancing to preserve editor FPS.
 const colors=[0xd18b69,0xd9acc3,0xc7b9d9,0x416950,0x5d996b],
  trunk=new THREE.CylinderGeometry(.3,.42,1,5),
  crown=new THREE.IcosahedronGeometry(1,1),column=new THREE.ConeGeometry(1,1,6),
  species=['ember','blossom','elder','cypress','green'];
 trunk.translate(0,.5,0);column.translate(0,.5,0);
 const lods=[];
 for(let k=0;k<5;k++){
  const model=nativeUnsungFlora('unsung-tree-'+species[k]);
  const nearStem=new THREE.InstancedMesh(model.children[0].geometry,model.children[0].material,DESKTOP_FINE?400:220),
   nearLeaves=new THREE.InstancedMesh(model.children[1].geometry,model.children[1].material,DESKTOP_FINE?400:220),
   farStem=new THREE.InstancedMesh(trunk,new THREE.MeshLambertMaterial({color:0x665246}),750),
   farLeaves=new THREE.InstancedMesh(k===3?column:crown,
    new THREE.MeshLambertMaterial({color:colors[k],flatShading:true}),750);
  for(const o of [nearStem,nearLeaves,farStem,farLeaves]){
   o.count=0;o.frustumCulled=false;groups.trees.add(o);
  }
  lods.push({nearStem,nearLeaves,farStem,farLeaves});
 }
 groups.trees.userData.lods=lods;updateTrees(true);
 log('Bosque original Unsung',overview.trees.length.toLocaleString('es-AR')+
  ' posiciones; cerca: ramas/hojas reales · lejos: LOD de bajo costo');
}
const dummy=new THREE.Object3D(),treeKinds=[0,0,0,1,1,2,2,3,3,4,4,4],
 treeH=[14,8,19,19,13],treeR=[5.2,4.2,6.0,2.2,5.0];
function updateTrees(force=false){
 if(!overview?.treeIndex||!map||!groups.trees.visible)return;
 const x=orbit.target.x,z=orbit.target.z;
 if(!force&&Math.hypot(x-treeFocus[0],z-treeFocus[1])<28)return;
 treeFocus=[x,z];
 // Desktop editing should visualize genuine species across the entire town
 // before switching to geometric far LOD. Lower-cost fallback for mobile.
 const nearDistance=qualityHigh?405:155,rad=qualityHigh?585:325;
 const nearLimit=qualityHigh?(DESKTOP_FINE?370:210):145;
 const lists=Array.from({length:5},()=>({near:[],far:[]}));
 const clearedLots=records.filter(o=>o.clearTrees===true&&!isCurvedRoad(o)&&BY_ID.has(o.type));
 const clearedCurves=records.filter(isCurvedRoad).map(o=>({o,samples:sampleCurvedRoad(o.points,1.8)}));
 for(let i=Math.floor((x-rad)/128);i<=Math.floor((x+rad)/128);i++)
  for(let j=Math.floor((z-rad)/128);j<=Math.floor((z+rad)/128);j++)
   for(const t of overview.treeIndex.get(i+','+j)||[]){
    const dist=Math.hypot(t[0]-x,t[1]-z);if(dist>rad)continue;
    if(clearedCurves.some(({o,samples})=>roadClearance(t[0],t[1],o,samples)))continue;
    if(clearedLots.some(o=>{
     const dx=t[0]-o.x,dz=t[1]-o.z,a=BY_ID.get(o.type),c=Math.cos(o.yaw),sn=Math.sin(o.yaw);
     return Math.abs(dx*c+dz*sn)<a.w*o.scale*.5+1.8&&
      Math.abs(-dx*sn+dz*c)<a.d*o.scale*.5+1.8;
    }))continue;
    const kind=treeKinds[t[3]]??4,key=dist<nearDistance?'near':'far',limit=key==='near'?nearLimit:750;
    if(lists[kind][key].length<limit)lists[kind][key].push(t);
   }
 for(let kind=0;kind<5;kind++){
  const {nearStem,nearLeaves,farStem,farLeaves}=groups.trees.userData.lods[kind];
  let n=0;
  for(const [tx,tz,scale] of lists[kind].near){
   dummy.position.set(tx,elevation(tx,tz)-.15,tz);
   dummy.rotation.set(0,Math.abs(Math.sin(tx*12.9898+tz*78.233)*43758.5453)%6.283,0);
   dummy.scale.setScalar(scale);dummy.updateMatrix();
   nearStem.setMatrixAt(n,dummy.matrix);nearLeaves.setMatrixAt(n,dummy.matrix);n++;
  }
  nearStem.count=nearLeaves.count=n;
  nearStem.instanceMatrix.needsUpdate=nearLeaves.instanceMatrix.needsUpdate=true;
  n=0;
  for(const [tx,tz,scale] of lists[kind].far){
   const h=treeH[kind]*scale,y=elevation(tx,tz);
   dummy.rotation.set(0,0,0);
   dummy.position.set(tx,y,tz);dummy.scale.set(scale*.83,h*.45,scale*.83);dummy.updateMatrix();
   farStem.setMatrixAt(n,dummy.matrix);
   dummy.position.set(tx,y+h*.66,tz);
   dummy.scale.set(treeR[kind]*scale,kind===3?h*.66:h*.36,treeR[kind]*scale);
   dummy.updateMatrix();farLeaves.setMatrixAt(n,dummy.matrix);n++;
  }
  farStem.count=farLeaves.count=n;
  farStem.instanceMatrix.needsUpdate=farLeaves.instanceMatrix.needsUpdate=true;
 }
 render();
}
async function loadOriginalGeometry(){
 try{
  const m=await fetch(url('native-architecture-3d.json')).then(r=>{if(!r.ok)throw Error('Manifiesto edificios '+r.status);return r.json();});
  const response=await fetch(url('native-architecture-3d.bin'));if(!response.ok)throw Error('Modelo original '+response.status);
  const bin=await response.arrayBuffer();
  if(bin.byteLength!==m.byteLength)throw Error('Modelo Unsung tamaño incorrecto '+bin.byteLength+'/'+m.byteLength);
  const palette=[0xa4a1a0,0xd6d4cb,0xe8bd75,0x92798f,0xb2a79b,0xaaa1a5,0x84b6bf,0x514b53];
  let total=0;
  for(const spec of m.meshes){
   const field=(n,cl)=>{const f=spec.fields[n];return new cl(bin.slice(f.offset,f.offset+f.length));};
   const pos=field('position',Float32Array),nor=field('normal',Float32Array),mat=field('material',Uint8Array),index=field('index',Uint32Array);
   if(pos.length/3!==spec.vertices||nor.length!==pos.length||mat.length!==spec.vertices)continue;
   const color=new Uint8Array(mat.length*3);
   for(let i=0;i<mat.length;i++){
    const c=new THREE.Color(palette[mat[i]]??palette[0]);color[3*i]=Math.floor(c.r*255);color[3*i+1]=Math.floor(c.g*255);color[3*i+2]=Math.floor(c.b*255);
   }
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
   g.setAttribute('color',new THREE.BufferAttribute(color,3,true));g.setIndex(new THREE.BufferAttribute(index,1));g.computeBoundingSphere();
   groups.original.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide})));total++;
  }
  log('Construcciones originales 3D',total+' mallas reales · '+m.totalTriangles.toLocaleString('es-AR')+' triángulos');render();
 }catch(e){log('Construcciones nativas 3D',e.message,false);}
}
function treeNear(x,z,rad){
 if(!overview?.treeIndex)return false;
 for(let i=Math.floor((x-rad-10)/128);i<=Math.floor((x+rad+10)/128);i++)
 for(let j=Math.floor((z-rad-10)/128);j<=Math.floor((z+rad+10)/128);j++)
 for(const [tx,tz,s] of overview.treeIndex.get(i+','+j)||[])if(Math.hypot(x-tx,z-tz)<rad+2.5*s)return true;
 return false;
}
function archNear(x,z,rad){
 if(!architectPixel||Math.max(Math.abs(x),Math.abs(z))>1020)return false;
 for(const [ax,az] of [[0,0],[-1,-1],[1,1],[1,-1],[-1,1]]){
  const px=Math.floor(x+1024+ax*rad*.65),pz=Math.floor(z+1024+az*rad*.65);
  if(px>=0&&px<2048&&pz>=0&&pz<2048&&architectPixel[(pz*2048+px)*4+3]>100)return true;
 }
 return false;
}
function validPosition(o,id=null){
 if(!map)return {ok:false,why:'Terreno sin cargar'};
 const a=BY_ID.get(o.type);if(!a)return {ok:false,why:'Modelo inexistente'};
 if(isModularCobble(o)&&Math.abs(o.scale-1)>.001)return {ok:false,why:'Las curvas se colocan a escala fija para encastrar'};
 if(isCurvedRoad(o)){
  const v=roadPathValid(o);if(!v.ok)return {ok:false,why:v.reason};
  for(const t of sampleCurvedRoad(o.points,3))
   if(floorElevation(t.x,t.z)<-.13)return {ok:false,why:'El camino llega al agua. Usá un puente'};
  return {ok:true,y:floorElevation(o.x,o.z),slope:0};
 }
 const w=a.w*o.scale,d=a.d*o.scale,c=Math.cos(o.yaw),s=Math.sin(o.yaw),samples=[];
 for(const [dx,dz] of [[0,0],[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]]){
  const x=o.x+dx*c-dz*s,z=o.z+dx*s+dz*c;
  if(Math.max(Math.abs(x),Math.abs(z))>8090)return {ok:false,why:'Fuera del mundo'};
  const h=elevation(x,z);if(h<-.13)return {ok:false,why:'Terreno sumergido'};
  samples.push(h);
 }
 const rad=Math.hypot(w,d)*.5,flat=o.type.startsWith('floor-'),npc=o.type.startsWith('npc-');
 const grade=gradeEligible(a,o)?gradePlanFor(o,{w:a.w,d:a.d},elevation,{apron:3,subdivisions:6,dynamicApron:P539_PREVIEW}):null;
 if(grade)samples.push(grade.groundMin,grade.y);
 if(!flat&&!npc){
  const slope=Math.max(...samples)-Math.min(...samples);
  const isBuilding=a.kind==='building'||!!a.model||(a.privateModel&&a.kind==='building')||(a.originalPrefab&&a.kind==='building');
  if(slope>(isBuilding&&P539_PREVIEW&&adaptSlope?24:isBuilding?1.05:Math.min(5.2,1.75+o.scale*1.5)))
   return {ok:false,why:P539_PREVIEW?'Desnivel extremo o adaptación desactivada: activá 🧱 Pendiente AUTO o buscá una parcela sin acantilado.':'La parcela tiene desnivel: buscá un terreno nivelado. Evitamos bloques flotantes bajo el edificio.'};
  if(safety.some(([x,z,r])=>Math.hypot(x-o.x,z-o.z)<r+rad*.24))return {ok:false,why:'Entrada original: elegí terreno libre al lado'};
  // In a building lot the native trees can be *visually excluded* (same flag in RPG).
  // We never modify the Unsung terrain/forest source or the original plaza.
  if(!o.clearTrees&&treeNear(o.x,o.z,rad*.5))return {ok:false,why:'Árbol original: activá despeje automático'};
  if(archNear(o.x,o.z,rad*.6))return {ok:false,why:'Arquitectura original'};
  for(const b of records){
   if(b.id===id||b.id===o.id||b.type.startsWith('floor-')||b.type.startsWith('npc-'))continue;
   const q=BY_ID.get(b.type);
   if(Math.hypot(o.x-b.x,o.z-b.z)<(Math.hypot(w,d)+Math.hypot(q.w*b.scale,q.d*b.scale))*.31)return {ok:false,why:'Edificio superpuesto'};
  }
 }
 // P542: buildings now have an adaptive STRUCTURAL base, not an artificial
 // change to the native heightfield. Use all 9 footing samples, not just 4 corners.
 const support=P542_PREVIEW&&!flat&&!npc&&
  (a.kind==='building'||!!a.model||!!a.privateModel&&a.kind==='building'||!!a.originalPrefab&&a.kind==='building')
   ?buildingSupportPlan(o,{w:a.w,d:a.d},elevation,{topOverride:Math.max(...samples)+.045}):null;
 return {ok:true,y:support?.top??(grade?grade.y:Math.max(...samples)),
  slope:support?.relief??(grade?grade.slope:Math.max(...samples)-Math.min(...samples))};
}
function save(show=false){
 try{localStorage.setItem(STORE,JSON.stringify({schema:1,world:'unsung-vale',author:'HIGHFLY WORLD FORGE 3D',objects:records}));if(show)status('✓ Diseño guardado; compartido con vista 2D y RPG');}
 catch(e){log('Guardar',e.message,false);}
}
function recordSnapshot(){history.push(JSON.stringify(records));if(history.length>60)history.shift();redoStack.length=0;}
function restore(){
 try{
  // Preserve user's previously placed world when first trying this experimental editor.
  let old=localStorage.getItem(STORE);
  // P541 is the real P539 editor with NO prebuilt Arvelia. Bring across
  // only the player's own work. Imported P538/P539/P540 towns are excluded.
  // Both the source save and the old Pages previews remain untouched.
  if(P541_PREVIEW&&!old&&!new URLSearchParams(location.search).has('hfqa')){
   const originalKeys=P542_PREVIEW?['hf-world-forge-layout-p541-manual-v1','hf-world-forge-layout-p539-v1','hf-world-forge-layout-p537-v1']:['hf-world-forge-layout-p539-v1','hf-world-forge-layout-p537-v1'];
   for(const previousKey of originalKeys){
    const previous=localStorage.getItem(previousKey);
    if(!previous)continue;
    try{
     const data=JSON.parse(previous);
     if(data?.schema!==1||data?.world!=='unsung-vale'||!Array.isArray(data.objects))continue;
     const objects=data.objects.filter(o=>o&&!o.highflyTown&&!o.highflyMaster&&
      !o.id?.startsWith('hf-p538-eastbrook-')&&!o.id?.startsWith('hf-p540-')&&
      BY_ID.has(o.type)&&[o.x,o.z,o.yaw,o.scale].every(finite));
     old=JSON.stringify({schema:1,world:'unsung-vale',
      author:'HIGHFLY P541 Manual · user placed objects only; Unsung original remains',
      objects});
     localStorage.setItem(STORE,old);
     log('P541 regreso a editor manual','Copiadas '+objects.length+
      ' construcciones personales de '+previousKey+'; los pueblos generados se excluyeron');
     break;
    }catch{}
   }
  }
  // Migrate the user's existing P532/P531 work as a COPY into the new isolated
  // preview. Never overwrite either earlier version, and never seed CI tests.
  if(!old&&!P541_PREVIEW&&(P533_PREVIEW||P536_PREVIEW)&&!new URLSearchParams(location.search).has('hfqa')){
   for(const previousKey of (P539_PREVIEW?['hf-world-forge-layout-p538-v1','hf-world-forge-layout-p537-v1']:P538_PREVIEW?['hf-world-forge-layout-p537-v1','hf-world-forge-layout-p536-v1','hf-world-forge-layout-p533-v1','hf-world-forge-layout-p532-v1']:P537_PREVIEW?['hf-world-forge-layout-p536-v1','hf-world-forge-layout-p533-v1','hf-world-forge-layout-p532-v1']:P536_PREVIEW?['hf-world-forge-layout-p533-v1','hf-world-forge-layout-p532-v1','hf-world-forge-layout-p531-v1']:['hf-world-forge-layout-p532-v1','hf-world-forge-layout-p531-v1'])){
    const previous=localStorage.getItem(previousKey);
    if(!previous)continue;
    try{
     const d=JSON.parse(previous);
     if(d?.world==='unsung-vale'&&d?.schema===1&&Array.isArray(d.objects)&&
       d.objects.length<=2500&&d.objects.every(o=>BY_ID.has(o.type)&&
        [o.x,o.z,o.yaw,o.scale].every(finite))){
      old=previous;localStorage.setItem(STORE,previous);
      log('Plano anterior conservado','copiado de '+previousKey+' a '+STORE+', sin borrar el original');break;
     }
    }catch{}
   }
  }
  if(old&&!localStorage.getItem(BACKUP))localStorage.setItem(BACKUP,old);
  const d=JSON.parse(old||'null');
  if(d?.schema===1&&Array.isArray(d.objects))records=d.objects.filter(o=>o&&BY_ID.has(o.type)&&[o.x,o.z,o.yaw,o.scale].every(finite));
 }
 catch(e){log('Plano',e.message,false);}log('Guardado compartido',records.length+' elementos');
}
const realPrefab=a=>!!a.model||!!a.freeModel||!!a.qcc0||!!a.privateModel||!!a.originalPrefab||!!a.nativeFlora||a.id.startsWith('npc-');
const modelUrl=a=>a.id.startsWith('npc-')
 ?new URL('../models/hf-kaykit-knight.glb',import.meta.url).href
 :a.qcc0?url(a.freePath):a.freeModel?url('kaykit-free/all/'+a.freePath):url('kaykit-free/building_'+a.model+'_red.gltf');
const prefabReady=new Set(),prefabFailed=new Map();
function getGLTF(a){
 if(!cache.has(a.id)){
  cache.set(a.id,(a.nativeFlora?Promise.resolve({scene:nativeUnsungFlora(a.id)}):
  a.originalPrefab?
  loadUnsungOriginal(a.id,url).then(scene=>({scene})):
  a.privateModel?
  readPrivateSourceGLB(a.id).then(data=>gltfLoader.parseAsync(data,'')):
  gltfLoader.loadAsync(modelUrl(a))).then(g=>{
   if(!g.scene?.children?.length)throw Error('El prefab no contiene geometría');
   const bounds=new THREE.Box3().setFromObject(g.scene),size=bounds.getSize(new THREE.Vector3());
   if(size.x<.01||size.z<.01||size.y<.01)throw Error('El modelo está incompleto o carece de volumen 3D');
   let meshCount=0;g.scene.traverse(o=>{if(o.isMesh)meshCount++;});
   if(!meshCount)throw Error('El glTF no contiene ninguna malla');
   prefabReady.add(a.id);
   log('Prefab completo '+a.label,meshCount+' mallas · '+size.x.toFixed(1)+' × '+size.y.toFixed(1)+' × '+size.z.toFixed(1));
   return g.scene;
  }).catch(err=>{prefabFailed.set(a.id,err.message);log('Prefab no disponible '+a.label,err.message,P539_PREVIEW?'warn':false);return null;}));
 }
 return cache.get(a.id);
}
// P542: original Unsung heightfield never moves. Building-owned adjustable
// masonry feet descend to ground at nine separate contact positions.
function adaptableBuildingSupports(a,o,anchorY){
 const eligible=a.kind==='building'||a.cat==='Edificios'||
  a.cat?.includes('Edificios')||a.cat?.includes('casas')||a.cat?.includes('Arquitectura');
 if(!eligible)return null;
 const support=buildingSupportPlan(o,{w:a.w,d:a.d},elevation,{topOverride:anchorY});
 if(support.relief<.28)return null;
 const g=new THREE.Group(),material=new THREE.MeshLambertMaterial({color:0x999185,side:THREE.DoubleSide});
 const side=Math.min(1.25,Math.max(.45,Math.min(a.w,a.d)*o.scale*.07));
 for(const p of support.positions){
  if(p.height<.16)continue;
  const post=new THREE.Mesh(new THREE.BoxGeometry(side,p.height+.10,side),material);
  post.position.set(p.x,p.centerY-.05,p.z);
  post.userData.foundation=true;post.userData.adaptiveSupport=true;
  g.add(post);
 }
 const header=new THREE.Mesh(new THREE.BoxGeometry(a.w*o.scale*.94,.22,a.d*o.scale*.94),material);
 header.position.set(0,-.13,0);header.userData.foundation=true;g.add(header);
 g.name='HIGHFLY_P542_BUILDING_OWNED_SUPPORTS';
 g.userData.terrainChanged=false;g.userData.terrainRelief=support.relief;
 return g;
}
function foundationFor(a,o,heightSlope){
 const h=Math.max(.16,heightSlope+.26),group=new THREE.Group();
 const slab=new THREE.Mesh(new THREE.BoxGeometry(a.w*o.scale*.97,h,a.d*o.scale*.97),
  new THREE.MeshLambertMaterial({color:0xaaa394,side:THREE.DoubleSide}));
 slab.position.y=-h/2+.035;slab.userData.foundation=true;group.add(slab);
 return group;
}
// Exact native paved court elevations from original Unsung's Architecture.buildPlayable().
function floorElevation(x,z){
 let y=gradedElevation(x,z);
 for(const f of overview?.floors||[]){
  if(!finite(f.y))continue;
  const inside=f.r?Math.hypot(x-f.x,z-f.z)<=f.r-.1:
    (Math.abs(x-f.x)<=(f.w||0)*.5-.1&&Math.abs(z-f.z)<=(f.d||0)*.5-.1);
  if(inside)y=Math.max(y,f.y);
 }
 return y;
}
// Editor-only detailed previews. The real RPG uses original procedural M.PAVING material.
const floorMats=new Map();
function floorMaterial(type){
 if(floorMats.has(type))return floorMats.get(type);
 const c=document.createElement('canvas');c.width=c.height=384;
 const g=c.getContext('2d'),seed=(a,b)=>{let n=Math.imul((a+3)*92837111,(b+7)*689287499);n^=n>>>15;return ((n>>>0)%1000)/1000;};
 // P542 road-earth/grass use the SAME TextureForge shader/atlas as Unsung.
 // Only the LOCAL tile is forced to dirt or grass. The terrain itself is intact.
 if(P542_PREVIEW&&nativeVisuals?.material?.fragmentShader&&
    (type==='floor-earth'||type==='floor-grass')){
  const original='float path=texture(uNativePath,vWorld.xz/2048.0+0.5).r;';
  if(nativeVisuals.material.fragmentShader.includes(original)){
   const m=nativeVisuals.material.clone();
   m.fragmentShader=m.fragmentShader.replace(original,
    'float path='+(type==='floor-earth'?'1.0':'0.0')+';');
   m.side=THREE.DoubleSide;m.polygonOffset=true;m.polygonOffsetFactor=-2;
   m.polygonOffsetUnits=-2;m.needsUpdate=true;
   floorMats.set(type,m);return m;
  }
 }
 const stone=type==='floor-stone',wood=type==='floor-wood',grass=type==='floor-grass';
 g.fillStyle=stone?'#5b5a50':wood?'#564838':grass?'#557c43':'#826d57';g.fillRect(0,0,384,384);
 const rows=stone?9:wood?11:14,step=384/rows;
 for(let row=0;row<rows;row++){
  let x=-step*2*(row%3),index=0;
  while(x<386){
   const n=seed(row,index++),width=stone?step*(1.7+1.2*n):wood?384:step*(.8+1.2*n);
   const top=row*step+1.4,bottom=(row+1)*step-1.3,left=x+1.7;
   const light=stone?Math.round(162+28*n):wood?Math.round(117+27*n):grass?Math.round(92+22*n):Math.round(126+26*n);
   g.fillStyle=stone?'rgb('+(light+10)+','+(light+6)+','+(light-1)+')':
     wood?'rgb('+(light+18)+','+(light+4)+','+(light-21)+')':grass?'rgb('+(light-26)+','+(light+15)+','+(light-26)+')':
       'rgb('+(light+15)+','+light+','+(light-16)+')';
   g.fillRect(left,top,Math.max(1,width-3),bottom-top);
   g.fillStyle=stone?'rgba(245,237,207,.13)':'rgba(246,224,176,.12)';
   g.fillRect(left,top,Math.max(1,width-3),1.4);
   g.fillStyle='rgba(21,27,26,.11)';g.fillRect(left,bottom-2,Math.max(1,width-3),1.7);
   x+=width;if(wood)break;
  }
 }
 for(let k=0;k<4500;k++){
  const x=seed(k,8)*384,y=seed(k,13)*384,n=seed(k,27);
  g.fillStyle=n>.47?'rgba(250,241,218,.055)':'rgba(45,48,43,.05)';
  g.fillRect(x,y,n>.7?1.7:.8,n>.7?1.5:.8);
 }
 const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;
 tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
 const mat=new THREE.MeshLambertMaterial({map:tx,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 floorMats.set(type,mat);return mat;
}
function makeModel(a,o,anchorY=o.y){
 if(isModularCobble(o))return makeModularCobbleTile3D(o,floorElevation,{anchorY:floorElevation(o.x,o.z)+.035});
 if(isCurvedRoad(o))return makeCurvedCobblestone3D(o,floorElevation,{
  anchorX:o.x,anchorY:floorElevation(o.x,o.z)+.035,anchorZ:o.z
 });
 const scenic=makePublicUrbanPrefab(a.id,o.scale)||makeVillageDecor(a.id,o.scale);
 if(scenic)return scenic;
 const group=new THREE.Group();
 if(a.id.startsWith('floor-')){
  if(P542_PREVIEW){
   // Each 4m tile has 10x10 patches following the ACTUAL high-resolution
   // Unsung height sample and/or original plaza ramps, never a flat floating quad.
   const p=conformingTileGrid(o,{w:a.w,d:a.d},floorElevation,{
    anchorY,divisions:10,raise:.15});
   const g=new THREE.BufferGeometry();
   g.setAttribute('position',new THREE.Float32BufferAttribute(p.position,3));
   g.setAttribute('uv',new THREE.Float32BufferAttribute(p.uv,2));
   g.setIndex(p.index);g.computeVertexNormals();g.computeBoundingSphere();
   const surface=new THREE.Mesh(g,floorMaterial(a.id));
   surface.name='HIGHFLY_P542_TERRAIN_MATCHED_'+a.id;
   surface.userData.terrainConform=true;group.add(surface);
   return group;
  }
  const w=a.w*o.scale,d=a.d*o.scale,points=[],uvs=[],c=Math.cos(o.yaw),s=Math.sin(o.yaw);
  for(const [x,z] of [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]]){
   const xx=o.x+x*c-z*s,zz=o.z+x*s+z*c;
   points.push(x,floorElevation(xx,zz)-o.y+.20,z);
   uvs.push(xx/4,zz/4);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();
  group.add(new THREE.Mesh(geo,floorMaterial(a.id)));
  return group;
 }
 const m=new THREE.Mesh(new THREE.BoxGeometry(a.w*o.scale,3*o.scale,a.d*o.scale),new THREE.MeshLambertMaterial({color:0xbaa99c}));
 m.position.y=1.5*o.scale;group.add(m);
 if(a.cat==='Edificios'){
  const roof=new THREE.Mesh(new THREE.ConeGeometry(a.w*o.scale*.72,2.2*o.scale,4),new THREE.MeshLambertMaterial({color:0x795266}));
  roof.rotation.y=Math.PI/4;roof.position.y=3.9*o.scale;group.add(roof);
 }
 return group;
}
async function buildPlaced(o){
 const a=BY_ID.get(o.type);if(!a)return null;
 const root=new THREE.Group(),point=validPosition(o,o.id),footY=point.ok?point.y:elevation(o.x,o.z);
 root.position.set(o.x,footY+.035,o.z);root.rotation.y=o.yaw;root.userData.placeId=o.id;
 if(realPrefab(a)){
  const original=await getGLTF(a);
  if(!original)throw Error('Prefab KayKit 3D sin cargar: '+a.label);
  if(original){
   const model=a.id.startsWith('npc-')?cloneRig(original):original.clone(true);
   const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
   const scale=a.id.startsWith('npc-')?1.8/Math.max(.01,size.y)*o.scale:
     Math.min(a.w/Math.max(.001,size.x),a.d/Math.max(.001,size.z))*o.scale;
   model.scale.setScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale-(gradeEligible(a,o)?Math.min(.22,.16*scale):0),-center.z*scale);
   if(a.id.startsWith('npc-'))model.traverse(x=>{
    if(x.isMesh&&/sword|shield|helmet|visor|cape|dagger|bow|staff/i.test(x.name))x.visible=false;
   });
   else if(P542_PREVIEW){
    const foundation=adaptableBuildingSupports(a,o,footY+.035);
    if(foundation)root.add(foundation);
   }
   else if(!P537_PREVIEW&&(a.model||a.kind==='building')&&(point.slope||0)>.35)root.add(foundationFor(a,o,point.slope||0));
   root.add(model);
  }
 }else{
  root.add(makeModel(a,o,footY));
  if(isCurvedRoad(o))root.userData.roadGeometry=true;
  if(isModularCobble(o))root.userData.modularRoadGeometry=true;
 }
 return root;
}
async function rebuildPlaced(){
 syncGradePlans();
 const token={};rebuildPlaced.token=token;
 for(const child of [...groups.placed.children]){groups.placed.remove(child);if(child.userData.roadGeometry)disposeCurvedRoadGeometry(child);
  if(child.userData.modularRoadGeometry)disposeModularCobbleGeometry(child);}
 viewCache.clear();selected=null;if(gizmo)gizmo.detach();
 for(const o of records){
  let node;try{node=await buildPlaced(o);}catch(err){log('No pude mostrar '+o.type,err.message,false);continue;}
  if(rebuildPlaced.token!==token)return;
  if(node){groups.placed.add(node);viewCache.set(o.id,node);}
 }
 if(P537_PREVIEW)redrawGradedTerrain();
 updateTrees(true);nativeGrass?.update(orbit.target.x,orbit.target.z,true);render();showProps();
}
function showProps(){
 const o=records.find(x=>x.id===selected),name=o?BY_ID.get(o.type).label:chosen?BY_ID.get(chosen).label:'EDITOR 3D';
 $('props').querySelector('strong').textContent=name;
 $('props').querySelector('small').textContent=o?('X '+o.x+' · Z '+o.z+' · Suelo '+o.y.toFixed(1)+' · Giro '+Math.round(o.yaw*180/Math.PI)+'° · Tamaño '+o.scale.toFixed(2)):(chosen?'Edificio completo · giro '+Math.round(pendingYaw*180/Math.PI)+'° · escala '+pendingScale.toFixed(2)+' · tocá o soltá para colocarlo.':'Elegí un edificio real. Tocá para colocar y usá Mover/Girar/Escala sobre la construcción.');
 const legacy=records.filter(x=>Object.hasOwn(LEGACY_UPGRADE,x.type));
 $('upgrade-legacy').hidden=legacy.length===0;
 $('upgrade-legacy').textContent='✨ Reemplazar '+legacy.length+' boceto'+(legacy.length===1?'':'s')+' por KayKit reales';
}
function switchMode(next){
 mode=next;if(ghost)ghost.visible=next==='place';
 for(const id of ['orbit','select','move','rotate','scale'])$(id).classList.toggle('on',id===mode);
 orbit.enabled=mode==='orbit'||mode==='select';
 if(gizmo){
  if(selected&&['move','rotate','scale'].includes(next)){
   gizmo.attach(viewCache.get(selected));gizmo.setMode(next==='move'?'translate':next==='rotate'?'rotate':'scale');gizmo.showY=next!=='move';
  }else gizmo.detach();
 }
 render();
}
async function createGhost(id){
 if(ghost){scene.remove(ghost);ghost=null;}
 const a=BY_ID.get(id);if(!a)return;
 const group=new THREE.Group();group.visible=false;group.userData.ghostFor=id;ghost=group;
 const cube=new THREE.Mesh(new THREE.BoxGeometry(a.w,2.1,a.d),new THREE.MeshBasicMaterial({color:0x88ffe0,transparent:true,opacity:.6,wireframe:true}));
 cube.position.y=1.05;group.add(cube);scene.add(group);
 if(realPrefab(a)){
  const model=await getGLTF(a);
  if(!model||ghost!==group)return;
  const clone=a.id.startsWith('npc-')?cloneRig(model):model.clone(true);
  const box=new THREE.Box3().setFromObject(clone),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const factor=a.id.startsWith('npc-')?1.8/Math.max(.01,size.y):Math.min(a.w/Math.max(.001,size.x),a.d/Math.max(.001,size.z));
  clone.scale.setScalar(factor);clone.position.set(-center.x*factor,-box.min.y*factor,-center.z*factor);
  clone.traverse(node=>{if(!node.isMesh)return;
   const copy=(mat)=>{const m=mat.clone();m.transparent=true;m.opacity=.56;m.depthWrite=false;return m;};
   node.material=Array.isArray(node.material)?node.material.map(copy):copy(node.material);
  });
  group.add(clone);cube.visible=false;render();
 }else{
  const scenic=isModularCobbleType(id)?makeModularCobbleTile3D({type:id,x:0,z:0,yaw:0,scale:1},()=>0,{anchorY:0}):makePublicUrbanPrefab(id,1)||makeVillageDecor(id,1);
  if(scenic){
   scenic.traverse(node=>{
    if(!node.isMesh)return;
    node.material=node.material.clone();node.material.transparent=true;node.material.opacity=.58;node.material.depthWrite=false;
   });
   group.add(scenic);cube.visible=false;render();
  }
 }
}
function previewGhost(ev){
 if(mode!=='place'||!chosen||!ghost)return;
 const hit=hitTerrain(ev);if(!hit){ghost.visible=false;render();return;}
 const a=BY_ID.get(chosen),grid=isModularCobbleType(chosen)?a.w:chosen.startsWith('floor-')?4:2,
  x=snap(hit.x,grid),z=snap(hit.z,grid);
 const check=validPosition({type:chosen,id:'ghost',x,z,yaw:pendingYaw,scale:pendingScale,clearTrees:chosen.startsWith('floor-')||a.kind==='building'||!!a.model||!!a.privateModel&&a.kind==='building'||!!a.originalPrefab&&a.kind==='building'});
 ghost.position.set(x,(check.ok?check.y:elevation(x,z))+.2,z);
 ghost.rotation.y=pendingYaw;ghost.scale.setScalar(pendingScale);ghost.visible=true;
 const outline=ghost.children[0];
 if(outline?.material?.color)outline.material.color.setHex(check.ok?0x88ffe0:0xff6b89);
 status(check.ok?'Vista previa: '+a.label+' · X '+x+' Z '+z:'No se puede colocar aquí: '+check.why);
 render();
}
function selectAsset(id){
 if(id===CURVED_ROAD_TYPE){startRoadDraft();return;}
 const a=BY_ID.get(id);
 if(!a)return;
 chosen=id;selected=null;pendingYaw=0;pendingScale=1;if(gizmo)gizmo.detach();
 switchMode('place');drawCatalog();showProps();
 status('Cargando objeto 3D completo: '+a.label+'…');
 createGhost(id);
 if(realPrefab(a))getGLTF(a).then(mesh=>{
  if(chosen!==id)return;
  if(!mesh&&P539_PREVIEW&&id==='kaykit-blacksmith'){
   selectAsset('kaykit-home-a');
   status('⚒️ Herrería exacta no disponible; seleccionada Casa A CC0 como sustituto 3D.');
   return;
  }
  status(mesh?'✓ '+a.label+' completo. Tocá y arrastrá hasta donde quieras colocarlo.':
   'Falló modelo '+a.label+'. Abrí Diagnóstico; no se colocará una caja falsa.');
 });
 else status('Elegiste '+a.label+' · Tocá terreno libre para colocarlo.');
}
const CATALOG_TABS=[
 {id:'KayKit FREE · Edificios',label:'🏘️ Casas · 4 colores',filter:a=>a.cat==='KayKit FREE · Edificios'},
 {id:'KayKit FREE · Arquitectura',label:'🏰 Puentes · muros',filter:a=>a.cat==='KayKit FREE · Arquitectura'},
 {id:'KayKit FREE · Accesorios',label:'🧰 Accesorios',filter:a=>a.cat==='KayKit FREE · Accesorios'},
 {id:'KayKit FREE · Naturaleza',label:'🌳 Árboles · rocas',filter:a=>a.cat==='KayKit FREE · Naturaleza'},
 {id:'KayKit FREE · Hexágonos',label:'⬡ Hex originales',filter:a=>a.cat==='KayKit FREE · Hexágonos'},
 {id:'Quaternius · Edificios',label:'🏘️ Quaternius · casas',filter:a=>a.cat==='Quaternius · Edificios'},
 {id:'Quaternius · Accesorios',label:'🛒 Quaternius · objetos',filter:a=>a.cat==='Quaternius · Accesorios'},
 {id:'Quaternius · Naturaleza',label:'🌲 Quaternius · árboles',filter:a=>a.cat==='Quaternius · Naturaleza'},
 {id:'Urbanismo HIGHFLY',label:'⛲ Fuentes y farolas',filter:a=>a.cat==='Urbanismo HIGHFLY'},
 {id:'Edificios',label:'🏰 KayKit FREE',filter:a=>!!a.model},
 {id:'SOURCE · Edificios',label:'🏘️ SOURCE edificios',filter:a=>a.privateModel&&a.kind==='building'},
 {id:'SOURCE · Accesorios',label:'🧰 SOURCE accesorios',filter:a=>a.privateModel&&a.kind!=='building'},
 {id:'Unsung original',label:'🏛️ Unsung original',filter:a=>!!a.originalPrefab},
 {id:'Unsung árboles',label:'🌸 Árboles Unsung',filter:a=>!!a.nativeFlora},
 {id:'Pisos',label:'🧱 Pisos y caminos',filter:a=>a.cat==='Pisos'},
 {id:'Decoración',label:'🏮 Decoración HIGHFLY',filter:a=>a.cat==='Decoración'},
 {id:'Naturaleza',label:'🌳 Naturaleza',filter:a=>a.cat==='Naturaleza'},
 {id:'NPC',label:'🧙 NPC',filter:a=>a.cat==='NPC'},
 {id:'Todos',label:'🔎 Todo el catálogo',filter:a=>a.cat!=='Bocetos antiguos'}
];
let catalogLimit=36,brushCells=1,repeatPlacement=!P542_PREVIEW&&(P531_PREVIEW||P532_PREVIEW||P533_PREVIEW||P536_PREVIEW),cameraPan=null,objectClipboard=null;
let roadNodes=[],roadHover=null,roadPreview=null,roadEditId=null,roadDragIndex=-1,roadPreviewStamp=0;
function disposeRoadPreview(){
 if(roadPreview){scene.remove(roadPreview);disposeCurvedRoadGeometry(roadPreview);roadPreview=null;}
}
function roadUI(){
 $('curved-road').classList.toggle('on',mode==='road');
 $('road-finish').hidden=mode!=='road';
 $('road-cancel').hidden=mode!=='road';
 $('road-edit').hidden=!selected||!isCurvedRoad(records.find(o=>o.id===selected));
}
function roadCandidate(nodes){
 const pts=nodes.map(p=>[snap(p[0],.5),snap(p[1],.5)]);
 const first=pts[0];
 return {id:roadEditId||'hf-road-'+Date.now().toString(36),type:CURVED_ROAD_TYPE,
  x:first[0],z:first[1],y:floorElevation(first[0],first[1]),yaw:0,scale:1,
  width:ROAD_WIDTHS[brushCells-1],points:pts,clearTrees:true};
}
function drawRoadPreview(force=false){
 if(mode!=='road')return;
 if(!force&&Date.now()-roadPreviewStamp<58)return;
 roadPreviewStamp=Date.now();
 disposeRoadPreview();
 const pts=roadHover&&roadNodes.length&&Math.hypot(
  roadNodes.at(-1)[0]-roadHover[0],roadNodes.at(-1)[1]-roadHover[1])>1
  ?[...roadNodes,roadHover]:roadNodes;
 if(pts.length<2)return;
 const rd=roadCandidate(pts);if(!roadPathValid(rd).ok)return;
 try{roadPreview=makeCurvedCobblestone3D(rd,floorElevation);roadPreview.name='HIGHFLY_ROAD_UNSAVED_PREVIEW';scene.add(roadPreview);}
 catch(e){log('Vista previa de curva',e.message,false);}
 render();
}
function startRoadDraft(editId=null){
 if(!P533_PREVIEW)return;
 disposeRoadPreview();
 if(ghost)ghost.visible=false;
 selected=null;chosen=CURVED_ROAD_TYPE;roadHover=null;
 roadEditId=editId;
 const existing=records.find(o=>o.id===editId);
 roadNodes=existing?.points?.map(p=>[...p])||[];
 if(existing?.width){
  const i=ROAD_WIDTHS.indexOf(existing.width);
  if(i>=0)brushCells=i+1;
 }
 switchMode('road');drawCatalog();showProps();roadUI();drawRoadPreview(true);
 status(editId?
  '✏️ Edición: arrastrá un nodo del camino para moverlo, agregá otros con clic y pulsá ✅ Terminar.':
  '🛤️ Camino curvo: clic de inicio, clic en cada curva y DOBLE CLIC o Enter para terminar. Bordes incluidos.');
}
function finishRoadDraft(){
 if(mode!=='road')return false;
 const pts=roadNodes.filter((p,i,arr)=>i===0||Math.hypot(p[0]-arr[i-1][0],p[1]-arr[i-1][1])>.65);
 if(pts.length<2){status('Se necesitan dos puntos separados para crear un camino.');return false;}
 const o=roadCandidate(pts),v=validPosition(o,roadEditId);
 if(!v.ok){status('Camino no colocado: '+v.why);return false;}
 if(records.length>=2500&&!roadEditId){status('Límite de piezas alcanzado');return false;}
 recordSnapshot();
 const old=records.find(x=>x.id===roadEditId);
 if(old)Object.assign(old,o,{id:old.id});
 else records.push(o);
 disposeRoadPreview();roadNodes=[];roadHover=null;roadEditId=null;roadDragIndex=-1;
 chosen=null;selected=null;switchMode('orbit');roadUI();
 save(true);rebuildPlaced();
 status('✓ CAMINO CURVO con adoquines y bordillos guardado ('+pts.length+
  ' nodos · '+o.width+' m). Ya podés continuar con otra curva desde el extremo.');
 return true;
}
function cancelRoadDraft(){
 disposeRoadPreview();roadNodes=[];roadHover=null;roadEditId=null;roadDragIndex=-1;
 chosen=null;switchMode('orbit');roadUI();status('Diseño de camino cancelado, no se cambió el mapa.');
}
function addRoadNode(hit){
 if(!hit||mode!=='road')return;
 const point=[snap(hit.x,.5),snap(hit.z,.5)];
 if(roadNodes.length>=24){status('Límite de 24 nodos; finalizá el tramo.');return;}
 if(roadNodes.some(p=>Math.hypot(p[0]-point[0],p[1]-point[1])<.65)){return;}
 roadNodes.push(point);roadHover=null;drawRoadPreview(true);
 status('🛤️ '+roadNodes.length+' nodos · ancho '+ROAD_WIDTHS[brushCells-1]+
  ' m · clic para curva, doble clic o Enter para terminar; Ctrl+Z quita el último nodo.');
}

function catalogCandidates(){
 const tab=CATALOG_TABS.find(x=>x.id===category)||CATALOG_TABS[0];
 const q=$('search').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return base.filter(a=>tab.filter(a)&&a.cat!=='Bocetos antiguos'&&
  (!q||[a.label,a.id,a.searchTags,a.originalCategory,a.sourcePack,a.cat,a.freePath].some(v=>String(v||'')
   .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q))));
}
function drawCatalog(){
 const root=$('catalog');root.replaceChildren();
 const candidates=catalogCandidates(),list=candidates.slice(0,catalogLimit);
 $('catalog-meta').textContent=candidates.length+' modelos · '+Math.min(catalogLimit,candidates.length)+' visibles'+
  (category.startsWith('SOURCE')?' · importar ZIP privado para acceder a los 182 GLB':'');
 $('catalog-more').hidden=candidates.length<=catalogLimit;
 if(!list.length){
  const info=document.createElement('p');info.style.cssText='padding:12px;color:#e0c89c;grid-column:span 2';
  info.textContent=category.startsWith('SOURCE')
   ?'📦 Primero importá HIGHFLY_KAYKIT_SOURCE_EDITOR_V1_PRIVATE.zip con el botón SOURCE + Halloween.'
   :'No hay modelos para este filtro.';root.append(info);return;
 }
 for(const a of list){
  const el=document.createElement('button');el.type='button';
  el.className='asset'+(chosen===a.id?' selected':'');
  el.title=a.label+' · '+a.w+' × '+a.d+' m'+(a.sourcePack?' · '+a.sourcePack:'');
  if(a.model||a.freeModel||a.qcc0||a.nativeFlora||a.originalPrefab){
   const img=document.createElement('img');img.loading='lazy';img.alt=a.label;
   img.src=a.originalPrefab?url('unsung-original/thumbs/'+a.id+'.png'):
    a.nativeFlora?url('unsung-flora/thumbs/'+a.id+'.svg'):
    a.qcc0?url('quaternius-cc0/thumbs/'+a.id+'.png'):
    a.freeModel?url('kaykit-free/thumbs-all/'+a.thumbName+'.png'):
    url('kaykit-free/thumbs/building_'+a.model+'_red.png');
   img.onerror=()=>{const icon=document.createElement('strong');icon.className='emoji';icon.textContent=a.icon;img.replaceWith(icon);};
   el.append(img);
  }else{
   const icon=document.createElement('strong');icon.className='emoji';icon.textContent=a.icon;el.append(icon);
  }
  const label=document.createElement('span');label.textContent=a.label;el.append(label);
  const type=document.createElement('small');type.className='asset-type';type.textContent=a.sourcePack||a.originalCategory||a.sub||
   (a.originalPrefab?'UNSUNG · MIT':a.freeModel||a.model?'KAYKIT FREE · CC0':a.cat);el.append(type);
  const size=document.createElement('small');size.className='asset-size';
  size.textContent=a.w+' × '+a.d+' m · '+(a.originalPrefab?'ORIGINAL':a.privateModel?'SOURCE':'3D');
  el.append(size);
  el.onclick=()=>selectAsset(a.id);root.append(el);
 }
}
function setCategory(a){
 category=a;catalogLimit=36;
 for(const b of $('cats').children)b.classList.toggle('on',b.dataset.cat===a);
 drawCatalog();
}
function drawCats(){
 $('cats').replaceChildren();
 for(const tab of CATALOG_TABS.filter(x=>(!(P531_PREVIEW||P532_PREVIEW||P533_PREVIEW)||!x.id.startsWith('SOURCE'))&&(!(P532_PREVIEW||P533_PREVIEW)||x.id!=='Edificios'))){
  const el=document.createElement('button');el.type='button';el.dataset.cat=tab.id;
  const count=base.filter(a=>tab.filter(a)&&a.cat!=='Bocetos antiguos').length;
  el.textContent=tab.label+' ('+count+')';el.onclick=()=>setCategory(tab.id);$('cats').append(el);
 }
 setCategory(category);
}
function addAt(x,z){
 if(!chosen||!map)return false;
 if(!BY_ID.get(chosen)?.model&&BY_ID.get(chosen)?.cat==='Bocetos antiguos'){status('Elegí un edificio completo KayKit en vez del boceto antiguo.');return false;}
 const a=BY_ID.get(chosen),o={id:'hf-wf-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),type:chosen,x:snap(x,isModularCobbleType(chosen)?a.w:chosen.startsWith('floor-')?4:2),z:snap(z,isModularCobbleType(chosen)?a.w:chosen.startsWith('floor-')?4:2),yaw:pendingYaw,scale:pendingScale,y:0};
 if(realPrefab(a)&&!prefabReady.has(a.id)){status('El edificio todavía está cargando: '+a.label+'. No se guardó ninguna caja provisional.');return false;}
 if(chosen.startsWith('floor-')||a.kind==='building'||a.model||a.privateModel&&a.kind==='building'||a.originalPrefab&&a.kind==='building')o.clearTrees=true;
 const check=validPosition(o);if(!check.ok){status('No se puede colocar '+a.label+': '+check.why);return false;}
 if(records.length>=2500){status('Llegaste al límite de 2500 piezas. Exportá el plano antes de seguir.');return false;}
 if(o.type.startsWith('floor-')&&records.some(a=>a.type===o.type&&Math.hypot(a.x-o.x,a.z-o.z)<1.1))return false;
 if(isModularCobble(o)&&records.some(p=>isModularCobble(p)&&Math.hypot(p.x-o.x,p.z-o.z)<.3))return false;
 o.y=check.y;records.push(o);
 buildPlaced(o).then(root=>{if(root&&records.some(v=>v.id===o.id)){
  groups.placed.add(root);viewCache.set(o.id,root);
  if(!repeatPlacement&&!o.type.startsWith('floor-')&&mode==='place'&&chosen===o.type){
   selectObject(o.id);
   status('✓ '+a.label+' colocado. Ya podés MOVER, GIRAR o cambiar tamaño.');
  }
  render();
 }}).catch(err=>{
  // Failed assets must never become fake boxes or be saved as invisible objects.
  const pos=records.findIndex(x=>x.id===o.id);
  if(pos>=0){records.splice(pos,1);save();updateTrees(true);}
  log('No se pudo colocar '+a.label,err.message,false);
 });
 if(o.clearTrees){updateTrees(true);nativeGrass?.update(orbit.target.x,orbit.target.z,true);}
 if(P537_PREVIEW){syncGradePlans();redrawGradedTerrain();}
 status('✓ Añadido '+a.label+' · X '+o.x+' / Z '+o.z);
 return o.id;
}
function paintLine(a,b){
 const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/2));
 // A true grid brush: never skip 4m paving cells when the finger moves quickly.
 let x0=Math.round(a.x/4),z0=Math.round(a.z/4),x1=Math.round(b.x/4),z1=Math.round(b.z/4);
 let dx=Math.abs(x1-x0),dz=-Math.abs(z1-z0),sx=x0<x1?1:-1,sz=z0<z1?1:-1,err=dx+dz,guard=0;
 while(guard++<300){
  // Age-style brush: each pointer stroke fills a controllable 4/8/12 m band.
  for(let ox=-(brushCells-1);ox<=brushCells-1;ox++)
   for(let oz=-(brushCells-1);oz<=brushCells-1;oz++)
    if(Math.hypot(ox,oz)<=Math.max(.8,brushCells-1+.1))addAt((x0+ox)*4,(z0+oz)*4);
  if(x0===x1&&z0===z1)break;
  const e=2*err;if(e>=dz){err+=dz;x0+=sx;}if(e<=dx){err+=dx;z0+=sz;}
 }
}
function clickPlaced(ev){
 positionPointer(ev);const hit=raycaster.intersectObjects(groups.placed.children,true);
 for(const h of hit){
  let o=h.object;while(o&&!o.userData.placeId)o=o.parent;
  if(o?.userData.placeId)return o.userData.placeId;
 }
 return null;
}
function selectObject(id){
 const isRoad=isCurvedRoad(records.find(o=>o.id===id));
 chosen=null;selected=id;if(ghost)ghost.visible=false;drawCatalog();showProps();
 switchMode(isRoad?'select':'move');roadUI();
 if(isRoad)status('Camino curvo seleccionado. Pulsá ✏️ Editar curva para mover o añadir nodos.');
}
function transform(action){
 const o=records.find(v=>v.id===selected);
 if(!o&&chosen){
  if(action==='rot-left')pendingYaw-=isModularCobbleType(chosen)?Math.PI/2:Math.PI/12;
  if(action==='rot-right')pendingYaw+=isModularCobbleType(chosen)?Math.PI/2:Math.PI/12;
  if(!isModularCobbleType(chosen)&&action==='size-down')pendingScale=clamp(pendingScale-.1,.5,3);
  if(!isModularCobbleType(chosen)&&action==='size-up')pendingScale=clamp(pendingScale+.1,.5,3);
  if(ghost){ghost.rotation.y=pendingYaw;ghost.scale.setScalar(pendingScale);}
  showProps();render();status('Vista previa: giro '+Math.round(pendingYaw*180/Math.PI)+'° · tamaño '+pendingScale.toFixed(2));return;
 }
 if(!o)return;
 const old={...o};recordSnapshot();
 if(action==='rot-left')o.yaw-=isModularCobble(o)?Math.PI/2:Math.PI/12;else if(action==='rot-right')o.yaw+=isModularCobble(o)?Math.PI/2:Math.PI/12;
 else if(!isModularCobble(o)&&action==='size-down')o.scale=clamp(o.scale-.1,.5,3);
 else if(!isModularCobble(o)&&action==='size-up')o.scale=clamp(o.scale+.1,.5,3);
 const check=validPosition(o,o.id);
 if(!check.ok){Object.assign(o,old);history.pop();status('No se puede modificar: '+check.why);return;}
 o.y=check.y;save();rebuildPlaced();
}
function remove(){const i=records.findIndex(a=>a.id===selected);if(i<0)return;recordSnapshot();records.splice(i,1);save();rebuildPlaced();}
function undo(){if(!history.length)return;redoStack.push(JSON.stringify(records));records=JSON.parse(history.pop());save();rebuildPlaced();status('Cambio deshecho');}
function redo(){if(!redoStack.length)return;history.push(JSON.stringify(records));records=JSON.parse(redoStack.pop());save();rebuildPlaced();status('Cambio recuperado');}
async function upgradeLegacy(){
 const queue=records.filter(o=>Object.hasOwn(LEGACY_UPGRADE,o.type));
 if(!queue.length){status('No hay bocetos antiguos para reemplazar.');return;}
 $('upgrade-legacy').disabled=true;
 try{
  // Migration is opt-in, never automatic. Save exact previous document first.
  const old=localStorage.getItem(STORE);
  if(old)localStorage.setItem('hf-world-forge-layout-v1-backup-pre-p527-prefabs',old);
  recordSnapshot();
  let done=0,blocked=0,loadFailures=0;
  for(const o of queue){
   const id=LEGACY_UPGRADE[o.type],asset=BY_ID.get(id);
   const prefab=await getGLTF(asset);
   if(!prefab){loadFailures++;continue;}
   const newItem={...o,type:id,clearTrees:true},valid=validPosition(newItem,o.id);
   if(!valid.ok){blocked++;continue;}
   Object.assign(o,newItem,{y:valid.y});done++;
  }
  if(!done)history.pop();
  else{save();await rebuildPlaced();}
  status(done+' boceto'+(done===1?'':'s')+' reemplazado'+(done===1?'':'s')+' por modelos KayKit completos. '+blocked+' bloqueados por terreno/colisiones; '+loadFailures+' fallos de modelo.');
 }finally{$('upgrade-legacy').disabled=false;showProps();}
}
const CLIPBOARD_SESSION='hf-world-forge-public-object-clipboard-v1';
function copySelected(){
 const item=records.find(o=>o.id===selected);
 if(!item){status('Primero seleccioná un edificio, árbol o accesorio para copiarlo.');return false;}
 objectClipboard={type:item.type,yaw:item.yaw,scale:item.scale,clearTrees:!!item.clearTrees};
 try{sessionStorage.setItem(CLIPBOARD_SESSION,JSON.stringify(objectClipboard));}catch{}
 try{navigator.clipboard?.writeText(JSON.stringify({highflyWorldObject:1,...objectClipboard}))?.catch(()=>{});}catch{}
 status('✓ Copiado '+BY_ID.get(item.type).label+'. Ctrl+V para elegir dónde pegarlo.');
 return true;
}
async function pasteCopied(){
 if(!objectClipboard){
  try{objectClipboard=JSON.parse(sessionStorage.getItem(CLIPBOARD_SESSION)||'null');}catch{}
 }
 if(!objectClipboard&&navigator.clipboard?.readText){
  try{const data=JSON.parse(await navigator.clipboard.readText());
   if(data?.highflyWorldObject===1)objectClipboard=data;
  }catch{}
 }
 const item=objectClipboard;
 if(!item||!BY_ID.has(item.type)||!finite(item.scale)||!finite(item.yaw)){
  status('Primero copiá un objeto con Ctrl+C, después pegalo con Ctrl+V.');return false;
 }
 selectAsset(item.type);
 pendingYaw=item.yaw;pendingScale=clamp(item.scale,.5,3);
 if(ghost){ghost.rotation.y=pendingYaw;ghost.scale.setScalar(pendingScale);}
 status('📋 '+BY_ID.get(item.type).label+' listo para pegar. Mové el cursor y hacé clic donde quieras; podés pegar varias copias.');
 return true;
}
async function duplicateSelected(){
 const source=records.find(x=>x.id===selected);if(!source)return;
 const asset=BY_ID.get(source.type);if(!asset)return;
 const test={...source,id:'hf-wf-'+Date.now().toString(36)+'-dup',
   x:snap(source.x+(asset.w*source.scale+(isModularCobble(source)?0:2)),isModularCobble(source)?asset.w:2)};
 const check=validPosition(test);
 if(!check.ok){status('No se puede duplicar aquí: '+check.why);return;}
 test.y=check.y;recordSnapshot();records.push(test);save();
 try{const node=await buildPlaced(test);if(node){groups.placed.add(node);viewCache.set(test.id,node);selectObject(test.id);updateTrees(true);render();}}
 catch(err){records=records.filter(x=>x.id!==test.id);save();log('Duplicar edificio',err.message,false);}
}
async function loadBeginningVillage({auto=false}={}){
 if(!map||!overview){status('Necesitamos primero las alturas y el terreno original de Unsung.');return;}
 if(records.length>2100){status('No queda suficiente espacio editable. Exportá primero tu plano.');return;}
 const button=$('preset-village');button.disabled=true;
 try{
  const plan=buildBeginningVillage({
   // Always anchor at the real native starting plaza, not the last arbitrary camera focus.
   origin:{x:-512,z:-70},
   canPlace:o=>validPosition(o),
   existing:records
  });
  if(plan.buildings<3||plan.paved<40){
   status('No encontramos una explanada segura para reproducir la aldea. No se modificó tu mapa.');return;
  }
  const summary='Pueblo de los Inicios: '+plan.buildings+' edificios completos, '+plan.paved+
   ' piezas de piedra y '+plan.decorations+' accesorios. Centro X '+plan.center.x+
   ', Z '+plan.center.z+'. ¿Agregar a TU mundo sin borrar lo anterior?';
  if(!auto&&!window.confirm(summary))return;
  status('Comprobando edificios KayKit completos antes de añadir el pueblo…');
  const types=[...new Set(plan.objects.filter(o=>BY_ID.get(o.type)?.model).map(o=>o.type))];
  const loaded=await Promise.all(types.map(async type=>({type,model:await getGLTF(BY_ID.get(type))})));
  const bad=loaded.filter(o=>!o.model);
  if(bad.length){status('Falta un prefab completo: '+bad.map(o=>o.type).join(', ')+'. No se modificó nada.');return;}
  // Strictly additive, reversible and backed up, with no replacements of Unsung's scenery.
  const old=localStorage.getItem(STORE);
  if(old)localStorage.setItem(P529_PREVIEW?'hf-world-forge-layout-p529-backup-pre-village':'hf-world-forge-layout-v1-backup-pre-p528-village',old);
  recordSnapshot();
  records.push(...plan.objects);
  save();await rebuildPlaced();focus(plan.center.x,plan.center.z,135);
  status('✓ Aldea colocada: '+plan.buildings+' edificios, '+plan.paved+' adoquines, '+
   plan.decorations+' accesorios. Omitidos por relieve: '+plan.skipped.length+
   '. Editá cada elemento o entrá al RPG para recorrerla.');
  log('P5.2.8 Pueblo de los Inicios',records.length+' objetos totales · '+
   plan.buildings+' edificios KayKit 3D · '+plan.skipped.length+' lotes inaccesibles');
 }catch(err){log('Pueblo de los Inicios',err.message,false);status('No pude crear la aldea: '+err.message);}
 finally{button.disabled=false;}
}

async function loadEastbrookLand({auto=false}={}){
 if(!map||!overview||!architectPixel){status('Primero se necesitan alturas, árboles y arquitectura nativa.');return false;}
 const button=$('pilot-eastbrook');
 if(records.some(o=>o.highflyTown==='arvelia'&&o.id?.startsWith('hf-p538-'))){
  status('Arvelia ya está importada. Usá Mover, Girar o Eliminar para editarla.');return false;
 }
 if(records.length>2450){status('Plano muy lleno para incorporar Arvelia. Exportá tu diseño.');return false;}
 if(button)button.disabled=true;
 const old=JSON.stringify(records);
 try{
  const resolver={
   canPlace:o=>validPosition(o),
   existing:records,
   sizeOf:type=>{const a=BY_ID.get(type);return a?[a.w,a.d]:null;},
   blockedAt:(x,z,r)=>treeNear(x,z,r)||archNear(x,z,r)
  };
  let buildingTypes={},plan=buildEastbrookLand({...resolver,buildingTypes});
  // Actual asset preflight: substitute genuine FREE CC0/Unsung full meshes if
  // another prefab fails. Recalculate footprints after each substitution.
  // Do NOT mutate or erase the user's map unless all required roles are ready.
  const substitutions=[];
  if(P539_PREVIEW){
   for(let pass=0;pass<5&&plan.complete;pass++){
    const missing=[];
    for(const type of new Set(plan.objects.map(o=>o.type))){
     const asset=BY_ID.get(type);
     if(!asset||!await getGLTF(asset))missing.push(type);
    }
    if(!missing.length)break;
    let fixed=false;
    for(const spec of EASTBROOK_LAND_SPECS){
     const current=buildingTypes[spec.role]||spec.type;
     if(!missing.includes(current))continue;
     for(const candidate of EASTBROOK_FREE_FALLBACKS[current]||['kaykit-home-a','kaykit-home-b','unsung-hall']){
      const asset=BY_ID.get(candidate);
      if(asset&&await getGLTF(asset)){
       buildingTypes[spec.role]=candidate;
       substitutions.push(spec.role+': '+current+' → '+candidate);
       fixed=true;break;
      }
     }
    }
    if(!fixed)break;
    plan=buildEastbrookLand({...resolver,buildingTypes});
   }
  }
  if(!plan.complete){status('Arvelia no se aplicó: '+plan.reason+'. Centro '+plan.center.x+', '+plan.center.z+'.');return false;}
  const summary='Arvelia (solo tierra): '+plan.major+' edificios centrales, '+plan.optional+
   ' complementarios y '+plan.objects.filter(o=>o.highflyNpc).length+
   ' NPC, sin puerto. Ubicación X '+plan.center.x+', Z '+plan.center.z+
   '. Se agrega a tu terreno original sin borrar nada. ¿Importar?';
  if(!auto&&!window.confirm(summary))return false;
  const models=[...new Set(plan.objects.map(o=>o.type))].map(type=>BY_ID.get(type));
  if(models.some(a=>!a)){status('Falta un edificio o NPC en el catálogo público. Plano sin cambios.');return false;}
  const loaded=await Promise.all(models.map(async a=>({id:a.id,model:await getGLTF(a)})));
  if(loaded.some(x=>!x.model)){status('Faltan modelos CC0 tras reemplazos: '+loaded.filter(x=>!x.model).map(x=>x.id).join(', ')+'. Plano intacto.');return false;}
  const saved=localStorage.getItem(STORE);
  if(saved)localStorage.setItem(P539_PREVIEW?'hf-world-forge-layout-p539-before-eastbrook':'hf-world-forge-layout-p538-before-eastbrook',saved);
  recordSnapshot();records.push(...plan.objects);
  save();await rebuildPlaced();focus(plan.center.x,plan.center.z,130);
  status('✓ ARVELIA IMPORTADA: '+plan.major+' edificios centrales, '+plan.optional+
   ' extras y '+plan.objects.filter(o=>o.highflyNpc).length+' NPC; sin puerto. '+
   (P539_PREVIEW?'Herrería: modelo original o sustituto CC0 según carga. ':'')+
   (substitutions.length?'Sustitutos: '+substitutions.join('; '):''));
  log('HIGHFLY P5.3.8 Eastbrook tierra',plan.objects.length+
   ' elementos en terreno validado · layout trasladado desde fuente MIT; diálogos HIGHFLY originales.');
  return true;
 }catch(err){
  try{records=JSON.parse(old);save();await rebuildPlaced();}catch{}
  status('Arvelia cancelada sin modificaciones: '+err.message);
  log('Eastbrook importador',err.message,false);return false;
 }finally{if(button)button.disabled=false;}
}

async function handlePrivateImport(ev){
 const file=ev.target.files?.[0];ev.target.value='';if(!file)return;
 const btn=$('import-source');btn.disabled=true;
 try{
  const metadata=await importPrivateSourcePack(file,message=>status(message));
  addPrivateCatalog(metadata);cache.clear();prefabReady.clear();prefabFailed.clear();
  catalogLimit=36;
  category='KayKit SOURCE';
  drawCats();
  await rebuildPlaced();
  status('✓ '+metadata.length+' modelos KayKit SOURCE, Halloween y Mixed Bag 2 disponibles en este Android. Buscá el catálogo KayKit SOURCE.');
  log('Importación SOURCE privada',metadata.length+' GLB válidos en IndexedDB; ningún archivo se subió a GitHub.');
 }catch(err){status('No se pudo importar el SOURCE: '+err.message);log('Importación KayKit',err.message,false);}
 finally{btn.disabled=false;}
}
function exportJSON(){
 const blob=new Blob([JSON.stringify({schema:1,world:'unsung-vale',objects:records},null,2)],{type:'application/json'});
 const path=URL.createObjectURL(blob),a=document.createElement('a');a.href=path;a.download='HIGHFLY-WORLD-FORGE.json';a.click();setTimeout(()=>URL.revokeObjectURL(path),1200);
}
function bindUI(){
 if($('pilot-eastbrook'))$('pilot-eastbrook').onclick=()=>loadEastbrookLand();
 $('search').oninput=()=>{catalogLimit=36;drawCatalog();};
 $('catalog-more').onclick=()=>{catalogLimit+=36;drawCatalog();};
 $('repeat-place').onclick=()=>{repeatPlacement=!repeatPlacement;
  $('repeat-place').classList.toggle('on',repeatPlacement);
  $('repeat-place').textContent='↻ Repetir: '+(repeatPlacement?'SÍ':'NO');
  status(repeatPlacement?'Herramienta continua: podés colocar varias construcciones iguales seguidas.':
    'Colocación individual: al poner una casa pasa a Mover/Girar.');
 };
 $('quality-toggle').onclick=()=>{
  qualityHigh=!qualityHigh;
  renderer.setPixelRatio(Math.min(qualityHigh?2:1.15,window.devicePixelRatio||1));
  $('quality-toggle').textContent=qualityHigh?'✨ Calidad ALTA':'⚡ Calidad NORMAL';
  $('quality-toggle').classList.toggle('on',qualityHigh);
  fit();updateTrees(true);nativeGrass?.update(orbit.target.x,orbit.target.z,true);render();
  status('Calidad '+(qualityHigh?'ALTA (mallas reales Unsung y GLB a resolución de PC)':'NORMAL (menos píxeles de dibujo)')+
    '. No cambia las texturas, el mapa ni el guardado.');
 };
 $('quality-toggle').textContent=qualityHigh?'✨ Calidad ALTA':'⚡ Calidad NORMAL';
 $('quality-toggle').classList.toggle('on',qualityHigh);
 if(P542_PREVIEW){
  $('tool-dirt').onclick=()=>{selectAsset('floor-earth');status('🟫 Tierra ORIGINAL de Unsung: arrastrá para pintar un camino continuo con textura nativa y desniveles intactos.');};
  $('tool-grass').onclick=()=>{selectAsset('floor-grass');status('🌿 Pasto ORIGINAL de Unsung: arrastrá para pintar sobre el relieve sin elevar ni cortar el terreno.');};
 }
 $('brush-width').onclick=()=>{
  brushCells=brushCells%3+1;
  $('brush-width').textContent='🧱 Ancho '+ROAD_WIDTHS[brushCells-1]+' m';
  if(mode==='road')drawRoadPreview(true);
  status('Ancho '+ROAD_WIDTHS[brushCells-1]+' metros. Los caminos curvos conservan ambos bordillos de piedra.');
 };
 $('curved-road').onclick=()=>startRoadDraft();
 $('road-edit').onclick=()=>{if(selected)startRoadDraft(selected);};
 $('road-finish').onclick=finishRoadDraft;
 $('road-cancel').onclick=cancelRoadDraft;
 $('map2d').onclick=()=>{save();localStorage.setItem(VIEW,JSON.stringify({x:orbit.target.x,z:orbit.target.z}));location.href=url('world-forge.html');};
 for(const id of ['orbit','select','move','rotate','scale'])$(id).onclick=()=>{if(['move','rotate','scale'].includes(id)&&!selected){status('Seleccioná un elemento antes.');return;}chosen=null;drawCatalog();switchMode(id);showProps();};
 $('home').onclick=()=>focus(-512,-70);
 $('top').onclick=()=>{const p=orbit.target;cam.position.set(p.x+.1,p.y+270,p.z+.1);orbit.update();render();};
 $('iso').onclick=()=>{const p=orbit.target;cam.position.set(p.x+140,p.y+150,p.z+140);orbit.update();render();};
 for(const [id,name] of [['trees','trees'],['original','original'],['water','water']])$(id).onclick=()=>{groups[name].visible=!groups[name].visible;$(id).classList.toggle('on',groups[name].visible);if(name==='trees')updateTrees(true);render();};
 $('save').onclick=()=>save(true);$('undo').onclick=undo;$('redo').onclick=redo;$('export').onclick=exportJSON;
 $('preset-village').onclick=loadBeginningVillage;
 $('import-source').onclick=()=>$('source-file').click();
 $('source-file').onchange=handlePrivateImport;
 $('import').onclick=()=>$('file').click();
 $('file').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(d.schema!==1||d.world!=='unsung-vale'||!Array.isArray(d.objects)||d.objects.length>2500||!d.objects.every(o=>BY_ID.has(o.type)&&[o.x,o.z,o.yaw,o.scale].every(finite)))throw Error('Formato no compatible');
  recordSnapshot();records=d.objects.map(o=>({...o,y:elevation(o.x,o.z)}));save();rebuildPlaced();status('Plano importado: '+records.length+' piezas');
 }catch(err){status('Error importando: '+err.message);}e.target.value='';};
 $('play').onclick=()=>{save();location.href=new URL('../?hfworld=1',import.meta.url).href;};
 for(const id of ['rot-left','rot-right','size-down','size-up'])$(id).onclick=()=>transform(id);
 $('remove').onclick=remove;
 $('duplicate').onclick=duplicateSelected;
 $('copy-object').onclick=copySelected;
 $('paste-object').onclick=pasteCopied;
 $('upgrade-legacy').onclick=upgradeLegacy;
 $('diag-button').onclick=()=>$('diagnostics').hidden=!$('diagnostics').hidden;
 $('close-diagnostics').onclick=()=>$('diagnostics').hidden=true;
 $('copy-diagnostics').onclick=async()=>{try{await navigator.clipboard.writeText($('log').textContent);status('Diagnóstico copiado');}catch{status('Seleccioná y copiá el informe del panel.')}};
 window.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if(mode==='road'){
   if(e.key==='Enter'){e.preventDefault();finishRoadDraft();return;}
   if(e.key==='Escape'){e.preventDefault();cancelRoadDraft();return;}
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){
    e.preventDefault();roadNodes.pop();drawRoadPreview(true);
    status('↶ Último nodo eliminado. Quedan '+roadNodes.length);return;
   }
  }
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'){e.preventDefault();copySelected();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='v'){e.preventDefault();pasteCopied();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save(true);return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();duplicateSelected();return;}
  if(!e.ctrlKey&&!e.metaKey&&!e.altKey){
   const k=e.key.toLowerCase();
   if(['q','r'].includes(k)&&mode==='place'){e.preventDefault();transform(k==='q'?'rot-left':'rot-right');return;}
   if(['1','2','3'].includes(k)){brushCells=Number(k);$('brush-width').textContent='🧱 Ancho '+ROAD_WIDTHS[brushCells-1]+' m';if(mode==='road')drawRoadPreview(true);status('Ancho '+ROAD_WIDTHS[brushCells-1]+' metros.');return;}
   if(k==='v'){$('select').click();return;}
   if(k==='c'){$('orbit').click();return;}
   if(k==='t'){$('top').click();return;}
   if(k==='i'){$('iso').click();return;}
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();e.shiftKey?redo():undo();}
  if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();redo();}
  if(e.key==='Delete'||e.key==='Backspace')remove();
  if(e.key==='Escape'){chosen=null;switchMode('orbit');drawCatalog();}
 });

 if(P539_PREVIEW&&$('slope-toggle'))$('slope-toggle').onclick=()=>{
  adaptSlope=!adaptSlope;
  $('slope-toggle').textContent='🧱 Pendiente AUTO: '+(adaptSlope?'SÍ':'NO');
  $('slope-toggle').classList.toggle('on',adaptSlope);
  status(P542_PREVIEW?(adaptSlope?'✓ Base del EDIFICIO adaptable: el terreno original NO se modifica.':'Sólo parcelas casi niveladas.'):adaptSlope?'✓ Edificios sobre pendientes: el suelo nativo se adapta sin losas flotantes.':'Modo plano: solo permite edificios en parcelas casi niveladas.');
 };
 const heldMove=new Set();let navFrame=0,navLast=0;
 const fly=(now)=>{
  const dt=Math.min(.05,Math.max(.008,(now-(navLast||now-16))/1000));navLast=now;
  const forward=orbit.target.clone().sub(cam.position);forward.y=0;
  if(forward.lengthSq()>.00001)forward.normalize();
  const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
  const move=new THREE.Vector3();
  if(heldMove.has('w')||heldMove.has('arrowup'))move.add(forward);
  if(heldMove.has('s')||heldMove.has('arrowdown'))move.sub(forward);
  if(heldMove.has('d')||heldMove.has('arrowright'))move.add(right);
  if(heldMove.has('a')||heldMove.has('arrowleft'))move.sub(right);
  if(move.lengthSq()>.00001){
   const speed=Math.min(110,Math.max(12,cam.position.distanceTo(orbit.target)*.34))*
     (heldMove.has('shift')?2.5:1);
   move.normalize().multiplyScalar(speed*dt);
   cam.position.add(move);orbit.target.add(move);
   orbit.update();render();
  }
  navFrame=heldMove.size?requestAnimationFrame(fly):0;
 };
 if(P539_PREVIEW){
  window.addEventListener('keydown',e=>{
   if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
   const k=e.key.toLowerCase();
   if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k))return;
   heldMove.add(k);if(k!=='shift')e.preventDefault();
   if(!navFrame){navLast=0;fly(performance.now());} // immediate first movement, even when GPU frames stall
  });
  window.addEventListener('keyup',e=>{heldMove.delete(e.key.toLowerCase());});
  window.addEventListener('blur',()=>{heldMove.clear();navLast=0;});
 }
 $('p536-bend-tight').onclick=()=>selectAsset('floor-stone-curve-tight');
 $('p536-bend-wide').onclick=()=>selectAsset('floor-stone-curve-wide');
 const canvas=renderer.domElement;
 canvas.addEventListener('dblclick',e=>{
  if(P542_PREVIEW&&mode!=='road'){
   const hit=clickPlaced(e);
   if(hit){e.preventDefault();selectObject(hit);
    status('✓ Objeto seleccionado con doble clic, listo para mover, girar o escalar.');return;}
  }
  if(mode==='road'){e.preventDefault();const h=hitTerrain(e);if(h&&roadNodes.length<24){
   const point=[snap(h.x,.5),snap(h.z,.5)];
   if(!roadNodes.length||Math.hypot(roadNodes.at(-1)[0]-point[0],roadNodes.at(-1)[1]-point[1])>.85)
    roadNodes.push(point);
  }finishRoadDraft();}
 });
 // For desk editing the cursor must be able to pan/zoom while a building
 // brush is selected. We don't enable competing left-drag OrbitControls.
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('wheel',e=>{
  if(!['place','move','rotate','scale'].includes(mode))return;
  e.preventDefault();
  const target=orbit.target,vec=cam.position.clone().sub(target);
  vec.multiplyScalar(e.deltaY>0?1.12:.88).clampLength(8,4500);
  cam.position.copy(target).add(vec);orbit.update();updateNear();updateTrees();render();
 },{passive:false});
 // Age/Sims-style interaction: tap/drop a house, drag a continuous floor brush.
 // Pointer capture also works on Android, where PointerEvent.buttons is often 0.
 canvas.addEventListener('pointerdown',e=>{
  if(mode==='road'&&e.button===0){
   e.preventDefault();const hit=hitTerrain(e);if(!hit)return;
   if(roadEditId){
    const closest=roadNodes.map((p,i)=>({i,d:Math.hypot(hit.x-p[0],hit.z-p[1])})).sort((a,b)=>a.d-b.d)[0];
    if(closest?.d<3){roadDragIndex=closest.i;canvas.setPointerCapture?.(e.pointerId);activePointer=e.pointerId;return;}
   }
   if(e.detail<2)addRoadNode(hit);
   return;
  }
  if(e.button===1||e.button===2){
   e.preventDefault();cameraPan={pointerId:e.pointerId,x:e.clientX,y:e.clientY,action:P539_PREVIEW&&e.button===2?'look':'pan'};
   canvas.setPointerCapture?.(e.pointerId);return;
  }
  if(!e.isPrimary||e.button!==0)return;
  if(P542_PREVIEW&&mode!=='road'&&!(mode==='place'&&chosen?.startsWith('floor-')&&e.detail<2)){
   const picked=clickPlaced(e);
   if(picked&&!(mode==='move'&&picked===selected)){
    e.preventDefault();downPos=null;selectObject(picked);
    status('✓ Seleccionado con un clic. Usá Mover, Girar, Escala o Borrar sin activar Selección.');return;
   }
  }
  downPos={x:e.clientX,y:e.clientY};
  if(mode==='place'&&chosen){
   e.preventDefault();
   canvas.setPointerCapture?.(e.pointerId);
   activePointer=e.pointerId;
   const hit=hitTerrain(e);
   if(!hit)return;
   const floor=chosen.startsWith('floor-')&&!isModularCobbleType(chosen);
   recordSnapshot();
   if(floor){dragPainting=true;lastPaint=hit;paintLine(hit,hit);}
   else{pendingDrop=hit;previewGhost(e);status('Mové el dedo para ubicar la casa y soltá para colocarla.');}
  }else if(mode==='move'&&selected&&!gizmo?.dragging&&clickPlaced(e)===selected){
   // Directly grab the complete model, just like Age of Empires object placement.
   const data=records.find(o=>o.id===selected),root=viewCache.get(selected);
   if(data&&root){
    e.preventDefault();activePointer=e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    movingExisting={id:selected,old:{...data}};
    gizmo?.detach();
    status('Arrastrá '+BY_ID.get(data.type).label+' por el terreno y soltá para confirmar.');
   }
  }else if(mode==='select'&&e.isPrimary){const id=clickPlaced(e);if(id)selectObject(id);}
 });
 canvas.addEventListener('pointermove',e=>{
  if(mode==='road'){
   const h=hitTerrain(e);
   if(h){
    if(roadDragIndex>=0&&activePointer===e.pointerId){
     roadNodes[roadDragIndex]=[snap(h.x,.5),snap(h.z,.5)];drawRoadPreview(true);
    }else{roadHover=[h.x,h.z];drawRoadPreview();}
    $('coords').textContent='X '+h.x.toFixed(1)+' · Z '+h.z.toFixed(1)+' · ancho '+ROAD_WIDTHS[brushCells-1]+' m';
   }
   if(roadDragIndex>=0)return;
  }
  if(cameraPan&&cameraPan.pointerId===e.pointerId){
   const dx=e.clientX-cameraPan.x,dy=e.clientY-cameraPan.y;
   cameraPan.x=e.clientX;cameraPan.y=e.clientY;
   if(cameraPan.action==='look'){
    const vec=cam.position.clone().sub(orbit.target);
    const spherical=new THREE.Spherical().setFromVector3(vec);
    spherical.theta-=dx*.007;spherical.phi=clamp(spherical.phi-dy*.006,.12,Math.PI/2-.025);
    cam.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(spherical));
    orbit.update();render();return;
   }
   const dist=Math.max(30,cam.position.distanceTo(orbit.target)),unit=dist*.0018;
   const right=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,0);
   const forward=new THREE.Vector3();forward.subVectors(orbit.target,cam.position);
   right.y=0;forward.y=0;right.normalize();forward.normalize();
   const move=right.multiplyScalar(-dx*unit).addScaledVector(forward,dy*unit);
   cam.position.add(move);orbit.target.add(move);orbit.update();updateNear();updateTrees();render();return;
  }
  if(mode==='place')previewGhost(e);
  if(movingExisting&&mode==='move'&&activePointer===e.pointerId){
   const hit=hitTerrain(e),root=viewCache.get(movingExisting.id),saved=movingExisting.old;
   if(hit&&root){
    const nx=snap(hit.x,1),nz=snap(hit.z,1),
      safety=validPosition({...saved,x:nx,z:nz},saved.id);
    root.position.set(nx,(safety.ok?safety.y:elevation(nx,nz))+.035,nz);
    status(safety.ok?'✓ Soltá para ubicar '+BY_ID.get(saved.type).label+' en X '+nx+' Z '+nz:
      'Posición bloqueada: '+safety.why);
    render();
   }
  }
  if(mode==='place'&&activePointer===e.pointerId){
   const h=hitTerrain(e);
   if(dragPainting&&lastPaint&&h){paintLine(lastPaint,h);lastPaint=h;}
   if(pendingDrop&&h)pendingDrop=h;
  }
  const hit=hitTerrain(e);if(hit)$('coords').textContent='X '+hit.x.toFixed(1)+' · Z '+hit.z.toFixed(1)+' · Suelo '+hit.y.toFixed(1)+' m';
 });
 canvas.addEventListener('pointerup',e=>{
  if(mode==='road'&&roadDragIndex>=0&&activePointer===e.pointerId){
   roadDragIndex=-1;activePointer=null;canvas.releasePointerCapture?.(e.pointerId);drawRoadPreview(true);return;
  }
  if(mode==='road'&&e.button===0)return;
  if(cameraPan&&cameraPan.pointerId===e.pointerId){
   cameraPan=null;if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);
   return;
  }
  if(movingExisting&&mode==='move'&&activePointer===e.pointerId){
   const item=records.find(x=>x.id===movingExisting.id),root=viewCache.get(movingExisting.id),old=movingExisting.old;
   if(item&&root){
    const candidate={...old,x:snap(root.position.x,1),z:snap(root.position.z,1)};
    const safety=validPosition(candidate,item.id);
    if(safety.ok){
     if(candidate.x!==old.x||candidate.z!==old.z){
      recordSnapshot();Object.assign(item,candidate,{y:safety.y});save();
      updateTrees(true);
     }
     root.position.set(item.x,safety.y+.035,item.z);
     status('✓ '+BY_ID.get(item.type).label+' colocado en X '+item.x+' Z '+item.z);
    }else{
     root.position.set(old.x,old.y+.035,old.z);
     status('No se movió: '+safety.why);
    }
    if(P542_PREVIEW&&safety.ok){
     const id=item.id;
     rebuildPlaced().then(()=>{if(viewCache.has(id))selectObject(id);});
    }else{gizmo?.attach(root);showProps();render();}
   }
   if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);
   movingExisting=null;activePointer=null;downPos=null;return;
  }
  if(mode==='place'&&activePointer===e.pointerId){
   if(pendingDrop){
    const h=hitTerrain(e)||pendingDrop;
    if(!addAt(h.x,h.z))history.pop();
    pendingDrop=null;
   }
   save();
   if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);
   activePointer=null;dragPainting=false;lastPaint=null;
  }else if((mode==='orbit'||P542_PREVIEW&&['move','rotate','scale','select'].includes(mode))&&downPos&&Math.hypot(e.clientX-downPos.x,e.clientY-downPos.y)<9){
   // Optional direct selection by single tap, without switching camera mode first.
   const id=clickPlaced(e);if(id)selectObject(id);
  }
  downPos=null;
 });
 canvas.addEventListener('pointercancel',e=>{
  if(mode==='road'&&roadDragIndex>=0){
   roadDragIndex=-1;activePointer=null;drawRoadPreview(true);return;
  }
  if(cameraPan&&cameraPan.pointerId===e.pointerId)cameraPan=null;
  if(movingExisting&&activePointer===e.pointerId){
   const root=viewCache.get(movingExisting.id),old=movingExisting.old;
   if(root){root.position.set(old.x,old.y+.035,old.z);gizmo?.attach(root);render();}
   movingExisting=null;
  }
  if(activePointer===e.pointerId){
   activePointer=null;pendingDrop=null;dragPainting=false;lastPaint=null;
   if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);
   save();
  }
  downPos=null;
 });
}
function installGizmo(){
 gizmo=new TransformControls(cam,renderer.domElement);scene.add(gizmo.getHelper());
 gizmo.setTranslationSnap(1);gizmo.setRotationSnap(Math.PI/12);gizmo.setScaleSnap(.1);
 let before=null;
 gizmo.addEventListener('dragging-changed',ev=>{
  orbit.enabled=!ev.value;
  if(ev.value){before=JSON.stringify(records);return;}
  const o=records.find(x=>x.id===selected),root=viewCache.get(selected);if(!o||!root)return;
  const old={...o};o.x=snap(root.position.x,1);o.z=snap(root.position.z,1);
  o.yaw=isModularCobble(o)?Math.round(root.rotation.y/(Math.PI/2))*(Math.PI/2):root.rotation.y;o.scale=isModularCobble(o)?1:mode==='scale'?clamp(Math.round(old.scale*Math.max(.2,(root.scale.x+root.scale.z)*.5)*100)/100,.5,3):old.scale;
  const check=validPosition(o,o.id);
  if(!check.ok){Object.assign(o,old);root.position.set(old.x,old.y,old.z);root.rotation.y=old.yaw;root.scale.setScalar(1);status('Ubicación bloqueada: '+check.why);}
  else{o.y=check.y;root.position.y=o.y+.035;if(before&&before!==JSON.stringify(records)){history.push(before);redoStack=[];save();}}
  if(mode==='scale')rebuildPlaced();else if(mode==='move')updateTrees(true);
  showProps();render();
 });
 gizmo.addEventListener('objectChange',()=>{
  const obj=viewCache.get(selected);if(obj&&mode==='move'){
   const o=records.find(x=>x.id===selected);
   if(o){const g=validPosition({...o,x:obj.position.x,z:obj.position.z},o.id);
    obj.position.y=(g.ok?g.y:elevation(obj.position.x,obj.position.z))+.035;}
  }
  render();
 });
}
orbit.addEventListener('change',()=>{
 updateNear();updateTrees();nativeGrass?.update(orbit.target.x,orbit.target.z);render();
 $('metrics').textContent=records.length+' piezas propias · cámara '+Math.round(cam.position.distanceTo(orbit.target))+' m';
 try{localStorage.setItem(VIEW,JSON.stringify({x:orbit.target.x,z:orbit.target.z}));}catch{}
});
async function boot(){
 try{
  logData.phase='datos reales y geometría 3D';drawCats();bindUI();installGizmo();fit();restore();
  status('Cargando alturas originales de Unsung sin iniciar el RPG…');
  await loadHeights();if(P537_PREVIEW)syncGradePlans();await drawTerrain();
  focus(movedPivot.x,movedPivot.z);updateNear();
  const data=await fetch(url('native-overview.json'));if(!data.ok)throw Error('Mapa original: HTTP '+data.status);
  overview=await data.json();
  if(P536_PREVIEW){
   try{
    nativeVisuals=nativeEditorTerrainMaterial(renderer,overview,{qualityHigh});
    const old=[geo.region.material,geo.core.material,geo.near.material],textures=new Set(old.map(m=>m.map).filter(Boolean));
    for(const part of [geo.region,geo.core,geo.near])part.material=nativeVisuals.material;
    old.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
    nativeWater=await nativeEditorStaticDepthWater(map.meta,url);
    log('Terreno original Unsung · TEXTURAS REALES','9 capas PBR del TextureForge MIT, caminos de tierra del mapa original; sin texturas cartográficas');
    log('Agua estática con PROFUNDIDAD','alturas originales de Unsung; turquesa en orilla, azul profundo en lago · sin olas ni reflejos');
   }catch(err){log('Texturas nativas',err.message,false);}
  }
  const img=await loadPicture('native-architecture-core.png'),c=document.createElement('canvas');c.width=c.height=2048;
  const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(img,0,0);architectPixel=cx.getImageData(0,0,2048,2048).data;
  originalRender();
  if(P536_PREVIEW){
   try{
    nativeGrass=nativeEditorOriginalGrass({scene,elevation:gradedElevation,overview,pathPixels:nativeVisuals?.pathPixels??new Uint8Array(1024*1024),qualityHigh:()=>qualityHigh,records:()=>records});
    nativeGrass.update(orbit.target.x,orbit.target.z,true);
    nativeLeaves=nativeEditorOriginalLeaves(renderer,groups.trees,{qualityHigh});
    log('Pasto, árboles y flores originales','briznas 3D de Unsung por instancias + hojas reales del atlas MIT en las cinco especies');
   }catch(err){log('Vegetación nativa',err.message,false);}
  }
  await rebuildPlaced();switchMode('orbit');render();
  status('✓ TERRRENO ORIGINAL 3D + agua + árboles. Cargando arquitectura exacta de Unsung…');
  await loadOriginalGeometry();
  // An actual edited starting village must exist when the P529 preview first opens.
  // Avoid seeding during headless legacy tests and NEVER overwrite a saved layout.
  const firstP529=P529_PREVIEW&&!new URLSearchParams(location.search).has('hfqa')&&
   localStorage.getItem(STORE)===null;
  if(firstP529)await loadBeginningVillage({auto:true});
  if(P538_PREVIEW&&!P541_PREVIEW&&!new URLSearchParams(location.search).has('hfqa'))await loadEastbrookLand({auto:true});
  logData.phase='listo';log('Editor 3D autónomo','sin combate ni simulación; colocaciones JSON idénticas a la vista 2D');
  status(P542_PREVIEW?'✓ WORLD FORGE 5.0 · P5.4.2 · TERRENO ORIGINAL INTACTO: edificios con soportes adaptables, pisos y tierra/pasto que siguen las curvas, clic directo selecciona.':P541_PREVIEW?'✓ WORLD FORGE 4.9 · P5.4.1 MANUAL · mundo original de Unsung; nada se genera solo. Pendiente AUTO: SÍ, edificaciones adaptadas al terreno, WASD/flechas y cámara mouse. Guardado nuevo aislado.':P539_PREVIEW?'✓ WORLD FORGE 4.7 · P5.3.9 · Arvelia con herrería CC0 sustituta, pendiente adaptable, WASD/flechas, mouse cámara.':P538_PREVIEW?'✓ WORLD FORGE 4.6 · P5.3.8 · Arvelia terrestre importable con NPC y misiones HIGHFLY; P5.3.7 intacta.':P537_PREVIEW?'✓ WORLD FORGE 4.5 · P5.3.7 · edificios asentados en terreno Unsung, explanadas de tierra suave sin losas flotantes, adoquines modulares y agua estática.':P536_PREVIEW?'✓ WORLD FORGE 4.4 · P5.3.6 · materiales nativos Unsung, caminos originales de tierra, pasto 3D, hojas reales y agua estática con profundidad. Curvas modulares girables de 4 y 8 metros.':'✓ WORLD FORGE 4.3 · P5.3.2+P5.3.3 · mapa Unsung auténtico, 221 KayKit FREE, 42 Quaternius, caminos curvos y bordillos continuos.');
 }catch(err){
  logData.phase='fallo';log('INICIO 3D',err.stack?.slice(0,250)||String(err),false);
  status('Fallo 3D. Abrí 🩺 Diagnóstico; el editor 2D original continúa disponible.');
 }
}
// Test-only viewport inspection; available only with explicit ?hfqa query.
if(new URLSearchParams(location.search).has('hfqa')){
 window.__hfWorldForge3DQA={
  focus,
  validPosition,
  eastbrookPlan:()=>buildEastbrookLand({canPlace:o=>validPosition(o),existing:records,sizeOf:t=>{const a=BY_ID.get(t);return a?[a.w,a.d]:null;},blockedAt:(x,z,r)=>treeNear(x,z,r)||archNear(x,z,r)}),
  point(x,z){
   const world=new THREE.Vector3(x,elevation(x,z)+1,z);
   const ndc=world.project(cam),r=renderer.domElement.getBoundingClientRect();
   return {x:r.left+(ndc.x+1)*r.width*.5,y:r.top+(1-ndc.y)*r.height*.5,visible:ndc.z<1&&ndc.z>-1};
  },
  objects(){return records.map(x=>({...x}));},
  chooseForQA:selectAsset,
  placeForQA:addAt,
  savedJSON:()=>localStorage.getItem(STORE),
  roadStart:startRoadDraft,roadAdd:(x,z)=>addRoadNode({x,z}),
  roadFinish:finishRoadDraft,roadCancel:cancelRoadDraft,
  roadDraft(){return {mode,nodes:roadNodes.map(a=>[...a]),editing:roadEditId};},
  select(id){const o=records.find(x=>x.id===id);if(o)selectObject(id);return !!o;},
  copy:copySelected,paste:pasteCopied,
  clipboard(){return objectClipboard?{...objectClipboard}:null;},
  placement(){return {mode,chosen,pendingYaw,pendingScale,adaptSlope};},
  camera(){return {x:cam.position.x,y:cam.position.y,z:cam.position.z,targetX:orbit.target.x,targetZ:orbit.target.z};},
  ready(id){return prefabReady.has(id);},
  error(id){return prefabFailed.get(id)||null;},
  inspect(id){
   const root=viewCache.get(id);if(!root)return null;
   let meshes=0,foundation=0,faces=0;
   root.traverse(o=>{if(o.isMesh){meshes++;if(o.userData.foundation)foundation++;faces+=o.geometry?.index?.count||0;}});
   return {meshes,foundation,faces,children:root.children.length,y:root.position.y,position:{x:root.position.x,z:root.position.z}};
  }
 };
}
boot();