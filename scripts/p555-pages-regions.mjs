import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root='https://highfly-unsung-full-regions-p551.vercel.app/HIGHFLY-FREE-FOUNDATION/preview-p55/highfly/regions/';
const auditRoot='https://highfly-unsung-full-regions-p555.vercel.app/HIGHFLY-FREE-FOUNDATION/preview-p55/highfly/regions/';
const out='dist/highfly/regions';fs.mkdirSync(out,{recursive:true});
async function get(url){for(let i=0;i<3;i++){try{const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('HTTP '+r.status+' '+url);return Buffer.from(await r.arrayBuffer())}catch(e){if(i===2)throw e}}}
async function save(name,base=root){const b=await get(base+name),p=path.join(out,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);return b}
const [i,p,a]=await Promise.all(['source-index.json','placements.json','asset-audit.json'].map(n=>save(n).then(b=>JSON.parse(b))));
if(i.regions.length!==8||p.placements.length!==8||a.assets.length!==272||!a.complete||a.missing.length)throw Error('Incomplete original data');
await Promise.all([save('GUILDHALL-LICENSE.txt'),save('full-audit.json',auditRoot)]);
let total=0;
for(const q of i.regions){const d=JSON.parse(await save('island-'+q.seed+'.json'));if(d.seed!==q.seed||d.pieces.length!==q.stats.pieces)throw Error('Region mismatch '+q.seed);total+=d.pieces.length}
if(total!==229525)throw Error('Piece total mismatch');
let cursor=0;await Promise.all(Array.from({length:10},async()=>{while(cursor<a.assets.length){const x=a.assets[cursor++];if(!/^pieces\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.glb$/.test(x.path))throw Error('Invalid path '+x.path);const b=await save(x.path);const h=createHash('sha256').update(b).update('\0').digest('hex').slice(0,16);if(h!==x.hash||b.length!==x.bytes||b.toString('ascii',0,4)!=='glTF')throw Error('Asset mismatch '+x.id)}}));
console.log('P555 Pages: 8 regions, '+total+' original pieces, '+a.assets.length+' verified GLBs copied locally.');
