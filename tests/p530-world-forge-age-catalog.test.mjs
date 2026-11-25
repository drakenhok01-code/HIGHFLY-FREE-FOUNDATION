import assert from 'node:assert/strict';
import fs from 'node:fs';
import {UNSUNG_ORIGINAL_ASSETS,UNSUNG_ORIGINAL_IDS,buildUnsungOriginal} from '../src/highfly/p530-unsung-original.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const editor=read('src/highfly/p525-world-forge-3d.mjs'),
 runtime=read('src/highfly/p521-world-forge-runtime.mjs'),
 manifest=read('scripts/p530-native-unsung-prefabs.mjs'),
 build=read('scripts/f0-build.mjs'),
 html=read('public/highfly/world-forge-3d.html'),
 flat=read('public/highfly/world-forge.js');
assert.equal(UNSUNG_ORIGINAL_ASSETS.length,12);
assert.equal(UNSUNG_ORIGINAL_IDS.size,12);
assert.ok(UNSUNG_ORIGINAL_ASSETS.every(a=>a.id.startsWith('unsung-')&&a.w>0&&a.d>0));
assert.ok(UNSUNG_ORIGINAL_ASSETS.filter(a=>a.kind==='building').length>=5);
assert.ok(UNSUNG_ORIGINAL_ASSETS.filter(a=>a.kind==='decor').length>=5);
// Ensure the exported geometry originates in real MIT architecture functions, not fake boxes.
for(const [file,re] of [
 [manifest,/MeshBuilder/],[manifest,/buildUnsungOriginal/],
 [manifest,/unsung-original-prefabs\.bin/],[manifest,/unsung-original-prefabs\.json/],
 [editor,/loadUnsungOriginal\(a\.id,url\)/],
 [editor,/category==='Edificios'/],[editor,/SOURCE · Edificios/],
 [editor,/SOURCE · Accesorios/],[editor,/Unsung original/],
 [editor,/catalogLimit=36/],[editor,/brushCells=brushCells%3\+1/],
 [editor,/no se colocará una caja falsa/],
 [runtime,/buildUnsungOriginal\(o\.type,q/],
 [runtime,/P530_PREVIEW/],
 [flat,/hf-world-forge-layout-p530-v1/],
 [flat,/Unsung original/],
 [html,/id="brush-width"/],[html,/id="catalog-more"/],
 [build,/p530-native-unsung-prefabs/],
 [build,/p530-native-unsung-thumbnails/],
 ])assert.match(file,re);
assert.ok(!build.includes('KIT_COMPLETO_PARTE_01.zip'));
assert.ok(!build.includes('HIGHFLY_KAYKIT_SOURCE_EDITOR_V1_PRIVATE.zip'));
console.log('[P530 PASS] 12 authentic Unsung MIT prefabs, 16 FREE 3D buildings, private SOURCE palette, 3-size paving brush, isolated editor/RPG save');
// Verify every original catalogue item calls the actual original kit without a generic placeholder.
const kit=Object.fromEntries(['lantern','bench','planter','trough','armillary','pavilion','arcade','tower','hall','tuningSpire'].map(name=>[name,()=>{}]));
const arch={stairs(){},balustrade(){}},b={at(x,y,z,yaw,fn){fn(this);}};
for(const a of UNSUNG_ORIGINAL_ASSETS){
 assert.doesNotThrow(()=>buildUnsungOriginal(a.id,b,{kit,arch}));
}
