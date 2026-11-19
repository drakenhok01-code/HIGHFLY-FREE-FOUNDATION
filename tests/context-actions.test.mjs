import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveHighflyContext,resolveHighflyUse} from '../src/highfly/mobile-touch.mjs';
const player={pos:{x:0,y:0,z:0},yaw:0,grounded:true,world:{
 waterLevel:()=>-1e7,groundHeight:()=>0,highflyInteractables:[]}};
test('No target returns climb, no fictional mining resource',()=>{
 assert.deepEqual(resolveHighflyContext(player),{action:'climb',label:'TREPAR'});
});
test('Tagged close targets select tree, ore and loot context',()=>{
 for(const [kind,action] of [['tree','chop'],['ore','mine']]){
  const p={...player,world:{...player.world,highflyInteractables:[{kind,x:0,z:1}]}};
  assert.equal(resolveHighflyContext(p).action,action);
 }
});
test('Fishing appears only by deep water in front of player',()=>{
 const p={...player,world:{...player.world,waterLevel:()=>1.5,groundHeight:()=>0}};
 assert.equal(resolveHighflyContext(p).action,'fishing');
});

test('Ability circle directions are independent from the movement stick',()=>{
 const mod=import('../src/highfly/mobile-touch.mjs');
 return mod.then(({abilityVector})=>{
  assert.equal(abilityVector(0,0),null);
  assert.deepEqual(abilityVector(30,0),{x:1,y:0});
  assert.deepEqual(abilityVector(0,-40),{x:0,y:1});
  assert.deepEqual(abilityVector(-40,0),{x:-1,y:0});
  assert.deepEqual(abilityVector(0,50),{x:0,y:-1});
 });
});

test('F0.11.4 pickup targets the USAR button, never the universal context circle',()=>{
 const p={...player,world:{...player.world,highflyInteractables:[{kind:'loot',x:0,z:1}]}};
 assert.deepEqual(resolveHighflyContext(p),{action:'climb',label:'TREPAR'});
 assert.deepEqual(resolveHighflyUse(p),{action:'pickup',label:'USAR'});
});
test('F0.11.4 native untagged trees are climbing surfaces, never chopped',()=>{
 const p={...player,world:{...player.world,caps:new Float32Array([0,0,1,0,5,1,.5])}};
 assert.equal(resolveHighflyContext(p).action,'climb');
 assert.equal(resolveHighflyUse(p).action,'interact');
});

test('F0.11.6 in water contextual action is BUCEAR, not surface fishing',()=>{
 const p={...player,state:'swim',grounded:false,world:{...player.world,raycast:()=>1.08}};
 assert.deepEqual(resolveHighflyContext(p),{action:'dive',label:'BUCEAR'});
 p._hfDive=true;
 assert.deepEqual(resolveHighflyContext(p),{action:'dive',label:'SUPERFICIE'});
});
test('F0.11.6 climbable quay in water has priority over BUCEAR',()=>{
 const p={...player,state:'swim',grounded:false,world:{...player.world,raycast:()=>.44}};
 assert.deepEqual(resolveHighflyContext(p),{action:'climb',label:'TREPAR'});
});

test('F0.12.1 labelled profession stations and farm plots select only valid contextual action',()=>{
 const kinds=[
  ['tree','chop','TALAR'],
  ['ore','mine','PICAR'],
  ['fishSpot','fishing','PESCAR'],
  ['forge','forge','FORJAR'],
  ['furnace','smelt','FUNDIR']
 ];
 for(const [kind,action,label] of kinds){
  const p={...player,world:{...player.world,highflyInteractables:[
    {id:kind,kind,x:0,z:1,charges:2}]}};
  assert.deepEqual(resolveHighflyContext(p),{action,label},kind);
 }
 for(const [phase,action,label] of [
  ['empty','plant','SEMBRAR'],['seeded','water','REGAR'],['ripe','harvest','COSECHAR']]){
  const p={...player,world:{...player.world,highflyInteractables:[
    {id:'plot',kind:'soil',phase,x:0,z:1}]}};
  assert.deepEqual(resolveHighflyContext(p),{action,label},phase);
 }
 const growing={...player,world:{...player.world,highflyInteractables:[
   {id:'plot',kind:'soil',phase:'growing',x:0,z:1}]}};
 assert.equal(resolveHighflyContext(growing).action,'climb','growing plots cannot be harvested early');
});
