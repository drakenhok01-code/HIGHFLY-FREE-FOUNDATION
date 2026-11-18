/** F0.8: character + 14 states + ORIGINAL UNSUNG GPU SKINNING pipeline.
 * Shader/material and camera are the ones the real game uses.
 * Requires all six body parts rasterized and 76 adapted animation clips.
 */
import * as THREE from 'three';
import {KayKitFreeHero} from './kaykit-free-hero.mjs';
import {Pipeline} from '../engine/pipeline.js';
window.__hfQa={done:false,ok:false};
const info=document.getElementById('status');
const report=(ok,data)=>{window.__hfQa={done:true,ok,...data};info.textContent=ok?'HIGHFLY F0.8 KAYKIT BODY PASS':'HIGHFLY F0.8 FAILURE';};
const sample=(renderer,w,h)=>{
 renderer.setRenderTarget(null);
 const gl=renderer.getContext(),data=new Uint8Array(w*h*4);
 gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,data);
 return data;
};
const diff=(a,b,threshold=35)=>{
 let n=0;for(let i=0;i<a.length;i+=4)if(
  Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>threshold
 )n++;return n;
};
try{
 const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
 renderer.setPixelRatio(1);renderer.setSize(640,400);
 renderer.setClearColor(0x110b1b);
 const host=document.getElementById('stage');host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,640/400,.1,100);
 camera.position.set(3.2,2.6,5.5);camera.lookAt(0,1,0);
 const hero=await KayKitFreeHero.load({scene});
 if(hero.bodyParts.size!==6||hero.swordMeshes!==1||hero.clips.size!==76)
  throw Error('Not six parts, one CC0 sword and 76 clips');
 if(hero.profile.bones!==41||hero.profile.tracks<6000)
  throw Error('P6.8 rest-pose retarget failed '+JSON.stringify(hero.profile));
 if(!(hero.profile.headRatio>.17&&hero.profile.headRatio<.35))
  throw Error('Wrong stylized head ratio '+hero.profile.headRatio);
 if(document.querySelector('canvas[data-hf-overlay]'))
  throw Error('Forbidden second WebGL/CPU ghost overlay');
 let p={pos:new THREE.Vector3(),viewY:0,yaw:0,grounded:true,
  state:'move',speed:0,comboStep:0,stateTime:0,attack:{t:.46,hit:[.14,.27]}};
 const states=[
  ['idle','move',0,true,0],['walk','move',1.5,true,0],['run','move',4,true,0],
  ['sprint','move',7,true,0],['jump','move',0,false,0],
  ['roll','roll',0,true,0],['dash','hf_dash',0,true,0],
  ['attack1','attack',0,true,0],['attack2','attack',0,true,1],
  ['attack3','attack',0,true,2],['heavy','attack',0,true,3],
  ['swim','swim',3,false,0],['hurt','hurt',0,true,0],['dead','dead',0,true,0]
 ];
 let rollAngle=0,trailVisible=false,frames=0;
 for(const [name,state,speed,grounded,comboStep] of states){
  p={...p,state,speed,grounded,comboStep,stateTime:state==='roll'?.31:state==='attack'?.18:0};
  hero.update(1/60,p);renderer.render(scene,camera);frames++;
  if(state==='roll')rollAngle=hero.rollPivot.rotation.x;
  if(state==='attack'){
   for(let i=0;i<11;i++){
    p.stateTime=.16+i/120;hero.update(1/120,p);
    trailVisible ||=hero.trail.visible;
   }
  }
  if(hero.key!==name)throw Error('State animation '+name+' mapped as '+hero.key);
 }
 if(Math.abs(rollAngle-Math.PI)>.02||!trailVisible)
  throw Error('Unsung 360-roll or three-hit blade trail missing');
 p={...p,state:'move',speed:0,grounded:true};for(let i=0;i<5;i++)hero.update(1/60,p);
 const all=[];hero.root.traverse(o=>{if(o.isMesh){all.push([o,o.visible]);o.visible=false;}});
 hero.trail.visible=false;
 renderer.render(scene,camera);const blank=sample(renderer,640,400);
 const partPixels={};
 for(const name of [...hero.bodyParts].sort()){
  const mesh=hero.root.getObjectByName(name);mesh.visible=true;
  renderer.render(scene,camera);
  const pixels=sample(renderer,640,400);
  partPixels[name]=diff(blank,pixels);
  mesh.visible=false;
  if(partPixels[name]<12)throw Error('Missing real skinned '+name+' ('+partPixels[name]+' pixels)');
 }
 for(const [o,v] of all)o.visible=v;
 renderer.render(scene,camera);
 const screen=sample(renderer,640,400);
 const changed=diff(blank,screen);
 if(changed<200)throw Error('Visible actor area too small '+changed);
 // Original multi-pass Unsung pipeline is the true integration gate;
 // the isolated THREE scene alone previously accepted an invisible body.
 const canvas=document.createElement('canvas');
 canvas.width=640;canvas.height=400;
 canvas.style.cssText='width:640px;height:400px;display:block';
 host.append(canvas);
 const pipe=new Pipeline(canvas,{renderScale:.8});
 pipe.camera.position.set(3.2,2.6,5.5);pipe.camera.lookAt(0,1,0);
 pipe.taa.enabled=false;
 const ph=await KayKitFreeHero.load(pipe);
 const pj={...p,pos:new THREE.Vector3(),viewY:0,attack:null};
 for(let i=0;i<5;i++){ph.update(1/60,pj);pipe.render(1/60);}
 const render=()=>{pipe.render(0);return sample(pipe.renderer,pipe.renderer.domElement.width,pipe.renderer.domElement.height);};
 const meshes=[];ph.root.traverse(o=>{if(o.isMesh)meshes.push([o,o.visible]);});
 for(const [o] of meshes)o.visible=o===ph.sword;
 const swordOnly=render();
 for(const [o] of meshes)o.visible=ph.bodyParts.has(o.name);
 const bodyOnly=render();
 const bodyDifference=diff(swordOnly,bodyOnly,50);
 for(const [o,v] of meshes)o.visible=v;
 if(bodyDifference<120)
  throw Error('GHOST regression: Unsung pipeline refuses skinned body, diff='+bodyDifference);
 // Compare the SAME CC0 Knight GLB in native, non-stylized proportions.
 const prevSearch=location.search;
 history.replaceState(null,'',location.pathname+'?hfstyle=original');
 const originalScene=new THREE.Scene();
 const originalHero=await KayKitFreeHero.load({scene:originalScene});
 if(!originalHero.originalLook||originalHero.bodyParts.size!==6||
    originalHero.clips.size!==76||originalHero.profile.rig!=='FREE_KNIGHT_ORIGINAL_41')
   throw Error('Authentic KayKit original look unavailable');
 if(!originalHero.root.getObjectByName('Knight_Helmet')?.visible)
   throw Error('Original KayKit option must display its Knight helmet');
 originalHero.update(1/60,pj);
 renderer.render(originalScene,camera);
 const origPixels=sample(renderer,640,400);
 const origChanged=diff(blank,origPixels);
 history.replaceState(null,'',location.pathname+prevSearch);
 if(origChanged<160)throw Error('Original KayKit chibi variant invisible '+origChanged);


 // Physically existing 41-bone Medium skeleton must animate its limb channels,
 // not just move a floating invisible collider through water.
 if(hero._hfSwimPoseCount<4)throw Error('Missing KayKit arm/leg swim channels '+hero._hfSwimPoseCount);
 const compareBone=hero.swimBonePairs.arms.find(Boolean);
 const swimbefore={...pj,state:'swim',speed:2,stepPhase:0,grounded:false};
 hero.update(1/60,swimbefore);
 const qa0=compareBone.quaternion.clone();
 hero.update(1/60,{...swimbefore,stepPhase:.28});
 const swimAngle=qa0.angleTo(compareBone.quaternion);
 if(swimAngle<.07)throw Error('Water animation is still static Idle: '+swimAngle);
 // Real KayKit source clips for emote/social use exactly the same 41-bone Mixer.
 const social=['Sit_Floor_Down','Lie_Down','Cheer','PickUp','Use_Item'];
 for(const clip of social){
  const a={key:'hf_action',clip,duration:1.0};
  hero.update(1/60,{...pj,state:'hf_action',_hfActivity:a,grounded:true});
  if(hero.key!=='raw:'+clip)throw Error('Social clip not mapped '+clip);
 }
 // A compact grounded roll should tuck the torso visibly at the midpoint.
 hero.update(1/60,{...pj,state:'roll',stateTime:.31});
 if(!(hero._rollTuck>.95&&hero.offset.scale.y<.75))
  throw Error('ROLL remains tall backflip; grounded tuck not applied');

 const reportData={clips:hero.clips.size,states:frames,bones:hero.profile.bones,
  bodyParts:hero.bodyParts.size,headRatio:hero.profile.headRatio,
  boundTracks:hero.profile.tracks,renderMode:hero.diagnostics.mode,
  partPixels,changedPixels:changed,bodyDifference,
  rollAngle,trailVisible,swordCount:hero.swordMeshes,originalLookPixels:origChanged,swimBoneChannels:hero._hfSwimPoseCount,swimAngle,groundRollTuck:hero._rollTuck,actionsMapped:social.length};
 console.log('[HIGHFLY F08 NATIVE BODY QA]',JSON.stringify(reportData));
 report(true,reportData);
}catch(e){console.error(e);report(false,{error:e.stack??String(e)});}
