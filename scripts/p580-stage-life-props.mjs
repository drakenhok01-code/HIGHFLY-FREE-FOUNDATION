// Acquire only the original required CC0 work props and shared rig from the pinned Guildhall library.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const dir='dist/highfly/living-p580',region='dist/highfly/regions-p575',base='https://guildhall.codestz.dev/library/ea594dd361b4/';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8')),write=(p,v)=>fs.writeFile(p,JSON.stringify(v));
const hash=b=>createHash('sha256').update(b).update('\0').digest('hex').slice(0,16);
const safe=p=>typeof p==='string'&&p.split('/').every(s=>/^[a-zA-Z0-9_.-]+$/.test(s)&&s!=='.'&&s!=='..');
async function get(rel){if(!safe(rel))throw Error('Invalid library path '+rel);let e;for(let i=0;i<3;i++){try{const r=await fetch(new URL(rel,base),{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(r.status+' '+rel);let b=Buffer.from(await r.arrayBuffer());if(b[0]===31&&b[1]===139)b=gunzipSync(b);return b}catch(err){e=err}}throw e}
const glb=b=>b.length>=20&&b.toString('ascii',0,4)==='glTF'&&b.readUInt32LE(4)===2&&b.readUInt32LE(8)===b.length;
const index=JSON.parse(await get('catalog/index.json')),old=await read(region+'/asset-audit.json'),plan=await read(dir+'/index.json'),recipes=await read(dir+'/recipes.json'),mounts=await read(dir+'/mounts.json');
const license=await read('src/highfly/guildhall-p544/pack-licenses.json'),allowed=new Set(license.packs.filter(p=>p.verified&&p.license==='CC0').map(p=>p.id));
const required=new Set(plan.regions.flatMap(r=>r.props));for(const r of Object.values(recipes))for(const id of [...(r.head?.pieces??[]),...(r.hands?.r??[]),...(r.hands?.l??[])])if(id)required.add(id);
const oldMap=new Map(old.assets.map(a=>[a.id,a])),assets=[],missing=[],shards=new Map();
for(const id of [...required].sort()){
 try{
  if(!safe(id)||!allowed.has(id.split('/')[0]))throw Error('pack not authorized');
  if(!mounts.mounts[id])throw Error('no authored mount');
  if(oldMap.has(id)){assets.push(oldMap.get(id));continue}
  const pack=id.split('/')[0];
  if(!shards.has(pack)){const spec=index.packs.find(p=>p.id===pack);if(!spec)throw Error('catalog pack missing');const raw=await get('catalog/'+pack+'.json');if(hash(raw)!==spec.hash)throw Error('catalog hash');shards.set(pack,new Map(JSON.parse(raw).map(e=>[e.id,e])))}
  const e=shards.get(pack).get(id);if(!e||e.files.glb!=='pieces/'+id+'.glb')throw Error('no exact source GLB');
  let b;try{b=await get(e.files.glb+'.gz')}catch{b=await get(e.files.glb)}
  if(!glb(b)||hash(b)!==e.hash||b.length!==e.bytes)throw Error('GLB integrity');
  const dest=dir+'/props/'+id+'.glb';await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,b);
  assets.push({id,path:'../living-p580/props/'+id+'.glb',hash:e.hash,bytes:e.bytes,license:'CC0',size:e.size});
 }catch(e){missing.push({id,reason:String(e)})}
}
let rig=null;try{
 const r=index.rigs.find(r=>r.id==='rig-medium');if(!r||!safe(r.file)||!r.clips?.length)throw Error('missing rig metadata');
 let b;try{b=await get(r.file+'.gz')}catch{b=await get(r.file)}
 if(!glb(b))throw Error('invalid shared rig GLB');
 const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8')),names=new Set((j.animations??[]).map(a=>a.name));
 if(r.clips.some(c=>!names.has(c.name)))throw Error('rig clip names mismatch');
 await fs.writeFile(dir+'/rig-medium.glb',b);rig={id:r.id,clips:names.size,source:base+r.file,sha256:createHash('sha256').update(b).digest('hex'),license:'CC0',bones:r.bones};
}catch(e){console.warn('HF580_RIG_UNAVAILABLE',String(e))}
await write(dir+'/prop-audit.json',{assets,missing,rig,source:base,required:required.size,verified:assets.length});
console.log('HF580_PROP_AUDIT '+JSON.stringify({required:required.size,verified:assets.length,missing,rig}));
