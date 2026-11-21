import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnGear,projectedGearStats} from '../src/highfly/p2/catalog-domain.mjs';
import {RARITY_THEMES,SLOT_LABELS,iconView,previewCatalogBag,previewEquipment} from '../src/highfly/p3/rarity-view.mjs';
const J=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const C=J('docs/catalog/p2/MASTER_CATALOG_47.json'),B=J('docs/catalog/p22/P22_VISUAL_BINDINGS_47.json');
const get=id=>C.items.find(x=>x.id===id);
test('P3 maps all SIX official tiers in the original P2 order',()=>{
 assert.deepEqual(Object.keys(RARITY_THEMES),C.rarities);
 assert.deepEqual(Object.values(RARITY_THEMES).map(x=>x.token),['comun','poco-comun','raro','epico','legendario','mitico']);
 assert.equal(new Set(Object.values(RARITY_THEMES).map(x=>x.color)).size,6);
});
test('P3 has 10 authentic equip slots, not a fantasy slot invented for amulet',()=>{
 assert.deepEqual(Object.keys(SLOT_LABELS),C.slotIds);
 assert.equal(get('hf_amulet_basic').equipment.slot,null);
 assert.equal(iconView(get('hf_amulet_basic'),null,B).mayEquip,false);
});
test('P3 can preview same weapon COMUN and MITICO using same image bytes and +0',()=>{
 const sword=get('training_sword');
 const one=spawnGear(sword,{instanceId:'a',ownerId:'player',rarity:'Común'});
 const six=spawnGear(sword,{instanceId:'b',ownerId:'player',rarity:'Mítico'});
 const v1=iconView(sword,one,B),v6=iconView(sword,six,B);
 assert.equal(v1.iconPath,v6.iconPath);assert.notEqual(v1.rarityColor,v6.rarityColor);
 assert.equal(v1.plus,0);assert.equal(v6.plus,0);
 assert.equal(v6.accessibleLabel,'Espada de Aprendiz · Mítico +0');
});
test('P3 preserves a player +N in the visual representation without spawning it',()=>{
 const sword=get('training_sword');
 const born=spawnGear(sword,{instanceId:'c',ownerId:'player',rarity:'Legendario'});
 const upgraded={...born,plus:3};
 const v=iconView(sword,upgraded,B);
 assert.equal(born.plus,0);assert.equal(v.plus,3);assert.equal(v.plusLabel,'+3');
 assert.deepEqual(v.stats,projectedGearStats(sword,upgraded));
});
test('P3 filters all 47 templates and NEVER claims the preview is live loot',()=>{
 assert.equal(previewCatalogBag(C,B).length,47);
 assert.equal(previewCatalogBag(C,B,{kind:'armor'}).length,6);
 assert.equal(previewCatalogBag(C,B,{kind:'material'}).length,25);
 assert.equal(previewCatalogBag(C,B,{rarity:'Épico'}).filter(x=>x.plus===0).length,20);
 assert.ok(previewCatalogBag(C,B).every(x=>x.virtualTemplatePreview===false || x.plus===null));
});
test('P3 fixed consumables/materials never roll a demo rarity',()=>{
 const hp=iconView(get('hp_potion'),null,B),wood=iconView(get('wood'),null,B);
 assert.equal(hp.rarity,'Poco común');assert.equal(wood.rarity,'Común');
 assert.equal(hp.plus,null);assert.equal(wood.plus,null);
});
test('P3 image paths remain exactly P2.2 including 19 preserved v3.6 bindings',()=>{
 for(const x of C.items){const view=iconView(x,null,B);assert.equal(view.iconPath,B.items.find(y=>y.id===x.id).runtimeIconPath)}
 assert.equal(C.items.filter(x=>x.status==='V36_EXISTING').length,19);
});
test('P3 view forbids invalid rarity, enhancement or swapped instances',()=>{
 const sword=get('training_sword'),s=spawnGear(sword,{instanceId:'x',ownerId:'p'});
 assert.throws(()=>iconView(sword,{...s,plus:10},B));
 assert.throws(()=>iconView(sword,{...s,rarity:'Arcano'},B));
 assert.throws(()=>iconView(sword,{...s,templateId:'wrong'},B));
});
test('P3 equipment projection computes bonuses and keeps armor meshes unchanged',()=>{
 const chest=get('hf_iron_chest'),inst=spawnGear(chest,{instanceId:'z',ownerId:'p'});
 const preview=previewEquipment([{slot:'chest',template:chest,instance:inst}],C.slotIds);
 assert.equal(preview.slots.length,10);assert.equal(preview.slots.filter(x=>x.filled).length,1);
 assert.equal(preview.bonuses.defense,10);
 assert.equal(iconView(chest,inst,B).armorMeshChanged,false);
});
test('P3 does not auto-enable UI by editing approved runtime',()=>{
 const css=fs.readFileSync('src/highfly/p3/icon-frame.css','utf8');
 assert.match(css,/filter:none/);assert.match(css,/hf-p3-rarity-mitico/);
 assert.match(css,/prefers-reduced-motion/);
 assert.equal(C.equipmentPolicy.spawnEnhancement,0);
});
