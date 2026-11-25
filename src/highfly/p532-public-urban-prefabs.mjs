/** P532 original HIGHFLY CC0-compatible standalone public urban decorations.
 * Not passed off as Unsung or Quaternius; pure runtime Three.js procedural geometry.
 * No paid assets, no texture downloads, no per-frame animation.
 */
import * as THREE from 'three';
import {PUBLIC_URBAN_ASSETS,PUBLIC_URBAN_IDS} from './p532-public-urban-assets.mjs';
export {PUBLIC_URBAN_ASSETS,PUBLIC_URBAN_IDS};
const mat=(color,emissive=0)=>new THREE.MeshLambertMaterial({color,emissive});
const STONE=mat(0xa7a8af),RIM=mat(0xc4c5bb),STONE_DARK=mat(0x797987),
 BRONZE=mat(0x72532f),BRIGHT=mat(0xd5a35c),WOOD=mat(0x825536),
 WATER=new THREE.MeshPhongMaterial({color:0x5bb4ca,transparent:true,opacity:.78,shininess:95,depthWrite:false,side:THREE.DoubleSide}),
 GLOW=new THREE.MeshLambertMaterial({color:0xffe3a4,emissive:0xd79545,emissiveIntensity:.78}),
 SOIL=mat(0x4f4637),LEAF=mat(0x557e56);
function mesh(g,m,x=0,y=0,z=0,parent){
 const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;parent.add(o);return o;
}
function ring(p,outer,tube,y,m,segments=20){
 const g=new THREE.TorusGeometry(outer,tube,7,segments);const o=mesh(g,m,0,y,0,p);o.rotation.x=Math.PI/2;
}
function column(p,r1,r2,h,x,y,z,m,sides=12){
 return mesh(new THREE.CylinderGeometry(r1,r2,h,sides),m,x,y+h*.5,z,p);
}
function flower(p,x,z,color,height){
 column(p,.055,.075,height,x,.29,z,LEAF,6);
 const bud=mesh(new THREE.IcosahedronGeometry(.16,1),mat(color),x,.3+height,z,p);
 bud.scale.set(1.15,.75,1.15);
}
export function makePublicUrbanPrefab(id,scale=1){
 if(!PUBLIC_URBAN_IDS.has(id))return null;
 const p=new THREE.Group();p.name=id;
 if(id==='hf-fountain-stone'){
  column(p,4.05,4.17,.42,0,-.08,0,STONE_DARK,20);
  column(p,3.75,3.93,.8,0,0,0,STONE,20);
  ring(p,3.72,.16,.73,RIM,24);
  // Recessed pool with real transparent water surface; no water under the map.
  column(p,3.36,3.4,.14,0,.44,0,WATER,24);
  column(p,1.03,1.28,1.32,0,.52,0,STONE,12);
  column(p,1.72,1.52,.33,0,1.74,0,RIM,16);
  ring(p,1.51,.10,2.02,STONE_DARK,20);
  column(p,1.34,1.32,.075,0,1.98,0,WATER,16);
  column(p,.32,.53,1.3,0,1.83,0,STONE,10);
  const tip=mesh(new THREE.IcosahedronGeometry(.36,1),BRIGHT,0,3.24,0,p);
  tip.scale.y=1.7;
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,px=Math.sin(a)*2.7,pz=Math.cos(a)*2.7;
   column(p,.10,.20,.44,px,.53,pz,RIM,8);
   const arc=mesh(new THREE.TorusGeometry(.7,.052,5,9,Math.PI),WATER,px*.62,1.42,pz*.62,p);
   arc.rotation.set(0,a,Math.PI/5);
  }
 }else if(id==='hf-streetlamp-bronze'){
  column(p,.37,.43,.35,0,0,0,STONE_DARK,8);
  column(p,.115,.16,3.5,0,.23,0,BRONZE,8);
  column(p,.22,.32,.16,0,3.55,0,BRIGHT,8);
  const lamp=mesh(new THREE.CylinderGeometry(.35,.39,.76,6),GLOW,0,4.1,0,p);
  column(p,.45,.45,.11,0,4.46,0,BRONZE,6);
  column(p,.40,.25,.35,0,4.55,0,BRONZE,6);
  for(let i=0;i<6;i++){const t=i*Math.PI/3;
   column(p,.035,.045,.78,Math.cos(t)*.32,3.7,Math.sin(t)*.32,BRONZE,6);
  }
  lamp.receiveShadow=false;
 }else if(id==='hf-wooden-signpost'){
  column(p,.16,.20,3.1,0,0,0,WOOD,6);
  for(const [y,dir] of [[2.4,1],[1.6,-1]]){
   mesh(new THREE.BoxGeometry(2.0,.48,.18),WOOD,dir*.64,y,0,p);
   mesh(new THREE.ConeGeometry(.34,.52,3),BRIGHT,dir*1.72,y,0,p).rotation.z=dir*-Math.PI/2;
  }
 }else if(id==='hf-round-flowerbed'){
  column(p,2.15,2.12,.46,0,0,0,STONE,16);
  ring(p,2.04,.17,.43,RIM,16);
  column(p,1.75,1.75,.06,0,.35,0,SOIL,16);
  for(let j=0;j<22;j++){
   const a=j*2.39996,r=(.4+(j%5)*.27),x=Math.cos(a)*r,z=Math.sin(a)*r;
   flower(p,x,z,[0xee9bbc,0xffd676,0xc5acf4,0xf0f2e0,0xf5a877][j%5],.20+(j%3)*.075);
  }
 }
 p.scale.setScalar(scale);
 return p;
}
