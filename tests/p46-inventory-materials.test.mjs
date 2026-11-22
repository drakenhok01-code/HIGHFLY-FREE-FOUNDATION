import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeRpgState,inventoryRows,occupiedInventorySlots,distinctInventoryItems,inventoryCapacity,
 ITEM_DEFS,RECIPES,canCraft,craftPotion,loadRpgState,saveRpgState} from '../src/highfly/rpg-core.mjs';
import {unequipToBag,equipFromBag} from '../src/highfly/rpg-equipment.mjs';
import {enhanceGear,gearTraitAt} from '../src/highfly/rpg-itemization.mjs';
import {grantP41TestLoot} from '../src/highfly/p41-loot.mjs';

const fixture=()=>({bag:normalizeRpgState(null),prof:{inventory:{},tools:new Set(),completed:0}});
test('P4.6 regression: 14 distinct types with 48 physical slots never falsely indicate full',()=>{
 const {bag,prof}=fixture();bag.slots=48;
 const materials=['ore','ore_copper','ore_iron','ore_silver','ore_gold','raw_diamond',
  'raw_obsidian','ore_mithril','coal','herb','wood','leather'];
 for(const id of materials)prof.inventory[id]=12;
 bag.items.training_sword=10;
 bag.gearTraits.bag.training_sword=Array.from({length:10},()=>({id:'training_sword',rarity:'Común',plus:0}));
 assert.equal(distinctInventoryItems(bag,prof.inventory),15);
 assert.ok(occupiedInventorySlots(bag,prof.inventory)<48);
 const before=occupiedInventorySlots(bag,prof.inventory);
 const result=unequipToBag(bag,'right_hand',prof.inventory,ITEM_DEFS);
 assert.equal(result.ok,true,'Equipped original sword must fit in a new physical cell');
 assert.equal(bag.items.training_sword,11,'Gear must not cap at ten globally');
 assert.equal(occupiedInventorySlots(bag,prof.inventory),before+1);
 assert.equal(bag.equipped.right_hand,null);
 assert.equal(bag.gearTraits.bag.training_sword.length,11);
 const store={v:'',getItem(){return this.v},setItem(k,v){this.v=v}};
 assert.equal(saveRpgState(bag,store),true);
 const restored=loadRpgState(store);
 assert.equal(restored.items.training_sword,11);
 assert.equal(restored.gearTraits.bag.training_sword.length,11);
 assert.equal(inventoryRows(restored,prof.inventory).filter(x=>x.id==='training_sword').length,11);
});
test('P4.6: equipment swaps are atomic and preserve traits when several copies exist',()=>{
 const {bag,prof}=fixture();bag.slots=48;
 bag.items.training_sword=10;
 bag.gearTraits.bag.training_sword=Array.from({length:10},(_,i)=>({id:'training_sword',rarity:i===9?'Mítico':'Común',plus:i===9?6:0}));
 const old={...bag.gearTraits.equipped.right_hand};
 const result=equipFromBag(bag,'right_hand','training_sword',9,prof.inventory,ITEM_DEFS);
 assert.equal(result.ok,true);
 assert.equal(bag.gearTraits.equipped.right_hand.rarity,'Mítico');
 assert.equal(bag.gearTraits.equipped.right_hand.plus,6);
 assert.ok(bag.gearTraits.bag.training_sword.some(x=>x.plus===old.plus&&x.rarity===old.rarity));
 assert.equal(bag.items.training_sword,10);
});
test('P4.6: two-handed/companion unequip fails without losing either item if bag full',()=>{
 const {bag,prof}=fixture();bag.slots=36;
 bag.equipped.right_hand='training_sword';
 bag.equipped.left_hand='training_shield';
 bag.gearTraits.equipped.left_hand={id:'training_shield',rarity:'Raro',plus:3};
 bag.items.hf_iron_chest=34; // 34 gear cells + HP + MP = 36 occupied
 bag.gearTraits.bag.hf_iron_chest=Array.from({length:34},()=>({id:'hf_iron_chest',rarity:'Común',plus:0}));
 const before=JSON.stringify(bag);
 const fail=unequipToBag(bag,'right_hand',prof.inventory,ITEM_DEFS);
 assert.equal(fail.ok,false);
 assert.match(fail.reason,/Bolsa llena/);
 assert.equal(JSON.stringify(bag),before,'Failed operation must never duplicate or remove gear');
});
test('P4.6: physical stacks use real max-per-stack and split quantities',()=>{
 const {bag,prof}=fixture();
 bag.items.hp_potion=105;
 bag.items.training_shield=3;
 const rows=inventoryRows(bag,prof.inventory);
 assert.deepEqual(rows.filter(r=>r.id==='hp_potion').map(r=>r.count),[99,6]);
 assert.deepEqual(rows.filter(r=>r.id==='training_shield').map(r=>r.count),[1,1,1]);
 assert.equal(occupiedInventorySlots(bag,prof.inventory),2+1+3);
});
test('P4.6: refining a material in full bag can free a slot before adding result',()=>{
 const {bag,prof}=fixture();
 bag.items.hf_iron_chest=33; // 33 + 2 starting potions + ore_copper = 36
 prof.inventory.ore_copper=2;
 const v=canCraft('refine_copper',prof.inventory,bag);
 assert.equal(v.ok,true,JSON.stringify(v));
 const built=craftPotion('refine_copper',prof,bag);
 assert.equal(built.ok,true);
 assert.equal(prof.inventory.ore_copper,0);
 assert.equal(bag.items.ingot_copper,1);
 assert.equal(occupiedInventorySlots(bag,prof.inventory),36);
});
test('P4.6: eight unique mineral IDs and two enhancement tiers are registered',()=>{
 const ids=['coal','ore_copper','ore_iron','ore_silver','ore_gold','raw_diamond','raw_obsidian','ore_mithril'];
 assert.equal(new Set(ids.map(id=>ITEM_DEFS[id].name)).size,8);
 assert.equal(ITEM_DEFS.upgrade_stone.name,'Piedra de mejora menor');
 assert.equal(ITEM_DEFS.upgrade_stone_advanced.name,'Piedra de mejora superior');
 assert.equal(RECIPES.upgrade_stone_advanced.item,'upgrade_stone_advanced');
 const source=fs.readFileSync('scripts/highfly-p46-material-art.py','utf8');
 for(const id of [...ids,'upgrade_stone','upgrade_stone_advanced'])assert.ok(source.includes("'"+id+"'"));
});
test('P4.6: minor crystal upgrades to +6, superior +6 to +9 without inventing rates',()=>{
 const {bag}=fixture();
 bag.items.training_shield=1;bag.gearTraits.bag.training_shield=[{id:'training_shield',rarity:'Común',plus:5}];
 bag.items.upgrade_stone=4;bag.items.upgrade_stone_advanced=10;
 const first=enhanceGear(bag,{place:'bag',id:'training_shield'},'upgrade');
 assert.equal(first.ok,true);assert.equal(first.trait.plus,6);assert.equal(first.materialId,'upgrade_stone');
 const second=enhanceGear(bag,{place:'bag',id:'training_shield'},'upgrade');
 assert.equal(second.ok,true);assert.equal(second.trait.plus,7);assert.equal(second.materialId,'upgrade_stone_advanced');
 assert.equal(enhanceGear(bag,{place:'bag',id:'training_shield'},'upgrade').trait.plus,8);
 assert.equal(enhanceGear(bag,{place:'bag',id:'training_shield'},'upgrade').trait.plus,9);
 assert.equal(enhanceGear(bag,{place:'bag',id:'training_shield'},'upgrade').ok,false);
});
test('P4.6: quest clicking updates the detail only and does not recreate scrolled list',()=>{
 const source=fs.readFileSync('src/highfly/premium-rpg.mjs','utf8');
 assert.match(source,/if\(b\.dataset\.hfQuest\)[\s\S]*?detail\.innerHTML=questDetails\(\)/);
 assert.doesNotMatch(source,/if\(b\.dataset\.hfQuest\)\{local\.selectedQuest=b\.dataset\.hfQuest;render\(\)/);
});
