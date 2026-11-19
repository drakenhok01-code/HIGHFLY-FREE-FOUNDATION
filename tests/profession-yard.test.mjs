import test from 'node:test';
import assert from 'node:assert/strict';
import {YARD_STATIONS} from '../src/highfly/profession-yard.mjs';
test('Training yard has all six real resource stations for eight interactions',()=>{
 assert.equal(YARD_STATIONS.length,6);
 const kinds=YARD_STATIONS.map(x=>x.kind);
 for(const kind of ['tree','ore','fishSpot','soil','furnace','forge'])assert.ok(kinds.includes(kind));
 assert.equal(new Set(YARD_STATIONS.map(x=>x.id)).size,6);
});
