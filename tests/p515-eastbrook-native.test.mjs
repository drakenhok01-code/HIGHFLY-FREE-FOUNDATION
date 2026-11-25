import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EASTBROOK_VERSION,EASTBROOK_LOTS,EASTBROOK_SQUARE,EASTBROOK_PATHS,EASTBROOK_SAMPLED_PATHS,EASTBROOK_SOURCE,eastbrookClearing,eastbrookMask} from '../src/highfly/p515-eastbrook-layout.mjs';
const read=p=>fs.readFileSync(p,'utf8');
test('P515: EXACTLY 11 real 3D medieval lots and all 7 civic roles built-in, no World Forge',()=>{
 assert.equal(EASTBROOK_VERSION,'p515-native-eastbrook-v1');
 assert.equal(EASTBROOK_LOTS.length,11);
 assert.equal(new Set(EASTBROOK_LOTS.map(x=>x.id)).size,11);
 for(const role of ['banco','herreria','taberna','capilla','botica','casa_muelle','gremio_highfly']){
  assert.ok(EASTBROOK_LOTS.find(x=>x.role===role));
 }
 assert.equal(EASTBROOK_LOTS.filter(x=>x.type==='kaykit').length,9);
 assert.equal(EASTBROOK_LOTS.filter(x=>x.type==='unsung').length,2);
 assert.ok(EASTBROOK_LOTS.every(x=>x.x< -525&&x.x> -700&&x.z> -125&&x.z< -5));
 assert.match(EASTBROOK_SOURCE.kaykit,/CC0/);
 assert.match(EASTBROOK_SOURCE.unsung,/MIT/);
 assert.doesNotMatch(JSON.stringify(EASTBROOK_LOTS),/claudecraft|tidehold|source[ -]?pack|private/i);
});
test('P515: genuine continuous stone streets to original Unsung plaza',()=>{
 assert.ok(EASTBROOK_PATHS.length>=4);
 for(const road of EASTBROOK_SAMPLED_PATHS){
  assert.ok(road.samples.length>10,road.id);
  assert.ok(road.samples.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)));
  let gap=0;for(let i=1;i<road.samples.length;i++)gap=Math.max(gap,Math.hypot(road.samples[i].x-road.samples[i-1].x,road.samples[i].z-road.samples[i-1].z));
  assert.ok(gap<4,road.id+' gaps '+gap);
 }
 assert.ok(EASTBROOK_PATHS[0].points.at(-1)[0]>-541,'main road reaches within native old plaza');
 assert.equal(EASTBROOK_SQUARE.radius,12.5);
});
test('P515: vegetation exclusion only by town, not original natural forest',()=>{
 for(const o of EASTBROOK_LOTS)assert.equal(eastbrookClearing(o.x,o.z),true,o.id);
 assert.equal(eastbrookClearing(EASTBROOK_SQUARE.x,EASTBROOK_SQUARE.z),true);
 assert.equal(eastbrookClearing(0,0),false);
 assert.equal(eastbrookClearing(2750,1480),false,'Eldertree stays original');
 const mask=eastbrookMask(256);
 assert.equal(mask.data.length,65536);
 assert.ok(mask.painted>50&&mask.painted<65536);
});
test('P515 build: import native scene and FREE models, never map editor',()=>{
 const build=read('scripts/f0-build.mjs'),game=read('src/highfly/p515-eastbrook-native.mjs');
 assert.match(build,/installNativeEastbrook\(game,\{cover\}\)/);
 assert.match(build,/p515-kaykit-free-native/);
 assert.match(build,/uHFEastbrook/);
 assert.match(game,/GLTFLoader/);
 assert.match(game,/building_/);
 assert.match(game,/addLazy/);
 assert.match(game,/HF_EASTBROOK_CURVED_COBBLE_AND_PLAZA/);
 assert.doesNotMatch(game,/p521-world-forge|world-forge-3d|localStorage\.getItem\(/i);
 assert.doesNotMatch(build,/p521-world-forge-runtime|p525-world-forge-3d|world-forge\.html/);
});
