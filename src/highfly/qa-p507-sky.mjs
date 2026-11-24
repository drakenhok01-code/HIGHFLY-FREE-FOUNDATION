/** P507 — tests REAL native Sky.update logic with fake GPU resolve surface.
 * We model the exact input signature that the native RESOLVE GLSL samples.
 * This is a correctness test for redundant GPU work, NOT an Adreno FPS estimate.
 */
import assert from 'node:assert/strict';
import { Sky } from '../engine/sky.js';
const sky=Object.create(Sky.prototype);
sky.renderer={}; sky.env={name:'native 256x128 mipmapped environment'};
sky.cloudTime=2600;sky.windSpeed=1;sky.fadeSeconds=4;sky.tilesPerFrame=1;
sky.ready=true;sky.mix=1;sky.cursor=0;sky._bakeTarget=null;sky._needSH=false;
sky.cloudFront={texture:{name:'cloudFront'}};
sky.cloudBack={texture:{name:'cloudBack'}};
sky.cloudRaw={texture:{name:'cloudRaw'}};
sky.uniforms={
  uSkyAtmo:{value:{name:'atmo-original'}},
  uCloudA:{value:sky.cloudBack.texture},
  uCloudB:{value:sky.cloudFront.texture},
  uCloudMix:{value:1}
};
const signature=()=>[
 sky.uniforms.uSkyAtmo.value,
 sky.uniforms.uCloudA.value,
 sky.uniforms.uCloudB.value,
 sky.uniforms.uCloudMix.value
];
let draws=0,lastSignature=null,shaUpdates=0,started=0,finished=0;
sky.resolve={render(r,target){
  assert.equal(r,sky.renderer);
  if(target!==sky.env)throw Error('Unexpected test shader target');
  lastSignature=signature();
  draws++;
}};
sky._startSweep=function(){this._bakeTarget={};this.cursor=0;started++;};
sky._bakeCloudTiles=function(count){
  this.cursor+=count;
  return this.cursor>=256;
};
sky._finishSweep=function(instant){
  [this.cloudFront,this.cloudBack]=[this.cloudBack,this.cloudFront];
  this.uniforms.uCloudA.value=this.cloudBack.texture;
  this.uniforms.uCloudB.value=this.cloudFront.texture;
  this.mix=instant?1:0;
  this._bakeTarget=null;
  this._needSH=true;
  finished++;
};
sky._computeSHAsync=function(){shaUpdates++;};
sky.bakeFull=function(){
  // The real native path rebuilds atmosphere and cloud buffers.
  this.ready=true;
  this.uniforms.uSkyAtmo.value={name:'atmo-rebaked'};
  this.mix=1;this._bakeTarget=null;
};
const frames=1100;
for(let i=0;i<frames;i++){
  if(i===900)sky.invalidate();
  sky.update(1/60);
  const expected=signature(),got=lastSignature;
  assert.ok(got,'native sky env must have been initialized');
  // The source texture identities and blend factor must be EXACTLY equal.
  assert.ok(expected.every((v,j)=>v===got[j]),'sky reuse was stale at frame '+i);
}
assert.ok(finished>=1,'at least one real cloud sweep should complete');
assert.ok(started>=2,'cloud bakes should still run, no visual freeze');
assert.ok(shaUpdates>=1,'native sunlight spherical-harmonic updates remain active');
assert.ok((sky._hfP507EnvSkips||0)>200,'must actually skip redundant GPU draws');
assert.ok((sky._hfP507EnvDraws||0)>250,'must still render every frame of a real blend');
assert.ok(draws<frames*0.8,'expect fewer env GPU resolve passes than native unconditional path');
console.log('[P507 LOSSLESS SKY GPU PASS PASS]',JSON.stringify({
 frames,draws,skips:sky._hfP507EnvSkips,relativeSavedPercent:Math.round(100*(frames-draws)/frames),
 started,finished,shaUpdates,baseline:frames
}));
