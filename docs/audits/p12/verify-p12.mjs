/**
 * HIGHFLY P1.2: manifest validation only. This is NOT a gameplay/visual test.
 * From repo root: node docs/audits/p12/verify-p12.mjs
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const json=path=>JSON.parse(read(path));
const rows=path=>read(path).trimEnd().split(/\r?\n/).slice(1);
const firstColumn=path=>rows(path).map(s=>s.match(/^"([^"]+)"/)?.[1]).filter(Boolean);
const secondColumn=path=>rows(path).map(s=>s.match(/^"[^"]*","([^"]*)"/)?.[1]).filter(Boolean);

const itemIds=firstColumn('./WOC_V0447_EXPANDED_UNIFIED_1626.csv');
const lootIds=secondColumn('./LOOT_SOURCE_EVIDENCE_916.csv').filter(Boolean);
const itemsSet=new Set(itemIds);
const heroic=json('./HEROIC_VARIANTS_RECONCILED_V2.json');
const bosses=json('./HEROIC_BOSS_TABLES_NORMALIZED.json');
const trinkets=json('./WOC_DYNAMIC_TRINKETS_18.json');
const crucible=json('./CRUCIBLE_GENERATED_COLLECTIONS.json');
const raid=json('./NYTHRAXIS_DYNAMIC_LOOT_RECONCILED.json');
const media=json('./MEDIA_LICENSE_CLASSIFICATION.json');
const loot=json('./LOOT_SOURCE_EVIDENCE_SUMMARY.json');
const birth=json('../p11/EQUIPMENT_BIRTH_PLUS_ZERO_POLICY.json');
const baselineIds=new Set(firstColumn('../p1/WOC_V0447_UNIFIED_SOURCE_CANDIDATES.csv'));
const inline=json('./BASE_LOOT_INLINE_AND_NORMAL_ONLY_SUMMARY.json');
const dynamic=json('./DYNAMIC_SPREAD_LOOT_RESOLVED_82.json');

assert.equal(itemIds.length,1626);
assert.equal(itemsSet.size,1626,'item IDs must be unique');
assert.equal(baselineIds.size,1488);
assert.ok([...baselineIds].every(id=>itemsSet.has(id)),'P1 items must remain in P1.2');
assert.equal(loot.numbers.allSourceEvidenceRows,916);
assert.equal(rows('./LOOT_SOURCE_EVIDENCE_916.csv').length,916);
assert.ok(lootIds.every(id=>itemsSet.has(id)),'no referenced loot item can be missing from catalog');
assert.equal(heroic.generatedVariants,78);
assert.equal(heroic.variants.length,78);
assert.deepEqual(heroic.sourceLevels,{'22':47,'25':1,'27':30});
assert.ok(heroic.variants.every(x=>itemsSet.has(x.generatedId)));
assert.equal(heroic.unresolvedEligibleSourceExpressions.length,0);
assert.equal(bosses.counts.bossTables,14);
assert.equal(bosses.counts.rows,171);
assert.equal(bosses.counts.unresolvedSourceItemIds,0);
assert.equal(bosses.rows.length,171);
assert.ok(bosses.rows.every(x=>itemsSet.has(x.itemId)));
assert.equal(trinkets.items.length,18);
assert.equal(trinkets.notPreviouslyCaptured,16);
assert.equal(crucible.gear.length,33);
assert.equal(crucible.manuals.length,11);
assert.equal(crucible.recipes.length,33);
assert.equal(raid.epicRows.length,28);
assert.equal(raid.legendary.length,2);
assert.equal(inline.totalRows,76);
assert.equal(dynamic.count,82);
assert.equal(media.rows,255);
assert.equal(media.countByRedistribution['Yes'],36);
assert.equal(media.countByRedistribution['With the project only'],137);
assert.equal(media.countByRedistribution['No, permission required'],69);
assert.equal(media.countByRedistribution['Non-commercial only, with attribution'],9);
assert.equal(birth.identity.characterCount,1);
assert.equal(birth.enhancement.birthValue,0);
assert.equal(birth.enhancement.noPreEnhancedLoot,true);
assert.equal(birth.enhancement.noPreEnhancedCrafting,true);
assert.equal(birth.enhancement.noPreEnhancedQuestReward,true);
assert.equal(birth.transfer.preserveFields.includes('instanceId'),true);
assert.equal(birth.transfer.preserveFields.includes('plus'),true);

console.log(JSON.stringify({
  status:'PASS',
  scope:'AUDIT_MANIFESTS_ONLY_NO_GAMEPLAY_EXECUTION',
  sourceCandidateItemIds:itemsSet.size,
  sourceLootRows:loot.numbers.allSourceEvidenceRows,
  generatedHeroicCandidates:heroic.generatedVariants,
  heroicBossTables:bosses.counts.bossTables,
  linkedSourceMissingItems:0,
  mediaCreditGroups:media.rows,
  universalHunter:true,
  everyNewGearStartsPlusZero:true
},null,2));
