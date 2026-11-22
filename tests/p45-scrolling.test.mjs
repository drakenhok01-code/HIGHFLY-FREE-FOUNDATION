import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=p=>fs.readFileSync(p,'utf8');
test('P4.5: one scroll surface for 15 professions',()=>{
 const css=s('src/highfly/premium-p45.css');
 assert.match(css,/\.hf-rpg-prof-grid\{/);
 assert.match(css,/\.hf-p42-professions>\.hf-rpg-panel:first-child\{/);
 assert.match(css,/overflow-y:auto!important/);
 assert.match(css,/grid-auto-rows:max-content/);
});
test('P4.5: Forge recipes scroll internally, no competing panel scroll',()=>{
 const css=s('src/highfly/premium-p45.css');
 assert.match(css,/\.hf-rpg-forge-layout>\.hf-rpg-forge-list/);
 assert.match(css,/\.hf-rpg-forge-list>\.hf-rpg-forge-recipes/);
 assert.match(css,/overscroll-behavior:contain/);
});
test('P4.5: all six right-hand skill assignments fit without scrolling',()=>{
 const css=s('src/highfly/premium-p45.css');
 const ui=s('src/highfly/premium-rpg.mjs');
 assert.match(ui,/hf-p45-skill-detail/);
 assert.match(ui,/hf-p45-skill-guide/);
 assert.match(css,/\.hf-rpg-two>\.hf-p45-skill-detail\{/);
 assert.match(css,/overflow:hidden!important;scrollbar-width:none/);
 assert.match(css,/grid-template-rows:repeat\(2,36px\)/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
test('P4.5: rarity frame is inside the WebP, selected slot has no second outline',()=>{
 const css=s('src/highfly/premium-p45.css');
 assert.match(css,/\.is-selected\{[\s\S]*?border:0!important;outline:0!important/);
 assert.match(css,/box-shadow:none!important/);
});
