import test from 'node:test';
import assert from 'node:assert/strict';
import {describeSystemIntent} from '../src/highfly/system-dialog.mjs';
import {normalizeRpgState,craftPotion} from '../src/highfly/rpg-core.mjs';
import {unequipToBag,equipFromBag} from '../src/highfly/rpg-equipment.mjs';

test('System prompts are pure and never consume an equipped sword until confirmed',()=>{
 const bag=normalizeRpgState(null),before=JSON.stringify(bag);
 const intent=describeSystemIntent('unequip',{slotId:'right_hand'},bag);
 assert.equal(intent.ok,true);
 assert.match(intent.description,/Espada de Aprendiz/);
 assert.equal(JSON.stringify(bag),before);
 assert.equal(unequipToBag(bag,'right_hand').ok,true);
 assert.equal(bag.items.training_sword,1);
 const choose=describeSystemIntent('equip-choose',{itemId:'training_sword'},bag);
 assert.equal(choose.ok,true);
 assert.deepEqual(choose.slots.map(s=>s.id),['right_hand','left_hand']);
 const x=describeSystemIntent('equip',{itemId:'training_sword',slotId:'right_hand'},bag);
 assert.equal(x.ok,true);
 assert.match(x.description,/Mano derecha/);
 assert.equal(bag.equipped.right_hand,null);
 assert.equal(equipFromBag(bag,'right_hand','training_sword').ok,true);
 assert.equal(bag.items.training_sword,0);
 assert.equal(describeSystemIntent('equip',{itemId:'training_sword',slotId:'right_hand'},bag).ok,false);
});
test('Craft prompt displays exact recipe costs but never changes resources, even when cancelled',()=>{
 const bag=normalizeRpgState(null),profession={inventory:{herb:2,ore:3}};
 const before=JSON.stringify({bag,profession});
 const confirm=describeSystemIntent('craft',{recipeId:'hp_potion'},bag,profession.inventory);
 assert.equal(confirm.ok,true);
 assert.equal(confirm.title,'¿INICIAR FABRICACIÓN?');
 assert.deepEqual(confirm.details.map(x=>[x.label,x.value]),[['Hierbas recolectadas','2 unidades']]);
 assert.equal(JSON.stringify({bag,profession}),before,'A system question is non-mutating');
 // This simulates pressing CANCELAR: no call to craftPotion.
 assert.equal(JSON.stringify({bag,profession}),before);
 const made=craftPotion('hp_potion',profession,bag);
 assert.equal(made.ok,true);
 assert.equal(profession.inventory.herb,0);
 assert.equal(bag.items.hp_potion,3);
 assert.equal(describeSystemIntent('craft',{recipeId:'hp_potion'},bag,profession.inventory).ok,false);
});
test('System rejects unavailable skill, incompatible equipment and missing resource',()=>{
 const bag=normalizeRpgState(null),p={skills:new Set(),refrains:0};
 assert.equal(describeSystemIntent('assign-skill',{slotIndex:3,skillId:'pulse'},bag,{},p).ok,false);
 assert.equal(describeSystemIntent('assign-skill',{slotIndex:3,skillId:'heavy'},bag,{},p).ok,true);
 assert.equal(describeSystemIntent('craft',{recipeId:'training_greatsword'},bag,{}).ok,false);
 assert.equal(describeSystemIntent('equip',{itemId:'training_sword',slotId:'helmet'},bag,{}).ok,false);
 assert.equal(describeSystemIntent('expand',{},bag).ok,false);
 bag.items.bag_upgrade=1;
 assert.equal(describeSystemIntent('expand',{},bag).ok,true);
 assert.equal(bag.items.bag_upgrade,1,'Showing a dialog cannot use the expansion token');
});
