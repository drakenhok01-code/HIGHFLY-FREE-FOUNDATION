import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeRpgState,inventoryRows,occupiedInventorySlots,saveRpgState,loadRpgState,ITEM_DEFS} from '../src/highfly/rpg-core.mjs';
import {equipFromBag,unequipToBag} from '../src/highfly/rpg-equipment.mjs';
import {enhancementChoices} from '../src/highfly/rpg-bag-capacity.mjs';
import {enhanceGear} from '../src/highfly/rpg-itemization.mjs';
const by=(rows,id)=>rows.filter(r=>r.id===id);
test('P4.8: 4 identical swords, 3 shields, 2 rings and 5 armors stack into four real bag cells',()=>{
 const state=normalizeRpgState(null);
 Object.assign(state.items,{training_sword:4,training_shield:3,hf_copper_ring:2,hf_iron_chest:5});
 for(const [id,count] of [['training_sword',4],['training_shield',3],['hf_copper_ring',2],['hf_iron_chest',5]])
  state.gearTraits.bag[id]=Array.from({length:count},()=>({id,rarity:'Común',plus:0}));
 const rows=inventoryRows(state);
 for(const [id,count] of [['training_sword',4],['training_shield',3],['hf_copper_ring',2],['hf_iron_chest',5]]){
  assert.equal(by(rows,id).length,1,id);
  assert.equal(by(rows,id)[0].count,count,id);
  assert.equal(by(rows,id)[0].variantIndices.length,count);
 }
 assert.equal(occupiedInventorySlots(state),6,'2 potion stacks + 4 equipment stacks');
});
test('P4.8: same ID and rarity merge across levels, preserving each + after saving',()=>{
 const state=normalizeRpgState(null);
 state.items.training_sword=5;
 state.gearTraits.bag.training_sword=[
  {id:'training_sword',rarity:'Común',plus:0},
  {id:'training_sword',rarity:'Común',plus:0},
  {id:'training_sword',rarity:'Raro',plus:0},
  {id:'training_sword',rarity:'Raro',plus:3},
  {id:'training_sword',rarity:'Mítico',plus:9}
 ];
 const rows=by(inventoryRows(state),'training_sword');
 assert.deepEqual(rows.map(x=>x.count),[2,2,1]);
 assert.deepEqual(enhancementChoices(rows[1].variantIndices,state.gearTraits.bag.training_sword).map(x=>[x.plus,x.count,x.index]),[[0,1,2],[3,1,3]]);
 const store={v:null,setItem(key,v){this.v=v},getItem(){return this.v}};
 saveRpgState(state,store);
 const restored=loadRpgState(store);
 assert.deepEqual(by(inventoryRows(restored),'training_sword').map(x=>x.count),[2,2,1]);
 assert.deepEqual(restored.gearTraits.bag.training_sword.map(x=>x.plus),[0,0,0,3,9]);
});
test('P5.7.4: 11 identical copies form ONE stack and retain their traits',()=>{
 const state=normalizeRpgState(null);state.slots=36;
 state.items.training_shield=10;
 state.gearTraits.bag.training_shield=Array.from({length:10},()=>({id:'training_shield',rarity:'Común',plus:0}));
 const prof={};
 state.equipped.left_hand='training_shield';state.gearTraits.equipped.left_hand={id:'training_shield',rarity:'Común',plus:0};
 assert.equal(unequipToBag(state,'left_hand',prof,ITEM_DEFS).ok,true);
 assert.deepEqual(by(inventoryRows(state),'training_shield').map(x=>x.count),[11]);
 assert.equal(state.gearTraits.bag.training_shield.length,11);
 const occupied=occupiedInventorySlots(state);
 state.items.training_shield+=2;
 state.gearTraits.bag.training_shield.push({id:'training_shield',rarity:'Raro',plus:0},{id:'training_shield',rarity:'Común',plus:1});
 assert.deepEqual(by(inventoryRows(state),'training_shield').map(x=>x.count),[12,1]);
 assert.equal(occupiedInventorySlots(state),occupied+1);
 const store={v:null,setItem(k,v){this.v=v},getItem(){return this.v}};
 saveRpgState(state,store);
 const restored=loadRpgState(store);
 assert.deepEqual(by(inventoryRows(restored),'training_shield').map(x=>x.count),[12,1]);
 assert.equal(equipFromBag(restored,'left_hand','training_shield',11,{},ITEM_DEFS).ok,true);
 assert.equal(restored.gearTraits.equipped.left_hand.rarity,'Raro');
});
test('P4.8: bag labels show xN on identical equipment and preserve per-item trait selection',()=>{
 const ui=fs.readFileSync('src/highfly/premium-rpg.mjs','utf8');
 assert.match(ui,/count>1\?'<b>x'/);
 assert.match(ui,/variantIndices\.includes\(selectedIndex\)/);
 const art=fs.readFileSync('scripts/highfly-p47b-approved-icons.py','utf8');
 assert.match(art,/painting=image\.resize\(\(216,216\)/);
 assert.match(art,/Image\.composite\(interior,approved,mask\)/);
 assert.match(art,/rounded_rectangle\(\(36,36,220,220\)/);
});

test('P574: saves retain more than 72 copies in a single identical stack',()=>{const state=normalizeRpgState({items:{training_shield:100},slots:36});assert.equal(state.items.training_shield,100);assert.equal(state.gearTraits.bag.training_shield.length,100);assert.equal(by(inventoryRows(state),'training_shield')[0].count,100)});

test('P574 R2: +0, +1, +3 common group; equip a specific +3 copy; upgrading stays in the group',()=>{const b=normalizeRpgState({items:{training_shield:4,upgrade_stone:10},gearTraits:{bag:{training_shield:[{rarity:'Común',plus:0},{rarity:'Común',plus:1},{rarity:'Común',plus:3},{rarity:'Raro',plus:0}]}}});const rows=by(inventoryRows(b),'training_shield');assert.deepEqual(rows.map(r=>r.count),[3,1]);assert.deepEqual(enhancementChoices(rows[0].variantIndices,b.gearTraits.bag.training_shield).map(x=>x.plus),[0,1,3]);assert.equal(enhanceGear(b,{place:'bag',id:'training_shield',index:0},'upgrade').ok,true);assert.deepEqual(by(inventoryRows(b),'training_shield').map(r=>r.count),[3,1]);assert.equal(equipFromBag(b,'left_hand','training_shield',2,{},ITEM_DEFS).ok,true);assert.equal(b.gearTraits.equipped.left_hand.plus,3);assert.deepEqual(by(inventoryRows(b),'training_shield').map(r=>r.count),[2,1]);assert.equal(unequipToBag(b,'left_hand',{},ITEM_DEFS).ok,true);assert.deepEqual(by(inventoryRows(b),'training_shield').map(r=>r.count),[3,1]);});
