import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installP502AutoProfiler} from '../src/highfly/p502-fps-audit.mjs';

test('P502 benchmark is dormant in every normal game and cannot alter native rendering',()=>{
 const orig=()=>1,pipe={render:orig,renderer:{getContext(){throw Error('no automatic GPU instrumentation')}}};
 const result=installP502AutoProfiler(pipe,{win:{location:{search:'?hfquality=android&hfpx=native'}}});
 assert.equal(result.enabled,false);
 assert.equal(pipe.render,orig);
 assert.equal(pipe.shadows,undefined);
 const builder=fs.readFileSync('scripts/f0-build.mjs','utf8');
 assert.match(builder,/installP502AutoProfiler/);
 assert.doesNotMatch(builder,/_hfEnvCacheEnabled/);
 assert.match(builder,/HF_S23_NATIVE_TAA:1/);
});

test('P502 opt-in benchmark samples six stages and restores shadows, TAA, volumetrics and bloom exactly',()=>{
 let t=0,frameCallback=null;
 const win={location:{search:'?hffpsaudit=1'},requestAnimationFrame(fn){frameCallback=fn;return 42;},cancelAnimationFrame(){}};
 const bloomRender=function(){return 'texture'};
 const pipe={shadows:{enabled:true},volumetrics:{enabled:true},taa:{enabled:true,reset:false},
  bloom:{render:bloomRender,mips:[{texture:'glow'}]},bloomStrength:.065};
 const test=installP502AutoProfiler(pipe,{win,doc:{},now:()=>t,search:'?hffpsaudit=1'});
 assert.equal(test.enabled,true);
 let seen={};let frames=0;
 while(!test.finished&&frames<2600){
  t+=33.4;frameCallback?.();frames++;
  if(!pipe.shadows.enabled)seen.shadows=true;
  if(!pipe.volumetrics.enabled)seen.vol=true;
  if(!pipe.taa.enabled)seen.taa=true;
  if(pipe.bloom.render!==bloomRender)seen.bloom=true;
 }
 assert.equal(test.finished,true);
 assert.ok(seen.shadows&&seen.vol&&seen.taa&&seen.bloom,'all opt-in passes measured');
 assert.equal(test.results.length,6);
 assert.equal(pipe.shadows.enabled,true);
 assert.equal(pipe.volumetrics.enabled,true);
 assert.equal(pipe.taa.enabled,true);
 assert.equal(pipe.bloom.render,bloomRender);
 assert.equal(pipe.bloomStrength,.065);
 assert.ok(test.results.every(x=>x.fps>25&&x.samples>70));
 assert.equal(win.__hfP502Results.results.length,6);
 test.dispose();
});
