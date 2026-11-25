import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {roadPathValid,CURVED_ROAD_TYPE,sampleCurvedRoad} from '../src/highfly/p533-curved-road-path.mjs';
const game=fs.readFileSync('src/highfly/p515-eastbrook-static.mjs','utf8');
const build=fs.readFileSync('scripts/f0-build.mjs','utf8');
const assets=fs.readFileSync('scripts/p524-kaykit-free-buildings.mjs','utf8');
test('P515 is truly static content on P514, not saved editor JSON',()=>{
 assert.match(game,/installP515Eastbrook\(game\)/);
 assert.match(build,/window\.__hfP515Eastbrook=installP515Eastbrook\(game\)/);
 assert.doesNotMatch(game,/localStorage\.(getItem|setItem)|WORLD_FORGE_KEY|search\.get\('hfworld'\)|world-forge-3d\.html/i);
 assert.doesNotMatch(build,/world-forge-3d.html|P534_PREVIEW/);
});
test('P515 keeps 11 independently named roles, six real civic analogues and Unsung landmarks',()=>{
 for(const role of ['banco','herreria','taberna','capilla','botica','casa_muelle','gremio_highfly','mercado_highfly','vivienda_1','vivienda_2','torre_entrada'])
  assert.match(game,new RegExp("role:'"+role+"'"));
 assert.match(game,/type:'unsung-hall'/);
 assert.match(game,/type:'unsung-tower'/);
 assert.match(game,/nativeBuilding\(foundations,o,fp\)/);
 assert.match(game,/lotFootprint\(world,o\)/);
});
test('P515 requires genuine pinned public KayKit CC0 models and forest/paving clearings',()=>{
 assert.match(assets,/KayKit-Medieval-Hexagon-Pack-1\.0\.git/);
 assert.match(assets,/84fa4e91af6a88989be7c99e0891cede11f2ca38/);
 assert.match(assets,/LICENSE-KAYKIT-MEDIEVAL-HEXAGON-CC0/);
 assert.match(build,/p515EastbrookTreeClearing\(x,z\)/);
 assert.match(build,/uHighflyCityMask/);
 assert.match(game,/makeCurvedCobblestone3D/);
 assert.match(game,/addCivicPlaza\(scene,world\)/);
});
test('P515 roads are continuous real-terrain paths, not disconnected flat tiles',()=>{
 const a={type:CURVED_ROAD_TYPE,id:'main',x:-608,z:-82,width:8,points:[[-608,-82],[-596,-101],[-572,-108],[-551,-98],[-532,-85],[-516,-79]]};
 assert.ok(roadPathValid(a).ok);
 const s=sampleCurvedRoad(a.points,.72);
 assert.ok(s.length>50);
 assert.equal(s[0].x,-608);assert.equal(s.at(-1).x,-516);
});