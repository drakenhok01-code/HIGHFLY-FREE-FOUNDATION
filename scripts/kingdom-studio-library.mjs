// K0.2: reconstruct public Guildhall library from pinned immutable upstream.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const origin='https://guildhall.codestz.dev/library/ea594dd361b4/';
const root=path.resolve(process.argv[2]??'guildhall-native/library');
const hash=b=>createHash('sha256').update(b).update('\0').digest('hex').slice(0,16);
const safe=s=>typeof s==='string'&&s.split('/').every(x=>/^[A-Za-z0-9_.-]+$/.test(x)&&x!=='.'&&x!=='..');
async function get(rel,glb=false){
 if(!safe(rel))throw Error('Ruta no permitida: '+rel);
 let last;
 for(let i=0;i<3;i++)for(const ext of glb?['.gz','']:['']){
  try{const r=await fetch(new URL(rel+ext,origin),{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('HTTP '+r.status);
   let b=Buffer.from(await r.arrayBuffer());if(b[0]===31&&b[1]===139)b=gunzipSync(b);
   if(glb&&(b.toString('ascii',0,4)!=='glTF'||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length))throw Error('GLB incorrecto');
   return b;
  }catch(e){last=e}
 }
 throw Error(rel+': '+last?.message);
}
async function put(rel,b){const dest=path.join(root,rel);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,b)}
const raw=await get('catalog/index.json'),idx=JSON.parse(raw);
if(idx.version!==1||!Array.isArray(idx.packs)||!Array.isArray(idx.rigs)||idx.packs.length<18)throw Error('Catálogo público incompleto');
const allowed=new Set(['kaykit-hexagon','kaykit-forest','kaykit-builder','kaykit-resources','kaykit-tools','kaykit-furniture','kaykit-adventurers','kaykit-weapons','kaykit-skeletons','kaykit-dungeon','kaykit-halloween','kaykit-animations','kenney-nature','kenney-castle','kenney-town','kenney-graveyard','kenney-survival','kenney-pirate']);
const files=new Map(),entries=[];
for(const p of idx.packs){
 if(!allowed.has(p.id))throw Error('Pack no incluido en lista de licencias FREE: '+p.id);
 const rel='catalog/'+p.id+'.json',b=await get(rel);
 if(hash(b)!==p.hash)throw Error('Hash incorrecto '+rel);
 const shard=JSON.parse(b);if(!Array.isArray(shard)||shard.length!==p.count)throw Error('Cantidad incorrecta '+rel);
 await put(rel,b);
 for(const e of shard){if(e.pack!==p.id||!e.id.startsWith(p.id+'/'))throw Error('ID incorrecto');entries.push(e);files.set(e.files.glb,{hash:e.hash,bytes:e.bytes});if(e.files.thumb)files.set(e.files.thumb,{})}
}
for(const r of idx.rigs)files.set(r.file,{});
await put('catalog/index.json',raw);
let done=0;const queue=[...files];let cursor=0;
await Promise.all(Array.from({length:12},async()=>{while(cursor<queue.length){const [rel,expected]=queue[cursor++],b=await get(rel,rel.endsWith('.glb'));if(expected.hash&&(hash(b)!==expected.hash||b.length!==expected.bytes))throw Error('Contenido cambiado '+rel);await put(rel,b);if(++done%100===0)console.log('Biblioteca: '+done+'/'+queue.length)}}));
console.log(JSON.stringify({packs:idx.packs.length,entries:entries.length,rigs:idx.rigs.length,files:done,source:origin}));
