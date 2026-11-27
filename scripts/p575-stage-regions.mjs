// P575: stage the exact approved native Guildhall worlds into the P574 runtime.
// Preserve P574's data and all of its gameplay; new regional IDs keep the existing city IDs.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const old='dist/highfly/regions',next='dist/highfly/regions-p575';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const write=async(p,o)=>fs.writeFile(p,JSON.stringify(o));
const [index,previous,priorAudit,priorIndex]=await Promise.all([read(next+'/source-index.json'),read(old+'/placements.json'),read(old+'/asset-audit.json'),read(old+'/source-index.json')]);
const expected={1:[352,3000,10813],2:[3,8000,27835],3:[258,3000,12873],4:[67,3000,17771],5:[33,8000,23203],6:[60,3000,15652],7:[34,4000,17081],8:[16,3000,13970]};
if(index.regions.length!==8||previous.placements.length!==8||!priorAudit.complete)throw Error('Invalid source/previous build');
const placements=[],report=[],required=new Set();
for(const q of index.regions){
 const d=await read(next+'/island-'+q.seed+'.json'),e=expected[q.seed],p=previous.placements.find(v=>v.seed===q.seed);
 if(!p||!e||d.sourceSeed!==e[0]||d.files!==e[1]||d.pieces.length!==e[2]||!d.tiles.length||!d.paths.length||!d.board||!d.tiles.some(t=>t.prefab==='great-hall'))throw Error('Approved source mismatch '+JSON.stringify({seed:q.seed,source:d.sourceSeed,files:d.files,pieces:d.pieces.length,board:!!d.board,expected:e}));
 if(d.scale!==p.scale)throw Error('Source scale changed');
 const s=p.scale,apron=36,margin=6;
 const localBounds={minX:Math.min(...d.tiles.map(t=>t.x))*s-margin,maxX:Math.max(...d.tiles.map(t=>t.x))*s+margin,minZ:Math.min(...d.tiles.map(t=>t.z))*s-margin,maxZ:Math.max(...d.tiles.map(t=>t.z))*s+margin};
 const loX=p.bounds.minX-localBounds.minX+apron,hiX=p.bounds.maxX-localBounds.maxX-apron,loZ=p.bounds.minZ-localBounds.minZ+apron,hiZ=p.bounds.maxZ-localBounds.maxZ-apron;
 if(loX>hiX||loZ>hiZ)throw Error('Region does not fit reserved native footprint '+q.seed);
 const x=Math.max(loX,Math.min(hiX,p.x)),z=Math.max(loZ,Math.min(hiZ,p.z));
 const bounds={minX:x+localBounds.minX-apron,maxX:x+localBounds.maxX+apron,minZ:z+localBounds.minZ-apron,maxZ:z+localBounds.maxZ+apron};
 if(bounds.minX<1080&&bounds.maxX>-1080&&bounds.minZ<1080&&bounds.maxZ>-1080)throw Error('Protected core overlap '+q.seed);
 if(placements.some(o=>bounds.minX<o.bounds.maxX+48&&bounds.maxX>o.bounds.minX-48&&bounds.minZ<o.bounds.maxZ+48&&bounds.maxZ>o.bounds.minZ-48))throw Error('Region overlap '+q.seed);
 const placed={...p,x,z,bounds,localBounds,transition:apron,sourceSeed:d.sourceSeed,city:d.city,files:d.files,previousBounds:p.bounds};
 placements.push(placed);for(const o of d.pieces)required.add(o.piece);
 report.push({region:q.seed,city:d.city,sourceSeed:d.sourceSeed,files:d.files,pieces:d.pieces.length,previousPieces:priorIndex.regions.find(a=>a.seed===q.seed)?.stats.pieces,land:d.stats.land,buildings:d.stats.buildings,rivers:d.stats.rivers,bridges:d.stats.bridges,bounds,base:p.base,offset:Math.hypot(x-p.x,z-p.z),scale:s});
 console.log('HF575_REGION '+JSON.stringify(report.at(-1)));
}
await write(next+'/placements.json',{...previous,schema:'hf-original-guildhall-placement-v1',source:'P574 reserved native terrain footprints; approved P575 source worlds',placements,unplaced:[],notes:['Stable region IDs, source seeds recorded independently.','New bounds contained within previous native reservations.','Native terrain apron, water and road integration remain the existing P574 runtime.','No original NPC simulation imported in this data replacement.']});
const hash=b=>createHash('sha256').update(b).update('\0').digest('hex').slice(0,16);
const origin='https://guildhall.codestz.dev/library/ea594dd361b4/';
const safe=s=>typeof s==='string'&&s.split('/').every(v=>/^[a-zA-Z0-9_.-]+$/.test(v)&&v!=='.'&&v!=='..');
async function get(rel){if(!safe(rel))throw Error('Invalid asset path '+rel);let err;for(let i=0;i<4;i++){try{const r=await fetch(new URL(rel,origin),{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status+' '+rel);let b=Buffer.from(await r.arrayBuffer());if(b[0]===31&&b[1]===139)b=gunzipSync(b);return b}catch(e){err=e}}throw err}
const oldMap=new Map(priorAudit.assets.map(a=>[a.id,a])),assets=[],missing=[],catalog=new Map(),license=await read('src/highfly/guildhall-p544/pack-licenses.json');
const allowed=new Map(license.packs.filter(p=>p.verified&&p.license==='CC0').map(p=>[p.id,p]));
let catalogIndex;
for(const id of [...required].sort()){
 if(!safe(id)||!allowed.has(id.split('/')[0]))throw Error('Unapproved pack '+id);
 const a=oldMap.get(id);
 if(a){const b=await fs.readFile(old+'/'+a.path);if(hash(b)!==a.hash||b.length!==a.bytes||b.toString('ascii',0,4)!=='glTF')throw Error('P574 asset mismatch '+id);assets.push({...a,path:'../regions/'+a.path});continue}
 const pack=id.split('/')[0];
 if(!catalog.has(pack)){
  catalogIndex??=JSON.parse(await get('catalog/index.json'));
  const raw=await get('catalog/'+pack+'.json'),spec=catalogIndex.packs.find(p=>p.id===pack);
  if(!spec||hash(raw)!==spec.hash)throw Error('Catalog integrity '+pack);
  catalog.set(pack,new Map(JSON.parse(raw).map(a=>[a.id,a])));
 }
 const e=catalog.get(pack).get(id);if(!e||e.files.glb!=='pieces/'+id+'.glb')throw Error('Missing original model '+id);
 let b;try{b=await get(e.files.glb+'.gz')}catch{b=await get(e.files.glb)}
 if(hash(b)!==e.hash||b.length!==e.bytes||b.toString('ascii',0,4)!=='glTF'||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length)throw Error('Model integrity '+id);
 const dest=next+'/'+e.files.glb;await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,b);
 assets.push({id,path:e.files.glb,size:e.size,hash:e.hash,bytes:e.bytes,license:'CC0',licenseEvidence:allowed.get(pack).sourcePath,category:e.category,source:e.source});missing.push(id);
}
await write(next+'/asset-audit.json',{...priorAudit,assets,complete:true,missing:[],required:assets.length,verified:assets.length,source:origin});
await fs.copyFile(old+'/GUILDHALL-LICENSE.txt',next+'/GUILDHALL-LICENSE.txt');
await write(next+'/integration-audit.json',{ok:true,sourceCommit:index.sourceCommit,regions:report,previousPieces:report.reduce((n,r)=>n+(r.previousPieces??0),0),pieces:report.reduce((n,r)=>n+r.pieces,0),models:assets.length,newModels:missing,regionIdsPreserved:true,nativeReservationsPreserved:true});
console.log('HF575_SUMMARY '+JSON.stringify({regions:report.length,pieces:report.reduce((n,r)=>n+r.pieces,0),models:assets.length,newModels:missing.length}));
