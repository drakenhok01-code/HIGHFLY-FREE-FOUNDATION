import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRpgState,loadRpgState,saveRpgState,assignSkillSlot,clearSkillSlot} from '../src/highfly/rpg-core.mjs';
import {EQUIP_SLOTS,equippedMode,equipmentBonuses,unequipToBag,equipFromBag} from '../src/highfly/rpg-equipment.mjs';

test('F0.14.6 starts with the real KayKit starter sword in the right hand only',()=>{
 const s=normalizeRpgState(null);
 assert.equal(EQUIP_SLOTS.length,10);
 assert.equal(s.equipped.right_hand,'training_sword');
 assert.equal(s.equipped.left_hand,null);
 assert.equal(s.items.training_sword??0,0,'no duplicate phantom sword in bag');
 assert.equal(equippedMode(s.equipped),0);
 assert.equal(equipmentBonuses(s.equipped).physicalAttack,4);
});
test('F0.14.6 unequipping changes to actual KayKit unarmed mode and moves sword to bag',()=>{
 const s=normalizeRpgState(null);
 const r=unequipToBag(s,'right_hand');
 assert.equal(r.ok,true);
 assert.equal(r.mode,4);
 assert.equal(s.equipped.right_hand,null);
 assert.equal(s.items.training_sword,1);
 assert.equal(unequipToBag(s,'right_hand').ok,false);
 const x=equipFromBag(s,'right_hand','training_sword');
 assert.equal(x.ok,true);
 assert.equal(x.mode,0);
 assert.equal(s.items.training_sword,0);
 assert.equal(s.equipped.right_hand,'training_sword');
});
test('F0.14.6 offhand shield requires a real sword, and transforms player into shield animation profile',()=>{
 const s=normalizeRpgState(null);
 s.items.training_shield=1;
 assert.equal(equipFromBag(s,'left_hand','training_shield').ok,true);
 assert.equal(equippedMode(s.equipped),3);
 assert.equal(equipmentBonuses(s.equipped).defense,3);
 const removed=unequipToBag(s,'right_hand');
 assert.equal(removed.ok,true);
 assert.equal(s.equipped.left_hand,null);
 assert.equal(s.items.training_sword,1);
 assert.equal(s.items.training_shield,1);
});
test('F0.14.6 invalid equipment transactions do not mutate bag or equipment',()=>{
 const s=normalizeRpgState(null);
 s.items.training_shield=1;
 const before=JSON.stringify(s);
 assert.equal(equipFromBag(s,'helmet','training_shield').ok,false);
 assert.equal(equipFromBag(s,'left_hand','training_greatsword').ok,false);
 assert.equal(equipFromBag(s,'right_hand','training_greatsword').ok,false);
 assert.equal(JSON.stringify(s),before);
});
test('F0.14.6 equipment and six skill slots persist in the existing save key',()=>{
 const store=new Map();
 const mock={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 const s=normalizeRpgState(null);
 assert.equal(unequipToBag(s,'right_hand').ok,true);
 assert.equal(saveRpgState(s,mock),true);
 const reload=loadRpgState(mock);
 assert.equal(reload.equipped.right_hand,null);
 assert.equal(reload.items.training_sword,1);
 assert.deepEqual(reload.skillSlots,['pulse','heavy','heal',null,null,null]);
});
test('F0.14.6 skills assign, move without duplication, clear, and reject locked abilities',()=>{
 const s=normalizeRpgState(null);
 const p={skills:new Set(['pulse']),refrains:2};
 assert.equal(assignSkillSlot(s,4,'heavy',p).ok,true);
 assert.equal(s.skillSlots.filter(x=>x==='heavy').length,1);
 assert.equal(s.skillSlots[1],null);
 assert.equal(s.skillSlots[4],'heavy');
 assert.equal(assignSkillSlot(s,5,'nonsense',p).ok,false);
 assert.equal(clearSkillSlot(s,4).ok,true);
 assert.equal(s.skillSlots[4],null);
 assert.equal(assignSkillSlot(s,0,'pulse',{skills:new Set(),refrains:0}).ok,false);
 assert.equal(s.skillSlots[0],'pulse','failed locked operation does not remove old binding');
});
