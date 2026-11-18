import test from 'node:test';
import assert from 'node:assert/strict';
import {fogLevel,installHighflyFog,FOG_KEY} from '../src/highfly/fog.mjs';
import {applyHighflyTouch} from '../src/highfly/mobile-touch.mjs';
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
