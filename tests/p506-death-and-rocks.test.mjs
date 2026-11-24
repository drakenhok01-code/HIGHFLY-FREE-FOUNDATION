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

test('P506 regression safeguard: do not patch native rock visibility after FPS drop',()=>{
  const b=fs.readFileSync('scripts/f0-build.mjs','utf8');
  assert.doesNotMatch(b,/patch\('src\/world\/rocks\.js'/);
  assert.match(b,/appendP506PoolOutflow/);
  assert.match(b,/this\.toast\('Has caído', 'Reaparecerás en el último lugar seguro\.'/);
});
