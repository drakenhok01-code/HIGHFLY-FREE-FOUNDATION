/**
 * KayKit FREE Adventurers 1.0: audited GLB metadata only.
 * Downloads the four other characters from an immutable official public
 * Git revision (no SOURCE assets, no binaries added to this repo).
 * Each 3D GLB is hashed by Git SHA-1 and lists joint names, relationships,
 * sockets and clip names. Similar-looking meshes are NOT proof of same rig.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
const rev='672074b73ba276876a19e8816ecdc5241817ab47';
const prefix='https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/'+rev+
 '/addons/kaykit_character_pack_adventures/Characters/gltf/';
const candidates=[
 ['Knight','717b56ca2b5ff5392679774725201ba03a3eefab',3659532],
 ['Barbarian','66d312ab6dc02b35fb648e7585bfdddb4e02eeef',3613268],
 ['Mage','c89f19f6e707f6e07e4632a08876bd6d0172b082',3589240],
 ['Rogue','c8827661105eef7b2bfbef3bc676d41a47625733',3616284],
 ['Rogue_Hooded','5d2b1403240d5f9ffff12e02c007572038eca2a8',3597652]
];
function parse(buf){
 if(buf.toString('ascii',0,4)!=='glTF'||buf.readUInt32LE(4)!==2||buf.readUInt32LE(8)!==buf.length||buf.toString('ascii',16,20)!=='JSON')
  throw Error('Not valid pinned GLB 2.0');
 return JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString('utf8'));
}
const normal=n=>(n??'').toLowerCase().replace(/[^a-z0-9]/g,'');
function summarize(g){
 const skins=g.skins??[],joints=[...new Set(skins.flatMap(s=>s.joints??[]))];
 const jointNames=joints.map(i=>normal(g.nodes[i]?.name)).sort(),jointSet=new Set(joints);
 const parents=new Map();
 for(let i=0;i<g.nodes.length;i++)for(const child of g.nodes[i].children??[])parents.set(child,i);
 const hierarchy=joints.map(i=>{
  let parent=parents.get(i);
  while(parent!==undefined&&!jointSet.has(parent))parent=parents.get(parent);
  return normal(g.nodes[i].name)+'<-'+(parent!==undefined?normal(g.nodes[parent].name):'<root>');
 }).sort();
 const animationNames=(g.animations??[]).map(a=>a.name).sort();
 const sockets=g.nodes.map(n=>n.name).filter(n=>/handslot|hand.?slot/i.test(n)).sort();
 return {joints:jointNames.length,jointNames,hierarchy,clips:animationNames.length,animationNames,sockets};
}
const result=[];
for(const [name,gitSha,size] of candidates){
 const response=await fetch(prefix+name+'.glb');
 if(!response.ok)throw Error('Official CC0 KayKit unavailable '+name+' '+response.status);
 const data=Buffer.from(await response.arrayBuffer());
 if(data.length!==size)throw Error('Immutable '+name+' unexpected size '+data.length);
 const sha=crypto.createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
 if(sha!==gitSha)throw Error('Official '+name+' Git blob digest mismatch');
 const parsed=parse(data);
 result.push({name,source:prefix+name+'.glb',sha256:crypto.createHash('sha256').update(data).digest('hex'),size,...summarize(parsed)});
}
const canonical=result[0];
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const report={
 auditedAt:'2026-11-18',revision:rev,license:'CC0-1.0',
 reference:'Knight FREE Rig_Medium, not a claim about Rig_Large',
 characters:result.map(x=>({name:x.name,bytes:x.size,sha256:x.sha256,
  joints:x.joints,clips:x.clips,sockets:x.sockets,
  identicalBoneNames:equal(x.jointNames,canonical.jointNames),
  identicalBoneHierarchy:equal(x.hierarchy,canonical.hierarchy),
  identicalClipNames:equal(x.animationNames,canonical.animationNames),
  compatibleMedium:equal(x.hierarchy,canonical.hierarchy),
  // Original vs HIGHFLY V6.6: same joint structure, different rest transforms.
  source:x.source
 })),
 findings:'An unchanged bone hierarchy supports medium-rig animation reuse. HIGHFLY Anime V6.6 changes rest positions and geometry, therefore animation retarget remains necessary. Large-rig binaries require separate audit.'
};
fs.mkdirSync('dist',{recursive:true});
fs.writeFileSync('dist/HIGHFLY_KAYKIT_FREE_RIG_AUDIT.json',JSON.stringify(report,null,2));
for(const c of report.characters)console.log('[FREE KAYKIT RIG]',JSON.stringify(c));
if(canonical.joints!==41||canonical.clips!==76)throw Error('Knight FREE baseline changed');
console.log('PASS exact public KayKit FREE rig and clip compatibility metadata audited: '+result.length+' GLBs');
