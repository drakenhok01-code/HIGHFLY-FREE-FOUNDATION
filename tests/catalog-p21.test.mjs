import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const json=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const p2=json('docs/catalog/p2/MASTER_CATALOG_47.json');
const craft=json('docs/catalog/p2/RECIPES_32_AND_PROFESSIONS.json');
const plan=json('docs/catalog/p21/ICON_BINDINGS_47.json');
const zips=json('docs/catalog/p21/ICON_ZIP_MANIFEST_60.json');
const sem=json('docs/catalog/p21/SEMANTIC_EQUIVALENCE_GATES.json');
const list=b=>execFileSync('unzip',['-Z','-1',b],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean).sort();

test('P2.1: exactly 47 matching P2 items with immutable 19 legacy references',()=>{
 assert.equal(p2.items.length,47);
 assert.equal(plan.items.length,47);
 const original=new Map(p2.items.map(x=>[x.id,x]));
 assert.equal(original.size,47);
 for(const row of plan.items){
  const item=original.get(row.itemId);
  assert.ok(item,'P2 item missing: '+row.itemId);
  assert.equal(row.nameEs,item.nameEs);
  assert.equal(row.statusP2,item.status);
  if(item.status==='V36_EXISTING'){
   assert.equal(row.iconDecision,'PRESERVE_V36_BINDING');
   assert.equal(row.proposedRelativePath,item.icon.relativeUserIconPath);
   assert.equal(row.gameBindingAlreadyExists,true);
  } else {
   assert.equal(row.gameBindingAlreadyExists,false);
   assert.equal(row.approvedForNewRuntimeBinding,false);
  }
 }
 assert.equal(plan.items.filter(x=>x.iconDecision==='PRESERVE_V36_BINDING').length,19);
 assert.equal(plan.items.filter(x=>x.iconDecision==='RESERVED_CANDIDATE_REQUIRES_VISUAL_APPROVAL').length,15);
 assert.equal(plan.items.filter(x=>x.iconDecision==='NEW_ART_REQUIRED').length,13);
});

test('P2.1: the 60 user WebPs are exactly enumerated in ZIP archives',()=>{
 const expectedAll=new Set();
 let total=0;
 for(const pack of zips.sourcePacks){
  const full=path.join(ROOT,pack.repositoryPath);
  assert.ok(fs.existsSync(full),'Missing ZIP '+pack.repositoryPath);
  const digest=crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
  assert.equal(digest,pack.sha256PinnedByExistingBuild,'ZIP SHA mismatch '+pack.category);
  const entries=list(full);
  assert.deepEqual(entries,pack.entries,'ZIP assets differ for '+pack.category);
  assert.equal(entries.length,pack.expectedEntries);
  total+=entries.length;
  for(const entry of entries){
   assert.match(entry,/^(armor|items|navigation|professions|skills|skills-advanced|weapons)\/[a-z0-9_]+\.webp$/);
   assert.ok(!expectedAll.has(entry),'Duplicate ZIP entry '+entry);
   expectedAll.add(entry);
   const img=execFileSync('unzip',['-p',full,entry],{maxBuffer:1024*1024});
   assert.ok(img.length>1000,'Small/empty WebP '+entry);
   assert.equal(img.toString('ascii',0,4),'RIFF','Invalid WebP RIFF '+entry);
   assert.equal(img.toString('ascii',8,12),'WEBP','Invalid WebP signature '+entry);
  }
 }
 assert.equal(total,60);
 const source=fs.readFileSync(path.join(ROOT,'scripts/f0-build.mjs'),'utf8');
 for(const pack of zips.sourcePacks)assert.ok(source.includes(pack.sha256PinnedByExistingBuild),'Hash not pinned in build');
 assert.match(source,/userIconCount!==60/);
 assert.ok(fs.existsSync(path.join(ROOT,'scripts/highfly-icon-alpha.py')));
 assert.ok(fs.existsSync(path.join(ROOT,'scripts/highfly-metal-variants.py')));
});

test('P2.1: icon paths cannot silently activate candidate objects',()=>{
 const packs=new Set(zips.sourcePacks.flatMap(p=>p.entries));
 const derived=new Set(zips.derivedDuringBuild);
 for(const b of plan.items){
  if(b.proposedRelativePath){
   const expected='highfly/user-icons/'+b.proposedRelativePath+'.webp';
   assert.equal(b.buildOutputRelativePath,expected);
   if(b.sourceWebpInCommittedZip)assert.ok(packs.has(b.sourceWebpInCommittedZip));
   else assert.ok(derived.has(expected));
  } else {
   assert.equal(b.iconDecision,'NEW_ART_REQUIRED');
   assert.equal(b.buildOutputRelativePath,null);
  }
  if(b.isEquipment){
   assert.equal(b.enhancementAtNewCreation,0);
   assert.equal(b.rarityIndependentOfEnhancement,true);
  }
  if(b.visualCompatibility?.kind==='armor'||b.visualCompatibility?.kind==='accessory')
   assert.equal(b.visualCompatibility.avatarMeshChanges,'NO_3D_ARMOR_OR_JEWELRY');
 }
 assert.equal(derived.size,4);
});

test('P2.1: risky semantic merges remain blocked',()=>{
 const byId=new Map(plan.items.map(x=>[x.itemId,x]));
 assert.notEqual(byId.get('hf_dagger_basic').itemId,'weapons/dual_daggers');
 assert.equal(byId.get('hf_wand_basic').proposedRelativePath,byId.get('hf_orb_basic').proposedRelativePath);
 assert.notEqual(byId.get('hf_wand_basic').itemId,byId.get('hf_orb_basic').itemId);
 assert.equal(byId.get('hf_amulet_basic').visualCompatibility.slot,null);
 for(const id of ['hf_ore_copper','hf_ore_iron','hf_ore_silver','hf_ore_gold'])
  assert.equal(byId.get(id).iconDecision,'NEW_ART_REQUIRED');
 assert.equal(sem.equalities.length,9);
 assert.ok(sem.blockedTransitions.includes('P21_DOES_NOT_MIGRATE_SAVE'));
});

test('P2.1: no recipe alteration or hidden item release',()=>{
 assert.equal(craft.recipes.length,32);
 assert.equal(craft.recipes.filter(x=>x.status==='V36_EXISTING_DO_NOT_MUTATE').length,12);
 assert.equal(plan.counts.existingPreserved+plan.counts.newReservedCandidates+plan.counts.newArtworkRequired,47);
 assert.equal(plan.counts.noNewIconFilesCreated,true);
 assert.equal(p2.equipmentPolicy.spawnEnhancement,0);
 assert.equal(p2.character.count,1);
 assert.equal(p2.character.classSystem,false);
});
