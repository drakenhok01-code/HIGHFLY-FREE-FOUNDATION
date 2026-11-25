import assert from 'node:assert/strict';
import fs from 'node:fs';
import {KAYKIT_FREE_ALL,KAYKIT_FREE_IDS,KAYKIT_FREE_GROUPS,KAYKIT_FREE_BY_ID} from '../src/highfly/p531-kaykit-free-catalog.mjs';
const r=p=>fs.readFileSync(p,'utf8');
assert.equal(KAYKIT_FREE_ALL.length,221);
assert.equal(KAYKIT_FREE_IDS.size,221);
assert.deepEqual(KAYKIT_FREE_GROUPS,{buildings:72,architecture:21,nature:42,props:26,hex:60});
assert.equal(KAYKIT_FREE_ALL.filter(a=>a.colour==='red'&&a.kind==='building').length,18);
for(const color of ['red','blue','green','yellow'])
 assert.equal(KAYKIT_FREE_ALL.filter(x=>x.colour===color).length,18);
const paths=new Set(),thumbs=new Set();
for(const a of KAYKIT_FREE_ALL){
 assert.ok(a.freePath.includes('/')&&a.freePath.endsWith('.gltf'));
 assert.ok(a.thumbName.includes('buildings')||a.thumbName.includes('decoration')||a.thumbName.includes('tiles'));
 assert.equal(a.license,'CC0-1.0');
 assert.ok(a.w>0&&a.d>0&&a.freeModel&&a.id);
 assert.ok(!paths.has(a.freePath),'duplicate model file '+a.freePath);paths.add(a.freePath);
 assert.ok(!thumbs.has(a.thumbName),'duplicate screenshot '+a.thumbName);thumbs.add(a.thumbName);
 assert.equal(KAYKIT_FREE_BY_ID.get(a.id),a);
}
assert.ok(KAYKIT_FREE_BY_ID.has('kaykit-home-a'));
assert.ok(KAYKIT_FREE_BY_ID.has('free-building-home-a-blue'));
assert.ok(KAYKIT_FREE_BY_ID.has('free-building-tower-catapult-red'));
assert.ok(KAYKIT_FREE_BY_ID.has('free-barrel'));
assert.ok(KAYKIT_FREE_BY_ID.has('free-tree-single-a'));
assert.ok(KAYKIT_FREE_BY_ID.has('free-wall-straight'));
assert.ok(KAYKIT_FREE_BY_ID.has('free-hex-road-a'));
const build=r('scripts/f0-build.mjs'),copy=r('scripts/p531-kaykit-all-free.mjs'),
 thumbsCode=r('scripts/p531-kaykit-thumbnails.py'),editor=r('src/highfly/p525-world-forge-3d.mjs'),
 runtime=r('src/highfly/p521-world-forge-runtime.mjs'),
 aerial=r('public/highfly/world-forge.js'),html=r('public/highfly/world-forge-3d.html'),
 flora=r('src/highfly/p531-unsung-flora.mjs');
for(const [s,pat] of [
 [build,/p531-kaykit-all-free/],[build,/p531-kaykit-thumbnails/],
 [copy,/84fa4e91af6a88989be7c99e0891cede11f2ca38/],
 [copy,/KAYKIT_FREE_ALL/],[copy,/all-manifest\.json/],
 [thumbsCode,/P531 FREE THUMBNAILS/],
 [editor,/KAYKIT_FREE_ALL/],[editor,/nativeUnsungFlora/],
 [editor,/repeatPlacement/],[editor,/cameraPan/],[editor,/P531_PREVIEW/],
 [editor,/thumbs-all/],[runtime,/KAYKIT_FREE_IDS/],
 [runtime,/nativeUnsungFlora/],[runtime,/P531_PREVIEW/],
 [runtime,/KAYKIT_FREE_BY_ID/],[aerial,/p531-kaykit-free-catalog/],
 [aerial,/Unsung árboles/],[aerial,/P531_PREVIEW/],
 [html,/WORLD FORGE 4\.3 · P5\.3\.2\+P5\.3\.3/],[html,/id="repeat-place"/],
 [flora,/generateTree/],[flora,/buildWood/],[flora,/buildLeaves/]
 ])assert.match(s,pat);
assert.ok(!build.includes('HIGHFLY_KAYKIT_SOURCE_EDITOR_V1_PRIVATE.zip'));
assert.ok(!build.includes('KIT_COMPLETO_PARTE_01.zip'));
assert.ok(html.includes('id="import-source" hidden'), 'no SOURCE import interface on FREE trial');
console.log('[P531 ALL FREE PASS]',JSON.stringify(KAYKIT_FREE_GROUPS),'6 native Unsung flora species and 12 original architecture objects');
