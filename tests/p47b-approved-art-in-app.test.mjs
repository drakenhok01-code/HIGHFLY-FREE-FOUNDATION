import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeRpgState,inventoryRows,occupiedInventorySlots,ITEM_DEFS} from '../src/highfly/rpg-core.mjs';
const src=p=>fs.readFileSync(p,'utf8');

test('P47B: approved paintings imported after P46 and before unchanged existing rarity frames',()=>{
 const build=src('scripts/f0-build.mjs');
 const legacy=build.indexOf("'scripts/highfly-p46-material-art.py'");
 const approved=build.indexOf("'scripts/highfly-p47b-approved-icons.py'");
 const framed=build.indexOf("'scripts/highfly-p43-premium-art.py'");
 const normalized=build.indexOf("'scripts/highfly-p44-align-art.py'");
 assert.ok(legacy>0&&legacy<approved&&approved<framed&&framed<normalized,
  'Approved icon source must feed existing frame pipeline');
 assert.match(build,/assets\/highfly\/p47\/source-12-icons\.jpg/);
 assert.match(src('scripts/highfly-p47b-approved-icons.py'),/triple_copper_ingot/);
});

test('P47B: all twelve real item IDs have current premium icon mappings',()=>{
 const map=src('src/highfly/premium-assets.mjs');
 const needed=['ore','coal','ore_copper','ore_iron','ore_silver','ore_gold',
  'raw_diamond','raw_obsidian','ore_mithril','ingot_copper',
  'upgrade_stone','upgrade_stone_advanced'];
 for(const id of needed){
  assert.ok(ITEM_DEFS[id],'Missing ITEM_DEFS '+id);
  assert.ok(map.includes(id),'Missing premium asset mapping '+id);
 }
 assert.match(map,/assetUrl\('rarity\/'\+rel/);
});

test('P4.8: materials and identical equipment/accessories stack; unique traits remain separate',()=>{
 const state=normalizeRpgState(null);
 state.items={...state.items,ore_copper:16,coal:40,ore_iron:11,ingot_copper:27,
  upgrade_stone:9,upgrade_stone_advanced:6,training_sword:3,
  training_shield:2,hf_copper_ring:2,hf_iron_chest:3};
 const rows=inventoryRows(state);
 for(const id of ['ore_copper','coal','ore_iron','ingot_copper','upgrade_stone','upgrade_stone_advanced']){
  const entries=rows.filter(x=>x.id===id);
  assert.equal(entries.length,1,'Stackable material split into several slots: '+id);
  assert.equal(entries[0].count,state.items[id]);
 }
 for(const id of ['training_sword','training_shield','hf_copper_ring','hf_iron_chest']){
  const entries=rows.filter(x=>x.id===id);
  assert.equal(entries.length,1,'Identical equipment must appear in one slot: '+id);
  assert.equal(entries[0].count,state.items[id]);
 }
 assert.equal(occupiedInventorySlots(state),rows.length,'Physical slots must equal rendered rows');
});
