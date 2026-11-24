import assert from 'node:assert/strict';
import fs from 'node:fs';
import {skyEvents,eventPreview} from '../src/highfly/p511-sky-events.mjs';
import {installP508WorldClock,DAY_MS,GRADE,phaseGrade} from '../src/highfly/p508-world-clock.mjs';
import {solarVector,lunarVector,lunarPhase} from '../src/highfly/p510-world-alive.mjs';

// Every normal night must display stars and moon without requiring aurora.
assert.equal(skyEvents(0.04,0).aurora,0);
assert.equal(skyEvents(2.05,0).aurora,0);
assert.equal(skyEvents(1.05,0).aurora,1); // one night after full moon
assert.equal(skyEvents(6.04,0).aurora,1); // extra post-quarter night
assert.equal(skyEvents(14.04,0).aurora,0); // NOT all half moons
assert.equal(skyEvents(22.02,0).aurora,1);
assert.equal(skyEvents(1.05,.5).aurora,0,'no daylight aurora');
assert.equal(skyEvents(1.05,.85).aurora<1,true,'fades into dark night');
assert.equal(skyEvents(1.05,.995).aurora,1);
assert.equal(skyEvents(1.05,.18).aurora<1,true,'fades before dawn');
assert.equal(skyEvents(4.75,.5).eclipse,1,'new moon day 4, near noon');
assert.equal(skyEvents(36.75,.5).eclipse,1,'next special eclipse after 32 days');
assert.equal(skyEvents(12.75,.5).eclipse,0,'ordinary new moons do not eclipse');
assert.equal(skyEvents(4.75,.75).eclipse,0,'not during sunset');
assert.equal(skyEvents(3.75,.5).eclipse,0,'not before new moon');
assert.equal(eventPreview('noche',1.05,0,'auto').aurora,0,'manual normal night is starry');
assert.equal(eventPreview('noche',1.05,0,true).aurora,1,'manual override for video QA');
assert.equal(eventPreview('auto',0,.25,false).aurora,0);
assert.equal(eventPreview('eclipse',0,.5,'auto').eclipse,1,'manual eclipse preview');

let auroraNights=[],eclipseDays=[];
for(let d=0;d<64;d++){
 if(skyEvents(d+0.05,0).aurora>.99)auroraNights.push(d);
 if(skyEvents(d+0.75,.5).eclipse>.99)eclipseDays.push(d);
}
assert.deepEqual(auroraNights,[1,6,9,17,22,25,33,38,41,49,54,57]);
assert.deepEqual(eclipseDays,[4,36]);
const v3=(x=0,y=0,z=0)=>({x,y,z,set(x,y,z){Object.assign(this,{x,y,z});return this;}});
const v4=(x=0,y=0,z=1,w=0)=>({x,y,z,w,set(x,y,z,w){Object.assign(this,{x,y,z,w});return this;},copy(v){return this.set(v.x,v.y,v.z,v.w);}});
const sunColor={n:1,clone(){return{n:this.n,copy(v){this.n=v.n;return this;},multiplyScalar(v){this.n*=v;return this;}}},copy(v){this.n=v.n;return this;},multiplyScalar(v){this.n*=v;return this;}};
const sky={uHFGrade:{value:v4()},uHFVisualSunDir:{value:v3()},uHFMoonDir:{value:v3()},uHFMoonPhase:{value:.5},uHFAuroraAxis:{value:{set(x,y){this.x=x;this.y=y;}}},uHFClock:{value:0},uHFAurora:{value:0},uHFEclipse:{value:0}};
const pipe={sky:{sunColor},skyPass:{uniforms:sky},tonemap:{uniforms:{uHFGrade:{value:v4()},uHFEclipse:{value:0}}},onBeforeScene:[]};
let now=0;const api=installP508WorldClock(pipe,{now:()=>now,search:'?hftime=auto&hffast=1&hfaurora=auto'});
assert.equal(api.enabled,true);
assert.equal(api.auroraSetting,'auto');
assert.equal(api.event.aurora,0);
assert.equal(api.event.eclipse,0);
assert.deepEqual(api.grade,GRADE.atardecer);
// Simulated 32-day sky timeline at 8Hz, fast-forwarded in deterministic steps.
for(let d=0;d<32;d++){
 now=(d+.25)*DAY_MS/60;
 api.update();
 assert.ok(Number.isFinite(api.phase));
}
now=(1.25)*DAY_MS/60;api.update();
assert.equal(api.phase,0);
assert.equal(sky.uHFAurora.value,1,'rare aurora automatically triggers');
assert.equal(sky.uHFEclipse.value,0);
now=(2.25)*DAY_MS/60;api.update();
assert.equal(sky.uHFAurora.value,0,'ordinary night is moon + stars');
now=(4.75)*DAY_MS/60;api.update();
assert.equal(sky.uHFEclipse.value,1,'rare eclipse automatically triggers');
assert.equal(pipe.tonemap.uniforms.uHFEclipse.value,1,'eclipse world illumination');
assert.ok(Math.abs(sky.uHFVisualSunDir.value.x-sky.uHFMoonDir.value.x)<1e-8,'celestial alignment');
now=(5.75)*DAY_MS/60;api.update();
assert.equal(sky.uHFEclipse.value,0,'eclipse ends');
api.select('noche');
assert.equal(sky.uHFAurora.value,0,'manual normal night is event-free');
api.setAurora(true);assert.equal(sky.uHFAurora.value,1);
api.setAurora(false);assert.equal(sky.uHFAurora.value,0);
api.setAurora('auto');assert.equal(api.auroraSetting,'auto');
api.select('eclipse');assert.equal(sky.uHFEclipse.value,1);
api.select('noche');assert.equal(sky.uHFEclipse.value,0);
api.dispose();
// Regression: all shaders are patched INSIDE original pipeline, not new GPU passes.
const build=fs.readFileSync('scripts/f0-build.mjs','utf8');
const section=build.slice(build.indexOf('// P511 SKY LEGEND'),build.indexOf('// P503: one source'));
assert.ok(section.length>2000,'P511 patches present');
assert.ok(section.includes("patch('src/engine/pipeline.js'"));
assert.ok(!section.includes("patch('src/world")&&!section.includes("new WebGLRenderTarget"),'no new passes/assets');
for(const fragment of ['hfNight','float crater','moonGlow','float ridge','float core','corona','hfOcc']){
 // crater and ridge terminology may differ in comments; use source-presence
 assert.ok(section.includes(fragment),'missing shader feature '+fragment);
}
assert.ok(build.includes("p511-sky-events.mjs"));
assert.ok(phaseGrade(0)[3]>0.99);
assert.ok(solarVector(.5)[1]>.8&&lunarVector(0)[1]>.8);
assert.equal(lunarPhase(0),.5);
console.log('[P511 SKY LEGEND AUTO-EVENT SIMULATION PASS]',JSON.stringify({daysSimulated:64,auroraNights:auroraNights.length,eclipses:eclipseDays.length,regularNights:64-auroraNights.length,moonPhaseDays:8,shaderPassesAdded:0,device:'Android GPU validation pending'}));
