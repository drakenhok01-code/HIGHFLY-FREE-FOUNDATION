import assert from 'node:assert/strict';
import fs from 'node:fs';
import {P520_SETTLEMENTS,P520_PROTECTED,findSafeSite,planP520Settlements} from '../src/highfly/p520-settlement-plan.mjs';

const ids=P520_SETTLEMENTS.map(x=>x.id);
assert.deepEqual(ids,['arvelia','cultivos','lumeria','cordillera','bosque']);
assert.equal(new Set(P520_SETTLEMENTS.flatMap(x=>x.buildings.map(b=>x.id+'/'+b.id))).size,11);
assert.ok(P520_PROTECTED.some(x=>x.id==='dawn-spawn'));
assert.equal(P520_PROTECTED.filter(x=>x.id.startsWith('spire-')).length,8);
const flat={groundHeight:()=>190,waterLevel:()=>-Infinity};
const spots={wolf:{point:{x:-262,z:-440},npc:{x:-312,z:-441}},
 boar:{point:{x:-350,z:400},npc:{x:-350,z:460}},
 crab:{point:{x:720,z:85},npc:{x:760,z:87}}};
const result=planP520Settlements(flat,{spots});
assert.equal(result.regions.length,5);
assert.equal(result.placed.length,11,JSON.stringify(result.skipped));
assert.equal(result.resources.length,5,JSON.stringify(result.skipped));
for(const p of result.placed){
 assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z));
 const radius=Math.hypot(p.w,p.d)*.45;
 for(const safe of P520_PROTECTED)
  assert.ok(Math.hypot(p.x-safe.x,p.z-safe.z)>=safe.r+radius+2, p.id+' interferes with '+safe.id);
 for(const [id,spot] of Object.entries(spots)){
  assert.ok(Math.hypot(p.x-spot.point.x,p.z-spot.point.z)>=24+radius+2,p.id+' overlaps '+id+' pack');
  assert.ok(Math.hypot(p.x-spot.npc.x,p.z-spot.npc.z)>=7+radius+2,p.id+' overlaps '+id+' quest NPC');
 }
}
assert.ok(result.placed.find(x=>x.region==='arvelia').x< -550,'city behind western initial terrace');
assert.ok(result.placed.some(x=>x.type==='fishery')&&result.placed.some(x=>x.type==='mill'));
assert.ok(result.placed.some(x=>x.type==='smelter')&&result.placed.some(x=>x.type==='guild'));
assert.ok(result.resources.some(x=>x.kind==='ore')&&result.resources.some(x=>x.kind==='tree'));
assert.ok(result.resources.some(x=>x.kind==='fishSpot')&&result.resources.some(x=>x.kind==='soil'));
const wet={groundHeight:()=>5,waterLevel:()=>5.5};
assert.equal(findSafeSite(wet,{x:0,z:0},8,8,0,[],[],15),null);
const cliff={groundHeight:(x)=>x>3?10:0,waterLevel:()=>-Infinity};
assert.equal(findSafeSite(cliff,{x:0,z:0},12,12,0,[],[],0),null);
const source=fs.readFileSync('src/highfly/p520-settlements.mjs','utf8');
const build=fs.readFileSync('scripts/f0-build.mjs','utf8');
assert.match(source,/MeshBuilder/);
assert.match(source,/W\.addGeometry\(mesh\.geometry\)/);
assert.match(source,/highflyInteractables/);
assert.match(source,/models\/hf-kaykit-knight\.glb/);
assert.match(source,/game\.__highflyRpg\?\.open/);
assert.match(build,/params\.get\('hfcities'\)==='1'/);
assert.match(build,/installP520Settlements\(game,\{enabled:true\}\)/);
assert.ok(!source.includes('localStorage.setItem'),'town pilot must not alter player saves');
assert.ok(!source.includes('with the project only'),'no restrictive assets');
assert.ok(!source.includes('new WebGLRenderTarget'),'no extra render targets');
console.log('[P520 WORLD FORGE ALTERNATIVE PASS]',{
 districts:result.regions.length,buildings:result.placed.length,
 resources:result.resources.length,originalSpiresProtected:8,
 optIn:true,modifiedTerrain:false
});
