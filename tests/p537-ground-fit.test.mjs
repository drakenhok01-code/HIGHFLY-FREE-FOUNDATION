import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gradePlanFor,gradeHeightAt,gradeHeightForPlans,gradePatchGrid,indexGradePlans,fastGradeHeightAt} from '../src/highfly/p537-grade-parcels.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const ground=(x,z)=>20+.15*x-.07*z;
const lot={id:'test-house',type:'kaykit-home-a',x:0,z:0,yaw:0,scale:1};
test('Building parcel is supported on true Unsung earth, without levitating foundation',()=>{
 const p=gradePlanFor(lot,{w:10,d:9},ground,{apron:3});
 assert.ok(p.y>ground(0,0)&&p.slope>.5);
 assert.equal(gradeHeightAt(0,0,ground(0,0),p),p.y);
 assert.equal(gradeHeightAt(50,50,ground(50,50),p),ground(50,50));
 assert.ok(gradeHeightAt(-5.8,0,ground(-5.8,0),p)>ground(-5.8,0));
 assert.equal(gradeHeightAt(-9.1,0,ground(-9.1,0),p),ground(-9.1,0));
 const g=gradePatchGrid(p,ground,{step:.9});
 assert.ok(g.vertices.length>250&&g.indices.length>250);
 assert.ok(g.vertices.every(Number.isFinite));
});
test('Rotations and spatial index use exact same native ground',()=>{
 const values=[0,Math.PI/2,Math.PI,3*Math.PI/2].map(yaw=>gradePlanFor({...lot,yaw},{w:10,d:9},ground));
 assert.ok(Math.abs(values[0].y-values[2].y)<.001);
 assert.ok(Math.abs(values[1].y-values[3].y)<.001);
 const p2=gradePlanFor({...lot,id:'next',x:44,z:18,yaw:.6},{w:12,d:12},ground);
 const plans=[values[0],p2],idx=indexGradePlans(plans);
 for(let x=-25;x<67;x+=2.5)for(let z=-20;z<38;z+=3)
  assert.ok(Math.abs(fastGradeHeightAt(x,z,ground(x,z),idx)-gradeHeightForPlans(x,z,ground(x,z),plans))<1e-6);
});
test('Editor and RPG share original-height grading, true grass clearance, collision, zero artificial slab',()=>{
 const e=read('src/highfly/p525-world-forge-3d.mjs'),g=read('src/highfly/p521-world-forge-runtime.mjs');
 assert.match(e,/gradePlanFor\(o,\{w:a\.w,d:a\.d\},elevation/);
 assert.match(g,/gradePlanFor\(o,\{w:w0,d:d0\}/);
 assert.match(e,/gradePatchGrid\(plan,elevation/);
 assert.match(g,/gradePatchGrid\(fp\.grade/);
 assert.match(e,/!P537_PREVIEW&&\(a\.model/);
 assert.match(g,/!P537_PREVIEW&&\(asset\?\.kind/);
 assert.match(g,/world\.addLazy/);
 assert.match(g,/game\.terrain\?\.layers\?\.a/);
 assert.match(e,/nativeEditorOriginalGrass\(\{scene,elevation:gradedElevation/);
 assert.match(g,/hf-world-forge-layout-p537-v1/);
 assert.match(e,/hf-world-forge-layout-p536-v1/);
 assert.match(read('public/highfly/world-forge-3d.html'),/WORLD FORGE 4\.[5678]/); // P538 retains P537 parcel system
 assert.match(read('scripts/f0-build.mjs'),/p537-grade-parcels/);
});
test('Pages publishes only approved P533 and P537, below 900 MB',()=>{
 const s=read('.github/workflows/highfly-p537-clean-pages.yml');
 assert.match(s,/preview-p533/);assert.match(s,/preview-p537/);
 assert.match(s,/du -sb/);assert.match(s,/900000000/);
 assert.match(s,/test ! -e "\$ROOT\/preview-p515"/);
 assert.match(s,/test ! -e "\$ROOT\/preview-p536"/);
});
