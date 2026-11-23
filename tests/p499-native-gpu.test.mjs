import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installP499GpuDiagnostics} from '../src/highfly/p499-native-profiler.mjs';
import {GRAPHICS} from '../src/highfly/visual-profile.mjs';

test('P499 preserves native physical render scale / object quality and the five-tap reference A/B switch',()=>{
 assert.equal(GRAPHICS.android.renderScale,1);
 assert.equal(GRAPHICS.android.minRenderScale,1);
 assert.equal(GRAPHICS.android.targetFps,0);
 assert.equal(GRAPHICS.android.cover,1);
 const build=fs.readFileSync('scripts/f0-build.mjs','utf8');
 assert.match(build,/HF_S23_NATIVE_TAA:1/);
 assert.match(build,/hfperf'\)===\x27reference\x27/);
 assert.match(build,/if\(x!=0 && y!=0\) continue/);
 assert.match(build,/m1 \/= 5\.0/);
 assert.match(build,/installP499GpuDiagnostics/);
 assert.match(build,/installAndroidPhysicalResolution/);
 assert.doesNotMatch(build,/patch\('src\/world\/flora\/forest\.js'/);
});
test('CPU FPS and GPU queries are asynchronous: no forced GPU fence or state mutation',()=>{
 let t=0;const fakePerf={now:()=>t};
 let renders=0,started=0,ended=0,deleted=0,readouts=0;
 const ext={TIME_ELAPSED_EXT:777,GPU_DISJOINT_EXT:999};
 const gl={getExtension:(v)=>v==='EXT_disjoint_timer_query_webgl2'?ext:null,
  createQuery:()=>({id:++started}),
  beginQuery:(typ,o)=>{assert.equal(typ,777);assert.ok(o)},
  endQuery:(typ)=>{assert.equal(typ,777);ended++},
  getQueryParameter:(q,param)=>{readouts++;return param===44?true:15000000},
  QUERY_RESULT_AVAILABLE:44, QUERY_RESULT:45,
  getParameter:()=>false,
  deleteQuery:(q)=>{assert.ok(q);deleted++},
  finish:()=>{throw Error('Frame time must not call gl.finish()');}};
 const pipe={renderer:{getContext:()=>gl,info:{render:{calls:47,triangles:153000}}},
  render(dt){renders++;assert.equal(dt,1/60);return 123;}};
 const win={location:{search:''}};
 const monitor=installP499GpuDiagnostics(pipe,{win,doc:{},perf:fakePerf,search:'?hfperf=measure'});
 for(let i=0;i<100;i++){t+=16.6;assert.equal(pipe.render(1/60),123)}
 assert.equal(renders,100);
 assert.ok(monitor.stats.fps>=55 && monitor.stats.fps<=63);
 assert.equal(monitor.stats.drawCalls,47);
 assert.equal(monitor.stats.triangles,153000);
 assert.ok(started>=2);assert.equal(ended,started);
 assert.ok(readouts>0);assert.equal(monitor.stats.gpuMs,15);
 monitor.dispose();assert.equal(deleted,started);
 assert.equal(typeof pipe.render,'function');
 assert.equal(win.__hfGpuStats,undefined);
});
test('supported images and native animal inventory remain untouched',()=>{
 const s=fs.readFileSync('src/highfly/visual-profile.mjs','utf8');
 assert.match(s,/shadows: true/);
 assert.match(s,/volumetrics: true/);
 assert.match(s,/cover: 1/);
 assert.ok(fs.existsSync('src/highfly/p41-world-loot.mjs'));
 assert.ok(fs.existsSync('src/highfly/p49-hunt-world.mjs'));
});
