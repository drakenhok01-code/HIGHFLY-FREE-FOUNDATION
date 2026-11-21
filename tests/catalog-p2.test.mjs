import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 RARITIES,ORIGINS,validateP2,spawnGear,projectedGearStats,
 projectedEquippedBonuses,previewRecipe,previewTransferInstance
} from '../src/highfly/p2/catalog-domain.mjs';

const load=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const catalog=load('../docs/catalog/p2/MASTER_CATALOG_47.json');
const crafting=load('../docs/catalog/p2/RECIPES_32_AND_PROFESSIONS.json');
const legacy=load('../docs/audits/HIGHFLY_V36_BASELINE_ITEMS_RECIPES.json');
const item=id=>catalog.items.find(x=>x.id===id);
const recipe=id=>crafting.recipes.find(x=>x.id===id);
const make=(templateId,rarity='Común',instanceId='instance-001',origin='monster_drop')=>
 spawnGear(item(templateId),{instanceId,ownerId:'seller',rarity,origin});

test('P2 validates exactly 47 templates, 20 gear and 32 recipes',()=>{
 assert.deepEqual(validateP2(catalog,crafting),{valid:true,items:47,equipment:20,recipes:32,activeLegacy:19});
});
test('all 19 original HIGHFLY v3.6 item IDs survive unchanged',()=>{
 assert.ok(legacy.items.every(x=>item(x.id)?.status==='V36_EXISTING'));
 assert.deepEqual(legacy.items.filter(x=>x.id.startsWith('training_')).map(x=>x.baseStats),
  ['training_sword','training_shield','training_greatsword'].map(x=>item(x).equipment.baseStats));
});
test('the 12 original recipe ingredients and outputs survive untouched',()=>{
 for(const r of legacy.recipes){
  const v=recipe(r.id);
  assert.equal(v.status,'V36_EXISTING_DO_NOT_MUTATE');
  assert.equal(v.output.templateId,r.outputId);
  assert.equal(v.output.count,r.count);
  assert.equal(v.professionId,crafting.professions.find(x=>x.nameEs===r.profession)?.id);
  assert.deepEqual(Object.fromEntries(v.ingredients.map(x=>[x.templateId,x.count])),r.ingredients);
 }
});
for(const rarity of RARITIES) test('equipment born as '+rarity+' is always +0',()=>{
 const a=make('hf_iron_chest',rarity,'rare-'+rarity);
 assert.equal(a.rarity,rarity);
 assert.equal(a.plus,0);
 assert.equal(a.instanceId,'rare-'+rarity);
});
for(const origin of ORIGINS) test('equipment acquired by '+origin+' is always +0',()=>{
 const a=make('hf_iron_chest','Legendario','source-'+origin,origin);
 assert.equal(a.plus,0);
 assert.equal(a.origin,origin);
});
test('no caller may inject +N into a drop/craft/reward constructor',()=>{
 for(const key of ['plus','enhancement','levelUpgrade']) assert.throws(
  ()=>spawnGear(item('hf_iron_chest'),{instanceId:'hacked',ownerId:'player',rarity:'Mítico',origin:'boss_drop',[key]:9}),
  /\+N/
 );
});
test('Legendary +0 has greater base stats than Rare +0 without changing plus',()=>{
 const rare=make('hf_iron_chest','Raro');
 const leg=make('hf_iron_chest','Legendario');
 assert.equal(rare.plus,leg.plus);
 assert.ok(projectedGearStats(item('hf_iron_chest'),leg).defense>projectedGearStats(item('hf_iron_chest'),rare).defense);
 assert.equal(projectedGearStats(item('hf_iron_chest'),leg).defense,14.8);
});
test('the P2 first iron armor suite has 6 stat-only pieces, not models',()=>{
 const armor=catalog.items.filter(x=>x.id.startsWith('hf_iron_')&&x.kind==='armor');
 assert.equal(armor.length,6);
 for(const x of armor)assert.equal(x.equipment.appearance,'STATS_ONLY_NO_3D');
});
test('our hunter uses no class-restricted gear',()=>{
 for(const x of catalog.items.filter(x=>x.equipment))assert.deepEqual(x.equipment.classRestrictions,[]);
 assert.equal(catalog.character.count,1);
 assert.equal(catalog.character.classSystem,false);
});
test('dual daggers use one source template but two independent instances',()=>{
 const left=make('hf_dagger_basic','Raro','dagger-left');
 const right=make('hf_dagger_basic','Raro','dagger-right');
 assert.notEqual(left.instanceId,right.instanceId);
 const b=projectedEquippedBonuses([
  {slot:'left_hand',template:item('hf_dagger_basic'),instance:left},
  {slot:'right_hand',template:item('hf_dagger_basic'),instance:right}
 ]);
 assert.equal(b.physicalAttack,7.44);
});
test('one instanceId cannot be equipped twice, even to opposite hands',()=>{
 const dagger=make('hf_dagger_basic');
 assert.throws(()=>projectedEquippedBonuses([
  {slot:'left_hand',template:item('hf_dagger_basic'),instance:dagger},
  {slot:'right_hand',template:item('hf_dagger_basic'),instance:dagger}
 ]),/dos veces/);
});
test('future amulet does not sneak in an additional HUD/equipment slot',()=>{
 const amulet=item('hf_amulet_basic');
 assert.equal(amulet.equipment.slot,null);
 assert.equal(amulet.flags.requiresSlotDecision,true);
 assert.throws(()=>projectedEquippedBonuses([{slot:'necklace',template:amulet,instance:make('hf_amulet_basic')}]),/incompatible/);
});
test('four types of ore cannot be confused with original generic ore',()=>{
 for(const [metal,n] of [['copper',2],['iron',3],['silver',5],['gold',8]]){
  const r=recipe('p2_smelt_'+metal);
  assert.equal(r.ingredients.length,1);
  assert.equal(r.ingredients[0].templateId,'hf_ore_'+metal);
  assert.equal(r.ingredients[0].count,n);
  assert.equal(previewRecipe(r,{ore:999}).canCraft,false);
  assert.equal(previewRecipe(r,{['hf_ore_'+metal]:n}).canCraft,true);
 }
});
test('craft preview does not mutate material inventory',()=>{
 const i={hf_ore_iron:3,ore:200};
 const result=previewRecipe(recipe('p2_smelt_iron'),i);
 assert.equal(result.outputId,'ingot_iron');
 assert.equal(result.canCraft,true);
 assert.deepEqual(i,{hf_ore_iron:3,ore:200});
});
test('equipment crafting previews enforce +0, independently of rarity',()=>{
 const recipeIron=recipe('p2_armor_iron_chest');
 assert.equal(recipeIron.producesGearAtPlus0,true);
 const inventory={ingot_iron:6,hf_smithing_flux:2};
 assert.equal(previewRecipe(recipeIron,inventory).gearStartsPlus,0);
 assert.equal(make('hf_iron_chest','Mítico','craft-result','craft').plus,0);
});
test('trade prototype transfers same upgraded +3 instance and no reroll',()=>{
 const a={...make('hf_iron_chest','Raro','p2-unique'),plus:3,statRoll:{seed:'example'}};
 const b=previewTransferInstance(a,'seller','buyer');
 assert.equal(b.instanceId,a.instanceId);
 assert.equal(b.plus,3);
 assert.equal(b.rarity,'Raro');
 assert.equal(b.ownerId,'buyer');
 assert.deepEqual(b.statRoll,a.statRoll);
 assert.equal(a.ownerId,'seller');
});
test('seller cannot trade another player’s item in preview',()=>{
 const a=make('hf_iron_chest');
 assert.throws(()=>previewTransferInstance(a,'attacker','buyer'),/no posee/);
});
test('profession catalogue has 8 existing icon IDs and 7 future disciplines',()=>{
 assert.equal(crafting.professions.length,15);
 assert.equal(crafting.professions.filter(x=>x.v36Icon).length,8);
 assert.equal(crafting.recipes.length,32);
 assert.equal(crafting.recipes.filter(x=>x.status==='P2_CANDIDATE_NOT_LIVE').length,20);
});
test('new items do not silently use unverified premium media',()=>{
 for(const x of catalog.items)assert.equal(x.icon.generatedAsset,false);
 for(const x of catalog.items.filter(x=>x.status==='P2_DEFINED_NOT_LIVE'))assert.equal(x.icon.approvedBinding,'NOT_REGISTERED_IN_RUNTIME');
 assert.equal(catalog.icons.filesVerifiedInGitTree,0);
});
test('saved v3.6 stack counts remain documented for migration',()=>{
 for(const id of ['training_sword','training_shield','training_greatsword']){
  assert.equal(item(id).stackMax,1);
  assert.equal(item(id).flags.legacyRuntimeMaxStack,10);
 }
});
