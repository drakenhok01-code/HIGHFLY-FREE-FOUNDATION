import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isHighflyStairLane,allowCliffCapsule,allowTerrainTraverse} from '../src/highfly/wall-physics.mjs';
import {stairDownstep} from '../src/highfly/p494-stair-guard.mjs';
const read=p=>fs.readFileSync(p,'utf8');

test('P495: precise stair corridor supports up and down without bypassing flank walls',()=>{
 const bottom={x:-118.2,y:5,z:-459},top={x:-173.5,y:30,z:-459};
 assert.equal(isHighflyStairLane(bottom,top),true);
 const nativeStairs={groundHeight:(x,z)=>x===-532&&z===-70?200:4};
 const dawnBottom={x:-549,y:201,z:-70},dawnTop={x:-525,y:210.4,z:-70};
 assert.equal(isHighflyStairLane(dawnBottom,dawnTop,nativeStairs),true);
 assert.equal(isHighflyStairLane(dawnTop,dawnBottom,nativeStairs),true);
 assert.equal(isHighflyStairLane({...dawnBottom,z:-80},dawnTop,nativeStairs),false);
 assert.equal(isHighflyStairLane(top,bottom),true);
 assert.equal(isHighflyStairLane({...bottom,z:-454},top),false);
 assert.equal(isHighflyStairLane(bottom,{x:-183,z:-459}),false);
 const world={groundHeight:(x,z)=>x<-143?40:4,
  floorBelow:(x,y,z)=>x<-143?16:5,raycast:()=>99};
 assert.equal(allowCliffCapsule(world,bottom,top).builtStair,true);
 assert.equal(allowTerrainTraverse(world,top,bottom).builtStair,true);
 assert.notEqual(allowCliffCapsule(world,{x:-118,y:5,z:-450},{x:-173,y:8,z:-450}).builtStair,true);
});
test('P495: P494 descending stair safety still blocks wall ray and > .72m drops',()=>{
 const world={floorBelow:(x)=>x>.25?9.55:10,groundHeight:()=>8,raycast:()=>10};
 assert.equal(stairDownstep(world,{x:0,y:10,z:0},{x:.5,z:0}).floor,9.55);
 world.raycast=()=>.2;
 assert.equal(stairDownstep(world,{x:0,y:10,z:0},{x:.5,z:0}),null);
});
test('P495: manual frame matrix commit exists on ALL spawned licensed models',()=>{
 const sources=[
  ['src/highfly/p491-cc0-creatures.mjs',/avatar\.root\.updateMatrixWorld\(true\)/],
  ['src/highfly/p49-hunt-world.mjs',/npc\.anchor\.updateMatrixWorld\(true\)/],
  ['src/highfly/p492-kaykit-people.mjs',/a\.holder\.updateMatrixWorld\(true\)/],
  ['src/highfly/p41-world-loot.mjs',/drop\.sprite\.updateMatrixWorld\(true\)/]
 ];
 for(const [path,pattern] of sources)assert.match(read(path),pattern,'missing runtime matrices in '+path);
 const lab=read('src/highfly/qa-p494-visual-entry.mjs');
 assert.match(lab,/scene\.matrixWorldAutoUpdate=false/);
 assert.match(lab,/a\.holder\.updateMatrixWorld\(true\)/);
});
test('P495: build applies stair native movement and exact central lane without weakening terrain safety',()=>{
 const build=read('scripts/f0-build.mjs');
 assert.match(build,/isHighflyStairLane\(this\.pos,\{x:nx,z:nz\},W\)/);
 assert.match(build,/forest\?\.trunkColliders/);
 assert.match(build,/!isHighflyStairLane\(\{x:\(a\[0\]\+b\[0\]\)\/2,z:/);
 assert.match(read('src/highfly/wall-physics.mjs'),/export function isHighflyStairLane/);
 assert.match(read('src/highfly/wall-physics.mjs'),/export function terrainWallContact/);
});
test('P495: corpse must remain visible until looted, one real model rather than floor item',()=>{
 const loot=read('src/highfly/p41-world-loot.mjs');
 const hunt=read('src/highfly/p49-hunt-world.mjs');
 assert.match(loot,/corpseLootPending=true/);
 assert.match(loot,/corpseLootUntil=ticker\(\)\+60/);
 assert.match(loot,/const avatar=wildlife\?game\.__highflyHunts\?\.avatarFor/);
 assert.match(loot,/label\.textContent=nearest\.avatar\?'✦ USAR · SAQUEAR/);
 assert.match(loot,/if\(wildlife\)\{/);
 assert.match(hunt,/avatarFor\(enemy\)/);
 assert.match(hunt,/avatar\.corpseLootPending && game\.time<avatar\.corpseLootUntil/);
 assert.match(read('src/highfly/p491-cc0-creatures.mjs'),/enemy\.alive\|\|!!avatar\.corpseLootPending/);
});
