/* HIGHFLY P5.2.8: original low-poly décor, created from ordinary THREE primitives.
 * Identical scene geometry used in editor and RPG; static, no shadows or animations,
 * shared geometries/materials to protect Android FPS. No commercial models included.
 */
import * as THREE from 'three';
import {VILLAGE_DECOR_IDS} from './p528-village-layout.mjs';
const materials=new Map(),geometry=new Map();
const mat=(hex,lit=false)=>{
 const key=hex+'-'+lit;
 if(!materials.has(key))materials.set(key,new THREE.MeshLambertMaterial({
  color:hex,flatShading:true,emissive:lit?hex:0x000000,emissiveIntensity:lit?.44:0
 }));
 return materials.get(key);
};
function geo(key,create){
 if(!geometry.has(key))geometry.set(key,create());
 return geometry.get(key);
}
const G={
 box:()=>geo('box',()=>new THREE.BoxGeometry(1,1,1)),
 ico:(d=0)=>geo('ico-'+d,()=>new THREE.IcosahedronGeometry(1,d)),
 cyl:(n=8)=>geo('cyl-'+n,()=>new THREE.CylinderGeometry(1,1,1,n)),
 cone:(n=8)=>geo('cone-'+n,()=>new THREE.ConeGeometry(1,1,n)),
 sphere:()=>geo('sphere',()=>new THREE.SphereGeometry(1,7,5))
};
function primitive(g,type,x,y,z,a,b,c,hex,ry=0,rz=0,rx=0){
 const m=new THREE.Mesh(G[type](),mat(hex));m.position.set(x,y,z);m.rotation.set(rx,ry,rz);
 m.scale.set(a,b,c);m.castShadow=false;m.receiveShadow=true;g.add(m);return m;
}
function box(g,x,y,z,w,h,d,c,rx=0,ry=0,rz=0){
 return primitive(g,'box',x,y,z,w,h,d,c,ry,rz,rx);
}
function petal(g,x,y,z,c,r=.24){
 return primitive(g,'ico',x,y,z,r,r*.7,r,c);
}
function lantern(g,s=1){
 box(g,0,1.63*s,0,.18*s,3.2*s,.18*s,0x544339);
 box(g,0,3.25*s,0,.4*s,.18*s,.4*s,0xd8ad62);
 box(g,0,2.83*s,0,.39*s,.47*s,.39*s,0xffca65);
 box(g,0,3.11*s,0,.5*s,.12*s,.5*s,0x574d59);
 const light=primitive(g,'sphere',0,2.85*s,0,.17*s,.23*s,.17*s,0xffe0a1);
 light.material=mat(0xffcf72,true);
 box(g,0,3.25*s,0,.12*s,.25*s,.12*s,0xf2d596);
}
function deciduous(g,kind){
 const colors={pink:[0xf3a6c3,0xe58ab4,0xffc8d8],lilac:[0xc4a0df,0xb785cd,0xe2b6f0],
  amber:[0xf3b16d,0xe28b59,0xf6c98a],green:[0x76a66c,0x4f985f,0x93bc76]}[kind];
 primitive(g,'cyl',0,1.48,0,.39,2.9,.39,0x856047);
 const blobs=[
  [-.8,3.75,-.34,1.55],[.84,3.82,.28,1.57],[0,4.38,.3,1.84],
  [-.16,3.7,-1.08,1.3]
 ];
 for(let i=0;i<blobs.length;i++){
  const [x,y,z,r]=blobs[i];primitive(g,'ico',x,y,z,r,r*.89,r,colors[i%3]);
 }
}
function flowerBed(g){
 box(g,0,.19,0,3,.4,1.76,0xc8b395);
 box(g,0,.42,0,2.74,.12,1.49,0x547748);
 for(let i=0;i<8;i++){
  const x=-1.08+(i%4)*.72,z=-.43+Math.floor(i/4)*.86;
  box(g,x,.67,z,.06,.48,.06,0x628e54);
  petal(g,x,.94,z,[0xffe5b1,0xe9a1b5,0xcbb0ec,0xfff1e3][i%4],.20);
  petal(g,x+.17,.92,z+.09,[0xf6c1d0,0xfff1dc,0xffd071][i%3],.12);
 }
}
function stall(g,blue){
 const stripe=blue?0x6386c0:0xdb6058;
 const timber=0x755037;
 for(const x of [-2.12,2.12])for(const z of [-1.5,1.5])
  box(g,x,1.61,z,.16,3.15,.16,timber);
 box(g,0,1.46,0,4.74,.22,3.23,0x81583a);
 box(g,0,.96,0,4.45,1.0,2.95,0xaa7950);
 box(g,0,3.53,0,4.95,.21,.15,0xe1c18a);
 for(let i=0;i<8;i++){
  const color=i%2?0xf9e7cf:stripe,x=-2.13+i*.61;
  box(g,x,3.09,-.88,.62,.14,2.12,color,-.29);
  box(g,x,3.09,.88,.62,.14,2.12,color,.29);
 }
 for(let i=0;i<9;i++){
  const x=-1.62+(i%5)*.78,z=-.42+Math.floor(i/5)*.83;
  primitive(g,'ico',x,1.69,z,.18,.16,.18,
   [0xe28a52,0xebc071,0x87af6b,0xbd664d][i%4]);
 }
 box(g,-1.68,.22,1.58,.76,.43,.7,0x926643);
 box(g,1.6,.25,1.57,.8,.48,.7,0x977047);
}
function gazebo(g){
 const white=0xe9ddc7,gold=0xd8ad61,slate=0x617394;
 primitive(g,'cyl',0,.23,0,4.05,.46,4.05,white);
 primitive(g,'cyl',0,.5,0,3.85,.15,3.85,gold);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,x=Math.cos(a)*3.35,z=Math.sin(a)*3.35;
  primitive(g,'cyl',x,2.35,z,.23,3.7,.23,white);
  primitive(g,'cyl',x,4.27,z,.37,.18,.37,gold);
 }
 primitive(g,'cone',0,5.4,0,4.45,2.35,4.45,slate);
 primitive(g,'cone',0,6.67,0,.34,.68,.34,gold);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;
  box(g,Math.cos(a)*2.88,1.03,Math.sin(a)*2.88,1.1,.15,.16,0xb58b65,0,-a);
 }
}
function banner(g){
 box(g,0,2.15,0,.16,4.3,.16,0xc2ad89);
 box(g,.6,4.16,0,1.38,.14,.14,0xe2c072);
 box(g,.62,3.22,0,1.28,1.75,.065,0xb54352);
 primitive(g,'cone',0,4.47,0,.28,.6,.28,0xeec36d);
 box(g,.64,3.24,.042,.39,.52,.025,0xe8b95c);
}
function crates(g){
 box(g,-.52,.44,0,1.18,.88,1.18,0xb98555);
 box(g,.56,.36,.25,1.18,.72,.93,0x9e6d46);
 box(g,.40,1.05,-.21,.91,.86,.91,0xa97750);
 for(const x of [-.98,-.15,.08,.94]){
  box(g,x,.4,.62,.08,.67,.06,0x67472f);
 }
}
function bench(g){
 const oak=0x9b7553,iron=0x4c4141;
 for(const x of [-1,1])box(g,x,.6,0,.12,1.1,.12,iron);
 for(const z of [-.33,.32])box(g,0,1.12,z,2.66,.20,.35,oak);
 box(g,0,1.72,.38,2.6,.9,.14,oak,-.05);
}
function fence(g){
 for(const x of [-1.9,1.9]){
  box(g,x,.83,0,.22,1.64,.23,0x987b5d);
  primitive(g,'cone',x,1.7,0,.21,.33,.21,0xbca082);
 }
 for(const y of [.49,1.14])box(g,0,y,0,3.95,.14,.18,0x9a7955);
}
function barrel(g){
 primitive(g,'cyl',0,.57,0,.52,1.16,.52,0x846447);
 for(const y of [.23,.92])primitive(g,'cyl',0,y,0,.56,.09,.56,0x685d50);
}
function rock(g){
 primitive(g,'ico',0,.68,0,1.32,.83,.99,0x959789);
 primitive(g,'ico',.8,.36,.44,.58,.42,.53,0xb2a899);
}
function bush(g){
 primitive(g,'ico',0,.8,0,1.25,.9,1.15,0x58956c);
 primitive(g,'ico',.64,.67,-.17,.73,.79,.83,0x7aad77);
}
export function makeVillageDecor(type,scale=1){
 if(!VILLAGE_DECOR_IDS.has(type)&&!['bench','tree','rock','fence','barrel','lantern'].includes(type))return null;
 const g=new THREE.Group();
 if(type==='village-blossom')deciduous(g,'pink');
 else if(type==='village-lilac')deciduous(g,'lilac');
 else if(type==='village-autumn')deciduous(g,'amber');
 else if(type==='tree')deciduous(g,'green');
 else if(type==='village-shrub')bush(g);
 else if(type==='village-flowerbed')flowerBed(g);
 else if(type==='village-stall-red')stall(g,false);
 else if(type==='village-stall-blue')stall(g,true);
 else if(type==='village-gazebo')gazebo(g);
 else if(type==='village-banner')banner(g);
 else if(type==='village-lamp'||type==='lantern')lantern(g);
 else if(type==='village-crates')crates(g);
 else if(type==='bench')bench(g);
 else if(type==='fence')fence(g);
 else if(type==='barrel')barrel(g);
 else if(type==='rock')rock(g);
 g.scale.setScalar(scale);
 g.name='HIGHFLY_VILLAGE_'+type;
 return g;
}
