/** Isolated real WebGL and GLTFLoader smoke: never loads or modifies Unsung world. */
import * as THREE from 'three';
import {KayKitFreeHero} from './kaykit-free-hero.mjs';
import {Pipeline} from '../engine/pipeline.js';
window.__hfQa={done:false,ok:false};
const status=document.getElementById('status');
const report=(ok,details)=>{
 window.__hfQa={done:true,ok,...details};status.textContent=ok?'KAYKIT REAL WEBGL PASS':'KAYKIT REAL WEBGL FAIL';
};
try{
 const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
 renderer.setPixelRatio(1);renderer.setSize(640,400);renderer.setClearColor(0x110b1b);
 document.getElementById('stage').append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,640/400,.1,100);
 camera.position.set(3.2,2.6,5.5);camera.lookAt(0,1,0);
 const hero=await KayKitFreeHero.load({scene});
 if(!hero?.root?.isObject3D||hero.visibleMeshes<1)throw Error('No attached THREE scene');
 if(hero.swordMeshes!==1)throw Error('Exactly one KayKit sword must be visible');
 if(hero.bodyParts.size!==6)throw Error('No complete KayKit body: '+[...hero.bodyParts].join(','));
 if(!hero.root.getObjectByName('Knight_Body')?.visible)throw Error('Body is hidden');
 if(!hero.root.getObjectByName('Knight_Head')?.visible)throw Error('Head is hidden');
 if(hero.clips.size<70)throw Error('Expected complete Knight clips');
 let p={pos:new THREE.Vector3(),viewY:0,yaw:0,grounded:true,state:'move',speed:0,comboStep:0,attack:{t:.46,hit:[.14,.27]}};
 const states=[
 ['idle','move',0,true],['walk','move',1.5,true],['run','move',4,true],['sprint','move',7,true],
 ['jump','move',0,false],['roll','roll',0,true],['dash','hf_dash',0,true],
 ['attack1','attack',0,true,0],['attack2','attack',0,true,1],['attack3','attack',0,true,2],
 ['heavy','attack',0,true,3],['swim','swim',3,false],['hurt','hurt',0,true],['death','dead',0,true]
 ];
 let draws=0,rollAngle=0,trailPass=false;
 for(const [name,state,speed,grounded,comboStep] of states){
  p={...p,state,speed,grounded,comboStep:comboStep??0};
  p.stateTime=name==='roll'?.31:name.startsWith('attack')?.2:0;
  hero.update(1/60,p);renderer.render(scene,camera);draws++;
  if(name==='roll')rollAngle=hero.rollPivot.rotation.x;
  if(name.startsWith('attack')){
    for(let j=0;j<9;j++){p.stateTime=.16+j/120;hero.update(1/120,p);}
    trailPass ||=hero.trail.visible;
  }
  if(hero.key!==(!grounded&&state==='move'?'jump':state==='hf_dash'?'dash':state==='swim'?'swim':state==='roll'?'roll':state==='hurt'?'hurt':state==='dead'?'dead':state==='attack'?(comboStep===3?'heavy':'attack'+(comboStep+1)):state==='move'?(speed>5.8?'sprint':speed>2.6?'run':speed>.2?'walk':'idle'):'jump'))
    throw Error('Incorrect animation routing at '+name+': '+hero.key);
 }
 // Pixels ensure mesh actually renders, not just data object initialization.
 p={...p,state:'move',speed:0,grounded:true};for(let i=0;i<6;i++)hero.update(1/60,p);
 renderer.render(scene,camera);
 const gl=renderer.getContext(),pixels=new Uint8Array(640*400*4);
 gl.readPixels(0,0,640,400,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
 let changed=0;
 for(let i=0;i<pixels.length;i+=4){
  if(Math.abs(pixels[i]-17)>25||Math.abs(pixels[i+1]-11)>25||Math.abs(pixels[i+2]-27)>25)changed++;
 }
 const b=new THREE.Box3().setFromObject(hero.root),size=b.getSize(new THREE.Vector3());
 if(changed<100)throw Error('Hero model invisible: only '+changed+' non-background pixels');
 if(!(rollAngle>2.5&&rollAngle<4))throw Error('360 roll half turn missing: '+rollAngle);
 if(!trailPass)throw Error('Weapon trail not emitted during original Unsung hit window');
 if(!(size.y>.8&&size.y<4))throw Error('Hero model height out of range '+size.y);

 // Detect the "ghost armor" regression at rasterization level. Being marked
 // visible in glTF is not enough: ALL six BODY pieces must draw real pixels.
 const all=[];hero.root.traverse(o=>{if(o.isMesh){all.push([o,o.visible]);o.visible=false;}});
 hero.trail.visible=false;
 const partPixels={};
 for(const name of [...hero.bodyParts].sort()){
  const mesh=hero.root.getObjectByName(name);
  mesh.visible=true;renderer.render(scene,camera);
  const layer=new Uint8Array(640*400*4);
  gl.readPixels(0,0,640,400,gl.RGBA,gl.UNSIGNED_BYTE,layer);
  let occupied=0;
  for(let i=0;i<layer.length;i+=4)
   if(Math.abs(layer[i]-17)>25||Math.abs(layer[i+1]-11)>25||Math.abs(layer[i+2]-27)>25)occupied++;
  partPixels[name]=occupied;mesh.visible=false;
  if(occupied<8)throw Error('BODY LAYER GHOST: '+name+' contributes only '+occupied+' pixels');
 }
 for(const [mesh,visible] of all)mesh.visible=visible;

 // Render once through Unsung's ACTUAL multi-pass shader pipeline, not just plain Three.
 // The previous smoke test passed while the player was an invisible sword in the game.
 const pCanvas=document.createElement('canvas');
 pCanvas.style.width='640px';pCanvas.style.height='400px';
 pCanvas.width=640;pCanvas.height=400;
 document.getElementById('stage').append(pCanvas);
 const unsung=new Pipeline(pCanvas,{renderScale:.8});
 unsung.camera.position.set(3.2,2.6,5.5);
 unsung.camera.lookAt(0,1,0);
 const ph=await KayKitFreeHero.load(unsung);
 const idle={pos:new THREE.Vector3(),viewY:0,yaw:0,grounded:true,
   state:'move',speed:0,stateTime:0,comboStep:0,attack:null};
 for(let i=0;i<4;i++){ph.update(1/60,idle);unsung.render(1/60);}
 const pBox=new THREE.Box3().setFromObject(ph.root);
 const bound={minY:pBox.min.y,maxY:pBox.max.y};
 const gl2=unsung.renderer.getContext();
 const shot=()=>{
   const out=new Uint8Array(unsung.renderer.domElement.width*unsung.renderer.domElement.height*4);
   gl2.readPixels(0,0,unsung.renderer.domElement.width,unsung.renderer.domElement.height,gl2.RGBA,gl2.UNSIGNED_BYTE,out);return out;
 };
 // Multi-pass "body only vs sword only" comparison catches disappearing
 // SkinnedMesh draws even when the GLB says all six parts are visible.
 const meshes=[];ph.root.traverse(o=>{if(o.isMesh)meshes.push([o,o.visible]);});
 const bodyNames=new Set(ph.bodyParts);
 for(const [mesh] of meshes)mesh.visible=bodyNames.has(mesh.name);
 for(let i=0;i<3;i++)unsung.render(1/60);
 const skinned=shot();
 for(const [mesh] of meshes)mesh.visible=mesh===ph.sword;
 for(let i=0;i<3;i++)unsung.render(1/60);
 const weaponOnly=shot();
 let bodyDiff=0;
 for(let i=0;i<skinned.length;i+=4)
  if(Math.abs(skinned[i]-weaponOnly[i])+
     Math.abs(skinned[i+1]-weaponOnly[i+1])+
     Math.abs(skinned[i+2]-weaponOnly[i+2])>48)bodyDiff++;
 for(const [mesh,visible] of meshes)mesh.visible=visible;
 console.log('[UNSUNG PIPELINE BODY QA] diffPixels='+bodyDiff+' bound='+JSON.stringify(bound));
 if(bodyDiff<80)throw Error('Ghost sword regression: KayKit skinned body missing from REAL Unsung pipeline; diff='+bodyDiff);
  report(true,{unsungBodyDiffPixels:bodyDiff,modelBounds:bound,meshCount:hero.visibleMeshes,bodyParts:hero.bodyParts.size,partPixels,swordCount:hero.swordMeshes,rollAngle,trailPass,clipCount:hero.clips.size,draws,changedPixels:changed,modelHeight:size.y,socket:hero.socket.name});
}catch(e){console.error(e);report(false,{error:e?.stack||String(e)});}
