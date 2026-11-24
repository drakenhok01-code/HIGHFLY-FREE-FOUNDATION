import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { appendP506PoolOutflow } from '../src/highfly/p506-waterfall-joins.mjs';

test('P506 waterfall join overlaps the original pool disc and meets original fall lip exactly', () => {
  const p={x:60,z:-400,r:46,level:147,out:[0.1,0.99]};
  const pos=[],info=[],idx=[];
  const s=78; // terrain lookup reaches the cliff at this distance
  const j=appendP506PoolOutflow(p,s,pos,info,idx);
  assert.equal(j.joined,true);
  assert.ok(j.segments>=2 && j.segments<=64);
  assert.ok(j.start<p.r+10, 'upper source must overlap the native 56m water disc');
  assert.equal(j.end,s-1.5,'lip matches Unsung start geometry');
  assert.equal(pos.length,(j.segments+1)*6);
  assert.equal(info.length,(j.segments+1)*6);
  assert.equal(idx.length,j.segments*6);
  const lastY=pos[pos.length-5];
  assert.ok(Math.abs(lastY-(p.level-0.5))<1e-8, 'outflow tip must meet original fall Y');
  const dx=p.out[0],dz=p.out[1];
  const lastCenterX=(pos[pos.length-6]+pos[pos.length-3])/2;
  const lastCenterZ=(pos[pos.length-4]+pos[pos.length-1])/2;
  assert.ok(Math.abs(lastCenterX-(p.x+dx*(s-1.5+0.4)))<1e-8);
  assert.ok(Math.abs(lastCenterZ-(p.z+dz*(s-1.5+0.4)))<1e-8);
  assert.ok(pos.every(Number.isFinite) && info.every(Number.isFinite));
});

test('P506 leaves directly connected pools and invalid extremes unchanged', () => {
  const p={x:0,z:0,r:32,level:155,out:[0,1]},positions=[],info=[],idx=[];
  assert.equal(appendP506PoolOutflow(p,35,positions,info,idx).joined,false);
  assert.equal(appendP506PoolOutflow(p,Infinity,positions,info,idx).joined,false);
  assert.equal(appendP506PoolOutflow(p,400,positions,info,idx).joined,false);
  assert.equal(positions.length,0);
  assert.equal(info.length,0);
  assert.equal(idx.length,0);
});

test('P506 is wired into native static waterfall batch, not a second render pass', () => {
  const build=fs.readFileSync('scripts/f0-build.mjs','utf8');
  assert.match(build,/src\/world\/waterfalls\.js/);
  assert.match(build,/appendP506PoolOutflow/);
  assert.match(build,/src\/highfly\/p506-waterfall-joins\.mjs/);
  assert.match(build,/src\/world\/waterfalls\.js/);
  assert.doesNotMatch(build,/patch\('src\/world\/water\.js'/);
});
