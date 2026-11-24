import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installP508WorldClock,DAY_MS,phaseGrade,GRADE} from '../src/highfly/p508-world-clock.mjs';
import {solarVector,eclipseDisplayVector,lunarVector} from '../src/highfly/p510-world-alive.mjs';
import {manualEclipseStrength,eventPreview,skyEvents} from '../src/highfly/p511-sky-events.mjs';

// User-approved anime scale factors relative to approved P512.
assert.ok(Math.abs(.0510/.0170-3)<1e-12);
assert.ok(Math.abs(.1575/.045-3.5)<1e-12);
assert.ok(Math.abs(.0680/.0170-4)<1e-12);
for(let i=0;i<=300;i++){
 const p=i/300;
 assert.deepEqual(eclipseDisplayVector(p,'eclipse'),solarVector(p),'manual eclipse must follow sun');
 assert.deepEqual(eclipseDisplayVector(p,'auto'),solarVector(p),'natural eclipse must follow sun');
 const e=manualEclipseStrength(p);
 assert.ok(e>=0&&e<=1,'totality envelope range');
}
assert.equal(manualEclipseStrength(.315),1);
assert.equal(manualEclipseStrength(.35),1);
assert.equal(manualEclipseStrength(.42),1);
assert.equal(manualEclipseStrength(.5),0,'eclipse day ends totality before noon');
assert.equal(manualEclipseStrength(.25),0,'no totality before sunrise');
assert.equal(manualEclipseStrength(.75),0,'no eclipse during sunset');
assert.equal(eventPreview('eclipse',0,.35,'auto').eclipse,1);
assert.equal(eventPreview('eclipse',0,.5,'auto').eclipse,0);
assert.equal(skyEvents(4.75,.5).eclipse,1,'rare automatic events unchanged');
const arch=solarVector(.35);
assert.ok(arch[0]>.8 && arch[1]>.49 && arch[1]<.6,'eclipse passes above east arch');
assert.ok(arch[2]>.1,'eclipse arch bearing correct');
assert.ok(solarVector(.5)[1]>.96,'eclipse continues above toward noon');
assert.ok(solarVector(.75)[0]<-.9,'eclipse day continues west to sunset');

const v3=(x=0,y=0,z=0)=>({x,y,z,set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}});
const v4=(x=0,y=0,z=1,w=0)=>({x,y,z,w,set(x,y,z,w){Object.assign(this,{x,y,z,w});return this;},copy(v){return this.set(v.x,v.y,v.z,v.w);}});
const color={n:1,clone(){return {n:this.n,copy(x){this.n=x.n;return this;},multiplyScalar(k){this.n*=k;return this;}}},copy(x){this.n=x.n;return this;},multiplyScalar(k){this.n*=k;return this;}};
const sky={uHFGrade:{value:v4()},uHFClock:{value:0},uHFAurora:{value:0},uHFEclipse:{value:0},uHFVisualSunDir:{value:v3()},uHFMoonDir:{value:v3()},uHFMoonPhase:{value:0},uHFAuroraAxis:{value:{set(x,y){this.x=x;this.y=y;}}}};
const pipe={sky:{sunColor:color},skyPass:{uniforms:sky},tonemap:{uniforms:{uHFGrade:{value:v4()},uHFEclipse:{value:0}}},onBeforeScene:[]};
let time=0;
const api=installP508WorldClock(pipe,{now:()=>time,search:'?hftime=eclipse&hffast=1&hfaurora=auto'});
assert.equal(api.mode,'eclipse');
assert.equal(api.speed,60);
assert.ok(Math.abs(api.phase-.315)<1e-10);
assert.equal(sky.uHFEclipse.value,1);
const results=[];
for(let k=0;k<=90;k++){
 time=k*500;api.update();
 results.push({t:k*.5,phase:api.phase,force:sky.uHFEclipse.value,x:sky.uHFVisualSunDir.value.x,y:sky.uHFVisualSunDir.value.y,moonX:sky.uHFMoonDir.value.x});
 assert.ok(Math.abs(sky.uHFVisualSunDir.value.x-sky.uHFMoonDir.value.x)<1e-9);
 assert.ok(Math.abs(sky.uHFVisualSunDir.value.y-sky.uHFMoonDir.value.y)<1e-9);
 assert.ok(Math.abs(sky.uHFEclipse.value-pipe.tonemap.uniforms.uHFEclipse.value)<1e-9);
 assert.deepEqual(api.grade,phaseGrade(api.phase));
}
assert.ok(results.some(x=>x.phase>.345&&x.phase<.355&&x.force>.99),'totality near eastern valley arch');
assert.ok(results.some(x=>x.phase>.46&&x.phase<.49&&x.force<1&&x.force>0),'eclipse fades into daylight');
assert.ok(results.some(x=>x.phase>.51&&x.phase<.55&&x.force===0),'ordinary daylight after eclipse');
assert.ok(results.some(x=>x.phase>.72&&x.phase<.77&&x.x<-.85),'eclipse SUN follows west toward sunset');
assert.ok(results.some(x=>x.phase>.48&&x.phase<.53&&x.y>.93),'sun rises to high noon');
const before=api.phase;
api.setSpeed(1);
assert.ok(Math.abs(api.phase-before)<1e-8,'speed toggle must not teleport sun');
api.select('eclipse');
assert.ok(Math.abs(api.phase-.315)<1e-10,'reselecting eclipse restarts moving event');
api.select('noche');
assert.equal(sky.uHFEclipse.value,0);
assert.deepEqual(api.grade,GRADE.noche);
api.dispose();

// P513 only changes native sky/tonemap shader fragments; no added GPU passes.
const build=fs.readFileSync('scripts/f0-build.mjs','utf8');
const a=build.indexOf('// P513 CELESTIAL HERO SCALE');
const b=build.indexOf('// P503: one source-of-truth',a);
assert.ok(a>0&&b>a);
const section=build.slice(a,b);
assert.equal((section.match(/patch\('src\/engine\/pipeline\.js'/g)||[]).length,9);
for(const token of ['hfHeroRadius','0.0510','0.0680','0.1575','0.9850','hfOcc','moonGlow','corona'])
 assert.ok(section.includes(token),'P513 shader missing '+token);
assert.ok(!/WebGLRenderTarget|shadowBake|setSize\(|hfpx|waterfalls\.js|three\.js|mesh/.test(section),'No new passes/geometry/pixel changes');
console.log('[P513 CELESTIAL HERO SCALE FULL-DAY PASS]',JSON.stringify({
 sunScale:3,moonScale:3.5,eclipseScale:4,
 simulatedFrames:results.length,
 peakNearEastArch:true,
 eclipseMovesWithSun:true,
 totalityFadesAsDayContinues:true,
 speedToggleContinuous:true,
 nativeExtraPasses:0
}));
