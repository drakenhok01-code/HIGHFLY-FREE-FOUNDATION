import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ITEM_DEFS} from '../src/highfly/rpg-core.mjs';
const source=path=>fs.readFileSync(path,'utf8');
const metals=['copper','iron','steel','silver','gold','diamond','obsidian','mithril'];

test('P4.8.2: every active HIGHFLY ingot uses a single 3-bar painted source',()=>{
  const generator=source('scripts/highfly-p482-three-ingots.py');
  const approved=source('scripts/highfly-p481-copper-ingot.py');
  const build=source('scripts/f0-build.mjs');
  assert.match(approved,/copper-triple|three-copper-ingot|three aligned bars/i);
  assert.match(generator,/copper-triple|three-bar|THREE-bar/i);
  for(const metal of metals){
    assert.ok(ITEM_DEFS['ingot_'+metal],metal);
    assert.match(generator, new RegExp("'"+metal+"'|ingot_"+metal));
  }
  const seq=[
    "scripts/highfly-metal-variants.py",
    "scripts/highfly-p47b-approved-icons.py",
    "scripts/highfly-p481-copper-ingot.py",
    "scripts/highfly-p482-three-ingots.py",
    "scripts/highfly-p43-premium-art.py",
    "scripts/highfly-p44-align-art.py"
  ].map(x=>build.indexOf(x));
  assert.ok(seq.every(x=>x>0)&&seq.every((x,i)=>i===0||x>seq[i-1]),seq);
});

test('P4.8.2: keep rarity frames, 256px resolution and original asset registry',()=>{
 const generator=source('scripts/highfly-p482-three-ingots.py');
 const qa=source('scripts/qa-p482-three-ingots.py');
 const registry=source('src/highfly/premium-assets.mjs');
 assert.match(generator,/approved\.getpixel\(xy\)/);
 assert.match(generator,/Image\.composite\(vignette, approved, inside\)/);
 assert.match(generator,/resize\(\(174,135\)/);
 assert.match(qa,/GRADES=\['comun','poco-comun','raro','epico','legendario','mitico'\]/);
 assert.match(qa,/\.size==\(256,256\)/);
 for(const metal of metals)assert.ok(registry.includes('ingot_'+metal),metal);
 assert.doesNotMatch(generator,/ITEM_DEFS|RECIPES|GEAR_IDS|inventoryRows/);
});
