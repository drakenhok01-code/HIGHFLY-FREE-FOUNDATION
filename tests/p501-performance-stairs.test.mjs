import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GRAPHICS} from '../src/highfly/visual-profile.mjs';
import {installP499GpuDiagnostics} from '../src/highfly/p499-native-profiler.mjs';
import {installP501StageProfiler} from '../src/highfly/p501-stage-profiler.mjs';

test('P501 starts from the faster P499 shader; maintains real native pixels and world quality',()=>{
 const build=fs.readFileSync('scripts/f0-build.mjs','utf8');
 assert.match(build,/HF_S23_NATIVE_TAA:1/);
 assert.match(build,/if\(x!=0 && y!=0\) continue/);
 assert.doesNotMatch(build,/_hfEnvCacheEnabled/);
 assert.equal(GRAPHICS.android.renderScale,1);
 assert.equal(GRAPHICS.android.minRenderScale,1);
 assert.equal(GRAPHICS.android.targetFps,0);
 assert.equal(GRAPHICS.android.cover,1);
 assert.equal(GRAPHICS.android.shadows,true);
 assert.equal(GRAPHICS.android.volumetrics,true);
 assert.match(build,/patch\('src\/world\/arch\/sites\.js'/);
 assert.match(build,/q\.mat_\(M\.PAVING\)\.box\(-6\.6, -1\.05, -4\.5, 7\.1, 1\.17, 9, '-y'\)/);
 assert.match(build,/qa-p501-stair-apron/);
 assert.match(build,/installP501StageProfiler/);
 assert.doesNotMatch(build,/patch\('src\/world\/flora\/forest\.js'/);
});

test('No invisible GPU profiler runs during normal Android gameplay',()=>{
 const render=function(){return 15;},scene={},win={location:{search:''}};
 const pipe={render,scene,renderer:{render(){},getContext(){throw Error('no GPU queries unless user opts in')}}};
 const p=installP499GpuDiagnostics(pipe,{win,doc:{},search:''});
 const q=installP501StageProfiler(pipe,{win,doc:{},search:''});
 assert.equal(p.enabled,false);
 assert.equal(q.enabled,false);
 assert.equal(pipe.render,render);
 p.dispose();q.dispose();
});
test('Opt-in stage profiler samples original methods without changing objects or pixel scale',()=>{
 let now=0,started=0,ended=0,deleted=0,active=0,maxActive=0;
 const ext={TIME_ELAPSED_EXT:777,GPU_DISJOINT_EXT:999};
 const gl={getExtension:k=>k==='EXT_disjoint_timer_query_webgl2'?ext:null,
  createQuery:()=>({id:++started}),
  beginQuery:()=>{active++;maxActive=Math.max(maxActive,active)},
  endQuery:()=>{active--;ended++},
  getQueryParameter(q,k){return k===this.QUERY_RESULT_AVAILABLE?true:1200000},
  getParameter:()=>false,deleteQuery:()=>{deleted++},
  QUERY_RESULT_AVAILABLE:44,QUERY_RESULT:45,finish:()=>{throw Error('forbidden sync')}};
 const scene={name:'scene'},sceneT={name:'water'};
 const fake=()=>({render(){now+=.03;}});
 const renderer={getContext:()=>gl,render(){now+=.1;}};
 const pipe={scene,sceneT,render(){
  this.sky.update();this.shadows.update();this.renderer.render(scene);
  this.renderer.render(sceneT);this.fog.render();this.taa.render();this.bloom.render();this.tonemap.render();return 9;
 },renderer,sky:{update(){now+=.05}},shadows:{update(){now+=.05}},
 fog:fake(),taa:fake(),bloom:fake(),tonemap:fake(),copyPass:fake(),linDepthPass:fake(),volumetrics:fake()};
 const orig=pipe.render,origRenderer=renderer.render;
 const win={location:{search:'?hfphase=1'},requestAnimationFrame(){}};
 const p=installP501StageProfiler(pipe,{search:'?hfphase=1',win,doc:{},perf:{now:()=>now}});
 assert.equal(p.enabled,true);
 for(let i=0;i<150;i++){now+=16;assert.equal(pipe.render(),9);}
 assert.equal(p.stats.frames,150);
 assert.ok(p.stats.stages.sky.count>0);
 assert.ok(p.stats.stages.shadows.gpuSamples>0);
 assert.equal(maxActive,1);assert.equal(active,0);assert.equal(started,ended);
 p.dispose();
 assert.equal(deleted,started);
 assert.equal(pipe.render,orig);
 assert.equal(renderer.render,origRenderer);
});
