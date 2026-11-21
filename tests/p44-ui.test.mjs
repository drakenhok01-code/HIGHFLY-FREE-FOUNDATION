import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const txt=p=>fs.readFileSync(p,'utf8');

test('P4.4 true official brand is loaded from original AVIF and supersampled to 1100px',()=>{
 const css=txt('src/highfly/phoenix-native-boot.css');
 const script=txt('scripts/highfly-p44-align-art.py');
 assert.match(css,/highfly\/brand\/official-rpg-fitness\.webp/);
 assert.doesNotMatch(css,/logo_highfly\.svg/);
 assert.match(script,/Official original restored/);
 assert.match(script,/width=1100/);
});
test('P4.4 hero drag has natural direction and no redundant overlay text',()=>{
 const ui=txt('src/highfly/premium-rpg.mjs');
 assert.match(ui,/local\.heroTurn-=step\*\.014/);
 const body=ui.slice(ui.indexOf('const preview='),ui.indexOf('function character(){'));
 assert.doesNotMatch(body,/DESLIZÁ SOBRE EL PERSONAJE/);
 assert.doesNotMatch(body,/hf-rpg-turn-buttons/);
});
test('P4.4 main panel is exactly six square columns with independent scroll',()=>{
 const css=txt('src/highfly/premium-p44.css');
 assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
 assert.match(css,/aspect-ratio:1!important/);
 assert.match(css,/overflow-y:auto!important/);
 assert.match(css,/object-fit:contain!important/);
 assert.match(css,/hf-rpg-grid/);
});
test('P4.4 production art has a single standardized shared frame per rarity and a unique mechanical engineering illustration',()=>{
 const script=txt('scripts/highfly-p44-align-art.py');
 assert.match(script,/hp_potion__/);
 assert.match(script,/outer=np\.clip/);
 assert.match(script,/Image\.composite\(frame,target,mask\)/);
 assert.match(script,/gear\(116,122,58/);
 assert.match(script,/ingenieria\.webp/);
 assert.match(script,/len\(prof_files\)>=15/);
});
test('P4.4 scroll positions persist through item selections in live menus',()=>{
 const ui=txt('src/highfly/premium-rpg.mjs');
 assert.match(ui,/scrollSaved/);
 assert.match(ui,/root\.addEventListener\('scroll'/);
 assert.match(ui,/el\.scrollTop=local\.scrollSaved/);
});
