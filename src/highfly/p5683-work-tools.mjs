import * as THREE from 'three';
import {driveHandCCD} from './directional-rig.mjs';
import {PROFESSION_RULES} from './professions.mjs';
// Original HIGHFLY low-poly tools, no third-party or paid asset downloads.
const C={wood:0x93643c,light:0xc9a36a,stone:0x8c939b,edge:0xb6b9b7,rope:0xd9bf87,dark:0x553b27,water:0x739cb5};
const mats=new Map();
const mat=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));return mats.get(c)};
function part(g,geo,c,x=0,y=0,z=0){const o=new THREE.Mesh(geo,mat(c));o.position.set(x,y,z);o.frustumCulled=false;g.add(o);return o}
const box=(g,x,y,z,c,px=0,py=0,pz=0)=>part(g,new THREE.BoxGeometry(x,y,z),c,px,py,pz);
const cyl=(g,a,b,l,c,x=0,y=0,z=0)=>part(g,new THREE.CylinderGeometry(a,b,l,7),c,x,y,z);
function rod(g,a,b,r,c){const v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),d=w.clone().sub(v),o=cyl(g,r,r,d.length(),c);o.position.copy(v.add(w).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o}
function curve(g,points,r,c){for(let i=1;i<points.length;i++)rod(g,points[i-1],points[i],r,c)}
function blade(g,points,depth,c){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1});geo.translate(0,0,-depth/2);return part(g,geo,c)}
function make(id){
 const g=new THREE.Group();g.name='HIGHFLY_WORK_TOOL_'+id;g.visible=false;g.userData.tool=id;
 if(id==='axe'||id==='pickaxe'||id==='hoe'||id==='hammer'){
  const len=id==='hammer'?.50:id==='hoe'?1.08:.83;
  cyl(g,.035,.046,len,C.wood,0,len*.30);cyl(g,.049,.049,.14,C.dark,0,0);
  const y=len*.80;
  if(id==='axe'){box(g,.14,.13,.12,C.dark,0,y);blade(g,[[.02,y-.04],[.22,y-.18],[.32,y-.12],[.29,y+.16],[.02,y+.05]],.085,C.stone);box(g,.035,.22,.095,C.edge,.29,y-.01);}
  if(id==='pickaxe'){box(g,.14,.13,.12,C.dark,0,y);blade(g,[[-.38,y-.13],[-.20,y+.09],[0,y+.15],[.23,y+.08],[.40,y-.14],[.19,y-.02],[0,y+.04],[-.19,y-.02]],.075,C.stone);}
  if(id==='hoe'){box(g,.12,.1,.12,C.dark,0,y);const b=box(g,.25,.075,.28,C.stone,.14,y-.01);b.rotation.z=-.3;}
  if(id==='hammer'){box(g,.33,.16,.16,C.stone,0,y);box(g,.04,.19,.19,C.edge,-.17,y);box(g,.04,.19,.19,C.edge,.17,y);}
 }else if(id==='rod'){
  rod(g,[0,-.22,0],[0,.27,0],.038,C.wood);rod(g,[0,.25,0],[0,.91,0],.021,C.light);rod(g,[0,.90,0],[0,1.43,.10],.012,C.light);rod(g,[0,1.43,.10],[0,1.59,.18],.006,C.light);
  const reel=cyl(g,.095,.095,.07,C.dark,.075,.05,0);reel.rotation.z=Math.PI/2;
  rod(g,[.10,.05,0],[.17,.05,.03],.016,C.edge);box(g,.05,.05,.05,C.wood,.18,.05,.03);g.userData.tip=[0,1.59,.18];
 }else if(id==='watering_can'){
  cyl(g,.17,.20,.28,C.wood,0,-.16,0);cyl(g,.174,.174,.035,C.edge,0,-.03,0);curve(g,[[-.13,-.08,0],[-.24,.05,0],[-.24,.17,0],[0,.19,0],[.13,.02,0]],.032,C.dark);
  rod(g,[.14,-.19,0],[.39,.04,0],.047,C.wood);const sp=box(g,.12,.08,.13,C.edge,.41,.065);sp.rotation.z=.45;
 }else if(id==='sickle'||id==='knife'||id==='saw'){
  cyl(g,.036,.045,.25,C.wood,0,.02);
  if(id==='sickle'){blade(g,[[0,.13],[.08,.46],[.32,.57],[.49,.44],[.42,.36],[.27,.46],[.15,.35],[.08,.13]],.045,C.stone);}
  if(id==='knife')blade(g,[[-.04,.13],[.08,.13],[.10,.35],[.01,.52],[-.04,.29]],.055,C.edge);
  if(id==='saw'){const pts=[[-.04,.13],[.12,.13],[.14,.69],[-.01,.64]];for(let y=.59;y>.14;y-=.065){pts.push([-.085,y],[-.015,y-.04])}blade(g,pts,.04,C.stone);}
 }else if(id==='tongs'){
  curve(g,[[0,-.16,0],[-.08,.19,0],[-.16,.49,0],[-.10,.58,0]],.027,C.stone);
  curve(g,[[0,-.16,0],[.08,.19,0],[.16,.49,0],[.10,.58,0]],.027,C.stone);
 }
 return g;
}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function createWorkTools(hero){
 const tools=new Map(),up=new THREE.Vector3(0,1,0),axis=new THREE.Vector3(),worldQ=new THREE.Quaternion(),parentQ=new THREE.Quaternion(),actorQ=new THREE.Quaternion(),tip=new THREE.Vector3(),dst=new THREE.Vector3(),grip=new THREE.Vector3();
 const lineGeo=new THREE.BufferGeometry(),linePos=new Float32Array(18);lineGeo.setAttribute('position',new THREE.BufferAttribute(linePos,3));
 const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xf8e2ba,transparent:true,opacity:.85}));line.frustumCulled=false;line.visible=false;line.name='HIGHFLY_FISHING_LINE';hero.pipe.scene.add(line);
 const bobber=new THREE.Group();bobber.name='HIGHFLY_FISHING_FLOAT';part(bobber,new THREE.SphereGeometry(.055,7,5),0xff6243,0,.025);part(bobber,new THREE.SphereGeometry(.049,7,5),0xfff0c0,0,-.021);bobber.visible=false;hero.pipe.scene.add(bobber);
 let active=null,lastAction=null,saved=null;const socket=hero.socket;
 function get(id){if(!tools.has(id)){const g=make(id);socket.add(g);tools.set(id,g)}return tools.get(id)}
 const weaponNodes=()=>[...hero.gearNodes.values(),...hero.extraWeapons.values()];
 function end(){if(active){get(active).visible=false;for(const [o,v] of saved??[])o.visible=v}active=null;lastAction=null;saved=null;line.visible=bobber.visible=false;}
 function sync(p){
  const a=p.state==='hf_action'?p._hfAction:null,id=a?.job?(PROFESSION_RULES[a.name]?.tool??(a.name==='smelt'?'tongs':null)):null;
  if(!id){end();return null}
  if(a!==lastAction||id!==active){end();saved=weaponNodes().map(o=>[o,o.visible]);active=id;lastAction=a}
  for(const o of weaponNodes())o.visible=false;get(id).visible=true;return id;
 }
 function pose(p,dt){
  const id=sync(p);if(!id)return;
  const a=p._hfAction,g=get(id),k=clamp(a.time/Math.max(.05,a.job.seconds),0,1);
  // The native collision body never moves. IK directs the actual skinned hand.
  let target={x:.38,y:1.04,z:.43},tilt=.35,side=0;
  if(id==='rod'){
   if(k<.22){const q=smooth(k/.22);target={x:.40,y:1.12+.38*q,z:.27-.36*q};tilt=-.75*q;}
   else if(k<.40){const q=smooth((k-.22)/.18);target={x:.38,y:1.50-.38*q,z:-.09+.74*q};tilt=-.75+1.72*q;}
   else if(k<.77){target={x:.39,y:1.11+.025*Math.sin(k*28),z:.59};tilt=1.04;}
   else{const q=smooth((k-.77)/.23);target={x:.38,y:1.1+.35*q,z:.59-.24*q};tilt=1.04-1.15*q;}
  }else if(['axe','pickaxe','hoe','hammer'].includes(id)){
   const stroke=(k*(id==='hammer'?3:2))%1,q=(1-Math.cos(stroke*Math.PI*2))*.5;
   target={x:.40,y:1.58-(id==='hoe'?.97:.70)*q,z:.18+.57*q};tilt=-.55+1.98*q;
  }else if(id==='watering_can'){target={x:.43,y:.82,z:.56};tilt=.15+1.13*smooth(Math.sin(Math.PI*k));side=-.5;}
  else if(id==='sickle'||id==='knife'||id==='saw'){const q=Math.sin(k*Math.PI*4);target={x:.37+.24*q,y:.84,z:.56};tilt=1.15;side=q*.65;}
  else{target={x:.39,y:1.05,z:.55};tilt=1.1+.18*Math.sin(k*8);}
  hero.actor.updateMatrixWorld(true);
  driveHandCCD(THREE,hero.actor,{shoulder:hero._bone('upperarm.r'),elbow:hero._bone('lowerarm.r'),hand:hero._bone('hand.r')},target,4);
  if(id==='rod'||id==='pickaxe'||id==='hoe')driveHandCCD(THREE,hero.actor,{shoulder:hero._bone('upperarm.l'),elbow:hero._bone('lowerarm.l'),hand:hero._bone('hand.l')},{x:target.x-.28,y:target.y-.12,z:target.z+.13},3);
  // Grip position is inherited from hand socket; world scale and angle stay consistent.
  hero.actor.getWorldQuaternion(actorQ);socket.getWorldQuaternion(parentQ);const scale=socket.getWorldScale(new THREE.Vector3());g.scale.set(1/Math.max(.001,Math.abs(scale.x)),1/Math.max(.001,Math.abs(scale.y)),1/Math.max(.001,Math.abs(scale.z)));
  axis.set(side,Math.cos(tilt),Math.sin(tilt)).normalize().applyQuaternion(actorQ);worldQ.setFromUnitVectors(up,axis);g.quaternion.copy(parentQ).invert().multiply(worldQ);g.updateMatrixWorld(true);
  line.visible=bobber.visible=false;
  if(id==='rod'&&k>.22){
   const node=p.world.highflyInteractables?.find(n=>n.id===a.job.id);if(node){tip.set(...g.userData.tip);g.localToWorld(tip);grip.copy(tip);dst.set(node.x,node.y+.045,node.z);const cast=smooth((k-.22)/.19),reel=smooth((k-.77)/.23);dst.lerp(tip,Math.max(1-cast,reel));for(let i=0;i<6;i++){const t=i/5;linePos[i*3]=tip.x+(dst.x-tip.x)*t;linePos[i*3+1]=tip.y+(dst.y-tip.y)*t-Math.sin(Math.PI*t)*.22*(1-reel);linePos[i*3+2]=tip.z+(dst.z-tip.z)*t}lineGeo.attributes.position.needsUpdate=true;line.visible=bobber.visible=true;bobber.position.copy(dst);bobber.updateMatrixWorld(true);line.updateMatrixWorld(true);}
  }
  hero.actor.updateMatrixWorld(true);
 }
 return {sync,pose,end,tools,line,bobber,get active(){return active}};
}
