import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installP508WorldClock} from '../src/highfly/p508-world-clock.mjs';

// P515: the climate settings panel must live inside HIGHFLY's Options,
// never over the third-person adventure HUD. Native sky passes are unchanged.
const skySource=fs.readFileSync('src/highfly/p508-world-clock.mjs','utf8');
const menuSource=fs.readFileSync('src/highfly/premium-rpg.mjs','utf8');
assert.doesNotMatch(skySource,/open\.textContent=['"]☀ CLIMA/);
assert.match(menuSource,/data-hf-climate-controls/);
assert.match(menuSource,/__hfP508Climate\?\.mountControls\?\./);
assert.match(skySource,/root\.hidden=true/);
assert.match(skySource,/root\.style\.cssText='display:none!important'/);

class Element {
 constructor(){this.children=[];this.style={};this.attributes={};this.id='';this.hidden=false;this.textContent='';this.handlers={};this.parent=null;}
 append(...elements){for(const item of elements){if(item.parent)item.parent.children=item.parent.children.filter(x=>x!==item);item.parent=this;this.children.push(item);}}
 appendChild(x){this.append(x);return x;}
 setAttribute(k,v){this.attributes[k]=String(v);}
 removeAttribute(k){delete this.attributes[k];}
 addEventListener(k,cb){this.handlers[k]=cb;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}
}
const doc={body:new Element(),createElement:()=>new Element()};
const v3=()=>({set(){}});
const v4=()=>({x:0,y:0,z:1,w:0,set(x,y,z,w){Object.assign(this,{x,y,z,w});},copy(v){this.set(v.x,v.y,v.z,v.w);}});
const color={v:1,clone(){return {v:1,copy(x){this.v=x.v;return this;},multiplyScalar(n){this.v*=n;return this;}}},copy(x){this.v=x.v;return this;},multiplyScalar(n){this.v*=n;return this;}};
const sky={uHFGrade:{value:v4()},uHFAurora:{value:0},uHFEclipse:{value:0},uHFClock:{value:0},uHFVisualSunDir:{value:v3()},uHFMoonDir:{value:v3()},uHFMoonPhase:{value:.5},uHFAuroraAxis:{value:{set(){}}}};
const pipe={sky:{sunColor:color},skyPass:{uniforms:sky},tonemap:{uniforms:{uHFGrade:{value:v4()},uHFEclipse:{value:0}}},onBeforeScene:[]};
let tick=0;
const win={location:{search:'?hftime=eclipse'},__hfP505Pacing:{fps:50}};
const api=installP508WorldClock(pipe,{win,doc,now:()=>tick,search:win.location.search});
assert.equal(api.enabled,true);
const storage=doc.body.children.find(x=>x.id==='hf-p508-climate');
assert.ok(storage,'climate controls kept in hidden storage');
assert.equal(storage.hidden,true);
assert.equal(storage.children.length,1);
assert.equal(storage.children[0].children.some(x=>x.id==='hf-p514-debug-toggle'),true,'FPS diagnostics control preserved');
const optionsHost=new Element();
assert.equal(api.mountControls(optionsHost),true);
assert.equal(optionsHost.children.length,1);
assert.equal(storage.children.length,0,'settings moved out of hidden storage');
assert.equal(optionsHost.children[0].style.display,'block');
assert.equal(api.select('auto'),true);
assert.equal(api.setDiagnostics('mini'),true);
assert.equal(doc.body.attributes['data-hf-diag'],'mini');
assert.equal(api.mountControls(new Element()),true,'reattach across menu re-renders');
tick+=125;api.update();
api.dispose();
assert.ok(!pipe.onBeforeScene.includes(api.update),'clock scene hook removed');
console.log('[P515 CLIMATE IN OPTIONS QA PASS]');
