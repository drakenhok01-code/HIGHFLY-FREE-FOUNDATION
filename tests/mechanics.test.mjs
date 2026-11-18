import test from 'node:test';
import assert from 'node:assert/strict';
import {fogLevel,installHighflyFog,FOG_KEY} from '../src/highfly/fog.mjs';
import {applyHighflyTouch,joystickVector} from '../src/highfly/mobile-touch.mjs';
test('Fog 35 percent persists and changes both original uniforms',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const pipe={fog:{haze:{x:0.00004},mist:{x:0.0002}}};
 const settings=installHighflyFog(pipe,storage);
 assert.equal(settings.value,.35);assert.ok(Math.abs(pipe.fog.haze.x-.000014)<1e-12);assert.ok(Math.abs(pipe.fog.mist.x-.00007)<1e-12);
 settings.set(1);assert.equal(values.get(FOG_KEY),'1');assert.equal(pipe.fog.mist.x,.0002);
});
test('Fog invalid and out-of-range data is clamped',()=>{
 assert.equal(fogLevel(null),.35);assert.equal(fogLevel('NaN'),.35);assert.equal(fogLevel('8'),1);assert.equal(fogLevel('-4'),0);
});
test('Touch actions reach native input, and HUD is hidden outside gameplay',()=>{
 const root={hidden:true},t={x:.4,y:.8,root,pressed:new Set(['attack','jump']),held:new Set(['sprint'])};
 const input={highflyTouch:t,enabled:true,pressed:new Set(),held:new Set(),move:{x:0,y:0}};
 applyHighflyTouch(input);assert.deepEqual(input.move,{x:.4,y:.8});assert.ok(input.pressed.has('attack'));assert.ok(input.held.has('sprint'));
 assert.equal(root.hidden,false);assert.equal(t.pressed.size,0);
 input.enabled=false;applyHighflyTouch(input);assert.equal(root.hidden,true);
});

test('Joystick analog: eight directions match WASD native input',()=>{
 const r={left:10,top:20,width:128,height:128};
 const cx=74,cy=84,delta=55;
 const dirs=[
  {name:'up',px:cx,py:cy-delta,x:0,y:1},
  {name:'down',px:cx,py:cy+delta,x:0,y:-1},
  {name:'right',px:cx+delta,py:cy,x:1,y:0},
  {name:'left',px:cx-delta,py:cy,x:-1,y:0},
  {name:'up-right',px:cx+delta,py:cy-delta,x:1,y:1},
  {name:'up-left',px:cx-delta,py:cy-delta,x:-1,y:1},
  {name:'down-right',px:cx+delta,py:cy+delta,x:1,y:-1},
  {name:'down-left',px:cx-delta,py:cy+delta,x:-1,y:-1}
 ];
 for(const d of dirs){
  const v=joystickVector(r,d.px,d.py);
  assert.equal(Math.sign(v.x),Math.sign(d.x),d.name+' X');
  assert.equal(Math.sign(v.y),Math.sign(d.y),d.name+' Y');
  assert.ok(Math.hypot(v.x,v.y)<=1+1e-9,d.name+' bounded');
 }
});
test('Joystick center is stationary, diagonals normalized, any angle supported',()=>{
 const r={left:0,top:0,width:128,height:128};
 assert.deepEqual(joystickVector(r,64,64),{x:0,y:0});
 const q=joystickVector(r,128,0);
 assert.ok(q.x>0.6&&q.y>0.6,'top-right diagonal');
 assert.ok(Math.abs(Math.hypot(q.x,q.y)-1)<1e-9);
 const v=joystickVector(r,95,48);
 assert.ok(v.x>0&&v.y>0,'analog noncardinal angle');
});

test('Eight-way joystick steering remains independent from ATK one-shot inputs',()=>{
 const r={left:0,top:0,width:128,height:128};
 for(const [px,py] of [[4,64],[124,64],[64,4],[64,124],[4,4],[124,4],[4,124],[124,124]])assert.ok(Math.hypot(...Object.values(joystickVector(r,px,py)))>.9);
 const t={root:{hidden:true},x:-1,y:0,pressed:new Set(),held:new Set()};
 const input={highflyTouch:t,enabled:true,pressed:new Set(),held:new Set(),move:{x:0,y:0}};
 applyHighflyTouch(input);assert.equal(input.move.x,-1);assert.equal(input.pressed.has('attack'),false);
 t.pressed.add('attack');applyHighflyTouch(input);assert.equal(input.pressed.has('attack'),true);
 input.pressed.clear();applyHighflyTouch(input);assert.equal(input.pressed.has('attack'),false);
});

// KayKit GLTFLoader sanitizes node names; asset loader must accept both raw and normalized names.
test('KayKit runtime accepts sanitized hand socket name and no longer hides FREE 1H_Sword',async()=>{
 const fs=await import('node:fs');
 const code=fs.readFileSync('src/highfly/kaykit-free-hero.mjs','utf8');
 assert.match(code,/handslotr/);
 assert.match(code,/this.socket\?\?=handFallback\?\?this.root/);
 assert.doesNotMatch(code,/HIDE=new Set\(\['1H_Sword'/);
 assert.match(code,/dash:'Dodge_Forward'/);
});
