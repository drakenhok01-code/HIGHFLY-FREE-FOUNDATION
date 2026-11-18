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
test('Jump: native Unsung player rises then lands on flat terrain',()=>{
 const p=new Player(flat);p.spawn(0,0,0);p.grounded=true;
 const input={move:{x:0,y:0},held:new Set(),pressed:new Set(['jump']),look:{x:0,y:0}};
 p.update(1/60,input,0);assert.ok(p.pos.y>.04,'jump impulse must lift capsule');
 input.pressed.clear();let maxY=p.pos.y;
 for(let n=0;n<140;n++){p.update(1/60,input,0);maxY=Math.max(maxY,p.pos.y);}
 assert.ok(maxY>.5,'jump reaches altitude');
 assert.ok(p.grounded&&Math.abs(p.pos.y)<.05,'jump returns to floor');
});
test('ROLL: original 0.62s dodge has effective i-frames then vulnerability',()=>{
 const p=new Player(flat);p.spawn(0,0,0);p.grounded=true;
 const input={move:{x:0,y:1},held:new Set(),pressed:new Set(['dodge']),look:{x:0,y:0}};
 p.update(1/60,input,0);assert.equal(p.state,'roll');input.pressed.clear();
 for(let n=0;n<10;n++)p.update(1/60,input,0);
 const hp=p.health;assert.equal(p.damage(12),false,'hit inside dodge i-frames');assert.equal(p.health,hp);
 for(let n=0;n<23;n++)p.update(1/60,input,0);
 assert.equal(p.damage(12),true,'hit outside i-frames');assert.equal(p.health,hp-12);
});
test('Unsung original attack combo respects 1→2→3 queued strikes',()=>{
 const p=new Player(flat);p.spawn(0,0,0);p.grounded=true;
 const input={move:{x:0,y:0},held:new Set(),pressed:new Set(['attack']),look:{x:0,y:0}};
 p.update(1/60,input,0);assert.equal(p.comboStep,0);assert.equal(p.state,'attack');
 input.pressed.clear();
 for(let n=0;n<18;n++)p.update(1/60,input,0);
 input.pressed.add('attack');p.update(1/60,input,0);assert.equal(p.comboStep,1);
 input.pressed.clear();
 for(let n=0;n<18;n++)p.update(1/60,input,0);
 input.pressed.add('attack');p.update(1/60,input,0);assert.equal(p.comboStep,2);
});
test('Unsung swim is buoyancy and forward motion, not a proven swimming animation',()=>{
 const water={...flat,waterLevel:()=>3};
 const p=new Player(water);p.spawn(0,0,0);p.grounded=true;
 const input={move:{x:0,y:1},held:new Set(),pressed:new Set(),look:{x:0,y:0}};
 for(let n=0;n<140;n++)p.update(1/60,input,0);
 assert.equal(p.state,'swim');assert.ok(p.pos.y>.8&&p.pos.y<2.5,'float near surface');
 assert.ok(p.pos.z>2,'forward motion in deep water');
});

test('DASH impulse applies actual Unsung capsule movement in forward/back/side and preserves player physics',async()=>{
 const {installHighflyDash,DASH}=await import('../src/highfly/dash.mjs');
 for(const point of [[64,4],[64,124],[124,64],[4,64]]){
  const p=installHighflyDash(new Player(flat));p.spawn(0,0,0);p.grounded=true;
  const input={move:joystickVector(rect,...point),held:new Set(),pressed:new Set(['dash']),look:{x:0,y:0}};
  const stamina=p.stamina;p.update(1/60,input,0);
  assert.equal(p.state,'hf_dash');assert.equal(p.stamina,stamina,'F0.10 cooldown-only emergency dash');
  assert.ok(Math.hypot(p.pos.x,p.pos.z)>.1);
  input.pressed.clear();
  for(let n=0;n<16;n++)p.update(1/60,input,0);
  assert.equal(p.state,'move');
  assert.ok(Math.hypot(p.pos.x,p.pos.z)>2,'DASH moves character in actual capsule collision update');
  assert.ok(p._hfDashCd>0);
  assert.ok(DASH.time<.3);
 }
});
test('DASH refuses spam on cooldown; grants brief i-frames, not permanent immunity',async()=>{
 const {installHighflyDash,DASH}=await import('../src/highfly/dash.mjs');
 const p=installHighflyDash(new Player(flat));p.spawn(0,0,0);p.grounded=true;
 const i={move:{x:0,y:1},held:new Set(),pressed:new Set(['dash'])};
 p.update(1/60,i,0);assert.equal(p.state,'hf_dash');
 i.pressed.clear();
 for(let n=0;n<5;n++)p.update(1/60,i,0);
 let hp=p.health;assert.equal(p.damage(5),false,'mid-DASH i-frames must evade');
 assert.equal(p.health,hp);
 for(let n=0;n<15;n++)p.update(1/60,i,0);
 assert.equal(p.state,'move');
 i.pressed.add('dash');p.update(1/60,i,0);assert.equal(p.state,'move','cooldown blocks repeat');
 for(let n=0;n<310;n++){i.pressed.clear();p.update(1/60,i,0);}
 i.pressed.add('dash');p.update(1/60,i,0);assert.equal(p.state,'hf_dash','DASH usable after cooldown');
});
test('DASH respects original capsule world collision at a hard wall',async()=>{
 const {installHighflyDash}=await import('../src/highfly/dash.mjs');
 const wall={...flat,resolveCapsule(pos){if(pos.z>1)pos.z=1;if(pos.y<=0)pos.y=0;return pos.y<=0}};
 const p=installHighflyDash(new Player(wall));p.spawn(0,0,0);p.grounded=true;
 const inp={move:{x:0,y:1},held:new Set(),pressed:new Set(['dash'])};
 p.update(1/60,inp,0);inp.pressed.clear();
 for(let n=0;n<20;n++)p.update(1/60,inp,0);
 assert.ok(p.pos.z<=1.0001,'dash never teleports through wall');
});

test('DASH stops completely after letting go: no residual ice-skating',async()=>{
 const {installHighflyDash}=await import('../src/highfly/dash.mjs');
 const p=installHighflyDash(new Player(flat));p.spawn(0,0,0);p.grounded=true;
 const input={move:{x:0,y:1},held:new Set(),pressed:new Set(['dash']),look:{x:0,y:0}};
 p.update(1/60,input,0);input.pressed.clear();input.move={x:0,y:0};
 for(let i=0;i<16;i++)p.update(1/60,input,0);
 assert.equal(p.state,'move');
 assert.ok(Math.hypot(p.vel.x,p.vel.z)<.06,'DASH end cannot retain impulse');
 const place=p.pos.clone();
 for(let i=0;i<22;i++)p.update(1/60,input,0);
 assert.ok(p.pos.distanceTo(place)<.08,'Player must not skate after releasing stick');
});
test('DASH ends in active new joystick direction, not its original impulse',async()=>{
 const {installHighflyDash}=await import('../src/highfly/dash.mjs');
 const p=installHighflyDash(new Player(flat));p.spawn(0,0,0);p.grounded=true;
 const input={move:{x:0,y:1},held:new Set(),pressed:new Set(['dash']),look:{x:0,y:0}};
 p.update(1/60,input,0);input.pressed.clear();input.move={x:-1,y:0};
 for(let i=0;i<16;i++)p.update(1/60,input,0);
 assert.equal(p.state,'move');
 assert.ok(p.vel.x>3&&p.vel.x<6,'New joystick steers the landing');
 assert.ok(Math.abs(p.vel.z)<.3,'Old dash direction has been released');
});
