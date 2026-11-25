/**
 * HIGHFLY P5.1.5 — Arvelia / Eastbrook is authored WORLD CONTENT.
 * Built on the last approved P5.1.4 game: NO World Forge, JSON, storage or opt-in.
 * Original Unsung ground/architecture are retained. ClaudeCraft MIT civic roles
 * adapted to verified KayKit Medieval Hexagon FREE CC0 buildings; guild is Unsung MIT.
 * Positions are the 11 native-heightfield-approved P5.3.4 pilot lots.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshBuilder,M} from '../world/arch/builder.js';
import * as NativeKit from '../world/arch/kit.js';
import * as NativeArch from '../world/arch/builder.js';
import {buildUnsungOriginal} from './p530-unsung-original.mjs';
import {makeCurvedCobblestone3D} from './p533-curved-road-3d.mjs';
import {CURVED_ROAD_TYPE,sampleCurvedRoad} from './p533-curved-road-path.mjs';

const d=Math.PI/180;
// Independent, static, authored scene. NO browser editor and NO localStorage.
export const EASTBROOK_CIVIC=Object.freeze([
 {role:'banco',type:'home_B',x:-656,z:-84,yaw:225*d,w:10,depth:9,scale:1.3},
 {role:'herreria',type:'blacksmith',x:-598,z:-42,yaw:20*d,w:12,depth:12,scale:1.25},
 {role:'taberna',type:'tavern',x:-618,z:-26,yaw:24*d,w:13,depth:12,scale:1.3},
 {role:'capilla',type:'church',x:-566,z:-74,yaw:125*d,w:13,depth:13,scale:1.25},
 {role:'botica',type:'home_A',x:-624,z:-94,yaw:175*d,w:10,depth:9,scale:1.3},
 {role:'casa_muelle',type:'home_B',x:-654,z:-18,yaw:46*d,w:10,depth:9,scale:1.25},
 {role:'gremio_highfly',type:'unsung-hall',x:-556,z:-38,yaw:180*d,w:25,depth:15,scale:1},
 {role:'mercado_highfly',type:'market',x:-604,z:-60,yaw:0,w:13,depth:11,scale:1},
 {role:'vivienda_1',type:'home_A',x:-562,z:-18,yaw:23*d,w:10,depth:9,scale:1.1},
 {role:'vivienda_2',type:'home_A',x:-676,z:-44,yaw:-29*d,w:10,depth:9,scale:1.1},
 {role:'torre_entrada',type:'unsung-tower',x:-542,z:-114,yaw:0,w:9,depth:9,scale:.85}
]);
export const EASTBROOK_STREETS=Object.freeze([
 // Civic plaza and curved lanes deliberately bridge the original Dawn plaza
 // while routing around the original hall and KayKit building footprints.
 {name:'Paseo de los Inicios',width:8,points:[[-608,-82],[-596,-101],[-572,-108],[-551,-98],[-532,-85],[-516,-79]]},
 {name:'Camino del Mercado',width:7,points:[[-682,-67],[-662,-67],[-645,-66],[-627,-64],[-611,-65],[-584,-64]]},
 {name:'Calle de la Herreria',width:5,points:[[-608,-65],[-604,-54],[-599,-48],[-596,-35]]},
 {name:'Calle de la Taberna',width:5,points:[[-626,-60],[-626,-48],[-622,-37],[-618,-30]]},
 {name:'Calle del Gremio',width:6,points:[[-594,-63],[-583,-56],[-569,-48],[-556,-45]]},
 {name:'Paseo de las Viviendas',width:5,points:[[-666,-63],[-665,-48],[-655,-35],[-649,-25]]},
 {name:'Acceso a la Capilla',width:5,points:[[-588,-81],[-575,-83],[-562,-83],[-552,-78]]}
]);

const finite=Number.isFinite;
const cityBounds={minX:-713,maxX:-497,minZ:-146,maxZ:10};
const inside=(x,z,o,pad=1.3)=>{
 const c=Math.cos(o.yaw),s=Math.sin(o.yaw),dx=x-o.x,dz=z-o.z;
 return Math.abs(dx*c+dz*s)<o.w*o.scale*.5+pad &&
        Math.abs(-dx*s+dz*c)<o.depth*o.scale*.5+pad;
};
export function p515EastbrookTreeClearing(x,z){
 return x>cityBounds.minX&&x<cityBounds.maxX&&z>cityBounds.minZ&&z<cityBounds.maxZ &&
  EASTBROOK_CIVIC.some(o=>inside(x,z,o,2.6));
}
function lotFootprint(world,o){
 const c=Math.cos(o.yaw),s=Math.sin(o.yaw),w=o.w*o.scale,h=o.depth*o.scale,heights=[];
 for(const [dx,dz] of [[0,0],[-w/2,-h/2],[w/2,-h/2],[-w/2,h/2],[w/2,h/2]]){
  const x=o.x+dx*c-dz*s,z=o.z+dx*s+dz*c;
  const ground=world.groundHeight(x,z),water=world.waterLevel?.(x,z);
  if(!finite(ground)||ground<-.1||(finite(water)&&water>=ground-.1))return null;
  heights.push(ground);
 }
 const top=Math.max(...heights),slope=top-Math.min(...heights);
 if(slope>Math.min(5.2,1.75+o.scale*1.5))return null;
 // Preserve the playable original masonry. P534 accepted these exact lots.
 for(const [dx,dz] of [[0,0],[-w*.3,-h*.3],[w*.3,-h*.3]]){
  const x=o.x+dx,z=o.z+dz,solid=world.floorBelow?.(x,top+20,z,40);
  if(finite(solid)&&solid>world.groundHeight(x,z)+.75)return null;
 }
 return {y:top,slope,w,h};
}
function roadFloor(world,x,z){
 const g=world.groundHeight(x,z);
 const f=world.floorBelow?.(x,g+65,z,65);
 return finite(f)?Math.max(g,f):g;
}
function roadDefinition(street,i){
 return {type:CURVED_ROAD_TYPE,id:'p515-street-'+i,width:street.width,
  x:street.points[0][0],z:street.points[0][1],points:street.points};
}
function addCivicPlaza(scene,world){
 // One conforming oval cobblestone surface (no floating flat plane).
 const cx=-608,cz=-64,rx=13,rz=10,n=48,rings=8,xyz=[],uv=[],idx=[];
 const centerY=roadFloor(world,cx,cz);
 xyz.push(cx,centerY+.118,cz);uv.push(.5,.5);
 for(let k=1;k<=rings;k++)for(let j=0;j<n;j++){
  const a=j*2*Math.PI/n,r=k/rings,x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r;
  xyz.push(x,roadFloor(world,x,z)+.118,z);
  uv.push((x-cx)/2.8,(z-cz)/2.8);
 }
 for(let j=0;j<n;j++)idx.push(0,1+j,1+(j+1)%n);
 for(let k=1;k<rings;k++)for(let j=0;j<n;j++){
  const a=1+(k-1)*n+j,b=1+(k-1)*n+(j+1)%n,
   c=1+k*n+j,e=1+k*n+(j+1)%n;
  idx.push(a,c,b,b,c,e);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geometry.setIndex(idx);geometry.computeVertexNormals();
 const mat=new THREE.MeshLambertMaterial({color:0xa9a49a,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
 const mesh=new THREE.Mesh(geometry,mat);
 mesh.name='HIGHFLY_P515_CIVIC_STONE_PLAZA';scene.add(mesh);return mesh;
}
function makeGrassMask(){
 // R8, one upload for the entire native 2048x2048m core, never a per-frame test.
 const n=1024,mask=new Uint8Array(n*n),step=2,roads=EASTBROOK_STREETS.map((s,i)=>({o:roadDefinition(s,i),pts:sampleCurvedRoad(s.points,1.4)}));
 for(let iz=0;iz<n;iz++){
  const z=(iz+.5)*step-1024;if(z<cityBounds.minZ||z>cityBounds.maxZ)continue;
  for(let ix=0;ix<n;ix++){
   const x=(ix+.5)*step-1024;if(x<cityBounds.minX||x>cityBounds.maxX)continue;
   let cover=EASTBROOK_CIVIC.some(o=>inside(x,z,o,.5))||((x+608)**2/(14*14)+(z+64)**2/(11*11)<1);
   if(!cover)for(const {o,pts} of roads){
    if(Math.hypot(x-o.x,z-o.z)>250)continue;
    for(let k=1;k<pts.length;k++){
     const a=pts[k-1],b=pts[k],dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
     const t=den>0?Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/den)):0;
     if(Math.hypot(x-a.x-dx*t,z-a.z-dz*t)<o.width/2+.65){cover=true;break;}
    }
    if(cover)break;
   }
   if(cover)mask[iz*n+ix]=255;
  }
 }
 const t=new THREE.DataTexture(mask,n,n,THREE.RedFormat,THREE.UnsignedByteType);
 t.minFilter=t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;
}
function nativeBuilding(b,o,fp){
 // EXACT original procedurally authored Unsung hall/tower, no stand-in blocks.
 const tmp=new MeshBuilder();buildUnsungOriginal(o.type,tmp,{kit:NativeKit,arch:NativeArch});
 let minX=Infinity,maxX=-Infinity,minY=Infinity,minZ=Infinity,maxZ=-Infinity;
 for(let i=0;i<tmp.pos.length;i+=3){
  const a=tmp.pos;minX=Math.min(minX,a[i]);maxX=Math.max(maxX,a[i]);
  minY=Math.min(minY,a[i+1]);minZ=Math.min(minZ,a[i+2]);maxZ=Math.max(maxZ,a[i+2]);
 }
 const k=Math.min(o.w/Math.max(.01,maxX-minX),o.depth/Math.max(.01,maxZ-minZ))*o.scale;
 b.at(o.x,fp.y+.065,o.z,o.yaw,q=>{
  q.push().scale(k,k,k).translate(-(maxX+minX)/2,-minY,-(maxZ+minZ)/2);
  buildUnsungOriginal(o.type,q,{kit:NativeKit,arch:NativeArch});q.pop();
 });
}
function addDecor(b,world){
 const lamps=[[-636,-62],[-638,-86],[-583,-99],[-576,-58],[-538,-83],[-611,-15],[-665,-64],[-588,-36]];
 const position=(x,z)=>({x,z,y:roadFloor(world,x,z)});
 for(const [x,z] of lamps){
  const p=position(x,z);if(!finite(p.y))continue;
  b.at(x,p.y+.1,z,0,q=>NativeKit.lantern(q,3.1));
 }
 for(const [x,z,yaw] of [[-622,-68,0],[-594,-79,Math.PI],[-565,-50,Math.PI/2]]){
  const p=position(x,z);if(!finite(p.y))continue;
  b.at(x,p.y+.1,z,yaw,q=>NativeKit.bench(q,2.7));
 }
}
export function installP515Eastbrook(game){
 if(game?.__hfP515Eastbrook)return game.__hfP515Eastbrook;
 if(!game?.world||!game?.arch||!game?.pipe?.scene)return null;
 const world=game.world,scene=game.pipe.scene;
 const installed=[],skipped=[],foundations=new MeshBuilder();
 const lots=EASTBROOK_CIVIC.map(o=>({o,fp:lotFootprint(world,o)}));
 for(const {o,fp} of lots){
  if(!fp){skipped.push(o.role);console.warn('[P515 EASTBROOK] Unsafe lot',o.role);continue;}
  if(o.type.startsWith('unsung-')){nativeBuilding(foundations,o,fp);continue;}
  if(fp.slope>.35)foundations.at(o.x,fp.y+.06,o.z,o.yaw,q=>{
   const h=Math.max(.16,fp.slope+.26);
   q.mat_(M.ASHLAR).box(-fp.w*.485,-h,-fp.h*.485,fp.w*.97,h,fp.h*.97);
  });
 }
 addDecor(foundations,world);
 if(foundations.triCount){
  const mesh=game.arch.add(foundations,{near:false});
  mesh.name='HIGHFLY_P515_NATIVE_UNSUNG_GUILD_AND_DECOR';
  mesh.updateMatrixWorld(true);world.addGeometry(mesh.geometry);installed.push(mesh);
 }
 // A single cobbled civic floor; all other streets use continuous curved ribbons.
 installed.push(addCivicPlaza(scene,world));
 for(let i=0;i<EASTBROOK_STREETS.length;i++){
  const road=roadDefinition(EASTBROOK_STREETS[i],i);
  try{
   const mesh=makeCurvedCobblestone3D(road,(x,z)=>roadFloor(world,x,z));
   mesh.name='HIGHFLY_P515_STONE_ROAD_'+i;scene.add(mesh);installed.push(mesh);
  }catch(e){skipped.push('road_'+i);console.warn('[P515 ROAD]',i,e);}
 }
 const cover=globalThis.__parts?.cover;
 let mask=null;
 if(cover?.grassMat?.uniforms?.uHighflyCityMask&&cover?.flowerMat?.uniforms?.uHighflyCityMask){
  mask=makeGrassMask();
  cover.grassMat.uniforms.uHighflyCityMask.value=mask;
  cover.flowerMat.uniforms.uHighflyCityMask.value=mask;
 }
 const loader=new GLTFLoader(),modelCache=new Map(),loaded=[],errors=[];
 const getModel=name=>{
  if(!modelCache.has(name))modelCache.set(name,loader.loadAsync(import.meta.env.BASE_URL+
    'highfly/kaykit-free/building_'+name+'_red.gltf'));
  return modelCache.get(name);
 };
 const readyPromise=Promise.allSettled(lots.filter(({o,fp})=>fp&&!o.type.startsWith('unsung-'))
 .map(async({o,fp})=>{
  const gltf=await getModel(o.type),model=gltf.scene.clone(true);
  const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  if(size.x<.01||size.z<.01)throw Error('Empty KayKit model '+o.type);
  const k=Math.min(fp.w/size.x,fp.h/size.z);
  const root=new THREE.Group();root.name='HIGHFLY_P515_EASTBROOK_'+o.role;
  root.position.set(o.x,fp.y+.03,o.z);root.rotation.y=o.yaw;
  model.scale.setScalar(k);model.position.set(-center.x*k,-box.min.y*k,-center.z*k);
  model.traverse(node=>{
   if(!node.isMesh)return;
   const old=Array.isArray(node.material)?node.material[0]:node.material;
   node.material=new THREE.MeshBasicMaterial({map:old?.map??null,color:0xfff5e7,side:THREE.FrontSide});
   node.frustumCulled=true;
  });
  root.add(model);scene.add(root);root.updateMatrixWorld(true);
  let count=0;
  model.traverse(node=>{
   if(!node.isMesh||!node.geometry?.attributes?.position)return;
   const geo=node.geometry.clone().applyMatrix4(node.matrixWorld);
   if(geo.index?.count>120000)return;
   world.addLazy(o.x,o.z,Math.max(fp.w,fp.h)*.75,()=>geo);
   count++;
  });
  loaded.push({role:o.role,type:o.type,x:o.x,z:o.z,colliders:count});
  installed.push(root);
 })).then(results=>{
  results.forEach((v,i)=>{if(v.status==='rejected')errors.push(String(v.reason));});
  console.info('[P515 EASTBROOK BUILT]',loaded.length,'authentic KayKit CC0 buildings,',
    '2 Unsung MIT landmarks,',installed.length,'world meshes,',errors.length,'errors,',skipped.length,'unsafe parcels');
  return {loaded,errors,skipped};
 });
 const api={version:'P5.1.5',from:'P5.1.4',town:'Arvelia / Eastbrook',source:'KayKit FREE CC0 + Unsung MIT',
  placed:lots.filter(q=>q.fp).length,loaded,skipped,errors,roads:EASTBROOK_STREETS.length,
  readyPromise,meshes:installed,cityMask:mask};
 game.__hfP515Eastbrook=api;globalThis.__hfP515Eastbrook=api;
 return api;
}
