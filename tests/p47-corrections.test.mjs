import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeRpgState,inventoryRows,occupiedInventorySlots,ITEM_DEFS} from '../src/highfly/rpg-core.mjs';
const file=p=>fs.readFileSync(p,'utf8');
test('P4.8: consumables and identical equipment stack while preserving each equipment trait',()=>{
 const bag=normalizeRpgState(null);
 bag.items={hp_potion:24,mp_potion:17,upgrade_stone:18,upgrade_stone_advanced:11,
  coal:45,ore:38,ore_copper:27,ore_iron:26,ore_silver:25,
  ingot_copper:19,ingot_iron:20,raw_diamond:9,
  training_sword:4,hf_iron_chest:3,hf_copper_ring:2};
 const rows=inventoryRows(bag);
 for(const id of ['hp_potion','mp_potion','upgrade_stone','upgrade_stone_advanced',
  'coal','ore','ore_copper','ore_iron','ore_silver','ingot_copper','ingot_iron','raw_diamond']){
  assert.equal(rows.filter(x=>x.id===id).length,1,'Expected exactly one visual stack for '+id);
  assert.equal(rows.find(x=>x.id===id).count,bag.items[id]);
 }
 for(const id of ['training_sword','hf_iron_chest','hf_copper_ring']){
  assert.equal(rows.filter(x=>x.id===id).length,1);
  assert.equal(rows.find(x=>x.id===id).count,bag.items[id]);
 }
 assert.equal(occupiedInventorySlots(bag),12+1+1+1);
});
test('P4.7: 1000 units of one material use two physical slots, not 1000',()=>{
 const bag=normalizeRpgState(null);bag.items.coal=1000;
 const rows=inventoryRows(bag).filter(x=>x.id==='coal');
 assert.deepEqual(rows.map(x=>x.count),[999,1]);
});
test('P4.7: menu always starts and reopens on Personaje, not last visited Opciones',()=>{
 const src=file('src/highfly/premium-rpg.mjs');
 assert.match(src,/local\.opened=true;local\.tab=tab==='bolsa'\?'bolsa':'personaje'/);
 assert.match(src,/local\.opened=false;local\.tab='personaje';root\.hidden=true/);
});
test('P4.7: quest last card accessible within independently scrolling column',()=>{
 const css=file('src/highfly/premium-p47.css');
 assert.match(css,/\.hf-rpg-quest-list\{/);
 assert.match(css,/flex:1 1 0!important/);
 assert.match(css,/padding:3px 9px 20px 2px!important/);
 const ui=file('src/highfly/premium-rpg.mjs');
 assert.match(ui,/if\(b\.dataset\.hfQuest\)[\s\S]*?detail\.innerHTML=questDetails\(\)/);
});
test('P4.7: pending professions have explicit no-recipes explanation; right side no scroll',()=>{
 const ui=file('src/highfly/premium-rpg.mjs');
 assert.match(ui,/Oficio en preparación: aún no dispone de recetas ni acciones propias/);
 assert.match(ui,/RECETAS PENDIENTES/);
 const css=file('src/highfly/premium-p47.css');
 assert.match(css,/\.hf-p42-professions>\.hf-rpg-panel:last-child\{/);
 assert.match(css,/overflow:hidden!important;overflow-y:hidden!important/);
});
test('P4.7: progress is tied to actual working craft state, not perpetual spinner',()=>{
 const ui=file('src/highfly/premium-rpg.mjs'),css=file('src/highfly/premium-p47.css');
 assert.match(ui,/data-hf-forge-working/);
 assert.match(css,/data-hf-forge-working="true"/);
 assert.match(css,/@keyframes hf-p47-real-forge-progress/);
});
