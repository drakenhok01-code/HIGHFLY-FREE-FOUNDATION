import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {translateHighfly} from '../src/highfly/es-localization.mjs';

test('P506 death and safe-place notifications are translated without changing respawn timing',()=>{
  assert.equal(translateHighfly('The note falters'),'Has caído');
  assert.equal(translateHighfly('You will wake at the last safe place'),'Reaparecerás en el último lugar seguro.');
  assert.equal(translateHighfly('Cadence'),'Cadencia');
  const b=fs.readFileSync('scripts/f0-build.mjs','utf8');
  assert.match(b,/patch\('src\/ui\/ui\.js'/);
  assert.match(b,/this\.toast\('Has caído', 'Reaparecerás en el último lugar seguro\.'/);
  assert.match(b,/type === 'respawn' && !g\.cine/);
  assert.match(b,/this\.toast\('Has reaparecido', 'Regresaste al último lugar seguro\.'/);
  assert.doesNotMatch(b,/patch\('src\/game\/game\.js',[\s\S]*?respawnAtCheckpoint\(\)/,'death/respawn must preserve native physical state');
});

test('P506 squared horizontal rock distances preserve original visibility for positive radii',()=>{
  // Compare native hypot and optimized expression over distant and near cells,
  // avoiding exact floating-point threshold equality.
  let seed=0xCACEDEAD;
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
  for(let i=0;i<30000;i++){
    const dx=(random()-.5)*20000,dz=(random()-.5)*20000;
    const reach=2+random()*800;
    const native=Math.hypot(dx,dz)<reach;
    const fast=dx*dx+dz*dz<reach*reach;
    assert.equal(fast,native);
  }
  const b=fs.readFileSync('scripts/f0-build.mjs','utf8');
  assert.match(b,/patch\('src\/world\/rocks\.js'/);
  assert.match(b,/hfDistSq<hfRockRadius\*hfRockRadius/);
  assert.match(b,/hfDistSq<hfTwinRadius\*hfTwinRadius/);
  assert.match(b,/src\/world\/rocks\.js/);
});
