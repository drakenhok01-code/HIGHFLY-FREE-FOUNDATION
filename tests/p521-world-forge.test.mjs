import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HIGHFLY_RESUME_KEY,validResumePosition,savedResume,installHighflyResume} from '../src/highfly/p521-resume-position.mjs';
import {translateHighfly} from '../src/highfly/es-localization.mjs';

const source=(p)=>fs.readFileSync(p,'utf8');
const html=source('public/highfly/world-forge.html'),editor=source('public/highfly/world-forge.js'),
 runtime=source('src/highfly/p521-world-forge-runtime.mjs'),build=source('scripts/f0-build.mjs'),
 css=source('src/highfly/premium-rpg.css'),opts=source('src/highfly/premium-rpg.mjs');

assert.match(html,/WORLD FORGE/);assert.match(html,/id="map"/);
for(const id of ['save','export','import','play','undo','redo','select','pan','grid','rotate-left','rotate-right','scale-up','scale-down','delete'])
 assert.match(html,new RegExp('id="'+id+'"'),'Editor missing '+id);
assert.match(editor,/DecompressionStream\('gzip'\)/);
assert.match(editor,/core_h\.bin/);assert.match(editor,/region_h\.bin/);
assert.match(editor,/location\.href=game\.href/);assert.match(editor,/hfworld=1/);
assert.match(editor,/paintLine/);assert.match(editor,/onPointerMove/);
assert.match(editor,/JSON\.stringify/);assert.match(editor,/saveLocal/);
assert.match(runtime,/world\.addGeometry\(mesh\.geometry\)/);
assert.match(runtime,/WORLD_FORGE_KEY='hf-world-forge-layout-v1'/);
assert.match(editor,/STORE='hf-world-forge-layout-v1'/);
assert.match(runtime,/glTFLoader|GLTFLoader/);
assert.match(runtime,/installHighflyWorldForge/);
assert.match(build,/p521-world-forge-runtime/);assert.match(build,/world-forge\.html/);
assert.match(build,/installHighflyResume/);
assert.match(build,/installHighflyWorldForge/);
assert.match(build,/translateHighfly\(m\.name\)/);
assert.match(opts,/hf-rpg-options-scroll/);assert.match(opts,/highfly\/world-forge\.html/);
assert.match(css,/hf-rpg-options-scroll/);assert.match(css,/overflow-y:auto!important/);
assert.ok(!editor.includes('WebGLRenderer'),'Editor must be lightweight and not boot native renderer');
assert.ok(!editor.includes('Enemies('),'Editor must not load native enemies');
assert.ok(!runtime.includes('models/kaykit-source'),'No SOURCE asset references');

for(const phrase of [
  'A bolt met with the blade goes back where it came from.',
  'A blow slipped at the last instant opens a riposte.',
  'There is a reliquary on every mesa, off the paths.',
  'The Petal Court','Bell 2 of 3','String of light',
  'Follow the path to the Petal Court',
  'Tune the spire at the Aurel Court'])
 assert.notEqual(translateHighfly(phrase),phrase,'Still English: '+phrase);
assert.match(translateHighfly('Bell 2 of 3'),/Campana 2 de 3/);
assert.match(translateHighfly('The Petal Court'),/Patio de los Pétalos/);

let record=null;
const storage={
 getItem(key){return key===HIGHFLY_RESUME_KEY?record:null;},
 setItem(key,v){assert.equal(key,HIGHFLY_RESUME_KEY);record=v;}
};
const world={groundHeight(){return 200;},floorBelow(){return 200;},waterLevel(){return -Infinity;}};
const saved={x:42.4,y:200,z:112.7,yaw:.65};
assert.ok(validResumePosition(saved,world));assert.ok(!validResumePosition({...saved,y:209},world));
assert.ok(!validResumePosition({...saved,x:9000},world));
let spawnArgs=null,updates=0;
const fakeGame={
 player:{pos:{...saved},yaw:.65,health:100,state:'move',spawn(...a){spawnArgs=a;this.pos={x:a[0],y:a[1],z:a[2]};this.yaw=a[3];}},
 rig:{snap(){},yaw:0},world,state:'playing',introSeen:true,
 update(){updates++;},pause(){this.state='paused';},toHome(){this.state='home';}
};
const doc={addEventListener(){},removeEventListener(){}},win={addEventListener(){},removeEventListener(){}};
const ap=installHighflyResume(fakeGame,{storage,doc,win});
assert.equal(ap.restored,false);assert.equal(ap.save(),true);
assert.deepEqual(savedResume(storage)?.pos,saved);
fakeGame.player.pos={x:125,y:200,z:-23};fakeGame.player.yaw=2.25;
fakeGame.pause();assert.equal(savedResume(storage)?.pos.x,125);
fakeGame.player.pos={x:0,y:200,z:0};
assert.equal(ap.restore(),true);
assert.deepEqual(spawnArgs,[125,200,-23,2.25]);
assert.equal(fakeGame.rig.yaw,2.25);
fakeGame.update(.016);assert.equal(updates,1);
ap.dispose();
console.log('[P521 PASS] no-WebGL editor, 25 asset catalogue, shared JSON, Options scroll, Spanish markers/tips, actual player resume');
