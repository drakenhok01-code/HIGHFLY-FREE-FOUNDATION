/** HIGHFLY P5.1.5 | Native Eastbrook: fixed, always-on Unsung RPG scene.
 * Source branch: last playable P5.1.4. NO World Forge, saved editor JSON or paid SOURCE.
 * 11 coordinates validated previously in actual Unsung 2048x2048 relief.
 * These are spawn-independent immutable positions, not ClaudeCraft 3D models.
 */
export const EASTBROOK_VERSION='p515-native-eastbrook-v1';
const D={home:[10,9],blacksmith:[12,12],tavern:[13,12],church:[13,13],market:[13,11],hall:[25,15],tower:[9,9]};
export const EASTBROOK_LOTS=Object.freeze([
 {id:'bank',label:'Banco de Arvelia',role:'banco',model:'home_B',type:'kaykit',x:-656,z:-84,yaw:225*Math.PI/180,scale:1.3,w:10,d:9},
 {id:'blacksmith',label:'Herrería de Arvelia',role:'herreria',model:'blacksmith',type:'kaykit',x:-598,z:-42,yaw:20*Math.PI/180,scale:1.25,w:12,d:12},
 {id:'inn',label:'Taberna',role:'taberna',model:'tavern',type:'kaykit',x:-618,z:-26,yaw:24*Math.PI/180,scale:1.3,w:13,d:12},
 {id:'chapel',label:'Capilla',role:'capilla',model:'church',type:'kaykit',x:-566,z:-74,yaw:125*Math.PI/180,scale:1.25,w:13,d:13},
 {id:'apothecary',label:'Botica',role:'botica',model:'home_A',type:'kaykit',x:-624,z:-94,yaw:175*Math.PI/180,scale:1.3,w:10,d:9},
 {id:'quayhouse',label:'Casa de los viajeros',role:'casa_muelle',model:'home_B',type:'kaykit',x:-654,z:-18,yaw:46*Math.PI/180,scale:1.25,w:10,d:9},
 {id:'guild',label:'Gremio de Aventureros',role:'gremio_highfly',model:'hall',type:'unsung',x:-556,z:-38,yaw:Math.PI,scale:1,w:25,d:15},
 {id:'market',label:'Mercado de Arvelia',role:'mercado_highfly',model:'market',type:'kaykit',x:-604,z:-60,yaw:0,scale:1,w:13,d:11},
 {id:'home1',label:'Vivienda 1',role:'vivienda_1',model:'home_A',type:'kaykit',x:-562,z:-18,yaw:.4,scale:1.1,w:10,d:9},
 {id:'home2',label:'Vivienda 2',role:'vivienda_2',model:'home_A',type:'kaykit',x:-676,z:-44,yaw:-.5,scale:1.1,w:10,d:9},
 {id:'tower',label:'Torre de entrada',role:'torre_entrada',model:'tower',type:'unsung',x:-542,z:-114,yaw:0,scale:.85,w:9,d:9}
].map(x=>Object.freeze(x)));
export const EASTBROOK_PATHS=Object.freeze([
 Object.freeze({id:'avenida-central',width:6,points:[[-668,-65],[-644,-64],[-623,-62],[-606,-62],[-586,-65],[-567,-68],[-548,-70],[-538,-70]]}),
 Object.freeze({id:'calle-norte',width:4.4,points:[[-625,-64],[-615,-48],[-603,-42],[-599,-34],[-613,-29]]}),
 Object.freeze({id:'calle-sur',width:4.2,points:[[-625,-62],[-634,-79],[-624,-91],[-638,-96]]}),
 Object.freeze({id:'paseo-gremio',width:4.2,points:[[-586,-65],[-577,-52],[-568,-43],[-560,-40]]}),
 Object.freeze({id:'calle-capilla',width:4.3,points:[[-586,-65],[-573,-72],[-566,-81]]})
]);
export const EASTBROOK_SQUARE=Object.freeze({x:-589,z:-63,radius:12.5});
export const EASTBROOK_SOURCE=Object.freeze({unsung:'Leonxlnx/unsung-vale MIT',kaykit:'KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0 CC0 pinned 84fa4e91af6a88989be7c99e0891cede11f2ca38',claude:'World of ClaudeCraft Eastbrook MIT town roles/layout reference ONLY, no 3D models'});
const lerp=(a,b,t)=>a+(b-a)*t;
export function eastbrookPathSamples(path,step=1.2){
 if(!path?.points?.length)return [];
 const out=[];
 // Catmull-Rom smooth road center, deterministic, no Three.js dependency.
 const a=path.points;
 for(let i=0;i<a.length-1;i++){
  const p0=a[Math.max(0,i-1)],p1=a[i],p2=a[i+1],p3=a[Math.min(a.length-1,i+2)];
  const n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
  for(let j=0;j<n;j++){
   const t=j/n,t2=t*t,t3=t2*t;
   const point=k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);
   out.push({x:point(0),z:point(1)});
  }
 }
 out.push({x:a[a.length-1][0],z:a[a.length-1][1]});
 return out;
}
export const EASTBROOK_SAMPLED_PATHS=EASTBROOK_PATHS.map(p=>({...p,samples:eastbrookPathSamples(p)}));
const nearLine=(x,z,road)=>{
 const pts=road.samples;
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
  const t=den>0?Math.min(1,Math.max(0,((x-a.x)*dx+(z-a.z)*dz)/den)):0;
  if(Math.hypot(x-a.x-t*dx,z-a.z-t*dz)<=road.width*.5+.65)return true;
 }
 return false;
};
export function eastbrookClearing(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 // 99.99% of native Unsung's 91k trees are outside the city.
 // Eliminate them before checking any expensive civic road segment.
 if(x<-705||x>-515||z<-138||z>18)return false;
 if(Math.hypot(x-EASTBROOK_SQUARE.x,z-EASTBROOK_SQUARE.z)<EASTBROOK_SQUARE.radius+.6)return true;
 for(const o of EASTBROOK_LOTS){
  const c=Math.cos(o.yaw),s=Math.sin(o.yaw),dx=x-o.x,dz=z-o.z;
  if(Math.abs(dx*c+dz*s)<o.w*o.scale*.5+2.3&&Math.abs(-dx*s+dz*c)<o.d*o.scale*.5+2.3)return true;
 }
 for(const r of EASTBROOK_SAMPLED_PATHS)if(nearLine(x,z,r))return true;
 return false;
}
export function eastbrookMask(size=1024){
 if(!Number.isInteger(size)||size<128||size>2048)throw Error('Invalid mask resolution');
 const data=new Uint8Array(size*size),world=2048,step=world/size,span=EASTBROOK_LOTS.reduce((a,o)=>({minX:Math.min(a.minX,o.x-20),maxX:Math.max(a.maxX,o.x+20),minZ:Math.min(a.minZ,o.z-20),maxZ:Math.max(a.maxZ,o.z+20)}),{minX:-687,maxX:-525,minZ:-122,maxZ:-4});
 span.minX=Math.min(span.minX,-688);span.maxX=Math.max(span.maxX,-525);span.minZ=Math.min(span.minZ,-124);span.maxZ=Math.max(span.maxZ,-3);
 let painted=0;
 for(let iz=Math.max(0,Math.floor((span.minZ+1024)/step));iz<=Math.min(size-1,Math.ceil((span.maxZ+1024)/step));iz++){
  const z=(iz+.5)*step-1024;
  for(let ix=Math.max(0,Math.floor((span.minX+1024)/step));ix<=Math.min(size-1,Math.ceil((span.maxX+1024)/step));ix++){
   const x=(ix+.5)*step-1024;
   if(eastbrookClearing(x,z)){data[iz*size+ix]=255;painted++;}
  }
 }
 return {data,painted,size};
}
