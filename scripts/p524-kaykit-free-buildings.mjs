/** P524: Download ONLY freely published CC0 KayKit Medieval Hexagon Pack.
 * Never touches user's privately purchased SOURCE/EXTRA files.
 * Pinned immutable commit; cannot silently pick future files/licence changes.
 */
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import crypto from 'node:crypto';
const ROOT=process.cwd(),DEST=path.join(ROOT,'public/highfly/kaykit-free'),CACHE=path.join(ROOT,'.highfly-kaykit-free');
const PACK='https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0.git';
const SHA='84fa4e91af6a88989be7c99e0891cede11f2ca38';
const SELECT=['archeryrange','barracks','blacksmith','castle','church','home_A','home_B','lumbermill','market','mine','tavern','tower_A','tower_B','watermill','well','windmill'];
const run=(cmd,args,cwd=ROOT)=>{
 const x=cp.spawnSync(cmd,args,{cwd,stdio:'inherit'});
 if(x.status!==0)throw Error(cmd+' '+args.join(' ')+' exit '+x.status);
};
fs.rmSync(CACHE,{recursive:true,force:true});
run('git',['clone','--quiet','--depth','1','--branch','main',PACK,CACHE]);
const rev=cp.spawnSync('git',['rev-parse','HEAD'],{cwd:CACHE,encoding:'utf8'});
if(rev.status!==0||rev.stdout.trim()!==SHA)throw Error('KayKit CC0 frozen SHA drift: '+rev.stdout);
const dir=path.join(CACHE,'addons/kaykit_medieval_hexagon_pack/Assets/gltf/buildings/red');
fs.mkdirSync(DEST,{recursive:true});
const copy=(source,target)=>{if(!fs.existsSync(source))throw Error('Missing official KayKit CC0 '+source);fs.copyFileSync(source,target);};
copy(path.join(dir,'hexagons_medieval.png'),path.join(DEST,'hexagons_medieval.png'));
const manifest=[];
for(const name of SELECT){
 const basename='building_'+name+'_red';
 const gltf=JSON.parse(fs.readFileSync(path.join(dir,basename+'.gltf'),'utf8'));
 if(gltf.buffers?.length!==1||gltf.buffers[0].uri!==basename+'.bin'||gltf.images?.[0]?.uri!=='hexagons_medieval.png')
  throw Error('KayKit unexpected glTF externals '+basename);
 for(const ext of ['.gltf','.bin'])copy(path.join(dir,basename+ext),path.join(DEST,basename+ext));
 const bytes=fs.statSync(path.join(DEST,basename+'.bin')).size;
 manifest.push({id:'kaykit-'+name.toLowerCase().replace('_','-'),name,model:basename+'.gltf',sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(DEST,basename+'.bin'))).digest('hex'),bytes,source:PACK,commit:SHA,license:'CC0-1.0'});
}
copy(path.join(CACHE,'LICENSE.txt'),path.join(DEST,'LICENSE-KAYKIT-MEDIEVAL-HEXAGON-CC0.txt'));
fs.writeFileSync(path.join(DEST,'manifest.json'),JSON.stringify({schema:1,source:PACK,commit:SHA,license:'CC0-1.0',models:manifest},null,2));
console.log('[P524 FREE KAYKIT SOURCE VERIFIED]',SHA,manifest.length,'real original CC0 building models; no SOURCE/EXTRA');
