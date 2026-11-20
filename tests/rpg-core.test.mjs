import test from 'node:test';
import assert from 'node:assert/strict';
import {SAVE_KEY,normalizeRpgState,loadRpgState,saveRpgState,inventoryRows,ITEM_DEFS,RECIPES,spendPotion,canCraft,craftPotion,attributeBreakdown,liveSkillRows} from '../src/highfly/rpg-core.mjs';

test('F0.14 potion starting inventory is normalized and persisted, never invents materials',()=>{
 const bag=normalizeRpgState(null);
 assert.deepEqual(bag.items,{hp_potion:2,mp_potion:2});
 const store={v:null,setItem(k,v){assert.equal(k,SAVE_KEY);this.v=v},getItem(k){assert.equal(k,SAVE_KEY);return this.v}};
 assert.equal(saveRpgState(bag,store),true);
 assert.deepEqual(loadRpgState(store),bag);
 assert.deepEqual(inventoryRows(bag,{}).map(x=>[x.id,x.count]).sort(),[['hp_potion',2],['mp_potion',2]]);
 assert.equal(inventoryRows(bag,{ore:3,herb:1})[0].count>=1,true);
 assert.equal(ITEM_DEFS.hp_potion.kind,'Consumibles');
});
test('F0.14 health potion restores actual Unsung Player health and spends exactly one item',()=>{
 const bag=normalizeRpgState(null),player={health:28,healthMax:100,state:'move',_hfMana:12,_hfManaMax:100};
 const a=spendPotion(bag,player,'hp_potion');
 assert.equal(a.ok,true);assert.equal(a.restored,35);assert.equal(player.health,63);assert.equal(bag.items.hp_potion,1);
 player.health=100;
 assert.equal(spendPotion(bag,player,'hp_potion').ok,false,'full HP cannot consume');
 assert.equal(bag.items.hp_potion,1);
 assert.equal(spendPotion(bag,player,'totally-fake-item').ok,false);
 assert.equal(bag.items.hp_potion,1);
});
test('F0.14 mana potion restores actual Highfly mana and never invents mana on full bar',()=>{
 const bag=normalizeRpgState(null),player={health:100,healthMax:100,state:'move',_hfMana:25,_hfManaMax:100};
 assert.equal(spendPotion(bag,player,'mp_potion').ok,true);
 assert.equal(player._hfMana,65);
 assert.equal(bag.items.mp_potion,1);
 player._hfMana=100;
 assert.equal(spendPotion(bag,player,'mp_potion').ok,false);
 assert.equal(bag.items.mp_potion,1);
 player.state='dead';player._hfMana=20;
 assert.equal(spendPotion(bag,player,'mp_potion').ok,false,'a dead actor cannot drink');
});
test('F0.14 crafting is atomic: real profession materials are required and decremented once',()=>{
 const bag=normalizeRpgState(null);
 const professions={inventory:{herb:3,ore:1,wood:4},tools:new Set()};
 assert.equal(canCraft('hp_potion',professions.inventory,bag).ok,true);
 const a=craftPotion('hp_potion',professions,bag);
 assert.equal(a.ok,true);assert.equal(professions.inventory.herb,1);
 assert.equal(bag.items.hp_potion,3);
 const b=craftPotion('mp_potion',professions,bag);
 assert.equal(b.ok,true);
 assert.equal(professions.inventory.herb,0);assert.equal(professions.inventory.ore,0);
 assert.equal(bag.items.mp_potion,3);
 const frozen=JSON.stringify({inventory:professions.inventory,items:bag.items});
 assert.equal(craftPotion('hp_potion',professions,bag).ok,false);
 assert.equal(JSON.stringify({inventory:professions.inventory,items:bag.items}),frozen,'failed craft has zero mutations');
 assert.equal(RECIPES.hp_potion.profession,'Alquimia');
});
test('F0.14 80 percent level + up to 20 percent verified training + independent equipment stats',()=>{
 const novice=attributeBreakdown(1,0,{STR:5});
 assert.equal(novice.levelPoints,0);
 assert.equal(novice.trainingPoints,0);
 assert.equal(novice.rows.find(r=>r.id==='STR').total,15);
 const lvl21=attributeBreakdown(21,100,{STR:11});
 assert.equal(lvl21.levelPoints,80);assert.equal(lvl21.trainingCap,20);
 assert.equal(lvl21.trainingPoints,20);
 assert.equal(lvl21.rows.reduce((a,r)=>a+r.level,0),80);
 assert.equal(lvl21.rows.reduce((a,r)=>a+r.training,0),20);
 assert.equal(lvl21.rows.reduce((a,r)=>a+r.equipment,0),11);
 const noTraining=attributeBreakdown(21,0);
 assert.equal(noTraining.rows.reduce((a,r)=>a+r.training,0),0,'real training not granted automatically');
});
test('F0.14 catalog only exposes native available skills and marks locked skills truthfully',()=>{
 const skills=liveSkillRows({skills:new Set(),refrains:0});
 assert.equal(skills.length,6);
 assert.equal(skills.find(x=>x.id==='pulse').available,false);
 assert.equal(skills.find(x=>x.id==='heal').available,false);
 assert.ok(skills.find(x=>x.id==='attack').available);
});

test('F0.14.2 permanent 36-slot bag, regardless of items equipped or inventory',async()=>{
 const {bagSlots,MAX_BAG_SLOTS}=await import('../src/highfly/rpg-core.mjs');
 assert.equal(MAX_BAG_SLOTS,36);
 assert.equal(bagSlots([]).length,36);
 assert.equal(bagSlots([]).filter(Boolean).length,0);
 const items=inventoryRows(normalizeRpgState(null),{herb:3});
 const slots=bagSlots(items);
 assert.equal(slots.length,36);
 assert.equal(slots.filter(Boolean).length,3);
 assert.equal(slots.filter(x=>x===null).length,33);
});
