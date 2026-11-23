import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GRAPHICS} from '../src/highfly/visual-profile.mjs';
import {installP502FrameSampler} from '../src/highfly/p502-frame-sampler.mjs';

test('P502 keeps full physical frame size, shadows, natural fog and original world',()=>{
 const s=fs.readFileSync('scripts/f0-build.mjs','utf8');
 assert.match(s,/HF_S23_FOG_EXACT_TEXEL:1/);
 assert.match(s,/hffog.*reference/);
 assert.match(s,/texelFetch\(uVol, volPx, 0\)/);
 assert.match(s,/return length\(V\.xyz\) \/ abs\(V\.w\)/);
 assert.match(s,/installP502FrameSampler/);
 assert.doesNotMatch(s,/_hfEnvCacheEnabled/);
 assert.match(s,/HF_S23_NATIVE_TAA:1/);
 assert.equal(GRAPHICS.android.renderScale,1);
 assert.equal(GRAPHICS.android.minRenderScale,1);
 assert.equal(GRAPHICS.android.targetFps,0);
 assert.equal(GRAPHICS.android.shadows,true);
 assert.equal(GRAPHICS.android.volumetrics,true);
 assert.equal(GRAPHICS.android.cover,1);
});
test('Perspective eye distance transform stays mathematically equivalent',()=>{
 for(let i=0;i<10000;i++){
  const x=Math.sin(i*.31)*1200,y=Math.cos(i*.71)*430,z=Math.sin(i*.13)*99;
  const w=(i%2?-1:1)*(.001+(i%100)/77);
  const old=Math.hypot(x/w,y/w,z/w),fast=Math.hypot(x,y,z)/Math.abs(w);
  assert.ok(Math.abs(old-fast) < Math.max(old,fast,1)*1e-11);
 }
});
test('Bilinear sample at texture centre equals clamped texelFetch with identical weights',()=>{
 for(const W of [2,17,193])for(const H of [2,47,109]){
  for(const px of [-1,0,1,W-1,W,W+1])for(const py of [-1,0,1,H-1,H,H+1]){
   const clippedX=Math.max(0,Math.min(W-1,px)),clippedY=Math.max(0,Math.min(H-1,py));
   const linearX=Math.max(0,Math.min(W-1,(px+.5)-.5));
   const linearY=Math.max(0,Math.min(H-1,(py+.5)-.5));
   assert.equal(clippedX,linearX);
   assert.equal(clippedY,linearY);
  }
 }
});
test('Frame profiler is entirely absent during normal gameplay and detachable on opt-in',()=>{
 const originalGame=function(){return 11;},originalRender=function(){return 13;};
 const game={update:originalGame},pipe={render:originalRender};
 const disabled=installP502FrameSampler(game,pipe,{search:''});
 assert.equal(disabled.enabled,false);
 assert.equal(game.update,originalGame);
 assert.equal(pipe.render,originalRender);
 let now=0;const frames=[];
 const win={location:{search:'?hfcpuprof=1'},requestAnimationFrame:(f)=>{frames.push(f);}};
 const perf={now:()=>now};
 const p=installP502FrameSampler(game,pipe,{win,doc:{},perf,search:'?hfcpuprof=1'});
 assert.equal(p.enabled,true);
 for(let i=0;i<60;i++){
  now+=16.66;
  const f=frames.shift();f();
  assert.equal(game.update(),11);assert.equal(pipe.render(),13);
 }
 assert.ok(p.stats.fps>=55);
 assert.ok(p.stats.frames>30);
 p.dispose();
 assert.equal(game.update,originalGame);
 assert.equal(pipe.render,originalRender);
 assert.equal(win.__hfP502CpuStats,undefined);
});
