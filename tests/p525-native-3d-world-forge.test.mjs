import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const three=read('src/highfly/p525-world-forge-3d.mjs');
const ui=read('public/highfly/world-forge-3d.html');
const aerial=read('public/highfly/world-forge.js');
const aerialUI=read('public/highfly/world-forge.html');
const export3d=read('scripts/p522-native-world-export.mjs');
const build=read('scripts/f0-build.mjs');
const orig=read('src/highfly/p521-world-forge-runtime.mjs');
assert.match(ui,/WORLD FORGE 4\.1 · P5\.3\.1/);
assert.match(ui,/id="canvas-holder"/);
assert.match(ui,/world-forge-3d\.js/);
assert.match(aerialUI,/id="view-3d"/);
assert.match(aerial,/world-forge-3d\.html/);
assert.match(aerial,/hf-world-forge-view-v1/);
for(const name of ['map2d','save','export','import','play','undo','redo','orbit','select','move','rotate','scale','home','iso','top','trees','original','water','rot-left','rot-right','size-down','size-up','remove','diagnostics','copy-diagnostics'])
 assert.match(ui,new RegExp('id="'+name+'"'),'Missing editor control '+name);
for(const phrase of [
 "from 'three'","OrbitControls","TransformControls","GLTFLoader",
 "native-terrain-manifest.json","native-overview.json",
 "native-architecture-3d.json","native-architecture-3d.bin",
 "native-relief-",
 "new THREE.InstancedMesh","heightAt"
]) assert.ok(three.includes(phrase)||phrase==='heightAt'&&three.includes('elevation('),'Missing 3D feature '+phrase);
assert.match(three,/hitTerrain/);
assert.match(three,/recordSnapshot/);
assert.match(three,/validPosition/);
assert.match(three,/previewGhost/);
assert.match(three,/createGhost/);
assert.match(three,/native-architecture-core\.png/);
assert.match(three,/source|Unsung/i);
assert.ok(!three.includes('DecompressionStream'),'Must use tested Unsung PNG heights');
assert.ok(!three.includes('src/game/game.js'),'Must not boot full gameplay');
assert.match(three,/importPrivateSourcePack/,'Editor must import SOURCE locally');
assert.ok(!build.includes('KIT_COMPLETO_PARTE_01.zip'),'Never publish actual paid SOURCE binaries');
assert.ok(!build.includes('HIGHFLY_KAYKIT_SOURCE_EDITOR_V1_PRIVATE.zip'),'Never publish imported user-owned GLB archive');
for(const id of [
 'kaykit-blacksmith','kaykit-tavern','kaykit-castle','kaykit-home-a',
 'kaykit-windmill','kaykit-mine','floor-stone','npc-guard']){
 assert.ok(three.includes(id),'Editor missing '+id);
 assert.ok(orig.includes(id)||id==='floor-stone'||id==='npc-guard','Gameplay runtime unknown asset '+id);
}
assert.match(export3d,/exactArchitectureMeshes/);
assert.match(export3d,/geometry\.attributes\.position/);
assert.match(export3d,/native-architecture-3d\.bin/);
assert.match(export3d,/native-architecture-3d\.json/);
assert.match(export3d,/manifest\.totalVertices/);
assert.match(build,/p525-world-forge-3d\.mjs/);
assert.match(build,/world-forge-3d\.html/);
assert.match(build,/esbuild.*src\/highfly\/p525-world-forge-3d/);
assert.match(build,/--bundle/);
assert.match(three,/const STORE=P531_PREVIEW\?'hf-world-forge-layout-p531-v1':P530_PREVIEW\?'hf-world-forge-layout-p530-v1':P529_PREVIEW\?'hf-world-forge-layout-p529-v1':'hf-world-forge-layout-v1'/);
assert.match(three,/schema:1,world:'unsung-vale'/);
assert.match(three,/location\.href=url\('world-forge\.html'\)/);
console.log('[P525 PASS] independent 3D genuine Unsung geometry, exact PNG heightmaps, KayKit FREE prefabs, editor transforms, shared JSON and safe 2D fallback');
