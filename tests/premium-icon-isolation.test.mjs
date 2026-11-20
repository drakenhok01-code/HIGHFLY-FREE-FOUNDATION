import test from 'node:test';
import assert from 'node:assert/strict';
import {ATLAS_COLUMNS,ATLAS_ROWS,ICON_SIZE,iconCell,installPremiumIconIsolation} from '../src/highfly/premium-icon-isolation.mjs';
import {PREMIUM_ATLAS} from '../src/highfly/premium-assets.mjs';
import {QUEST_ART_IDS,questArtData} from '../src/highfly/quest-art.mjs';
test('F0.14.11 every one of 20 icons maps to an independent non-overlapping image cell',()=>{
 assert.equal(ATLAS_COLUMNS,5);assert.equal(ATLAS_ROWS,4);assert.equal(ICON_SIZE,256);
 assert.equal(new Set(Object.values(PREMIUM_ATLAS)).size,20);
 const w=460,h=368,cells=[];
 for(let i=0;i<20;i++){
  const cell=iconCell(i,w,h);
  assert.deepEqual({sw:cell.sw,sh:cell.sh},{sw:92,sh:92});
  assert.equal(cell.sx,(i%5)*92);
  assert.equal(cell.sy,Math.floor(i/5)*92);
  for(const prev of cells)assert.ok(
   cell.sx>=prev.sx+prev.sw||prev.sx>=cell.sx+cell.sw||
   cell.sy>=prev.sy+prev.sh||prev.sy>=cell.sy+cell.sh,
   'Atlas cells overlap: '+JSON.stringify([cell,prev]));
  cells.push(cell);
 }
 assert.throws(()=>iconCell(20,w,h),RangeError);
 assert.throws(()=>iconCell(-1,w,h),RangeError);
 assert.throws(()=>iconCell(1,0,h),RangeError);
});
test('F0.14.11 illustrated quest images no longer use censored hero or flat/geometric SVG backdrops',()=>{
 assert.equal(QUEST_ART_IDS.length,19);
 for(const id of QUEST_ART_IDS){
  const data=questArtData(id);
  assert.ok(!['approved-hero','world-petal','quest-petal','forge-chamber','hero-sanctuary'].includes(data.asset),
   id+' incorrectly uses censored/geometric mission illustration '+data.asset);
  assert.ok(data.asset.startsWith('premium-'),id+' uses non-painterly visual '+data.asset);
 }
});
test('F0.14.11 icon isolation is safe to import in Node tests without browser globals',()=>{
 const r=installPremiumIconIsolation(null,'/highfly/premium-icons-atlas.avif');
 assert.deepEqual(r.status(),{ready:false});
 assert.equal(typeof r.apply,'function');
});
