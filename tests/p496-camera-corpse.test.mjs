import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cameraNearRealStairs,stairAwareCameraFloor,stabilizedStairCameraY} from '../src/highfly/p496-stair-camera.mjs';
import {p495StairTread} from '../src/highfly/p495-stair-route.mjs';
const world={
 terrain:{heightAt:()=>10},groundHeight:()=>800,
 floorBelow:()=>35
};
const worldNormal={groundHeight:()=>27,floorBelow:()=>22};
const pt=p495StairTread(world,-135,-459);
test('P496 camera treats BVH stairs as the real floor; prevents terrain underflight bump',()=>{
 assert.ok(pt);
 const player={x:-135,z:-459,y:pt.y};
 const cam={x:-143,z:-459,y:38};
 assert.equal(cameraNearRealStairs(world,player),true);
 assert.equal(stairAwareCameraFloor(world,player,cam),35.36);
 assert.equal(stairAwareCameraFloor(worldNormal,{x:12,z:4,y:20},cam),27.54);
});
test('P496 camera easing prevents 60fps staircase vertical snap, resets off-stairs',()=>{
 const next=stabilizedStairCameraY(9,25,1/60,true);
 assert.ok(next>9&&next<9.15);
 assert.equal(stabilizedStairCameraY(9,25,1/60,false),25);
});
test('P496 original native shards retained until loot, without floating sprite',()=>{
 const builder=fs.readFileSync('scripts/f0-build.mjs','utf8');
 const loot=fs.readFileSync('src/highfly/p41-world-loot.mjs','utf8');
 assert.match(builder,/__hfCorpsePending===true && e\.__hfCorpseUntil>time/);
 assert.match(builder,/e\.__hfCorpsePending \? 0/);
 assert.match(builder,/e\.t < 1\.65/);
 assert.match(loot,/native\.__hfCorpsePending=true/);
 assert.match(loot,/native\.__hfCorpsePending=false/);
 assert.match(loot,/drops\.push\(\{id:itemId/);
 assert.doesNotMatch(loot,/new THREE\.Sprite\(/);
});
test('P496 animal death to USAR still uses existing bag transaction',()=>{
 const loot=fs.readFileSync('src/highfly/p41-world-loot.mjs','utf8');
 assert.match(loot,/receiveP41WorldPickup/);
 assert.match(loot,/saveRpgState/);
 assert.match(loot,/avatar\.corpseLootPending=true/);
 assert.match(loot,/drops\.filter\(d=>!!\(d\.avatar\|\|d\.native\)\)/);
});
