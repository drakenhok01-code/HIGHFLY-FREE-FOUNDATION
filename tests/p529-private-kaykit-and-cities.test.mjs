import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=x=>fs.readFileSync(x,'utf8');
const mod=read('src/highfly/p529-private-source-import.mjs');
const editor=read('src/highfly/p525-world-forge-3d.mjs');
const rpg=read('src/highfly/p521-world-forge-runtime.mjs');
const two=read('public/highfly/world-forge.js');
const html=read('public/highfly/world-forge-3d.html');
const build=read('scripts/f0-build.mjs');
const plan=JSON.parse(read('data/highfly/p529-masterplan-15-settlements.json'));
for(const [s,p] of [
 [mod,/indexedDB\.open\(DB_NAME,1\)/],
 [mod,/readPrivateSourceGLB/],
 [mod,/parseStoredZip/],
 [mod,/sha256\(buffer\)/],
 [mod,/new Blob\(\[buffer\]/],
 [mod,/\.setItem\(SOURCE_CATALOG_KEY/],
 [mod,/ZIP_STORED/],
 [editor,/importPrivateSourcePack\(file/],
 [editor,/addPrivateCatalog\(metadata\)/],
 [editor,/readPrivateSourceGLB\(a\.id\)/],
 [editor,/a\.privateModel/],
 [editor,/cat:'KayKit SOURCE'/],
 [rpg,/loadPrivateSourceCatalog\(\)/],
 [rpg,/readPrivateSourceGLB\(type\)/],
 [rpg,/PRIVATE_SOURCE\.get\(o\.type\)/],
 [two,/KayKit SOURCE/],
 [html,/id="import-source"/],
 [html,/id="source-file"/],
 [build,/p529-private-source-import/],
 ])assert.match(s,p,'required private integration hook');
assert.equal(plan.settlements.length,15);
assert.equal(new Set(plan.settlements.map(x=>x.number)).size,15);
assert.equal(new Set(plan.settlements.map(x=>x.name)).size,15);
assert.ok(plan.settlements.every(x=>x.implemented===false&&x.anchor&&x.districts.length>=4),
 '15 towns remain clearly marked unverified plans, never falsely marked as built');
assert.ok(!build.includes('KIT_COMPLETO_PARTE_01.zip'));
assert.ok(!build.includes('HIGHFLY_KAYKIT_SOURCE_EDITOR_V1_PRIVATE.zip'));
assert.ok(!rpg.includes('models/kaykit-source/'));
console.log('[P529 PASS] private local-only SOURCE import, 2D/3D/RPG bridges, 15 validated distinct masterplan entries');
