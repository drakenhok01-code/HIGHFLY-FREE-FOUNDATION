/** P503 – exercises ORIGINAL Unsung GroundCover.update, no fake grass shader. */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GroundCover} from '../world/flora/grass.js';
let calls=0,matrices=0;
const terrain={heightAt(x,z){calls++;return x*.005+z*.002+1;}};
const cells=[];
for(let j=0;j<4;j++)for(let i=0;i<4;i++){
 const mesh={position:new THREE.Vector3(),geometry:null,visible:false,
  updateMatrixWorld(){matrices++}};
 cells.push({i,j,mesh,size:16,n:4,grass:true});
}
const cover=Object.create(GroundCover.prototype);
cover.cells=cells;cover.radius=100;cover.grassGeo=[{id:0},{id:1},{id:2}];cover.terrain=terrain;
const camera=new THREE.PerspectiveCamera();
function update(x,z){
 camera.position.set(x,5,z);camera.updateMatrixWorld(true);
 GroundCover.prototype.update.call(cover,camera);
}
function referenceCell(c,x,z){
 const n=c.n,S=c.size,bi=Math.floor(x/S)-(n>>1),bj=Math.floor(z/S)-(n>>1);
 const ci=bi+((((c.i-bi)%n)+n)%n),cj=bj+((((c.j-bj)%n)+n)%n);
 const px=ci*S,pz=cj*S,y=(px+S/2)*.005+(pz+S/2)*.002+1;
 const d=Math.hypot(px+S/2-x,pz+S/2-z,y-5);
 return {px,pz,y,visible:d<cover.radius+S&&y>.5,lod:d<30?0:d<52?1:2};
}
update(0,0);
const firstCalls=calls,firstMatrices=matrices;
assert.equal(firstCalls,16);
for(const c of cells){
 const e=referenceCell(c,0,0);
 assert.equal(c.mesh.visible,e.visible);
 if(e.visible){assert.equal(c.mesh.position.x,e.px);assert.equal(c.mesh.position.y,e.y);assert.equal(c.mesh.position.z,e.pz);assert.equal(c.mesh.geometry,cover.grassGeo[e.lod]);}
}
update(0,0);
assert.equal(calls,firstCalls,'unchanged grass cells must not resample terrain');
assert.equal(matrices,firstMatrices,'unchanged tiles must not rebuild world matrices');
update(4,4);
assert.equal(calls,firstCalls,'subcell walking must reuse exact ground heights');
for(const c of cells){
 const e=referenceCell(c,4,4);
 assert.equal(c.mesh.visible,e.visible);
 if(e.visible){assert.equal(c.mesh.position.y,e.y);assert.equal(c.mesh.geometry,cover.grassGeo[e.lod]);}
}
update(20,4);
assert.ok(calls>firstCalls,'grid boundary must invalidate changed cells');
const callsAfter=calls;
update(20,4);assert.equal(calls,callsAfter);
console.log('[HIGHFLY P503 PIXEL-IDENTICAL GRASS GRID PASS]',JSON.stringify({cells:cells.length,firstCalls,callsAfter,lastMatrixWrites:matrices}));
