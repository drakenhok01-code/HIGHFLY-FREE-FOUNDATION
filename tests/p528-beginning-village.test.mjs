import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBeginningVillage,VILLAGE_DECOR_ASSETS,VILLAGE_DECOR_IDS} from '../src/highfly/p528-village-layout.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const s3=read('src/highfly/p525-world-forge-3d.mjs'),rpg=read('src/highfly/p521-world-forge-runtime.mjs'),
 two=read('public/highfly/world-forge.js'),build=read('scripts/f0-build.mjs'),
 ui=read('public/highfly/world-forge-3d.html'),scenic=read('src/highfly/p528-village-decor-3d.mjs');
assert.equal(VILLAGE_DECOR_ASSETS.length,11,'all exact decorative categories');
assert.equal(new Set(VILLAGE_DECOR_ASSETS.map(v=>v.id)).size,11);
for(const a of VILLAGE_DECOR_ASSETS){
 assert.ok(VILLAGE_DECOR_IDS.has(a.id));
 assert.ok(two.includes("'"+a.id+"'"),'2D must preserve '+a.id);
 assert.ok(scenic.includes("'"+a.id+"'"),'3D geometry for '+a.id);
}
const terrainOK=o=>({ok:Math.abs(o.x)<2000&&Math.abs(o.z)<2000,y:205+Math.sin(o.x/23)*.02});
const origin={x:-512,z:-70},layout=buildBeginningVillage({origin,canPlace:terrainOK});
assert.equal(layout.buildings,10,'all complete buildings should fit clean open ground');
assert.ok(layout.paved>95,'curved 4-meter stone paving must be continuous');
assert.ok(layout.decorations>=25,'village should contain real accessories');
assert.ok(layout.objects.length<2500,'safely within native JSON limits');
assert.ok(layout.objects.some(o=>o.type==='village-gazebo'));
assert.ok(layout.objects.some(o=>o.type==='village-stall-red'));
assert.ok(layout.objects.some(o=>o.type==='village-blossom'));
assert.ok(layout.objects.some(o=>o.type==='kaykit-blacksmith'));
assert.ok(layout.objects.some(o=>o.type==='kaykit-church'));
assert.ok(layout.objects.every(o=>Number.isFinite(o.y)&&Number.isFinite(o.x)&&Number.isFinite(o.z)));
assert.equal(new Set(layout.objects.map(o=>o.id)).size,layout.objects.length);
assert.equal(buildBeginningVillage({origin,canPlace:()=>({ok:false,why:'water'})}).objects.length,0,
 'underwater or unsafe lots must not be inserted');
for(const [a,pattern] of [
 [s3,/VILLAGE_DECOR_ASSETS,buildBeginningVillage/],
 [s3,/makeVillageDecor\(a\.id,o\.scale\)/],
 [s3,/window\.confirm\(summary\)/],
 [s3,/backup-pre-p528-village/],
 [s3,/plan\.buildings<3\|\|plan\.paved<40/],
 [rpg,/VILLAGE_DECOR_IDS\.has\(o\.type\)/],
 [rpg,/scenicObjects/],
 [rpg,/world\.addLazy\(wx,wz/],
 [ui,/id="preset-village"/],
 [build,/\['p528-village-layout','p528-village-decor-3d','p529-private-source-import','p530-unsung-original','p530-unsung-loader'\]/],
 [scenic,/function gazebo\(g\)/],
 [scenic,/function stall\(g,blue\)/],
 ])assert.match(a,pattern);
assert.ok(!scenic.includes('kaykit-source'));
assert.ok(!s3.includes('models/kaykit-source'));
console.log('[P528 layout PASS]',layout.buildings,'full buildings,',layout.paved,'paving slabs,',
 layout.decorations,'scene decorations,',layout.objects.length,'JSON objects; source-paid gate clean');
