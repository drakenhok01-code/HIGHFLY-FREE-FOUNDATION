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
 if(!hero.ualData)throw Error('Pinned Quaternius UAL CC0 pose data missing');
 for(const name of ['Swim_Idle_Loop','Swim_Fwd_Loop','ClimbUp_1m'])
   if(!(hero.ualData.clips?.[name]?.bones.length>=10))
    throw Error('Quaternius clip bone retarget gate '+name);
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
  if(hero.key!==name&&!(state==='attack'&&hero.key.startsWith('raw:')))
   throw Error('State animation '+name+' mapped as '+hero.key);
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

 // The new roll tucks down rather than flipping while standing.
 p={...p,state:'roll',stateTime:.31,grounded:true};
 hero.update(1/60,p);
 const rollNearGround=hero.rollPivot.position.y<.62&&hero.offset.scale.y<.67;
 if(!rollNearGround)throw Error('Aerial roll regression '+hero.rollPivot.position.y);
 for(const sample of [
   {state:'swim',speed:2.5},{state:'hf_climb',speed:0},
   {state:'hf_mantle',speed:0},
   {state:'hf_action',_hfAction:{name:'sit',time:.25}},
   {state:'hf_action',_hfAction:{name:'mine',time:.1}}
 ]){
   hero.update(1/60,{...p,...sample});
   if(!hero.current)throw Error('Missing animation for '+sample.state);
 }
 // F0.11.5 SWIM: real pinned UAL strokes + KayKit neck safety for 120 frames.
 // The swimmer is still ONE actor, without a second Quaternius model.
 const neutral={...p,state:'move',grounded:true,speed:0,stateTime:0};
 for(let k=0;k<14;k++)hero.update(1/60,neutral);
 const headBone=hero._bone('head'),armBone=hero._bone('upperarm.l');
 if(!headBone||!armBone)throw Error('Missing KayKit swimming head/arm bones');
 const headRest=headBone.quaternion.clone(),armRest=armBone.quaternion.clone();
 hero.actor.updateMatrixWorld(true);
 const headWorldRest=headBone.getWorldQuaternion(new THREE.Quaternion());
 let swimPitchMax=0,swimHeadAngleMax=0,swimHeadWorldMax=0,swimArmAngleMax=0;
 for(let k=0;k<120;k++){
  const speed=k<20?0:2.4;
  hero.update(1/60,{...p,state:'swim',grounded:false,speed,stateTime:k/60});
  swimPitchMax=Math.max(swimPitchMax,Math.abs(hero.rollPivot.rotation.x));
  swimHeadAngleMax=Math.max(swimHeadAngleMax,headBone.quaternion.angleTo(headRest));
  swimHeadWorldMax=Math.max(swimHeadWorldMax,
    headBone.getWorldQuaternion(new THREE.Quaternion()).angleTo(headWorldRest));
  swimArmAngleMax=Math.max(swimArmAngleMax,armBone.quaternion.angleTo(armRest));
  for(const value of [...headBone.quaternion.toArray(),...armBone.quaternion.toArray(),hero.rollPivot.rotation.x])
   if(!Number.isFinite(value))throw Error('NaN in KayKit CC0 swim animation');
 }
 if(swimPitchMax>1.55||swimHeadWorldMax>1.57||swimArmAngleMax<.035)
  throw Error('WORLD-SPACE swim head still reversed '+JSON.stringify({swimPitchMax,swimHeadWorldMax,swimHeadAngleMax,swimArmAngleMax}));
 for(let k=0;k<32;k++)hero.update(1/60,neutral);
 if(Math.abs(hero.rollPivot.rotation.x)>.02)
  throw Error('Swimming body failed to return upright');
 const swimQA={swimPitchMax,swimHeadWorldMax,swimHeadAngleMax,swimArmAngleMax,returnPitch:hero.rollPivot.rotation.x};
 const equipmentModes=['sword','greatsword','dual','shield','unarmed','spear','staff'];
 for(let i=0;i<equipmentModes.length;i++){
   const mode=hero.equip(i);
   if(mode.id!==equipmentModes[i])throw Error('Gear cycle mismatch '+mode.id);
   if(hero.weaponMode.style==='unarmed'&&hero.sword)throw Error('Unarmed sword visible');
   if(i<4&&!hero.sword)throw Error('Missing '+mode.id+' embedded weapon');
   if(i>=5&&!hero.extraWeapons?.get(mode.external)?.visible)
    throw Error('Missing original Emberfall '+mode.id);
 }
 // Verify that dual mode uses TWO actual sword tip trajectories, not a fake mirrored shader.
 hero.equip(2);
 if(!hero.offSword?.visible||hero.swordMeshes!==2)throw Error('Dual mode missing real off-hand sword');
 let rightSwing=false,leftSwing=false;
 for(const index of [0,1]){
  hero.trailHistory.length=0;hero.offTrailHistory.length=0;
  for(let k=0;k<12;k++){
   hero.update(1/60,{...p,state:'attack',grounded:true,comboStep:index,stateTime:.15+k/120,
      attack:{t:.46,hit:[.14,.27]},vel:new THREE.Vector3(),_hfAttackSteering:false});
   rightSwing ||=index===0&&hero.trail.visible;
   leftSwing ||=index===1&&hero.offTrail.visible;
  }
 }
 if(!rightSwing||!leftSwing)throw Error('Dual left/right real blade-trail test failed');
 hero.equip(0);
 const reportData={clips:hero.clips.size,ualClips:Object.keys(hero.ualData.clips),ualApplied:hero.ualApplied,states:frames,bones:hero.profile.bones,
  bodyParts:hero.bodyParts.size,headRatio:hero.profile.headRatio,
  boundTracks:hero.profile.tracks,renderMode:hero.diagnostics.mode,
  partPixels,changedPixels:changed,bodyDifference,
  rollAngle,rollNearGround,swimQA,gearModes:equipmentModes,trailVisible,dualTrailVerified:rightSwing&&leftSwing,swordCount:hero.swordMeshes,originalLookPixels:origChanged};
 console.log('[HIGHFLY F08 NATIVE BODY QA]',JSON.stringify(reportData));
 report(true,reportData);
}catch(e){console.error(e);report(false,{error:e.stack??String(e)});}
