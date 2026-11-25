// HIGHFLY P544: retrieve the normalized Guildhall GLBs, not raw miniature substitutes.
// Usage: node scripts/p544-import-guildhall-library.mjs --library /path/to/guildhall/library
// Or --url https://<verified-versioned-library-root> [--gzip]
// Writes an isolated directory and an audit. No changes to existing game assets.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {ASSET_REQUIREMENTS} from '../src/highfly/p544-guildhall-settlements.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2),arg=k=>args.includes(k)?args[args.indexOf(k)+1]:null;
const local=arg('--library'),remote=arg('--url'),gzip=args.includes('--gzip');
if(Boolean(local)===Boolean(remote))throw Error('Choose exactly one: --library PATH or --url HTTPS_VERSIONED_LIBRARY_ROOT');
if(remote&&new URL(remote).protocol!=='https:')throw Error('HTTPS only');
const out=resolve(arg('--out')||join(root,'public/highfly/guildhall-p544'));
const licenses=JSON.parse(await readFile(join(root,'src/highfly/guildhall-p544/pack-licenses.json'),'utf8'));
const packs=new Map(licenses.packs.map(p=>[p.id,p]));
const hash=b=>createHash('sha256').update(b).update('\0').digest('hex').slice(0,16);
const safe=p=>typeof p==='string'&&p.split('/').every(s=>/^[a-zA-Z0-9._-]+$/.test(s)&&s!=='.'&&s!=='..');
async function get(p){
 if(!safe(p))throw Error('unsafe library path');
 if(local)return readFile(join(resolve(local),p));
 const base=remote.replace(/\/$/,'')+'/';
 const r=await fetch(new URL(p,base),{signal:AbortSignal.timeout(45000)});
 if(!r.ok)throw Error('HTTP '+r.status+' '+p);
 return Buffer.from(await r.arrayBuffer());
}
async function json(p){return JSON.parse((await get(p)).toString('utf8'))}
const index=await json('catalog/index.json');
if(index.version!==1||!Array.isArray(index.packs))throw Error('invalid Guildhall catalog index');
const byPack=new Map(index.packs.map(p=>[p.id,p]));
const catalog=new Map(),failures=[];
for(const pack of [...new Set(ASSET_REQUIREMENTS.map(x=>x.split('/')[0]))]){
 try{
  if(!packs.get(pack)?.verified||!byPack.has(pack))throw Error('pack absent or license undeclared');
  const raw=await get('catalog/'+pack+'.json');
  if(hash(raw)!==byPack.get(pack).hash)throw Error('catalog shard hash mismatch');
  const entries=JSON.parse(raw.toString('utf8'));
  if(!Array.isArray(entries))throw Error('not a catalog shard');
  for(const e of entries){if(e.pack!==pack||!e.id.startsWith(pack+'/'))throw Error('invalid catalog entry');catalog.set(e.id,e)}
 }catch(e){failures.push({pack,reason:e.message})}
}
const assets=[],missing=[];
for(const id of ASSET_REQUIREMENTS){
 try{
  const e=catalog.get(id),pack=packs.get(id.split('/')[0]);
  if(!e||!pack?.verified)throw Error('exact catalog ID missing');
  const [width,height,depth]=e.size??[];
  if(![width,height,depth].every(n=>Number.isFinite(n)&&n>0))throw Error('invalid measured dimensions');
  const rel=e.files?.glb;
  if(rel!=='pieces/'+id+'.glb')throw Error('unexpected GLB path');
  let bytes=await get(rel+(gzip?'.gz':''));
  if(bytes[0]===31&&bytes[1]===139)bytes=gunzipSync(bytes);
  if(bytes.length<20||bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)throw Error('invalid GLB binary');
  if(hash(bytes)!==e.hash||bytes.length!==e.bytes)throw Error('GLB hash or length mismatch');
  const dest=join(out,rel);await mkdir(dirname(dest),{recursive:true});await writeFile(dest,bytes);
  assets.push({sourceId:id,uri:rel,width,height,depth,license:pack.license,licenseEvidence:pack.sourcePath,hash:e.hash,category:e.category,compose:e.compose,source:e.source,scaleInfo:e.scale,swatches:e.swatches,flags:e.flags});
 }catch(e){missing.push({id,reason:e.message})}
}
await mkdir(out,{recursive:true});
const audit={schema:'hf-guildhall-assets-v1',source:remote||'local normalized library',catalogImporter:index.importer,palette:index.palette,required:ASSET_REQUIREMENTS.length,verified:assets.length,missing,failures,assets,complete:missing.length===0&&failures.length===0,notice:'CC0 declarations are from upstream pack configs. Original vendor license review remains required before public distribution.'};
await writeFile(join(out,'asset-audit.json'),JSON.stringify(audit,null,2));
console.log(JSON.stringify({required:audit.required,verified:audit.verified,missing,failures},null,2));
if(!audit.complete)process.exitCode=2;
