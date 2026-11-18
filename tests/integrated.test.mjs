import test from 'node:test';
import assert from 'node:assert/strict';
import {Player} from '../.work/unsung/src/game/player.js';
import {joystickVector} from '../src/highfly/mobile-touch.mjs';
const flat={waterLevel:()=>-1000000,groundHeight:()=>0,floorBelow:()=>0,resolveCapsule(p){if(p.y<=0){p.y=0;return true;}return false;}};
const rect={left:0,top:0,width:128,height:128};
const dirs={N:[64,4],S:[64,124],E:[124,64],W:[4,64],NE:[106,22],NW:[22,22],SE:[106,106],SW:[22,106]};
function sim(point,yaw=0){
 const p=new Player(flat);p.spawn(0,0,0);p.grounded=true;
 const input={move:joystickVector(rect,...point),held:new Set(),pressed:new Set(),look:{x:0,y:0}};
 for(let n=0;n<120;n++)p.update(1/60,input,yaw);
 return [p.pos.x,p.pos.z,p];
}
test('REAL Unsung capsule moves for all eight joystick directions in a collision-ready flat world',()=>{
 const v=Object.fromEntries(Object.entries(dirs).map(([k,point])=>[k,sim(point)]));
 for(const [k,[x,z]] of Object.entries(v))assert.ok(Math.hypot(x,z)>3.5,k+' stays stationary');
 assert.ok(v.N[1]>3&&v.S[1]<-3);
 assert.ok(v.E[0]<-3&&v.W[0]>3);
 for(const k of ['NE','NW','SE','SW'])assert.ok(Math.abs(v[k][0])>2&&Math.abs(v[k][1])>2,k+' diagonal');
});
test('Camera rotation changes direction of real Unsung movement',()=>{
 const a=sim(dirs.N,0),b=sim(dirs.N,Math.PI/2);
 assert.ok(a[1]>3&&Math.abs(a[0])<.5);
 assert.ok(b[0]>3&&Math.abs(b[1])<.5);
});
test('Joystick movement never triggers attack, explicit ATK triggers first combo',()=>{
 const [,,p]=sim(dirs.W,0);assert.equal(p.state,'move');
 const input={move:{x:0,y:0},pressed:new Set(['attack']),held:new Set(),look:{x:0,y:0}};
 p.update(1/60,input,0);assert.equal(p.state,'attack');assert.equal(p.comboStep,0);
});
test('Native input excludes pointer lock and mouse attacks for Android',async()=>{
 const fs=await import('node:fs');const source=fs.readFileSync('.work/unsung/src/game/input.js','utf8');
 assert.match(source,/if \(this.highflyTouch\) return; \/\/ never lock mouse/);
 assert.match(source,/if \(this.highflyTouch\) return; \/\/ never turn touch/);
});