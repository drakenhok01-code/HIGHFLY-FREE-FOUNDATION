import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installP505FramePacing} from '../src/highfly/p505-frame-pacing.mjs';
import {GRAPHICS} from '../src/highfly/visual-profile.mjs';

test('normal P504 HDR run does not instrument RAF or change rendered pixels',()=>{
 let calls=0;
 const old=function(){calls++;return 71;};
 const pipe={render:old};
 const disabled=installP505FramePacing(pipe,{search:'?hfquality=android&hfpx=native&hfcompact=1'});
 assert.equal(disabled.enabled,false);
 assert.equal(pipe.render,old);
 assert.equal(pipe.render(),71);
 assert.equal(calls,1);
 assert.equal(GRAPHICS.android.renderScale,1);
 assert.equal(GRAPHICS.android.minRenderScale,1);
});
test('pacing metrics distinguish dropped vs regular frame delivery and restore wrapper',()=>{
 let clock=0;
 let calls=0;
 const original=function(){calls++;clock+=4;return 17;};
 const pipe={render:original};
 const win={__game:{state:'playing'}};
 const ctrl=installP505FramePacing(pipe,{search:'?hfpace=1',win,doc:{},perf:{now:()=>clock}});
 assert.equal(ctrl.enabled,true);
 assert.notEqual(pipe.render,original);
 for(let i=0;i<190;i++){
  clock+=(i%7===0?29:12.7);
  assert.equal(pipe.render(),17);
 }
 assert.equal(calls,190);
 assert.ok(ctrl.stats.ready);
 assert.ok(ctrl.stats.fps>45&&ctrl.stats.fps<65,JSON.stringify(ctrl.stats));
 assert.ok(ctrl.stats.p99Ms>35,JSON.stringify(ctrl.stats));
 assert.ok(ctrl.stats.over33Percent>7,JSON.stringify(ctrl.stats));
 assert.ok(ctrl.stats.medianCpuMs>=3.9&&ctrl.stats.medianCpuMs<=4.1);
 assert.equal(ctrl.stats.gpuMs,null,'must not invent Adreno GPU timing');
 ctrl.dispose();
 assert.equal(pipe.render,original);
 assert.equal(win.__hfP505Pacing,undefined);
});
test('pacing never includes home or loading and never mutates native game scheduler',()=>{
 let clock=0;
 const win={__game:{state:'home'}};
 const pipe={render(){clock+=3}};
 const ctrl=installP505FramePacing(pipe,{search:'?hfpace=1',win,doc:{},perf:{now:()=>clock}});
 for(let i=0;i<80;i++){clock+=12;pipe.render()}
 assert.equal(ctrl.stats.frames,0);
 assert.equal(ctrl.stats.fps,0);
 win.__game.state='playing';
 for(let i=0;i<100;i++){clock+=12;pipe.render()}
 assert.ok(ctrl.stats.frames>90);
 ctrl.dispose();
});
test('additional compact bloom passes are opt-in and consume only RGB HDR channels',()=>{
 const source=fs.readFileSync('scripts/f0-build.mjs','utf8');
 assert.match(source,/hfbloomcompact/);
 assert.match(source,/this\.bloom\._hfCompactHdr/);
 assert.match(source,/this\.mips\.push\(makeTarget\(w, h, this\._hfCompactHdr\)\)/);
 assert.match(source,/this\.ups\.push\(makeTarget\(w, h, this\._hfCompactHdr\)\)/);
 assert.match(source,/installP505FramePacing/);
 assert.match(source,/selectP504HdrFormat/);
 assert.match(source,/c\._hfCellX!==ci/);
 assert.doesNotMatch(source,/_hfEnvCacheEnabled/);
 const bloomOrig=fs.readFileSync('tests/p504-native-hdr.test.mjs','utf8');
 assert.ok(bloomOrig.length>1500);
});
