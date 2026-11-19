import test from 'node:test';
import assert from 'node:assert/strict';
import {professionState,professionActionFor,findProfessionTarget,
 prepareProfession,commitProfession,advanceCrops} from '../src/highfly/professions.mjs';
const pos={x:0,y:0,z:0},yaw=0;
const world=()=>({highflyInteractables:[
 {id:'tree-a',kind:'tree',x:0,z:1,charges:2},
 {id:'ore-a',kind:'ore',x:0,z:1.4,charges:2},
 {id:'spot-a',kind:'fishSpot',x:0,z:1.5,charges:1},
 {id:'plot-a',kind:'soil',x:0,z:1.6,phase:'empty',growSeconds:2},
 {id:'furnace-a',kind:'furnace',x:0,z:1.1},
 {id:'forge-a',kind:'forge',x:0,z:1.2}
]});
const tools=['axe','pickaxe','rod','hoe','watering_can','hammer'];
function run(w,s,action){
 const prep=prepareProfession(s,w,action,pos,yaw);
 assert.equal(prep.ok,true,action+': '+prep.reason);
 return commitProfession(s,w,prep.job);
}
test('TALAR: resource tag, real tool, finite wood charges and no duplicate award',()=>{
 const w=world(),s=professionState({},tools);
 const prep=prepareProfession(s,w,'chop',pos,yaw);
 assert.equal(prep.ok,true);assert.equal(s.inventory.wood??0,0,'start animation gives no loot');
 const first=commitProfession(s,w,prep.job);
 assert.equal(first.ok,true);assert.equal(s.inventory.wood,2);
 assert.equal(commitProfession(s,w,prep.job).ok,false,'double-finish cannot duplicate rewards');
 run(w,s,'chop');assert.equal(s.inventory.wood,4);
 assert.equal(w.highflyInteractables[0].available,false,'depleted trees are unusable');
 assert.equal(prepareProfession(s,w,'chop',pos,yaw).reason,'no-real-target');
});
test('MINAR: rock collisions alone never become ore; tag+pickaxe needed',()=>{
 const w=world(),s=professionState({},tools);
 w.highflyInteractables=w.highflyInteractables.filter(n=>n.kind!=='ore');
 assert.equal(prepareProfession(s,w,'mine',pos,yaw).reason,'no-real-target');
 w.highflyInteractables.push({id:'ore-b',kind:'ore',x:0,z:1,charges:1});
 assert.equal(run(w,s,'mine').ok,true);assert.equal(s.inventory.ore,2);
 assert.equal(prepareProfession(s,w,'mine',pos,yaw).ok,false);
});
test('PESCAR: explicit fishing spot plus rod, not arbitrary nearby water',()=>{
 const w=world(),s=professionState({},tools);
 assert.equal(run(w,s,'fishing').product,'fish');
 assert.equal(s.inventory.fish,1);
 assert.equal(prepareProfession(s,w,'fishing',pos,yaw).reason,'no-real-target');
});
test('CULTIVAR: planting consumes seed, watering grows over time, ripe harvest yields herbs',()=>{
 const w=world(),s=professionState({seed:2},tools);
 assert.equal(professionActionFor(w.highflyInteractables[3]),'plant');
 assert.equal(run(w,s,'plant').ok,true);assert.equal(s.inventory.seed,1);
 assert.equal(professionActionFor(w.highflyInteractables[3]),'water');
 assert.equal(run(w,s,'water').ok,true);
 assert.equal(professionActionFor(w.highflyInteractables[3]),null,'cannot harvest before crop is mature');
 assert.equal(advanceCrops(w,1),0);
 assert.equal(advanceCrops(w,1.01),1);
 assert.equal(professionActionFor(w.highflyInteractables[3]),'harvest');
 assert.equal(run(w,s,'harvest').ok,true);assert.equal(s.inventory.herb,2);
 assert.equal(w.highflyInteractables[3].phase,'empty','plot reusable');
});
test('FUNDIR + FORJAR: finite real materials, no phantom ingots or swords',()=>{
 const w=world(),s=professionState({ore:4},tools);
 assert.equal(run(w,s,'smelt').ok,true);
 assert.equal(run(w,s,'smelt').ok,true);
 assert.equal(s.inventory.ore,0);assert.equal(s.inventory.ingot,2);
 const sword=run(w,s,'forge');
 assert.equal(sword.ok,true);assert.equal(s.inventory.blade_blank,1);
 assert.equal(s.inventory.ingot,0);assert.equal(prepareProfession(s,w,'forge',pos,yaw).reason,'missing-item');
});
test('Missing tools, insufficient materials and invalidation at completion never grant fake loot',()=>{
 const w=world(),s=professionState({seed:1},[]);
 assert.equal(prepareProfession(s,w,'chop',pos,yaw).reason,'missing-tool');
 assert.equal(prepareProfession(s,w,'forge',pos,yaw).reason,'missing-tool');
 s.tools.add('hammer');assert.equal(prepareProfession(s,w,'forge',pos,yaw).reason,'missing-item');
 s.tools.add('axe');const prep=prepareProfession(s,w,'chop',pos,yaw);
 w.highflyInteractables[0].available=false;
 assert.equal(commitProfession(s,w,prep.job).reason,'invalidated-target');
 assert.equal(s.inventory.wood??0,0);
});
test('Target must be in front, close, uniquely tagged, and usable',()=>{
 const w={highflyInteractables:[
 {id:'behind',kind:'tree',x:0,z:-1},
 {id:'remote',kind:'tree',x:0,z:8},
 {id:'wrong',kind:'stone',x:0,z:1},
 {id:'disabled',kind:'tree',x:0,z:1,available:false}
 ]};
 assert.equal(findProfessionTarget(w,pos,yaw,'chop'),null);
 assert.equal(prepareProfession(professionState({},tools),w,'chop',pos,yaw).reason,'no-real-target');
});
