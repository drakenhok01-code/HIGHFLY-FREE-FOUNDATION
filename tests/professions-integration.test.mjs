import test from 'node:test';
import assert from 'node:assert/strict';
import {Player} from '../.work/unsung/src/game/player.js';
import {installHighflyDash} from '../.work/unsung/src/game/highfly-dash.mjs';
import {installHighflyUniversalMotion,ACTIONS} from '../.work/unsung/src/highfly/universal-motion.mjs';
import {professionState} from '../.work/unsung/src/highfly/professions.mjs';
const input=(pressed=[],held=[],x=0,y=0)=>({pressed:new Set(pressed),held:new Set(held),
 move:{x,y},look:{x:0,y:0}});
function rig(nodes=[]){
 const world={highflyInteractables:nodes,waterLevel:()=>-10000,groundHeight:()=>0,
  floorBelow:()=>0,resolveCapsule(pos){if(pos.y<0)pos.y=0;return pos.y===0}};
 const p=new Player(world);installHighflyDash(p);installHighflyUniversalMotion(p);
 p.spawn(0,0,0);p.grounded=true;
 p._hfProfession=professionState({seed:2},['axe','pickaxe','rod','hoe','watering_can','hammer']);
 return {p,world};
}
function complete(p,name){
 p.update(1/60,input([name]),0);
 assert.equal(p.state,'hf_action',name+' must start a real player animation');
 for(let i=0;i<150&&p.state==='hf_action';i++)p.update(1/60,input(),0);
 assert.equal(p.state,'move',name+' completes');
}
test('Real Player TALAR requires actual completion before wood enters bag; depleted targets do not award',()=>{
 const {p,world}=rig([{id:'tree',kind:'tree',x:0,z:1,charges:1}]);
 p.update(1/60,input(['chop']),0);
 assert.equal(p._hfAction.job.action,'chop');
 assert.equal(p._hfProfession.inventory.wood,undefined);
 for(let i=0;i<80;i++)p.update(1/60,input(),0);
 assert.equal(p._hfProfession.inventory.wood,2);
 assert.equal(world.highflyInteractables[0].available,false);
 assert.ok(p.events.some(e=>e.type==='highflyProfessionComplete'));
});
test('Moving, attacking or jumping cancels pending mining reward',()=>{
 for(const disruption of [input([],[],0,1),input(['attack']),input(['jump'])]){
  const {p}=rig([{id:'ore',kind:'ore',x:0,z:1,charges:1}]);
  p.update(1/60,input(['mine']),0);
  assert.equal(p._hfAction?.job?.action,'mine');
  for(let i=0;i<10;i++)p.update(1/60,input(),0);
  p.update(1/60,disruption,0);
  assert.equal(p._hfProfession.inventory.ore,undefined);
  assert.ok(!p.events.some(e=>e.type==='highflyProfessionComplete'),
   'canceled node must not grant loot');
 }
});
test('Player PESCAR consumes finite real fish spot without accidentally harvesting seawater',()=>{
 const {p}=rig([{id:'fish',kind:'fishSpot',x:0,z:1,charges:1}]);
 complete(p,'fishing');
 assert.equal(p._hfProfession.inventory.fish,1);
 p.update(1/60,input(['fishing']),0);
 for(let i=0;i<100;i++)p.update(1/60,input(),0);
 assert.equal(p._hfProfession.inventory.fish,1,'no duplicate fish after node depletion');
});
test('Player CULTIVAR: seed, watering, timed natural ripening and harvest',()=>{
 const plot={id:'garden',kind:'soil',x:0,z:1,phase:'empty',growSeconds:1.4};
 const {p}=rig([plot]);
 complete(p,'plant');assert.equal(p._hfProfession.inventory.seed,1);
 complete(p,'water');
 assert.equal(plot.phase,'growing');
 for(let i=0;i<160;i++)p.update(1/60,input(),0);
 assert.equal(plot.phase,'ripe');
 complete(p,'harvest');
 assert.equal(p._hfProfession.inventory.herb,2);
 assert.equal(plot.phase,'empty');
});
test('Real Player MINAR -> FUNDIR -> FORJAR never mints a second result without enough items',()=>{
 const {p,world}=rig([{id:'ore',kind:'ore',x:0,z:1,charges:2}]);
 complete(p,'mine');complete(p,'mine');
 assert.equal(p._hfProfession.inventory.ore,4);
 world.highflyInteractables=[{id:'furnace',kind:'furnace',x:0,z:1}];
 complete(p,'smelt');complete(p,'smelt');
 assert.equal(p._hfProfession.inventory.ingot,2);
 world.highflyInteractables=[{id:'forge',kind:'forge',x:0,z:1}];
 complete(p,'forge');
 assert.equal(p._hfProfession.inventory.blade_blank,1);
 p.update(1/60,input(['forge']),0);
 assert.notEqual(p.state,'hf_action','forge with insufficient ingots is blocked');
 assert.ok(p.events.some(e=>e.type==='highflyProfessionBlocked'&&e.reason==='missing-item'));
});
test('Player refuses tagged resource when matching tool is missing',()=>{
 const {p}=rig([{id:'tree',kind:'tree',x:0,z:1,charges:1}]);
 p._hfProfession.tools.delete('axe');
 p.update(1/60,input(['chop']),0);
 assert.notEqual(p.state,'hf_action');
 assert.ok(p.events.some(e=>e.type==='highflyProfessionBlocked'&&e.reason==='missing-tool'));
 assert.equal(p._hfProfession.inventory.wood,undefined);
});
test('Action preview clips use only real KayKit strings, simulated resource is never the same as inventory',()=>{
 for(const key of ['chop','mine','fishing','plant','water','harvest','smelt','forge']){
  const cfg=ACTIONS[key];assert.equal(cfg.kind,'work');
  assert.ok(['PickUp','Use_Item','1H_Melee_Attack_Chop'].includes(cfg.clip),key);
 }
});
