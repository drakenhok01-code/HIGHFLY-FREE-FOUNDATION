import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const p2=read('docs/catalog/p2/MASTER_CATALOG_47.json');
const p31=read('docs/catalog/p31/P31_PILOT_16X6.json');
const expected=['Común','Poco común','Raro','Épico','Legendario','Mítico'];
test('P3.1 16 authentic objects, 6 real rarities and 96 visual frames',()=>{
 assert.equal(p31.items.length,16);assert.equal(p31.rarities.length,6);assert.equal(16*6,p31.counts.webp256Total);
 assert.deepEqual(p31.rarities.map(x=>x.name),expected);assert.deepEqual(p2.rarities,expected);
 assert.equal(new Set(p31.items.map(x=>x.id)).size,16);
 for(const x of p31.items)assert.ok(p2.items.some(y=>y.id===x.id),'Unknown '+x.id);
});
test('P3.1 only 10 equip +0, materials stay visual/nonrandom',()=>{
 assert.equal(p31.items.filter(x=>x.category!=='Material').length,10);
 assert.equal(p31.items.filter(x=>x.category==='Material').length,6);
 for(const row of p31.items)if(row.category==='Material'){
  assert.equal(row.enhancementBirth,null);assert.equal(row.rarityLive,'FIXED_RARITY_VISUAL_MOCK');
 }else assert.equal(row.enhancementBirth,0);
 assert.equal(p2.equipmentPolicy.spawnEnhancement,0);
});
test('P3.1 can never be confused with a production deployment',()=>{
 assert.equal(p31.stage,'ISOLATED_VISUAL_CATALOG_OFFLINE_ART_SEPARATE');
 assert.equal(p31.artwork.repositoryBinaryImported,false);
 assert.equal(p31.artwork.automatedBrowserPreviewVerified,false);
 assert.equal(p31.invariants.noLiveMenuIntegration,true);
 assert.equal(p31.invariants.keepPremiumV36Untouched,true);
 assert.equal(p31.artwork.pixelSize.join('x'),'256x256');
});
test('P3.1 reproducible selective frame generator keeps exact source size',()=>{
 const s=fs.readFileSync('scripts/p31-frame-recolor.py','utf8');
 assert.match(s,/d<35/);assert.match(s,/256,256/);assert.match(s,/color is None:return im.copy/);
 assert.match(s,/gold&\(d<35\)/);
});
