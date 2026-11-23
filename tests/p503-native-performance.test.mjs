import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installP503OpaqueCopy} from '../src/highfly/p503-opaque-copy.mjs';
import {GRAPHICS} from '../src/highfly/visual-profile.mjs';

test('P503 normal mode makes no GPU copy changes and maintains Android physical pixels',()=>{
 let oldCalls=0,copyCalls=0;
 const old=function(){oldCalls++};
 const copyPass={render:old,uniforms:{uTex:{value:'source'}}};
 const renderer={copyTextureToTexture(){copyCalls++},initRenderTarget(){}};
 const pipe={copyPass,renderer};
 const result=installP503OpaqueCopy(pipe,{search:'?hfquality=android&hfpx=native'});
 assert.equal(result.enabled,false);
 assert.equal(copyPass.render,old);
 assert.equal(copyCalls,0);
 assert.equal(GRAPHICS.android.renderScale,1);
 assert.equal(GRAPHICS.android.minRenderScale,1);
 assert.equal(GRAPHICS.android.targetFps,0);
});
test('GPU copy reuses exact source/target and initializes destination once per resize',()=>{
 const src={texture:{name:'HDR'},width:1080,height:500};
 const dst={texture:{name:'same HDR'},width:1080,height:500};
 let init=0,copy=0,old=0;
 const renderer={initRenderTarget(rt){assert.equal(rt,dst);init++},
  copyTextureToTexture(a,b){assert.equal(a,src.texture);assert.equal(b,dst.texture);copy++}};
 const oldRender=function(r,target){old++;return 'shader'};
 const copyPass={render:oldRender,uniforms:{uTex:{value:src.texture}}};
 const pipe={copyPass,rtScene:src,rtOpaque:dst,renderer};
 const x=installP503OpaqueCopy(pipe,{search:'?hffastcopy=1'});
 assert.equal(x.enabled,true);
 copyPass.render(renderer,dst);
 copyPass.render(renderer,dst);
 assert.equal(init,1);
 assert.equal(copy,2);assert.equal(old,0);
 copyPass.render(renderer,{width:1080,height:500});
 assert.equal(old,1);
 const resized={texture:{name:'new HDR'},width:2160,height:1080};
 const src2={texture:{name:'new scene'},width:2160,height:1080};
 pipe.rtScene=src2;pipe.rtOpaque=resized;copyPass.uniforms.uTex.value=src2.texture;
 renderer.initRenderTarget=(rt)=>{assert.equal(rt,resized);init++};
 renderer.copyTextureToTexture=(a,b)=>{assert.equal(a,src2.texture);assert.equal(b,resized.texture);copy++};
 copyPass.render(renderer,resized);assert.equal(init,2);
 assert.equal(copy,3);
 x.dispose();assert.equal(copyPass.render,oldRender);
});
test('GPU copy failure uses original shader, never leaves blank frame',()=>{
 const src={texture:{},width:42,height:20},dst={texture:{},width:42,height:20};
 let draws=0,throws=0;
 const shader=()=>{draws++};
 const pipe={rtScene:src,rtOpaque:dst,copyPass:{render:shader,uniforms:{uTex:{value:src.texture}}},
  renderer:{initRenderTarget(){},copyTextureToTexture(){throws++;throw Error('unsupported GPU copy')}}};
 const a=installP503OpaqueCopy(pipe,{search:'?hffastcopy=1'});
 pipe.copyPass.render(pipe.renderer,dst);
 pipe.copyPass.render(pipe.renderer,dst);
 assert.equal(a.failed,1);assert.equal(throws,1);
 assert.equal(draws,2,'shader fallback must render full frame after unsupported fastcopy');
 a.dispose();assert.equal(pipe.copyPass.render,shader);
});
test('base P502 render quality and mobile movement unchanged',()=>{
 const script=fs.readFileSync('scripts/f0-build.mjs','utf8');
 assert.match(script,/installP503OpaqueCopy/);
 assert.match(script,/src\/world\/flora\/grass\.js/);
 assert.match(script,/c\._hfCellX!==ci/);
 assert.match(script,/c\._hfCellZ!==cj/);
 assert.match(script,/HF_S23_NATIVE_TAA:1/);
 assert.doesNotMatch(script,/_hfEnvCacheEnabled/);
 assert.doesNotMatch(script,/patch\('src\/world\/flora\/forest\.js'/);
});
