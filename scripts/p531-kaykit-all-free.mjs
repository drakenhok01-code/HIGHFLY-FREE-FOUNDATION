/** HIGHFLY P531 · copy all 221 official KayKit FREE assets from pinned CC0 pack.
 * Does not touch, copy or publish a single paid/private KayKit SOURCE file.
 * Produces path-preserving original glTF, binary and texture dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {KAYKIT_FREE_ALL,KAYKIT_FREE_GROUPS} from '../src/highfly/p531-kaykit-free-catalog.mjs';
const ROOT=process.cwd();
const commit='84fa4e91af6a88989be7c99e0891cede11f2ca38';
const upstream=path.join(ROOT,'.highfly-kaykit-free');
const source=path.join(upstream,'addons/kaykit_medieval_hexagon_pack/Assets/gltf');
const target=path.join(ROOT,'public/highfly/kaykit-free','all');
const actual=execFileSync('git',['rev-parse','HEAD'],{cwd:upstream,encoding:'utf8'}).trim();
if(actual!==commit)throw Error('Official KayKit FREE pinned revision changed: '+actual);
const copied=new Set(),copy=(rel)=>{
 if(copied.has(rel))return;
 const src=path.join(source,rel),dst=path.join(target,rel);
 if(!fs.existsSync(src))throw Error('Missing FREE KayKit dependency '+rel);
 fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);copied.add(rel);
};
const manifest=[];
for(const model of KAYKIT_FREE_ALL){
 const src=path.join(source,model.freePath);
 const gltf=JSON.parse(fs.readFileSync(src,'utf8'));
 if(!gltf.meshes?.length||!gltf.buffers?.length)throw Error('Missing glTF mesh '+model.id);
 const folder=path.posix.dirname(model.freePath);
 copy(model.freePath);
 for(const item of [...(gltf.buffers??[]),...(gltf.images??[])]){
  if(!item.uri||/^(?:https?:|data:|\/|\.\.)/i.test(item.uri))throw Error('Untrusted glTF dependency '+model.id);
  copy(path.posix.join(folder,item.uri));
 }
 const binaryFile=gltf.buffers[0]?.uri;
 const binary=fs.readFileSync(path.join(source,folder,binaryFile));
 manifest.push({...model,sha256:crypto.createHash('sha256').update(binary).digest('hex'),
  bytes:binary.length,source:'https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0',
  commit,license:'CC0-1.0'});
}
if(manifest.length!==221)throw Error('Expected all 221 FREE KayKit glTF models');
const dst=path.join(ROOT,'public/highfly/kaykit-free');
fs.writeFileSync(path.join(dst,'all-manifest.json'),JSON.stringify({
 schema:1,origin:'KayKit Medieval Hexagon original publicly available pack',
 source:'https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0',
 license:'CC0-1.0',commit,groups:KAYKIT_FREE_GROUPS,models:manifest
},null,2));
fs.copyFileSync(path.join(upstream,'LICENSE.txt'),path.join(dst,'LICENSE-KAYKIT-FREE-FULL-CC0.txt'));
console.log('[P531 KAYKIT FREE COMPLETE]',manifest.length,'actual CC0 models',JSON.stringify(KAYKIT_FREE_GROUPS),copied.size,'files',Array.from(copied).length);
