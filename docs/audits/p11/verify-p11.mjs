/**
 * P1.1 AUDIT DATA VALIDATOR — NOT a gameplay test.
 * Run: node docs/audits/p11/verify-p11.mjs
 * Reads source manifests and validates IDs/plus-zero policy without modifying game state.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const here = new URL('./', import.meta.url);
const read = (relative) => readFileSync(new URL(relative, here), 'utf8');
const json = (relative) => JSON.parse(read(relative));
const firstColumn = (csvText) => new Set(csvText.trimEnd().split(/\r?\n/).slice(1).map(line => line.match(/^"([^"]+)"/)?.[1]).filter(Boolean));
const secondColumn = (csvText) => new Set(csvText.trimEnd().split(/\r?\n/).slice(1).map(line => line.match(/^"[^"]+","([^"]+)"/)?.[1]).filter(Boolean));
const baseline = json('../HIGHFLY_V36_BASELINE_ITEMS_RECIPES.json');
const catalog = json('./HIGHFLY_PRIORITY_CATALOG.json');
const policy = json('./EQUIPMENT_BIRTH_PLUS_ZERO_POLICY.json');
const cases = json('./EQUIPMENT_LIFECYCLE_ACCEPTANCE_CASES.json');
const equivalent = json('./SEMANTIC_EQUIVALENCE_REVIEW.json');
const source = firstColumn(read('../p1/WOC_V0447_UNIFIED_SOURCE_CANDIDATES.csv'));
const models = secondColumn(read('../p1/KAYKIT_FREE_4_PACKS_MODELS.csv'));
const ember = new Set(json('../p1/EMBERFALL_V08_ITEMS_ASSETS_AUDIT.json').weapons.map(w => w.id));
const ids = new Set(catalog.items.map(item => item.templateId));
assert.equal(baseline.items.length, 19, 'approved baseline item count changed');
assert.equal(catalog.items.length, 47, 'unexpected P1.1 priority catalogue size');
assert.equal(ids.size, catalog.items.length, 'duplicated HIGHFLY template ID');
assert.ok(baseline.items.every(item => ids.has(item.id)), 'approved item missing');
assert.equal(policy.identity.characterCount, 1);
assert.equal(policy.identity.characterMode, 'UNIVERSAL_HUNTER');
assert.equal(policy.enhancement.birthValue, 0);
assert.equal(policy.enhancement.noPreEnhancedLoot, true);
assert.equal(policy.enhancement.noPreEnhancedCrafting, true);
assert.equal(policy.enhancement.noPreEnhancedMerchantStock, true);
assert.equal(policy.enhancement.noPreEnhancedQuestReward, true);
for (const entry of catalog.items) {
  const gear = ['weapon', 'armor', 'shield', 'accessory'].includes(entry.type);
  assert.equal(entry.birthEnhancement, gear ? 0 : null, 'wrong birth +N: ' + entry.templateId);
  if (gear && ['armor','accessory'].includes(entry.type)) {
    assert.equal(entry.visualPolicy, 'STAT_ONLY_NO_CHARACTER_MESH');
    assert.equal(entry.kaykitFreeModelCandidates.length, 0, 'armor model attempted: ' + entry.templateId);
  }
  for (const w of entry.wocReferences) assert.ok(source.has(w.id), 'WOC reference missing: ' + w.id);
  for (const w of entry.emberfallReferences) assert.ok(ember.has(w.id), 'Emberfall ref missing: ' + w.id);
  for (const m of entry.kaykitFreeModelCandidates) {
    assert.ok(models.has(m.sourcePath), 'CC0 model ref missing: ' + m.sourcePath);
    assert.equal(m.license, 'CC0_1_0');
  }
}
assert.equal(catalog.weaponStyles.length, 11);
assert.ok(catalog.weaponStyles.every(style => ids.has(style.templateId)));
assert.equal(catalog.weaponStyles.find(x=>x.style==='dagas_dobles').templateId,'hf_dagger_basic');
const groups = equivalent.upstreamHoard.groups;
assert.equal(groups.length, 32);
assert.equal(equivalent.upstreamHoard.sourceVariantRows, 96);
for (const g of groups) {
  assert.equal(g.sourceVariants.length, 3);
  for (const variantId of g.sourceVariants) assert.ok(source.has(variantId), 'Hoard variant missing: '+variantId);
  assert.equal(g.birthPlusAllVariants,0);
}
assert.equal(cases.cases.length,12);
assert.ok(cases.cases.filter(x => x.given.action.includes('DROP')).every(x => x.expected.plus === 0));
assert.ok(cases.cases.find(x => x.id === 'trade_retains_existing_plus').expected.plus === 3);
console.log(JSON.stringify({
  result:'PASS',scope:'STATIC_AUDIT_VALIDATION_ONLY',
  catalogTemplates:catalog.items.length,baselinePreserved:baseline.items.length,
  validatedUpstreamRefs:catalog.items.reduce((sum,x)=>sum+x.wocReferences.length,0),
  validatedKayKitModelRefs:catalog.items.reduce((sum,x)=>sum+x.kaykitFreeModelCandidates.length,0),
  hoardGroups:groups.length,acceptanceCasesSpecified:cases.cases.length,
  runtimeTests:'NOT_RUN',gameCodeChanged:false
},null,2));
