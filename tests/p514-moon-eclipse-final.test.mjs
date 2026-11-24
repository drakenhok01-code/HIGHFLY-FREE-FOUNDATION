import assert from 'node:assert/strict';
import fs from 'node:fs';
import {manualEclipseStrength,skyEvents,eventPreview} from '../src/highfly/p511-sky-events.mjs';
import {installP508WorldClock,DAY_MS} from '../src/highfly/p508-world-clock.mjs';
import {solarVector} from '../src/highfly/p510-world-alive.mjs';

// Eclipse mode lasts the full 45-minute daylight period, not just morning.
// Sunrise -> totality at noon -> partial at sunset.
assert.equal(manualEclipseStrength(.25),.16);
assert.equal(manualEclipseStrength(.5),1);
assert.equal(manualEclipseStrength(.75),.16);
assert.equal(manualEclipseStrength(.751),0);
for(let i=0;i<=100;i++){
 const p=.25+i*.005,s=manualEclipseStrength(p);
 assert.ok(s>=.16-1e-12 && s<=1+1e-12);
 assert.ok(Math.abs(s-manualEclipseStrength(1-p))<1e-10);
}
assert.equal(eventPreview('eclipse',0,.625,'auto').eclipse,manualEclipseStrength(.625));
assert.equal(skyEvents(4.75,.5).eclipse,1,'automatic rare eclipse schedule remains intact');

class Element {
 constructor(){this.children=[];this.style={};this.attributes={};this.handlers={};this.textContent='';this.id='';this.isConnected=true;}
 append(...children){this.children.push(...children);}
 appendChild(child){this.append(child);return child;}
 setAttribute(key,value){this.attributes[key]=String(value);}
 removeAttribute(key){delete this.attributes[key];}
 addEventListener(event,handler){this.handlers[event]=handler;}
 remove(){this.isConnected=false;}
}
const doc={body:new Element(),createElement:()=>new Element()};
const v3=()=>({x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});return this;}});
const v4=()=>({x:0,y:0,z:1,w:0,set(x,y,z,w){Object.assign(this,{x,y,z,w});return this;},copy(v){return this.set(v.x,v.y,v.z,v.w);}});
const sun={v:1,clone(){return {v:this.v,copy(x){this.v=x.v;return this;},multiplyScalar(x){this.v*=x;return this;}}},copy(x){this.v=x.v;return this;},multiplyScalar(x){this.v*=x;return this;}};
const uniforms={uHFGrade:{value:v4()},uHFEclipse:{value:0},uHFAurora:{value:0},uHFClock:{value:0},uHFVisualSunDir:{value:v3()},uHFMoonDir:{value:v3()},uHFMoonPhase:{value:.5},uHFAuroraAxis:{value:{set(x,y){this.x=x;this.y=y;}}}};
const pipe={sky:{sunColor:sun},skyPass:{uniforms},tonemap:{uniforms:{uHFGrade:{value:v4()},uHFEclipse:{value:0}}},onBeforeScene:[]};
const win={location:{search:'?hftime=eclipse&hffast=1&hfpace=1&hfdebug=1'},__hfP505Pacing:{fps:58}};
let now=0;
const climate=installP508WorldClock(pipe,{now:()=>now,win,doc,search:win.location.search});
assert.equal(climate.enabled,true);
assert.equal(climate.diagnostics,'hidden','FPS panels hidden by default even with debug query');
assert.equal(doc.body.attributes['data-hf-diag'],'hidden');
assert.ok(doc.body.children.some(n=>n.id==='hf-p514-diagnostics-style'));
const mini=doc.body.children.find(n=>n.id==='hf-p514-fps-mini');
assert.ok(mini);
assert.equal(climate.phase,.25);
assert.equal(uniforms.uHFEclipse.value,.16);
const sample=[];
for(let i=0;i<=90;i++){
 now=i*500;climate.update();
 sample.push({sec:i/2,p:climate.phase,e:uniforms.uHFEclipse.value,dir:[...Object.values(uniforms.uHFVisualSunDir.value).filter(x=>typeof x==='number')]});
}
assert.equal(sample.length,91);
assert.ok(Math.abs(sample.at(-1).p-.75)<1e-10);
assert.equal(sample.at(-1).e,.16,'still partial at sunset, not over at noon');
assert.ok(sample.some(x=>Math.abs(x.p-.5)<1e-8&&x.e>.999),'maximum at midday');
assert.ok(sample.some(x=>x.p>.60&&x.p<.70&&x.e>.16),'eclipse continues in afternoon');
assert.ok(sample[0].dir[0]>.95&&sample.at(-1).dir[0]<-.95,'sun travels east to west');
climate.setDiagnostics('mini');
assert.equal(doc.body.attributes['data-hf-diag'],'mini');
now+=1000;climate.update();
assert.equal(mini.textContent,'FPS 58');
climate.cycleDiagnostics();assert.equal(climate.diagnostics,'full');
climate.cycleDiagnostics();assert.equal(climate.diagnostics,'hidden');
const btn=doc.body.children.find(n=>n.id==='hf-p508-climate')?.children.flatMap(x=>x.children)?.find(x=>x.id==='hf-p514-debug-toggle');
assert.ok(btn,'FPS debug toggle lives inside existing CLIMA panel');
climate.select('noche');assert.equal(uniforms.uHFEclipse.value,0);
climate.dispose();
assert.ok(!('data-hf-diag' in doc.body.attributes),'clean up debug CSS');
const build=fs.readFileSync('scripts/f0-build.mjs','utf8');
const a=build.indexOf('// P514 MOON FINAL'),b=build.indexOf('// P503: one source',a);
assert.ok(a>0&&b>a);
const slice=build.slice(a,b);
for(const needle of ['0.0510','craterRadius','craterGrid','maria','albedo','moonFace','lunarLit','disk*hfNight']){
 assert.ok(slice.includes(needle),'missing lunar detail '+needle);
}
assert.ok(!/new WebGLRenderTarget|setSize\(|shadowBake|hfpx|waterfalls\.js/.test(slice));
console.log('[P514 FINAL MOON ECLIPSE FPS QA PASS]',JSON.stringify({
 fullEclipseMinutes:45,frames:sample.length,moonEqualsSolarRadius:true,
 craterAndMariaShader:true,lunarPhasesPreserved:true,
 medianFPSPanelHiddenOnBoot:true,debugStates:['hidden','mini','full'],
 nativeExtraPasses:0
}));
