import test from 'node:test';
import assert from 'node:assert/strict';
import {safeCliffCameraDistance} from '../.work/unsung/src/highfly/cliff-camera.mjs';
const pivot={x:0,y:2,z:0};
const dir={x:1,y:0,z:0};
const stub=(ground=()=>0,raycast=(origin,d,max)=>max)=>({groundHeight:ground,raycast});
test('Cliff camera keeps original open-world follow distance on flat terrain',()=>{
 const world=stub();
 assert.equal(safeCliffCameraDistance(world,pivot,dir,5.5,5.2),5.2);
});
test('Cliff camera does not penetrate giant terrain face, even when native collider ray missed it',()=>{
 const cliff=stub((x,z)=>x>=2.2?45:0);
 const result=safeCliffCameraDistance(cliff,pivot,dir,5.6,5.6);
 assert.ok(result>1.5&&result<2.2,'Camera must stop before giant cliff: '+result);
});
test('Cliff camera uses lateral probes to detect cliff surface missed by central ray',()=>{
 const world=stub(()=>0,(origin,d,max)=>origin.z<-.1?1.7:max);
 const result=safeCliffCameraDistance(world,pivot,dir,5.4,5.4);
 assert.equal(result,5.4,'Scattered small rocks remain controlled by original native collision');
 const cliff=stub((x,z)=>x>=1.6&&z<-.1?23:0,(origin,d,max)=>origin.z<-.1?1.7:max);
 const corrected=safeCliffCameraDistance(cliff,pivot,dir,5.4,5.4);
 assert.ok(corrected<2,'Lateral cliff should protect near-geometry camera: '+corrected);
});
test('Cliff camera bounds invalid collider and maintains safe minimum clearance',()=>{
 assert.equal(safeCliffCameraDistance(null,pivot,dir,5,4.6),4.6);
 const giant=stub(()=>200,()=>0.1);
 assert.ok(safeCliffCameraDistance(giant,pivot,dir,5,4.8)>=.38);
});
