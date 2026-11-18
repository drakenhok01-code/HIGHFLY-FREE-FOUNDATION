// Synthetic DOM / PointerEvent-level test of the REAL mobile-touch adapter.
// Browser APIs are mocked. This does NOT assert hardware multitouch on Samsung.
import test from 'node:test';
import assert from 'node:assert/strict';
import {attachHighflyTouch,applyHighflyTouch} from '../src/highfly/mobile-touch.mjs';
class El {
 constructor(type){this.type=type;this.handlers={};this.style={};this.dataset={};this.hidden=false;this.children=[];this.className=type;}
 addEventListener(name,cb){(this.handlers[name]??=[]).push(cb);}
 dispatch(name,id=1,x=0,y=0){const ev={pointerId:id,clientX:x,clientY:y,button:0,preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true},stopImmediatePropagation(){this.immediate=true}};for(const cb of this.handlers[name]??[])cb(ev);return ev;}
 setPointerCapture(id){this.captured=id;}
 setAttribute(key,value){this[key]=value;}
 getBoundingClientRect(){return {left:0,top:0,width:128,height:128};}
 append(...xs){this.children.push(...xs);}
 querySelector(s){return this.parts?.[s]??null;}
 querySelectorAll(s){return s==='[data-a]'?this.parts?.buttons??[]:[];}
}
test('Pointer multitouch: stick steering + independent camera + isolated ATK',()=>{
 const previous={document:globalThis.document,matchMedia:globalThis.matchMedia,addEventListener:globalThis.addEventListener,location:globalThis.location};
 try{
  const root=new El('root'),stick=new El('stick'),knob=new El('knob'),cam=new El('cam');
  const btns=['attack','jump','dodge','interact','sprint','dash','fullscreen'].map(a=>Object.assign(new El('button'),{dataset:{a}}));
  root.parts={'.stick':stick,'.knob':knob,'.cam':cam,buttons:btns};
  const fakeDoc={head:new El('head'),body:new El('body'),createElement:t=>t==='div'&&fakeDoc.divs++===0?root:new El(t),divs:0,addEventListener(){}};
  globalThis.document=fakeDoc;globalThis.matchMedia=()=>({matches:true});globalThis.addEventListener=()=>{};globalThis.location={search:''};
  const input={_dx:0,_dy:0,move:{x:0,y:0},pressed:new Set(),held:new Set(),enabled:true};
  attachHighflyTouch(input);
  assert.ok(input.highflyTouch,'Android should install UI');
  stick.dispatch('pointerdown',1,64,64);
  stick.dispatch('pointermove',1,124,64);
  applyHighflyTouch(input);
  assert.ok(input.move.x>.9&&Math.abs(input.move.y)<.05,'real stick event goes lateral');
  assert.equal(input.pressed.has('attack'),false,'moving joystick does not attack');
  cam.dispatch('pointerdown',2,70,70);
  cam.dispatch('pointermove',2,100,80);
  assert.equal(input._dx,48);assert.equal(input._dy,16);
  stick.dispatch('pointerdown',3,64,124);
  stick.dispatch('pointermove',3,64,124);
  applyHighflyTouch(input);assert.ok(input.move.x>.9,'other finger cannot hijack stick pointer');
  stick.dispatch('pointerup',1,124,64);applyHighflyTouch(input);
  assert.deepEqual(input.move,{x:0,y:0},'stick resets when finger lifts');
  btns[0].dispatch('pointerdown',4,10,10);input.pressed.clear();applyHighflyTouch(input);
  assert.ok(input.pressed.has('attack'),'ATK button is only explicit attack source');
  input.pressed.clear();applyHighflyTouch(input);assert.ok(!input.pressed.has('attack'),'ATK is one shot');
  cam.dispatch('pointermove',2,120,80);assert.equal(input._dx,80,'camera continues after stick release');
 }finally{for(const [k,v] of Object.entries(previous))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
// Sprint is an explicit tap-toggle. DASH is a one-shot that never stays pressed.
test('CORRER tap toggles ON/OFF while the first finger keeps steering; DASH only pulses once',()=>{
 const saved={document:globalThis.document,matchMedia:globalThis.matchMedia,addEventListener:globalThis.addEventListener,location:globalThis.location};
 try{
  const root=new El('root'),stick=new El('stick'),knob=new El('knob'),cam=new El('cam'),dash=new El('dash'),sprint=new El('sprint');
  sprint.dataset={a:'sprint'};dash.dataset={a:'dash'};
  root.parts={'.stick':stick,'.knob':knob,'.cam':cam,'.dash':dash,buttons:[sprint,dash]};
  const doc={head:new El('head'),body:new El('body'),divs:0,createElement:t=>t==='div'&&doc.divs++===0?root:new El(t),addEventListener(){}};
  globalThis.document=doc;globalThis.matchMedia=()=>({matches:true});globalThis.addEventListener=()=>{};globalThis.location={search:''};
  const input={_dx:0,_dy:0,move:{x:0,y:0},pressed:new Set(),held:new Set(),enabled:true};
  attachHighflyTouch(input);
  stick.dispatch('pointerdown',10,64,12);
  sprint.dispatch('pointerdown',11,160,40);applyHighflyTouch(input);
  assert.ok(input.held.has('sprint'),'one tap should enable running');
  assert.ok(input.move.y>.5,'left thumb remains on joystick');
  input.held.clear();applyHighflyTouch(input);assert.ok(input.held.has('sprint'),'tap toggle persists after release');
  dash.dispatch('pointerdown',12,64,64);input.pressed.clear();applyHighflyTouch(input);
  assert.equal(input.pressed.has('dash'),false,'DASH waits for finger release');
  dash.dispatch('pointermove',12,114,64);
  dash.dispatch('pointerup',12,114,64);input.pressed.clear();applyHighflyTouch(input);
  assert.ok(input.pressed.has('dash'),'DASH is a distinct release pulse');
  assert.ok(input.highflyAbilityAim.dash?.x>.9,'rightward ability drag overrides left stick');
   input.pressed.clear();applyHighflyTouch(input);
   dash.dispatch('pointerdown',14,93,91);
   dash.dispatch('pointerup',14,93,91); // off-center, but no finger movement
   applyHighflyTouch(input);
   assert.ok(input.pressed.has('dash'),'off-center simple tap still activates DASH');
   assert.equal(input.highflyAbilityAim.dash,null,'button rim tap is not a diagonal aim');
  input.pressed.clear();applyHighflyTouch(input);assert.ok(!input.pressed.has('dash'),'DASH must not repeat');
  sprint.dispatch('pointerdown',13,160,40);input.held.clear();applyHighflyTouch(input);
  assert.ok(!input.held.has('sprint'),'second tap disables running');
 }finally{for(const [k,v] of Object.entries(saved))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});

test('Android action drawer opens and climb is held; equip/mine/sit are isolated one-shot actions',()=>{
 const prior={document:globalThis.document,matchMedia:globalThis.matchMedia,addEventListener:globalThis.addEventListener,location:globalThis.location};
 try{
  const root=new El('root'),stick=new El('stick'),knob=new El('knob'),cam=new El('cam'),panel=new El('panel');
  panel.hidden=true;
  const btns=['actions','climb','equip','mine','chop','sit','lie','cheer','pickup'].map(a=>Object.assign(new El('button'),{dataset:{a}}));
  root.parts={'.stick':stick,'.knob':knob,'.cam':cam,'.action-panel':panel,buttons:btns};
  const doc={head:new El('head'),body:new El('body'),divs:0,createElement:t=>t==='div'&&doc.divs++===0?root:new El(t),addEventListener(){}};
  globalThis.document=doc;globalThis.matchMedia=()=>({matches:true});globalThis.addEventListener=()=>{};globalThis.location={search:''};
  const input={_dx:0,_dy:0,move:{x:0,y:0},pressed:new Set(),held:new Set(),enabled:true};
  attachHighflyTouch(input);
  btns[0].dispatch('pointerdown',1);
  assert.equal(panel.hidden,false,'actions menu must visibly open');
  btns[1].dispatch('pointerdown',2);
  applyHighflyTouch(input);
  assert.equal(input.pressed.has('climb'),true);
  assert.equal(input.held.has('climb'),true,'hold-to-climb must be continuous');
  btns[1].dispatch('pointerup',2);input.held.clear();input.pressed.clear();applyHighflyTouch(input);
  assert.equal(input.held.has('climb'),false,'release must stop climbing');
  for(const [index,action] of [[2,'equip'],[3,'mine'],[5,'sit'],[7,'cheer']]){
    btns[index].dispatch('pointerdown',3+index);
    input.pressed.clear();applyHighflyTouch(input);
    assert.equal(input.pressed.has(action),true,action+' reaches native Input');
    input.pressed.clear();applyHighflyTouch(input);
    assert.equal(input.pressed.has(action),false,action+' is not repeated');
  }
  btns[0].dispatch('pointerdown',20);assert.equal(panel.hidden,true);
 }finally{for(const [k,v] of Object.entries(prior))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
