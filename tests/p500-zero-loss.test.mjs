import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installP500StageProfiler} from '../src/highfly/p500-stage-profiler.mjs';
import {GRAPHICS} from '../src/highfly/visual-profile.mjs';
test('zero-loss visual path never touches native render scale, vegetation, terrain, camera or pixel density',()=>{
 const script=fs.readFileSync('scripts/f0-build.mjs','utf8');
 assert.match(script,/hfsky.*reference/);
 assert.match(script,/hfChanged = hfEnvRebaked/);
 assert.match(script,/hfEnv\.cloudA !== hfUnits\.uCloudA\.value/);
 assert.match(script,/hfEnv\.cloudB !== hfUnits\.uCloudB\.value/);
 assert.match(script,/hfEnv\.atmo !== hfUnits\.uSkyAtmo\.value/);
 assert.match(script,/this\._hfEnvCacheStats\.skipped\+\+/);
 assert.match(script,/installP500StageProfiler/);
 assert.equal(GRAPHICS.android.renderScale,1);
 assert.equal(GRAPHICS.android.minRenderScale,1);
 assert.equal(GRAPHICS.android.targetFps,0);
 // The three original Unsung terrain URL patches are part of P4.9.8;
 // P5.0.0 must not introduce any further geometry or foliage modification.
 assert.equal((script.match(/patch\('src\/world\/terrain\.js'/g)||[]).length,3);
 assert.doesNotMatch(script,/patch\('src\/world\/flora\/forest\.js'/);
 assert.doesNotMatch(script,/patch\('src\/highfly\/p491-cc0-creatures\.mjs'/);
});
test('phase profiler defaults off, keeps all original method references and quality',()=>{
 const scene={},render=function(){return 42;};
 const pipe={render,scene,renderer:{render(){return 99;},getContext:()=>null}};
 const v=installP500StageProfiler(pipe,{search:''});
 assert.equal(v.enabled,false);
 assert.equal(pipe.render,render);
});
test('one asynchronous GPU query at a time, per-stage timings, no forced sync or renderer modification',()=>{
 let now=0,started=0,ended=0,deleted=0,active=0,maxActive=0;
 const ext={TIME_ELAPSED_EXT:7833,GPU_DISJOINT_EXT:777};
 const gl={getExtension:k=>k==='EXT_disjoint_timer_query_webgl2'?ext:null,
  createQuery(){return {id:++started};},beginQuery(t,q){assert.equal(t,7833);active++;maxActive=Math.max(maxActive,active);},
  endQuery(t){assert.equal(t,7833);active--;ended++;},
  getQueryParameter(q,k){return k===this.QUERY_RESULT_AVAILABLE?true:2100000;},
  getParameter(){return false;},deleteQuery(){deleted++;},
  QUERY_RESULT_AVAILABLE:45,QUERY_RESULT:46,finish(){throw Error('GPU synchronization forbidden');}};
 const scene={tag:'scene'},sceneT={tag:'water'};
 const pass=()=>({render(){now+=.03;return 1;}});
 const renderer={getContext:()=>gl,render(){now+=.1;return 8;}};
 const sky={update(){now+=.05;return 5;}},shadows={update(){now+=.08;return 6;}};
 const pipe={
  scene,sceneT,renderer,sky,shadows,
  copyPass:pass(),linDepthPass:pass(),volumetrics:pass(),fog:pass(),
  taa:pass(),bloom:pass(),tonemap:pass(),
  render(){sky.update();shadows.update();renderer.render(scene);renderer.render(sceneT);
    this.copyPass.render();this.linDepthPass.render();this.volumetrics.render();
    this.fog.render();this.taa.render();this.bloom.render();this.tonemap.render();return 18;}
 };
 const ref=pipe.render, renderRef=renderer.render;
 const windowFake={location:{search:'?hfphase=1'},requestAnimationFrame(){}};
 const p=installP500StageProfiler(pipe,{search:'?hfphase=1',win:windowFake,doc:{},perf:{now:()=>now}});
 assert.equal(p.enabled,true);
 for(let i=0;i<165;i++){now+=16;assert.equal(pipe.render(),18);}
 assert.equal(p.stats.frames,165);
 assert.ok(p.stats.stages.sky.count>0);
 assert.ok(p.stats.stages['terrain-3d'].count>0);
 assert.ok(p.stats.stages.shadows.gpuSamples>0);
 assert.ok(p.stats.stages.sky.gpuSamples>0);
 assert.equal(maxActive,1);
 assert.equal(active,0);
 assert.equal(started,ended);
 p.dispose();
 assert.equal(deleted,started);
 assert.equal(pipe.render,ref);assert.equal(renderer.render,renderRef);
 assert.equal(windowFake.__hfP500Stages,undefined);
});
