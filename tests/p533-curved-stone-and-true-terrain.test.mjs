import assert from 'node:assert/strict';
import fs from 'node:fs';
import {KAYKIT_FREE_ALL,KAYKIT_FREE_GROUPS} from '../src/highfly/p531-kaykit-free-catalog.mjs';
import {CURVED_ROAD_TYPE,roadPathValid,sampleCurvedRoad,distanceToCurvedRoad,roadClearance,ROAD_WIDTHS} from '../src/highfly/p533-curved-road-path.mjs';
import {buildWorldForgeCityMask} from '../src/highfly/p530-city-ground-mask.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const road={id:'hf-road-test',type:CURVED_ROAD_TYPE,x:-512,z:-84,y:180,yaw:0,scale:1,
  width:8,clearTrees:true,points:[[-512,-84],[-496,-62],[-472,-80]]};
const ok=roadPathValid(road);assert.ok(ok.ok);
assert.ok(ok.length>45&&ok.length<100);
const samples=sampleCurvedRoad(road.points,.72);
assert.ok(samples.length>50&&samples.length<180);
assert.deepEqual([samples[0].x,samples[0].z],road.points[0]);
const last=samples.at(-1);
assert.deepEqual([last.x,last.z],road.points.at(-1));
for(let i=1;i<samples.length;i++){
 assert.ok(Math.hypot(samples[i].x-samples[i-1].x,samples[i].z-samples[i-1].z)<2,
  'P533 must not leave gaps between cobblestone segments');
 assert.ok(samples[i].s>samples[i-1].s);
 assert.ok(Math.abs(Math.hypot(samples[i].nx,samples[i].nz)-1)<.01);
}
assert.ok(distanceToCurvedRoad(-496,-62,samples)<.12);
assert.ok(roadClearance(-496,-62,road,samples));
assert.ok(!roadClearance(-550,-90,road,samples));
assert.deepEqual(ROAD_WIDTHS,[4,8,12]);
for(const bad of [
 {...road,points:[[-512,-84]]},
 {...road,width:99},
 {...road,points:[[-512,-84],[-512,-84]]},
 {...road,points:[[-9120,-84],[-512,-66]]},
 {...road,points:Array.from({length:25},(_,i)=>[i*3,i*4])}
 ])assert.equal(roadPathValid(bad).ok,false);
const grounds=buildWorldForgeCityMask([road],{[CURVED_ROAD_TYPE]:[6,6]},{resolution:512,worldSize:2048});
assert.equal(grounds.resolution,512);assert.equal(grounds.surfaces,1);
assert.ok(grounds.painted>20&&grounds.painted<500,'road must remove vegetation only in curvy paving footprint');
const idx=(x,z)=>Math.floor((z+1024)/4)*512+Math.floor((x+1024)/4);
assert.equal(grounds.mask[idx(-496,-62)],255);
assert.equal(grounds.mask[idx(-560,-140)],0);
assert.equal(KAYKIT_FREE_ALL.length,221);
assert.deepEqual(KAYKIT_FREE_GROUPS,{buildings:72,architecture:21,nature:42,props:26,hex:60});
for(const color of ['red','blue','green','yellow'])
 assert.equal(KAYKIT_FREE_ALL.filter(a=>a.kind==='building'&&a.colour===color).length,18,
  'all 18 complete free building variants must remain available in every color');
const editor=read('src/highfly/p525-world-forge-3d.mjs'),
 game=read('src/highfly/p521-world-forge-runtime.mjs'),
 flat=read('public/highfly/world-forge.js'),
 html=read('public/highfly/world-forge-3d.html'),
 render=read('src/highfly/p533-curved-road-3d.mjs'),
 heights=read('scripts/p523-native-terrain-png.py'),
 build=read('scripts/f0-build.mjs');
for(const [s,re] of [
 [editor,/P533_PREVIEW/],[game,/P533_PREVIEW/],[flat,/P533_PREVIEW/],
 [editor,/function startRoadDraft\(/],[editor,/function finishRoadDraft\(/],
 [editor,/function drawRoadPreview\(/],[editor,/roadDragIndex/],
 [editor,/canvas\.addEventListener\('dblclick'/],[editor,/roadClearance/],
 [game,/makeCurvedCobblestone3D\(o,groundRoad\)/],
 [game,/disposeCurvedRoadGeometry\(a\.model\)/],
 [flat,/sampleCurvedRoad/],[flat,/distanceToCurvedRoad/],
 [html,/WORLD FORGE 4\.3/],[html,/id="road-finish"/],
 [html,/id="curved-road"/],[html,/id="road-edit"/],
 [render,/CanvasTexture/],[render,/bordillo de piedra izquierdo/],
 [render,/bordillo de piedra derecho/],
 [heights,/high=\(height>160\)&\(slope>1\.15\)/],
 [build,/p533-curved-road-path/],[build,/p533-curved-road-3d/]
 ])assert.match(s,re);
assert.ok(!build.includes('KIT_COMPLETO_PARTE_01.zip'),'no source leak');
console.log('[P533 PASS] continuous curved cobble spline + both borders + true grass mask + 72 actual free buildings + original Unsung terrain');
