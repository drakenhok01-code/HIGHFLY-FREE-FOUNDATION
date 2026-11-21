import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRpgState,inventoryRows,ITEM_DEFS,RECIPES,ownedMaterialCount,canCraft,craftPotion,spendPotion,saveRpgState,loadRpgState} from '../src/highfly/rpg-core.mjs';
import {grantP41TestLoot,receiveP41WorldPickup,MATERIAL_ORDER} from '../src/highfly/p41-loot.mjs';
import {equipFromBag,unequipToBag,equipmentBonuses,equippedMode} from '../src/highfly/rpg-equipment.mjs';
import {RARITIES} from '../src/highfly/rpg-itemization.mjs';
const fixture=()=>({bag:normalizeRpgState(null),prof:{inventory:{},tools:new Set(),completed:0}});
test('P4.1: original eight-step material order and six allowed rarities',()=>{
 assert.deepEqual(MATERIAL_ORDER,['cobre','hierro','acero','plata','oro','diamante','obsidiana','mitrilo']);
 assert.deepEqual(RARITIES,['Común','Poco común','Raro','Épico','Legendario','Mítico']);
 for(const x of ['ingot_copper','ingot_iron','ingot_steel','ingot_silver','ingot_gold','ingot_diamond','ingot_obsidian','ingot_mithril']) {
  assert.ok(ITEM_DEFS[x],x);assert.ok(RECIPES[x],x);
 }
});
test('P4.1: real item award and +0 gear trait across loot and equip',()=>{
 const {bag,prof}=fixture();
 const before=inventoryRows(bag,prof.inventory);
 const loot=grantP41TestLoot(bag,prof,'cofre');
 assert.equal(loot.ok,true);
 assert.equal(bag.items.training_shield,1);
 assert.equal(bag.gearTraits.bag.training_shield[0].plus,0);
 assert.equal(bag.gearTraits.bag.training_shield[0].rarity,'Común');
 assert.ok(inventoryRows(bag,prof.inventory).length>before.length);
 const equipped=equipFromBag(bag,'left_hand','training_shield');
 assert.equal(equipped.ok,true);
 assert.equal(equippedMode(bag.equipped),3);
 assert.equal(bag.items.training_shield,0);
 assert.equal(equipmentBonuses(bag.equipped,bag.gearTraits).defense,3);
 const undone=unequipToBag(bag,'left_hand');
 assert.equal(undone.ok,true);
 assert.equal(bag.items.training_shield,1);
 assert.equal(bag.gearTraits.bag.training_shield[0].plus,0);
});
test('P4.1: mine -> copper ingot, spending only actual minerals',()=>{
 const {bag,prof}=fixture();
 const loot=grantP41TestLoot(bag,prof,'veta');
 assert.equal(loot.ok,true);
 assert.equal(ownedMaterialCount('ore_copper',prof.inventory,bag),5);
 assert.equal(canCraft('refine_copper',prof.inventory,bag).ok,true);
 const crafted=craftPotion('refine_copper',prof,bag);
 assert.equal(crafted.ok,true);
 assert.equal(bag.items.ingot_copper,1);
 assert.equal(prof.inventory.ore_copper,3);
 assert.equal(inventoryRows(bag,prof.inventory).find(x=>x.id==='ingot_copper').count,1);
});
test('P4.1: mixed-source crafting spends profession stock then bag stock without duplication',()=>{
 const {bag,prof}=fixture();
 prof.inventory.ore_copper=1;bag.items.ore_copper=1;
 assert.equal(ownedMaterialCount('ore_copper',prof.inventory,bag),2);
 const r=craftPotion('refine_copper',prof,bag);
 assert.equal(r.ok,true);
 assert.equal(prof.inventory.ore_copper,0);
 assert.equal(bag.items.ore_copper,0);
 assert.equal(bag.items.ingot_copper,1);
});
test('P4.1: failed crafting and invalid loot never modify state',()=>{
 const {bag,prof}=fixture();
 const frozen=JSON.stringify([bag,prof.inventory]);
 assert.equal(craftPotion('ingot_diamond',prof,bag).ok,false);
 assert.equal(grantP41TestLoot(bag,prof,'no-existe').ok,false);
 assert.equal(JSON.stringify([bag,prof.inventory]),frozen);
});
test('P4.1: potion use mutates real player and persists bag in a mock store',()=>{
 const {bag}=fixture(),player={health:40,healthMax:100,state:'move',_hfMana:30,_hfManaMax:100};
 const used=spendPotion(bag,player,'hp_potion');
 assert.equal(used.ok,true);assert.equal(used.restored,35);assert.equal(bag.items.hp_potion,1);
 const mem=new Map(),storage={setItem:(k,v)=>mem.set(k,v),getItem:k=>mem.get(k)};
 assert.equal(saveRpgState(bag,storage),true);
 assert.equal(loadRpgState(storage).items.hp_potion,1);
});
test('P4.1: repeated chest cannot overflow an equipment stack (atomic rollback)',()=>{
 const {bag,prof}=fixture();bag.items.training_shield=10;
 const snap=JSON.stringify([bag.items,prof.inventory]);
 assert.equal(grantP41TestLoot(bag,prof,'cofre').ok,false);
 assert.equal(JSON.stringify([bag.items,prof.inventory]),snap);
});

test('P4.1: real armor and accessory slots grant persistent defense and attribute points',()=>{
 const {bag,prof}=fixture();
 assert.equal(grantP41TestLoot(bag,prof,'cofre').ok,true);
 assert.equal(bag.items.hf_iron_chest,1);
 assert.equal(bag.items.hf_copper_ring,1);
 assert.equal(bag.gearTraits.bag.hf_iron_chest[0].plus,0);
 assert.equal(bag.gearTraits.bag.hf_copper_ring[0].plus,0);
 assert.equal(equipFromBag(bag,'chest','hf_iron_chest').ok,true);
 assert.equal(equipFromBag(bag,'ring','hf_copper_ring').ok,true);
 assert.equal(bag.items.hf_iron_chest,0);
 assert.equal(bag.items.hf_copper_ring,0);
 const bonus=equipmentBonuses(bag.equipped,bag.gearTraits);
 assert.equal(bonus.defense,5);
 assert.equal(bonus.VIT,2);
 assert.equal(bonus.INT,1);
 const storage={v:null,setItem(_k,v){this.v=v},getItem(){return this.v}};
 assert.equal(saveRpgState(bag,storage),true);
 const restored=loadRpgState(storage);
 assert.equal(restored.equipped.chest,'hf_iron_chest');
 assert.equal(restored.equipped.ring,'hf_copper_ring');
 assert.equal(equipmentBonuses(restored.equipped,restored.gearTraits).defense,5);
 assert.equal(unequipToBag(bag,'chest').ok,true);
 assert.equal(bag.items.hf_iron_chest,1);
 assert.equal(bag.gearTraits.bag.hf_iron_chest[0].plus,0);
});

test('P4.1: real native kill pickup enters bag and stops at capacity',()=>{
 const {bag,prof}=fixture();
 const first=receiveP41WorldPickup(bag,prof,{id:'leather',count:1,rarity:'Común'});
 assert.equal(first.ok,true);
 assert.equal(bag.items.leather,1);
 const rare=receiveP41WorldPickup(bag,prof,{id:'training_shield',count:1,rarity:'Raro'});
 assert.equal(rare.ok,true);
 assert.equal(bag.gearTraits.bag.training_shield[0].rarity,'Raro');
 assert.equal(bag.gearTraits.bag.training_shield[0].plus,0);
 assert.equal(equipFromBag(bag,'left_hand','training_shield').ok,true);
 assert.equal(bag.gearTraits.equipped.left_hand.plus,0);
 const before=JSON.stringify(bag);
 assert.equal(receiveP41WorldPickup(bag,prof,{id:'fake_item',count:1}).ok,false);
 assert.equal(JSON.stringify(bag),before);
});
