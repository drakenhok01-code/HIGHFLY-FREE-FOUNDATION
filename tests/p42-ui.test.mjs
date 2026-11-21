import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ITEM_DEFS,RECIPES} from '../src/highfly/rpg-core.mjs';
import {p42ItemArt} from '../src/highfly/p42-item-art.mjs';
import {MATERIAL_ORDER} from '../src/highfly/p41-loot.mjs';
const read=p=>fs.readFileSync(p,'utf8');
test('P4.2: every potion and improvement crystal has a new original vector with 256px square reference',()=>{
 for(const name of ['hp_potion','mp_potion','upgrade_stone']){
  const svg=p42ItemArt(name,true);
  assert.match(svg,/viewBox="0 0 256 256"/);
  assert.match(svg,/class="hf-rpg-art hf-premium-icon hf-p42-icon is-large"/);
  assert.doesNotMatch(svg,/data-hf-rarity=/);
 }
 assert.equal(p42ItemArt('training_sword'),null);
});
test('P4.2: eight metals have exact human-readable ingot names, without unclassified material',()=>{
 assert.deepEqual(MATERIAL_ORDER,['cobre','hierro','acero','plata','oro','diamante','obsidiana','mitrilo']);
 for(const [id,name] of Object.entries({
  ingot_copper:'Lingote de cobre',ingot_iron:'Lingote de hierro',ingot_steel:'Lingote de acero',
  ingot_silver:'Lingote de plata',ingot_gold:'Lingote de oro',ingot_diamond:'Lingote de diamante',
  ingot_obsidian:'Lingote de obsidiana',ingot_mithril:'Lingote de mitrilo'})){
  assert.equal(ITEM_DEFS[id].name,name);
 }
 assert.equal(ITEM_DEFS.ingot.name,'Lingote de hierro'); // P4.3 saved generic stock is now displayed as a typed metal
 assert.ok(RECIPES.refine_copper&&RECIPES.ingot_copper,'Original crafting compatibility preserved');
});
test('P4.2: six-slot wide inventory with ornate *colored* metal frames instead of aura',()=>{
 const css=read('src/highfly/premium-p42.css');
 assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
 for(const x of ['Común','Poco común','Raro','Épico','Legendario','Mítico'])assert.ok(css.includes('data-hf-rarity="'+x+'"'));
 assert.match(css,/linear-gradient\(142deg/);
 assert.match(css,/hf-rpg-item\[data-hf-rarity\]::before/);
});
test('P4.2: 15 professions listed; unknown icon art not misrepresented as Recolección',()=>{
 const src=read('src/highfly/premium-rpg.mjs');
 const job=src.slice(src.indexOf(' function professions(){'),src.indexOf(' function forge(){'));
 assert.equal((job.match(/\{id:'/g)||[]).length,15);
 assert.match(job,/PRÓXIMAMENTE/);
 assert.match(job,/hf-p42-prof-frame/);
 assert.match(job,/art\(professionIcon\(job\.id\),large\)/); // P4.3 real profession paintings
});
test('P4.2: character actions only through System, no duplicate lower toolbar',()=>{
 const src=read('src/highfly/premium-rpg.mjs');
 const character=src.slice(src.indexOf(' function character(){'),src.indexOf(' function refreshPortrait(){'));
 assert.doesNotMatch(character,/hf-rpg-equip-footer|MEJORAR \+1|ABRIR BOLSA|ATRIBUTOS →/);
 assert.match(src,/data-hf-system-gear="upgrade"/);
 assert.match(src,/data-hf-system-gear="unequip"/);
});
test('P4.2: skills HUD are circular and original loading is dark with large logo',()=>{
 const touch=read('src/highfly/mobile-touch.mjs');
 const boot=read('src/highfly/phoenix-native-boot.css');
 assert.match(touch,/clip-path:circle\(45%/);
 assert.match(touch,/border-radius:50%!important/);
 assert.match(boot,/background:radial-gradient\(ellipse at 50% 48%,#210e2f 0%,#08060d 45%,#010104 86%,#000 100%\)/);
 assert.match(boot,/width:min\(760px,90vw\)/); // P4.3 sharp 1600px SVG
});
