import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveHighflyContext} from '../src/highfly/mobile-touch.mjs';
const player={pos:{x:0,y:0,z:0},yaw:0,grounded:true,world:{
 waterLevel:()=>-1e7,groundHeight:()=>0,highflyInteractables:[]}};
test('No target returns climb, no fictional mining resource',()=>{
 assert.deepEqual(resolveHighflyContext(player),{action:'climb',label:'TREPAR'});
});
test('Tagged close targets select tree, ore and loot context',()=>{
 for(const [kind,action] of [['tree','chop'],['ore','mine'],['loot','pickup']]){
  const p={...player,world:{...player.world,highflyInteractables:[{kind,x:0,z:1}]}};
  assert.equal(resolveHighflyContext(p).action,action);
 }
});
test('Fishing appears only by deep water in front of player',()=>{
 const p={...player,world:{...player.world,waterLevel:()=>1.5,groundHeight:()=>0}};
 assert.equal(resolveHighflyContext(p).action,'fishing');
});
