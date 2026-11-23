import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CORPSE_TIMEOUT,corpseLootFor,closestLootableCorpse,SPECIES_LOOT} from '../src/highfly/p494-creature-loot.mjs';
import {blocksNaturalCliff} from '../src/highfly/p494-stair-guard.mjs';
import {activeQuestSummary} from '../src/highfly/mobile-touch.mjs';
const read=x=>fs.readFileSync(x,'utf8');
test('P494: real 3D animal bodies are loot containers: no floating 8 items',()=>{
 assert.equal(CORPSE_TIMEOUT,52);
 assert.equal(Object.keys(SPECIES_LOOT).length,3);
 assert.equal(corpseLootFor({kind:'hf_wolf'}).item,'wolf_pelt');
 assert.equal(corpseLootFor({kind:'hf_boar'}).item,'boar_tusk');
 assert.equal(corpseLootFor({kind:'hf_crab'}).item,'crab_shell');
 assert.equal(corpseLootFor({kind:'lancer'}),null);
 const corpse={enemy:{pos:{x:1,y:0,z:1}},avatar:{root:{visible:true}},expiresAt:80,now:10,collected:false};
 assert.equal(closestLootableCorpse([corpse],{x:2,y:0,z:1}),corpse);
 corpse.collected=true;assert.equal(closestLootableCorpse([corpse],{x:2,y:0,z:1}),null);
 corpse.collected=false;corpse.now=85;assert.equal(closestLootableCorpse([corpse],{x:2,y:0,z:1}),null);
});
test('P494: actual constructed stair floor cancels false positive terrain cliff',()=>{
 const base={wasGrounded:true,run:.3,g0:10,g1:12,y:10.1,floorHere:10,floorNext:12};
 assert.equal(blocksNaturalCliff(base),true,'genuine 2m abrupt natural step still blocks');
 assert.equal(blocksNaturalCliff({...base,floorHere:11.2,floorNext:11.1}),false,'built stair BVH overrides coarse terrain');
 assert.equal(blocksNaturalCliff({...base,g1:10.2}),false,'gentle slope still walkable');
 assert.equal(blocksNaturalCliff({...base,wasGrounded:false}),false,'airborne unaffected');
});
test('P494: ACCEPTED Sera hunt appears in the mobile quick quest tracker',()=>{
 const g={objective:'Explorá el Valle',quests:{active:[]},
  __highflyHunts:{state:{missions:{
    wolf:{status:'active',count:2},boar:{status:'available',count:0},crab:{status:'done',count:3}
   }},missions:{wolf:{npc:'Sera',title:'Aullidos en el bosque',count:3},
     boar:{npc:'Brann',title:'Campos amenazados',count:4},
     crab:{npc:'Mira',title:'Pinzas',count:3}}}};
 const s=activeQuestSummary(g);
 assert.equal(s.total,1);
 assert.equal(s.side[0].title,'✦ Aullidos en el bosque');
 assert.equal(s.side[0].count,'2 / 3');
 g.__highflyHunts.state.missions.wolf.status='ready';
 assert.equal(activeQuestSummary(g).side[0].text,'Entregá la misión a Sera');
});
test('P494: authentic 3D GLBs are rendered without Unsung shard overlay',()=>{
 const build=read('scripts/f0-build.mjs'),creatures=read('src/highfly/p491-cc0-creatures.mjs');
 assert.match(build,/String\(e\.kind\)\.startsWith\('hf_'\)/);
 assert.match(build,/blocksNaturalCliff/);
 assert.match(creatures,/THREE\.MeshBasicMaterial/);
 assert.match(creatures,/avatar\.corpseAvailable/);
 const hunts=read('src/highfly/p49-hunt-world.mjs');
 assert.match(hunts,/new THREE\.AnimationMixer\(n\)/);
 assert.match(hunts,/cloneSkeleton\(gltf\.scene\)/);
 assert.match(hunts,/actual 3D|ACTUAL_3D_KAYKIT_/i);
 assert.match(hunts,/claimCorpse\(c\)/);
 const loot=read('src/highfly/p41-world-loot.mjs');
 assert.match(loot,/corpseLootFor\(enemy\)/);
 assert.match(loot,/claimCorpse/);
});
test('P494: wolf pelt, creature leather, boar tusk and crab shell use unique assets',()=>{
 const assets=read('src/highfly/premium-assets.mjs');
 assert.match(assets,/item_leather:'items\/leather'/);
 assert.match(assets,/item_wolf_pelt:'p494\/wolf_pelt'/);
 assert.match(assets,/item_boar_tusk:'p494\/boar_tusk'/);
 assert.match(assets,/item_crab_shell:'p494\/crab_shell'/);
 for(const id of ['wolf_pelt','boar_tusk','crab_shell','quest_wolf']){
  const art=read('assets/highfly/p494/'+id+'.svg');
  assert.match(art,/<svg/);assert.ok(art.length>900);
 }
 const ui=read('src/highfly/premium-rpg.mjs');
 assert.match(ui,/questArtUrl\(q\.id,q\.title\)/);
});
