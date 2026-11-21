import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeRpgState,inventoryRows,ITEM_DEFS,ownedMaterialCount} from '../src/highfly/rpg-core.mjs';
const source=name=>fs.readFileSync(name,'utf8');
test('P4.3 original painted item artwork supersedes flat P4.2 SVG',()=>{
 const ui=source('src/highfly/premium-rpg.mjs');
 const manifest=source('src/highfly/premium-assets.mjs');
 assert.doesNotMatch(ui,/p42ItemArt\(/);
 assert.ok(manifest.includes("assetUrl('rarity/'+rel+'__'+"),'P4.3 rarity images must be resolved through generated WebP paths');
 assert.match(manifest,/data-hf-frame-art/);
 for(const id of ['hp_potion','mp_potion','upgrade_stone','ascension_core'])
  assert.match(manifest,new RegExp('item_'+id+'|'+id+':'));
});
test('P4.3 frames are inside real 256px icons and six rarity grade names are canonical',()=>{
 const script=source('scripts/highfly-p43-premium-art.py');
 for(const key of ['comun','poco-comun','raro','epico','legendario','mitico'])assert.match(script,new RegExp(key));
 assert.match(script,/256,256/);
 assert.match(script,/approved painterly/);
 const css=source('src/highfly/premium-p43.css');
 assert.match(css,/::before,|::after/);
 assert.match(css,/padding:0!important/);
 assert.match(css,/object-position:center center/);
});
test('P4.3 portrait rotates through real pointer drag, no left/right arrows',()=>{
 const ui=source('src/highfly/premium-rpg.mjs');
 assert.doesNotMatch(ui,/button\('↶'/);
 assert.doesNotMatch(ui,/button\('↷'/);
 assert.match(ui,/pointerdown/);
 assert.match(ui,/pointermove/);
 assert.match(ui,/setPointerCapture/);
 assert.match(ui,/refreshPortrait\(\)/);
});
test('P4.3 1600px source logo replaces pixelated 160px AVIF at startup',()=>{
 const css=source('src/highfly/phoenix-native-boot.css');
 assert.match(css,/highfly\/premium\/logo_highfly\.svg/);
 assert.doesNotMatch(css,/highfly-official\.avif/);
 assert.match(source('assets/highfly/premium/logo_highfly.svg'),/width="1600"/);
});
test('P4.3 unused legacy generic ingots migrate to typed iron without losing qty',()=>{
 const state=normalizeRpgState({items:{hp_potion:2,mp_potion:2,ingot:7,ingot_iron:3}});
 assert.equal(state.items.ingot,undefined);
 assert.equal(state.items.ingot_iron,10);
 const rows=inventoryRows(state,{ingot:4});
 assert.equal(rows.filter(x=>x.id==='ingot').length,0);
 assert.equal(rows.find(x=>x.id==='ingot_iron').count,14);
 assert.equal(ownedMaterialCount('ingot_iron',{ingot:4},state),14);
});
