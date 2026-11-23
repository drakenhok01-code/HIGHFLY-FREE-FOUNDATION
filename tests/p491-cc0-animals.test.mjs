import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const src='assets/highfly/p491/models/';
const definitions={
 wolf:{sha:'00d69a6c127752c2506c66bc93db9a10f4a73df0',
  clips:['Idle','Walk','Attack','Death','Gallop'],minClips:12,extension:'EXT_meshopt_compression'},
 crab:{sha:'ceb814db15ad267caeabadfb4da0299eccc807aa',
  clips:['Idle','Walk','Bite_Front','Death','HitRecieve'],minClips:10,extension:'EXT_meshopt_compression'},
 boar:{sha:'f57ae4b2a4fa6df29e6feaf5fb9a7e39ec5ff73d',
  clips:['idle','walk','attack','dead'],minClips:4}
};
function inspectGlb(file){
 const buf=fs.readFileSync(file);
 assert.equal(buf.toString('ascii',0,4),'glTF','GLB binary magic');
 assert.equal(buf.readUInt32LE(4),2,'GLB version 2');
 assert.equal(buf.readUInt32LE(8),buf.byteLength,'GLB advertised size');
 assert.equal(buf.readUInt32LE(16),0x4e4f534a,'GLB JSON chunk');
 const size=buf.readUInt32LE(12),data=JSON.parse(buf.subarray(20,20+size).toString('utf8'));
 assert.ok(buf.byteLength>=20+size,'binary chunk present');
 return {buf,data};
}
for(const [id,def] of Object.entries(definitions)){
 test('P491 CC0 3D '+id+': pinned full rig with authentic attack and death animations',()=>{
  const {buf,data}=inspectGlb(src+id+'.glb');
  const sha=crypto.createHash('sha1').update('blob '+buf.byteLength).update(Buffer.from([0])).update(buf).digest('hex');
  assert.equal(sha,def.sha);
  assert.ok(data.skins?.length>0,'A rigged skinned animal is mandatory');
  assert.ok(data.meshes?.length>0);
  assert.ok((data.animations?.length??0)>=def.minClips);
  const names=data.animations.map(a=>a.name);
  for(const clip of def.clips)assert.ok(names.includes(clip),id+' is missing '+clip);
  if(def.extension)assert.ok(data.extensionsUsed?.includes(def.extension));
  const riggedIds=new Set((data.skins??[]).flatMap(s=>s.joints));
  assert.ok(riggedIds.size>4,'True multi-joint creature rig');
 });
}
test('P491 no dummy spheres or fabricated wolf/crab/boar and still native AI',()=>{
 const world=fs.readFileSync('src/highfly/p49-hunt-world.mjs','utf8');
 assert.doesNotMatch(world,/function animal\(|new THREE\.(SphereGeometry|ConeGeometry|CylinderGeometry)/);
 assert.match(world,/makeLicensedCreature\(/);
 assert.match(world,/animateLicensedCreature\(/);
 assert.match(world,/game\.enemies\.spawn\(/);
 for(const id of Object.keys(definitions))assert.ok(world.includes('hf_'+id));
 const engine=fs.readFileSync('src/highfly/p491-cc0-creatures.mjs','utf8');
 assert.match(engine,/MeshoptDecoder\.ready/);
 assert.match(engine,/setMeshoptDecoder\(MeshoptDecoder\)/);
 assert.match(engine,/cloneSkeleton\(gltf\.scene\)/);
 assert.match(engine,/mixer\.update\(/);
 assert.match(engine,/dont|never/i);
 assert.ok(!engine.includes('wild_boar.glb'),'Restricted or uncertain original swine is not used');
});
test('P491 build includes only verified CC0 animal models and immutable hashes',()=>{
 const build=fs.readFileSync('scripts/f0-build.mjs','utf8');
 assert.ok(build.includes('p491-cc0-creatures.mjs'));
 for(const id of Object.keys(definitions)){
  assert.ok(build.includes("public/models/hf-p491-'+id+'.glb"),'The approved model path must be generated for '+id);
  assert.ok(build.includes(definitions[id].sha));
 }
 assert.match(build,/sha1/);assert.match(build,/bytes\.toString\('utf8',0,4\)!=='glTF'/);
});
test('P491 keeps real physical loot and native XP separate from training stats',()=>{
 const loot=fs.readFileSync('src/highfly/p41-world-loot.mjs','utf8');
 for(const id of ['wolf','boar','crab'])assert.ok(loot.includes("'hf_"+id+"'"));
 const quests=fs.readFileSync('src/highfly/p49-hunt-data.mjs','utf8');
 assert.ok(quests.includes('gainHuntXp'));
 assert.ok(quests.includes('turnInHunt'));
 const core=fs.readFileSync('src/highfly/rpg-core.mjs','utf8');
 for(const id of ['wolf_pelt','boar_tusk','crab_shell'])assert.ok(core.includes(id));
});
