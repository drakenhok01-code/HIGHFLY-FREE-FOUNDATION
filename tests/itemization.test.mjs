import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRpgState,saveRpgState,loadRpgState,craftPotion,ITEM_DEFS,RECIPES} from '../src/highfly/rpg-core.mjs';
import {equipFromBag,unequipToBag,equipmentBonuses} from '../src/highfly/rpg-equipment.mjs';
import {RARITIES,enhanceGear,gearTraitAt,normalizeGearTraits,enhancedStats} from '../src/highfly/rpg-itemization.mjs';
import {describeSystemIntent} from '../src/highfly/system-dialog.mjs';

test('Six grade labels, nine enhancements and original sprite identity shared across variants',()=>{
 assert.deepEqual(RARITIES,['Común','Poco común','Raro','Épico','Legendario','Mítico']);
 assert.equal(ITEM_DEFS.training_sword.id,'training_sword');
 assert.equal(RECIPES.ingot_iron.ingredients.ore,3);
 assert.equal(RECIPES.ingot_copper.ingredients.ore,2);
 assert.equal(RECIPES.ingot_silver.ingredients.ore,5);
 assert.equal(RECIPES.ingot_gold.ingredients.ore,8);
});
test('Actual copper / iron / silver / gold metallurgy consumes real mined ore',()=>{
 const bag=normalizeRpgState(null),profession={inventory:{ore:18}};
 for(const id of ['ingot_copper','ingot_iron','ingot_silver','ingot_gold']){
  assert.equal(craftPotion(id,profession,bag).ok,true,id);
  assert.equal(bag.items[id],1,id);
 }
 assert.equal(profession.inventory.ore,0);
 assert.equal(craftPotion('ingot_copper',profession,bag).ok,false);
});
test('One equipped sword upgrades +1..+9 only with real stones and persists',()=>{
 const s=normalizeRpgState(null);
 assert.equal(s.gearTraits.equipped.right_hand.plus,0);
 assert.equal(enhanceGear(s,{place:'equipped',id:'right_hand'}).ok,false);
 s.items.upgrade_stone=9; // +0→+6 costs 1+1+1+2+2+2
 s.items.upgrade_stone_advanced=9; // +6→+9 costs 3+3+3
 for(let plus=1;plus<=9;plus++){
  const intent=describeSystemIntent('gear-upgrade',{place:'equipped',id:'right_hand',kind:'upgrade'},s);
  assert.equal(intent.ok,true,plus);
  const r=enhanceGear(s,{place:'equipped',id:'right_hand'});
  assert.equal(r.ok,true);
  assert.equal(r.trait.plus,plus);
 }
 assert.equal(s.items.upgrade_stone,0);
 assert.equal(s.items.upgrade_stone_advanced,0);
 assert.equal(enhanceGear(s,{place:'equipped',id:'right_hand'}).ok,false);
 assert.equal(enhanceGear(s,{place:'equipped',id:'right_hand'},'ascend').ok,false);
 s.items.ascension_core=1;
 assert.equal(describeSystemIntent('gear-upgrade',{place:'equipped',id:'right_hand',kind:'ascend'},s).ok,true);
 const up=enhanceGear(s,{place:'equipped',id:'right_hand'},'ascend');
 assert.equal(up.ok,true);assert.equal(up.trait.rarity,'Poco común');assert.equal(up.trait.plus,0);
 assert.equal(s.items.ascension_core,0);
 const memory={v:null,getItem(){return this.v},setItem(_,v){this.v=v}};
 assert.equal(saveRpgState(s,memory),true);
 const persisted=loadRpgState(memory);
 assert.equal(persisted.gearTraits.equipped.right_hand.rarity,'Poco común');
 assert.equal(persisted.gearTraits.equipped.right_hand.plus,0);
 assert.ok(equipmentBonuses(persisted.equipped,persisted.gearTraits).physicalAttack>4);
});
test('Two copies have their own quality on equip / unequip, without duplicating items',()=>{
 const s=normalizeRpgState(null);
 assert.equal(unequipToBag(s,'right_hand').ok,true);
 s.items.training_sword=2;
 s.gearTraits.bag.training_sword.push({id:'training_sword',rarity:'Mítico',plus:9});
 assert.equal(equipFromBag(s,'right_hand','training_sword',1).ok,true);
 assert.equal(gearTraitAt(s,'equipped','right_hand').rarity,'Mítico');
 assert.equal(s.items.training_sword,1);
 assert.equal(gearTraitAt(s,'bag','training_sword',0).rarity,'Común');
 assert.equal(unequipToBag(s,'right_hand').ok,true);
 assert.equal(s.items.training_sword,2);
 assert.deepEqual(s.gearTraits.bag.training_sword.map(t=>t.rarity).sort(),['Común','Mítico']);
});
test('Crafted gear creates one real independent trait and preserves previous weapon',()=>{
 const s=normalizeRpgState(null);
 const prof={inventory:{ingot:2,wood:1}};
 assert.equal(craftPotion('training_sword',prof,s).ok,true);
 assert.equal(s.items.training_sword,1);
 assert.equal(s.gearTraits.bag.training_sword.length,1);
 assert.equal(s.gearTraits.equipped.right_hand.id,'training_sword');
 assert.equal(equipFromBag(s,'right_hand','training_sword').ok,true);
 assert.equal(s.gearTraits.bag.training_sword.length,1);
 assert.equal(s.items.training_sword,1);
});
