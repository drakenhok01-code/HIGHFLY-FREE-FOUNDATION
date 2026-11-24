import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DAY_MS, PHASES, GRADE, phaseGrade, phaseAt, installP508WorldClock } from '../src/highfly/p508-world-clock.mjs';
assert.equal(DAY_MS,2700000);
assert.deepEqual(PHASES,['amanecer','dia','atardecer','noche']);
for (const [phase,name] of [[0,'noche'],[.25,'amanecer'],[.5,'dia'],[.75,'atardecer']]){
 assert.deepEqual(phaseGrade(phase),GRADE[name]);
}
assert.deepEqual(phaseGrade(1),GRADE.noche);
assert.deepEqual(phaseGrade(-.5),GRADE.dia);
assert.equal(phaseAt(DAY_MS,0),0);
assert.equal(phaseAt(DAY_MS*.5,0),.5);
function vec4(a,b,c,d){return {x:a,y:b,z:c,w:d,set(a,b,c,d){Object.assign(this,{x:a,y:b,z:c,w:d});},copy(v){return this.set(v.x,v.y,v.z,v.w);}};}
const grades=()=>({value:vec4(0,0,1,0)});
const color={v:1,clone(){return {v:this.v,copy(x){this.v=x.v;return this;},multiplyScalar(f){this.v*=f;return this;}}},copy(x){this.v=x.v;return this;},multiplyScalar(f){this.v*=f;return this;}};
const pipe={sky:{sunColor:color},skyPass:{uniforms:{uHFGrade:grades(),uHFAurora:{value:1},uHFClock:{value:0}}},tonemap:{uniforms:{uHFGrade:grades()}},onBeforeScene:[]};
let now=0;
const api=installP508WorldClock(pipe,{now:()=>now});
assert.equal(api.enabled,true);
assert.equal(api.mode,'atardecer');
assert.deepEqual(api.grade,GRADE.atardecer);
assert.equal(pipe.onBeforeScene.length,1);
for(const name of PHASES){assert.equal(api.select(name),true);assert.deepEqual(api.grade,GRADE[name]);}
assert.equal(api.select('inválido'),false);
api.select('noche');assert.ok(color.v<.2,'nighttime light reduced');
api.setAurora(false);assert.equal(pipe.skyPass.uniforms.uHFAurora.value,0);
api.setAurora(true);assert.equal(pipe.skyPass.uniforms.uHFAurora.value,1);
api.select('auto');assert.deepEqual(api.grade,GRADE.atardecer);
now+=DAY_MS/4;pipe.onBeforeScene[0]();assert.deepEqual(api.grade,GRADE.noche);
now+=DAY_MS/4;pipe.onBeforeScene[0]();assert.deepEqual(api.grade,GRADE.amanecer);
now+=DAY_MS/4;pipe.onBeforeScene[0]();assert.deepEqual(api.grade,GRADE.dia);
api.dispose();assert.equal(pipe.onBeforeScene.length,0);assert.equal(color.v,1);
const source=fs.readFileSync('scripts/f0-build.mjs','utf8');
for(const token of ['hfHash','uHFAurora','uHFGrade','vec3(0.74,0.85,1.2)','p508-world-clock.mjs']){
 assert.ok(source.includes(token),'Missing native shader/source '+token);
}
assert.doesNotMatch(source,/patch\('src\/world\/waterfalls\.js'/);
console.log('[P508 WORLD CLOCK / NATIVE SKY CHECK PASS]',{states:PHASES.length,autoMinutes:45,aurora:true,stars:true,moon:true});
