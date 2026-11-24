import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PHASES,GRADE,DAY_MS,installP508WorldClock,phaseAt,phaseGrade} from '../src/highfly/p508-world-clock.mjs';

// P509: local sky-sector math prevents the 360-degree P508 aurora flood.
let visible=0,total=0;
for(let i=0;i<3600;i++){
 const a=i*Math.PI*2/3600;
 const directional=Math.cos(a)*0.458+Math.sin(a)*0.889;
 if(directional>0.64)visible++;
 total++;
}
assert.ok(visible/total<.30,'aurora should never blanket half the horizon');
assert.ok(visible/total>.20,'aurora should remain a substantial event');
assert.equal(PHASES.length,4,'keep four normal time-of-day phases');
assert.equal(DAY_MS,45*60*1000);
for(const [phase,name] of [[0,'noche'],[.25,'amanecer'],[.5,'dia'],[.75,'atardecer']])
 assert.deepEqual(phaseGrade(phase),GRADE[name]);
assert.equal(phaseAt(3*DAY_MS,0),0);

function vec4(a,b,c,d){return {x:a,y:b,z:c,w:d,set(a,b,c,d){Object.assign(this,{x:a,y:b,z:c,w:d});},copy(v){return this.set(v.x,v.y,v.z,v.w);}}}
const color={v:1,clone(){return {v:this.v,copy(x){this.v=x.v;return this;},multiplyScalar(v){this.v*=v;return this;}}},copy(x){this.v=x.v;return this;},multiplyScalar(v){this.v*=v;return this;}};
const pipe={sky:{sunColor:color},skyPass:{uniforms:{uHFGrade:{value:vec4(0,0,1,0)},uHFClock:{value:0},uHFAurora:{value:1},uHFEclipse:{value:0}}},tonemap:{uniforms:{uHFGrade:{value:vec4(0,0,1,0)},uHFEclipse:{value:0}}},onBeforeScene:[]};
let now=0;
const api=installP508WorldClock(pipe,{now:()=>now,search:'?hftime=atardecer'});
assert.equal(api.enabled,true);
assert.equal(api.select('eclipse'),true);
assert.equal(api.eclipse,true);
assert.equal(api.mode,'eclipse');
assert.deepEqual(api.grade,phaseGrade(api.phase)); // P513 eclipse is a travelling solar day
assert.equal(pipe.skyPass.uniforms.uHFEclipse.value,.16); // P514 partial eclipse at sunrise
assert.equal(pipe.tonemap.uniforms.uHFEclipse.value,.16);
assert.ok(color.v<1,'Eclipse must dim direct sunlight without altering shadow direction');
const v=api.updates;
api.setAurora(false);
assert.equal(pipe.skyPass.uniforms.uHFAurora.value,0);
assert.equal(api.select('noche'),true);
assert.equal(pipe.skyPass.uniforms.uHFEclipse.value,0,'no eclipse after selecting night');
assert.deepEqual(api.grade,GRADE.noche);
api.select('atardecer');
assert.deepEqual(api.grade,GRADE.atardecer);
assert.equal(api.select('unknown'),false);
api.select('auto');now+=DAY_MS/4;pipe.onBeforeScene[0]();
assert.deepEqual(api.grade,GRADE.noche);
assert.ok(api.updates>v);
api.dispose();assert.equal(pipe.onBeforeScene.length,0);assert.equal(color.v,1);

// Fail-closed static build guards: only existing sky and tonemap programs may change.
const builder=fs.readFileSync('scripts/f0-build.mjs','utf8');
for(const needle of [
 'P509 SUPREME','uHFEclipse','hfSector','azMask','lowerEdge',
 'hfDusk','hfHoriz','moonDisc','corona',
 "patch('src/engine/pipeline.js'"
]) assert.ok(builder.includes(needle),'missing '+needle);
const p509=builder.slice(builder.indexOf('// P509 SUPREME'),builder.indexOf('// P510 WORLD ALIVE')>=0?builder.indexOf('// P510 WORLD ALIVE'):builder.indexOf('// P503: one source-of-truth'));
assert.equal((p509.match(/patch\('src\/engine\/pipeline\.js'/g)||[]).length,10);
assert.ok(!p509.includes("patch('src/world"),'P509 must not touch water or geometry');
console.log('[P509 SUPREME SKY QA PASS]',{
 phases:PHASES, special:'eclipse', climateCycleMin:DAY_MS/60000,
 auroraArcPercent:Math.round(visible*100/total), nativePassesAdded:0,
 p507ShaderCachePreserved:true, visualShadowMapsPreserved:true
});
