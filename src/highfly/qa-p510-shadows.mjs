import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installP510StagedShadows} from './p510-staged-shadows.mjs';

const oldCore={texture:{name:'approved core'}};const oldRegion={texture:{name:'approved region'}};
const v=new THREE.Vector3(0.8,.2,.5).normalize();
const pipe={renderer:{},sky:{sunDir:v},shadows:{_staticDirty:false}};
const fakeTextures={uSCore:{value:oldCore.texture},uSRegion:{value:oldRegion.texture}};
let writes=0,renderedOld=false;
const uniforms={
 uSunDir:{value:v},uH:{value:null},uSize:{value:0},
 uTexel:{value:1},uSteps:{value:200}
};
const terrain={
 coreRes:256,regionRes:256,coreSize:1024,regionSize:4096,
 texHCore:{name:'hcore'},texHRegion:{name:'hregion'},
 sCore:oldCore,sRegion:oldRegion,uniforms:fakeTextures,_queue:[],
 shadowBake:{uniforms,renderRegion(renderer,target,x,y,width,height){
   assert.equal(renderer,pipe.renderer);
   assert.notEqual(target,oldCore);assert.notEqual(target,oldRegion);
   assert.equal(width,256);assert.equal(height,256);
   writes++;
 }}
};
const control=installP510StagedShadows(terrain,pipe);
assert.equal(control.enabled,true);
const dest={x:-.75,y:.33,z:.12};
assert.equal(terrain.hfStartSunBake(4,dest),true);
assert.equal(terrain.hfStartSunBake(2,dest),false,'must not duplicate in-flight bakes');
for(let i=0;i<23;i++){
 const r=terrain.hfAdvanceSunBake(4);
 assert.ok(!r?.committed,'cannot commit before BOTH terrain targets are complete');
 assert.equal(terrain.sCore,oldCore,'current live textures must remain immutable');
 assert.equal(terrain.sRegion,oldRegion,'no partially updated visible terrain');
 assert.equal(pipe.shadows._staticDirty,false,'static objects should not rebake prematurely');
}
const commit=terrain.hfAdvanceSunBake(4);
assert.equal(commit.committed,true);
assert.equal(commit.key,4);
assert.equal(writes,2);
assert.equal(terrain.uniforms.uSCore.value,terrain.sCore.texture);
assert.equal(terrain.uniforms.uSRegion.value,terrain.sRegion.texture);
assert.notEqual(terrain.sCore,oldCore);
assert.notEqual(terrain.sRegion,oldRegion);
assert.equal(pipe.shadows._staticDirty,true);
assert.ok(v.x<0,'active lighting matches committed sunset angle');
const before=terrain.uniforms.uSCore.value;
assert.equal(terrain.hfStartSunBake(1,{x:.6,y:.6,z:.1}),true);
const aborted=terrain.hfAdvanceSunBake(0);
assert.equal(aborted.aborted,true);
assert.equal(terrain.uniforms.uSCore.value,before,'obsolete angle cannot replace live textures');
assert.equal(control.status.commits,1);
assert.equal(control.status.aborts,1);
console.log('[P510 ATOMIC SHADOW BAKER PASS]',JSON.stringify({writes,commits:control.status.commits,aborts:control.status.aborts,visiblePartialFrames:0,extraShadowResolutions:0}));
