import assert from 'node:assert/strict';
import fs from 'node:fs';
import {solarVector,lunarVector,lunarPhase,shadowKey,shadowVector,installP510Astronomy,WORLD_DAY_MS,LUNAR_DAYS} from '../src/highfly/p510-world-alive.mjs';
import {DAY_MS,phaseGrade,installP508WorldClock,GRADE} from '../src/highfly/p508-world-clock.mjs';
assert.equal(WORLD_DAY_MS,DAY_MS);
assert.equal(LUNAR_DAYS,8);
const mag=v=>Math.hypot(...v);
for(let k=0;k<=240;k++){const p=k/240;
 const sun=solarVector(p),moon=lunarVector(p);
 assert.ok(Math.abs(mag(sun)-1)<1e-8);
 assert.ok(Math.abs(mag(moon)-1)<1e-8);
 assert.ok(sun.every(Number.isFinite)&&moon.every(Number.isFinite));
}
assert.ok(solarVector(.25)[0]>.9,'dawn sun eastern horizon');
assert.ok(solarVector(.5)[1]>.8,'day sun high');
assert.ok(solarVector(.75)[0]<-.9,'dusk sun western horizon');
assert.ok(solarVector(0)[1]<-.8,'midnight sun below horizon');
assert.ok(lunarVector(0)[1]>.8,'moon highest at midnight');
assert.equal(lunarPhase(0),.5);
assert.equal(lunarPhase(4),0);
assert.equal(lunarPhase(8),.5);
for(const p of [0,.05,.95])assert.equal(shadowKey(p),-1,'no solar rebuild at night');
assert.equal(shadowKey(.25),0);
assert.equal(shadowKey(.5),2);
assert.equal(shadowKey(.75),4);
for(let i=0;i<5;i++){
 const v=shadowVector(i);
 assert.ok(v.y>.15,'sun keyframe never uses near-horizontal raymarch');
 assert.ok(Math.abs(Math.hypot(v.x,v.y,v.z)-1)<1e-6);
}
const v3=(x=0,y=0,z=0)=>({x,y,z,set(x,y,z){Object.assign(this,{x,y,z});return this;}});
const v4=(x=0,y=0,z=1,w=0)=>({x,y,z,w,set(x,y,z,w){Object.assign(this,{x,y,z,w});return this;},copy(v){return this.set(v.x,v.y,v.z,v.w);}});
const color={x:1,clone(){return {x:this.x,copy(c){this.x=c.x;return this;},multiplyScalar(s){this.x*=s;return this;}}},copy(c){this.x=c.x;return this;},multiplyScalar(s){this.x*=s;return this;}};
const uniforms={
 uHFGrade:{value:v4()},uHFVisualSunDir:{value:v3()},
 uHFMoonDir:{value:v3()},uHFMoonPhase:{value:.5},
 uHFAuroraAxis:{value:{set(x,y){this.x=x;this.y=y;}}},
 uHFAurora:{value:1},uHFClock:{value:0},uHFEclipse:{value:0}
};
const render={sky:{sunColor:color},skyPass:{uniforms},tonemap:{uniforms:{uHFGrade:{value:v4()},uHFEclipse:{value:0}}},onBeforeScene:[]};
let t=0;
const now=()=>t;
const api=installP508WorldClock(render,{now,search:'?hftime=auto&hffast=1'});
assert.equal(api.enabled,true);
assert.equal(api.speed,60);
assert.equal(api.phase,.75);
assert.deepEqual(api.grade,GRADE.atardecer);
const samples=[];
for(let s=0;s<=45;s++){
 t=s*1000;
 api.update();
 // Actual P510 time-loop gets four phases in 45 seconds at x60.
 samples.push({sec:s,phase:api.phase,moon:uniforms.uHFMoonDir.value.y,sun:uniforms.uHFVisualSunDir.value.y});
}
assert.ok(samples.some(s=>s.phase<.02),'auto reaches midnight');
assert.ok(samples.some(s=>s.phase>.23&&s.phase<.27),'auto reaches sunrise');
assert.ok(samples.some(s=>s.phase>.48&&s.phase<.52),'auto reaches noon');
assert.ok(samples.some(s=>s.phase>.73&&s.phase<.77),'auto reaches sunset');
assert.ok(Math.abs(api.phase-.75)<1e-6,'45 seconds completes full cycle');
api.select('noche');assert.equal(api.phase,0);
api.setMoon(.25);assert.equal(uniforms.uHFMoonPhase.value,.25);
api.setMoon(.5);assert.equal(uniforms.uHFMoonPhase.value,.5);
api.select('eclipse');
assert.equal(uniforms.uHFEclipse.value,1);
assert.equal(uniforms.uHFMoonPhase.value,0);
assert.ok(Math.abs(uniforms.uHFVisualSunDir.value.x-uniforms.uHFMoonDir.value.x)<1e-9,'moon aligns with sun for eclipse');
api.select('dia');assert.equal(uniforms.uHFEclipse.value,0);
api.setAurora(false);assert.equal(uniforms.uHFAurora.value,0);
api.setSpeed(1);assert.equal(api.speed,1);
api.dispose();
const builder=fs.readFileSync('scripts/f0-build.mjs','utf8');
for(const needle of ['// P510 WORLD ALIVE','uHFMoonDir','uHFMoonPhase','uHFVisualSunDir','uHFAuroraAxis','p510-staged-shadows.mjs'])
 assert.ok(builder.includes(needle),'missing native insertion '+needle);
assert.ok(!builder.slice(builder.indexOf('// P510 WORLD ALIVE'),builder.indexOf('// P503: one source-of-truth')).includes("patch('src/world/waterfalls.js'"),'never touch waterfall geometry');
console.log('[P510 WORLD ALIVE FULL DAY QA PASS]',JSON.stringify({simulatedFrames:samples.length,dayMinutes:45,acceleratedSeconds:45,lunarDays:8,shadowKeys:5,auroraFacing:'arch east',eclipseAlignment:true}));
