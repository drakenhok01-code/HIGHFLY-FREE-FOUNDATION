import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {conformingTileGrid,buildingSupportPlan,NATIVE_CONFORM_VERSION} from '../src/highfly/p542-native-conform.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('P542: each 4m stone/dirt tile has 200 dense triangles and follows every real 3D soil elevation',()=>{
 const terrain=(x,z)=>207+Math.sin(x*2.2)*.63+Math.cos(z*1.8)*.48+.17*x;
 const o={id:'path',type:'floor-stone',x:-500,z:-100,yaw:Math.PI/7,scale:1};
 const p=conformingTileGrid(o,{w:4,d:4},terrain,{anchorY:207,divisions:10,raise:.15});
 assert.equal(p.divisions,10);assert.equal(p.count,200);
 assert.equal(p.position.length,363);assert.equal(p.uv.length,242);assert.equal(p.index.length,600);
 const cs=Math.cos(o.yaw),sn=Math.sin(o.yaw);
 for(let k=0;k<p.position.length;k+=3){
  const x=o.x+p.position[k]*cs-p.position[k+2]*sn,z=o.z+p.position[k]*sn+p.position[k+2]*cs;
  assert(Math.abs(p.position[k+1]+207-.15-terrain(x,z))<1e-9);
 }
 assert(p.maximum-p.minimum>.9,'real relief retained, no planar flattening');
 assert.equal(p.terrainSource,'UNSUNG_ORIGINAL');
});
test('P542: free 3D houses adjust their own pillars; original heightfield never changes',()=>{
 const original=(x,z)=>201+.29*x+.19*z+Math.sin(x*.8)*.14;
 const o={id:'home',type:'kaykit-home-a',x:4,z:5,scale:1.1,yaw:.2};
 const before=Array.from({length:5},(_,k)=>original(k*2,5+k));
 const p=buildingSupportPlan(o,{w:10,d:9},original,{topOverride:210});
 assert.equal(p.deformsTerrain,false);
 assert(p.positions.length===9&&p.relief>1);
 assert(p.positions.every(x=>x.height>=0&&x.centerY<=0));
 assert.deepEqual(Array.from({length:5},(_,k)=>original(k*2,5+k)),before);
});
test('P542: both Forge and RPG prohibit creating artificial terrain terraces, share isolated save',()=>{
 const e=read('../src/highfly/p525-world-forge-3d.mjs');
 const r=read('../src/highfly/p521-world-forge-runtime.mjs');
 const h=read('../public/highfly/world-forge-3d.html');
 const b=read('../scripts/f0-build.mjs');
 assert(e.includes("includes('/preview-p542/')"));
 assert(r.includes("includes('/preview-p542/')"));
 assert(e.includes("'hf-world-forge-layout-p542-conform-v1'"));
 assert(r.includes("'hf-world-forge-layout-p542-conform-v1'"));
 assert(e.includes("return !P542_PREVIEW&&P537_PREVIEW"));
 assert(e.includes("if(P542_PREVIEW||!P537_PREVIEW||!map)"));
 assert(r.includes("gradeBuilding=!P542_PREVIEW&&P537_PREVIEW"));
 assert(e.includes("m.fragmentShader=m.fragmentShader.replace(original"));
 assert(e.includes("floor-grass"));
 assert(r.includes("'floor-grass':[4,4]"));
 assert(e.includes("conformingTileGrid(o,{w:a.w,d:a.d},paintedNativeFloorAt"));
 assert(e.includes("nativeRenderedFloorAt(x,z)"));
 assert(r.includes("conformingTileGrid(o,{w:w0,d:d0},nativeY"));
 assert(r.includes("p542Batches"));
 assert(e.includes("const foundation=adaptableBuildingSupports(a,o"));
 assert(r.includes("buildingSupportPlan(o,{w:BOUNDS[o.type][0]"));
 assert(e.includes("repeatPlacement=!P542_PREVIEW"));
 assert(e.includes("const picked=clickPlaced(e)"));
 assert(e.includes("canvas.addEventListener('dblclick'"));
 assert(h.includes('id="tool-dirt"')&&h.includes('id="tool-grass"'));
 assert(h.includes("WORLD FORGE 5.0")&&h.includes('v=p542'));
 assert(b.includes("'p542-native-conform'"));
 assert.equal(NATIVE_CONFORM_VERSION,'p542-native-1');
});
