/**
 * HIGHFLY WORLD FORGE 4.4 · reusable square-grid cobblestone bend kit.
 * 4m CLOSED bend / 8m OPEN bend (both 90 degrees; rotate 0/90/180/270).
 * Based only on authored HIGHFLY stone material and original Unsung ground.
 * Both WORLD FORGE and the actual RPG construct identical geometry.
 * No SOURCE/private assets and no dependency on browser-editor state.
 */
import * as THREE from 'three';
import {cobbleMaterials} from './p533-curved-road-3d.mjs';
export const MODULAR_BEND_TIGHT='floor-stone-curve-tight';
export const MODULAR_BEND_WIDE='floor-stone-curve-wide';
const KIT=[
 {id:MODULAR_BEND_TIGHT,label:'Adoquín · curva CERRADA (4 m)',icon:'↪',cat:'Pisos',kind:'floor',w:4,d:4,size:4,radius:2,roadWidth:3.35,sub:'Curva de 90° para esquinas pequeñas · gira 90° con Q/R. Pieza independiente.'},
 {id:MODULAR_BEND_WIDE,label:'Adoquín · curva ABIERTA (8 m)',icon:'⤴',cat:'Pisos',kind:'floor',w:8,d:8,size:8,radius:4,roadWidth:3.6,sub:'Curva suave de 90° con radio doble · encastra con el tramo recto. Gira 90° con Q/R.'}
];
export const MODULAR_COBBLE_TILES=Object.freeze(KIT.map(a=>Object.freeze({...a,license:'MIT · HIGHFLY original, sin SOURCE'})));
export const MODULAR_COBBLE_BY_ID=new Map(MODULAR_COBBLE_TILES.map(a=>[a.id,a]));
export const isModularCobbleType=type=>MODULAR_COBBLE_BY_ID.has(type);
export const isModularCobble=o=>!!o&&isModularCobbleType(o.type);
export function squareGridSnap(x,step=4){return Math.round(x/step)*step;}
export function bendPoint(type,t){
 const a=MODULAR_COBBLE_BY_ID.get(type);if(!a)throw Error('Tipo modular no admitido: '+type);
 const ang=Math.PI-t*Math.PI*.5,rad=a.radius;
 return {x:rad+Math.cos(ang)*rad,z:-rad+Math.sin(ang)*rad,
  nx:Math.cos(ang),nz:Math.sin(ang),s:t*Math.PI*.5*rad};
}
export function modTileWorldXZ(o,lx,lz){
 const yaw=o.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:o.x+lx*c-lz*s,z:o.z+lx*s+lz*c};
}
export function cobbleBendClearance(x,z,o,pad=.35){
 const a=MODULAR_COBBLE_BY_ID.get(o?.type);if(!a)return false;
 const yaw=o.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw),dx=x-o.x,dz=z-o.z,
  localX=dx*c+dz*s,localZ=-dx*s+dz*c;
 // The two endpoint caps are full road-width, not an entire cleared square.
 const centerX=a.radius,centerZ=-a.radius;
 const qx=localX-centerX,qz=localZ-centerZ,ang=Math.atan2(qz,qx);
 if(ang<Math.PI/2||ang>Math.PI)return false;
 return Math.abs(Math.hypot(qx,qz)-a.radius)<=a.roadWidth*.5+pad;
}
function bendStrip(spec,o,sampler,anchorY,minR,maxR,raise,step=36){
 const pos=[],uv=[],ind=[];
 for(let i=0;i<=step;i++){
  const t=i/step,p=bendPoint(o.type,t);
  for(const lateral of [minR,maxR]){
   const lx=p.x+p.nx*lateral,lz=p.z+p.nz*lateral,
    w=modTileWorldXZ(o,lx,lz),gy=sampler(w.x,w.z);
   pos.push(lx,Number.isFinite(gy)?gy-anchorY+raise:raise,lz);
   uv.push((p.s/2.8),(lateral/2.8));
  }
  if(i>0){const a=(i-1)*2,b=i*2;ind.push(a,b,a+1,b,b+1,a+1);}
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geometry.setIndex(ind);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 return geometry;
}
export function makeModularCobbleTile3D(o,heightAt,{anchorY=0}={}){
 const spec=MODULAR_COBBLE_BY_ID.get(o?.type);
 if(!spec||typeof heightAt!=='function')throw Error('Pieza modular o muestreador inexistente');
 if(!Number.isFinite(o.x)||!Number.isFinite(o.z)||!Number.isFinite(o.yaw)||!Number.isFinite(o.scale)||o.scale!==1)
  throw Error('La curva modular debe mantenerse a escala 1 para encastrar');
 const {paving,rim,rimOuter}=cobbleMaterials(),group=new THREE.Group();
 group.name='HIGHFLY_MODULAR_STONE_'+o.type;
 // The 4m-wide lane is divided into three concentric bands, retaining the
 // same high-frequency original HIGHFLY stone texture as 5.3.3 curved paths.
 const half=spec.roadWidth*.5;
 const bands=[
  [-half,half,.125,paving,'adoquin curvo real'],
  [-half-.20,-half+.12,.17,rim,'borde interior'],
  [half-.12,half+.20,.17,rim,'borde exterior'],
  [-half-.29,-half-.16,.11,rimOuter,'perfil interior'],
  [half+.16,half+.29,.11,rimOuter,'perfil exterior']
 ];
 for(const [a,b,y,mat,name] of bands){
  const mesh=new THREE.Mesh(bendStrip(spec,o,heightAt,anchorY,a,b,y),mat);
  mesh.name=name;mesh.receiveShadow=true;mesh.frustumCulled=true;
  mesh.userData.modularStone=true;group.add(mesh);
 }
 group.userData.tileType=o.type;group.userData.license='HIGHFLY MIT';
 return group;
}
export function disposeModularCobbleGeometry(node){
 node?.traverse?.(o=>{if(o.isMesh&&o.userData.modularStone)o.geometry.dispose();});
}
