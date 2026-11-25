import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const source=path=>fs.readFileSync(path,'utf8');
const native=source('src/highfly/p536-native-editor-visuals.mjs');
const bends=source('src/highfly/p536-modular-cobble-kit.mjs');
const editor=source('src/highfly/p525-world-forge-3d.mjs');
const runtime=source('src/highfly/p521-world-forge-runtime.mjs');
const builder=source('scripts/f0-build.mjs');
const page=source('public/highfly/world-forge-3d.html');
test('Modular closed (4 m) and open (8 m) real stone pieces share editor and RPG geometry',()=>{
 for(const [id,size] of [['floor-stone-curve-tight',4],['floor-stone-curve-wide',8]]){
  assert.ok(bends.includes(id),id);
  assert.match(bends,new RegExp('size:'+size));
  assert.match(page,new RegExp('Curva '+size+' m'));
 }
 assert.match(bends,/makeModularCobbleTile3D/);
 assert.match(editor,/makeModularCobbleTile3D/);
 assert.match(runtime,/makeModularCobbleTile3D/);
 assert.match(editor,/Math\.PI\/2/);
 assert.match(runtime,/P536_PREVIEW/);
 assert.match(runtime,/hf-world-forge-layout-p536-v1/);
 assert.match(editor,/hf-world-forge-layout-p536-v1/);
 assert.match(editor,/hf-world-forge-layout-p533-v1/);
 assert.match(bends,/cobbleMaterials\(\)/);
 assert.match(runtime,/disposeModularCobbleGeometry/);
});
test('Editor builds the ORIGINAL Unsung 9 material layers with EXACT native source shaders and TextureForge',()=>{
 assert.match(native,/import \{TextureForge\} from '\.\.\/engine\/forge\.js'/);
 assert.match(native,/import \{TERRAIN_MATERIALS\} from '\.\.\/world\/terrainMaterials\.js'/);
 assert.match(native,/new TextureForge\(renderer\)\.bake\(TERRAIN_MATERIALS/);
 assert.match(native,/uUnsungAlbedo/);
 assert.match(native,/uUnsungDetail/);
 assert.match(native,/originalUnsungPathMask\(overview\)/);
 assert.match(editor,/nativeEditorTerrainMaterial\(renderer,overview/);
 assert.match(builder,/p536-native-editor-visuals/);
 assert.match(builder,/p536-modular-cobble-kit/);
});
test('Water is static with sea/mesa depth from original Unsung TWO packed 16-bit heightfields',()=>{
 assert.match(native,/nativeEditorStaticDepthWater/);
 assert.match(native,/native-terrain-/);
 assert.match(native,/uCoreMinMax/);
 assert.match(native,/uRegionMinMax/);
 assert.match(native,/smoothstep\(1\.2,30\.0,d\)/);
 assert.match(native,/NO_WAVES_NO_REFLECTIONS/);
 const waterFragment=native.split('const WATERF=')[1].split('const LEAFV=')[0];
 assert.doesNotMatch(waterFragment,/uTime|uWaves|uOpaque|uLinDepth|reflection|refraction/i);
 assert.match(editor,/nativeWater\?\.material/);
});
test('Original MIT tree and meadow assets: Unsung native leaf atlas, triple-blade cover, near-field instancing',()=>{
 assert.match(native,/import \{bakeLeafAtlas\} from '\.\.\/world\/flora\/leafAtlas\.js'/);
 assert.match(native,/bakeLeafAtlas\(renderer/);
 assert.match(native,/new THREE\.InstancedMesh\(bladeGeometry\(\)/);
 assert.match(native,/pos\.push\(-1,0,b, 1,0,b, -1,\.58,b, 1,\.58,b, 0,1,b\)/);
 assert.match(editor,/nativeEditorOriginalLeaves/);
 assert.match(editor,/nativeGrass\?\.update\(orbit\.target\.x/);
 assert.match(native,/nearClearings=records\(\)\.filter/);
});
test('Never ship private purchased packs through preview; originals remain intact',()=>{
 assert.doesNotMatch(native,/readPrivateSourceGLB|importPrivateSourcePack|KIT_COMPLETO|[.]zip\\b/);
 assert.doesNotMatch(bends,/SOURCE.*(?:load|fetch|https)/);
 assert.match(builder,/p536-native-editor-visuals/);
 assert.match(page,/WORLD FORGE 4\.4/);
 assert.match(page,/p536-bend-tight/);
 assert.match(page,/p536-bend-wide/);
});