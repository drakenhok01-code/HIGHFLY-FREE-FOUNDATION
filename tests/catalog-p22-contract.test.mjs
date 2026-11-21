import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const J=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const p2=J('docs/catalog/p2/MASTER_CATALOG_47.json');
const art=J('docs/catalog/p22/P22_VISUAL_BINDINGS_47.json');
const zip=J('docs/catalog/p22/P22_ASSETS_28_SHA256.json');
const p21=J('docs/catalog/p21/ICON_BINDINGS_47.json');

test('P2.2 IDs, quantities and source mix',()=>{
 assert.equal(art.items.length,47);assert.equal(new Set(art.items.map(x=>x.id)).size,47);
 assert.equal(zip.files.length,28);assert.equal(new Set(zip.files.map(x=>x.id)).size,28);
 assert.deepEqual(art.counts,{total:47,v36Preserved:19,newItems:28,newIllustrated:16,adaptedUserOriginal:8,reusedExactUserArt:4});
 assert.deepEqual(zip.sourceMix,{newIllustration:16,originalAdaptation:8,originalUnmodified:4});
 assert.equal(zip.files.filter(x=>x.source==='NEW_ILLUSTRATION').length,16);
 assert.equal(zip.files.filter(x=>x.source==='ADAPTED_USER_ORIGINAL').length,8);
 assert.equal(zip.files.filter(x=>x.source==='REUSED_USER_ORIGINAL').length,4);
});
test('P2.2 preserves exactly the 19 approved icon paths',()=>{
 const original=new Map(p2.items.map(x=>[x.id,x]));
 for(const row of art.items){
  assert.ok(original.has(row.id));
  if(row.preserveOriginalApprovedIcon){
   assert.equal(row.runtimeIconPath,'highfly/user-icons/'+original.get(row.id).icon.relativeUserIconPath+'.webp');
   assert.equal(row.artStatus,'V36_EXISTING_PRESERVE_BINDING');
  }
 }
 assert.equal(art.items.filter(x=>x.preserveOriginalApprovedIcon).length,19);
});
test('P2.2 assets have exactly one distinct path and SHA for every new item',()=>{
 const all=new Set(p2.items.map(x=>x.id));
 const paths=new Set();
 for(const file of zip.files){
  assert.ok(all.has(file.id));
  assert.equal(file.format,'WebP');
  assert.deepEqual(file.sizePx,[256,256]);
  assert.match(file.sha256,/^[0-9a-f]{64}$/);
  assert.ok(!paths.has(file.zipEntry));paths.add(file.zipEntry);
  assert.ok(file.zipEntry.endsWith('/'+file.id+'.webp'));
  assert.ok(file.intendedRepoFile.startsWith('assets/highfly/p22/'));
  assert.equal(file.status,'ART_CANDIDATE_NOT_ACTIVE');
 }
 assert.equal(paths.size,28);
});
test('P2.2 equipment policies and semantic review gates preserved',()=>{
 assert.equal(p2.equipmentPolicy.spawnEnhancement,0);
 assert.equal(p2.character.count,1);
 assert.equal(p2.character.classSystem,false);
 assert.equal(art.policy.original60ArchiveBytesNeverChanged,true);
 for(const row of art.items)if(row.enhancementBirth!==null)assert.equal(row.enhancementBirth,0);
 assert.equal(art.items.find(x=>x.id==='hf_amulet_basic').equipmentSlot,null);
 assert.equal(art.items.find(x=>x.id==='hf_iron_chest').armor3DAllowed,false);
 assert.equal(p21.counts.existingPreserved,19);
});
test('P2.2 excludes artwork from runtime until gated',()=>{
 assert.ok(art.items.filter(x=>x.artStatus==='P22_CANDIDATE_ONLY_NOT_IMPORTED').length===28);
 assert.ok(zip.files.every(x=>x.visualApprovalRequired));
 assert.equal(art.policy.noUIChanges,true);
 assert.equal(art.policy.noNewLootEnabled,true);
});
