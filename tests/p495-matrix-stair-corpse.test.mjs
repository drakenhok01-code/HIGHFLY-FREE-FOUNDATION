import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {p495StairTread,p495StairTraverse,p495OnActualStairs} from '../src/highfly/p495-stair-route.mjs';
import {allowTerrainTraverse,allowCliffCapsule} from '../src/highfly/wall-physics.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const W={terrain:{heightAt:()=>120},groundHeight:()=>120,floorBelow:()=>135};
test('P495 precise 56m authentic stairs exempt both uphill and downhill from cliff rollback',()=>{
 const a={x:-130,z:-459,y:125.4},b={x:-130.1,z:-459,y:125.4},c={x:-130.1,z:-465,y:125.4};
 const p=p495StairTread(W,-130,-459);assert.ok(p);
 const r={x:-130,z:-459,y:p.y},s={x:-130.1,z:-459,y:p.y};
 assert.ok(p495StairTraverse(W,r,s));assert.ok(p495OnActualStairs(W,r));
 assert.ok(allowTerrainTraverse(W,r,s).ok);
 assert.ok(allowCliffCapsule(W,r,s).ok);
 assert.equal(p495StairTraverse(W,r,c),false);
 assert.equal(p495StairTread(W,-130,-475),null);
 assert.equal(p495StairTread(W,-178,-459),null);
});
test('P495 manual scene matrix updates exist for all real animal and quest NPC roots',()=>{
 const wildlife=read('src/highfly/p491-cc0-creatures.mjs'),hunt=read('src/highfly/p49-hunt-world.mjs'),
 people=read('src/highfly/p492-kaykit-people.mjs'),loot=read('src/highfly/p41-world-loot.mjs');
 assert.match(wildlife,/avatar\.root\.updateMatrixWorld\(true\)/);
 assert.match(hunt,/npc\.anchor\.updateMatrixWorld\(true\)/);
 assert.match(hunt,/anchor\.updateMatrixWorld\(true\)/);
 assert.match(people,/a\.n\.root\.updateMatrixWorld\(true\)/);
 assert.match(loot,/drop\.sprite\.updateMatrixWorld\(true\)/);
 assert.match(loot,/avatar\.corpseLootPending=true/);
 assert.match(loot,/receiveP41WorldPickup/);
});
test('P495 builder removes forced position skipping and uses native stair BVH',()=>{
 const b=read('scripts/f0-build.mjs');
 assert.match(b,/p495StairTraverse/);
 assert.match(b,/p495OnActualStairs/);
 assert.match(b,/src\/game\/collision\.js/);
 assert.match(b,/src\/highfly\/p495-stair-route\.mjs/);
 assert.doesNotMatch(b,/const stair=stairDownstep\(W/);
});
