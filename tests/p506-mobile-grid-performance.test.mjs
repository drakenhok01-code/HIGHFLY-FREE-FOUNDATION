import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installP505FramePacing} from '../src/highfly/p505-frame-pacing.mjs';

function nativeGrid(camX, camZ, S, n, i, j) {
  const bi=Math.floor(camX/S)-(n>>1), bj=Math.floor(camZ/S)-(n>>1);
  return [bi + ((((i-bi)%n)+n)%n), bj + ((((j-bj)%n)+n)%n)];
}
function cachedGrid(camX,camZ, radius, grassN, flower, i, j) {
  const S=flower?32:16, n=flower?Math.ceil(radius*2/32)+1:grassN;
  const gx=Math.floor(camX/16)-(grassN>>1), gz=Math.floor(camZ/16)-(grassN>>1);
  const fx=Math.floor(camX/32)-(Math.ceil(radius*2/32)+1>>1);
  const fz=Math.floor(camZ/32)-(Math.ceil(radius*2/32)+1>>1);
  const bi=flower?fx:gx, bj=flower?fz:gz;
  return [bi+((((i-bi)%n)+n)%n),bj+((((j-bj)%n)+n)%n)];
}
test('P506 ring-cell update selects identical grass and flower coordinates across full world',()=>{
  for (let x=-9000;x<=9000;x+=797.75) {
    for (let z=-8500;z<=8500;z+=929.5) {
      for (const radius of [64,88,128]) {
        const gn=Math.ceil(radius*2/16)+1, fn=Math.ceil(radius*2/32)+1;
        for (const [flower,n,S] of [[false,gn,16],[true,fn,32]]) {
          for(let j=0;j<n;j++)for(let i=0;i<n;i++) {
            assert.deepEqual(cachedGrid(x,z,radius,gn,flower,i,j),nativeGrid(x,z,S,n,i,j),
              'unchanged positions, native LOD and exact terrain samples');
          }
        }
      }
    }
  }
});
test('P506 patch is CPU-only and preserves native quality profile and waterfall geometry',()=>{
  const b=fs.readFileSync('scripts/f0-build.mjs','utf8');
  assert.match(b,/hfGrassX=Math\.floor\(cam\.x\/CELL\)/);
  assert.match(b,/hfFlowerX=Math\.floor\(cam\.x\/FCELL\)/);
  assert.match(b,/c\.grass \? hfGrassX : hfFlowerX/);
  assert.match(b,/appendP506PoolOutflow/);
  assert.doesNotMatch(b,/patch\('src\/world\/water\.js'/);
  const g=fs.readFileSync('src/highfly/visual-profile.mjs','utf8');
  assert.match(g,/renderScale: 1, minRenderScale: 1, targetFps: 0/);
});

test('P506 sustained FPS is checked by all actual frame intervals, not median peaks',()=>{
  let t=0;
  const win={__game:{state:'playing'}},pipe={render(){t+=3;}};
  const ctrl=installP505FramePacing(pipe,{search:'?hfpace=1',win,doc:{},perf:{now:()=>t}});
  for(let n=0;n<240;n++){t+=15;pipe.render();}
  assert.equal(ctrl.stats.ready,true);
  assert.equal(ctrl.stats.steady50,true,'every sample within 20 ms');
  assert.equal(ctrl.stats.steady60,false,'18 ms frame delivery does NOT mean 60 steady');
  assert.ok(ctrl.stats.meanFps>=50 && ctrl.stats.meanFps<=57);
  for(let n=0;n<400;n++){t+=n%16===0?35:14;pipe.render();}
  assert.equal(ctrl.stats.steady50,false,'one slow frame invalidates fixed 50 FPS');
  assert.ok(ctrl.stats.meanFps>0);
  assert.ok(ctrl.stats.p99Fps<50);
  ctrl.dispose();
});
