import test from 'node:test';
import assert from 'node:assert/strict';
import {Player} from '../.work/unsung/src/game/player.js';
import {installHighflyDash} from '../.work/unsung/src/game/highfly-dash.mjs';
import {installUniversalActions,nearestResource,findMantle,ACTIONS} from '../.work/unsung/src/game/highfly-universal.mjs';
const flat={waterLevel:()=>-1e6,groundHeight:()=>0,floorBelow:()=>0,
 resolveCapsule(pos){if(pos.y<=0){pos.y=0;return true;}return false;}};
const inp=()=>({move:{x:0,y:0},held:new Set(),pressed:new Set(),look:{x:0,y:0}});
const make=(world=flat)=>{const p=installUniversalActions(installHighflyDash(new Player(world)));p.spawn(0,0,0);p.grounded=true;return p;};
test('Same original Player capsule, 1st jump + exactly 1 air jump, landing resets',()=>{
 const p=make(),i=inp();
 i.pressed.add('jump');p.update(1/60,i,0);i.pressed.clear();
 for(let n=0;n<12;n++)p.update(1/60,i,0);
 assert.ok(!p.grounded&&p.airTime>.1);
 const previous=p.vel.y,remaining=p.stamina;
 i.pressed.add('jump');p.update(1/60,i,0);i.pressed.clear();
 assert.equal(p._hfAirJumpUsed,true);assert.ok(p.vel.y>previous+1);
 assert.ok(p.stamina<remaining);assert.ok(p._hfJumpVisual>.3);
 for(let n=0;n<8;n++)p.update(1/60,i,0);
 const v=p.vel.y;i.pressed.add('jump');p.update(1/60,i,0);i.pressed.clear();
 assert.ok(p.vel.y<v+.5,'No third jump');
 for(let n=0;n<180;n++)p.update(1/60,i,0);
 assert.ok(p.grounded);assert.equal(p._hfAirJumpUsed,false);
});
test('ROLL retains Unsung 0.62s original i-frames with universal controller installed',()=>{
 const p=make(),i=inp();i.move={x:0,y:1};i.pressed.add('dodge');p.update(1/60,i,0);
 assert.equal(p.state,'roll');i.pressed.clear();
 for(let n=0;n<10;n++)p.update(1/60,i,0);
 assert.equal(p.damage(10),false,'original i-frames preserved');
});
test('ATK 1→2→3 still uses original Unsung combo after mobility installation',()=>{
 const p=make(),i=inp();
 i.pressed.add('attack');p.update(1/60,i,0);assert.equal(p.comboStep,0);i.pressed.clear();
 for(let n=0;n<18;n++)p.update(1/60,i,0);
 i.pressed.add('attack');p.update(1/60,i,0);assert.equal(p.comboStep,1);i.pressed.clear();
 for(let n=0;n<18;n++)p.update(1/60,i,0);
 i.pressed.add('attack');p.update(1/60,i,0);assert.equal(p.comboStep,2);
});
test('No impossible climb: requires real wall ray, moderate ledge, overhead clearance',()=>{
 const p={x:0,y:0,z:0};
 assert.equal(findMantle(flat,p,0),null);
 const wall={...flat,raycast(origin,dir,max){return dir.y>.5?max:.42;},
 floorBelow:(x,y,z)=>z>.9?1:0};
 const ledge=findMantle(wall,p,0);
 assert.ok(ledge&&ledge.rise>0.4&&ledge.rise<1.4);
 assert.equal(findMantle({...wall,floorBelow:()=>8},p,0),null,'8m tower must not auto-climb');
 assert.equal(findMantle({...wall,raycast:()=>.2},p,0),null,'head clearance blocks low ceiling');
});
test('Low ledge mantle physically reaches higher platform, no double-physics capsule',()=>{
 const world={...flat,raycast:(from,dir,max)=>dir.y>.5?max:.42,
 floorBelow:(x,y,z)=>z>.9?1:0};
 const p=make(world),i=inp();i.pressed.add('hf_climb');p.update(1/60,i,0);
 assert.equal(p.state,'hf_mantle');assert.ok(p._hfMantle.target.y>.6);
 i.pressed.clear();for(let n=0;n<48;n++)p.update(1/60,i,0);
 assert.equal(p.state,'move');assert.ok(p.pos.y>.8&&p.pos.y<1.2);
 assert.ok(p.grounded);
});
test('Real trunks/rocks only: contextual resource gathering and cooldown',()=>{
 const world={...flat,caps:[0,0,1.2,0,3,1.2,.3],
 lazy:[{cx:0,cz:1.7,r:.6,done:true}]};
 const p=make(world),i=inp();
 assert.equal(nearestResource(world,p.pos,'wood')?.kind,'wood');
 assert.equal(nearestResource(world,p.pos,'stone')?.kind,'stone');
 i.pressed.add('hf_chop');p.update(1/60,i,0);assert.equal(p.state,'hf_action');
 i.pressed.clear();for(let n=0;n<61;n++)p.update(1/60,i,0);
 assert.equal(p._hfBag.wood,1);assert.equal(p.state,'move');
 i.pressed.add('hf_chop');p.update(1/60,i,0);
 assert.equal(p.state,'move','cooldown prevents infinite tree farming');
 i.pressed.clear();i.pressed.add('hf_mine');p.update(1/60,i,0);assert.equal(p.state,'hf_action');
 i.pressed.clear();for(let n=0;n<75;n++)p.update(1/60,i,0);
 assert.equal(p._hfBag.stone,1);
});
test('Sit and lie loop until jump/attack cancels, not conflicting with gameplay',()=>{
 const p=make(),i=inp();
 i.pressed.add('hf_sit');p.update(1/60,i,0);assert.equal(p.state,'hf_action');
 i.pressed.clear();for(let n=0;n<65;n++)p.update(1/60,i,0);
 assert.equal(p.state,'hf_action');assert.equal(p._hfActivity.clip,'Sit_Floor_Idle');
 i.pressed.add('jump');p.update(1/60,i,0);assert.equal(p.state,'move');
 assert.ok(Object.keys(ACTIONS).includes('hf_lie'));
});
test('No underwater double jump or pseudo-climb; swimming remains original physics',()=>{
 const world={...flat,waterLevel:()=>3};
 const p=make(world),i=inp();i.move.y=1;
 for(let n=0;n<115;n++)p.update(1/60,i,0);
 assert.equal(p.state,'swim');
 const y=p.pos.y,st=p.stamina;
 i.pressed.add('jump');p.update(1/60,i,0);
 assert.equal(p._hfAirJumpUsed,false);
 assert.ok(p.pos.y>y-.25,'swim remains buoyant');
 assert.equal(p.state,'swim');
});
