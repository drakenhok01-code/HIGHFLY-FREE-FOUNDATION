import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  S23_ULTRA_MAX_PIXELS,highflyPhysicalDisplaySize,highflyDisplayReport
} from '../src/highfly/p498-native-display.mjs';
import {GRAPHICS,installHighflyGraphics} from '../src/highfly/visual-profile.mjs';

test('S23 landscape physical pixels: 915x412 CSS with DPR3 uses 2745x1236',()=>{
 const x=highflyPhysicalDisplaySize(915,412,{dpr:3});
 assert.equal(x.width,2745);assert.equal(x.height,1236);
 assert.equal(x.renderedDpr,3);
 assert.equal(x.capped,false);
 assert.equal(x.mode,'native');
});
test('DPR3.5 WQHD+ cap is aspect preserving and prevents GPU oversizing',()=>{
 const x=highflyPhysicalDisplaySize(915,412,{dpr:3.5});
 assert.ok(x.width*x.height<=S23_ULTRA_MAX_PIXELS);
 assert.ok(x.width>2800&&x.height>1200);
 assert.ok(Math.abs(x.width/x.height-915/412)<0.003);
 assert.equal(x.capped,true);
});
test('CSS comparison mode restores original 915x412 output, not 4K',()=>{
 const x=highflyPhysicalDisplaySize(915,412,{dpr:3.5,mode:'css'});
 assert.deepEqual([x.width,x.height],[915,412]);
 assert.equal(x.mode,'css');
});
test('GPU max texture and max renderbuffer limit the output coherently',()=>{
 const x=highflyPhysicalDisplaySize(915,412,{dpr:4,maxTextureSize:2048,maxRenderbufferSize:1500});
 assert.ok(x.width<=1500&&x.height<=1500);
 assert.ok(Math.abs(x.width/x.height-915/412)<0.004);
});
test('missing and invalid DPR never produce NaN pixel counts',()=>{
 for(const dpr of [undefined,0,-2,NaN,Infinity]){
  const x=highflyPhysicalDisplaySize(915,412,{dpr});
  assert.deepEqual([x.width,x.height],[915,412]);
 }
});
test('HIGHFLY native quality fixes scaling at 100% and disables silent governor',()=>{
 assert.equal(GRAPHICS.native.targetFps,0);
 assert.equal(GRAPHICS.native.renderScale,1);
 assert.equal(GRAPHICS.native.minRenderScale,1);
 assert.equal(GRAPHICS.native.cover,1);
 assert.equal(GRAPHICS.native.reflections,true);
 const values={preset:'medium',renderScale:.63,targetFps:50,shadows:true,shadowRate:2,
  softShadows:1,volumetrics:true,reflections:false,cover:.75,clouds:1,cloudRes:1024};
 const modes=[];
 const pipe={setHighflyDisplayMode:m=>modes.push(m),
  ao:{enabled:true},taa:{enabled:true,reset:false,pass:{uniforms:{uBlend:{value:.1}}}},
  tonemap:{uniforms:{uSharpen:{value:.3}}},bloomStrength:.1};
 const settings={values};
 const storage={getItem:()=>null,setItem(){}};
 const controls=installHighflyGraphics(pipe,settings,'?hfquality=native',storage);
 assert.equal(controls.selected,'native');
 assert.equal(values.targetFps,0);
 assert.equal(values.renderScale,1);
 assert.deepEqual(modes,['native']);
 assert.equal(pipe.taa.pass.uniforms.uBlend.value,.22);
 assert.equal(controls.set('legacy'),true);
 assert.deepEqual(modes,['native','css']);
 assert.equal(controls.set('native'),true);
 assert.deepEqual(modes,['native','css','native']);
});
test('A/B optional TAA off retains existing three scene and original renderer',()=>{
 const values={preset:'medium',renderScale:.63,targetFps:50,shadows:true,shadowRate:2,
  softShadows:1,volumetrics:true,reflections:false,cover:.75,clouds:1,cloudRes:1024};
 const pipe={setHighflyDisplayMode(){},ao:{enabled:true},
  taa:{enabled:true,reset:false,pass:{uniforms:{uBlend:{value:.1}}}},
  tonemap:{uniforms:{uSharpen:{value:.3}}}};
 installHighflyGraphics(pipe,{values},'?hfquality=native&hftaa=off',{getItem(){return null}});
 assert.equal(pipe.taa.enabled,false);
});
test('real pipeline patch preserves all original display-sized pass relationships',()=>{
 const build=fs.readFileSync('scripts/f0-build.mjs','utf8');
 assert.match(build,/highflyPhysicalDisplaySize\(this\.highflyCssW,this\.highflyCssH/);
 assert.match(build,/this\.renderer\.setSize\(this\.displayW,this\.displayH,false\)/);
 assert.match(build,/setHighflyDisplayMode/);
 assert.match(build,/installHighflyDisplayDiagnostics/);
 assert.match(build,/this\.taa\.reset = true/);
 const cfg=JSON.parse(fs.readFileSync('foundation.config.json','utf8'));
 assert.equal(cfg.unsungCommit,'9f61b0d80b18c6cf661f72372545b3f9214fb455');
});
test('diagnostic correctly confirms physical draw buffer and TAA history',()=>{
 const gl={drawingBufferWidth:2745,drawingBufferHeight:1236,
  MAX_RENDERBUFFER_SIZE:34024,getParameter:()=>8192};
 const c={width:2745,height:1236,clientWidth:915,clientHeight:412,
  getBoundingClientRect:()=>({width:915,height:412})};
 const p={renderer:{domElement:c,capabilities:{maxTextureSize:8192},getContext:()=>gl},
  highflyDisplayMode:'native',displayW:2745,displayH:1236,
  rw:2745,rh:1236,renderScale:1,taa:{enabled:true,history:[{width:2745,height:1236},{width:2745,height:1236}]},
  bloom:{mips:[{width:1372,height:618}]}};
 const d=highflyDisplayReport(p,{devicePixelRatio:3});
 assert.equal(d.synchronized,true);
 assert.equal(d.physicalCoverage,1);
 assert.deepEqual(d.drawingBuffer,[2745,1236]);
 assert.deepEqual(d.scene,[2745,1236]);
 assert.deepEqual(d.taaHistory,[[2745,1236],[2745,1236]]);
 p.rw=915;
 assert.equal(highflyDisplayReport(p,{devicePixelRatio:3}).synchronized,false);
});
