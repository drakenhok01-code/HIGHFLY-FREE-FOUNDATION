import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EASTBROOK_PILOT_SPECS,buildEastbrookPilot} from '../src/highfly/p534-eastbrook-pilot.mjs';
const towns=JSON.parse(readFileSync(new URL('../data/highfly/p534-claude-towns-on-unsung.json',import.meta.url),'utf8'));
test('13 towns mapped with no copied restricted ClaudeCraft 3D assets',()=>{
 assert.equal(towns.towns.length,13);
 assert.equal(new Set(towns.towns.map(x=>x.claudecraft)).size,13);
 assert.equal(towns.towns[0].highfly,'Arvelia · Pueblo de los Inicios');
 assert.deepEqual(towns.towns[0].anchor,{x:-512,z:-70});
 assert(towns.towns.every(x=>x.placed===false&&x.terrainValidated===false));
 assert(towns.restrictions.some(x=>x.includes('KayKit FREE/CC0')));
});
test('six source roles and separate Unsung guild',()=>{
 assert.equal(EASTBROOK_PILOT_SPECS.filter(x=>x.sourceId).length,6);
 assert.deepEqual(new Set(EASTBROOK_PILOT_SPECS.filter(x=>x.sourceId).map(x=>x.role)),new Set(['banco','herreria','taberna','capilla','botica','casa_muelle']));
 assert(EASTBROOK_PILOT_SPECS.some(x=>x.type==='unsung-hall'&&x.required));
});
test('all buildings are editable and validated by caller; complete on mock flat lot',()=>{
 const result=buildEastbrookPilot({canPlace:o=>({ok:true,y:47}),existing:[]});
 assert.equal(result.complete,true);
 assert.equal(result.primary,6);
 assert(result.roles.includes('gremio_highfly'));
 assert(result.objects.every(x=>x.y===47&&x.clearTrees===true&&x.highflyTown==='eastbrook'));
 assert.equal(new Set(result.objects.map(x=>x.id)).size,result.objects.length);
 assert.equal(new Set(result.objects.map(x=>x.type)).has('unsung-hall'),true);
});
test('all terrain forbidden gives no changes and complete=false',()=>{
 const result=buildEastbrookPilot({canPlace:()=>({ok:false})});
 assert.equal(result.complete,false);
 assert.equal(result.objects.length,0);
 assert(result.requiredMissing.length>=7);
});
