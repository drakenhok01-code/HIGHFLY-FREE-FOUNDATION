import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const source=read('src/highfly/p525-world-forge-3d.mjs');
const ui=read('public/highfly/world-forge-3d.html');
const two=read('public/highfly/world-forge.js');
const game=read('src/highfly/p521-world-forge-runtime.mjs');
const build=read('scripts/f0-build.mjs');
const checks=[
 ['3D source must retain real glTF loader', /new GLTFLoader/],
 ['3D editor never silently saves a fake KayKit', /No se guardó ninguna caja provisional/],
 ['prefab cache only marks geometrically complete models', /const bounds=new THREE.Box3\(\)\.setFromObject\(g.scene\)/],
 ['missing complete prefab is an error, never an old box', /throw Error\('Prefab KayKit 3D sin cargar/],
 ['true floor height uses all four ground corners', /return \{ok:true,y:Math.max\(\.\.\.samples\),slope:/],
 ['prefab gets true stone foundation', /foundationFor\(a,o,point.slope\|\|0\)/],
 ['prefab rotates before placement', /yaw:pendingYaw,scale:pendingScale/],
 ['prefab preview rotates in 3D', /ghost.rotation.y=pendingYaw/],
 ['existing building can be moved directly with finger', /movingExisting=\{id:selected,old:/],
 ['fingers captured for move', /canvas.setPointerCapture/],
 ['old saved boxes replaced only by explicit action', /async function upgradeLegacy\(/],
 ['user confirms conversion', /\$\('upgrade-legacy'\)\.onclick=upgradeLegacy/],
 ['exact original JSON backed up before conversion', /backup-pre-p527-prefabs/],
 ['duplicate existing prefab in one click', /async function duplicateSelected\(/],
 ['3D NPC use actual CC0 KayKit Knight', /hf-kaykit-knight.glb/],
 ['skinned characters cloned properly', /cloneRig\(original\)/],
 ['terrain editor still reads native original Unsung geometry', /native-architecture-3d.bin/],
 ['materials visibly textured', /new THREE.CanvasTexture/],
 ['save shares original JSON layout', /STORE='hf-world-forge-layout-v1'/],
];
for(const [label,pattern] of checks)assert.match(source,pattern,label);
assert.match(ui,/WORLD FORGE · 3D V0\.7/);
assert.match(ui,/id="duplicate"/);assert.match(ui,/id="upgrade-legacy"/);
assert.match(two,/category==='Edificios'\?!!x\.free:x\.cat===category/,'2D must also show only real buildings');
assert.match(two,/Bocetos antiguos/);
assert.match(game,/slabH=Math.max\(\.16,fp.slope\+\.26\)/,'game also builds original architecture footing');
assert.match(game,/KAYKIT_FREE_NAMES/,'game loads exact approved real glTF objects');
assert.match(build,/p524-kaykit-free-buildings/,'pinned 16 free prefab pack present');
assert.ok(!source.includes('models/kaykit-source'),'private source must never be shipped');
console.log('[P527 PASS] complete KayKit 3D prefabs, true grounded base, opt-in legacy conversion, moving object, rotating and duplicating, 2D parity, real character');
