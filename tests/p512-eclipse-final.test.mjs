import assert from 'node:assert/strict';
import fs from 'node:fs';
import {solarVector,eclipseDisplayVector,lunarPhase} from '../src/highfly/p510-world-alive.mjs';
import {installP508WorldClock,DAY_MS,GRADE} from '../src/highfly/p508-world-clock.mjs';
import {skyEvents} from '../src/highfly/p511-sky-events.mjs';

// P512: manual eclipse is deliberately visible ABOVE the eastern valley arch.
const arch=[0.993,0,0.12];
const manual=eclipseDisplayVector(.5,'eclipse');
const horizontal=Math.hypot(manual[0],manual[2]);
const archFacing=(manual[0]*arch[0]+manual[2]*arch[2])/(Math.hypot(arch[0],arch[2])*horizontal);
assert.ok(Math.abs(Math.hypot(...manual)-1)<1e-10);
assert.ok(manual[1]>=.47&&manual[1]<=.58,'eclipse must be well above horizon');
assert.ok(archFacing>.999,'eclipse must face the main valley arch');
assert.ok(manual[0]>.82&&manual[2]>.07,'eastern arch, not the southern aurora');
for(const phase of [0,.125,.25,.375,.5,.625,.75,.875,1]){
 const normal=solarVector(phase),auto=eclipseDisplayVector(phase,'auto');
 assert.deepEqual(auto,normal,'automatic sunrise/sunset orbit cannot jump during eclipse');
}
assert.ok(eclipseDisplayVector(.5,'auto')[1]>.96,'rare automatic noon eclipse remains high above player');
assert.ok(eclipseDisplayVector(.75,'atardecer')[0]<-.9,'sunset remains west');

const v3=(x=0,y=0,z=0)=>({x,y,z,set(x,y,z){Object.assign(this,{x,y,z});return this;}});
const v4=(x=0,y=0,z=1,w=0)=>({x,y,z,w,set(x,y,z,w){Object.assign(this,{x,y,z,w});},copy(v){this.set(v.x,v.y,v.z,v.w);}});
const color={v:1,clone(){return{v:this.v,copy(v){this.v=v.v;return this;},multiplyScalar(f){this.v*=f;return this;}}},copy(v){this.v=v.v;return this;},multiplyScalar(f){this.v*=f;return this;}};
const sky={
 uHFGrade:{value:v4()},uHFEclipse:{value:0},uHFAurora:{value:0},uHFClock:{value:0},
 uHFVisualSunDir:{value:v3()},uHFMoonDir:{value:v3()},uHFMoonPhase:{value:.5},
 uHFAuroraAxis:{value:{set(x,y){this.x=x;this.y=y;}}}
};
let time=0;
const pipe={sky:{sunColor:color},skyPass:{uniforms:sky},
 tonemap:{uniforms:{uHFGrade:{value:v4()},uHFEclipse:{value:0}}},
 onBeforeScene:[]};
const ui=installP508WorldClock(pipe,{now:()=>time,search:'?hftime=eclipse&hfaurora=auto'});
assert.equal(ui.mode,'eclipse');
assert.equal(sky.uHFEclipse.value,1);
assert.equal(pipe.tonemap.uniforms.uHFEclipse.value,1);
assert.equal(sky.uHFMoonPhase.value,0);
assert.ok(sky.uHFVisualSunDir.value.x>.82);
assert.ok(Math.abs(sky.uHFVisualSunDir.value.y-.52)<1e-8);
assert.ok(Math.abs(sky.uHFVisualSunDir.value.x-sky.uHFMoonDir.value.x)<1e-8);
assert.ok(Math.abs(sky.uHFVisualSunDir.value.y-sky.uHFMoonDir.value.y)<1e-8);
assert.ok(color.v<.35,'eclipse dims light');
ui.select('dia');
assert.equal(sky.uHFEclipse.value,0);
assert.deepEqual(ui.grade,GRADE.dia);
ui.select('atardecer');
assert.ok(sky.uHFVisualSunDir.value.x<-.9);
ui.select('auto');
assert.equal(sky.uHFEclipse.value,0);
ui.dispose();

// P511 rare eclipse scheduling remains unchanged.
assert.equal(skyEvents(4.5,.5).eclipse,1);
assert.equal(skyEvents(12.5,.5).eclipse,0);
assert.equal(lunarPhase(0),.5);

// Ensure no new GPU pass or map/geometry/quality changes in P512 delta.
const build=fs.readFileSync('scripts/f0-build.mjs','utf8');
const start=build.indexOf('// P512 ECLIPSE FINAL');
const end=build.indexOf('// P503: one source-of-truth',start);
assert.ok(start>0&&end>start);
const patch=build.slice(start,end);
assert.equal((patch.match(/patch\('src\/engine\/pipeline\.js'/g)||[]).length,9);
for(const token of ['0.0156,0.0170','0.0154,0.0168','0.01740','0.0240',
 'hfRubySky','uHFEclipse*0.82','vec3(2.35,0.94,0.54)'])
 assert.ok(patch.includes(token),'Missing P512 final feature '+token);
assert.ok(!/WebGLRenderTarget|shadowBake|setSize\(|shadowRes|hfpx|waterfalls\.js/.test(patch),
 'Must not add render targets, adjust quality, terrain or waterfall resources');
console.log('[P512 ECLIPSE FINAL PASS]',JSON.stringify({
 solarAngularIncreasePercent:Math.round((.017/.014-1)*100),
 manualEclipseElevationDegrees:Math.round(Math.asin(manual[1])*180/Math.PI),
 archAzimuthAlignment:archFacing.toFixed(4),
 automaticEclipseSunZenith:solarVector(.5)[1].toFixed(3),
 redSkyAndWorldGrade:true,
 unchangedAutoOrbit:true,
 nativeGPUExtraPasses:0
}));
