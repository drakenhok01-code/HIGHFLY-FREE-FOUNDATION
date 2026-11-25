import assert from 'node:assert/strict';
import fs from 'node:fs';
import {KAYKIT_FREE_ALL} from '../src/highfly/p531-kaykit-free-catalog.mjs';
import {spanishFreeLabel,localizePublicAsset} from '../src/highfly/p532-spanish-labels.mjs';
import {QUATERNIUS_CC0_ALL,QUATERNIUS_CC0_IDS,QUATERNIUS_CC0_BY_ID} from '../src/highfly/p532-quaternius-cc0-catalog.mjs';
import {PUBLIC_URBAN_ASSETS} from '../src/highfly/p532-public-urban-assets.mjs';
const read=p=>fs.readFileSync(p,'utf8');
assert.equal(KAYKIT_FREE_ALL.length,221);
assert.equal(QUATERNIUS_CC0_ALL.length,42);
assert.equal(QUATERNIUS_CC0_IDS.size,42);
assert.equal(PUBLIC_URBAN_ASSETS.length,4);
const names=KAYKIT_FREE_ALL.map(x=>spanishFreeLabel(x));
assert.equal(names.length,221);
assert.ok(names.every(x=>typeof x==='string'&&x.length>3),'No unresolved source label');
assert.equal(spanishFreeLabel(KAYKIT_FREE_ALL.find(a=>a.id==='kaykit-home-a')),'Casa A · rojo');
assert.equal(spanishFreeLabel(KAYKIT_FREE_ALL.find(a=>a.id==='free-building-home-a-blue')),'Casa A · azul');
assert.ok(names.some(x=>x.includes('Tramo recto de muralla')));
assert.ok(names.some(x=>x.includes('Barril')));
assert.ok(names.some(x=>x.includes('Bosquecillo')));
assert.ok(names.some(x=>x.includes('Planta acuática')));
assert.ok(names.some(x=>x.includes('Camino hexagonal')));
for(const x of KAYKIT_FREE_ALL){
 const spanish=localizePublicAsset(x);assert.equal(spanish.id,x.id);
 assert.ok(spanish.searchTags.includes(x.freePath));
}
for(const a of QUATERNIUS_CC0_ALL){
 assert.equal(a.license,'CC0-1.0');
 assert.match(a.gitBlob,/^[a-f0-9]{40}$/);
 assert.match(a.sourcePath,/^public\/models\/(props|foliage)\/[a-z0-9_]+\.glb$/);
 assert.equal(QUATERNIUS_CC0_BY_ID.get(a.id),a);
 assert.ok(a.sizeBytes>1000);
}
assert.ok(QUATERNIUS_CC0_IDS.has('qcc0-well'));
assert.ok(QUATERNIUS_CC0_IDS.has('qcc0-lantern_wall'));
assert.ok(QUATERNIUS_CC0_IDS.has('qcc0-bush_flowers'));
assert.ok(QUATERNIUS_CC0_IDS.has('qcc0-pine_1'));
assert.ok(PUBLIC_URBAN_ASSETS.some(x=>x.id==='hf-fountain-stone'));
const editor=read('src/highfly/p525-world-forge-3d.mjs'),
 game=read('src/highfly/p521-world-forge-runtime.mjs'),
 flat=read('public/highfly/world-forge.js'),ui=read('public/highfly/world-forge-3d.html'),
 build=read('scripts/f0-build.mjs');
for(const [s,re] of [
 [editor,/P532_PREVIEW/],[game,/P532_PREVIEW/],[flat,/P532_PREVIEW/],
 [editor,/function copySelected\(\)/],[editor,/async function pasteCopied\(\)/],
 [editor,/CLIPBOARD_SESSION/],[editor,/e\.key\.toLowerCase\(\)==='c'/],
 [editor,/e\.key\.toLowerCase\(\)==='v'/],[editor,/nativeUnsungFlora\('unsung-tree-'/],
 [editor,/nearStem/],[editor,/farLeaves/],[game,/QUATERNIUS_CC0_IDS\.has/],
 [game,/makePublicUrbanPrefab/],[flat,/localizePublicAsset/],
 [ui,/id="copy-object"/],[ui,/id="paste-object"/],[ui,/id="quality-toggle"/],
 [ui,/WORLD FORGE 4\.[34]/],
 [build,/p532-pinned-quaternius-cc0/],[build,/p532-quaternius-thumbnails/],
 [build,/p532-unsung-tree-thumbnails/],
 ])assert.match(s,re);
assert.ok(ui.includes('id="import-source" hidden'));
assert.ok(!build.includes('KIT_COMPLETO_PARTE_01.zip'));
assert.ok(!build.includes('HIGHFLY_KAYKIT_SOURCE_EDITOR_V1_PRIVATE.zip'));
console.log('[P532 PASS] 221 Spanish KayKit names, 42 authenticated Quaternius CC0 files, 4 public urban models, native trees and PC clipboard');
