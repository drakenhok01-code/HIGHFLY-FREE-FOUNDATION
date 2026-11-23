import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HUNT_ORDER,HUNT_MOBS,HUNT_MISSIONS,xpRequired,createHuntState,gainHuntXp,
  acceptHunt,recordHuntKill,turnInHunt} from '../src/highfly/p49-hunt-data.mjs';
import {ITEM_DEFS} from '../src/highfly/rpg-core.mjs';
const read=file=>fs.readFileSync(file,'utf8');
test('P4.9: exactly three original creatures, habitats, XP and unique loot IDs',()=>{
 assert.deepEqual(HUNT_ORDER,['wolf','boar','crab']);
 assert.equal(new Set(HUNT_ORDER.map(id=>HUNT_MOBS[id].loot)).size,3);
 assert.equal(new Set(HUNT_ORDER.map(id=>HUNT_MOBS[id].kind)).size,3);
 for(const id of HUNT_ORDER){
  const monster=HUNT_MOBS[id],mission=HUNT_MISSIONS[id];
  assert.ok(ITEM_DEFS[monster.loot],id+' physical material must be in Bag');
  assert.ok(mission.count>=3&&mission.count<=4,id);
  assert.ok(monster.xp>0&&mission.bonusXp>0);
  assert.ok(Number.isFinite(monster.anchor.x)&&Number.isFinite(monster.anchor.z));
 }
 assert.match(HUNT_MOBS.crab.zone,/Costa/);
});
test('P4.9: one acceptance, exact kill requirement, one hand-in and one reward',()=>{
 const state=createHuntState(),bag={items:{}};
 for(const id of HUNT_ORDER){
  const m=HUNT_MISSIONS[id];
  assert.equal(recordHuntKill(state,id),false,'No quest kills before NPC acceptance');
  assert.equal(acceptHunt(state,id),true);
  assert.equal(acceptHunt(state,id),false,'No double accept');
  for(let i=1;i<m.count;i++){
    assert.equal(recordHuntKill(state,id),true);
    assert.equal(state.missions[id].status,'active');
  }
  assert.equal(recordHuntKill(state,id),true);
  assert.equal(state.missions[id].status,'ready');
  assert.equal(recordHuntKill(state,id),false,'No kills after complete');
  assert.equal(turnInHunt(state,id,bag).ok,true);
  assert.equal(state.missions[id].status,'done');
  assert.equal(turnInHunt(state,id,bag).ok,false);
 }
 assert.equal(bag.items.hp_potion,2);
 assert.equal(bag.items.mp_potion,1);
});
test('P4.9: XP leveling is deterministic, persistent and separate from equipment',()=>{
 const state=createHuntState();
 assert.equal(xpRequired(1),75);
 assert.equal(gainHuntXp(state,74).levels,0);
 assert.equal(gainHuntXp(state,1).levels,1);
 assert.equal(state.level,2);
 assert.equal(state.xp,0);
 assert.equal(createHuntState(JSON.parse(JSON.stringify(state))).level,2);
 assert.ok(!('equipment' in state),'Loot must not permanently raise STR AGI VIT PER INT');
});
test('P4.9: eight parts of level growth from levels and two from real training remain untouched',()=>{
 const code=read('src/highfly/rpg-core.mjs');
 assert.match(code,/levelPoints=4\*\(lvl-1\)/);
 assert.match(code,/trainingCap=points-levelPoints/);
});
test('P4.9: three real enemies run on native Unsung hit/death, with render only when near',()=>{
 const code=read('src/highfly/p49-hunt-world.mjs'),worldLoot=read('src/highfly/p41-world-loot.mjs');
 for(const id of HUNT_ORDER){
  assert.match(code,new RegExp('KINDS\\.hf_'+id+'='));
  assert.ok(worldLoot.includes("'hf_"+id+"'"),id);
 }
 assert.match(code,/game\.enemies\.spawn\(/);
 assert.match(code,/event\?\.type!=='death'/);
 assert.match(code,/CAP=3, LOAD_RANGE=125, UNLOAD_RANGE=165/);
 assert.match(code,/cloneSkeleton\(/);
 assert.match(code,/hf-kaykit-knight\.glb/);
 assert.match(code,/saveRpgState\(bag\)/);
 assert.match(code,/Math\.abs\(hero\.pos\.y-spot\.npc\.y\)<3/);
});
test('P4.9: public build mounts after original game and approved P4.8.2 before rendering',()=>{
 const build=read('scripts/f0-build.mjs');
 for(const name of ['p49-hunt-data.mjs','p49-hunt-world.mjs','p49-hunts.css'])assert.ok(build.includes("'"+name+"'"));
 assert.ok(build.indexOf('installPremiumRpgUI(game);')<build.indexOf('installP49Hunts(game);'));
 const ui=read('src/highfly/premium-rpg.mjs');
 assert.match(ui,/HUNT_ORDER\.map\(id=>/);
 assert.match(ui,/HIGHFLY · NIVEL/);
 assert.match(ui,/HUNT_MISSIONS\[huntKey\]/);
});
